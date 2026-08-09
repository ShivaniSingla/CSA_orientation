import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Brain, Eye, Zap, Users, Clock, Trophy } from 'lucide-react';
import { gameConfig } from '../config/gameConfig';
import { useAudio } from '../components/Audio/AudioManager';
import type { Team, Player, TeamProgress } from '../types';

interface CompleteProps {
  team: Team;
  players: Player[];
  progress: TeamProgress[];
}

const skills = [
  { icon: Brain, label: 'CRITICAL THINKING', color: 'text-neon-green' },
  { icon: Eye, label: 'OBSERVATION', color: 'text-neon-cyan' },
  { icon: Zap, label: 'DECISION MAKING', color: 'text-neon-amber' },
  { icon: Users, label: 'COMMUNICATION', color: 'text-neon-green' },
  { icon: Clock, label: 'TIME MANAGEMENT', color: 'text-neon-cyan' },
];

export function Complete({ team, players, progress }: CompleteProps) {
  const [showScoreboard, setShowScoreboard] = useState(false);
  const [showReveal, setShowReveal] = useState(false);
  const [showFinal, setShowFinal] = useState(false);
  const { playSound } = useAudio();

  // Calculate completion time
  const completionTime = team.started_at && team.completed_at
    ? Math.round(
        (new Date(team.completed_at).getTime() - new Date(team.started_at).getTime()) / 1000
      )
    : 0;
  const minutes = Math.floor(completionTime / 60);
  const seconds = completionTime % 60;

  // Calculate scores per player
  const assignedPlayers = players
    .filter(p => p.player_number !== null)
    .sort((a, b) => a.player_number! - b.player_number!);

  const playerScores = assignedPlayers.map(player => {
    const playerProgress = progress.filter(
      p => p.player_number === player.player_number && p.completed
    );
    const score = playerProgress.reduce((sum, p) => sum + (p.score || 0), 0);
    const total = gameConfig.challengesPerPlayer;
    return {
      player,
      score,
      total,
    };
  });

  const teamScore = playerScores.reduce((sum, p) => sum + p.score, 0);
  const teamTotal = playerScores.reduce((sum, p) => sum + p.total, 0);
  const teamPercentage = teamTotal > 0 ? Math.round((teamScore / teamTotal) * 100) : 0;

  useEffect(() => {
    playSound('complete');
    const scoreTimer = setTimeout(() => setShowScoreboard(true), 2000);
    const revealTimer = setTimeout(() => setShowReveal(true), 6000);
    const finalTimer = setTimeout(() => setShowFinal(true), 10000);
    return () => {
      clearTimeout(scoreTimer);
      clearTimeout(revealTimer);
      clearTimeout(finalTimer);
    };
  }, [playSound]);

  return (
    <div className="min-h-screen flex items-center justify-center relative px-4 py-12">
      <div className="cyber-grid-bg" />

      <div className="w-full max-w-lg z-10 relative">
        {/* Mission Complete header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8"
        >
          {/* Decorative bars */}
          <div className="flex justify-center gap-1 mb-6">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: i * 0.05 }}
                className="w-2 h-4 bg-neon-green/60"
              />
            ))}
          </div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-3xl sm:text-5xl font-bold text-neon-green text-glow-green font-mono mb-4"
          >
            MISSION COMPLETE
          </motion.h1>

          {/* Decorative bars */}
          <div className="flex justify-center gap-1 mb-6">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: 1 + i * 0.05 }}
                className="w-2 h-4 bg-neon-green/60"
              />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
          >
            <div className="font-mono text-lg text-neon-cyan mb-2">
              TEAM {team.team_code}
            </div>
            <div className="font-mono text-sm text-cyber-muted mb-4">
              ALL OPERATIVES SUCCESSFUL
            </div>
            {completionTime > 0 && (
              <div className="font-mono text-2xl text-neon-green">
                TIME: {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </div>
            )}
          </motion.div>
        </motion.div>

        {/* Scoreboard */}
        {showScoreboard && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="cyber-panel-glow p-6 mb-8"
          >
            <div className="flex items-center justify-center gap-2 mb-6">
              <Trophy className="w-5 h-5 text-neon-amber" />
              <span className="font-mono text-xs tracking-[0.3em] text-neon-amber uppercase">
                Mission Scorecard
              </span>
            </div>

            {/* Player scores */}
            <div className="space-y-3 mb-6">
              {playerScores.map(({ player, score, total }, index) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.15 }}
                  className="flex items-center justify-between p-3 rounded border border-cyber-border bg-cyber-darker"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-neon-green/10 border border-neon-green/30">
                      <span className="font-mono text-sm font-bold text-neon-green">
                        {player.player_number}
                      </span>
                    </div>
                    <div>
                      <div className="font-mono text-sm text-gray-200">
                        {player.player_name}
                      </div>
                      <div className="font-mono text-xs text-cyber-muted">
                        PLAYER {player.player_number}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-mono text-lg font-bold ${
                      score === total ? 'text-neon-green text-glow-green' :
                      score >= total / 2 ? 'text-neon-cyan' :
                      'text-neon-amber'
                    }`}>
                      {score}/{total}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-neon-green/30 to-transparent mb-6" />

            {/* Team total */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: playerScores.length * 0.15 + 0.3 }}
              className="text-center"
            >
              <div className="font-mono text-xs tracking-[0.3em] text-cyber-muted mb-2 uppercase">
                Team Score
              </div>
              <div className="text-4xl font-bold font-mono text-neon-green text-glow-green mb-2">
                {teamScore}/{teamTotal}
              </div>
              <div className="font-mono text-sm text-cyber-muted mb-1">
                CRITICAL THINKING SCORE
              </div>
              <div className={`text-3xl font-bold font-mono ${
                teamPercentage >= 75 ? 'text-neon-green text-glow-green' :
                teamPercentage >= 50 ? 'text-neon-cyan' :
                'text-neon-amber'
              }`}>
                {teamPercentage}%
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 2 }}
          className="h-px bg-gradient-to-r from-transparent via-neon-green/30 to-transparent mb-8"
        />

        {/* Reveal section */}
        {showReveal && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <div className="font-mono text-sm tracking-[0.3em] text-neon-amber mb-8">
              WHAT DID YOU JUST DO?
            </div>

            <div className="space-y-4">
              {skills.map((skill, i) => (
                <motion.div
                  key={skill.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.2 }}
                  className="flex items-center gap-4 p-3 rounded border border-cyber-border bg-cyber-darker"
                >
                  <skill.icon className={`w-6 h-6 ${skill.color} shrink-0`} />
                  <span className={`font-mono text-sm tracking-wider ${skill.color}`}>
                    {skill.label}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Final message */}
        {showFinal && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="h-px bg-gradient-to-r from-transparent via-neon-cyan/30 to-transparent mb-8" />

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="cyber-panel-glow p-8"
            >
              <div className="font-mono text-sm text-cyber-muted mb-4 leading-relaxed">
                YOU WEREN'T TESTED ON CYBERSECURITY.
                <br />
                YOU WERE TESTED ON HOW YOU THINK.
              </div>

              <div className="font-mono text-sm text-neon-cyan mb-2">
                THESE ARE THE SKILLS WE LOOK FOR.
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-neon-green/20 to-transparent my-6" />

              <div className="font-mono text-base text-cyber-muted mb-2 tracking-wider">
                WELCOME TO
              </div>

              <div className="text-3xl font-bold text-neon-green text-glow-green font-mono mb-4">
                {gameConfig.clubName}
              </div>

              <Shield className="w-12 h-12 text-neon-green mx-auto" strokeWidth={1.5} />
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
