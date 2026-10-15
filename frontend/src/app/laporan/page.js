'use client';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { rupiah, fmtTanggal, labelJenis } from '../../lib/api';
import { downloadExcel } from '../../lib/excel';
import TransactionModal from '../../components/TransactionModal';
import { Icon } from '../../components/icons';
import { useToast } from '../../components/Toast';
import { KATEGORI } from '../../lib/validate';

const PAGE_SIZE = 20;

function LaporanDalam() {
  const sp = useSearchParams();
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [jenis, setJenis] = useState('');
  const [kategori, setKategori] = useState('');
  const [q, setQ] = useState(sp.get('q') || '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pageSize: PAGE_SIZE, totalItems: 0, totalPages: 1 });
  const [modalOpen, setModalOpen] = useState(false);
  const [modalJenis, setModalJenis] = useState('income');
  const [editTx, setEditTx] = useState(null);
  const [confirmTx, setConfirmTx] = useState(null);
  const [busy, setBusy] = useState(false);
  const [sum, setSum] = useState(null);

  const loadSum = useCallback(async () => {
    try {
      const r = await fetch('/api/summary', { cache: 'no-store' });
      if (r.ok) setSum(await r.json());
    } catch {}
  }, []);

  const load = useCallback(async (p = page, override) => {
    try {
      setErr('');
      setLoading(true);
      const v = override || { jenis, kategori, q, startDate, endDate };
      const params = new URLSearchParams({ page: String(p), pageSize: String(PAGE_SIZE) });
      if (v.jenis) params.set('jenis', v.jenis);
      if (v.kategori) params.set('kategori', v.kategori);
      if (v.q) params.set('q', v.q);
      if (v.startDate) params.set('startDate', v.startDate);
      if (v.endDate) params.set('endDate', v.endDate);
      const res = await fetch('/api/transactions?' + params.toString(), { cache: 'no-store' });
      const j = await res.json();
      if (!res.ok) throw new Error(j.message || j.error?.message || `Gagal memuat laporan (HTTP ${res.status})`);
      setRows(j.data || []);
      setPagination(j.pagination || { page: p, pageSize: PAGE_SIZE, totalItems: j.total || 0, totalPages: 1 });
      setPage(p);
      loadSum();
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, jenis, kategori, q, startDate, endDate, loadSum]);

  useEffect(() => { load(1, { jenis: '', kategori: '', q: sp.get('q') || '', startDate: '', endDate: '' }); }, []); // eslint-disable-line

  const terapkan = () => load(1);
  const reset = () => {
    setJenis(''); setKategori(''); setQ(''); setStartDate(''); setEndDate('');
    load(1, { jenis: '', kategori: '', q: '', startDate: '', endDate: '' });
  };

  const bukaModal = (j = 'income') => { setEditTx(null); setModalJenis(j); setModalOpen(true); };
  const bukaUbah = (t) => { setEditTx(t); setModalJenis(t.jenis); setModalOpen(true); };

  const hapus = async () => {
    if (!confirmTx) return;
    setBusy(true);
    try {
      const res = await fetch('/api/transactions/' + confirmTx.id, { method: 'DELETE' });
      const j = await res.json();
      if (!res.ok) throw new Error(j.message || j.error?.message || `Gagal menghapus (HTTP ${res.status})`);
      setConfirmTx(null);
      toast?.show('Transaksi dihapus. Saldo dihitung ulang.');
      load(page);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const ekspor = async () => {
    try {
      setErr('');
      const params = new URLSearchParams({ page: '1', pageSize: '1000' });
      if (jenis) params.set('jenis', jenis);
      if (kategori) params.set('kategori', kategori);
      if (q) params.set('q', q);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      const res = await fetch('/api/transactions?' + params.toString(), { cache: 'no-store' });
      if (!res.ok) throw new Error(`Gagal memuat data (HTTP ${res.status})`);
      const t = downloadExcel((await res.json()).data || []);
      toast?.show(`Excel terunduh: ${t.count} baris.`);
    } catch (e) {
      setErr('Gagal export: ' + e.message);
    }
  };

  const totalTampil = rows.reduce((a, r) => a + (r.jenis === 'expense' || r.jenis === 'savings' ? -Number(r.nominal) : Number(r.nominal)), 0);

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Laporan Kas</h2>
          <div className="greet-sub">{pagination.totalItems} transaksi • halaman {pagination.page} dari {pagination.totalPages}{sum ? ` • Bendahara ${rupiah(sum.uang_dibendahara ?? sum.saldo_akhir)} • Pemasukan ${rupiah(sum.total_pemasukan ?? sum.saldo_tersedia)}` : ''}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn ghost" onClick={ekspor}><span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}><Icon name="download" size={17} /> Export</span></button>
          <button className="btn" onClick={() => bukaModal('income')}><span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}><Icon name="plus" size={17} /> Tambah</span></button>
        </div>
      </div>
      {err && <div className="error">{err} <button className="btn ghost" style={{ marginLeft: 8, minHeight: 32, padding: '4px 12px' }} onClick={() => load(page)}>Coba lagi</button></div>}

      {sum && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="card-head"><h3>Ringkasan Keuangan</h3><span className="label">sesuai teks S1</span></div>
          <div className="stat-row" style={{ marginBottom: 0 }}>
            <div className="stat-box"><div className="t">Pemasukan</div><div className="n">{rupiah(sum.total_pemasukan ?? sum.saldo_tersedia)}</div></div>
            <div className="stat-box"><div className="t">Pengeluaran</div><div className="n">{rupiah(sum.total_expense)}</div></div>
            <div className="stat-box"><div className="t">Tabungan</div><div className="n">{rupiah(sum.total_savings)}</div></div>
          </div>
          <div className="stat-row" style={{ marginBottom: 0, marginTop: 10, gridTemplateColumns: '1fr' }}>
            <div className="stat-box"><div className="t">Uang di Bendahara</div><div className="n">{rupiah(sum.uang_dibendahara ?? sum.saldo_akhir)}</div></div>
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="card-head"><h3>Hasil tampil</h3><span className="label">{rows.length} baris • bersih {rupiah(totalTampil)}</span></div>
        <div className="filters" style={{ marginBottom: 0 }}>
          <select value={jenis} onChange={(e) => setJenis(e.target.value)} aria-label="Filter jenis">
            <option value="">Semua jenis</option>
            <option value="income">Pemasukan</option>
            <option value="expense">Pengeluaran</option>
            <option value="savings">Tabungan</option>
            <option value="opening_balance">Saldo Awal</option>
          </select>
          <select value={kategori} onChange={(e) => setKategori(e.target.value)} aria-label="Filter kategori">
            <option value="">Semua kategori</option>
            {KATEGORI.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} aria-label="Dari tanggal" />
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} aria-label="Sampai tanggal" />
          <input placeholder="Cari keterangan..." value={q} onChange={(e) => setQ(e.target.value)} aria-label="Cari keterangan" />
          <button className="btn" onClick={terapkan}>Filter</button>
          <button className="btn ghost" onClick={reset}>Reset</button>
        </div>
      </div>

      <div className="table-wrap" style={{ marginBottom: 18 }}>
        <table>
          <thead><tr><th>Tanggal</th><th>Keterangan</th><th>Jenis</th><th>Kategori</th><th>Nominal</th><th>Aksi</th></tr></thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id}>
                <td data-label="Tanggal">{fmtTanggal(t.tanggal)}</td>
                <td data-label="Keterangan">{t.keterangan}{t.penerima ? ` → ${t.penerima}` : ''}</td>
                <td data-label="Jenis"><span className={`badge ${t.jenis}`}>{labelJenis(t.jenis)}</span></td>
                <td data-label="Kategori">{t.kategori || '—'}</td>
                <td data-label="Nominal">{rupiah(t.nominal)}</td>
                <td data-label="Aksi">
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn ghost" style={{ padding: '8px 12px', minHeight: 36 }} onClick={() => bukaUbah(t)} aria-label="Ubah"><Icon name="edit" size={16} /></button>
                    <button className="btn danger" style={{ padding: '8px 12px', minHeight: 36 }} onClick={() => setConfirmTx(t)} aria-label="Hapus"><Icon name="trash" size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && !loading && <tr><td colSpan={6}>{err ? 'Gagal memuat.' : 'Tidak ada data untuk filter ini.'}</td></tr>}
            {loading && <tr><td colSpan={6}>Memuat...</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="pager">
        <button className="btn ghost" disabled={pagination.page <= 1 || loading} onClick={() => load(pagination.page - 1)}>Sebelumnya</button>
        <span className="label">Hal {pagination.page} / {pagination.totalPages} • {pagination.totalItems} data</span>
        <button className="btn ghost" disabled={pagination.page >= pagination.totalPages || loading} onClick={() => load(pagination.page + 1)}>Berikutnya</button>
      </div>

      <button className="fab" onClick={() => bukaModal('income')} aria-label="Tambah data"><Icon name="plus" size={24} /></button>

      <TransactionModal
        open={modalOpen}
        initialJenis={modalJenis}
        editTx={editTx}
        saldoTersedia={sum?.uang_dibendahara ?? sum?.saldo_akhir}
        onClose={() => { setModalOpen(false); setEditTx(null); }}
        onSaved={(msg) => { if (msg) toast?.show(msg); else toast?.show('Tersimpan. Saldo dihitung ulang.'); load(editTx ? page : 1); }}
      />

      {confirmTx && (
        <div className="modal-overlay" onClick={() => setConfirmTx(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" style={{ maxWidth: 400 }}>
            <div className="modal-head"><h3 style={{ margin: 0 }}>Hapus transaksi?</h3></div>
            <p style={{ fontSize: 14 }}>{confirmTx.keterangan} • {rupiah(confirmTx.nominal)} • {fmtTanggal(confirmTx.tanggal)}</p>
            <p className="label">Saldo akan dihitung ulang otomatis. Tindakan ini tidak bisa dibatalkan.</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn ghost" style={{ flex: 1 }} onClick={() => setConfirmTx(null)} disabled={busy}>Batal</button>
              <button className="btn danger" style={{ flex: 1, background: 'var(--primary)', color: 'var(--primary-ink)', border: 0 }} onClick={hapus} disabled={busy}>{busy ? 'Menghapus...' : 'Ya, hapus'}</button>
            </div>
          </div>
        </div>
      )}
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
