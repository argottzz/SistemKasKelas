'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

export default function KategoriPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [nama, setNama] = useState('');
  const [jenis, setJenis] = useState('expense');
  const [err, setErr] = useState('');

  useEffect(() => { if (!loading && !user) router.push('/login'); }, [loading, user, router]);
  const load = () => { if (user) api.get('/categories').then((d) => setRows(d.data)).catch((e) => setErr(e.message)); };
  useEffect(load, [user]); // eslint-disable-line
  if (loading || !user) return <p>Memuat...</p>;

  return (
    <>
      <h2 style={{ marginTop: 0 }}>Kategori</h2>
      {err && <div className="error">{err}</div>}
      <div className="table-wrap" style={{ marginBottom: 14 }}>
        <table>
          <thead><tr><th>Nama</th><th>Jenis</th>{user.role === 'bendahara' && <th>Aksi</th>}</tr></thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id_category}>
                <td data-label="Nama">{c.nama_kategori}</td>
                <td data-label="Jenis"><span className={`badge ${c.jenis}`}>{c.jenis}</span></td>
                {user.role === 'bendahara' && (
                  <td data-label="Aksi"><button className="btn danger" style={{ padding: '8px 12px', minHeight: 36 }} onClick={async () => {
                    if (!confirm('Hapus kategori?')) return;
                    try { await api.del(`/categories/${c.id_category}`); load(); } catch (e) { setErr(e.message); }
                  }}>Hapus</button></td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {user.role === 'bendahara' && (
        <form className="form" onSubmit={async (e) => {
          e.preventDefault(); setErr('');
          try { await api.post('/categories', { nama_kategori: nama, jenis }); setNama(''); load(); } catch (ex) { setErr(ex.message); }
        }}>
          <label>Nama kategori<input value={nama} onChange={(e) => setNama(e.target.value)} required /></label>
          <label>Jenis<select value={jenis} onChange={(e) => setJenis(e.target.value)}><option value="income">income</option><option value="expense">expense</option></select></label>
          <button className="btn">Tambah</button>
        </form>
      )}
    </>
  );
}
