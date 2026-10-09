'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, rupiah, fmtTanggal, labelJenis } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sum, setSum] = useState(null);
  const [recent, setRecent] = useState([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    api.get('/dashboard/summary').then(setSum).catch((e) => setErr(e.message));
    api.get('/dashboard/recent-transactions?limit=8').then((d) => setRecent(d.data)).catch(() => {});
  }, [user]);

  if (loading || !user) return <main className="main"><p>Memuat...</p></main>;
  return (
    <>
      <div className="topbar">
        <h2 style={{ margin: 0 }}>Dashboard</h2>
        <span style={{ fontSize: 13, color: '#64748b' }}>Halo, {user.nama} ({user.role})</span>
      </div>
      {err && <div className="error">{err}</div>}
      {sum?.peringatan_saldo_besar && (
        <div className="alert">⚠️ Saldo melebihi Rp1.000.000. Pertimbangkan setor tabungan ke guru. (Tidak otomatis.)</div>
      )}
      <div className="grid-cards">
        <div className="card saldo"><div className="label">Saldo Tersedia</div><div className="value">{sum ? rupiah(sum.saldo_tersedia) : '...'}</div></div>
        <div className="card income"><div className="label">Pemasukan</div><div className="value">{sum ? rupiah(sum.total_income) : '...'}</div></div>
        <div className="card expense"><div className="label">Pengeluaran</div><div className="value">{sum ? rupiah(sum.total_expense) : '...'}</div></div>
        <div className="card savings"><div className="label">Tabungan di Guru</div><div className="value">{sum ? rupiah(sum.total_savings) : '...'}</div></div>
      </div>
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="label">Saldo Awal: {sum ? rupiah(sum.opening_balance) : '...'} • Total {sum?.jumlah_transaksi ?? '...'} transaksi</div>
      </div>
      <h3>Transaksi Terbaru</h3>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Tanggal</th><th>Keterangan</th><th>Jenis</th><th>Nominal</th></tr></thead>
          <tbody>
            {recent.map((t) => (
              <tr key={t.id_transaction}>
                <td data-label="Tanggal">{fmtTanggal(t.tanggal_transaksi)}</td>
                <td data-label="Keterangan">{t.keterangan}</td>
                <td data-label="Jenis"><span className={`badge ${t.jenis}`}>{labelJenis(t.jenis)}</span></td>
                <td data-label="Nominal">{rupiah(t.nominal)}</td>
              </tr>
            ))}
            {recent.length === 0 && <tr><td colSpan={4}>Belum ada transaksi</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
