'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { rupiah, fmtTanggal, labelJenis } from '../../lib/api';
import { downloadExcel } from '../../lib/excel';
import TransactionModal from '../../components/TransactionModal';
import { Icon } from '../../components/icons';

function LaporanDalam() {
  const sp = useSearchParams();
  const [rows, setRows] = useState([]);
  const [jenis, setJenis] = useState('');
  const [q, setQ] = useState(sp.get('q') || '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [err, setErr] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalJenis, setModalJenis] = useState('income');

  const load = async (override) => {
    try {
      setErr('');
      const v = override || { jenis, q, startDate, endDate };
      const p = new URLSearchParams({ limit: '500' });
      if (v.jenis) p.set('jenis', v.jenis);
      if (v.q) p.set('q', v.q);
      if (v.startDate) p.set('startDate', v.startDate);
      if (v.endDate) p.set('endDate', v.endDate);
      const res = await fetch('/api/transactions?' + p.toString());
      if (!res.ok) {
        let detail = '';
        try { detail = ': ' + ((await res.json()).message || ''); } catch {}
        throw new Error(`Gagal memuat laporan (HTTP ${res.status}${detail})`);
      }
      setRows((await res.json()).data || []);
    } catch (e) {
      setErr(e.message);
    }
  };

  useEffect(() => { load({ jenis: '', q: sp.get('q') || '', startDate: '', endDate: '' }); }, []); // eslint-disable-line

  const bukaModal = (j = 'income') => { setModalJenis(j); setModalOpen(true); };

  const hapus = async (id) => {
    if (!confirm('Hapus data ini? Saldo akan dihitung ulang.')) return;
    try {
      const res = await fetch('/api/transactions/' + id, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Gagal menghapus (HTTP ${res.status})`);
      load();
    } catch (e) {
      setErr(e.message);
    }
  };

  const ekspor = async () => {
    try {
      setErr('');
      const res = await fetch('/api/transactions?limit=1000');
      if (!res.ok) throw new Error(`Gagal memuat data (HTTP ${res.status})`);
      const t = downloadExcel((await res.json()).data || []);
      alert(`Excel terunduh: ${t.count} baris, saldo ${rupiah(t.saldo)}`);
    } catch (e) {
      setErr('Gagal export: ' + e.message);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Laporan Kas ({rows.length})</h2>
          <div className="greet-sub">Semua pemasukan, pengeluaran, dan tabungan.</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn ghost" onClick={ekspor}><span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}><Icon name="download" size={17} /> Export Excel</span></button>
          <button className="btn" onClick={() => bukaModal('income')}><span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}><Icon name="plus" size={17} /> Tambah</span></button>
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
        <button className="btn" onClick={() => load()}>Filter</button>
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
                <td data-label="Aksi"><button className="btn danger" style={{ padding: '8px 12px', minHeight: 36 }} onClick={() => hapus(t.id)}><span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><Icon name="trash" size={16} /> Hapus</span></button></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5}>Tidak ada data</td></tr>}
          </tbody>
        </table>
      </div>

      <button className="fab" onClick={() => bukaModal('income')} aria-label="Tambah data"><Icon name="plus" size={24} /></button>

      <TransactionModal
        open={modalOpen}
        initialJenis={modalJenis}
        onClose={() => setModalOpen(false)}
        onSaved={() => load()}
      />
    </>
  );
}

export default function LaporanPage() {
  return (
    <Suspense fallback={<p style={{ padding: 24 }}>Memuat laporan...</p>}>
      <LaporanDalam />
    </Suspense>
  );
}
