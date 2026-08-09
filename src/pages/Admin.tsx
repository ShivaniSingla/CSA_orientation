import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, LogOut, Users, Clock, Activity } from 'lucide-react';
import { adminLogin, checkIsAdmin, getAllTeams, getAllPlayers, adminLogout } from '../services/adminService';
import { useRealtime } from '../hooks/useRealtime';
import { gameConfig } from '../config/gameConfig';
import type { Team, Player } from '../types';

export function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);

  // Check existing auth on mount
  useEffect(() => {
    const check = async () => {
      const isAdmin = await checkIsAdmin();
      setIsAuthenticated(isAdmin);
      setIsCheckingAuth(false);
    };
    check();
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [teamsData, playersData] = await Promise.all([
        getAllTeams(),
        getAllPlayers(),
      ]);
      setTeams(teamsData);
      setPlayers(playersData);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    }
  }, []);

  // Load data after auth
  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, loadData]);

  // Real-time for admin — subscribe to all teams and players
  useRealtime(
    { table: 'teams', enabled: isAuthenticated },
    () => { loadData(); }
  );

  useRealtime(
    { table: 'players', enabled: isAuthenticated },
    () => { loadData(); }
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);

    try {
      await adminLogin(email, password);
      setIsAuthenticated(true);
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await adminLogout();
    setIsAuthenticated(false);
    setTeams([]);
    setPlayers([]);
  };

  const getTeamPlayers = (teamId: string) =>
    players.filter((p) => p.team_id === teamId);

  const getElapsedTime = (team: Team) => {
    const start = team.started_at ? new Date(team.started_at).getTime() : null;
    const end = team.completed_at
      ? new Date(team.completed_at).getTime()
      : Date.now();
    if (!start) return '--:--';
    const elapsed = Math.round((end - start) / 1000);
    const m = Math.floor(elapsed / 60);
    const s = elapsed % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cyber-black">
        <div className="w-8 h-8 border-2 border-neon-green/30 border-t-neon-green rounded-full animate-spin" />
      </div>
    );
  }

  // Login form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center relative px-4">
        <div className="cyber-grid-bg" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm z-10"
        >
          <div className="text-center mb-8">
            <Lock className="w-10 h-10 text-neon-cyan mx-auto mb-4" />
            <h1 className="text-xl font-bold text-neon-cyan font-mono">
              ADMIN ACCESS
            </h1>
            <div className="font-mono text-xs text-cyber-muted mt-1">
              {gameConfig.clubName} COMMAND CENTER
            </div>
          </div>

          <form onSubmit={handleLogin} className="cyber-panel-glow p-6 space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Admin email"
              className="cyber-input"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="cyber-input"
              required
            />

            {loginError && (
              <div className="p-2 rounded bg-neon-red-glow border border-neon-red/30">
                <span className="font-mono text-xs text-neon-red">{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="cyber-btn cyber-btn-filled w-full"
            >
              {isLoggingIn ? 'AUTHENTICATING...' : 'LOGIN'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // Dashboard
  return (
    <div className="min-h-screen bg-cyber-black p-4 sm:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-neon-green" />
          <div>
            <h1 className="text-lg font-bold text-neon-green font-mono">
              COMMAND CENTER
            </h1>
            <div className="font-mono text-xs text-cyber-muted">
              {gameConfig.clubName} // LIVE MISSIONS
            </div>
          </div>
        </div>

        <button onClick={handleLogout} className="cyber-btn text-xs px-4 py-2 flex items-center gap-2">
          <LogOut className="w-3.5 h-3.5" />
          LOGOUT
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="cyber-panel p-4 text-center">
          <div className="font-mono text-2xl text-neon-green font-bold">{teams.length}</div>
          <div className="font-mono text-xs text-cyber-muted mt-1">TEAMS</div>
        </div>
        <div className="cyber-panel p-4 text-center">
          <div className="font-mono text-2xl text-neon-cyan font-bold">{players.length}</div>
          <div className="font-mono text-xs text-cyber-muted mt-1">PLAYERS</div>
        </div>
        <div className="cyber-panel p-4 text-center">
          <div className="font-mono text-2xl text-neon-green font-bold">
            {teams.filter((t) => t.status === 'active').length}
          </div>
          <div className="font-mono text-xs text-cyber-muted mt-1">ACTIVE</div>
        </div>
        <div className="cyber-panel p-4 text-center">
          <div className="font-mono text-2xl text-neon-amber font-bold">
            {teams.filter((t) => t.status === 'completed').length}
          </div>
          <div className="font-mono text-xs text-cyber-muted mt-1">COMPLETED</div>
        </div>
      </div>

      {/* Teams table */}
      <div className="cyber-panel overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-cyber-border">
              <th className="font-mono text-xs text-cyber-muted p-3 text-left tracking-wider">TEAM</th>
              <th className="font-mono text-xs text-cyber-muted p-3 text-left tracking-wider">STATUS</th>
              <th className="font-mono text-xs text-cyber-muted p-3 text-left tracking-wider">PLAYERS</th>
              <th className="font-mono text-xs text-cyber-muted p-3 text-left tracking-wider">CURRENT</th>
              <th className="font-mono text-xs text-cyber-muted p-3 text-left tracking-wider">TIME</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => {
              const teamPlayers = getTeamPlayers(team.id);
              const statusColors: Record<string, string> = {
                waiting: 'text-cyber-muted',
                assigning: 'text-neon-amber',
                active: 'text-neon-green',
                completed: 'text-neon-cyan',
              };

              return (
                <tr key={team.id} className="border-b border-cyber-border/30 hover:bg-cyber-darker/50">
                  <td className="font-mono text-sm text-neon-green p-3">{team.team_code}</td>
                  <td className={`font-mono text-xs p-3 uppercase tracking-wider ${statusColors[team.status] || 'text-cyber-muted'}`}>
                    <div className="flex items-center gap-2">
                      <Activity className="w-3 h-3" />
                      {team.status}
                    </div>
                  </td>
                  <td className="font-mono text-sm text-gray-300 p-3">
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-cyber-muted" />
                      {teamPlayers.length}/{gameConfig.maxPlayers}
                    </div>
                  </td>
                  <td className="font-mono text-sm p-3">
                    {team.current_player_number ? (
                      <span className="text-neon-green">
                        P{team.current_player_number}
                        {teamPlayers.find((p) => p.player_number === team.current_player_number)
                          ? ` (${teamPlayers.find((p) => p.player_number === team.current_player_number)!.player_name})`
                          : ''}
                      </span>
                    ) : (
                      <span className="text-cyber-muted">—</span>
                    )}
                  </td>
                  <td className="font-mono text-sm text-gray-300 p-3">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-cyber-muted" />
                      {getElapsedTime(team)}
                    </div>
                  </td>
                </tr>
              );
            })}
            {teams.length === 0 && (
              <tr>
                <td colSpan={5} className="font-mono text-sm text-cyber-muted p-8 text-center">
                  NO ACTIVE MISSIONS
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
