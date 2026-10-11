import { NextResponse } from 'next/server';
import { requireSession } from '../../../../lib/supabase-route';
import { validateTx } from '../../../../lib/validate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function errJson(message, code, status) {
  return NextResponse.json({ message, error: { code, message } }, { status });
}

const ALLOWED = ['jenis', 'nominal', 'tanggal', 'keterangan', 'penerima', 'kategori'];

// PATCH partial: hanya field yang dikirim yang berubah (validasi gabungan di boundary).
export async function PATCH(req, { params }) {
  try {
    const { sb, user } = await requireSession();
    if (!user) return errJson('Belum login.', 'UNAUTHORIZED', 401);
    const b = await req.json();

    const { data: existing, error: findErr } = await sb
      .from('transactions')
      .select('*')
      .eq('id', params.id)
      .single();
    if (findErr || !existing) return errJson('Transaksi tidak ditemukan', 'NOT_FOUND', 404);

    const patch = {};
    for (const k of ALLOWED) {
      if (b[k] !== undefined) patch[k] = b[k];
    }
    if (Object.keys(patch).length === 0) return errJson('Tidak ada field yang diubah', 'VALIDATION_ERROR', 400);

    const merged = {
      jenis: patch.jenis !== undefined ? patch.jenis : existing.jenis,
      nominal: patch.nominal !== undefined ? patch.nominal : existing.nominal,
      tanggal: patch.tanggal !== undefined ? patch.tanggal : existing.tanggal,
      keterangan: patch.keterangan !== undefined ? patch.keterangan : existing.keterangan,
      penerima:
        (patch.jenis !== undefined ? patch.jenis : existing.jenis) === 'savings'
          ? (patch.penerima !== undefined ? patch.penerima : existing.penerima)
          : null,
      kategori: patch.kategori !== undefined ? patch.kategori : existing.kategori ?? null,
    };
    // Normalisasi kategori kosong -> null agar tidak menumpuk string kosong.
    if (merged.kategori !== null && merged.kategori !== undefined && String(merged.kategori).trim() === '') {
      merged.kategori = null;
    }

    const err = validateTx(merged);
    if (err) return errJson(err, 'VALIDATION_ERROR', 400);

    const update = {
      jenis: merged.jenis,
      nominal: Number(merged.nominal),
      tanggal: merged.tanggal,
      keterangan: String(merged.keterangan).trim(),
      penerima: merged.jenis === 'savings' ? String(merged.penerima).trim() : null,
    };
    if (merged.kategori) update.kategori = merged.kategori;

    let { data, error } = await sb.from('transactions').update(update).eq('id', params.id).select('*').single();
    if (error && /kategori/i.test(error.message || '')) {
      delete update.kategori;
      ({ data, error } = await sb.from('transactions').update(update).eq('id', params.id).select('*').single());
    }
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) {
    return errJson(e.message || 'Gagal mengubah', 'SERVER_ERROR', 500);
  }
}

export async function DELETE(req, { params }) {
  try {
    const { sb, user } = await requireSession();
    if (!user) return errJson('Belum login.', 'UNAUTHORIZED', 401);
    const { data, error } = await sb.from('transactions').delete().eq('id', params.id).select('id');
    if (error) throw error;
    if (!data || !data.length) return errJson('Transaksi tidak ditemukan', 'NOT_FOUND', 404);
    return NextResponse.json({ message: 'Transaksi dihapus' });
  } catch (e) {
    return errJson(e.message || 'Gagal menghapus', 'SERVER_ERROR', 500);
  }
}
