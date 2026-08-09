-- ============================================================
-- CYBER ALLIANCE — THE BREACH
-- Supabase Database Schema
--
-- HOW TO USE:
-- 1. Create a new Supabase project at https://supabase.com
-- 2. Go to SQL Editor
-- 3. Paste this entire file and run it
-- 4. Enable Anonymous Auth: Authentication > Providers > Anonymous
-- 5. Enable Realtime for tables: Database > Replication > enable for
--    teams, players, team_progress
-- ============================================================

-- Enable required extensions
create extension if not exists "pgcrypto";

-- ============================================================
-- TABLES
-- ============================================================

-- Teams table
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  team_code text unique not null,
  status text not null default 'waiting'
    check (status in ('waiting', 'assigning', 'active', 'completed')),
  current_player_number int,
  created_at timestamptz default now(),
  started_at timestamptz,
  completed_at timestamptz
);

-- Players table
-- user_id references the Supabase Auth anonymous user
-- player_number is NULL until wheel assignment
create table public.players (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  player_name text not null,
  player_number int,
  status text not null default 'joined'
    check (status in ('joined', 'waiting', 'active', 'completed')),
  created_at timestamptz default now(),
  last_seen_at timestamptz default now(),
  -- One anonymous identity = one player
  constraint players_user_id_unique unique (user_id),
  -- One player number per team (nulls are allowed / ignored by unique)
  constraint players_team_number_unique unique (team_id, player_number)
);

-- Team progress table (challenge completion per player)
create table public.team_progress (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  player_number int not null,
  challenge_index int not null,
  completed boolean not null default false,
  score int not null default 0,
  access_code text,
  started_at timestamptz default now(),
  completed_at timestamptz,
  -- One row per player per challenge
  constraint progress_unique unique (team_id, player_number, challenge_index)
);

-- Admin users table
-- Insert the Supabase Auth user_id of each organizer
create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.teams enable row level security;
alter table public.players enable row level security;
alter table public.team_progress enable row level security;
alter table public.admin_users enable row level security;

-- --- teams policies ---

-- Players can read the team they belong to
create policy "team_read_member" on public.teams
  for select using (
    id = public.get_my_team_id()
  );

-- Admin can read all teams
create policy "team_read_admin" on public.teams
  for select using (
    exists (
      select 1 from public.admin_users
      where admin_users.user_id = auth.uid()
    )
  );

-- Any authenticated user can insert a team (for creating new teams on join)
create policy "team_insert" on public.teams
  for insert with check (auth.uid() is not null);

-- Teams are updated only through RPCs (SECURITY DEFINER)
-- but we need a basic update policy for the RPCs that run as INVOKER
-- For safety, restrict team updates to admins or via RPC
create policy "team_update_rpc" on public.teams
  for update using (false);

-- --- players policies ---

-- Essential: Players can always read their own record (prevents circular lookup failures)
create policy "players_read_self" on public.players
  for select using (user_id = auth.uid());

-- Players can read all players in their team (needed for lobby)
create policy "players_read_team" on public.players
  for select using (
    team_id = public.get_my_team_id()
  );

-- Admin can read all players
create policy "players_read_admin" on public.players
  for select using (
    exists (
      select 1 from public.admin_users
      where admin_users.user_id = auth.uid()
    )
  );

-- Players can insert their own record (user_id must match auth.uid())
create policy "players_insert_self" on public.players
  for insert with check (user_id = auth.uid());

-- Players can update only their own record
create policy "players_update_self" on public.players
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- --- team_progress policies ---

-- Players can read progress for their own team
create policy "progress_read_team" on public.team_progress
  for select using (
    team_id = public.get_my_team_id()
  );

-- Admin can read all progress
create policy "progress_read_admin" on public.team_progress
  for select using (
    exists (
      select 1 from public.admin_users
      where admin_users.user_id = auth.uid()
    )
  );

-- Players can insert progress only for their own player_number in their team
create policy "progress_insert_self" on public.team_progress
  for insert with check (
    exists (
      select 1 from public.players
      where players.team_id = team_progress.team_id
        and players.player_number = team_progress.player_number
        and players.user_id = auth.uid()
    )
  );

