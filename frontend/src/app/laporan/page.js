'use client';
import { useEffect, useState } from 'react';
import { rupiah, fmtTanggal, labelJenis } from '../../lib/api';
import { downloadExcel } from '../../lib/excel';
import TransactionModal from '../../components/TransactionModal';

export default function LaporanPage() {
  const [rows, setRows] = useState([]);
  const [jenis, setJenis] = useState('');
  const [q, setQ] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [err, setErr] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalJenis, setModalJenis] = useState('income');

  const load = async () => {
    try {
      setErr('');
      const p = new URLSearchParams({ limit: '500' });
      if (jenis) p.set('jenis', jenis);
      if (q) p.set('q', q);
      if (startDate) p.set('startDate', startDate);
      if (endDate) p.set('endDate', endDate);
      const res = await fetch('/api/transactions?' + p.toString());
      if (!res.ok) {
        let detail = '';
        try { detail = ': ' + ((await res.json()).message || ''); } catch {}
        throw new Error(`Gagal memuat laporan (HTTP ${res.status}${detail})`);
      }
      const j = await res.json();
      setRows(j.data || []);
    } catch (e) {
      setErr(e.message);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const bukaModal = (j = 'income') => { setModalJenis(j); setModalOpen(true); };

  const hapus = async (id) => {
    if (!confirm('Hapus data ini? Saldo akan dihitung ulang.')) return;
    try {
      const res = await fetch('/api/transactions/' + id, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus');
      load();
    } catch (e) {
      setErr(e.message);
    }
  };

  const ekspor = async () => {
    try {
      setErr('');
      const res = await fetch('/api/transactions?limit=1000');
      if (!res.ok) throw new Error('Gagal memuat data untuk export');
      const j = await res.json();
      const t = downloadExcel(j.data || []);
      alert(`Excel terunduh: ${t.count} baris, saldo ${rupiah(t.saldo)}`);
    } catch (e) {
      setErr('Gagal export: ' + e.message);
    }
  };

  return (
    <>
      <div className="topbar">
        <h2 style={{ margin: 0 }}>Laporan Kas ({rows.length})</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn ghost" onClick={ekspor}>📥 Export Excel</button>
          <button className="btn" onClick={() => bukaModal('income')}>+ Tambah</button>
        </div>
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
              <tr key={t.id}>
                <td data-label="Tanggal">{fmtTanggal(t.tanggal)}</td>
                <td data-label="Keterangan">{t.keterangan}{t.penerima ? ` → ${t.penerima}` : ''}</td>
                <td data-label="Jenis"><span className={`badge ${t.jenis}`}>{labelJenis(t.jenis)}</span></td>
                <td data-label="Nominal">{rupiah(t.nominal)}</td>
                <td data-label="Aksi"><button className="btn danger" style={{ padding: '8px 12px', minHeight: 36 }} onClick={() => hapus(t.id)}>Hapus</button></td>
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
