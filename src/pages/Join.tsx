import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Hash, ArrowRight, AlertTriangle } from 'lucide-react';
import { gameConfig } from '../config/gameConfig';

interface JoinProps {
  onJoin: (playerName: string, teamCode: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function Join({ onJoin, isLoading, error }: JoinProps) {
  const [playerName, setPlayerName] = useState('');
  const [teamCode, setTeamCode] = useState<string>(gameConfig.teamCodePrefix);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || !teamCode.trim()) return;
    await onJoin(playerName.trim(), teamCode.trim());
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative px-4">
      <div className="cyber-grid-bg" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md z-10 relative"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="font-mono text-xs tracking-[0.5em] text-neon-cyan mb-3">
            {gameConfig.clubName}
          </h2>
          <h1 className="text-3xl sm:text-4xl font-bold text-neon-green text-glow-green mb-2">
            JOIN MISSION
          </h1>
          <div className="h-px bg-gradient-to-r from-transparent via-neon-green/30 to-transparent" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="cyber-panel-glow p-6 sm:p-8 space-y-6">
          {/* Operative Name */}
          <div>
            <label className="flex items-center gap-2 font-mono text-xs tracking-[0.2em] text-cyber-muted mb-3 uppercase">
              <User className="w-3.5 h-3.5" />
              Operative Name
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              className="cyber-input"
              maxLength={20}
              required
              autoFocus
            />
          </div>

          {/* Team Code */}
          <div>
            <label className="flex items-center gap-2 font-mono text-xs tracking-[0.2em] text-cyber-muted mb-3 uppercase">
              <Hash className="w-3.5 h-3.5" />
              Team Code
            </label>
            <input
              type="text"
              value={teamCode}
              onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
              placeholder="CA-001"
              className="cyber-input"
              maxLength={10}
              required
            />
            <div className="font-mono text-xs text-cyber-muted/60 mt-2">
              Ask your team leader for the code
            </div>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2 p-3 rounded bg-neon-red-glow border border-neon-red/30"
            >
              <AlertTriangle className="w-4 h-4 text-neon-red shrink-0 mt-0.5" />
              <span className="font-mono text-xs text-neon-red">{error}</span>
            </motion.div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading || !playerName.trim() || !teamCode.trim()}
            className="cyber-btn cyber-btn-filled w-full flex items-center justify-center gap-3"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-neon-green/30 border-t-neon-green rounded-full animate-spin" />
                CONNECTING...
              </>
            ) : (
              <>
                JOIN MISSION
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Bottom hint */}
        <div className="text-center mt-6 font-mono text-xs text-cyber-muted/40 tracking-wider">
          ENCRYPTED SESSION // TEAM-ISOLATED CHANNEL
        </div>
      </motion.div>
    </div>
  );
}
