import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function hashExistingPasswords() {
  console.log("Fetching existing profiles...");
  const { data: profiles, error } = await supabase.from('profiles').select('*');
  
  if (error) {
    console.error("Error fetching profiles:", error);
    return;
  }

  for (const profile of profiles) {
    // Only hash if it looks like plain text (bcrypt hashes start with $2a$, $2b$, or $2y$)
    if (profile.password && !profile.password.startsWith('$2')) {
      const hash = bcrypt.hashSync(profile.password, 10);
      console.log(`Hashing password for ${profile.username}...`);
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ password: hash })
        .eq('id', profile.id);
        
      if (updateError) {
        console.error(`Failed to update ${profile.username}:`, updateError);
      } else {
        console.log(`Successfully updated ${profile.username}`);
      }
    } else {
      console.log(`Skipping ${profile.username} - password already appears hashed.`);
    }
  }
  console.log("Done.");
}

hashExistingPasswords();
