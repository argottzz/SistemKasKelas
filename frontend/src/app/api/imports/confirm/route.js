import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabase-server';
import { norm, keyOf } from '../../../../lib/validate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const sb = supabaseServer();
    const { namaFile, fileHash, rows } = await req.json();
    if (!fileHash || !Array.isArray(rows) || !rows.length) {
      return NextResponse.json({ message: 'Data konfirmasi tidak lengkap' }, { status: 400 });
    }
    const { data: dup, error: e0 } = await sb.from('import_batches').select('id').eq('file_hash', fileHash).maybeSingle();
    if (e0) throw e0;
    if (dup) return NextResponse.json({ message: 'Sudah diimpor sebelumnya (hash sama)' }, { status: 409 });

    const { data: existing, error: e1 } = await sb.from('transactions').select('tanggal,jenis,nominal,keterangan');
    if (e1) throw e1;
    const have = new Set(existing.map(keyOf));
    const haveSavings = new Set(
      existing.filter((r) => r.jenis === 'savings').map((r) => `${r.tanggal}|${Number(r.nominal)}`)
    );
    const { data: openings } = await sb.from('transactions').select('id').eq('jenis', 'opening_balance').limit(1);
    const hasOpening = openings && openings.length > 0;

    const fresh = rows.filter((r) => {
      if (r.jenis === 'opening_balance' && hasOpening) return false;
      if (r.jenis === 'savings' && haveSavings.has(`${r.tanggal}|${Number(r.nominal)}`)) return false;
      return !have.has(keyOf(r));
    });

    const { data: batch, error: e2 } = await sb.from('import_batches')
      .insert({ nama_file: namaFile || 'upload.xlsx', file_hash: fileHash, jumlah: fresh.length })
      .select('id').single();
    if (e2) throw e2;

    let ok = 0;
    for (const r of fresh) {
      const { error } = await sb.from('transactions').insert({
        import_id: batch.id,
        jenis: r.jenis,
        nominal: Number(r.nominal),
        tanggal: r.tanggal,
        keterangan: String(r.keterangan || '').trim() || 'Impor Excel',
        penerima: r.jenis === 'savings' ? (String(r.penerima || '').trim() || 'Tabungan kelas') : null,
      });
      if (error) throw error;
      ok++;
    }
    return NextResponse.json({ message: 'Impor berhasil', id_import: batch.id, jumlah: ok }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ message: e.message || 'Gagal menyimpan impor' }, { status: 500 });
  }
}
