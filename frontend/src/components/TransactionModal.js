'use client';
import { useEffect, useState } from 'react';
import { Icon } from './icons';
import { KATEGORI } from '../lib/validate';
import { rupiah } from '../lib/api';

const TABS = [
  { key: 'income', label: 'Pemasukan', icon: 'in', color: 'var(--primary)', placeholder: 'cth: Iuran kas minggu ini' },
  { key: 'expense', label: 'Pengeluaran', icon: 'out', color: 'var(--ink)', placeholder: 'cth: Beli spidol dan isi ulang' },
  { key: 'savings', label: 'Tabungan', icon: 'savings', color: 'var(--primary)', placeholder: 'cth: Setoran tabungan ke guru' },
  { key: 'opening_balance', label: 'Saldo Awal', icon: 'opening', color: 'var(--primary)', placeholder: 'cth: Sisa kas kelas 10' },
];

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default function TransactionModal({ open, initialJenis = 'income', editTx = null, saldoTersedia = null, onClose, onSaved }) {
  const isEdit = !!editTx;
  const [jenis, setJenis] = useState(initialJenis);
  const [tanggal, setTanggal] = useState(today());
  const [nominal, setNominal] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [penerima, setPenerima] = useState('Tabungan kelas');
  const [kategori, setKategori] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [baseSaldo, setBaseSaldo] = useState(saldoTersedia);

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
      // Saldo dasar untuk prediksi: kas di tangan (bendahara), bukan total aset.
      if (saldoTersedia !== null && saldoTersedia !== undefined) {
        setBaseSaldo(saldoTersedia);
      } else {
        (async () => {
          try {
            const r = await fetch('/api/summary', { cache: 'no-store' });
            if (r.ok) {
              const js = await r.json();
              setBaseSaldo(js.uang_dibendahara ?? js.saldo_akhir ?? js.saldo_tersedia ?? 0);
            }
          } catch {}
        })();
      }
    }
  }, [open, initialJenis, editTx, saldoTersedia]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  const tab = TABS.find((t) => t.key === jenis) || { label: 'Data', placeholder: 'cth: Keterangan' };

  // Prediksi saldo tersedia: opening/income menambah, expense/savings mengurangi.
  const effectOf = (j, n) => ((j === 'income' || j === 'opening_balance') ? 1 : -1) * (Number(n) || 0);
  let prediksi = null;
  if (baseSaldo !== null && baseSaldo !== undefined && Number(nominal) > 0) {
    if (isEdit && editTx) prediksi = Number(baseSaldo) - effectOf(editTx.jenis, editTx.nominal) + effectOf(jenis, nominal);
    else prediksi = Number(baseSaldo) + effectOf(jenis, nominal);
  }

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
        {baseSaldo !== null && baseSaldo !== undefined && (
          <div className="label" style={{ marginBottom: 0 }}>
            Uang di bendahara saat ini {rupiah(baseSaldo)}
            {prediksi !== null && <> • Nanti jadi {rupiah(prediksi)}</>}
          </div>
        )}
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
            <input inputMode="numeric" type="number" min="1" step="1" value={nominal} onChange={(e) => setNominal(e.target.value)} placeholder="cth: 50000" required autoFocus />
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
