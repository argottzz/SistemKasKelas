const { pool } = require('../config/db');

async function list(req, res, next) {
  try {
    const [rows] = await pool.query('SELECT id_user, nama, username, role, created_at FROM users ORDER BY id_user');
    res.json({ data: rows });
  } catch (e) { next(e); }
}

async function setRole(req, res, next) {
  try {
    const { role } = req.body || {};
    if (!['bendahara', 'pengurus'].includes(role)) return res.status(400).json({ message: 'Role tidak valid' });
    if (Number(req.params.id) === req.user.id && role !== 'bendahara') {
      return res.status(400).json({ message: 'Tidak bisa menurunkan role diri sendiri' });
    }
    await pool.query('UPDATE users SET role=? WHERE id_user=?', [role, req.params.id]);
    const [[row]] = await pool.query('SELECT id_user, nama, username, role, created_at FROM users WHERE id_user=?', [req.params.id]);
    if (!row) return res.status(404).json({ message: 'User tidak ditemukan' });
    res.json(row);
  } catch (e) { next(e); }
}

async function remove(req, res, next) {
  try {
    if (Number(req.params.id) === req.user.id) return res.status(400).json({ message: 'Tidak bisa menghapus diri sendiri' });
    await pool.query('DELETE FROM users WHERE id_user=?', [req.params.id]);
    res.json({ message: 'User dihapus (transaksinya tetap tersimpan)' });
  } catch (e) { next(e); }
}

module.exports = { list, setRole, remove };
