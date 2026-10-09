const express = require('express');
const c = require('../controllers/reportController');
const { authRequired } = require('../middlewares/auth');
const r = express.Router();
r.get('/summary', authRequired, c.summary);
r.get('/transactions', authRequired, c.transactions);
module.exports = r;
