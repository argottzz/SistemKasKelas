const { pool } = require('../config/db');

async function list(req, res, next) {
  try {
    const [rows] = await pool.query('SELECT * FROM categories ORDER BY jenis, nama_kategori');
    res.json({ data: rows });
  } catch (e) { next(e); }
}

async function create(req, res, next) {
  try {
    const { nama_kategori, jenis } = req.body || {};
    if (!nama_kategori?.trim() || !['income', 'expense'].includes(jenis)) {
      return res.status(400).json({ message: 'Nama dan jenis (income/expense) wajib valid' });
    }
    const [r] = await pool.query('INSERT INTO categories (nama_kategori, jenis) VALUES (?,?)', [nama_kategori.trim(), jenis]);
    const [[row]] = await pool.query('SELECT * FROM categories WHERE id_category=?', [r.insertId]);
    res.status(201).json(row);
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Kategori sudah ada' });
    next(e);
  }
}

async function update(req, res, next) {
  try {
    const { nama_kategori, jenis } = req.body || {};
    if (!nama_kategori?.trim() || !['income', 'expense'].includes(jenis)) {
      return res.status(400).json({ message: 'Nama dan jenis wajib valid' });
    }
    await pool.query('UPDATE categories SET nama_kategori=?, jenis=? WHERE id_category=?', [nama_kategori.trim(), jenis, req.params.id]);
    const [[row]] = await pool.query('SELECT * FROM categories WHERE id_category=?', [req.params.id]);
    if (!row) return res.status(404).json({ message: 'Kategori tidak ditemukan' });
    res.json(row);
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Kategori sudah ada' });
    next(e);
  }
}

async function remove(req, res, next) {
  try {
    const [[used]] = await pool.query('SELECT COUNT(*) AS c FROM transactions WHERE id_category=?', [req.params.id]);
    if (Number(used.c) > 0) return res.status(400).json({ message: 'Kategori sedang dipakai transaksi, tidak bisa dihapus' });
    await pool.query('DELETE FROM categories WHERE id_category=?', [req.params.id]);
    res.json({ message: 'Kategori dihapus' });
  } catch (e) { next(e); }
}

module.exports = { list, create, update, remove };
