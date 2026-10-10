'use client';
import { useEffect, useState } from 'react';
import { rupiah, fmtTanggal } from '../../lib/api';
import { downloadExcel } from '../../lib/excel';
import { useProfile } from '../../context/ProfileContext';
import { AreaChart, WeekBars, Gauge } from '../../components/Charts';

const ICO = { income: '💰', expense: '💸', savings: '🏦', opening_balance: '🪙' };

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

  useEffect(() => {
    (async () => {
      try {
        const sRes = await fetch('/api/summary');
        if (!sRes.ok) throw new Error(`Gagal memuat ringkasan (HTTP ${sRes.status})`);
        const tRes = await fetch('/api/transactions?limit=1000');
        if (!tRes.ok) throw new Error(`Gagal memuat transaksi (HTTP ${tRes.status})`);
        setSum(await sRes.json());
        setRows((await tRes.json()).data || []);
      } catch (e) {
        setErr(e.message);
      }
    })();
  }, []);

  const byDate = [...rows].sort((a, b) => (a.tanggal < b.tanggal ? -1 : 1));
  let run = 0;
  const curve = byDate.map((r) => {
    if (r.jenis === 'opening_balance' || r.jenis === 'income') run += Number(r.nominal);
    else run -= Number(r.nominal);
    return run;
  });

  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 864e5);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const list = rows.filter((r) => r.tanggal === iso);
    days.push({
      label: d.toLocaleDateString('id-ID', { weekday: 'short' }),
      income: list.filter((r) => r.jenis === 'income').reduce((a, r) => a + Number(r.nominal), 0),
      expense: list.filter((r) => r.jenis === 'expense').reduce((a, r) => a + Number(r.nominal), 0),
    });
  }

  const inflow = (sum?.opening_balance || 0) + (sum?.total_income || 0);
  const ratio = inflow > 0 ? (sum?.total_expense || 0) / inflow : 0;

  const groups = [];
  [...rows].sort((a, b) => (a.tanggal < b.tanggal ? 1 : -1)).slice(0, 12).forEach((r) => {
    const g = groups.find((x) => x.tanggal === r.tanggal);
    if (g) g.items.push(r);
    else groups.push({ tanggal: r.tanggal, items: [r] });
  });

  const ekspor = async () => {
    try {
      const t = downloadExcel(rows);
      alert(`Excel terunduh: ${t.count} baris, saldo ${rupiah(t.saldo)}`);
    } catch (e) {
      setErr('Gagal export: ' + e.message);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h2>{salam()}, {profile.nama || 'Bendahara'}! 👋</h2>
          <div className="greet-sub">Kas kelas terkumpul dan tercatat rapi di sini.</div>
        </div>
        <button className="btn" onClick={ekspor}>📥 Export Excel</button>
      </div>
      {err && <div className="error">{err}</div>}

      <div className="snap">
        <div className="snap-card saldo"><div className="k"><span>Saldo Tersedia</span><span>➚</span></div><div className="v">{sum ? rupiah(sum.saldo_tersedia) : '...'}</div></div>
        <div className="snap-card income"><div className="k"><span>Pemasukan</span><span>💰</span></div><div className="v">{sum ? rupiah(sum.total_income) : '...'}</div></div>
        <div className="snap-card expense"><div className="k"><span>Pengeluaran</span><span>💸</span></div><div className="v">{sum ? rupiah(sum.total_expense) : '...'}</div></div>
        <div className="snap-card savings"><div className="k"><span>Tabungan Guru</span><span>🏦</span></div><div className="v">{sum ? rupiah(sum.total_savings) : '...'}</div></div>
      </div>

      <div className="dash-grid">
        <div style={{ display: 'grid', gap: 16, minWidth: 0 }}>
          <div className="card">
            <h3>Pergerakan Saldo</h3>
            <div className="label">Saldo awal {sum ? rupiah(sum.opening_balance) : '...'} • {sum?.jumlah_transaksi ?? '...'} transaksi</div>
            <AreaChart points={curve} />
          </div>
          <div className="card">
            <h3>Transaksi Terbaru</h3>
            {groups.map((g) => (
              <div className="tx-group" key={g.tanggal}>
                <div className="tx-group-head"><span>{groupLabel(g.tanggal)}</span><span>{g.items.length} transaksi</span></div>
                {g.items.map((t) => (
                  <div className="tx-item" key={t.id}>
                    <div className={`tx-ico ${t.jenis}`}>{ICO[t.jenis] || '📝'}</div>
                    <div className="tt"><b>{t.keterangan}{t.penerima ? ` → ${t.penerima}` : ''}</b><small>{fmtTanggal(t.tanggal)}</small></div>
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
        <div className="dash-side">
          <div className="card">
            <h3>Tabungan di Guru</h3>
            <div className="value">{sum ? rupiah(sum.total_savings) : '...'}</div>
            <div className="progress"><div style={{ width: `${inflow > 0 ? Math.min(100, ((sum?.total_savings || 0) / inflow) * 100) : 0}%` }} /></div>
            <div className="label" style={{ marginTop: 6 }}>dari total dana masuk {sum ? rupiah(inflow) : '...'}</div>
          </div>
          <div className="card">
            <h3>Aktivitas 7 Hari</h3>
            <WeekBars days={days} />
            <div className="label">🔵 masuk • 🟠 keluar</div>
          </div>
          <div className="card">
            <h3>Kesehatan Kas</h3>
            <Gauge ratio={ratio} label="porsi belanja" />
            <div className="label" style={{ textAlign: 'center' }}>Semakin kecil semakin hemat</div>
          </div>
        </div>
      </div>
    </>
  );
}
