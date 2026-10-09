const express = require('express');
const c = require('../controllers/dashboardController');
const { authRequired } = require('../middlewares/auth');
const r = express.Router();
r.get('/summary', authRequired, c.summary);
r.get('/recent-transactions', authRequired, c.recent);
module.exports = r;
