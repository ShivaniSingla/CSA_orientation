// ============================================================
// CYBER ALLIANCE — THE BREACH
// Type Definitions
// ============================================================

// --- Challenge Types ---

export type ChallengeType =
  | 'logic'
  | 'pattern'
  | 'observation'
  | 'decision'
  | 'speed'
  | 'memory';

export interface Challenge {
  id: string;
  playerNumber: number;
  challengeIndex: number;
  type: ChallengeType;
  title: string;
  question: string;
  options?: string[];
  answer: string;
  timeLimit: number; // seconds
  explanation?: string;
}

// --- Database Row Types ---

export type TeamStatus = 'waiting' | 'assigning' | 'active' | 'completed';
export type PlayerStatus = 'joined' | 'waiting' | 'active' | 'completed';

export interface Team {
  id: string;
  team_code: string;
  status: TeamStatus;
  current_player_number: number | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface Player {
  id: string;
  team_id: string;
  user_id: string;
  player_name: string;
  player_number: number | null;
  status: PlayerStatus;
  created_at: string;
  last_seen_at: string;
}

export interface TeamProgress {
  id: string;
  team_id: string;
  player_number: number;
  challenge_index: number;
  completed: boolean;
  score: number;
  access_code: string | null;
  started_at: string | null;
  completed_at: string | null;
}

// --- App State Types ---

export type GamePhase =
  | 'landing'
  | 'join'
  | 'lobby'
  | 'wheel'
  | 'waiting'
  | 'challenge'
  | 'flag'
  | 'complete'
  | 'admin';

export interface GameState {
  team: Team | null;
  players: Player[];
  currentPlayer: Player | null;
  progress: TeamProgress[];
  phase: GamePhase;
  isConnected: boolean;
}
