'use client';
import { useEffect, useState } from 'react';
import { rupiah } from '../../lib/api';

export default function ImporPage() {
  const [file, setFile] = useState(null);
  const [pv, setPv] = useState(null);
  const [hist, setHist] = useState([]);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const loadHist = async () => {
    try {
      const res = await fetch('/api/imports');
      if (res.ok) setHist((await res.json()).data || []);
    } catch {}
  };

  useEffect(() => { loadHist(); }, []);

  const doPreview = async () => {
    setErr(''); setPv(null); setAgreed(false);
    if (!file) { setErr('Pilih file .xlsx dulu'); return; }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/imports/preview', { method: 'POST', body: fd });
      const j = await res.json();
      if (!res.ok) throw new Error(j.message || 'Gagal memproses file');
      setPv(j);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const doConfirm = async () => {
    setErr(''); setBusy(true);
    try {
      const res = await fetch('/api/imports/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ namaFile: pv.namaFile, fileHash: pv.fileHash, rows: pv.rows }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.message || 'Gagal menyimpan impor');
      alert(`Impor berhasil: ${j.jumlah} baris`);
      setPv(null); setFile(null);
      loadHist();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <h2 style={{ marginTop: 0 }}>Impor Excel</h2>
      <p className="greet-sub" style={{ fontSize: 14 }}>
        Unggah file Excel format laporan KasSave (hasil Export atau file asli Kelas 11).
        Blok pemasukan &amp; nabung tidak punya kolom keterangan, jadi keterangannya dibuat otomatis.
        Maks 5MB, file yang sama tidak bisa diimpor dua kali.
      </p>
      {err && <div className="error">{err}</div>}
      <div className="form">
        <label>File Excel<input type="file" accept=".xlsx,.xls" onChange={(e) => setFile(e.target.files?.[0] || null)} /></label>
        <button className="btn" onClick={doPreview} disabled={busy}>{busy ? 'Memproses...' : 'Pratinjau & Validasi'}</button>
      </div>
      {pv && (
        <div className="card" style={{ marginTop: 14 }}>
          <h3>Pratinjau — {pv.namaFile}</h3>
          <p>Valid: {pv.totals.count} • Saldo hasil file: {rupiah(pv.saldoHasil)}</p>
          <p style={{ fontSize: 13 }}>Pemasukan {rupiah(pv.totals.income)} • Pengeluaran {rupiah(pv.totals.expense)} • Tabungan {rupiah(pv.totals.savings)} • Saldo awal {rupiah(pv.totals.opening)}</p>
          {pv.errors?.length > 0 && <ul className="error" style={{ fontSize: 13 }}>{pv.errors.slice(0, 10).map((e, i) => <li key={i}>{e}</li>)}</ul>}
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14 }}>
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} /> Saya sudah memeriksa data di atas
          </label>
          <div style={{ marginTop: 10 }}>
            <button className="btn" disabled={!agreed || busy} onClick={doConfirm}>Konfirmasi & Simpan</button>
          </div>
        </div>
      )}
      <h3>Riwayat Impor</h3>
      <div className="table-wrap">
        <table>
          <thead><tr><th>File</th><th>Jumlah</th><th>Waktu</th></tr></thead>
          <tbody>
            {hist.map((h, i) => <tr key={h.id || i}><td data-label="File">{h.nama_file}</td><td data-label="Jumlah">{h.jumlah}</td><td data-label="Waktu">{h.created_at ? h.created_at.slice(0, 16).replace('T', ' ') : '-'}</td></tr>)}
            {hist.length === 0 && <tr><td colSpan={3}>Belum ada impor</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
