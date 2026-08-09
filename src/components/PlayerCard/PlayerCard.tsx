import { motion } from 'framer-motion';
import type { Player } from '../../types';

interface PlayerCardProps {
  player: Player;
  isCurrentUser?: boolean;
  isActive?: boolean;
}

export function PlayerCard({ player, isCurrentUser, isActive }: PlayerCardProps) {
  const statusConfig = {
    joined: { color: 'text-neon-cyan', dot: 'bg-neon-cyan', label: 'CONNECTED' },
    waiting: { color: 'text-neon-amber', dot: 'bg-amber-400', label: 'STANDING BY' },
    active: { color: 'text-neon-green', dot: 'bg-neon-green', label: 'ACTIVE' },
    completed: { color: 'text-neon-green', dot: 'bg-neon-green', label: 'COMPLETED' },
  };

  const config = statusConfig[player.status] || statusConfig.joined;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-center justify-between p-3 rounded border ${
        isActive
          ? 'border-neon-green/40 bg-neon-green-glow'
          : isCurrentUser
          ? 'border-neon-cyan/30 bg-neon-cyan-glow'
          : 'border-cyber-border bg-cyber-darker'
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Player number badge */}
        <div
          className={`w-8 h-8 rounded flex items-center justify-center font-mono text-sm font-bold ${
            player.player_number
              ? 'bg-cyber-panel border border-neon-green/30 text-neon-green'
              : 'bg-cyber-panel border border-cyber-border text-cyber-muted'
          }`}
        >
          {player.player_number ?? '?'}
        </div>

        {/* Player name */}
        <div>
          <div className={`font-mono text-sm font-semibold tracking-wider uppercase ${
            isCurrentUser ? 'text-neon-cyan' : 'text-gray-200'
          }`}>
            {player.player_name}
            {isCurrentUser && (
              <span className="ml-2 text-xs text-neon-cyan/60">(YOU)</span>
            )}
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${config.dot} ${
          player.status === 'active' ? 'animate-pulse-green' : ''
        }`} />
        <span className={`font-mono text-xs tracking-wider ${config.color}`}>
          {config.label}
        </span>
      </div>
    </motion.div>
  );
}
