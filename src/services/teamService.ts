import { supabase } from '../lib/supabase';
import type { Team } from '../types';

/**
 * Fetch a team by its code.
 */
export async function getTeamByCode(teamCode: string): Promise<Team | null> {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('team_code', teamCode.toUpperCase().trim())
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Fetch a team by its ID.
 */
export async function getTeamById(teamId: string): Promise<Team | null> {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('id', teamId)
    .maybeSingle();

  if (error) throw error;
  return data;
}
