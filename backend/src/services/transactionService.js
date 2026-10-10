// Validasi murni (tidak menyentuh database).

const JENIS_VALID = ['income', 'expense', 'savings', 'opening_balance'];

function validateTransactionInput({ jenis, nominal, tanggal_transaksi, keterangan, penerima_tabungan, id_category }) {
  if (!JENIS_VALID.includes(jenis)) return 'Jenis tidak valid';
  const n = Number(nominal);
  if (!Number.isFinite(n) || n <= 0) return 'Nominal harus lebih dari 0';
  if (!tanggal_transaksi || isNaN(new Date(tanggal_transaksi).getTime())) return 'Tanggal tidak valid';
  if (!keterangan || !String(keterangan).trim()) return 'Keterangan wajib diisi';
  if (jenis === 'savings') {
    if (!penerima_tabungan || !String(penerima_tabungan).trim()) return 'Penerima tabungan wajib diisi';
  } else if (penerima_tabungan !== undefined && penerima_tabungan !== null && String(penerima_tabungan).trim() !== '') {
    return 'Penerima tabungan hanya untuk jenis savings';
  }
  if (id_category !== undefined && id_category !== null && id_category !== '') {
    if (!Number.isInteger(Number(id_category))) return 'Kategori tidak valid';
  }
  return null;
}

async function checkCategory(jenis, id_category) {
  // Tabel categories tidak ada di Supabase (skema: transactions tanpa kolom kategori).
  // id_category yang terisi eksplisit ditolak agar tidak ada input yang diam-diam dibuang.
  if (id_category !== undefined && id_category !== null && id_category !== '') {
    throw Object.assign(new Error('Kategori belum didukung setelah migrasi Supabase'), { status: 400 });
  }
}

module.exports = { JENIS_VALID, validateTransactionInput, checkCategory };