-- Players can update progress only for their own player_number
create policy "progress_update_self" on public.team_progress
  for update using (
    exists (
      select 1 from public.players
      where players.team_id = team_progress.team_id
        and players.player_number = team_progress.player_number
        and players.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.players
      where players.team_id = team_progress.team_id
        and players.player_number = team_progress.player_number
        and players.user_id = auth.uid()
    )
  );

-- --- admin_users policies ---

-- Admin users can read their own row (for self-check)
create policy "admin_self_check" on public.admin_users
  for select using (user_id = auth.uid());

-- ============================================================
-- RPC FUNCTIONS
-- ============================================================

-- -----------------------------------------------------------
-- get_my_team_id: Optimized helper to get player's team ID
-- Prevents RLS infinite recursion
-- -----------------------------------------------------------
create or replace function public.get_my_team_id()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team_id uuid;
begin
  select team_id into v_team_id from public.players where user_id = auth.uid() limit 1;
  return v_team_id;
end;
$$;

-- -----------------------------------------------------------
-- join_team: Find or create a team, create or recover player
-- Uses SECURITY DEFINER to bypass RLS for team creation/update
-- -----------------------------------------------------------
create or replace function public.join_team(
  p_team_code text,
  p_player_name text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_team_id uuid;
  v_team_status text;
  v_player_count int;
  v_existing_player public.players;
  v_new_player public.players;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Check if this user already has a player record
  select * into v_existing_player
  from public.players
  where user_id = v_user_id;

  if v_existing_player is not null then
    -- Returning player: update last_seen and return existing state
    update public.players
    set last_seen_at = now(), player_name = p_player_name
    where id = v_existing_player.id;

    return jsonb_build_object(
      'team_id', v_existing_player.team_id,
      'player_id', v_existing_player.id,
      'player_number', v_existing_player.player_number,
      'status', v_existing_player.status,
      'returning', true
    );
  end if;

  -- Find or create team
  select id, status into v_team_id, v_team_status
  from public.teams
  where team_code = upper(trim(p_team_code));

  if v_team_id is null then
    -- Create new team
    insert into public.teams (team_code, status)
    values (upper(trim(p_team_code)), 'waiting')
    returning id into v_team_id;
    v_team_status := 'waiting';
  end if;

  -- Check if team is still accepting players
  if v_team_status not in ('waiting', 'assigning') then
    raise exception 'Team is no longer accepting players (status: %)', v_team_status;
  end if;

  -- Check player count
  select count(*) into v_player_count
  from public.players
  where team_id = v_team_id;

  if v_player_count >= 4 then
    raise exception 'Team is full (maximum 4 players)';
  end if;

  -- Create new player
  insert into public.players (team_id, user_id, player_name, status)
  values (v_team_id, v_user_id, p_player_name, 'joined')
  returning * into v_new_player;

  return jsonb_build_object(
    'team_id', v_new_player.team_id,
    'player_id', v_new_player.id,
    'player_number', v_new_player.player_number,
    'status', v_new_player.status,
    'returning', false
  );
end;
$$;

-- -----------------------------------------------------------
-- assign_player_number: Atomically assigns next free number
-- Also auto-starts the game if all required players are assigned
-- Uses auth.uid() internally — never trusts client-supplied user_id
-- -----------------------------------------------------------
create or replace function public.assign_player_number(p_team_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_player public.players;
  v_next_num int;
  v_total_players int;
  v_assigned_count int;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Lock the players rows for this team to prevent race conditions
  perform 1 from public.players
  where team_id = p_team_id
  for update;

  -- Verify authenticated user belongs to this team
  select * into v_player
  from public.players
  where team_id = p_team_id and user_id = v_user_id;

  if v_player is null then
    raise exception 'You are not a member of this team';
  end if;

  -- Check if already assigned
  if v_player.player_number is not null then
    return v_player.player_number;
  end if;

  -- Pick a RANDOM available number from 1-4
  select num into v_next_num
  from generate_series(1, 4) as num
  where not exists (
    select 1 from public.players
    where team_id = p_team_id and player_number = num
  )
  order by random()
  limit 1;

  if v_next_num is null then
    raise exception 'All player numbers have been assigned';
  end if;

  -- Assign the number
  update public.players
  set player_number = v_next_num, status = 'waiting'
  where id = v_player.id;

  -- Update team status to 'assigning' if not already
  update public.teams
  set status = 'assigning'
  where id = p_team_id and status = 'waiting';

  -- Check if all players now have numbers
  select count(*) into v_total_players
  from public.players where team_id = p_team_id;

  select count(*) into v_assigned_count
  from public.players where team_id = p_team_id and player_number is not null;

  -- Auto-start game when minimum players are assigned
  -- (minPlayers = 3; we start when ALL joined players have numbers)
  if v_assigned_count = v_total_players and v_total_players >= 3 then
    -- Set team to active, current player = 1
    update public.teams
    set status = 'active',
        current_player_number = 1,
        started_at = now()
    where id = p_team_id;

    -- Set player 1 to active, others to waiting
    update public.players
    set status = 'active'
    where team_id = p_team_id and player_number = 1;

    update public.players
    set status = 'waiting'
    where team_id = p_team_id and player_number != 1 and player_number is not null;
  end if;

  return v_next_num;
end;
$$;

-- -----------------------------------------------------------
-- start_challenge: Record that a player started a challenge
-- Verifies the player is the active player
-- -----------------------------------------------------------
create or replace function public.start_challenge(
  p_team_id uuid,
  p_challenge_index int
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_player public.players;
  v_team public.teams;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Get player
  select * into v_player
  from public.players
  where team_id = p_team_id and user_id = v_user_id;

  if v_player is null then
    raise exception 'You are not a member of this team';
  end if;

  -- Get team
  select * into v_team
  from public.teams
  where id = p_team_id;

  -- Verify this player is active
  if v_team.current_player_number != v_player.player_number then
    raise exception 'You are not the active player';
  end if;

  -- Insert progress row (or do nothing if it already exists)
  insert into public.team_progress (team_id, player_number, challenge_index, started_at)
  values (p_team_id, v_player.player_number, p_challenge_index, now())
  on conflict (team_id, player_number, challenge_index) do nothing;

  return true;
end;
$$;

-- -----------------------------------------------------------
-- complete_challenge: Mark a challenge as completed
-- Verifies everything server-side
-- -----------------------------------------------------------
create or replace function public.complete_challenge(
  p_team_id uuid,
  p_challenge_index int,
  p_score int default 0  -- 0 = wrong/timeout, 1 = correct
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_player public.players;
  v_team public.teams;
  v_existing public.team_progress;
  v_clamped_score int;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Clamp score to 0 or 1 (server authority)
  v_clamped_score := greatest(0, least(1, coalesce(p_score, 0)));

  -- Get player
  select * into v_player
  from public.players
  where team_id = p_team_id and user_id = v_user_id;

  if v_player is null then
    raise exception 'You are not a member of this team';
  end if;

  if v_player.player_number is null then
    raise exception 'You do not have a player number assigned';
  end if;

  -- Get team
  select * into v_team
  from public.teams where id = p_team_id;

  -- Verify this player is the active player
  if v_team.status != 'active' then
    raise exception 'Game is not active';
  end if;

  if v_team.current_player_number != v_player.player_number then
    raise exception 'You are not the active player';
  end if;

  -- Check if challenge already completed
  select * into v_existing
  from public.team_progress
  where team_id = p_team_id
    and player_number = v_player.player_number
    and challenge_index = p_challenge_index;

  if v_existing is not null and v_existing.completed = true then
    return true; -- Already completed, idempotent
  end if;

  -- Upsert progress with score
  insert into public.team_progress (team_id, player_number, challenge_index, completed, score, completed_at)
  values (p_team_id, v_player.player_number, p_challenge_index, true, v_clamped_score, now())
  on conflict (team_id, player_number, challenge_index)
  do update set completed = true, score = v_clamped_score, completed_at = now();

  return true;
end;
$$;

-- -----------------------------------------------------------
-- generate_access_code: Create access code after completing all challenges
-- Idempotent: returns existing code if already generated
-- -----------------------------------------------------------
create or replace function public.generate_access_code(p_team_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_player public.players;
  v_team public.teams;
  v_completed_count int;
  v_challenges_per_player int := 4; -- must match gameConfig.challengesPerPlayer
  v_existing_code text;
  v_new_code text;
  v_max_player int;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Get player
  select * into v_player
  from public.players
  where team_id = p_team_id and user_id = v_user_id;

  if v_player is null then
    raise exception 'You are not a member of this team';
  end if;

  -- Get team
  select * into v_team
  from public.teams where id = p_team_id;

  -- Verify this player is the active player
  if v_team.current_player_number != v_player.player_number then
    raise exception 'You are not the active player';
  end if;

  -- Verify all challenges completed
  select count(*) into v_completed_count
  from public.team_progress
  where team_id = p_team_id
    and player_number = v_player.player_number
    and completed = true;

  if v_completed_count < v_challenges_per_player then
    raise exception 'Not all challenges completed (% of %)', v_completed_count, v_challenges_per_player;
  end if;

  -- Lock the row for update to prevent concurrent race conditions
  select access_code into v_existing_code
  from public.team_progress
  where team_id = p_team_id
    and player_number = v_player.player_number
    and challenge_index = v_challenges_per_player - 1
  for update;

  if v_existing_code is not null then
    -- Mark player as completed
    update public.players
    set status = 'completed'
    where id = v_player.id;

    return v_existing_code;
  end if;

  -- Generate a new 6-character access code
  v_new_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

  -- Store the access code on the last challenge row
  update public.team_progress
  set access_code = v_new_code
  where team_id = p_team_id
    and player_number = v_player.player_number
    and challenge_index = v_challenges_per_player - 1;

  -- Mark player as completed
  update public.players
  set status = 'completed'
  where id = v_player.id;

  -- Check if this is the LAST player (no next player to unlock)
  select max(player_number) into v_max_player
  from public.players
  where team_id = p_team_id and player_number is not null;

  if v_player.player_number = v_max_player then
    -- Final player completed — mark team as completed
    update public.teams
    set status = 'completed', completed_at = now()
    where id = p_team_id;
  end if;

  return v_new_code;
end;
$$;

-- -----------------------------------------------------------
-- validate_access_code: Verify code and advance current player
-- Scoped to the team — CA-001 code cannot unlock CA-002
-- -----------------------------------------------------------
create or replace function public.validate_access_code(
  p_team_id uuid,
  p_code text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_player public.players;
  v_team public.teams;
  v_expected_code text;
  v_prev_player_number int;
  v_challenges_per_player int := 4;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Get player
  select * into v_player
  from public.players
  where team_id = p_team_id and user_id = v_user_id;

  if v_player is null then
    raise exception 'You are not a member of this team';
  end if;

  if v_player.player_number is null then
    raise exception 'You do not have a player number';
  end if;

  -- Get team
  select * into v_team
  from public.teams where id = p_team_id;

  -- The previous player number
  v_prev_player_number := v_player.player_number - 1;

  -- Verify the team is waiting for this player
  -- current_player_number should equal the previous player's number
  -- (meaning the previous player just finished and the team hasn't advanced yet)
  if v_team.current_player_number != v_prev_player_number then
    raise exception 'It is not your turn to enter an access code';
  end if;

  -- Get the expected access code from the previous player's last challenge
  select access_code into v_expected_code
  from public.team_progress
  where team_id = p_team_id
    and player_number = v_prev_player_number
    and challenge_index = v_challenges_per_player - 1
    and access_code is not null;

  if v_expected_code is null then
    raise exception 'No access code found for the previous player';
  end if;

  -- Compare codes (case insensitive)
  if upper(trim(p_code)) != upper(trim(v_expected_code)) then
    return false;
  end if;

  -- Atomically advance the active player
  update public.teams
  set current_player_number = v_player.player_number
  where id = p_team_id;

  -- Set this player as active
  update public.players
  set status = 'active'
  where id = v_player.id;

  return true;
end;
$$;

-- -----------------------------------------------------------
-- check_admin: Verify if the current user is an admin
-- -----------------------------------------------------------
create or replace function public.check_admin()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return exists (
    select 1 from public.admin_users
    where user_id = auth.uid()
  );
end;
$$;

-- ============================================================
-- ENABLE REALTIME
-- Run these after creating the tables
-- ============================================================

alter publication supabase_realtime add table public.teams;
alter publication supabase_realtime add table public.players;
alter publication supabase_realtime add table public.team_progress;

-- ============================================================
-- ADMIN SETUP
-- After running this schema, create an admin user:
--
-- 1. Go to Authentication > Users in Supabase dashboard
-- 2. Create a new user with email/password (e.g., admin@cyberalliance.local)
-- 3. Copy the user's UUID
-- 4. Run:
--    INSERT INTO public.admin_users (user_id) VALUES ('paste-uuid-here');
-- ============================================================
