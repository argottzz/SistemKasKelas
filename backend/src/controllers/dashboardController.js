const { getSummary, getRecent } = require('../services/dashboardService');

async function summary(req, res, next) {
  try {
    const s = await getSummary();
    res.json({ ...s, peringatan_saldo_besar: s.saldo_tersedia > 1000000 });
  } catch (e) { next(e); }
}

async function recent(req, res, next) {
  try {
    res.json({ data: await getRecent(req.query.limit) });
  } catch (e) { next(e); }
}

module.exports = { summary, recent };
