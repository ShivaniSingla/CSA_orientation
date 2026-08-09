# CYBER ALLIANCE — THE BREACH

A **real-time multiplayer web game** for the Cybersecurity Alliance Club orientation.

4 players. 1 team. 1 mission.

Students don't need cybersecurity knowledge — they're tested on **critical thinking, logic, pattern recognition, observation, decision making, and communication** under time pressure.

## Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Styling:** Tailwind CSS v4
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Audio:** Howler.js (optional, off by default)
- **Backend:** Supabase (Auth, PostgreSQL, Realtime, RLS, RPC)
- **Deployment:** Vercel

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the entire contents of `supabase/schema.sql`
3. Enable **Anonymous Auth**:
   - Go to **Authentication** → **Providers**
   - Enable **Anonymous** sign-in
4. Enable **Realtime** for tables:
   - Go to **Database** → **Replication**
   - Enable realtime for: `teams`, `players`, `team_progress`
5. Copy your **Project URL** and **anon (public) key** from **Settings** → **API**

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Run locally

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

## Supabase Setup Details

### Database Schema

Run `supabase/schema.sql` in the SQL Editor. This creates:

| Table | Purpose |
|---|---|
| `teams` | Team records (code, status, current player) |
| `players` | Player records (name, number, auth identity) |
| `team_progress` | Challenge completion and access codes |
| `admin_users` | Organizer admin access |

### RLS Policies

Row Level Security is configured so:
- Players can only read/write data for their own team
- Players can only update their own player record
- Admin users can read all data
- Security-sensitive operations go through SECURITY DEFINER RPCs

### RPC Functions

| Function | Purpose |
|---|---|
| `join_team(code, name)` | Join/create a team safely |
| `assign_player_number(team_id)` | Atomic wheel assignment |
| `start_challenge(team_id, index)` | Record challenge start |
| `complete_challenge(team_id, index)` | Verified challenge completion |
| `generate_access_code(team_id)` | Idempotent code generation |
| `validate_access_code(team_id, code)` | Validate & advance player |
| `check_admin()` | Verify admin status |

### Admin Account Setup

1. Go to **Authentication** → **Users** in Supabase dashboard
2. Click **Add User** → **Create New User**
3. Enter email (e.g., `admin@cyberalliance.local`) and a strong password
4. Copy the user's **UUID**
5. Run in SQL Editor:

```sql
INSERT INTO public.admin_users (user_id)
VALUES ('paste-your-admin-user-uuid-here');
```

6. Navigate to `/admin` and log in with the email/password

### Anonymous Auth

**Important:** Anonymous Auth must be enabled in your Supabase project.

- Go to **Authentication** → **Providers** → **Anonymous**
- Toggle it **ON**

Each player's browser will automatically sign in anonymously when they open the game. This gives each device a unique Supabase Auth identity used for RLS.

## Editing Questions

Open `src/data/challenges.ts` to modify the challenges.

Each challenge has:

```ts
{
  id: 'p1-c0',           // unique identifier
  playerNumber: 1,        // which player gets this (1-4)
  challengeIndex: 0,      // order within that player's set (0-3)
  type: 'logic',          // logic, pattern, observation, decision, speed, memory
  title: 'LOGIC GATE',    // display title
  question: '...',         // the question text
  options: ['A', 'B', 'C', 'D'],  // multiple choice options
  answer: 'B',            // must exactly match one option
  timeLimit: 30,           // seconds
  explanation: '...',      // shown after correct answer (optional)
}
```

**Important:** If you change `challengesPerPlayer`, also update `src/config/gameConfig.ts` AND the `v_challenges_per_player` variable in the `generate_access_code` and `validate_access_code` RPCs in `supabase/schema.sql`.

## Editing Game Rules

Open `src/config/gameConfig.ts`:

```ts
export const gameConfig = {
  minPlayers: 3,          // minimum players to start
  maxPlayers: 4,          // maximum players per team
  challengesPerPlayer: 4, // challenges each player gets
  defaultTimeLimit: 30,   // seconds per challenge
  allowRetry: true,       // allow retrying wrong answers
  // ...
};
```

## Vercel Deployment

1. Push the project to GitHub
2. Go to [vercel.com](https://vercel.com) → **Import** your repository
3. Set **Framework Preset** to Vite
4. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy

### Post-Deployment

After deploying:
1. Copy your Vercel deployment URL
2. In Supabase, go to **Authentication** → **URL Configuration**
3. Add your Vercel URL to the **Site URL** and **Redirect URLs**

## Game Flow

```
LANDING PAGE
    ↓
JOIN (name + team code)
    ↓
LOBBY (wait for teammates)
    ↓
WHEEL SPIN (unique player assignments)
    ↓
PLAYER 1 → CHALLENGES → ACCESS CODE → communicate to →
PLAYER 2 → enters code → CHALLENGES → ACCESS CODE → communicate to →
PLAYER 3 → enters code → CHALLENGES → ACCESS CODE → communicate to →
PLAYER 4 → enters code → CHALLENGES → MISSION COMPLETE
    ↓
"You were tested on how you think."
    ↓
WELCOME TO CYBER ALLIANCE
```

## Architecture

```
                 VERCEL
           React + TypeScript
                  │
                  ▼
          Supabase Client
                  │
        ┌─────────┴──────────┐
        │                    │
   Supabase Auth        PostgreSQL
        │                    │
 Anonymous Players       Game State
 Admin Account           RLS + RPC
                             │
                          Realtime
                             │
               ┌─────────────┼─────────────┐
               ▼             ▼             ▼
            CA-001        CA-002        CA-003
```

## Security Notes

- **No service-role key** in the frontend — only the anon/public key
- **RLS policies** protect all data access
- **SECURITY DEFINER RPCs** handle sensitive operations (code generation, validation, player assignment)
- **Anonymous Auth** provides identity without requiring passwords from players
- **Admin access** uses a dedicated Supabase Auth account verified against the `admin_users` table
- **Team isolation** — each team's data is completely separated via RLS and filtered Realtime subscriptions

## Testing Checklist

### Team 1 (CA-001)
- [ ] Open 4 browser windows/devices
- [ ] All join with team code CA-001
- [ ] Verify all 4 players appear in the lobby
- [ ] Begin mission → spin wheel → verify unique numbers
- [ ] Player 1 becomes active, others are locked
- [ ] Player 1 completes challenges → gets access code
- [ ] Player 2 enters the code → unlocks → completes challenges
- [ ] Continue through Player 3 and 4
- [ ] Verify mission complete screen

### Team 2 (CA-002) — simultaneous
- [ ] Open 3 more browser windows
- [ ] Join with team code CA-002
- [ ] Verify CA-002 works independently
- [ ] Verify CA-001 receives NO CA-002 updates
- [ ] Verify CA-002 receives NO CA-001 updates

### Recovery
- [ ] Refresh a browser mid-game → verify state recovers
- [ ] Close and reopen a browser → verify state recovers

## License

Internal project for the Cybersecurity Alliance Club orientation event.
