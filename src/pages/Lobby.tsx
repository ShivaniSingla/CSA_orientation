import { motion } from 'framer-motion';
import { Users, Zap } from 'lucide-react';
import { gameConfig } from '../config/gameConfig';
import { PlayerCard } from '../components/PlayerCard/PlayerCard';
import type { Player, Team } from '../types';

interface LobbyProps {
  team: Team;
  players: Player[];
  currentPlayer: Player | null;
  onBeginMission: () => void;
}

export function Lobby({ team, players, currentPlayer, onBeginMission }: LobbyProps) {
  const playerCount = players.length;
  const isReady = playerCount >= gameConfig.minPlayers;
  const isMaxPlayers = playerCount >= gameConfig.maxPlayers;

  return (
    <div className="min-h-screen flex items-center justify-center relative px-4 py-8">
      <div className="cyber-grid-bg" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg z-10 relative"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="font-mono text-xs tracking-[0.5em] text-neon-cyan mb-2">
            {gameConfig.clubName}
          </h2>
          <h1 className="text-2xl sm:text-3xl font-bold text-neon-green text-glow-green mb-1">
            TEAM {team.team_code}
          </h1>
          <div className="h-px bg-gradient-to-r from-transparent via-neon-green/30 to-transparent mt-4" />
        </div>

        {/* Player list panel */}
        <div className="cyber-panel-glow p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-neon-cyan" />
            <span className="font-mono text-xs tracking-[0.3em] text-cyber-muted uppercase">
              Operatives
            </span>
          </div>

          <div className="space-y-3">
            {players.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                isCurrentUser={currentPlayer?.id === player.id}
              />
            ))}

            {/* Empty slots */}
            {Array.from({ length: gameConfig.maxPlayers - playerCount }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="flex items-center justify-center p-3 rounded border border-dashed border-cyber-border/40 bg-cyber-darker/30"
              >
                <span className="font-mono text-xs text-cyber-muted/40 tracking-wider">
                  WAITING FOR OPERATIVE...
                </span>
              </div>
            ))}
          </div>

          {/* Player count */}
          <div className="mt-4 text-center">
            <span className={`font-mono text-sm tracking-wider ${
              isReady ? 'text-neon-green' : 'text-neon-amber'
            }`}>
              {playerCount}/{gameConfig.maxPlayers} OPERATIVES{' '}
              {isReady ? 'READY' : 'NEEDED'}
            </span>
          </div>
        </div>

        {/* Begin mission button */}
        {isReady && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <button
              onClick={onBeginMission}
              className="cyber-btn cyber-btn-filled text-lg px-10 py-4 flex items-center gap-3 mx-auto"
            >
              <Zap className="w-5 h-5" />
              BEGIN MISSION
            </button>
            {!isMaxPlayers && (
              <div className="mt-3 font-mono text-xs text-cyber-muted/60 tracking-wider">
                You can also wait for more operatives
              </div>
            )}
          </motion.div>
        )}

        {/* Waiting message */}
        {!isReady && (
          <div className="text-center">
            <div className="font-mono text-xs text-cyber-muted tracking-wider">
              Minimum {gameConfig.minPlayers} operatives required to begin mission
            </div>
            <div className="mt-3 flex justify-center">
              <div className="w-5 h-5 border-2 border-neon-green/30 border-t-neon-green rounded-full animate-spin" />
            </div>
          </div>
        )}

        {/* Team code hint */}
        <div className="text-center mt-8 font-mono text-xs text-cyber-muted/30 tracking-wider">
          SHARE CODE <span className="text-neon-green/40">{team.team_code}</span> WITH YOUR TEAM
        </div>
      </motion.div>
    </div>
  );
}
