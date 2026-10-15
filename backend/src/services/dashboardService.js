const { supabase } = require('../config/supabase');

// Samakan dengan Excel asli Kelas 11 cell M9: SUM(tabungan_baru)+5200000.
// 5200000 = saldo tabungan bawaan (bukan dari baris transaksi berjalan).
const TABUNGAN_BAWAAN = 5200000;

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
  const uang_dibendahara = opening + income - expense - savings;
  const total_savings = savings + TABUNGAN_BAWAAN;
  const total_pemasukan = uang_dibendahara + total_savings;
  return {
    opening_balance: opening,
    total_income: income,
    total_expense: expense,
    total_savings,
    savings_baru: savings,
    tabungan_bawaan: TABUNGAN_BAWAAN,
    uang_dibendahara,
    total_pemasukan,
    saldo_tersedia: total_pemasukan,
    saldo_akhir: uang_dibendahara,
    total_pengeluaran_ringkas: total_pemasukan - expense,
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
