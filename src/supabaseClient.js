import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Get top 20 leaders
export async function fetchTopLeaders() {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('id, name, score, achieved_at')
    .order('score', { ascending: false })
    .order('achieved_at', { ascending: true })
    .limit(20);

  if (error) {
    console.error('fetchTopLeaders error', error);
    return [];
  }

  return data || [];
}

// Check if this score qualifies for world leader
export async function checkIfWorldLeader(score) {
  const leaders = await fetchTopLeaders();

  if (leaders.length < 20) {
    return { isLeader: true, leaders };
  }

  const last = leaders[leaders.length - 1];
  const minScore = last.score;

  // Must strictly beat the 20th score
  if (score > minScore) {
    return { isLeader: true, leaders };
  }

  return { isLeader: false, leaders };
}

// Insert leader and trim to top 20
export async function submitLeader(name, score) {
  const { data: inserted, error: insertError } = await supabase
    .from('leaderboard')
    .insert([{ name, score }])
    .select('id, name, score, achieved_at')
    .single();

  if (insertError) {
    console.error('submitLeader insert error', insertError);
    throw insertError;
  }

  // Fetch all entries sorted
  const { data: allEntries, error: allError } = await supabase
    .from('leaderboard')
    .select('id, name, score, achieved_at')
    .order('score', { ascending: false })
    .order('achieved_at', { ascending: true });

  if (allError || !allEntries) {
    console.error('submitLeader fetch-all error', allError);
    return inserted;
  }

  if (allEntries.length <= 20) {
    return inserted;
  }

  const toDelete = allEntries.slice(20).map((e) => e.id);

  const { error: deleteError } = await supabase
    .from('leaderboard')
    .delete()
    .in('id', toDelete);

  if (deleteError) {
    console.error('submitLeader delete error', deleteError);
  }

  return inserted;
}
