require('dotenv').config();
const app = require('./app');
const { testSupabase } = require('./config/supabase');

const PORT = Number(process.env.PORT || 8000);

(async () => {
  try {
    await testSupabase();
    console.log('[db] supabase connected (service role, RLS enforced for anon)');
    app.listen(PORT, () => console.log(`[api] listening on http://localhost:${PORT}`));
  } catch (e) {
    console.error('[fatal]', e.message);
    console.error('Cek backend/.env (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)');
    process.exit(1);
  }
})();
