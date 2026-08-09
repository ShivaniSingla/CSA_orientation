import { motion } from 'framer-motion';
import { Lock, Clock } from 'lucide-react';
import { gameConfig } from '../config/gameConfig';
import type { Player, Team } from '../types';

interface WaitingProps {
  team: Team;
  players: Player[];
  currentPlayer: Player | null;
}

export function Waiting({ team, players, currentPlayer }: WaitingProps) {
  const activePlayer = players.find(
    (p) => p.player_number === team.current_player_number
  );

  return (
    <div className="min-h-screen flex items-center justify-center relative px-4">
      <div className="cyber-grid-bg" />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-md z-10 relative text-center"
      >
        {/* Lock icon */}
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          className="mb-8"
        >
          <div className="w-20 h-20 mx-auto rounded-full border-2 border-neon-amber/40 bg-neon-amber-glow flex items-center justify-center">
            <Lock className="w-8 h-8 text-neon-amber" />
          </div>
        </motion.div>

        {/* Header */}
        <h2 className="font-mono text-xs tracking-[0.5em] text-neon-cyan mb-3">
          {gameConfig.clubName} // TEAM {team.team_code}
        </h2>

        <h1 className="text-2xl sm:text-3xl font-bold text-neon-amber mb-4">
          ACCESS LOCKED
        </h1>

        <div className="h-px bg-gradient-to-r from-transparent via-neon-amber/30 to-transparent mb-8" />

        {/* Active player info */}
        <div className="cyber-panel p-6 mb-6">
          <div className="font-mono text-sm text-cyber-muted mb-2">
            CURRENTLY ACTIVE
          </div>
          <div className="text-2xl font-bold text-neon-green text-glow-green font-mono mb-1">
            PLAYER {team.current_player_number}
          </div>
          {activePlayer && (
            <div className="font-mono text-sm text-neon-cyan">
              {activePlayer.player_name}
            </div>
          )}
        </div>

        {/* Your info */}
        {currentPlayer && (
          <div className="cyber-panel p-4 mb-6">
            <div className="font-mono text-xs text-cyber-muted mb-1">YOUR POSITION</div>
            <div className="font-mono text-lg text-neon-cyan">
              PLAYER {currentPlayer.player_number}
            </div>
          </div>
        )}

        {/* Waiting message */}
        <div className="flex items-center justify-center gap-2 text-cyber-muted">
          <Clock className="w-4 h-4 animate-pulse-green" />
          <span className="font-mono text-sm tracking-wider">
            STAND BY FOR YOUR TURN...
          </span>
        </div>

        {/* Subtle progress */}
        <div className="mt-8 font-mono text-xs text-cyber-muted/30 tracking-wider">
          YOUR MISSION WILL BEGIN AUTOMATICALLY
        </div>
      </motion.div>
    </div>
  );
}
