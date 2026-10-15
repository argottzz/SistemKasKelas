// Helper agregasi ringkasan (murni, tanpa akses database).
// Akses data hanya lewat lib/supabase-route.js (sesi user -> RLS berlaku).
//
// Rumus disamakan dengan Excel asli "Laporan Kas RPL 2 2627.xlsx" sheet Kelas 11:
// - Uang di Bendahara (detail E47) = opening_cash + income - expense - savings_baru
// - Tabungan total (M9) = savings_baru + TABUNGAN_BAWAAN (Excel: SUM(M4)+5200000)
// - Total Pemasukan / Saldo Tersedia / Total Aset (M14) = bendahara + tabungan_total
// - Pengeluaran ringkas legacy (M15) = total_pemasukan - expense_detail
// Live DB: 476000+2421500-666000-1000000=1231500 bendahara,
//   tabungan 1000000+5200000=6200000, pemasukan 1231500+6200000=7431500.
export const TABUNGAN_BAWAAN = 5200000;

export function summarize(rows) {
  const t = { opening: 0, income: 0, expense: 0, savings: 0 };
  for (const r of rows) {
    const n = Number(r.nominal);
    if (r.jenis === 'opening_balance') t.opening += n;
    else if (r.jenis === 'income') t.income += n;
    else if (r.jenis === 'expense') t.expense += n;
    else if (r.jenis === 'savings') t.savings += n;
  }
  const uang_dibendahara = t.opening + t.income - t.expense - t.savings;
  const total_savings = t.savings + TABUNGAN_BAWAAN;
  const total_pemasukan = uang_dibendahara + total_savings;
  return {
    opening_balance: t.opening,
    total_income: t.income,
    total_expense: t.expense,
    total_savings,
    savings_baru: t.savings,
    tabungan_bawaan: TABUNGAN_BAWAAN,
    // Uang tunai yang bisa dipakai (detail Excel E47).
    uang_dibendahara,
    // Total aset / Pemasukan ringkas Excel M14. Samakan dengan saldo_tersedia
    // agar UI lama yang baca saldo_tersedia langsung menunjukkan 7431500.
    total_pemasukan,
    saldo_tersedia: total_pemasukan,
    saldo_akhir: uang_dibendahara,
    // Warisan Excel M15 (total_pemasukan - belanja detail). Ditampilkan di
    // blok Ringkasan agar cocok dengan teks, tapi jangan dipakai untuk tarik kesimpulan.
    total_pengeluaran_ringkas: total_pemasukan - t.expense,
    jumlah_transaksi: rows.length,
  };
}
