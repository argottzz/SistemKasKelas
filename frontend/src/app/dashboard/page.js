'use client';
import { useEffect, useState } from 'react';
import { loadTx, summary } from '../../lib/store';
import { rupiah, fmtTanggal, labelJenis } from '../../lib/api';
import { useProfile } from '../../context/ProfileContext';

export default function DashboardPage() {
  const { profile } = useProfile();
  const [sum, setSum] = useState(null);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    const l = loadTx();
    setSum(summary(l));
    setRecent([...l].sort((a, b) => (a.tanggal < b.tanggal ? 1 : -1)).slice(0, 8));
  }, []);

  return (
    <>
      <div className="topbar">
        <h2 style={{ margin: 0 }}>Dashboard</h2>
        <span style={{ fontSize: 13, color: '#64748b' }}>Halo, {profile.nama || 'Bendahara'} 👋</span>
      </div>
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
              <tr key={t.id}>
                <td data-label="Tanggal">{fmtTanggal(t.tanggal)}</td>
                <td data-label="Keterangan">{t.keterangan}{t.penerima ? ` → ${t.penerima}` : ''}</td>
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
