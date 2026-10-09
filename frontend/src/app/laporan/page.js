'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, rupiah } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

export default function LaporanPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [startDate, setStartDate] = useState('2026-07-01');
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [rep, setRep] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => { if (!loading && !user) router.push('/login'); }, [loading, user, router]);
  const load = () => {
    if (!user) return;
    api.get(`/reports/summary?startDate=${startDate}&endDate=${endDate}`).then(setRep).catch((e) => setErr(e.message));
  };
  useEffect(() => { load(); }, [user]); // eslint-disable-line
  if (loading || !user) return <p>Memuat...</p>;
  return (
    <>
      <h2 style={{ marginTop: 0 }}>Laporan</h2>
      {err && <div className="error">{err}</div>}
      <div className="filters">
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        <button className="btn" onClick={load}>Tampilkan</button>
      </div>
      {rep && (
        <div className="grid-cards">
          <div className="card"><div className="label">Saldo Awal (periode)</div><div className="value">{rupiah(rep.opening_balance)}</div></div>
          <div className="card income"><div className="label">Pemasukan</div><div className="value">{rupiah(rep.total_income)}</div></div>
          <div className="card expense"><div className="label">Pengeluaran</div><div className="value">{rupiah(rep.total_expense)}</div></div>
          <div className="card savings"><div className="label">Tabungan</div><div className="value">{rupiah(rep.total_savings)}</div></div>
        </div>
      )}
      {rep && <div className="card saldo"><div className="label">Saldo Akhir Periode</div><div className="value">{rupiah(rep.saldo_akhir)}</div><div className="label">{rep.jumlah_transaksi} transaksi</div></div>}
    </>
  );
}
