require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const app = require('./app');
const { testConnection } = require('./config/db');

const PORT = Number(process.env.PORT || 8000);

async function ensureSchema() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });
  const sql = fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8');
  await conn.query(sql);
  await conn.end();
}

(async () => {
  try {
    await ensureSchema();
    await testConnection();
    console.log('[db] connected & schema ready');
    app.listen(PORT, () => console.log(`[api] listening on http://localhost:${PORT}`));
  } catch (e) {
    console.error('[fatal]', e.message);
    console.error('Cek .env (DB_PASSWORD) dan koneksi MySQL Workbench sistemKasKelas 127.0.0.1:3306');
    process.exit(1);
  }
})();
