'use client';
import { useEffect, useMemo, useState } from 'react';
import { getProfile } from '../../lib/store';
import { useProfile } from '../../context/ProfileContext';
import { useTheme } from '../../context/ThemeContext';
import { Avatar } from '../../components/Sidebar';
import { Icon, ICO_JENIS } from '../../components/icons';
import { useToast } from '../../components/Toast';
import { rupiah, fmtTanggal, labelJenis } from '../../lib/api';

function fileToResizedDataURL(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const max = 256;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const cv = document.createElement('canvas');
      cv.width = w; cv.height = h;
      cv.getContext('2d').drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(cv.toDataURL('image/jpeg', 0.72));
    };
    img.onerror = () => reject(new Error('File bukan gambar yang valid'));
    img.src = url;
  });
}

function monthKeys(n) {
  const out = [];
  const d = new Date();
  d.setDate(1);
  for (let i = n - 1; i >= 0; i--) {
    const t = new Date(d.getFullYear(), d.getMonth() - i, 1);
    out.push(`${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}`);
  }
  return out;
}

function MiniBars({ vals, color }) {
  const mx = Math.max(...vals, 1);
  return (
    <div className="mini-bars" aria-hidden="true">
      {vals.map((v, i) => (
        <i key={i} style={{ height: `${Math.max(8, (v / mx) * 100)}%`, background: color, opacity: v > 0 ? 0.35 + 0.65 * (v / mx) : 0.15 }} />
      ))}
    </div>
  );
}

