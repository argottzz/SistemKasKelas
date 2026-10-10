const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Server tepercaya: memakai SERVICE ROLE key yang hanya ada di backend/.env.
// JANGAN pernah memakai key ini di frontend / me-commit-nya ke repository.
// RLS tetap aktif di database; service role melewatinya secara sah dari server.
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum diisi di backend/.env (lihat .env.example)');
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function testSupabase() {
  const { error } = await supabase.from('transactions').select('id', { count: 'exact', head: true });
  if (error) throw error;
  return true;
}

module.exports = { supabase, testSupabase };
