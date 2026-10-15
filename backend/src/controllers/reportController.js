const { supabase } = require('../config/supabase');
const { getSummary } = require('../services/dashboardService');

const TABUNGAN_BAWAAN = 5200000;

async function summary(req, res, next) {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate && !endDate) {
      const s = await getSummary();
      return res.json({
        ...s,
        saldo_akhir: s.uang_dibendahara,
        periode: { startDate: null, endDate: null },
      });
    }
    let q = supabase.from('transactions').select('jenis,nominal');
    if (startDate) q = q.gte('tanggal', startDate);
    if (endDate) q = q.lte('tanggal', endDate);
    const { data, error } = await q;
    if (error) throw error;
    let opening = 0, income = 0, expense = 0, savings = 0;
    for (const r of data) {
      const n = Number(r.nominal);
      if (r.jenis === 'opening_balance') opening += n;
      else if (r.jenis === 'income') income += n;
      else if (r.jenis === 'expense') expense += n;
      else if (r.jenis === 'savings') savings += n;
    }
    res.json({
      opening_balance: opening,
      total_income: income,
      total_expense: expense,
      total_savings: savings,
      savings_baru: savings,
      tabungan_bawaan: 0,
      uang_dibendahara: opening + income - expense - savings,
      total_pemasukan: opening + income,
      saldo_tersedia: opening + income,
      saldo_akhir: opening + income - expense - savings,
      total_pengeluaran_ringkas: opening + income - expense,
      jumlah_transaksi: data.length,
      periode: { startDate: startDate || null, endDate: endDate || null },
    });
  } catch (e) { next(e); }
}

async function transactions(req, res, next) {
  try {
    const { startDate, endDate, page = 1, limit = 50 } = req.query;
    const p = Math.max(Number(page) || 1, 1);
    const l = Math.min(Math.max(Number(limit) || 50, 1), 200);
    let q = supabase.from('transactions').select('*', { count: 'exact' });
    if (startDate) q = q.gte('tanggal', startDate);
    if (endDate) q = q.lte('tanggal', endDate);
    q = q.order('tanggal', { ascending: true }).order('id', { ascending: true })
      .range((p - 1) * l, p * l - 1);
    const { data, count, error } = await q;
    if (error) throw error;
    res.json({ data, total: count, page: p, limit: l });
  } catch (e) { next(e); }
}

module.exports = { summary, transactions };
