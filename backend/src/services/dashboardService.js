const { supabase } = require('../config/supabase');

async function getSummary() {
  const { data, error } = await supabase.from('transactions').select('jenis,nominal');
  if (error) throw error;
  let opening = 0, income = 0, expense = 0, savings = 0;
  for (const r of data) {
    const n = Number(r.nominal);
    if (r.jenis === 'opening_balance') opening += n;
    else if (r.jenis === 'income') income += n;
    else if (r.jenis === 'expense') expense += n;
    else if (r.jenis === 'savings') savings += n;
  }
  return {
    opening_balance: opening,
    total_income: income,
    total_expense: expense,
    total_savings: savings,
    saldo_tersedia: opening + income - expense - savings,
    jumlah_transaksi: data.length,
  };
}

async function getRecent(limit = 8) {
  const n = Math.min(Math.max(Number(limit) || 8, 1), 50);
  const { data, error } = await supabase.from('transactions')
    .select('*').order('tanggal', { ascending: false }).order('id', { ascending: false }).limit(n);
  if (error) throw error;
  return data;
}

module.exports = { getSummary, getRecent };
