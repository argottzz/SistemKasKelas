// Helper agregasi ringkasan (murni, tanpa akses database).
// Akses data hanya lewat lib/supabase-route.js (sesi user -> RLS berlaku).

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
