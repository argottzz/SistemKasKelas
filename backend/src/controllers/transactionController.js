const { pool } = require('../config/db');
const { validateTransactionInput, checkCategory } = require('../services/transactionService');

async function list(req, res, next) {
  try {
    const { jenis, startDate, endDate, q, page = 1, limit = 20 } = req.query;
    const where = [];
    const params = [];
    if (jenis) { where.push('t.jenis = ?'); params.push(jenis); }
    if (startDate) { where.push('t.tanggal_transaksi >= ?'); params.push(startDate); }
    if (endDate) { where.push('t.tanggal_transaksi <= ?'); params.push(endDate); }
    if (q) { where.push('(t.keterangan LIKE ? OR t.penerima_tabungan LIKE ?)'); params.push(`%${q}%`, `%${q}%`); }
    const w = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const p = Math.max(Number(page) || 1, 1);
    const l = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const off = (p - 1) * l;
    const [[c]] = await pool.query(`SELECT COUNT(*) AS total FROM transactions t ${w}`, params);
    const [rows] = await pool.query(
      `SELECT t.*, c.nama_kategori, u.nama AS nama_user FROM transactions t
       LEFT JOIN categories c ON c.id_category=t.id_category
       LEFT JOIN users u ON u.id_user=t.id_user
       ${w} ORDER BY t.tanggal_transaksi DESC, t.id_transaction DESC LIMIT ? OFFSET ?`,
      [...params, l, off]
    );
    res.json({ data: rows, total: c.total, page: p, limit: l });
  } catch (e) { next(e); }
}

async function detail(req, res, next) {
  try {
    const [[row]] = await pool.query(
      `SELECT t.*, c.nama_kategori FROM transactions t LEFT JOIN categories c ON c.id_category=t.id_category WHERE t.id_transaction=?`,
      [req.params.id]
    );
    if (!row) return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
    res.json(row);
  } catch (e) { next(e); }
}

async function create(req, res, next) {
  try {
    let { jenis, nominal, tanggal_transaksi, keterangan, penerima_tabungan = null, id_category = null } = req.body || {};
    if (id_category === '') id_category = null;
    if (penerima_tabungan === '') penerima_tabungan = null;
    const err = validateTransactionInput({ jenis, nominal, tanggal_transaksi, keterangan, penerima_tabungan, id_category });
    if (err) return res.status(400).json({ message: err });
    await checkCategory(jenis, id_category);
    if (jenis !== 'savings') penerima_tabungan = null;
    const [r] = await pool.query(
      'INSERT INTO transactions (id_user, id_category, jenis, nominal, tanggal_transaksi, keterangan, penerima_tabungan) VALUES (?,?,?,?,?,?,?)',
      [req.user.id, id_category, jenis, nominal, tanggal_transaksi, keterangan.trim(), penerima_tabungan?.trim() || null]
    );
    const [[row]] = await pool.query('SELECT * FROM transactions WHERE id_transaction=?', [r.insertId]);
    res.status(201).json(row);
  } catch (e) { next(e); }
}

async function update(req, res, next) {
  try {
    const [[old]] = await pool.query('SELECT * FROM transactions WHERE id_transaction=?', [req.params.id]);
    if (!old) return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
    if (req.user.role !== 'bendahara' && old.id_user !== req.user.id) {
      return res.status(403).json({ message: 'Pengurus hanya boleh mengubah catatannya sendiri' });
    }
    const merged = {
      jenis: req.body.jenis ?? old.jenis,
      nominal: req.body.nominal ?? old.nominal,
      tanggal_transaksi: req.body.tanggal_transaksi ?? old.tanggal_transaksi,
      keterangan: req.body.keterangan ?? old.keterangan,
      penerima_tabungan: req.body.penerima_tabungan !== undefined ? req.body.penerima_tabungan : old.penerima_tabungan,
      id_category: req.body.id_category !== undefined ? req.body.id_category : old.id_category,
    };
    if (merged.id_category === '') merged.id_category = null;
    if (merged.penerima_tabungan === '') merged.penerima_tabungan = null;
    const err = validateTransactionInput(merged);
    if (err) return res.status(400).json({ message: err });
    await checkCategory(merged.jenis, merged.id_category);
    if (merged.jenis !== 'savings') merged.penerima_tabungan = null;
    await pool.query(
      'UPDATE transactions SET jenis=?, nominal=?, tanggal_transaksi=?, keterangan=?, penerima_tabungan=?, id_category=? WHERE id_transaction=?',
      [merged.jenis, merged.nominal, merged.tanggal_transaksi, String(merged.keterangan).trim(), merged.penerima_tabungan?.trim?.() || merged.penerima_tabungan || null, merged.id_category, req.params.id]
    );
    const [[row]] = await pool.query('SELECT * FROM transactions WHERE id_transaction=?', [req.params.id]);
    res.json(row);
  } catch (e) { next(e); }
}

async function remove(req, res, next) {
  try {
    const [[old]] = await pool.query('SELECT * FROM transactions WHERE id_transaction=?', [req.params.id]);
    if (!old) return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
    if (req.user.role !== 'bendahara') return res.status(403).json({ message: 'Hanya bendahara yang boleh menghapus' });
    await pool.query('DELETE FROM transactions WHERE id_transaction=?', [req.params.id]);
    res.json({ message: 'Transaksi dihapus' });
  } catch (e) { next(e); }
}

module.exports = { list, detail, create, update, remove };
