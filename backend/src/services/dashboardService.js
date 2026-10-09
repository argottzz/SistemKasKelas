const { pool } = require('../config/db');

async function getSummary() {
  const [[row]] = await pool.query(`
    SELECT
      COALESCE(SUM(CASE WHEN jenis='opening_balance' THEN nominal ELSE 0 END),0) AS opening_balance,
      COALESCE(SUM(CASE WHEN jenis='income' THEN nominal ELSE 0 END),0) AS total_income,
      COALESCE(SUM(CASE WHEN jenis='expense' THEN nominal ELSE 0 END),0) AS total_expense,
      COALESCE(SUM(CASE WHEN jenis='savings' THEN nominal ELSE 0 END),0) AS total_savings,
      COUNT(*) AS jumlah_transaksi
    FROM transactions
  `);
  const opening = Number(row.opening_balance);
  const income = Number(row.total_income);
  const expense = Number(row.total_expense);
  const savings = Number(row.total_savings);
  const saldo = opening + income - expense - savings;
  return {
    opening_balance: opening,
    total_income: income,
    total_expense: expense,
    total_savings: savings,
    saldo_tersedia: saldo,
    jumlah_transaksi: Number(row.jumlah_transaksi),
  };
}

async function getRecent(limit = 8) {
  const n = Math.min(Math.max(Number(limit) || 8, 1), 50);
  const [rows] = await pool.query(
    `SELECT t.*, c.nama_kategori, u.nama AS nama_user
     FROM transactions t
     LEFT JOIN categories c ON c.id_category = t.id_category
     LEFT JOIN users u ON u.id_user = t.id_user
     ORDER BY t.tanggal_transaksi DESC, t.id_transaction DESC LIMIT ?`,
    [n]
  );
  return rows;
}

module.exports = { getSummary, getRecent };
