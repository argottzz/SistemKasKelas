// Validasi input transaksi — aturan sama dengan backend Express (transactionService.js).
export function validateTx({ jenis, nominal, tanggal, keterangan, penerima }) {
  if (!['income', 'expense', 'savings', 'opening_balance'].includes(jenis)) return 'Jenis tidak valid';
  if (!Number.isFinite(Number(nominal)) || Number(nominal) <= 0) return 'Nominal harus lebih dari 0';
  if (!tanggal || isNaN(new Date(tanggal).getTime())) return 'Tanggal tidak valid';
  if (!keterangan || !String(keterangan).trim()) return 'Keterangan wajib diisi';
  if (jenis === 'savings') {
    if (!penerima || !String(penerima).trim()) return 'Penerima tabungan wajib diisi';
  } else if (penerima !== undefined && penerima !== null && String(penerima).trim() !== '') {
    return 'Penerima tabungan hanya untuk jenis savings';
  }
  return null;
}

export const norm = (s) => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');
export const keyOf = (r) => [r.tanggal, r.jenis, Number(r.nominal), norm(r.keterangan)].join('|');
