const crypto = require('crypto');
const { pool } = require('../config/db');
const { previews, sha256, parseWorkbook, totals } = require('../services/importService');

async function preview(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ message: 'File Excel wajib diunggah (field: file)' });
    if (req.file.size > 5 * 1024 * 1024) return res.status(400).json({ message: 'Ukuran file maksimal 5MB' });
    const fileHash = sha256(req.file.buffer);
    const [[dup]] = await pool.query('SELECT id_import FROM import_batches WHERE file_hash = ?', [fileHash]);
    if (dup) return res.status(409).json({ message: 'File ini sudah pernah diimpor (hash sama). Impor ganda ditolak.' });
    const { rows, errors } = await parseWorkbook(req.file.buffer);
    const t = totals(rows);
    const previewId = crypto.randomUUID();
    previews.set(previewId, { rows, totals: t, fileHash, namaFile: req.file.originalname, createdAt: Date.now() });
    setTimeout(() => previews.delete(previewId), 30 * 60 * 1000);
    res.json({
      previewId,
      fileHash,
      jumlahValid: rows.length,
      jumlahError: errors.length,
      errors: errors.slice(0, 50),
      totals: t,
      saldoHasil: t.opening + t.income - t.expense - t.savings,
      sample: rows.slice(0, 10),
    });
  } catch (e) { next(e); }
}

async function confirm(req, res, next) {
  const conn = await pool.getConnection();
  try {
    const { previewId } = req.body || {};
    const pv = previews.get(previewId);
    if (!pv) return res.status(400).json({ message: 'Preview kedaluwarsa / tidak ditemukan. Unggah ulang.' });
    const [[dup]] = await conn.query('SELECT id_import FROM import_batches WHERE file_hash = ?', [pv.fileHash]);
    if (dup) return res.status(409).json({ message: 'Sudah diimpor sebelumnya (hash sama)' });

    await conn.beginTransaction();
    // resolve kategori by name (optional)
    const [cats] = await conn.query('SELECT * FROM categories');
    const catMap = new Map(cats.map((c) => [`${c.nama_kategori.toLowerCase()}|${c.jenis}`, c.id_category]));
    const [batch] = await conn.query(
      `INSERT INTO import_batches (nama_file, sheet_name, file_hash, jumlah_data, total_income, total_expense, total_savings, id_user, status, keterangan)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [pv.namaFile, 'upload', pv.fileHash, pv.rows.length, pv.totals.income, pv.totals.expense, pv.totals.savings, req.user.id, 'success', `Impor oleh ${req.user.username}`]
    );
    let ok = 0;
    for (const r of pv.rows) {
      let idCat = null;
      if (r.nama_kategori) {
        const keyInc = `${r.nama_kategori.toLowerCase()}|income`;
        const keyExp = `${r.nama_kategori.toLowerCase()}|expense`;
        idCat = catMap.get(keyInc) ?? catMap.get(keyExp) ?? null;
      }
      await conn.query(
        `INSERT INTO transactions (id_user, id_category, id_import, jenis, nominal, tanggal_transaksi, keterangan, penerima_tabungan)
         VALUES (?,?,?,?,?,?,?,?)`,
        [req.user.id, idCat, batch.insertId, r.jenis, r.nominal, r.tanggal_transaksi, r.keterangan, r.penerima_tabungan || null]
      );
      ok++;
    }
    await conn.commit();
    previews.delete(previewId);
    res.status(201).json({ message: 'Impor berhasil', id_import: batch.insertId, jumlah: ok, totals: pv.totals });
  } catch (e) {
    try { await conn.rollback(); } catch {}
    next(e);
  } finally {
    conn.release();
  }
}

async function history(req, res, next) {
  try {
    const [rows] = await pool.query('SELECT * FROM import_batches ORDER BY id_import DESC LIMIT 50');
    res.json({ data: rows });
  } catch (e) { next(e); }
}

async function detail(req, res, next) {
  try {
    const [[batch]] = await pool.query('SELECT * FROM import_batches WHERE id_import=?', [req.params.id]);
    if (!batch) return res.status(404).json({ message: 'Batch tidak ditemukan' });
    const [rows] = await pool.query('SELECT * FROM transactions WHERE id_import=? ORDER BY tanggal_transaksi', [req.params.id]);
    res.json({ batch, data: rows });
  } catch (e) { next(e); }
}

module.exports = { preview, confirm, history, detail };
