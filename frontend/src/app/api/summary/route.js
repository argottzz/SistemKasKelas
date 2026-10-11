import { NextResponse } from 'next/server';
import { supabaseServer, summarize } from '../../../lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const NO_STORE = { 'Cache-Control': 'no-store, no-cache, must-revalidate' };

export async function GET() {
  try {
    const sb = supabaseServer();
    const { data, error } = await sb.from('transactions').select('jenis,nominal');
    if (error) throw error;
    const s = summarize(data);
    return NextResponse.json(
      { ...s, peringatan_saldo_besar: s.saldo_tersedia > 1000000 },
      { headers: NO_STORE }
    );
  } catch (e) {
    return NextResponse.json(
      { message: e.message || 'Gagal memuat ringkasan' },
      { status: 500, headers: NO_STORE }
    );
  }
}
