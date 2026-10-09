const express = require('express');
const multer = require('multer');
const c = require('../controllers/importController');
const { authRequired, requireRole } = require('../middlewares/auth');

const r = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/\.xlsx?$/.test(file.originalname)) cb(null, true);
    else cb(new Error('Hanya file .xlsx/.xls yang diizinkan'));
  },
});

r.get('/', authRequired, c.history);
r.get('/:id', authRequired, c.detail);
r.post('/preview', authRequired, requireRole('bendahara'), upload.single('file'), c.preview);
r.post('/confirm', authRequired, requireRole('bendahara'), express.json(), c.confirm);

module.exports = r;
