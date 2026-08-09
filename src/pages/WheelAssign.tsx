import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wheel } from '../components/Wheel/Wheel';
import { PlayerCard } from '../components/PlayerCard/PlayerCard';
import { assignPlayerNumber } from '../services/playerService';
import { useAudio } from '../components/Audio/AudioManager';
import { gameConfig } from '../config/gameConfig';
import type { Player, Team } from '../types';

interface WheelAssignProps {
  team: Team;
  players: Player[];
  currentPlayer: Player | null;
  onRefresh: () => Promise<void>;
}

export function WheelAssign({ team, players, currentPlayer, onRefresh }: WheelAssignProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [targetNumber, setTargetNumber] = useState<number | null>(null);
  const [assignedNumber, setAssignedNumber] = useState<number | null>(
    currentPlayer?.player_number ?? null
  );
  const [error, setError] = useState<string | null>(null);
  const { playSound } = useAudio();

  // Step 1: Player clicks spin → call RPC to get number → feed to wheel
  const handleSpinRequest = useCallback(async () => {
    if (isSpinning || assignedNumber !== null) return;

    setIsSpinning(true);
    setError(null);

    try {
      // Server randomly selects an available number
      const number = await assignPlayerNumber(team.id);
      // Feed the number to the wheel so it animates to it
      setTargetNumber(number);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to assign number';
      setError(message);
      playSound('denied');
      setIsSpinning(false);
    }
  }, [team.id, isSpinning, assignedNumber, playSound]);

  // Step 2: Wheel animation finishes → reveal the result
  const handleAnimationComplete = useCallback(async () => {
    if (targetNumber !== null) {
      setAssignedNumber(targetNumber);
      playSound('granted');
      setIsSpinning(false);
      // Refresh state to get updated data from Supabase
      await onRefresh();
    }
  }, [targetNumber, onRefresh, playSound]);

  const alreadyAssigned = currentPlayer?.player_number !== null;
  const allAssigned = players.every((p) => p.player_number !== null);

  return (
    <div className="min-h-screen flex items-center justify-center relative px-4 py-8">
      <div className="cyber-grid-bg" />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-lg z-10 relative"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="font-mono text-xs tracking-[0.5em] text-neon-cyan mb-2">
            {gameConfig.clubName} // TEAM {team.team_code}
          </h2>
          <h1 className="text-2xl sm:text-3xl font-bold text-neon-green text-glow-green">
            PLAYER ASSIGNMENT
          </h1>
          <div className="h-px bg-gradient-to-r from-transparent via-neon-green/30 to-transparent mt-4" />
        </div>

        {/* Wheel or assigned state */}
        <div className="flex justify-center mb-8">
          <Wheel
            targetNumber={targetNumber}
            isSpinning={isSpinning}
            onAnimationComplete={handleAnimationComplete}
            assignedNumber={assignedNumber}
            disabled={alreadyAssigned}
            onSpinRequest={handleSpinRequest}
          />
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 p-3 rounded bg-neon-red-glow border border-neon-red/30 text-center"
            >
              <span className="font-mono text-xs text-neon-red">{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Team assignments */}
        <div className="cyber-panel p-4">
          <div className="font-mono text-xs tracking-[0.3em] text-cyber-muted mb-3 uppercase">
            Team Assignments
          </div>
          <div className="space-y-2">
            {players.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                isCurrentUser={currentPlayer?.id === player.id}
              />
            ))}
          </div>

          {/* Status */}
          <div className="mt-4 text-center font-mono text-xs tracking-wider">
            {allAssigned ? (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-neon-green"
              >
                ALL OPERATIVES ASSIGNED — MISSION STARTING...
              </motion.span>
            ) : (
              <span className="text-neon-amber">
                WAITING FOR ALL OPERATIVES TO SPIN...
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
