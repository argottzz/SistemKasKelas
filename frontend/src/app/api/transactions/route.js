import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabase-server';
import { validateTx } from '../../../lib/validate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const sb = supabaseServer();
    const sp = req.nextUrl.searchParams;
    const jenis = sp.get('jenis');
    const q = sp.get('q');
    const startDate = sp.get('startDate');
    const endDate = sp.get('endDate');
    const limit = Math.min(Math.max(Number(sp.get('limit')) || 500, 1), 1000);
    let query = sb.from('transactions').select('*', { count: 'exact' });
    if (jenis) query = query.eq('jenis', jenis);
    if (startDate) query = query.gte('tanggal', startDate);
    if (endDate) query = query.lte('tanggal', endDate);
    if (q) query = query.or(`keterangan.ilike.%${q}%,penerima.ilike.%${q}%`);
    query = query.order('tanggal', { ascending: false }).order('id', { ascending: false }).limit(limit);
    const { data, count, error } = await query;
    if (error) throw error;
    return NextResponse.json({ data, total: count });
  } catch (e) {
    return NextResponse.json({ message: e.message || 'Gagal memuat transaksi' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const sb = supabaseServer();
    const b = await req.json();
    const input = {
      jenis: b.jenis,
      nominal: b.nominal,
      tanggal: b.tanggal,
      keterangan: b.keterangan,
      penerima: b.jenis === 'savings' ? (b.penerima ?? null) : null,
    };
    const err = validateTx(input);
    if (err) return NextResponse.json({ message: err }, { status: 400 });
    const { data, error } = await sb.from('transactions').insert({
      jenis: input.jenis,
      nominal: Number(input.nominal),
      tanggal: input.tanggal,
      keterangan: String(input.keterangan).trim(),
      penerima: input.jenis === 'savings' ? String(input.penerima).trim() : null,
    }).select('*').single();
    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    return NextResponse.json({ message: e.message || 'Gagal menyimpan' }, { status: 500 });
  }
}
