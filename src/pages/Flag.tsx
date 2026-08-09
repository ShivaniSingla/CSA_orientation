import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, ArrowRight, CheckCircle, XCircle, Lock } from 'lucide-react';
import { generateAccessCode, validateAccessCode } from '../services/gameService';
import { useAudio } from '../components/Audio/AudioManager';
import { gameConfig } from '../config/gameConfig';
import type { Player, Team } from '../types';

interface FlagPageProps {
  team: Team;
  currentPlayer: Player;
  players: Player[];
  onRefresh: () => Promise<void>;
}

export function FlagPage({ team, currentPlayer, players, onRefresh }: FlagPageProps) {
  const playerNumber = currentPlayer.player_number!;
  const isActivePlayer = team.current_player_number === playerNumber;
  const prevPlayerCompleted = currentPlayer.status === 'waiting' &&
    team.current_player_number === playerNumber - 1;

  // If this player just completed all challenges → show access code
  // If this player needs to enter a code → show input
  const [accessCode, setAccessCode] = useState<string | null>(null);
  const [inputCode, setInputCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validated, setValidated] = useState(false);
  const { playSound } = useAudio();

  // Find max player number in this team
  const maxPlayerNumber = Math.max(
    ...players.filter((p) => p.player_number !== null).map((p) => p.player_number!)
  );

  const generateRequested = useRef(false);

  // Generate access code for the active player who completed all challenges
  useEffect(() => {
    if (isActivePlayer && !accessCode && !generateRequested.current) {
      generateRequested.current = true;
      const generate = async () => {
        try {
          const code = await generateAccessCode(team.id);
          setAccessCode(code);
          console.log("Displaying access code:", code);
          playSound('complete');
        } catch (err) {
          console.error('Failed to generate access code:', err);
          setError(err instanceof Error ? err.message : 'Failed to generate code');
          generateRequested.current = false;
        }
      };
      generate();
    }
  }, [isActivePlayer, accessCode, team.id, playSound]);

  const handleValidate = useCallback(async () => {
    if (!inputCode.trim()) return;
    setIsLoading(true);
    setError(null);

    try {
      const result = await validateAccessCode(team.id, inputCode.trim());
      if (result) {
        setValidated(true);
        playSound('granted');
        await onRefresh();
      } else {
        setError('INVALID ACCESS CODE');
        playSound('denied');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Validation failed');
      playSound('denied');
    } finally {
      setIsLoading(false);
    }
  }, [inputCode, team.id, onRefresh, playSound]);

  // Active player showing their code
  if (isActivePlayer && currentPlayer.status !== 'waiting') {
    const isLastPlayer = playerNumber === maxPlayerNumber;

    return (
      <div className="min-h-screen flex items-center justify-center relative px-4">
        <div className="cyber-grid-bg" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md z-10 relative text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="mb-8"
          >
            <CheckCircle className="w-16 h-16 text-neon-green mx-auto" />
          </motion.div>

          <h1 className="text-2xl sm:text-3xl font-bold text-neon-green text-glow-green font-mono mb-2">
            MISSION COMPLETE
          </h1>
          <div className="font-mono text-sm text-cyber-muted mb-8">
            PLAYER {playerNumber}
          </div>

          {!isLastPlayer && accessCode && (
            <>
              <div className="cyber-panel-glow p-6 mb-6">
                <div className="font-mono text-xs tracking-[0.3em] text-cyber-muted mb-4 uppercase">
                  Access Code
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-4xl sm:text-5xl font-bold font-mono text-neon-cyan text-glow-cyan tracking-[0.2em]"
                >
                  {accessCode}
                </motion.div>
              </div>

              <div className="cyber-panel p-4">
                <div className="font-mono text-sm text-neon-amber">
                  GIVE THIS CODE TO PLAYER {playerNumber + 1}
                </div>
                <div className="font-mono text-xs text-cyber-muted mt-2">
                  Communicate it verbally — do not show your screen
                </div>
              </div>
            </>
          )}

          {isLastPlayer && (
            <div className="font-mono text-sm text-neon-green">
              FINALIZING MISSION...
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 rounded bg-neon-red-glow border border-neon-red/30">
              <span className="font-mono text-xs text-neon-red">{error}</span>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  // Next player entering the code
  if (prevPlayerCompleted || (currentPlayer.status === 'waiting' && playerNumber > 1)) {
    const prevPlayer = players.find((p) => p.player_number === playerNumber - 1);

    return (
      <div className="min-h-screen flex items-center justify-center relative px-4">
        <div className="cyber-grid-bg" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md z-10 relative text-center"
        >
          <div className="mb-8">
            <Lock className="w-12 h-12 text-neon-cyan mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-neon-cyan font-mono mb-2">
              PLAYER {playerNumber}
            </h1>
            {prevPlayer && (
              <div className="font-mono text-sm text-neon-green">
                {prevPlayer.player_name} has completed their mission
              </div>
            )}
          </div>

          <AnimatePresence>
            {validated ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <CheckCircle className="w-16 h-16 text-neon-green mx-auto mb-4" />
                <div className="text-2xl font-bold text-neon-green text-glow-green font-mono">
                  ACCESS GRANTED
                </div>
                <div className="font-mono text-sm text-cyber-muted mt-2">
                  YOUR MISSION IS BEGINNING...
                </div>
              </motion.div>
            ) : (
              <motion.div layout>
                <div className="cyber-panel-glow p-6 mb-6">
                  <div className="font-mono text-xs tracking-[0.3em] text-cyber-muted mb-4 uppercase">
                    Enter the Access Code
                  </div>

                  <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                    placeholder="ENTER CODE"
                    className="cyber-input text-center text-2xl tracking-[0.3em] mb-4"
                    maxLength={10}
                    autoFocus
                  />

                  <button
                    onClick={handleValidate}
                    disabled={isLoading || !inputCode.trim()}
                    className="cyber-btn cyber-btn-filled flex items-center gap-2 mx-auto"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-neon-green/30 border-t-neon-green rounded-full animate-spin" />
                        VALIDATING...
                      </>
                    ) : (
                      <>
                        <Key className="w-4 h-4" />
                        UNLOCK
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-center gap-2 p-3 rounded bg-neon-red-glow border border-neon-red/30"
                  >
                    <XCircle className="w-4 h-4 text-neon-red" />
                    <span className="font-mono text-xs text-neon-red">{error}</span>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    );
  }

  // Default waiting state
  return (
    <div className="min-h-screen flex items-center justify-center relative px-4">
      <div className="cyber-grid-bg" />
      <div className="text-center z-10">
        <Lock className="w-12 h-12 text-neon-amber mx-auto mb-4" />
        <div className="font-mono text-lg text-neon-amber mb-2">STAND BY</div>
        <div className="font-mono text-sm text-cyber-muted">
          Waiting for mission update...
        </div>
      </div>
    </div>
  );
}
