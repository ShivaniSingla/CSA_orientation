import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAudio } from '../Audio/AudioManager';

interface WheelProps {
  /** The number the wheel must land on (set by server) */
  targetNumber: number | null;
  /** Whether the wheel is currently spinning */
  isSpinning: boolean;
  /** Called when the spin animation finishes */
  onAnimationComplete: () => void;
  /** The already-assigned number (shown post-spin) */
  assignedNumber: number | null;
  /** Whether the spin button is disabled */
  disabled?: boolean;
  /** Called when the user clicks spin */
  onSpinRequest: () => void;
}

const SEGMENTS = [1, 2, 3, 4];
const COLORS = [
  'rgba(0, 255, 136, 0.8)',  // green
  'rgba(0, 229, 255, 0.8)',  // cyan
  'rgba(255, 170, 0, 0.8)',  // amber
  'rgba(255, 51, 85, 0.8)',  // red
];

/**
 * Calculate the rotation degrees to land on a specific segment.
 * Pointer is at 12 o'clock (top). Segments are 90° each.
 * Segment 1: 0°–90° (center 45°), Segment 2: 90°–180° (center 135°),
 * Segment 3: 180°–270° (center 225°), Segment 4: 270°–360° (center 315°).
 * 
 * For the pointer at top to point at segment N, the wheel needs to rotate
 * so that segment N's center is at the top. Since the wheel rotates clockwise,
 * we need: rotation = full_spins * 360 + (360 - segmentCenterDeg)
 */
function calculateTargetRotation(targetNum: number, currentRotation: number): number {
  // Each segment is 90°, segment center offsets from 0°
  const segmentCenter = (targetNum - 1) * 90 + 45;
  // We want the pointer (at 0°) to point at this segment
  // The wheel must rotate so this segment ends up at the top
  const stopAngle = 360 - segmentCenter;
  // Add enough full rotations to make it look impressive (5-8 full spins)
  const fullSpins = 5 + Math.floor(Math.random() * 3);
  const totalRotation = fullSpins * 360 + stopAngle;
  // Add a small random jitter within the segment (±30° max to stay in segment)
  const jitter = (Math.random() - 0.5) * 30;
  return currentRotation + totalRotation + jitter;
}

export function Wheel({
  targetNumber,
  isSpinning,
  onAnimationComplete,
  assignedNumber,
  disabled,
  onSpinRequest,
}: WheelProps) {
  const [rotation, setRotation] = useState(0);
  const { playSound } = useAudio();

  // When we get a target number and we're spinning, set the final rotation
  useEffect(() => {
    if (targetNumber !== null && isSpinning) {
      const targetRotation = calculateTargetRotation(targetNumber, rotation);
      setRotation(targetRotation);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetNumber, isSpinning]);

  const handleSpin = useCallback(() => {
    if (isSpinning || disabled || assignedNumber !== null) return;
    playSound('blip');
    onSpinRequest();
  }, [isSpinning, disabled, assignedNumber, onSpinRequest, playSound]);

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Wheel container */}
      <div className="relative w-64 h-64 sm:w-72 sm:h-72">
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
          <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-neon-green drop-shadow-[0_0_8px_rgba(0,255,136,0.6)]" />
        </div>

        {/* Spinning wheel */}
        <motion.div
          className="w-full h-full rounded-full border-2 border-neon-green/30 overflow-hidden relative"
          animate={{ rotate: rotation }}
          transition={{
            duration: 3.5,
            ease: [0.15, 0.6, 0.15, 1],
          }}
          onAnimationComplete={() => {
            if (isSpinning && targetNumber !== null) {
              onAnimationComplete();
            }
          }}
          style={{ boxShadow: '0 0 30px rgba(0, 255, 136, 0.15)' }}
        >
          <svg viewBox="0 0 200 200" className="w-full h-full">
            {SEGMENTS.map((num, i) => {
              const startAngle = (i * 360) / 4;
              const endAngle = ((i + 1) * 360) / 4;
              const startRad = ((startAngle - 90) * Math.PI) / 180;
              const endRad = ((endAngle - 90) * Math.PI) / 180;

              const x1 = 100 + 95 * Math.cos(startRad);
              const y1 = 100 + 95 * Math.sin(startRad);
              const x2 = 100 + 95 * Math.cos(endRad);
              const y2 = 100 + 95 * Math.sin(endRad);

              const midRad = (((startAngle + endAngle) / 2 - 90) * Math.PI) / 180;
              const textX = 100 + 60 * Math.cos(midRad);
              const textY = 100 + 60 * Math.sin(midRad);

              return (
                <g key={num}>
                  <path
                    d={`M100,100 L${x1},${y1} A95,95 0 0,1 ${x2},${y2} Z`}
                    fill={COLORS[i]}
                    stroke="rgba(0,0,0,0.5)"
                    strokeWidth="1"
                    opacity="0.3"
                  />
                  <text
                    x={textX}
                    y={textY}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#fff"
                    fontSize="28"
                    fontWeight="bold"
                    fontFamily="'JetBrains Mono', monospace"
                  >
                    {num}
                  </text>
                </g>
              );
            })}
            {/* Center circle */}
            <circle cx="100" cy="100" r="20" fill="#0a0a0f" stroke="rgba(0,255,136,0.5)" strokeWidth="2" />
            <text
              x="100"
              y="100"
              textAnchor="middle"
              dominantBaseline="central"
              fill="#00ff88"
              fontSize="10"
              fontWeight="bold"
              fontFamily="'JetBrains Mono', monospace"
            >
              SPIN
            </text>
          </svg>
        </motion.div>
      </div>

      {/* Result or spin button */}
      {assignedNumber !== null ? (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="text-center"
        >
          <div className="font-mono text-xs tracking-[0.3em] text-neon-cyan mb-2">
            NUMBER LOCKED
          </div>
          <div className="text-5xl font-bold font-mono text-neon-green text-glow-green">
            PLAYER {assignedNumber}
          </div>
        </motion.div>
      ) : (
        <button
          onClick={handleSpin}
          disabled={isSpinning || disabled}
          className="cyber-btn cyber-btn-filled text-lg px-12"
        >
          {isSpinning ? 'SPINNING...' : 'SPIN THE WHEEL'}
        </button>
      )}
    </div>
  );
}
