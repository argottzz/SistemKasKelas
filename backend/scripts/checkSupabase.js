// Cek koneksi Supabase: hitung baris kedua tabel + tampilkan sampel.
// Aman: tidak mencetak API key / secret apa pun.
require('dotenv').config();
const { supabase } = require('../src/config/supabase');

async function main() {
  const t = await supabase.from('transactions').select('*', { count: 'exact' }).limit(3);
  if (t.error) throw t.error;
  const b = await supabase.from('import_batches').select('*', { count: 'exact' }).limit(5);
  if (b.error) throw b.error;
  console.log('[check] transactions:', t.count);
  console.log('[check] import_batches:', b.count);
  console.log('[check] sample transactions:', JSON.stringify(t.data, null, 1).slice(0, 1200));
  console.log('[check] batches:', JSON.stringify(b.data, null, 1).slice(0, 1200));
  // Struktur kolom aktual (untuk keputusan mapping)
  console.log('[check] tx columns:', t.data.length ? Object.keys(t.data[0]).join(',') : '(tabel kosong)');
  console.log('[check] batch columns:', b.data.length ? Object.keys(b.data[0]).join(',') : '(tabel kosong)');
}

main().catch((e) => { console.error('[check] GAGAL:', e.message); process.exit(1); });
