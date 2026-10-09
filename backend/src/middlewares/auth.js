const jwt = require('jsonwebtoken');

function authRequired(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ message: 'Belum login' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Sesi kedaluwarsa, silakan login lagi' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Belum login' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Akses ditolak untuk role ini' });
    }
    next();
  };
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Terjadi kesalahan server' });
}

module.exports = { authRequired, requireRole, errorHandler };
