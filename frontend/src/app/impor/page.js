'use client';
import { useEffect, useState } from 'react';
import { addMany, getImportLog, hasHash, addHash, sha256hex } from '../../lib/store';
import { parseWorkbook, totalsOf } from '../../lib/excel';
import { rupiah } from '../../lib/api';

export default function ImporPage() {
  const [file, setFile] = useState(null);
  const [pv, setPv] = useState(null);
  const [hist, setHist] = useState([]);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    setHist(getImportLog());
  }, []);

  const doPreview = async () => {
    setErr(''); setPv(null); setAgreed(false);
    if (!file) { setErr('Pilih file .xlsx dulu'); return; }
    setBusy(true);
    try {
      const buf = await file.arrayBuffer();
      const hash = await sha256hex(buf);
      if (hasHash(hash)) throw new Error('File ini sudah pernah diimpor. Impor ganda ditolak.');
      const { rows, errors } = parseWorkbook(buf);
      if (!rows.length) throw new Error('Tidak ada baris valid. ' + errors.slice(0, 3).join(' '));
      const t = totalsOf(rows);
      setPv({ rows, errors, totals: t, hash, namaFile: file.name });
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const doConfirm = () => {
    setErr(''); setBusy(true);
    try {
      const n = addMany(pv.rows);
      addHash(pv.hash, { namaFile: pv.namaFile, jumlah: n });
      alert(`Impor berhasil: ${n} baris`);
      setPv(null); setFile(null);
      setHist(getImportLog());
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <h2 style={{ marginTop: 0 }}>Impor Excel</h2>
      <p style={{ fontSize: 14, color: '#64748b' }}>
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
          <p>Valid: {pv.totals.count} • Saldo hasil file: {rupiah(pv.totals.saldo)}</p>
          <p style={{ fontSize: 13 }}>Pemasukan {rupiah(pv.totals.income)} • Pengeluaran {rupiah(pv.totals.expense)} • Tabungan {rupiah(pv.totals.savings)} • Saldo awal {rupiah(pv.totals.opening)}</p>
          {pv.errors?.length > 0 && <ul style={{ fontSize: 13, color: '#991b1b' }}>{pv.errors.slice(0, 10).map((e, i) => <li key={i}>{e}</li>)}</ul>}
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
            {hist.map((h, i) => <tr key={i}><td data-label="File">{h.namaFile}</td><td data-label="Jumlah">{h.jumlah}</td><td data-label="Waktu">{h.at ? h.at.slice(0, 16).replace('T', ' ') : '-'}</td></tr>)}
            {hist.length === 0 && <tr><td colSpan={3}>Belum ada impor</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
