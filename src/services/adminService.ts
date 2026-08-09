import { supabase } from '../lib/supabase';
import type { Team, Player } from '../types';

/**
 * Check if the current user is an admin.
 */
export async function checkIsAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc('check_admin');
  if (error) return false;
  return data === true;
}

/**
 * Admin login using email/password via Supabase Auth.
 */
export async function adminLogin(
  email: string,
  password: string
): Promise<boolean> {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  // Verify this user is actually an admin
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    await supabase.auth.signOut();
    throw new Error('Access denied: not an admin user');
  }

  return true;
}

/**
 * Fetch all teams (admin only — RLS restricts to admin users).
 */
export async function getAllTeams(): Promise<Team[]> {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Fetch all players (admin only).
 */
export async function getAllPlayers(): Promise<Player[]> {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .order('team_id', { ascending: true })
    .order('player_number', { ascending: true, nullsFirst: false });

  if (error) throw error;
  return data || [];
}

/**
 * Admin logout.
 */
export async function adminLogout(): Promise<void> {
  await supabase.auth.signOut();
}
