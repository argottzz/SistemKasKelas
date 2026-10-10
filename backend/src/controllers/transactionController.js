const { supabase } = require('../config/supabase');
const { validateTransactionInput } = require('../services/transactionService');

function rejectCategory(id_category) {
  if (id_category !== undefined && id_category !== null && id_category !== '') {
    return 'Kategori belum didukung setelah migrasi Supabase (kolom tidak ada di tabel transactions)';
  }
  return null;
}

async function list(req, res, next) {
  try {
    const { jenis, startDate, endDate, q, page = 1, limit = 20 } = req.query;
    const p = Math.max(Number(page) || 1, 1);
    const l = Math.min(Math.max(Number(limit) || 20, 1), 100);
    let query = supabase.from('transactions').select('*', { count: 'exact' });
    if (jenis) query = query.eq('jenis', jenis);
    if (startDate) query = query.gte('tanggal', startDate);
    if (endDate) query = query.lte('tanggal', endDate);
    if (q) query = query.or(`keterangan.ilike.%${q}%,penerima.ilike.%${q}%`);
    query = query.order('tanggal', { ascending: false }).order('id', { ascending: false })
      .range((p - 1) * l, p * l - 1);
    const { data, count, error } = await query;
    if (error) throw error;
    res.json({ data, total: count, page: p, limit: l });
  } catch (e) { next(e); }
}

async function detail(req, res, next) {
  try {
    const { data, error } = await supabase.from('transactions').select('*').eq('id', req.params.id).single();
    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
    res.json(data);
  } catch (e) { next(e); }
}

async function create(req, res, next) {
  try {
    const { jenis, nominal, tanggal, tanggal_transaksi, keterangan, penerima, penerima_tabungan, id_category } = req.body || {};
    const catErr = rejectCategory(id_category);
    if (catErr) return res.status(400).json({ message: catErr });
    const input = {
      jenis,
      nominal,
      tanggal_transaksi: tanggal || tanggal_transaksi,
      keterangan,
      penerima_tabungan: penerima ?? penerima_tabungan ?? null,
    };
    const err = validateTransactionInput({ ...input, id_category: null });
    if (err) return res.status(400).json({ message: err });
    const { data, error } = await supabase.from('transactions').insert({
      jenis: input.jenis,
      nominal: input.nominal,
      tanggal: input.tanggal_transaksi,
      keterangan: String(input.keterangan).trim(),
      penerima: input.jenis === 'savings' ? String(input.penerima_tabungan).trim() : null,
    }).select('*').single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (e) { next(e); }
}

async function update(req, res, next) {
  try {
    const { data: old, error: e0 } = await supabase.from('transactions').select('*').eq('id', req.params.id).single();
    if (e0 && e0.code !== 'PGRST116') throw e0;
    if (!old) return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
    if (req.user.role !== 'bendahara' && old.id_user !== req.user.id) {
      return res.status(403).json({ message: 'Pengurus hanya boleh mengubah catatannya sendiri' });
    }
    const b = req.body || {};
    if (b.id_category !== undefined && b.id_category !== null && b.id_category !== '') {
      return res.status(400).json({ message: 'Kategori belum didukung setelah migrasi Supabase' });
    }
    const merged = {
      jenis: b.jenis ?? old.jenis,
      nominal: b.nominal ?? old.nominal,
      tanggal_transaksi: b.tanggal ?? b.tanggal_transaksi ?? old.tanggal,
      keterangan: b.keterangan ?? old.keterangan,
      penerima_tabungan: (b.penerima ?? b.penerima_tabungan) !== undefined
        ? (b.penerima ?? b.penerima_tabungan) : old.penerima,
      id_category: null,
    };
    if (merged.penerima_tabungan === '') merged.penerima_tabungan = null;
    const err = validateTransactionInput(merged);
    if (err) return res.status(400).json({ message: err });
    const { data, error } = await supabase.from('transactions').update({
      jenis: merged.jenis,
      nominal: merged.nominal,
      tanggal: merged.tanggal_transaksi,
      keterangan: String(merged.keterangan).trim(),
      penerima: merged.jenis === 'savings' ? String(merged.penerima_tabungan).trim() : null,
    }).eq('id', req.params.id).select('*').single();
    if (error) throw error;
    res.json(data);
  } catch (e) { next(e); }
}

async function remove(req, res, next) {
  try {
    if (req.user.role !== 'bendahara') return res.status(403).json({ message: 'Hanya bendahara yang boleh menghapus' });
    const { data, error } = await supabase.from('transactions').delete().eq('id', req.params.id).select('id');
    if (error) throw error;
    if (!data || !data.length) return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
    res.json({ message: 'Transaksi dihapus' });
  } catch (e) { next(e); }
}

module.exports = { list, detail, create, update, remove };
