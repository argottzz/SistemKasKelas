'use client';
export const dynamic = 'force-dynamic';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const [nama, setNama] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={async (e) => {
        e.preventDefault(); setErr(''); setBusy(true);
        try { await register(nama.trim(), username.trim(), password); } catch (ex) { setErr(ex.message); } finally { setBusy(false); }
      }}>
        <h2 style={{ margin: 0 }}>📝 Register</h2>
        <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>Pendaftar pertama otomatis jadi bendahara</p>
        {err && <div className="error">{err}</div>}
        <input placeholder="Nama lengkap" value={nama} onChange={(e) => setNama(e.target.value)} required />
        <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required autoComplete="username" />
        <input placeholder="Password (min 8 karakter)" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" />
        <button className="btn" disabled={busy}>{busy ? 'Mendaftar...' : 'Register'}</button>
        <p style={{ fontSize: 14 }}>Sudah punya akun? <Link href="/login" style={{ color: '#0284c7', fontWeight: 700 }}>Login</Link></p>
      </form>
    </div>
  );
}
