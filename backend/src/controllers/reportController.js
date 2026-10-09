const { pool } = require('../config/db');
const { getSummary } = require('../services/dashboardService');

async function summary(req, res, next) {
  try {
    const { startDate, endDate } = req.query;
    let w = '';
    const p = [];
    if (startDate) { w += (w ? ' AND ' : 'WHERE ') + 'tanggal_transaksi >= ?'; p.push(startDate); }
    if (endDate) { w += (w ? ' AND ' : 'WHERE ') + 'tanggal_transaksi <= ?'; p.push(endDate); }
    const [[row]] = await pool.query(`
      SELECT
        COALESCE(SUM(CASE WHEN jenis='opening_balance' THEN nominal ELSE 0 END),0) AS opening_balance,
        COALESCE(SUM(CASE WHEN jenis='income' THEN nominal ELSE 0 END),0) AS total_income,
        COALESCE(SUM(CASE WHEN jenis='expense' THEN nominal ELSE 0 END),0) AS total_expense,
        COALESCE(SUM(CASE WHEN jenis='savings' THEN nominal ELSE 0 END),0) AS total_savings,
        COUNT(*) AS jumlah_transaksi
      FROM transactions ${w}`, p);
    const opening = Number(row.opening_balance);
    const income = Number(row.total_income);
    const expense = Number(row.total_expense);
    const savings = Number(row.total_savings);
    res.json({
      opening_balance: opening,
      total_income: income,
      total_expense: expense,
      total_savings: savings,
      saldo_akhir: opening + income - expense - savings,
      jumlah_transaksi: Number(row.jumlah_transaksi),
      periode: { startDate: startDate || null, endDate: endDate || null },
    });
  } catch (e) { next(e); }
}

async function transactions(req, res, next) {
  try {
    const { startDate, endDate, page = 1, limit = 50 } = req.query;
    const where = [];
    const params = [];
    if (startDate) { where.push('t.tanggal_transaksi >= ?'); params.push(startDate); }
    if (endDate) { where.push('t.tanggal_transaksi <= ?'); params.push(endDate); }
    const w = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const p = Math.max(Number(page) || 1, 1);
    const l = Math.min(Math.max(Number(limit) || 50, 1), 200);
    const [[c]] = await pool.query(`SELECT COUNT(*) AS total FROM transactions t ${w}`, params);
    const [rows] = await pool.query(
      `SELECT t.*, c.nama_kategori FROM transactions t LEFT JOIN categories c ON c.id_category=t.id_category
       ${w} ORDER BY t.tanggal_transaksi, t.id_transaction LIMIT ? OFFSET ?`, [...params, l, (p - 1) * l]);
    res.json({ data: rows, total: c.total, page: p, limit: l });
  } catch (e) { next(e); }
}

module.exports = { summary, transactions };
