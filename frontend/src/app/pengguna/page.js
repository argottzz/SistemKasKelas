'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

export default function PenggunaPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState('');

  useEffect(() => { if (!loading && !user) router.push('/login'); }, [loading, user, router]);
  useEffect(() => { if (user && user.role !== 'bendahara') router.push('/dashboard'); }, [user, loading, router]);
  const load = () => { if (user) api.get('/users').then((d) => setRows(d.data)).catch((e) => setErr(e.message)); };
  useEffect(load, [user]); // eslint-disable-line
  if (loading || !user) return <p>Memuat...</p>;

  return (
    <>
      <h2 style={{ marginTop: 0 }}>Pengguna</h2>
      {err && <div className="error">{err}</div>}
      <div className="table-wrap">
        <table>
          <thead><tr><th>Nama</th><th>Username</th><th>Role</th><th>Aksi</th></tr></thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id_user}>
                <td data-label="Nama">{u.nama}</td>
                <td data-label="Username">{u.username}</td>
                <td data-label="Role">{u.role}</td>
                <td data-label="Aksi">
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {u.role === 'pengurus'
                      ? <button className="btn" style={{ padding: '8px 12px', minHeight: 36 }} onClick={async () => { await api.put(`/users/${u.id_user}/role`, { role: 'bendahara' }); load(); }}>Jadikan Bendahara</button>
                      : <button className="btn ghost" style={{ padding: '8px 12px', minHeight: 36 }} onClick={async () => { try { await api.put(`/users/${u.id_user}/role`, { role: 'pengurus' }); load(); } catch (e) { setErr(e.message); } }}>Jadikan Pengurus</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
