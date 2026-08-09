import { supabase } from '../lib/supabase';
import type { TeamProgress } from '../types';

/**
 * Get all progress rows for a team.
 */
export async function getTeamProgress(teamId: string): Promise<TeamProgress[]> {
  const { data, error } = await supabase
    .from('team_progress')
    .select('*')
    .eq('team_id', teamId)
    .order('player_number', { ascending: true })
    .order('challenge_index', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Start a challenge (records the start timestamp server-side).
 */
export async function startChallenge(
  teamId: string,
  challengeIndex: number
): Promise<boolean> {
  const { data, error } = await supabase.rpc('start_challenge', {
    p_team_id: teamId,
    p_challenge_index: challengeIndex,
  });

  if (error) throw error;
  return data;
}

/**
 * Complete a challenge (verified server-side).
 * Score: 1 = correct, 0 = wrong/timeout
 */
export async function completeChallenge(
  teamId: string,
  challengeIndex: number,
  score: number = 0
): Promise<boolean> {
  const { data, error } = await supabase.rpc('complete_challenge', {
    p_team_id: teamId,
    p_challenge_index: challengeIndex,
    p_score: score,
  });

  if (error) {
    alert(`Backend Error: ${error.message}\n(Did you forget to run the updated schema.sql in Supabase?)`);
    throw error;
  }
  return data;
}

/**
 * Generate access code after completing all challenges.
 * Idempotent: returns existing code if already generated.
 */
export async function generateAccessCode(teamId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_access_code', {
    p_team_id: teamId,
  });

  if (error) throw error;
  console.log("RPC generated access code:", data);
  return data;
}

/**
 * Validate an access code to unlock the next player.
 */
export async function validateAccessCode(
  teamId: string,
  code: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc('validate_access_code', {
    p_team_id: teamId,
    p_code: code,
  });

  if (error) throw error;
  return data;
}
