'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, rupiah, fmtTanggal, labelJenis } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import TransactionModal from '../../components/TransactionModal';

export default function LaporanPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [jenis, setJenis] = useState('');
  const [q, setQ] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [err, setErr] = useState('');

  // popup tambah data
  const [modalOpen, setModalOpen] = useState(false);
  const [modalJenis, setModalJenis] = useState('income');

  useEffect(() => { if (!loading && !user) router.push('/login'); }, [loading, user, router]);

  const load = () => {
    if (!user) return;
    const p = new URLSearchParams({ page: 1, limit: 50 });
    if (jenis) p.set('jenis', jenis);
    if (q) p.set('q', q);
    if (startDate) p.set('startDate', startDate);
    if (endDate) p.set('endDate', endDate);
    api.get(`/transactions?${p}`).then((d) => { setRows(d.data); setTotal(d.total); }).catch((e) => setErr(e.message));
  };
  useEffect(load, [user]); // eslint-disable-line

  const bukaModal = (j = 'income') => { setModalJenis(j); setModalOpen(true); };

  const hapus = async (id) => {
    if (!confirm('Hapus transaksi ini? Saldo akan dihitung ulang.')) return;
    try { await api.del(`/transactions/${id}`); load(); } catch (ex) { setErr(ex.message); }
  };

  if (loading || !user) return <p>Memuat...</p>;
  return (
    <>
      <div className="topbar">
        <h2 style={{ margin: 0 }}>Laporan Kas ({total})</h2>
        <button className="btn" onClick={() => bukaModal('income')}>+ Tambah</button>
      </div>
      {err && <div className="error">{err}</div>}
      <div className="filters">
        <select value={jenis} onChange={(e) => setJenis(e.target.value)}>
          <option value="">Semua jenis</option>
          <option value="income">Pemasukan</option>
          <option value="expense">Pengeluaran</option>
          <option value="savings">Tabungan</option>
          <option value="opening_balance">Saldo Awal</option>
        </select>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        <input placeholder="Cari keterangan..." value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn" onClick={load}>Filter</button>
      </div>
      <div className="table-wrap" style={{ marginBottom: 18 }}>
        <table>
          <thead><tr><th>Tanggal</th><th>Keterangan</th><th>Jenis</th><th>Nominal</th><th>Aksi</th></tr></thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id_transaction}>
                <td data-label="Tanggal">{fmtTanggal(t.tanggal_transaksi)}</td>
                <td data-label="Keterangan">{t.keterangan}{t.penerima_tabungan ? ` → ${t.penerima_tabungan}` : ''}</td>
                <td data-label="Jenis"><span className={`badge ${t.jenis}`}>{labelJenis(t.jenis)}</span></td>
                <td data-label="Nominal">{rupiah(t.nominal)}</td>
                <td data-label="Aksi">{user.role === 'bendahara' && <button className="btn danger" style={{ padding: '8px 12px', minHeight: 36 }} onClick={() => hapus(t.id_transaction)}>Hapus</button>}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5}>Tidak ada data</td></tr>}
          </tbody>
        </table>
      </div>

      <button className="fab" onClick={() => bukaModal('income')} aria-label="Tambah data">+</button>

      <TransactionModal
        open={modalOpen}
        initialJenis={modalJenis}
        onClose={() => setModalOpen(false)}
        onSaved={load}
      />
    </>
  );
}
