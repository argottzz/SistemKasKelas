import { NextResponse } from 'next/server';
import { supabaseServer, summarize } from '../../../lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sb = supabaseServer();
    const { data, error } = await sb.from('transactions').select('jenis,nominal');
    if (error) throw error;
    const s = summarize(data);
    return NextResponse.json({ ...s, peringatan_saldo_besar: s.saldo_tersedia > 1000000 });
  } catch (e) {
    return NextResponse.json({ message: e.message || 'Gagal memuat ringkasan' }, { status: 500 });
  }
}
