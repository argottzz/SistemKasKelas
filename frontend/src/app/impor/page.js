'use client';
import { useEffect, useRef, useState } from 'react';
import { rupiah } from '../../lib/api';
import { Icon } from '../../components/icons';
import { useToast } from '../../components/Toast';

export default function ImporPage() {
  const toast = useToast();
  const [file, setFile] = useState(null);
  const [pv, setPv] = useState(null);
  const [hist, setHist] = useState([]);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const inputRef = useRef(null);

  const step = pv ? 3 : file ? 2 : 1;

  const loadHist = async () => {
    try {
      const res = await fetch('/api/imports');
      if (res.ok) setHist((await res.json()).data || []);
    } catch {}
  };

  useEffect(() => { loadHist(); }, []);

  const pick = (f) => {
    setErr(''); setPv(null); setAgreed(false);
    if (!f) return;
    if (!/\.xlsx?$/i.test(f.name)) { setErr('File harus berekstensi .xlsx atau .xls'); return; }
    if (f.size > 5 * 1024 * 1024) { setErr('Ukuran file maksimal 5MB'); return; }
    setFile(f);
  };

  const doPreview = async () => {
    setErr(''); setPv(null); setAgreed(false);
    if (!file) { setErr('Pilih file .xlsx dulu'); return; }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/imports/preview', { method: 'POST', body: fd });
      const j = await res.json();
      if (!res.ok) throw new Error(j.message || j.error?.message || 'Gagal memproses file');
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
      if (!res.ok) throw new Error(j.message || j.error?.message || 'Gagal menyimpan impor');
      toast?.show(`Impor berhasil: ${j.jumlah} baris.`);
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
      <div className="page-head">
        <div>
          <h2>Impor Excel</h2>
          <div className="greet-sub">Pindahkan data lama ke KasSave dalam 3 langkah.</div>
        </div>
      </div>

      <div className="steps" aria-label="Langkah impor">
        <div className={`step${step >= 1 ? ' active' : ''}`}>1. Pilih file</div>
        <div className={`step${step >= 2 ? ' active' : ''}`}>2. Pratinjau</div>
        <div className={`step${step >= 3 ? ' active' : ''}`}>3. Konfirmasi</div>
      </div>

      {err && <div className="error">{err}</div>}

      <div className="card" style={{ marginBottom: 14 }}>
        <h3>Langkah 1 — Pilih file</h3>
        <div
          className="dropzone"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files?.[0]); }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter') inputRef.current?.click(); }}
        >
          <Icon name="upload" size={28} />
          <div style={{ fontWeight: 600, marginTop: 8 }}>{file ? file.name : 'Klik atau seret file ke sini'}</div>
          <div className="label" style={{ marginTop: 4, marginBottom: 0 }}>Format .xlsx/.xls, maks 5MB. File yang sama tidak bisa diimpor dua kali.</div>
          <input ref={inputRef} type="file" accept=".xlsx,.xls" hidden onChange={(e) => pick(e.target.files?.[0] || null)} />
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button className="btn" onClick={doPreview} disabled={busy || !file}>{busy ? 'Memproses...' : 'Lanjut: Pratinjau'}</button>
          {file && <button className="btn ghost" onClick={() => { setFile(null); setPv(null); }}>Ganti file</button>}
        </div>
      </div>

      {pv && (
        <div className="card" style={{ marginBottom: 14 }}>
          <h3>Langkah 2 & 3 — Pratinjau {pv.namaFile}</h3>
          <div className="stat-row">
            <div className="stat-box"><div className="t">Baris valid</div><div className="n">{pv.totals.count}</div></div>
            <div className="stat-box"><div className="t">Saldo hasil file</div><div className="n">{rupiah(pv.saldoHasil)}</div></div>
            <div className="stat-box"><div className="t">Masuk / Keluar</div><div className="n" style={{ fontSize: 14 }}>{rupiah(pv.totals.income)} / {rupiah(pv.totals.expense)}</div></div>
          </div>
          <p className="label">Tabungan {rupiah(pv.totals.savings)} • Saldo awal {rupiah(pv.totals.opening)}</p>
          {pv.errors?.length > 0 && (
            <div className="error">
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{pv.errors.length} baris perlu perhatian (10 pertama):</div>
              <ul style={{ margin: 0, paddingLeft: 18 }}>{pv.errors.slice(0, 10).map((e, i) => <li key={i}>{e}</li>)}</ul>
            </div>
          )}
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14, marginTop: 8 }}>
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} /> Saya sudah memeriksa angka di atas
          </label>
          <div style={{ marginTop: 10 }}>
            <button className="btn" disabled={!agreed || busy} onClick={doConfirm}>Konfirmasi & Simpan</button>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-head"><h3>Riwayat impor</h3><button className="btn ghost" style={{ minHeight: 36, padding: '6px 14px' }} onClick={loadHist}>Muat ulang</button></div>
        <div className="table-wrap" style={{ boxShadow: 'none', border: 0 }}>
          <table>
            <thead><tr><th>File</th><th>Jumlah</th><th>Waktu</th></tr></thead>
            <tbody>
              {hist.map((h, i) => <tr key={h.id || i}><td data-label="File">{h.nama_file}</td><td data-label="Jumlah">{h.jumlah}</td><td data-label="Waktu">{h.created_at ? h.created_at.slice(0, 16).replace('T', ' ') : '-'}</td></tr>)}
              {hist.length === 0 && <tr><td colSpan={3}>Belum ada impor. Hasil impor akan tercatat di sini.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
