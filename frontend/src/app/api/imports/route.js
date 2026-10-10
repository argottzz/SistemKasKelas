import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sb = supabaseServer();
    const { data, error } = await sb.from('import_batches').select('*').order('id', { ascending: false }).limit(50);
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json({ message: e.message || 'Gagal memuat riwayat' }, { status: 500 });
  }
}
