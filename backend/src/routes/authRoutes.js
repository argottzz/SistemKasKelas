const express = require('express');
const rateLimit = require('express-rate-limit');
const c = require('../controllers/authController');
const { authRequired } = require('../middlewares/auth');

const r = express.Router();
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 60 });

r.post('/register', limiter, c.register);
r.post('/login', limiter, c.login);
r.get('/me', authRequired, c.me);
r.post('/logout', authRequired, c.logout);

module.exports = r;
