import { getSupabase } from '../lib/supabaseClient';

async function main() {
  const supabase = getSupabase();
  const { data, error } = await supabase.from('notifications').select('*').limit(5);
  console.log('Existing notifications:', data, error);
}

main();
