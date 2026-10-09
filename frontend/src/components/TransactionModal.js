'use client';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';

const TABS = [
  { key: 'income', label: '💰 Pemasukan', color: '#16a34a', placeholder: 'cth: Iuran kas minggu ini' },
  { key: 'expense', label: '💸 Pengeluaran', color: '#dc2626', placeholder: 'cth: Beli spidol dan isi ulang' },
  { key: 'savings', label: '🏦 Tabungan', color: '#d97706', placeholder: 'cth: Setoran tabungan ke guru' },
];

const today = () => new Date().toISOString().slice(0, 10);

export default function TransactionModal({ open, initialJenis = 'income', onClose, onSaved }) {
  const [jenis, setJenis] = useState(initialJenis);
  const [tanggal, setTanggal] = useState(today());
  const [nominal, setNominal] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [penerima, setPenerima] = useState('Guru / Wali Kelas');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setJenis(initialJenis);
      setTanggal(today());
      setNominal('');
      setKeterangan('');
      setPenerima('Guru / Wali Kelas');
      setErr('');
    }
  }, [open, initialJenis]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  const tab = TABS.find((t) => t.key === jenis);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    if (!tanggal) return setErr('Tanggal wajib diisi');
    if (!Number(nominal) || Number(nominal) <= 0) return setErr('Nominal harus lebih dari 0');
    if (!keterangan.trim()) return setErr('Keterangan wajib diisi');
    if (jenis === 'savings' && !penerima.trim()) return setErr('Nama penerima wajib diisi');
    setBusy(true);
    try {
      await api.post('/transactions', {
        jenis,
        nominal: Number(nominal),
        tanggal_transaksi: tanggal,
        keterangan: keterangan.trim(),
        penerima_tabungan: jenis === 'savings' ? penerima.trim() : null,
        id_category: null,
      });
      onSaved?.();
      onClose?.();
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-head">
          <h3 style={{ margin: 0 }}>Tambah Data</h3>
          <button className="modal-x" onClick={onClose} aria-label="Tutup">×</button>
        </div>
        <div className="modal-tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`modal-tab ${jenis === t.key ? 'active' : ''}`}
              style={jenis === t.key ? { borderColor: t.color, color: t.color } : {}}
              onClick={() => setJenis(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
        {err && <div className="error" style={{ marginBottom: 10 }}>{err}</div>}
        <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
          <label className="fld">Tanggal
            <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} required />
          </label>
          {jenis === 'savings' && (
            <label className="fld">Nama Penerima (guru)
              <input value={penerima} onChange={(e) => setPenerima(e.target.value)} placeholder="Guru / Wali Kelas" required />
            </label>
          )}
          <label className="fld">Nominal (Rp)
            <input inputMode="numeric" type="number" min="1" step="1" value={nominal} onChange={(e) => setNominal(e.target.value)} placeholder="cth: 50000" required />
          </label>
          <label className="fld">Keterangan
            <textarea rows={2} value={keterangan} onChange={(e) => setKeterangan(e.target.value)} placeholder={tab.placeholder} required />
          </label>
          <button className="btn" style={{ background: tab.color }} disabled={busy}>
            {busy ? 'Menyimpan...' : `Simpan ${tab.label}`}
          </button>
        </form>
      </div>
    </div>
  );
}
