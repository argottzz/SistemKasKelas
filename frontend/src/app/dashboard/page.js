'use client';
import { useEffect, useMemo, useState } from 'react';
import { rupiah, fmtTanggal } from '../../lib/api';
import { downloadExcel } from '../../lib/excel';
import { useProfile } from '../../context/ProfileContext';
import { MonthlyFlow, WeekBars, Gauge } from '../../components/Charts';
import TransactionModal from '../../components/TransactionModal';
import { Icon, ICO_JENIS } from '../../components/icons';

function salam() {
  const h = new Date().getHours();
  if (h < 11) return 'Selamat pagi';
  if (h < 15) return 'Selamat siang';
  if (h < 19) return 'Selamat sore';
  return 'Selamat malam';
}

function groupLabel(iso) {
  const t = new Date();
  const today = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  const y = new Date(t.getTime() - 864e5);
  const yest = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`;
  if (iso === today) return 'Hari ini';
  if (iso === yest) return 'Kemarin';
  return fmtTanggal(iso);
}

export default function DashboardPage() {
  const { profile } = useProfile();
  const [sum, setSum] = useState(null);
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalJenis, setModalJenis] = useState('income');
  const [month, setMonth] = useState('');
  const [range, setRange] = useState(7);
  // 2 opsi tampil: uang tunai di tangan vs total aset (pemasukan ringkas).
  const [view, setView] = useState('bendahara');

  const load = async () => {
    try {
      setErr('');
      const sRes = await fetch('/api/summary', { cache: 'no-store' });
      if (!sRes.ok) throw new Error(`Gagal memuat ringkasan (HTTP ${sRes.status})`);
      const tRes = await fetch('/api/transactions?limit=1000', { cache: 'no-store' });
      if (!tRes.ok) throw new Error(`Gagal memuat transaksi (HTTP ${tRes.status})`);
      setSum(await sRes.json());
      setRows((await tRes.json()).data || []);
    } catch (e) {
      setErr(e.message);
    }
  };

  useEffect(() => { load(); }, []);

  // Agregat 12 bulan terakhir: masuk, keluar, tabungan, bersih per bulan.
  const flowMonths = useMemo(() => {
    const out = [];
    const base = new Date();
    base.setDate(1);
    for (let i = 11; i >= 0; i--) {
      const t = new Date(base.getFullYear(), base.getMonth() - i, 1);
      const key = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}`;
      const list = rows.filter((r) => String(r.tanggal || '').startsWith(key));
      const sumJenis = (...js) => list.filter((r) => js.includes(r.jenis)).reduce((a, r) => a + Number(r.nominal), 0);
      const masuk = sumJenis('income', 'opening_balance');
      const keluar = sumJenis('expense', 'savings');
      out.push({
        key,
        label: t.toLocaleDateString('id-ID', { month: 'short' }),
        income: sumJenis('income'),
        expense: sumJenis('expense'),
        savings: sumJenis('savings'),
        masuk,
        keluar,
        net: masuk - keluar,
      });
    }
    return out;
  }, [rows]);

  // Perubahan bulan berjalan vs bulan lalu (%). Nol -> null (tampil '—').
  const momOf = (get) => {
    if (flowMonths.length < 2) return null;
    const cur = get(flowMonths[flowMonths.length - 1]);
    const prev = get(flowMonths[flowMonths.length - 2]);
    if (!prev) return null;
    return Math.round(((cur - prev) / prev) * 100);
  };

  const days = [];
  for (let i = range - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 864e5);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const list = rows.filter((r) => r.tanggal === iso);
    const dInc = list.filter((r) => r.jenis === 'income').reduce((a, r) => a + Number(r.nominal), 0);
    const dExp = list.filter((r) => r.jenis === 'expense').reduce((a, r) => a + Number(r.nominal), 0);
    const dSav = list.filter((r) => r.jenis === 'savings').reduce((a, r) => a + Number(r.nominal), 0);
    days.push({
      label: range <= 7
        ? d.toLocaleDateString('id-ID', { weekday: 'short' })
        : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'numeric' }),
      income: dInc,
      expense: dExp,
      savings: dSav,
      net: dInc - dExp,
    });
  }

  const inflow = sum?.total_pemasukan || ((sum?.opening_balance || 0) + (sum?.total_income || 0));
  const ratio = inflow > 0 ? (sum?.total_expense || 0) / inflow : 0;
  const pct = (v) => (inflow > 0 ? Math.round((v / inflow) * 100) : 0);

  // Kartu statistik: badge % bulan-ke-bulan. Baik = hijau, buruk = merah.
  // Total Pemasukan = aset ringkas (M14, 7431500). Bukan income mentah.
  const statCards = [
    { label: 'Total Pemasukan', value: sum ? rupiah(sum.total_pemasukan ?? sum.total_income) : '...', icon: 'in', color: '#2FA36B', soft: 'rgba(47,163,107,.15)', mom: momOf((m) => m.income), goodWhenUp: true },
    { label: 'Total Pengeluaran', value: sum ? rupiah(sum.total_expense) : '...', icon: 'out', color: '#1E3A5F', soft: 'rgba(30,58,95,.1)', mom: momOf((m) => m.expense), goodWhenUp: false },
    { label: 'Total Tabungan', value: sum ? rupiah(sum.total_savings) : '...', icon: 'savings', color: '#BE861C', soft: 'rgba(190,134,28,.15)', mom: momOf((m) => m.savings), goodWhenUp: true },
  ];
  const momColor = (c) => {
    if (c.mom === null || c.mom === undefined) return 'var(--muted)';
    if (c.mom === 0) return 'var(--muted)';
    const good = c.goodWhenUp ? c.mom > 0 : c.mom < 0;
    return good ? '#1E9E6A' : '#D64545';
  };
  const momText = (c) => {
    if (c.mom === null || c.mom === undefined) return '—';
    return `${c.mom > 0 ? '+' : ''}${c.mom}%`;
  };

  const months = useMemo(() => {
    const m = [...new Set(rows.map((r) => String(r.tanggal || '').slice(0, 7)).filter(Boolean))].sort().reverse();
    return m;
  }, [rows]);

  const filtered = month ? rows.filter((r) => String(r.tanggal || '').startsWith(month)) : rows;

  const groups = [];
  [...filtered].sort((a, b) => (a.tanggal < b.tanggal ? 1 : -1)).slice(0, 12).forEach((r) => {
    const g = groups.find((x) => x.tanggal === r.tanggal);
    if (g) g.items.push(r);
    else groups.push({ tanggal: r.tanggal, items: [r] });
  });

  const monthLabel = (ym) => {
    const d = new Date(ym + '-01T00:00:00');
    return d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
  };

  const rekap = month
    ? filtered.reduce(
        (a, r) => {
          const n = Number(r.nominal) || 0;
          if (r.jenis === 'income' || r.jenis === 'opening_balance') a.masuk += n;
          else a.keluar += n;
          return a;
        },
        { masuk: 0, keluar: 0 }
      )
    : null;

  const eksporBulan = () => {
    try {
      if (!filtered.length) { setErr('Tidak ada data pada bulan ini untuk diekspor'); return; }
      const t = downloadExcel(filtered);
      alert(`Excel terunduh (${monthLabel(month)}): ${t.count} baris, bendahara ${rupiah(t.uang_dibendahara ?? t.saldo)}`);
    } catch (e) {
      setErr('Gagal export: ' + e.message);
    }
  };

  const ekspor = async () => {
    try {
      const t = downloadExcel(rows);
      alert(`Excel terunduh: ${t.count} baris, bendahara ${rupiah(t.uang_dibendahara ?? t.saldo)}, pemasukan ${rupiah(t.total_pemasukan)}`);
    } catch (e) {
      setErr('Gagal export: ' + e.message);
    }
  };

  const bukaModal = (j) => { setModalJenis(j); setModalOpen(true); };

  return (
    <>
      <div className="page-head">
        <div>
          <h2>{salam()}, {profile.nama || 'Bendahara'}!</h2>
          <div className="greet-sub">Kas kelas terkumpul dan tercatat rapi di sini.</div>
        </div>
        <button className="btn" onClick={ekspor}><span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}><Icon name="download" size={17} /> Export Excel</span></button>
      </div>
      {err && <div className="error">{err}</div>}

      <div className="hero-card">
        <div>
          <div className="seg" role="tablist" aria-label="Pilih tampil saldo">
            <button type="button" role="tab" aria-selected={view === 'bendahara'} className={`seg-btn${view === 'bendahara' ? ' active' : ''}`} onClick={() => setView('bendahara')}>Uang di Bendahara</button>
            <button type="button" role="tab" aria-selected={view === 'pemasukan'} className={`seg-btn${view === 'pemasukan' ? ' active' : ''}`} onClick={() => setView('pemasukan')}>Total Pemasukan</button>
          </div>
          <div className="hero-label">{view === 'bendahara' ? 'Uang di Bendahara • KasSave' : 'Total Pemasukan • KasSave'}</div>
          <div className="hero-value">{sum ? rupiah(view === 'bendahara' ? (sum.uang_dibendahara ?? sum.saldo_akhir ?? sum.saldo_tersedia) : (sum.total_pemasukan ?? sum.saldo_tersedia)) : '...'}</div>
          <div className="hero-sub">
            {sum ? (
              view === 'bendahara'
                ? `Total pemasukan ${rupiah(sum.total_pemasukan ?? sum.saldo_tersedia)} • Tabungan ${rupiah(sum.total_savings)} • ${sum?.jumlah_transaksi ?? '...'} transaksi`
                : `Tunai di tangan ${rupiah(sum.uang_dibendahara ?? sum.saldo_akhir)} • Tabungan ${rupiah(sum.total_savings)} • ${sum?.jumlah_transaksi ?? '...'} transaksi`
            ) : '...'}
          </div>
          <div className="hero-sub" style={{ marginTop: 2 }}>Saldo awal {sum ? rupiah(sum.opening_balance) : '...'} • Rumus: pemasukan = bendahara + tabungan</div>
          <div className="hero-actions">
            <button className="btn" onClick={() => bukaModal('income')}><span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}><Icon name="plus" size={17} /> Pemasukan</span></button>
            <button className="btn-outline" onClick={() => bukaModal('expense')}>Pengeluaran</button>
          </div>
        </div>
      </div>

      <div className="fin-grid">
        {statCards.map((c) => (
          <div className="card stat-card" key={c.label}>
            <div className="stat-ico" style={{ background: c.soft, color: c.color }}><Icon name={c.icon} size={26} /></div>
            <div style={{ minWidth: 0 }}>
              <div className="v">{c.value}</div>
              <div className="k">{c.label}</div>
            </div>
            <div className="stat-mom" style={{ color: momColor(c) }}>{momText(c)}</div>
          </div>
        ))}
      </div>

      <div className="dash-grid">
        <div style={{ display: 'grid', gap: 16, minWidth: 0 }}>
          <div className="card">
            <div className="card-head"><h3>Arus Kas Bulanan</h3><span className="label">bersih per bulan • 12 bulan</span></div>
            <MonthlyFlow data={flowMonths} />
            <div className="label">Arahkan kursor / ketuk garis untuk rincian tiap bulan</div>
          </div>
          <div className="card">
            <div className="card-head"><h3>Masuk vs Keluar per Bulan</h3><span className="label">12 bulan</span></div>
            <WeekBars days={flowMonths.map((m) => ({ label: m.label, income: m.income, expense: m.expense, savings: m.savings, net: m.net }))} />
            <div className="label">Garis penuh = masuk, garis outline = keluar</div>
          </div>
          <div className="card">
            <div className="card-head"><h3>Ringkasan Bulanan</h3><span className="label">6 bulan terakhir</span></div>
            <div className="table-wrap" style={{ boxShadow: 'none', border: 0 }}>
              <table>
                <thead><tr><th>Bulan</th><th>Masuk</th><th>Keluar</th><th>Tabungan</th><th>Status</th></tr></thead>
                <tbody>
                  {[...flowMonths].slice(-6).reverse().map((m) => (
                    <tr key={m.key}>
                      <td data-label="Bulan">{monthLabel(m.key)}</td>
                      <td data-label="Masuk">{rupiah(m.masuk)}</td>
                      <td data-label="Keluar">{rupiah(m.keluar)}</td>
                      <td data-label="Tabungan">{rupiah(m.savings)}</td>
                      <td data-label="Status"><span className={`badge ${m.net >= 0 ? 'income' : 'expense'}`}>{m.net >= 0 ? 'Surplus' : 'Defisit'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="card">
            <div className="card-head"><h3>Aksi Cepat</h3></div>
            <div className="quick-grid">
              <button className="quick-btn solid" onClick={() => bukaModal('income')}><Icon name="in" size={18} /><br />Pemasukan</button>
              <button className="quick-btn" onClick={() => bukaModal('expense')}><Icon name="out" size={18} /><br />Pengeluaran</button>
              <button className="quick-btn" onClick={() => bukaModal('savings')}><Icon name="savings" size={18} /><br />Tabungan</button>
              <button className="quick-btn" onClick={() => bukaModal('opening_balance')}><Icon name="opening" size={18} /><br />Saldo Awal</button>
            </div>
          </div>
          <div className="card">
            <div className="card-head">
              <h3>Aktivitas {range} Hari</h3>
              <select className="month-select" value={range} onChange={(e) => setRange(Number(e.target.value))} aria-label="Rentang aktivitas">
                <option value={7}>7 hari</option>
                <option value={14}>14 hari</option>
                <option value={30}>30 hari</option>
              </select>
            </div>
            <WeekBars days={days} />
            <div className="label">Garis penuh = masuk, garis outline = keluar</div>
          </div>
          <div className="card">
            <h3>Tabungan di Guru</h3>
            <div className="value">{sum ? rupiah(sum.total_savings) : '...'}</div>
            <div className="progress"><div style={{ width: `${inflow > 0 ? Math.min(100, ((sum?.total_savings || 0) / inflow) * 100) : 0}%` }} /></div>
            <div className="label" style={{ marginTop: 6 }}>dari total dana masuk {sum ? rupiah(inflow) : '...'}</div>
          </div>
          <div className="card">
            <h3>Kesehatan Kas</h3>
            <Gauge ratio={ratio} label="porsi belanja" />
            <div className="label" style={{ textAlign: 'center' }}>Semakin kecil semakin hemat</div>
          </div>
        </div>
        <div className="dash-side">
          <div className="card">
            <div className="card-head">
              <h3>Transaksi</h3>
              <select className="month-select" value={month} onChange={(e) => setMonth(e.target.value)} aria-label="Filter bulan">
                <option value="">Semua</option>
                {months.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
              </select>
            </div>
            {rekap && (
              <div className="rekap-box">
                <p className="label rekap-text" style={{ marginBottom: 0 }}>
                  Rekap {monthLabel(month)}: masuk {rupiah(rekap.masuk)} • keluar {rupiah(rekap.keluar)} • bersih {rupiah(rekap.masuk - rekap.keluar)}
                </p>
                <button className="btn ghost rekap-btn" onClick={eksporBulan}>Export bulan ini</button>
              </div>
            )}
            {groups.map((g) => (
              <div className="tx-group" key={g.tanggal}>
                <div className="tx-group-head"><span>{groupLabel(g.tanggal)}</span><span>{g.items.length} transaksi</span></div>
                {g.items.map((t) => (
                  <div className="tx-item" key={t.id}>
                    <div className={`tx-ico ${t.jenis}`}><Icon name={ICO_JENIS[t.jenis] || 'report'} size={20} /></div>
                    <div className="tt"><b>{t.keterangan}{t.penerima ? ` → ${t.penerima}` : ''}</b><small>{fmtTanggal(t.tanggal)}{t.kategori ? ` • ${t.kategori}` : ''}</small></div>
                    <div className={`tx-amt ${t.jenis === 'income' || t.jenis === 'opening_balance' ? 'in' : 'out'}`}>
                      {(t.jenis === 'income' || t.jenis === 'opening_balance' ? '+' : '−') + rupiah(t.nominal).replace('Rp', '').trim()}
                    </div>
                  </div>
                ))}
              </div>
            ))}
            {groups.length === 0 && !err && <div className="label">Belum ada transaksi</div>}
          </div>
        </div>
      </div>

      <TransactionModal open={modalOpen} initialJenis={modalJenis} saldoTersedia={sum?.uang_dibendahara ?? sum?.saldo_akhir} onClose={() => setModalOpen(false)} onSaved={() => load()} />
    </>
  );
}
