import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { useGameState } from './hooks/useGameState';
import { joinTeam } from './services/playerService';
import { getCurrentPlayer } from './services/playerService';
import { getTeamById } from './services/teamService';
import { AudioProvider, AudioToggle } from './components/Audio/AudioManager';
import { ConnectionStatus } from './components/ConnectionStatus/ConnectionStatus';
import { CyberGridBackground } from './components/Background/CyberGridBackground';

// Pages
import { Landing } from './pages/Landing';
import { Join } from './pages/Join';
import { Lobby } from './pages/Lobby';
import { WheelAssign } from './pages/WheelAssign';
import { Waiting } from './pages/Waiting';
import { ChallengePage } from './pages/Challenge';
import { FlagPage } from './pages/Flag';
import { Complete } from './pages/Complete';
import { Admin } from './pages/Admin';

import type { GamePhase } from './types';

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const [teamId, setTeamId] = useState<string | null>(null);
  const [localPhase, setLocalPhase] = useState<GamePhase>('landing');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  const { team, players, currentPlayer, progress, phase, isLoading, error, refreshState } =
    useGameState(teamId);

  // Check for admin route
  const isAdminRoute = window.location.pathname === '/admin';

  // Recover state on mount / refresh
  useEffect(() => {
    if (!user || authLoading) return;

    const recover = async () => {
      try {
        const existingPlayer = await getCurrentPlayer();
        if (existingPlayer) {
          setTeamId(existingPlayer.team_id);
          // Skip landing and join — we have a team
          const team = await getTeamById(existingPlayer.team_id);
          if (team) {
            setLocalPhase(
              team.status === 'waiting'
                ? 'lobby'
                : team.status === 'assigning'
                  ? 'wheel'
                  : 'challenge'
            );
          }
        }
      } catch {
        // No existing player — stay on landing
      }
    };

    if (!isAdminRoute) {
      recover();
    }
  }, [user, authLoading, isAdminRoute]);

  // Sync local phase with derived game phase once we have team data
  useEffect(() => {
    if (teamId && !isLoading && team) {
      // Override local phase with Supabase-derived phase once data is available
      if (phase !== 'lobby' || team.status !== 'waiting') {
        // Only override if we have meaningful data
      }
    }
  }, [teamId, isLoading, team, phase]);

  const handleEnterMission = useCallback(() => {
    setLocalPhase('join');
  }, []);

  const handleJoin = useCallback(
    async (playerName: string, teamCode: string) => {
      if (!user) {
        setJoinError('Authentication not ready. Please wait...');
        return;
      }

      setIsJoining(true);
      setJoinError(null);

      try {
        const result = await joinTeam(teamCode, playerName);
        setTeamId(result.team_id);
        setLocalPhase('lobby');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to join team';
        setJoinError(msg);
      } finally {
        setIsJoining(false);
      }
    },
    [user]
  );

  const handleBeginMission = useCallback(() => {
    setLocalPhase('wheel');
    // The team status transition happens in Supabase when all players spin
  }, []);

  const handleAllChallengesComplete = useCallback(() => {
    // This is called when the active player finishes all challenges
    // The Flag page will generate the access code
    refreshState();
  }, [refreshState]);

  // Admin route
  if (isAdminRoute) {
    return <Admin />;
  }

  // Loading states
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cyber-black">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-neon-green/30 border-t-neon-green rounded-full animate-spin mx-auto mb-4" />
          <div className="font-mono text-sm text-cyber-muted">INITIALIZING SECURE SESSION...</div>
        </div>
      </div>
    );
  }

  // Determine what to show (allow local 'wheel' transition before DB updates)
  const effectivePhase = teamId && !isLoading && team
    ? (localPhase === 'wheel' && phase === 'lobby' ? 'wheel' : phase)
    : localPhase;

  // Game state errors
  if (teamId && error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-cyber-black px-4 text-center">
        <div className="text-neon-red font-bold text-xl mb-4 font-mono">CONNECTION ERROR</div>
        <div className="text-cyber-muted font-mono text-sm mb-6 max-w-md">{error}</div>
        <button onClick={() => window.location.reload()} className="cyber-btn cyber-btn-danger">
          REBOOT SYSTEM
        </button>
      </div>
    );
  }

  // Fallback initial load
  if (teamId && (isLoading || !team || !currentPlayer) && effectivePhase !== 'landing' && effectivePhase !== 'join') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cyber-black">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-neon-green/30 border-t-neon-green rounded-full animate-spin mx-auto mb-4" />
          <div className="font-mono text-sm text-cyber-muted">LOADING MISSION DATA...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <CyberGridBackground />
      {/* Scanline overlay */}
      <div className="scanline-overlay" />

      {/* Connection status */}
      {teamId && <ConnectionStatus />}

      {/* Audio toggle */}
      <AudioToggle />

      {/* Main content */}
      {effectivePhase === 'landing' && <Landing onEnter={handleEnterMission} />}

      {effectivePhase === 'join' && (
        <Join onJoin={handleJoin} isLoading={isJoining} error={joinError} />
      )}

      {effectivePhase === 'lobby' && team && currentPlayer && (
        <Lobby
          team={team}
          players={players}
          currentPlayer={currentPlayer}
          onBeginMission={handleBeginMission}
        />
      )}

      {effectivePhase === 'wheel' && team && currentPlayer && (
        <WheelAssign
          team={team}
          players={players}
          currentPlayer={currentPlayer}
          onRefresh={refreshState}
        />
      )}

      {effectivePhase === 'waiting' && team && currentPlayer && (
        <Waiting team={team} players={players} currentPlayer={currentPlayer} />
      )}

      {effectivePhase === 'challenge' && team && currentPlayer && (
        <ChallengePage
          team={team}
          currentPlayer={currentPlayer}
          progress={progress}
          onRefresh={refreshState}
          onAllComplete={handleAllChallengesComplete}
        />
      )}

      {effectivePhase === 'flag' && team && currentPlayer && (
        <FlagPage
          team={team}
          currentPlayer={currentPlayer}
          players={players}
          onRefresh={refreshState}
        />
      )}

      {effectivePhase === 'complete' && team && <Complete team={team} players={players} progress={progress} />}


    </>
  );
}

function App() {
  return (
    <AudioProvider>
      <AppContent />
    </AudioProvider>
  );
}

export default App;
