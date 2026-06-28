import { createClient } from '@supabase/supabase-js';

const url = 'https://zrdljxcrupvsmkjcvakd.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpyZGxqeGNydXB2c21ramN2YWtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1ODQxNzAsImV4cCI6MjA5ODE2MDE3MH0.CXiCKYdvzSL118TIBaHJZ1WN--IDAgBYzr_0LOfgraE';

const supabase = createClient(url, key);

async function test() {
  console.log('Testing team_admin / team123');
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', 'team_admin')
    .eq('password', 'team123')
    .maybeSingle();

  if (error) {
    console.error('Error:', error);
  } else if (data) {
    console.log('Success! Found profile:', data);
  } else {
    console.log('No profile found. Checking if profiles exist at all...');
    const { data: allProfiles, error: allErr } = await supabase.from('profiles').select('*');
    if (allErr) {
      console.log('Error fetching all profiles:', allErr);
    } else {
      console.log('All profiles currently in database:', allProfiles);
    }
  }
}

test();
