const crypto = require('crypto');
const { supabase } = require('../config/supabase');
const { previews, sha256, parseWorkbook, totals } = require('../services/importService');

async function preview(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ message: 'File Excel wajib diunggah (field: file)' });
    if (req.file.size > 5 * 1024 * 1024) return res.status(400).json({ message: 'Ukuran file maksimal 5MB' });
    const fileHash = sha256(req.file.buffer);
    const { data: dup, error: e0 } = await supabase.from('import_batches').select('id').eq('file_hash', fileHash).maybeSingle();
    if (e0) throw e0;
    if (dup) return res.status(409).json({ message: 'File ini sudah pernah diimpor (hash sama). Impor ganda ditolak.' });
    const { rows, errors } = await parseWorkbook(req.file.buffer);
    const t = totals(rows);
    const previewId = crypto.randomUUID();
    previews.set(previewId, { rows, totals: t, fileHash, namaFile: req.file.originalname, createdAt: Date.now() });
    setTimeout(() => previews.delete(previewId), 30 * 60 * 1000);
    // totals.saldo = uang di bendahara (cash). totals.total_pemasukan = aset (M14).
    const TABUNGAN_BAWAAN = 5200000;
    const uang_dibendahara = t.opening + t.income - t.expense - t.savings;
    const total_savings = t.savings + TABUNGAN_BAWAAN;
    const total_pemasukan = uang_dibendahara + total_savings;
    res.json({
      previewId,
      fileHash,
      jumlahValid: rows.length,
      jumlahError: errors.length,
      errors: errors.slice(0, 50),
      totals: { ...t, total_savings, total_pemasukan, uang_dibendahara },
      saldoHasil: uang_dibendahara,
      totalPemasukan: total_pemasukan,
      sample: rows.slice(0, 10),
    });
  } catch (e) { next(e); }
}

async function confirm(req, res, next) {
  try {
    const { previewId } = req.body || {};
    const pv = previews.get(previewId);
    if (!pv) return res.status(400).json({ message: 'Preview kedaluwarsa / tidak ditemukan. Unggah ulang.' });
    const { data: dup, error: e0 } = await supabase.from('import_batches').select('id').eq('file_hash', pv.fileHash).maybeSingle();
    if (e0) throw e0;
    if (dup) return res.status(409).json({ message: 'Sudah diimpor sebelumnya (hash sama)' });

    const { data: batch, error: e1 } = await supabase.from('import_batches')
      .insert({ nama_file: pv.namaFile, file_hash: pv.fileHash, jumlah: pv.rows.length })
      .select('id').single();
    if (e1) throw e1;
    let ok = 0;
    for (const r of pv.rows) {
      const { error } = await supabase.from('transactions').insert({
        import_id: batch.id,
        jenis: r.jenis,
        nominal: r.nominal,
        tanggal: r.tanggal_transaksi,
        keterangan: r.keterangan,
        penerima: r.penerima_tabungan || null,
      });
      if (error) throw error;
      ok++;
    }
    previews.delete(previewId);
    res.status(201).json({ message: 'Impor berhasil', id_import: batch.id, jumlah: ok, totals: pv.totals });
  } catch (e) { next(e); }
}

async function history(req, res, next) {
  try {
    const { data, error } = await supabase.from('import_batches').select('*').order('id', { ascending: false }).limit(50);
    if (error) throw error;
    res.json({ data });
  } catch (e) { next(e); }
}

async function detail(req, res, next) {
  try {
    const { data: batch, error: e0 } = await supabase.from('import_batches').select('*').eq('id', req.params.id).single();
    if (e0 && e0.code !== 'PGRST116') throw e0;
    if (!batch) return res.status(404).json({ message: 'Batch tidak ditemukan' });
    const { data: rows, error: e1 } = await supabase.from('transactions').select('*').eq('import_id', req.params.id).order('tanggal');
    if (e1) throw e1;
    res.json({ batch, data: rows });
  } catch (e) { next(e); }
}

module.exports = { preview, confirm, history, detail };
