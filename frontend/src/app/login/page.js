'use client';
export const dynamic = 'force-dynamic';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={async (e) => {
        e.preventDefault(); setErr(''); setBusy(true);
        try { await login(username.trim(), password); } catch (ex) { setErr(ex.message); } finally { setBusy(false); }
      }}>
        <h2 style={{ margin: 0 }}>💰 Kas Kelas</h2>
        <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>Login untuk mencatat kas</p>
        {err && <div className="error">{err}</div>}
        <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required autoComplete="username" />
        <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
        <button className="btn" disabled={busy}>{busy ? 'Masuk...' : 'Login'}</button>
        <p style={{ fontSize: 14 }}>Belum punya akun? <Link href="/register" style={{ color: '#0284c7', fontWeight: 700 }}>Register</Link></p>
      </form>
    </div>
  );
}
