import { useState, useEffect, useCallback } from 'react';
import { getTeamById } from '../services/teamService';
import { getTeamPlayers, getCurrentPlayer } from '../services/playerService';
import { getTeamProgress } from '../services/gameService';
import { useRealtime } from './useRealtime';
import type { Team, Player, TeamProgress, GamePhase } from '../types';
import { gameConfig } from '../config/gameConfig';

interface UseGameStateReturn {
  team: Team | null;
  players: Player[];
  currentPlayer: Player | null;
  progress: TeamProgress[];
  phase: GamePhase;
  isLoading: boolean;
  error: string | null;
  refreshState: () => Promise<void>;
}

/**
 * Main game state hook that aggregates team, player, and progress data.
 * Subscribes to real-time updates filtered by team_id.
 */
export function useGameState(teamId: string | null): UseGameStateReturn {
  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [progress, setProgress] = useState<TeamProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Derive game phase from database state
  const phase: GamePhase = derivePhase(team, currentPlayer, players, progress);

  const refreshState = useCallback(async () => {
    if (!teamId) return;

    try {
      const [teamData, playersData, playerData, progressData] = await Promise.all([
        getTeamById(teamId),
        getTeamPlayers(teamId),
        getCurrentPlayer(),
        getTeamProgress(teamId),
      ]);

      setTeam(teamData);
      setPlayers(playersData);
      setCurrentPlayer(playerData);
      setProgress(progressData);
      setError(null);
    } catch (err) {
      console.error('Failed to refresh game state:', err);
      setError(err instanceof Error ? err.message : 'Failed to load game state');
    } finally {
      setIsLoading(false);
    }
  }, [teamId]);

  // Initial load
  useEffect(() => {
    if (teamId) {
      refreshState();
    } else {
      setIsLoading(false);
    }
  }, [teamId, refreshState]);

  // Real-time subscription for team changes
  useRealtime(
    { table: 'teams', filter: `id=eq.${teamId}`, enabled: !!teamId },
    () => { refreshState(); }
  );

  // Real-time subscription for player changes
  useRealtime(
    { table: 'players', filter: `team_id=eq.${teamId}`, enabled: !!teamId },
    () => { refreshState(); }
  );

  // Real-time subscription for progress changes
  useRealtime(
    { table: 'team_progress', filter: `team_id=eq.${teamId}`, enabled: !!teamId },
    () => { refreshState(); }
  );

  return {
    team,
    players,
    currentPlayer,
    progress,
    phase,
    isLoading,
    error,
    refreshState,
  };
}

/**
 * Derive the current game phase from Supabase state.
 * Supabase is the source of truth — this is a pure function.
 */
function derivePhase(
  team: Team | null,
  currentPlayer: Player | null,
  players: Player[],
  progress: TeamProgress[]
): GamePhase {
  if (!team || !currentPlayer) return 'lobby';

  // Team completed
  if (team.status === 'completed') return 'complete';

  // Still in lobby / waiting for players
  if (team.status === 'waiting') return 'lobby';

  // Assigning player numbers (wheel phase)
  if (team.status === 'assigning') {
    if (currentPlayer.player_number === null) return 'wheel';
    // Player has number but team is still assigning — wait for others
    return 'wheel';
  }

  // Game is active
  if (team.status === 'active') {
    // Is this player the active player?
    if (currentPlayer.player_number === team.current_player_number) {
      // Check if all challenges completed
      const myProgress = progress.filter(
        (p) => p.player_number === currentPlayer.player_number && p.completed
      );
      if (myProgress.length >= gameConfig.challengesPerPlayer) {
        return 'flag'; // Show access code / completion
      }
      return 'challenge';
    }

    // Not the active player — check if they need to enter a code
    if (
      currentPlayer.player_number !== null &&
      currentPlayer.status === 'waiting' &&
      team.current_player_number !== null &&
      team.current_player_number === currentPlayer.player_number - 1
    ) {
      // Previous player completed, this player needs to enter code
      const prevCompleted = players.find(
        (p) => p.player_number === currentPlayer.player_number! - 1 && p.status === 'completed'
      );
      if (prevCompleted) {
        return 'flag';
      }
    }

    return 'waiting';
  }

  return 'lobby';
}
