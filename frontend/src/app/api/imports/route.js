import { NextResponse } from 'next/server';
import { requireSession } from '../../../lib/supabase-route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { sb, user, allowed } = await requireSession();
    if (!user) return NextResponse.json({ message: 'Belum login.' }, { status: 401 });
    if (!allowed) return NextResponse.json({ message: 'Akses ditolak: email belum terdaftar sebagai bendahara.' }, { status: 403 });
    const { data, error } = await sb.from('import_batches').select('*').order('id', { ascending: false }).limit(50);
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json({ message: e.message || 'Gagal memuat riwayat' }, { status: 500 });
  }
}
