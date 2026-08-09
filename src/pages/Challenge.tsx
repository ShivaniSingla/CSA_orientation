import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Zap, Clock } from 'lucide-react';
import { Timer } from '../components/Timer/Timer';
import { getChallengesForPlayer } from '../data/challenges';
import { startChallenge, completeChallenge } from '../services/gameService';
import { useAudio } from '../components/Audio/AudioManager';
import { gameConfig } from '../config/gameConfig';
import type { Player, Team, TeamProgress } from '../types';

interface ChallengePageProps {
  team: Team;
  currentPlayer: Player;
  progress: TeamProgress[];
  onRefresh: () => Promise<void>;
  onAllComplete: () => void;
}

type FeedbackType = 'correct' | 'wrong' | 'timeout' | null;

export function ChallengePage({
  team,
  currentPlayer,
  progress,
  onRefresh,
  onAllComplete,
}: ChallengePageProps) {
  const playerNumber = currentPlayer.player_number!;
  const challenges = getChallengesForPlayer(playerNumber);
  const { playSound } = useAudio();

  // Find the current challenge index from progress
  const completedChallenges = progress.filter(
    (p) => p.player_number === playerNumber && p.completed
  );
  const currentChallengeIndex = completedChallenges.length;

  // Calculate running score from DB progress
  const currentScore = completedChallenges.reduce((sum, p) => sum + (p.score || 0), 0);

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackType>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [challengeStartedAt, setChallengeStartedAt] = useState<string | null>(null);

  // Refs to prevent stale-closure bugs and double-firing
  const answeredRef = useRef(false);       // Has this question been answered/timed out?
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const challenge = currentChallengeIndex < challenges.length
    ? challenges[currentChallengeIndex]
    : null;

  // Reset ALL state when currentChallengeIndex changes (new question)
  useEffect(() => {
    setSelectedAnswer(null);
    setFeedback(null);
    setIsSubmitting(false);
    setChallengeStartedAt(null);
    answeredRef.current = false;

    // Clean up any pending advance timer
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
  }, [currentChallengeIndex]);

  // Start challenge on server and set the timer start time.
  // IMPORTANT: Do NOT include `progress` in deps — we only want this
  // to run once per challenge change, not every time progress refreshes.
  useEffect(() => {
    if (!challenge) return;

    let cancelled = false;

    const startChal = async () => {
      try {
        await startChallenge(team.id, challenge.challengeIndex);
      } catch {
        // Ignore — may already be started (idempotent)
      }
      if (!cancelled) {
        // Use current time as fallback. The server `started_at` is authoritative
        // but for the first render we use local time — close enough.
        setChallengeStartedAt(new Date().toISOString());
      }
    };

    startChal();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChallengeIndex, team.id]);

  // Check if all challenges are done
  useEffect(() => {
    if (currentChallengeIndex >= gameConfig.challengesPerPlayer) {
      onAllComplete();
    }
  }, [currentChallengeIndex, onAllComplete]);

  // Core function: record score and schedule advance to next question
  const recordAndAdvance = useCallback(
    async (
      feedbackType: FeedbackType,
      score: number
    ) => {
      // Guard: only one answer per question
      if (answeredRef.current || !challenge) return;
      answeredRef.current = true;

      setFeedback(feedbackType);
      setIsSubmitting(true);

      // Play appropriate sound
      if (feedbackType === 'correct') playSound('granted');
      else if (feedbackType === 'timeout') playSound('warning');
      else playSound('denied');

      // Save to Supabase
      try {
        await completeChallenge(team.id, challenge.challengeIndex, score);
      } catch (err) {
        console.error('Failed to save challenge result:', err);
      }

      // After feedback duration, refresh state which will increment currentChallengeIndex
      advanceTimerRef.current = setTimeout(async () => {
        await onRefresh();
        // After refresh, the new progress will change currentChallengeIndex,
        // which triggers the reset effect above. We do NOT manually clear
        // state here — the reset effect handles it cleanly.
      }, gameConfig.feedbackDuration);
    },
    [challenge, team.id, playSound, onRefresh]
  );

  const handleAnswer = useCallback(
    (answer: string) => {
      if (!challenge || answeredRef.current || feedback) return;

      setSelectedAnswer(answer);
      const isCorrect = answer === challenge.answer;
      recordAndAdvance(isCorrect ? 'correct' : 'wrong', isCorrect ? 1 : 0);
    },
    [challenge, feedback, recordAndAdvance]
  );

  const handleTimeUp = useCallback(() => {
    recordAndAdvance('timeout', 0);
  }, [recordAndAdvance]);

  if (!challenge) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-neon-green/30 border-t-neon-green rounded-full animate-spin mx-auto mb-4" />
          <div className="font-mono text-sm text-cyber-muted">PROCESSING...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative px-4 py-8">
      <div className="cyber-grid-bg" />

      <motion.div
        key={challenge.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl z-10 relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="font-mono text-xs tracking-[0.3em] text-neon-cyan mb-1">
              PLAYER {playerNumber} // TEAM {team.team_code}
            </div>
            <div className="font-mono text-xs text-cyber-muted">
              MISSION {String(currentChallengeIndex + 1).padStart(2, '0')}/{String(gameConfig.challengesPerPlayer).padStart(2, '0')}
              <span className="ml-3 text-neon-green">
                SCORE: {currentScore}/{currentChallengeIndex}
              </span>
            </div>
          </div>

          {/* Progress dots */}
          <div className="flex gap-2">
            {challenges.map((c, i) => {
              const prog = completedChallenges.find(p => p.challenge_index === c.challengeIndex);
              return (
                <div
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full ${
                    prog && prog.score > 0
                      ? 'bg-neon-green shadow-[0_0_6px_rgba(0,255,136,0.5)]'
                      : prog
                      ? 'bg-neon-red shadow-[0_0_6px_rgba(255,51,85,0.5)]'
                      : i === currentChallengeIndex
                      ? 'bg-neon-cyan animate-pulse-green'
                      : 'bg-cyber-border'
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* Timer */}
        <div className="mb-6">
          <Timer
            timeLimit={challenge.timeLimit}
            startedAt={challengeStartedAt}
            onTimeUp={handleTimeUp}
            isActive={!feedback}
          />
        </div>

        {/* Question Panel */}
        <div className="cyber-panel-glow p-8 md:p-10 mb-8 md:mb-12 bg-cyber-darker rounded-xl border border-cyber-border">
          {/* Challenge type tag */}
          <div className="flex items-center gap-2 mb-6 opacity-80">
            <Zap className="w-4 h-4 text-neon-cyan" />
            <span className="font-mono text-sm tracking-[0.3em] text-neon-cyan uppercase">
              {challenge.type}
            </span>
          </div>

          {/* Question Text */}
          <div className="font-mono text-lg md:text-2xl text-gray-100 leading-relaxed whitespace-pre-line">
            {challenge.question}
          </div>
        </div>

        {/* Answer Options */}
        {challenge.options && (
          <div className="space-y-4 md:space-y-5 mb-10 w-full">
            {challenge.options.map((option, i) => {
              const letter = String.fromCharCode(65 + i);
              const isSelected = selectedAnswer === option;
              const isCorrect = feedback === 'correct' && isSelected;
              const isWrong = feedback === 'wrong' && isSelected;

              return (
                <motion.button
                  key={option}
                  whileHover={!feedback ? { scale: 1.01 } : {}}
                  whileTap={!feedback ? { scale: 0.99 } : {}}
                  onClick={() => handleAnswer(option)}
                  disabled={!!feedback || isSubmitting || answeredRef.current}
                  className={`group w-full flex items-center text-left p-4 md:px-6 md:py-5 rounded-lg border font-mono text-sm md:text-base transition-all duration-300 cursor-pointer min-h-[72px] ${
                    isCorrect
                      ? 'border-neon-green bg-neon-green/10 text-neon-green shadow-[0_0_15px_rgba(0,255,136,0.3)]'
                      : isWrong
                      ? 'border-neon-red bg-neon-red/10 text-neon-red shadow-[0_0_15px_rgba(255,51,85,0.3)]'
                      : isSelected
                      ? 'border-neon-cyan bg-neon-cyan/20 text-neon-cyan shadow-[0_0_15px_rgba(0,229,255,0.2)]'
                      : 'border-cyber-border bg-cyber-darker/80 text-gray-300 hover:border-neon-green/40 hover:bg-cyber-panel hover:shadow-[0_0_12px_rgba(0,255,136,0.1)]'
                  } disabled:cursor-default`}
                >
                  {/* Option Label Box */}
                  <div className={`flex flex-shrink-0 items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded border mr-4 md:mr-6 transition-colors duration-300 ${
                    isCorrect 
                      ? 'border-neon-green text-neon-green bg-neon-green/10' 
                    : isWrong 
                      ? 'border-neon-red text-neon-red bg-neon-red/10'
                    : isSelected 
                      ? 'border-neon-cyan text-neon-cyan bg-neon-cyan/10'
                    : 'border-cyber-border text-cyber-muted bg-cyber-black group-hover:border-neon-green/50 group-hover:text-neon-green'
                  }`}>
                    <span className="font-bold text-lg md:text-xl leading-none">{letter}</span>
                  </div>

                  {/* Option Text */}
                  <span className="leading-relaxed flex-1">
                    {option}
                  </span>
                </motion.button>
              );
            })}
          </div>
        )}

        {/* Feedback overlay */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="text-center"
              >
                {feedback === 'correct' ? (
                  <>
                    <CheckCircle className="w-16 h-16 text-neon-green mx-auto mb-4" />
                    <div className="text-2xl font-bold text-neon-green text-glow-green font-mono">
                      ACCESS GRANTED
                    </div>
                    <div className="font-mono text-lg text-neon-green/80 mt-2">
                      +1 POINT
                    </div>
                    <div className="font-mono text-sm text-cyber-muted mt-2">
                      NEXT CHALLENGE...
                    </div>
                  </>
                ) : feedback === 'timeout' ? (
                  <>
                    <Clock className="w-16 h-16 text-neon-amber mx-auto mb-4" />
                    <div className="text-2xl font-bold text-neon-amber font-mono">
                      TIME EXPIRED
                    </div>
                    <div className="font-mono text-lg text-neon-amber/80 mt-2">
                      +0 POINTS
                    </div>
                    <div className="font-mono text-sm text-cyber-muted mt-2">
                      NEXT CHALLENGE...
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle className="w-16 h-16 text-neon-red mx-auto mb-4" />
                    <div className="text-2xl font-bold text-neon-red text-glow-red font-mono">
                      ACCESS DENIED
                    </div>
                    <div className="font-mono text-lg text-neon-red/80 mt-2">
                      +0 POINTS
                    </div>
                    <div className="font-mono text-sm text-cyber-muted mt-2">
                      NEXT CHALLENGE...
                    </div>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
