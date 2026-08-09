import { supabase } from '../lib/supabase';
import type { Player } from '../types';

/**
 * Join a team via the secure RPC.
 * The RPC handles team creation, player creation, and returning-player detection.
 */
export async function joinTeam(
  teamCode: string,
  playerName: string
): Promise<{
  team_id: string;
  player_id: string;
  player_number: number | null;
  status: string;
  returning: boolean;
}> {
  const { data, error } = await supabase.rpc('join_team', {
    p_team_code: teamCode,
    p_player_name: playerName,
  });

  if (error) throw error;
  return data;
}

/**
 * Get all players for a specific team.
 */
export async function getTeamPlayers(teamId: string): Promise<Player[]> {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('team_id', teamId)
    .order('player_number', { ascending: true, nullsFirst: false });

  if (error) throw error;
  return data || [];
}

/**
 * Assign a player number via the atomic RPC.
 * Returns the assigned player number.
 */
export async function assignPlayerNumber(teamId: string): Promise<number> {
  const { data, error } = await supabase.rpc('assign_player_number', {
    p_team_id: teamId,
  });

  if (error) throw error;
  return data;
}

/**
 * Update player's last_seen_at timestamp (heartbeat).
 */
export async function updatePlayerHeartbeat(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('players')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('user_id', user.id);
}

/**
 * Get the current player for this browser session.
 */
export async function getCurrentPlayer(): Promise<Player | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) throw error;
  return data;
}
