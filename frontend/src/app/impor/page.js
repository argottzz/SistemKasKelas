'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, rupiah, labelJenis, fmtTanggal } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

export default function ImporPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [pv, setPv] = useState(null);
  const [hist, setHist] = useState([]);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => { if (!loading && !user) router.push('/login'); }, [loading, user, router]);
  useEffect(() => {
    if (!user) return;
    api.get('/imports').then((d) => setHist(d.data)).catch(() => {});
  }, [user ]);

  const doPreview = async () => {
    setErr(''); setPv(null); setAgreed(false);
    if (!file) { setErr('Pilih file .xlsx dulu'); return; }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const d = await api.upload('/imports/preview', fd);
      setPv(d);
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };
  const doConfirm = async () => {
    setErr(''); setBusy(true);
    try {
      const d = await api.post('/imports/confirm', { previewId: pv.previewId });
      alert(`Impor berhasil: ${d.jumlah} baris`);
      setPv(null); setFile(null);
      api.get('/imports').then((x) => setHist(x.data)).catch(() => {});
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  if (loading || !user) return <p>Memuat...</p>;
  if (user.role !== 'bendahara') return <div className="error">Hanya bendahara yang boleh mengimpor.</div>;
  return (
    <>
      <h2 style={{ marginTop: 0 }}>Impor Excel</h2>
      <p style={{ fontSize: 14, color: '#64748b' }}>Template kolom: tanggal | keterangan | jenis (income/expense/savings/opening_balance) | nominal | penerima_tabungan (wajib untuk tabungan). Maks 5MB. Data awal Kelas 11 sudah masuk otomatis, menu ini untuk file baru.</p>
      {err && <div className="error">{err}</div>}
      <div className="form">
        <label>File Excel<input type="file" accept=".xlsx,.xls" onChange={(e) => setFile(e.target.files?.[0] || null)} /></label>
        <button className="btn" onClick={doPreview} disabled={busy}>{busy ? 'Memproses...' : 'Pratinjau & Validasi'}</button>
      </div>
      {pv && (
        <div className="card" style={{ marginTop: 14 }}>
          <h3>Pratinjau</h3>
          <p>Valid: {pv.jumlahValid} • Error: {pv.jumlahError} • Saldo hasil: {rupiah(pv.saldoHasil)}</p>
          <p style={{ fontSize: 13 }}>Pemasukan {rupiah(pv.totals.income)} • Pengeluaran {rupiah(pv.totals.expense)} • Tabungan {rupiah(pv.totals.savings)} • Saldo awal {rupiah(pv.totals.opening)}</p>
          {pv.errors?.length > 0 && <ul style={{ fontSize: 13, color: '#991b1b' }}>{pv.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>}
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
          <thead><tr><th>ID</th><th>File</th><th>Jumlah</th><th>Status</th></tr></thead>
          <tbody>{hist.map((h) => <tr key={h.id_import}><td data-label="ID">{h.id_import}</td><td data-label="File">{h.nama_file}</td><td data-label="Jumlah">{h.jumlah_data}</td><td data-label="Status">{h.status}</td></tr>)}</tbody>
        </table>
      </div>
    </>
  );
}
