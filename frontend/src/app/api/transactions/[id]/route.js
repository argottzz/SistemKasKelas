import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(req, { params }) {
  try {
    const sb = supabaseServer();
    const { data, error } = await sb.from('transactions').delete().eq('id', params.id).select('id');
    if (error) throw error;
    if (!data || !data.length) return NextResponse.json({ message: 'Transaksi tidak ditemukan' }, { status: 404 });
    return NextResponse.json({ message: 'Transaksi dihapus' });
  } catch (e) {
    return NextResponse.json({ message: e.message || 'Gagal menghapus' }, { status: 500 });
  }
}
