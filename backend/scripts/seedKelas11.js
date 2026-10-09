// Seed data awal Kelas 11 dari file Excel asli (frozen).
// - Tanpa user (id_user NULL), users tetap kosong
// - Idempoten via file_hash
// - Validasi target: opening 476000, income 2026500, expense 577500, savings 1000000, saldo 925000
require('dotenv').config();
const fs = require('fs');
const crypto = require('crypto');
const mysql = require('mysql2/promise');
const { parseKelas11Layout, totals } = require('../src/services/importService');

const TARGET = { opening: 476000, income: 2026500, expense: 577500, savings: 1000000, saldo: 925000, count: 44 };

async function main() {
  const excelPath = process.env.EXCEL_PATH;
  if (!excelPath || !fs.existsSync(excelPath)) {
    throw new Error(`File Excel tidak ditemukan: ${excelPath} (cek backend/.env EXCEL_PATH)`);
  }
  const buf = fs.readFileSync(excelPath);
  const fileHash = crypto.createHash('sha256').update(buf).digest('hex');
  console.log('[seed] file:', excelPath);
  console.log('[seed] hash:', fileHash);

  const { rows, errors } = await parseKelas11Layout(buf);
  if (errors.length) console.log('[seed] peringatan baris dilewati:', errors.length);
  const t = totals(rows);
  const saldo = t.opening + t.income - t.expense - t.savings;
  console.log('[seed] parsed:', rows.length, 'rows', t, 'saldo', saldo);

  if (t.opening !== TARGET.opening || t.income !== TARGET.income || t.expense !== TARGET.expense || t.savings !== TARGET.savings || saldo !== TARGET.saldo || rows.length !== TARGET.count) {
    console.error('[seed] VALIDASI GAGAL. Diharapkan:', TARGET);
    console.error('[seed] Didapat:', { ...t, saldo, count: rows.length });
    process.exit(2);
  }
  console.log('[seed] validasi OK (44 transaksi, saldo 925000)');

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'db_kas_kelas',
    multipleStatements: true,
  });
  // pastikan schema
  const schema = fs.readFileSync(require('path').join(__dirname, '..', 'schema.sql'), 'utf8');
  await conn.query(schema);

  const [[dup]] = await conn.query('SELECT id_import FROM import_batches WHERE file_hash = ?', [fileHash]);
  if (dup) {
    console.log('[seed] sudah pernah di-seed (id_import=%s). Berhenti agar tidak ganda.', dup.id_import);
    await conn.end();
    return;
  }
  await conn.beginTransaction();
  try {
    const [batch] = await conn.query(
      `INSERT INTO import_batches (nama_file, sheet_name, file_hash, jumlah_data, total_income, total_expense, total_savings, id_user, status, keterangan)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      ['Laporan Kas RPL 2 2627.xlsx', 'Kelas 11', fileHash, rows.length, t.income, t.expense, t.savings, null, 'success', 'Seed awal Kelas 11 (tanpa user)']
    );
    for (const r of rows) {
      await conn.query(
        `INSERT INTO transactions (id_user, id_category, id_import, jenis, nominal, tanggal_transaksi, keterangan, penerima_tabungan)
         VALUES (NULL, NULL, ?, ?, ?, ?, ?, ?)`,
        [batch.insertId, r.jenis, r.nominal, r.tanggal_transaksi, r.keterangan, r.penerima_tabungan || null]
      );
    }
    await conn.commit();
    console.log(`[seed] sukses: ${rows.length} transaksi, id_import=${batch.insertId}`);
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    await conn.end();
  }
}

main().catch((e) => { console.error('[seed] gagal:', e.message); process.exit(1); });
