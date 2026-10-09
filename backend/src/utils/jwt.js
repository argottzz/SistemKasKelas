const jwt = require('jsonwebtoken');

function signToken(user) {
  return jwt.sign(
    { id: user.id_user, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function setAuthCookie(res, token) {
  // Di production frontend (Netlify) & backend (mis. Railway) beda domain,
  // cookie harus SameSite=None + Secure agar terkirim lintas-situs.
  // Di lokal (http) tetap Lax agar bisa jalan tanpa HTTPS.
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: isProd ? 'none' : 'lax',
    secure: isProd,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

function clearAuthCookie(res) {
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie('token', {
    path: '/',
    sameSite: isProd ? 'none' : 'lax',
    secure: isProd,
  });
}

module.exports = { signToken, setAuthCookie, clearAuthCookie };
