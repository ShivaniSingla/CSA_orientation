import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, ChevronRight } from 'lucide-react';
import { gameConfig } from '../config/gameConfig';

interface LandingProps {
  onEnter: () => void;
}

const bootLines = [
  '> INITIALIZING SECURE CONNECTION...',
  '> LOADING ENCRYPTION MODULES...',
  '> VERIFYING AUTHENTICATION PROTOCOLS...',
  '> CONNECTING TO CYBER ALLIANCE NETWORK...',
  '> ACCESS POINT ESTABLISHED',
  '> READY.',
];

export function Landing({ onEnter }: LandingProps) {
  const [bootIndex, setBootIndex] = useState(0);
  const [showMain, setShowMain] = useState(false);

  useEffect(() => {
    if (bootIndex < bootLines.length) {
      const timeout = setTimeout(() => {
        setBootIndex((prev) => prev + 1);
      }, 300 + Math.random() * 200);
      return () => clearTimeout(timeout);
    } else {
      const timeout = setTimeout(() => setShowMain(true), 400);
      return () => clearTimeout(timeout);
    }
  }, [bootIndex]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative px-4">
      {/* Grid background */}
      <div className="cyber-grid-bg" />

      {/* Boot sequence */}
      <motion.div
        className="absolute top-8 left-8 sm:top-12 sm:left-12 max-w-md"
        initial={{ opacity: 1 }}
        animate={{ opacity: showMain ? 0.15 : 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="font-mono text-xs text-neon-green/60 space-y-1">
          {bootLines.slice(0, bootIndex).map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              {line}
            </motion.div>
          ))}
          {bootIndex < bootLines.length && (
            <span className="inline-block w-2 h-4 bg-neon-green/60 animate-blink" />
          )}
        </div>
      </motion.div>

      {/* Main content */}
      {showMain && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="text-center z-10 relative"
        >
          {/* Shield icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 150 }}
            className="mb-8"
          >
            <Shield className="w-16 h-16 mx-auto text-neon-green" strokeWidth={1.5} />
          </motion.div>

          {/* Club name */}
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="font-mono text-sm sm:text-base tracking-[0.5em] text-neon-cyan mb-4"
          >
            {gameConfig.clubName}
          </motion.h2>

          {/* Game title */}
          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-5xl sm:text-7xl md:text-8xl font-bold tracking-tight mb-8"
          >
            <span className="text-neon-green text-glow-green">{gameConfig.gameName}</span>
          </motion.h1>

          {/* Decorative line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="h-px bg-gradient-to-r from-transparent via-neon-green/50 to-transparent w-64 mx-auto mb-8"
          />

          {/* Subtitle */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="font-mono text-sm sm:text-base text-cyber-muted tracking-[0.3em] mb-12 space-y-2"
          >
            <div>4 PLAYERS. 1 TEAM. 1 MISSION.</div>
          </motion.div>

          {/* Enter button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onEnter}
            className="cyber-btn cyber-btn-filled text-base sm:text-lg px-8 sm:px-12 py-3 sm:py-4 flex items-center gap-3 mx-auto group"
          >
            ENTER THE MISSION
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </motion.button>

          {/* Bottom decorative text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3 }}
            className="mt-16 font-mono text-xs text-cyber-muted/40 tracking-widest"
          >
            SECURE CHANNEL ESTABLISHED // PROTOCOL v2.1
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
