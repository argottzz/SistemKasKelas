const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const { signToken, setAuthCookie, clearAuthCookie } = require('../utils/jwt');

async function register(req, res, next) {
  try {
    const { nama, username, password } = req.body || {};
    if (!nama?.trim() || !username?.trim() || !password) {
      return res.status(400).json({ message: 'Nama, username, dan password wajib diisi' });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ message: 'Password minimal 8 karakter' });
    }
    const [[exists]] = await pool.query('SELECT id_user FROM users WHERE username = ?', [username.trim()]);
    if (exists) return res.status(409).json({ message: 'Username sudah dipakai' });

    const [[countRow]] = await pool.query('SELECT COUNT(*) AS c FROM users');
    const role = Number(countRow.c) === 0 ? 'bendahara' : 'pengurus';

    const hash = await bcrypt.hash(password, 10);
    const [r] = await pool.query('INSERT INTO users (nama, username, password, role) VALUES (?,?,?,?)', [
      nama.trim(), username.trim(), hash, role,
    ]);
    const [[user]] = await pool.query('SELECT id_user, nama, username, role, created_at FROM users WHERE id_user = ?', [r.insertId]);
    setAuthCookie(res, signToken(user));
    res.status(201).json({ user });
  } catch (e) { next(e); }
}

async function login(req, res, next) {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ message: 'Username dan password wajib diisi' });
    const [[user]] = await pool.query('SELECT * FROM users WHERE username = ?', [username.trim()]);
    if (!user) return res.status(401).json({ message: 'Username atau password salah' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: 'Username atau password salah' });
    const safe = { id_user: user.id_user, nama: user.nama, username: user.username, role: user.role, created_at: user.created_at };
    setAuthCookie(res, signToken(safe));
    res.json({ user: safe });
  } catch (e) { next(e); }
}

async function me(req, res) {
  const [[user]] = await pool.query('SELECT id_user, nama, username, role, created_at FROM users WHERE id_user = ?', [req.user.id]);
  if (!user) return res.status(401).json({ message: 'Akun tidak ditemukan' });
  res.json({ user });
}

async function logout(req, res) {
  clearAuthCookie(res);
  res.json({ message: 'Logout berhasil' });
}

module.exports = { register, login, me, logout };
