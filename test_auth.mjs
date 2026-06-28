import { createClient } from '@supabase/supabase-js';

const url = 'https://zrdljxcrupvsmkjcvakd.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpyZGxqeGNydXB2c21ramN2YWtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1ODQxNzAsImV4cCI6MjA5ODE2MDE3MH0.CXiCKYdvzSL118TIBaHJZ1WN--IDAgBYzr_0LOfgraE';

const supabase = createClient(url, key);

async function test() {
  const { data, error } = await supabase.from('profiles').select('*');
  console.log('Profiles data:', data);
  if (error) console.error('Error:', error);
}

test();