export default function ProfilPage() {
  const { profile, save } = useProfile();
  const { theme, setTheme } = useTheme() || {};
  const toast = useToast();
  const [nama, setNama] = useState('');
  const [foto, setFoto] = useState(null);
  const [err, setErr] = useState('');
  const [sum, setSum] = useState(null);
  const [rows, setRows] = useState([]);
  const [tab, setTab] = useState('tx');

  useEffect(() => {
    const p = getProfile();
    setNama(p.nama || '');
    setFoto(p.foto || null);
  }, [profile]);

  useEffect(() => {
    (async () => {
      try {
        const s = await fetch('/api/summary', { cache: 'no-store' });
        if (s.ok) setSum(await s.json());
        const t = await fetch('/api/transactions?limit=1000', { cache: 'no-store' });
        if (t.ok) setRows((await t.json()).data || []);
      } catch {}
    })();
  }, []);

  const pilihFoto = async (f) => {
    setErr('');
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { setErr('Ukuran foto maksimal 5MB'); return; }
    try {
      setFoto(await fileToResizedDataURL(f));
    } catch (e) {
      setErr(e.message);
    }
  };

  const simpan = (e) => {
    e.preventDefault();
    setErr('');
    if (!nama.trim()) { setErr('Nama wajib diisi'); return; }
    save(nama, foto);
    toast?.show('Profil tersimpan.');
  };

  const inflow = (sum?.opening_balance || 0) + (sum?.total_income || 0);
  const pct = (v) => (inflow > 0 ? Math.round(((v || 0) / inflow) * 100) : 0);

  const keys = useMemo(() => monthKeys(5), []);
  const monthly = useMemo(() => {
    const m = { income: [], expense: [], net: [] };
    for (const k of keys) {
      const list = rows.filter((r) => String(r.tanggal || '').startsWith(k));
      const inc = list.filter((r) => r.jenis === 'income' || r.jenis === 'opening_balance').reduce((a, r) => a + Number(r.nominal), 0);
      const out = list.filter((r) => r.jenis === 'expense' || r.jenis === 'savings').reduce((a, r) => a + Number(r.nominal), 0);
      m.income.push(list.filter((r) => r.jenis === 'income').reduce((a, r) => a + Number(r.nominal), 0));
      m.expense.push(list.filter((r) => r.jenis === 'expense').reduce((a, r) => a + Number(r.nominal), 0));
      m.net.push(Math.max(0, inc - out));
    }
    return m;
  }, [rows, keys]);

  const recent = rows.slice(0, 6);
  const riwayat = rows.slice(0, 8);

  const stats = [
    { label: 'Saldo Tersedia', value: sum ? rupiah(sum.saldo_tersedia) : '...', sub: `${pct(sum?.saldo_tersedia)}% dari dana masuk`, vals: monthly.net, color: '#3F72AF' },
    { label: 'Total Pemasukan', value: sum ? rupiah(sum.total_income) : '...', sub: `${pct(sum?.total_income)}% dari dana masuk`, vals: monthly.income, color: '#7C5CBF' },
    { label: 'Total Pengeluaran', value: sum ? rupiah(sum.total_expense) : '...', sub: `${pct(sum?.total_expense)}% dari dana masuk`, vals: monthly.expense, color: '#E8833A' },
  ];

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Profil Bendahara</h2>
          <div className="greet-sub">Identitas + ringkasan kas kelas dalam satu layar.</div>
        </div>
      </div>
      {err && <div className="error">{err}</div>}

      <div className="prof-grid">
        <div className="card prof-card">
          <div className="prof-avatar"><Avatar nama={nama} foto={foto} size={96} /></div>
          <div className="prof-name">{nama || '(belum ada nama)'}</div>
          <span className="badge savings">Bendahara Kelas</span>
          <div className="prof-info">
            <div className="row"><div className="k">Nama</div><div className="v">{nama || '—'}</div></div>
            <div className="row"><div className="k">Peran</div><div className="v">Bendahara Kelas</div></div>
            <div className="row"><div className="k">Data profil</div><div className="v">Tersimpan di perangkat ini</div></div>
          </div>
          <form onSubmit={simpan} style={{ display: 'grid', gap: 10, textAlign: 'left' }}>
            <label className="fld">Nama
              <input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="cth: Arga" maxLength={100} required />
            </label>
            <label className="fld">Foto profil
              <input type="file" accept="image/*" onChange={(e) => pilihFoto(e.target.files?.[0])} />
            </label>
            {foto && <button type="button" className="btn ghost" onClick={() => setFoto(null)}>Hapus foto</button>}
            <div>
              <div className="label" style={{ marginBottom: 6 }}>Tampilan</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {['light', 'dark'].map((t) => (
                  <button key={t} type="button" className={theme === t ? 'btn' : 'btn ghost'} onClick={() => setTheme?.(t)}>
                    <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}><Icon name={t === 'light' ? 'sun' : 'moon'} size={17} /> {t === 'light' ? 'Terang' : 'Gelap'}</span>
                  </button>
                ))}
              </div>
            </div>
            <button className="btn"><span style={{ display: 'inline-flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}><Icon name="user" size={17} /> Simpan Profil</span></button>
          </form>
          <div className="label" style={{ marginTop: 10, marginBottom: 0 }}>KasSave • data transaksi di server, profil di perangkat ini.</div>
        </div>

        <div style={{ display: 'grid', gap: 16, minWidth: 0 }}>
          <div className="mini-grid">
            {stats.map((s) => (
              <div className="card mini-card" key={s.label}>
                <div className="mini-num" style={{ color: s.color }}>{s.value}</div>
                <div style={{ fontWeight: 600, fontSize: 14, margin: '2px 0 6px' }}>{s.label}</div>
                <MiniBars vals={s.vals} color={s.color} />
                <div className="label" style={{ marginTop: 6, marginBottom: 0 }}>{s.sub} • 5 bulan</div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="prof-tabs">
              <button type="button" className={`prof-tab${tab === 'tx' ? ' active' : ''}`} onClick={() => setTab('tx')}>Transaksi</button>
              <button type="button" className={`prof-tab${tab === 'sum' ? ' active' : ''}`} onClick={() => setTab('sum')}>Ringkasan</button>
            </div>
            {tab === 'tx' ? (
              recent.length ? recent.map((t) => (
                <div className="tx-item" key={t.id}>
                  <div className={`tx-ico ${t.jenis}`}><Icon name={ICO_JENIS[t.jenis] || 'report'} size={20} /></div>
                  <div className="tt"><b>{t.keterangan}{t.penerima ? ` → ${t.penerima}` : ''}</b><small>{fmtTanggal(t.tanggal)}</small></div>
                  <span className={`badge ${t.jenis}`}>{labelJenis(t.jenis)}</span>
                  <div className={`tx-amt ${t.jenis === 'income' || t.jenis === 'opening_balance' ? 'in' : 'out'}`}>{rupiah(t.nominal)}</div>
                </div>
              )) : <div className="label">Belum ada transaksi.</div>
            ) : (
              <div className="prof-sum">
                <div className="row"><span>Saldo awal</span><b>{sum ? rupiah(sum.opening_balance) : '...'}</b></div>
                <div className="row"><span>Total pemasukan</span><b>{sum ? rupiah(sum.total_income) : '...'}</b></div>
                <div className="row"><span>Total pengeluaran</span><b>{sum ? rupiah(sum.total_expense) : '...'}</b></div>
                <div className="row"><span>Tabungan di guru</span><b>{sum ? rupiah(sum.total_savings) : '...'}</b></div>
                <div className="row total"><span>Saldo tersedia</span><b>{sum ? rupiah(sum.saldo_tersedia) : '...'}</b></div>
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-head"><h3>Riwayat Terakhir</h3><span className="label">{sum?.jumlah_transaksi ?? '...'} transaksi</span></div>
            <div className="table-wrap" style={{ boxShadow: 'none', border: 0 }}>
              <table>
                <thead><tr><th>Tanggal</th><th>Keterangan</th><th>Nominal</th><th>Jenis</th></tr></thead>
                <tbody>
                  {riwayat.map((t) => (
                    <tr key={t.id}>
                      <td data-label="Tanggal">{fmtTanggal(t.tanggal)}</td>
                      <td data-label="Keterangan">{t.keterangan}{t.penerima ? ` → ${t.penerima}` : ''}</td>
                      <td data-label="Nominal">{rupiah(t.nominal)}</td>
                      <td data-label="Jenis"><span className={`badge ${t.jenis}`}>{labelJenis(t.jenis)}</span></td>
                    </tr>
                  ))}
                  {riwayat.length === 0 && <tr><td colSpan={4}>Belum ada data.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
