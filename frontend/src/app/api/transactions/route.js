import { NextResponse } from 'next/server';
import { requireSession } from '../../../lib/supabase-route';
import { validateTx } from '../../../lib/validate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const NO_STORE = { 'Cache-Control': 'no-store, no-cache, must-revalidate' };

// Bentuk error konsisten: { message, error: { code, message } }.
// Field `message` dipertahankan agar UI lama tetap jalan (aditif).
function errJson(message, code, status) {
  return NextResponse.json({ message, error: { code, message } }, { status, headers: NO_STORE });
}

const clamp = (n, min, max, fb) => {
  const v = Number(n);
  if (!Number.isFinite(v)) return fb;
  return Math.min(Math.max(Math.floor(v), min), max);
};

function normKategori(v) {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
}

export async function GET(req) {
  try {
    const { sb, user } = await requireSession();
    if (!user) return errJson('Belum login.', 'UNAUTHORIZED', 401);
    const sp = req.nextUrl.searchParams;
    const jenis = sp.get('jenis');
    const q = sp.get('q');
    const kategori = sp.get('kategori');
    const startDate = sp.get('startDate');
    const endDate = sp.get('endDate');
    // Pagination aditif: bila page/pageSize tidak dikirim, perilaku lama (limit) dipakai.
    const hasPaging = sp.has('page') || sp.has('pageSize');
    const page = clamp(sp.get('page'), 1, 100000, 1);
    const pageSize = clamp(sp.get('pageSize'), 1, 100, hasPaging ? 20 : 500);
    const limit = clamp(sp.get('limit'), 1, 1000, 500);

    let query = sb.from('transactions').select('*', { count: 'exact' });
    if (jenis) query = query.eq('jenis', jenis);
    if (kategori) query = query.eq('kategori', kategori);
    if (startDate) query = query.gte('tanggal', startDate);
    if (endDate) query = query.lte('tanggal', endDate);
    if (q) query = query.or(`keterangan.ilike.%${q}%,penerima.ilike.%${q}%`);
    query = query.order('tanggal', { ascending: false }).order('id', { ascending: false });

    if (hasPaging) {
      const from = (page - 1) * pageSize;
      query = query.range(from, from + pageSize - 1);
    } else {
      query = query.limit(limit);
    }

    let { data, count, error } = await query;
    // Kolom kategori belum ada di DB lama -> ulangi tanpa filter kategori (fallback).
    if (error && /kategori/i.test(error.message || '')) {
      let retry = sb.from('transactions').select('*', { count: 'exact' });
      if (jenis) retry = retry.eq('jenis', jenis);
      if (startDate) retry = retry.gte('tanggal', startDate);
      if (endDate) retry = retry.lte('tanggal', endDate);
      if (q) retry = retry.or(`keterangan.ilike.%${q}%,penerima.ilike.%${q}%`);
      retry = retry.order('tanggal', { ascending: false }).order('id', { ascending: false });
      if (hasPaging) {
        const from = (page - 1) * pageSize;
        retry = retry.range(from, from + pageSize - 1);
      } else {
        retry = retry.limit(limit);
      }
      ({ data, count, error } = await retry);
    }
    if (error) throw error;

    const totalItems = count ?? (data || []).length;
    const size = hasPaging ? pageSize : limit;
    const body = { data, total: totalItems };
    // Selalu sertakan pagination (aditif) agar UI baru bisa pakai total halaman.
    body.pagination = hasPaging
      ? { page, pageSize, totalItems, totalPages: Math.max(1, Math.ceil(totalItems / pageSize)) }
      : { page: 1, pageSize: size, totalItems, totalPages: 1 };
    return NextResponse.json(body, { headers: NO_STORE });
  } catch (e) {
    return errJson(e.message || 'Gagal memuat transaksi', 'SERVER_ERROR', 500);
  }
}

export async function POST(req) {
  try {
    const { sb, user } = await requireSession();
    if (!user) return errJson('Belum login.', 'UNAUTHORIZED', 401);
    const b = await req.json();
    const input = {
      jenis: b.jenis,
      nominal: b.nominal,
      tanggal: b.tanggal,
      keterangan: b.keterangan,
      penerima: b.jenis === 'savings' ? (b.penerima ?? null) : null,
      kategori: normKategori(b.kategori),
    };
    const err = validateTx(input);
    if (err) return errJson(err, 'VALIDATION_ERROR', 400);

    const row = {
      jenis: input.jenis,
      nominal: Number(input.nominal),
      tanggal: input.tanggal,
      keterangan: String(input.keterangan).trim(),
      penerima: input.jenis === 'savings' ? String(input.penerima).trim() : null,
    };
    if (input.kategori) row.kategori = input.kategori;

    let { data, error } = await sb.from('transactions').insert(row).select('*').single();
    // DB lama tanpa kolom kategori -> simpan tanpa kategori.
    if (error && /kategori/i.test(error.message || '')) {
      delete row.kategori;
      ({ data, error } = await sb.from('transactions').insert(row).select('*').single());
    }
    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    return errJson(e.message || 'Gagal menyimpan', 'SERVER_ERROR', 500);
  }
}
