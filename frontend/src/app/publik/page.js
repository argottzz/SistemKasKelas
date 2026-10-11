'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabaseBrowser } from '../../lib/supabase-client';
import { summarize } from '../../lib/supabase-server';
import { rupiah, fmtTanggal, labelJenis } from '../../lib/api';
import { Icon, ICO_JENIS } from '../../components/icons';

export default function PublikPage() {
  const [sum, setSum] = useState(null);
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const sb = supabaseBrowser();
        const { data, error } = await sb
          .from('transactions')
          .select('*')
          .order('tanggal', { ascending: false })
          .order('id', { ascending: false })
          .limit(100);
        if (error) throw error;
        setRows(data || []);
        setSum(summarize(data || []));
      } catch (e) {
        setErr('Gagal memuat data kas.');
      }
    })();
  }, []);

  const recent = rows.slice(0, 15);

  return (
    <>
      <div className="page-head">
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <img src="/logo.png" alt="KasSave" className="brand-logo" style={{ width: 40, height: 40 }} />
          <div>
            <h2>Kas Kelas — Publik</h2>
            <div className="greet-sub">Lihat saldo & laporan. Tanpa login, tanpa ubah data.</div>
          </div>
        </div>
        <Link className="btn ghost" href="/login">Masuk bendahara</Link>
      </div>
      {err && <div className="error">{err}</div>}

      <div className="hero-card">
        <div>
          <div className="hero-label">Saldo Tersedia</div>
          <div className="hero-value">{sum ? rupiah(sum.saldo_tersedia) : '...'}</div>
          <div className="hero-sub">Saldo awal {sum ? rupiah(sum.opening_balance) : '...'} • {sum?.jumlah_transaksi ?? '...'} transaksi</div>
        </div>
      </div>

      <div className="fin-grid">
        <div className="card stat-card">
          <div className="stat-ico" style={{ background: 'rgba(47,163,107,.15)', color: '#2FA36B' }}><Icon name="in" size={22} /></div>
          <div style={{ minWidth: 0 }}>
            <div className="v">{sum ? rupiah(sum.total_income) : '...'}</div>
            <div className="k">Total Pemasukan</div>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-ico" style={{ background: 'rgba(30,58,95,.1)', color: '#1E3A5F' }}><Icon name="out" size={22} /></div>
          <div style={{ minWidth: 0 }}>
            <div className="v">{sum ? rupiah(sum.total_expense) : '...'}</div>
            <div className="k">Total Pengeluaran</div>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-ico" style={{ background: 'rgba(190,134,28,.15)', color: '#BE861C' }}><Icon name="savings" size={22} /></div>
          <div style={{ minWidth: 0 }}>
            <div className="v">{sum ? rupiah(sum.total_savings) : '...'}</div>
            <div className="k">Total Tabungan</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Transaksi Terbaru</h3><span className="label">read-only</span></div>
        {recent.length ? recent.map((t) => (
          <div className="tx-item" key={t.id}>
            <div className={`tx-ico ${t.jenis}`}><Icon name={ICO_JENIS[t.jenis] || 'report'} size={20} /></div>
            <div className="tt"><b>{t.keterangan}{t.penerima ? ` → ${t.penerima}` : ''}</b><small>{fmtTanggal(t.tanggal)}</small></div>
            <span className={`badge ${t.jenis}`}>{labelJenis(t.jenis)}</span>
            <div className={`tx-amt ${t.jenis === 'income' || t.jenis === 'opening_balance' ? 'in' : 'out'}`}>{rupiah(t.nominal)}</div>
          </div>
        )) : <div className="label">Belum ada data tampil. Jika kas sebenarnya ada, policy baca publik belum dipasang.</div>}
      </div>
    </>
  );
}
