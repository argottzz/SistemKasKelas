const express = require('express');
const c = require('../controllers/userController');
const { authRequired, requireRole } = require('../middlewares/auth');
const r = express.Router();
r.get('/', authRequired, requireRole('bendahara'), c.list);
r.put('/:id/role', authRequired, requireRole('bendahara'), c.setRole);
r.delete('/:id', authRequired, requireRole('bendahara'), c.remove);
module.exports = r;
