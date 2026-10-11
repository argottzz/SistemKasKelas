'use client';
import { useEffect, useState } from 'react';
import { Icon } from './icons';
import { KATEGORI } from '../lib/validate';

const TABS = [
  { key: 'income', label: 'Pemasukan', icon: 'in', color: 'var(--primary)', placeholder: 'cth: Iuran kas minggu ini' },
  { key: 'expense', label: 'Pengeluaran', icon: 'out', color: 'var(--ink)', placeholder: 'cth: Beli spidol dan isi ulang' },
  { key: 'savings', label: 'Tabungan', icon: 'savings', color: 'var(--primary)', placeholder: 'cth: Setoran tabungan ke guru' },
];

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default function TransactionModal({ open, initialJenis = 'income', editTx = null, onClose, onSaved }) {
  const isEdit = !!editTx;
  const [jenis, setJenis] = useState(initialJenis);
  const [tanggal, setTanggal] = useState(today());
  const [nominal, setNominal] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [penerima, setPenerima] = useState('Tabungan kelas');
  const [kategori, setKategori] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      if (editTx) {
        setJenis(editTx.jenis || initialJenis);
        setTanggal(editTx.tanggal || today());
        setNominal(editTx.nominal ?? '');
        setKeterangan(editTx.keterangan || '');
        setPenerima(editTx.penerima || 'Tabungan kelas');
        setKategori(editTx.kategori || '');
      } else {
        setJenis(initialJenis);
        setTanggal(today());
        setNominal('');
        setKeterangan('');
        setPenerima('Tabungan kelas');
        setKategori('');
      }
      setErr('');
    }
  }, [open, initialJenis, editTx]);

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
    setBusy(true);
    try {
      const payload = { jenis, nominal, tanggal, keterangan, penerima: jenis === 'savings' ? penerima : null, kategori: kategori || null };
      const url = isEdit ? '/api/transactions/' + editTx.id : '/api/transactions';
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.message || j.error?.message || 'Gagal menyimpan');
      onSaved?.(isEdit ? 'Data berhasil diubah' : undefined);
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
          <h3 style={{ margin: 0 }}>{isEdit ? 'Ubah Data' : 'Tambah Data'}</h3>
          <button className="modal-x" onClick={onClose} aria-label="Tutup">×</button>
        </div>
        <div className="modal-tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`modal-tab ${jenis === t.key ? 'active' : ''}`}
              style={jenis === t.key ? { borderColor: 'var(--primary)' } : {}}
              onClick={() => setJenis(t.key)}
            >
              <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><Icon name={t.icon} size={16} /> {t.label}</span>
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
              <input value={penerima} onChange={(e) => setPenerima(e.target.value)} placeholder="Tabungan kelas" required />
            </label>
          )}
          <label className="fld">Nominal (Rp)
            <input inputMode="numeric" type="number" min="1" step="1" value={nominal} onChange={(e) => setNominal(e.target.value)} placeholder="cth: 50000" required />
          </label>
          <label className="fld">Kategori (opsional)
            <select value={kategori} onChange={(e) => setKategori(e.target.value)}>
              <option value="">— Tanpa kategori —</option>
              {KATEGORI.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </label>
          <label className="fld">Keterangan
            <textarea rows={2} value={keterangan} onChange={(e) => setKeterangan(e.target.value)} placeholder={tab.placeholder} required />
          </label>
          <button className="btn" disabled={busy}>
            {busy ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : `Simpan ${tab.label}`}
          </button>
        </form>
      </div>
    </div>
  );
}
