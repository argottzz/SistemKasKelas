// Migrasi DB lama (buatan user) ke schema final tanpa hapus data
const mysql = require('mysql2/promise');

async function colExists(c, table, col) {
  const [rows] = await c.query(
    'SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?',
    ['db_kas_kelas', table, col]
  );
  return Number(rows[0].c) > 0;
}

(async () => {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: 'db_kas_kelas',
    multipleStatements: true,
  });
  try {
    if (!(await colExists(c, 'import_batches', 'file_hash'))) {
      await c.query('ALTER TABLE import_batches ADD COLUMN file_hash CHAR(64) NULL AFTER sheet_name');
      console.log('+ file_hash');
    }
    for (const [col, def] of [
      ['total_income', 'DECIMAL(14,2) NOT NULL DEFAULT 0'],
      ['total_expense', 'DECIMAL(14,2) NOT NULL DEFAULT 0'],
      ['total_savings', 'DECIMAL(14,2) NOT NULL DEFAULT 0'],
      ['id_user', 'INT NULL'],
    ]) {
      if (!(await colExists(c, 'import_batches', col))) {
        await c.query(`ALTER TABLE import_batches ADD COLUMN ${col} ${def}`);
        console.log('+ import_batches.' + col);
      }
    }
    // unique + fk import->user (abaikan jika sudah ada)
    try { await c.query('ALTER TABLE import_batches ADD UNIQUE KEY uq_import_hash (file_hash)'); console.log('+ uq_import_hash'); } catch (e) { console.log('uq_import_hash sudah ada/skip'); }
    try { await c.query('ALTER TABLE import_batches ADD CONSTRAINT fk_import_user FOREIGN KEY (id_user) REFERENCES users(id_user) ON UPDATE CASCADE ON DELETE SET NULL'); console.log('+ fk_import_user'); } catch (e) { console.log('fk_import_user sudah ada/skip'); }

    // transactions.id_user -> NULL-able + FK SET NULL
    await c.query('ALTER TABLE transactions MODIFY COLUMN id_user INT NULL');
    console.log('~ transactions.id_user NULL-able');
    try { await c.query('ALTER TABLE transactions DROP FOREIGN KEY fk_transaction_user'); console.log('- fk_transaction_user lama'); } catch (e) { console.log('drop fk lama skip:', e.message); }
    try {
      await c.query('ALTER TABLE transactions ADD CONSTRAINT fk_transaction_user FOREIGN KEY (id_user) REFERENCES users(id_user) ON UPDATE CASCADE ON DELETE SET NULL');
      console.log('+ fk_transaction_user SET NULL');
    } catch (e) { console.log('add fk baru skip:', e.message); }

    // kategori awal
    await c.query(`INSERT INTO categories (nama_kategori, jenis) VALUES
      ('Iuran Kas','income'),('Denda','income'),('Lainnya Masuk','income'),
      ('ATK / Fotocopy','expense'),('Kebersihan','expense'),('Kegiatan','expense'),('Konsumsi','expense')
      ON DUPLICATE KEY UPDATE nama_kategori=VALUES(nama_kategori)`);
    console.log('kategori ok');
    console.log('MIGRASI SELESAI');
  } finally {
    await c.end();
  }
})().catch((e) => { console.error('MIGRASI GAGAL:', e.message); process.exit(1); });
