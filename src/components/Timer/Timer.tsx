import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gameConfig } from '../../config/gameConfig';

interface TimerProps {
  /** Total time in seconds for this challenge */
  timeLimit: number;
  /** ISO timestamp when the challenge started (from DB) */
  startedAt: string | null;
  /** Called when time runs out */
  onTimeUp?: () => void;
  /** Whether the timer is active */
  isActive?: boolean;
}

export function Timer({ timeLimit, startedAt, onTimeUp, isActive = true }: TimerProps) {
  const [remaining, setRemaining] = useState(timeLimit);

  const calculateRemaining = useCallback(() => {
    if (!startedAt) return timeLimit;
    const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
    return Math.max(0, timeLimit - elapsed);
  }, [startedAt, timeLimit]);

  useEffect(() => {
    if (!isActive || !startedAt) {
      setRemaining(timeLimit);
      return;
    }

    // Calculate initial remaining time
    setRemaining(calculateRemaining());

    const interval = setInterval(() => {
      const newRemaining = calculateRemaining();
      setRemaining(newRemaining);

      if (newRemaining <= 0) {
        clearInterval(interval);
        onTimeUp?.();
      }
    }, 100); // Update frequently for smooth display

    return () => clearInterval(interval);
  }, [isActive, startedAt, calculateRemaining, onTimeUp, timeLimit]);

  const isWarning = remaining <= gameConfig.timerWarningThreshold;
  const isCritical = remaining <= 5;
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  return (
    <div className="text-center">
      <div className="font-mono text-xs tracking-[0.3em] text-cyber-muted mb-2 uppercase">
        Time Remaining
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={remaining}
          initial={{ scale: isCritical ? 1.1 : 1 }}
          animate={{ scale: 1 }}
          className={`font-mono text-4xl font-bold tracking-wider ${
            isCritical
              ? 'text-neon-red text-glow-red'
              : isWarning
              ? 'text-neon-amber'
              : 'text-neon-green text-glow-green'
          }`}
        >
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </motion.div>
      </AnimatePresence>
      {isWarning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2"
        >
          <div
            className="h-1 rounded-full bg-cyber-darker overflow-hidden"
          >
            <motion.div
              className={`h-full rounded-full ${isCritical ? 'bg-neon-red' : 'bg-neon-amber'}`}
              style={{ width: `${(remaining / timeLimit) * 100}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
        </motion.div>
      )}
    </div>
  );
}
