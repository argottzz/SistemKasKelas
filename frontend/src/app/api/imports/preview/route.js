import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { requireSession } from '../../../../lib/supabase-route';
import { parseWorkbook, totalsOf } from '../../../../lib/excel';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { sb, user, allowed } = await requireSession();
    if (!user) return NextResponse.json({ message: 'Belum login.' }, { status: 401 });
    if (!allowed) return NextResponse.json({ message: 'Akses ditolak: email belum terdaftar sebagai bendahara.' }, { status: 403 });
    const form = await req.formData();
    const file = form.get('file');
    if (!file || typeof file.arrayBuffer !== 'function') {
      return NextResponse.json({ message: 'File Excel wajib diunggah (field: file)' }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ message: 'Ukuran file maksimal 5MB' }, { status: 400 });
    }
    const bytes = Buffer.from(await file.arrayBuffer());
    const fileHash = createHash('sha256').update(bytes).digest('hex');
    const { data: dup, error: e0 } = await sb.from('import_batches').select('id').eq('file_hash', fileHash).maybeSingle();
    if (e0) throw e0;
    if (dup) return NextResponse.json({ message: 'File ini sudah pernah diimpor (hash sama). Impor ganda ditolak.' }, { status: 409 });
    const ab = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    const { rows, errors } = parseWorkbook(ab);
    if (!rows.length) {
      return NextResponse.json({ message: 'Tidak ada baris valid. ' + errors.slice(0, 3).join(' ') }, { status: 400 });
    }
    const t = totalsOf(rows);
    return NextResponse.json({
      rows,
      errors: errors.slice(0, 50),
      totals: t,
      saldoHasil: t.saldo,
      fileHash,
      namaFile: file.name || 'upload.xlsx',
    });
  } catch (e) {
    return NextResponse.json({ message: e.message || 'Gagal memproses file' }, { status: 500 });
  }
}
