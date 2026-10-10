// Klien Supabase SERVER-ONLY ala ReBites (lib/server/supabase.ts).
// Memakai SERVICE ROLE key dari env server — tidak pernah terkirim ke browser.
// Route handlers (app/api/...) adalah satu-satunya pemakai file ini.
import { createClient } from '@supabase/supabase-js';

let client = null;

export function supabaseServer() {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum diisi (env server / Netlify Variables)');
  }
  client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

export function summarize(rows) {
  const t = { opening: 0, income: 0, expense: 0, savings: 0 };
  for (const r of rows) {
    const n = Number(r.nominal);
    if (r.jenis === 'opening_balance') t.opening += n;
    else if (r.jenis === 'income') t.income += n;
    else if (r.jenis === 'expense') t.expense += n;
    else if (r.jenis === 'savings') t.savings += n;
  }
  return {
    opening_balance: t.opening,
    total_income: t.income,
    total_expense: t.expense,
    total_savings: t.savings,
    saldo_tersedia: t.opening + t.income - t.expense - t.savings,
    saldo_akhir: t.opening + t.income - t.expense - t.savings,
    jumlah_transaksi: rows.length,
  };
}
