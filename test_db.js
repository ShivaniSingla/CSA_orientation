import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testJoin() {
  console.log('Signing in anonymously...');
  const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
  if (authError) {
    console.error('Auth error:', authError);
    return;
  }
  
  console.log('User ID:', authData.user.id);
  
  console.log('\nTrying to read me...');
  const me = await supabase.from('players').select('*').eq('user_id', authData.user.id);
  console.log('Me result:', me.data, me.error?.message);

  console.log('\nJoining team CA-001...');
  const res1 = await supabase.rpc('join_team', {
    p_team_code: 'CA-001',
    p_player_name: 'Console Test',
  });
  console.log('Join 1 result:', res1.data, res1.error?.message);

  console.log('\nTrying to read me again...');
  const me2 = await supabase.from('players').select('*').eq('user_id', authData.user.id);
  console.log('Me 2 result:', me2.data, me2.error?.message);
  
  console.log('\nJoining team CA-001 AGAIN...');
  const res2 = await supabase.rpc('join_team', {
    p_team_code: 'CA-001',
    p_player_name: 'Console Test 2',
  });
  console.log('Join 2 result:', res2.data, res2.error?.message);
}

testJoin();
