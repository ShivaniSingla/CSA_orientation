// ============================================================
// CYBER ALLIANCE — THE BREACH
// Central Game Configuration
//
// Change these values to customize the game for your event.
// ============================================================

export const gameConfig = {
  // --- Branding ---
  gameName: 'THE BREACH',
  clubName: 'CYBER ALLIANCE',

  // --- Player Limits ---
  // Minimum number of players required to start a game
  minPlayers: 3,
  // Maximum number of players allowed per team
  maxPlayers: 4,

  // --- Challenge Settings ---
  // Number of challenges each player must complete
  challengesPerPlayer: 4,
  // Default time limit per challenge (seconds)
  defaultTimeLimit: 30,
  // Allow players to retry incorrect answers
  allowRetry: false,
  // Maximum retry attempts per challenge (0 = unlimited if allowRetry is true)
  maxRetries: 0,

  // --- Access Codes ---
  // Length of generated access codes (characters)
  accessCodeLength: 6,

  // --- UI Settings ---
  // Duration of the wheel spin animation (ms)
  wheelSpinDuration: 3000,
  // Duration of "Access Granted" / "Access Denied" messages (ms)
  feedbackDuration: 1500,
  // Timer warning threshold (seconds remaining before visual warning)
  timerWarningThreshold: 10,

  // --- Team Code Format ---
  // Prefix for team codes
  teamCodePrefix: 'CA-',
} as const;

export type GameConfig = typeof gameConfig;
