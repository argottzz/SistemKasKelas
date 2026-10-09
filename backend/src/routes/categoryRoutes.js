const express = require('express');
const c = require('../controllers/categoryController');
const { authRequired, requireRole } = require('../middlewares/auth');
const r = express.Router();
r.get('/', authRequired, c.list);
r.post('/', authRequired, requireRole('bendahara'), c.create);
r.put('/:id', authRequired, requireRole('bendahara'), c.update);
r.delete('/:id', authRequired, requireRole('bendahara'), c.remove);
module.exports = r;
