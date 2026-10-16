'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabaseBrowser } from '../../lib/supabase-client';
import { summarize } from '../../lib/supabase-server';
import { rupiah, fmtTanggal, labelJenis } from '../../lib/api';
import { Icon, ICO_JENIS } from '../../components/icons';

const BATAS_AWAL = 15;

// Rapikan tampilan saja (data tidak diubah): kapital tiap kata.
const rapiKeterangan = (s) =>
  String(s || '')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => (w[0] ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');

const isMasuk = (j) => j === 'income' || j === 'opening_balance';

export default function PublikPage() {
  const [sum, setSum] = useState(null);
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState('');
  const [view, setView] = useState('bendahara');
  const [q, setQ] = useState('');
  const [jenisFilter, setJenisFilter] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [semua, setSemua] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const sb = supabaseBrowser();
        const { data, error } = await sb
          .from('v_transaksi_publik')
          .select('tanggal,jenis,nominal,keterangan')
          .order('tanggal', { ascending: false })
          .limit(100);
        if (error) throw error;
        setRows(data || []);
        setSum(summarize(data || []));
      } catch (e) {
        setErr('Gagal memuat data kas.');
      }
    })();
  }, []);

  // Pemasukan 7 hari terakhir dari data yang tampil (tanpa statistik baru).
  const spark = useMemo(() => {
    const days = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      days.push(d);
    }
    const key = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return days.map((d) => {
      const k = key(d);
      const total = rows
        .filter((r) => String(r.tanggal || '').startsWith(k) && isMasuk(r.jenis))
        .reduce((a, r) => a + Number(r.nominal), 0);
      return { k, label: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }), total };
    });
  }, [rows]);

  const maksSpark = Math.max(...spark.map((s) => s.total), 1);
  const pctBendahara =
    sum && Number(sum.total_pemasukan) > 0 ? Math.round((Number(sum.uang_dibendahara ?? 0) / Number(sum.total_pemasukan)) * 100) : null;

  const tersaring = useMemo(() => {
    const kata = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (jenisFilter && r.jenis !== jenisFilter) return false;
      if (tanggal && !String(r.tanggal || '').startsWith(tanggal)) return false;
      if (kata && !String(r.keterangan || '').toLowerCase().includes(kata)) return false;
      return true;
    });
  }, [rows, q, jenisFilter, tanggal]);

  const filterAktif = q.trim() !== '' || jenisFilter !== '' || tanggal !== '';
  const tampil = semua || filterAktif ? tersaring : tersaring.slice(0, BATAS_AWAL);

  const resetFilter = () => {
    setQ('');
    setJenisFilter('');
    setTanggal('');
    setSemua(false);
  };

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
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link className="btn ghost unduh-publik" href="/unduh">
            <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}><Icon name="download" size={17} /> Download aplikasi</span>
          </Link>
          <Link className="btn" href="/login">
            <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}><Icon name="user" size={17} /> Masuk bendahara</span>
          </Link>
        </div>
      </div>
      {err && <div className="error">{err}</div>}

      <div className="hero-card">
        <div className="publik-hero">
          <div>
            <div className="seg" role="tablist" aria-label="Pilih tampil saldo">
              <button type="button" role="tab" aria-selected={view === 'bendahara'} className={`seg-btn${view === 'bendahara' ? ' active' : ''}`} onClick={() => setView('bendahara')}>Uang di Bendahara</button>
              <button type="button" role="tab" aria-selected={view === 'pemasukan'} className={`seg-btn${view === 'pemasukan' ? ' active' : ''}`} onClick={() => setView('pemasukan')}>Total Pemasukan</button>
            </div>
            <div className="hero-label">{view === 'bendahara' ? 'Uang di Bendahara • Publik' : 'Total Pemasukan • Publik'}</div>
            <div className="hero-value">{sum ? rupiah(view === 'bendahara' ? (sum.uang_dibendahara ?? sum.saldo_akhir) : (sum.total_pemasukan ?? sum.saldo_tersedia)) : '...'}</div>
            {pctBendahara !== null && <div className="hero-sub">{pctBendahara}% dari total pemasukan masih di bendahara.</div>}
          </div>
          <div className="publik-spark">
            <div className="label" style={{ marginBottom: 0 }}>Pemasukan 7 hari terakhir</div>
            <div className="publik-bars" role="img" aria-label="Grafik pemasukan 7 hari terakhir">
              {spark.map((s) => (
                <i key={s.k} title={`${s.label}: ${rupiah(s.total)}`} style={{ height: `${Math.max(7, (s.total / maksSpark) * 100)}%`, opacity: s.total > 0 ? 0.4 + 0.6 * (s.total / maksSpark) : 0.15 }} />
              ))}
            </div>
            <div className="label" style={{ marginTop: 6, marginBottom: 0 }}>{spark[0]?.label} – {spark[6]?.label} • dari data tampil</div>
          </div>
        </div>
      </div>

      <div className="fin-grid">
        <div className="card stat-card">
          <div className="stat-ico" style={{ background: 'rgba(47,163,107,.15)', color: '#2FA36B' }}><Icon name="in" size={26} /></div>
          <div style={{ minWidth: 0 }}>
            <div className="v">{sum ? rupiah(sum.total_pemasukan ?? sum.total_income) : '...'}</div>
            <div className="k">Total Pemasukan</div>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-ico" style={{ background: 'rgba(30,58,95,.1)', color: '#1E3A5F' }}><Icon name="out" size={26} /></div>
          <div style={{ minWidth: 0 }}>
            <div className="v">{sum ? rupiah(sum.total_expense) : '...'}</div>
            <div className="k">Total Pengeluaran</div>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-ico" style={{ background: 'rgba(190,134,28,.15)', color: '#BE861C' }}><Icon name="savings" size={26} /></div>
          <div style={{ minWidth: 0 }}>
            <div className="v">{sum ? rupiah(sum.total_savings) : '...'}</div>
            <div className="k">Total Tabungan</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Transaksi Terbaru</h3>
          <span className="label only-view" title="Anda hanya dapat melihat data, tidak dapat mengubahnya."><Icon name="lock" size={14} /> Hanya Lihat</span>
        </div>
        <div className="filters">
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari keterangan..." aria-label="Cari transaksi" />
          <select value={jenisFilter} onChange={(e) => setJenisFilter(e.target.value)} aria-label="Filter jenis transaksi">
            <option value="">Semua jenis</option>
            <option value="income">Pemasukan</option>
            <option value="expense">Pengeluaran</option>
            <option value="savings">Tabungan</option>
          </select>
          <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} aria-label="Filter tanggal" />
          {filterAktif && <button type="button" className="btn ghost" onClick={resetFilter}>Reset</button>}
        </div>
        <div className="label">Menampilkan {tampil.length} dari {tersaring.length} transaksi (100 terbaru).</div>
        {tampil.length ? tampil.map((t, i) => {
          const masuk = isMasuk(t.jenis);
          const merah = t.jenis === 'expense';
          return (
            <div className="tx-item" key={`${t.tanggal}-${t.nominal}-${i}`}>
              <div className={`tx-ico ${t.jenis}`}><Icon name={ICO_JENIS[t.jenis] || 'report'} size={20} /></div>
              <div className="tt"><b>{rapiKeterangan(t.keterangan)}</b><small>{fmtTanggal(t.tanggal)}</small></div>
              <span className={`badge ${t.jenis}`}>{labelJenis(t.jenis)}</span>
              <div className={`tx-amt ${masuk ? 'in' : 'out'}${merah ? ' neg' : ''}`}>{masuk ? '+' : '−'}{rupiah(t.nominal)}</div>
            </div>
          );
        }) : (
          <div className="label">
            {rows.length ? 'Tidak ada transaksi yang cocok. Ubah kata kunci atau filter.' : 'Belum ada data tampil. Jika kas sebenarnya ada, view publik belum dipasang.'}
          </div>
        )}
        {!filterAktif && tersaring.length > BATAS_AWAL && (
          <div style={{ marginTop: 12 }}>
            {semua ? (
              <button type="button" className="btn ghost" onClick={() => setSemua(false)}>Tampilkan lebih sedikit</button>
            ) : (
              <button type="button" className="btn ghost" onClick={() => setSemua(true)}>Lihat Semua Transaksi ({tersaring.length})</button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
