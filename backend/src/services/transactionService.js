const { pool } = require('../config/db');

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
  if (!id_category) return;
  const [[cat]] = await pool.query('SELECT * FROM categories WHERE id_category = ?', [id_category]);
  if (!cat) throw Object.assign(new Error('Kategori tidak ditemukan'), { status: 400 });
  if (jenis === 'income' && cat.jenis !== 'income') throw Object.assign(new Error('Kategori tersebut khusus pengeluaran'), { status: 400 });
  if (jenis === 'expense' && cat.jenis !== 'expense') throw Object.assign(new Error('Kategori tersebut khusus pemasukan'), { status: 400 });
  if ((jenis === 'savings' || jenis === 'opening_balance') && id_category) {
    throw Object.assign(new Error('Tabungan & saldo awal tidak memakai kategori'), { status: 400 });
  }
}

module.exports = { JENIS_VALID, validateTransactionInput, checkCategory };
