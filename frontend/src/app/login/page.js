'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '../../lib/supabase-client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const sb = supabaseBrowser();
      const { error } = await sb.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw new Error('Email atau password salah.');
      router.replace('/dashboard');
      router.refresh();
    } catch (ex) {
      setErr(ex.message || 'Gagal masuk.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: '80dvh', display: 'grid', placeItems: 'center', padding: 16 }}>
      <div className="card" style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
          <img src="/logo.png" alt="KasSave" className="brand-logo" style={{ width: 40, height: 40 }} />
          <div>
            <h2 style={{ margin: 0, fontSize: 20 }}>KasSave</h2>
            <div className="label" style={{ margin: 0 }}>Masuk sebagai bendahara</div>
          </div>
        </div>
        {err && <div className="error">{err}</div>}
        <form onSubmit={submit} style={{ display: 'grid', gap: 12, marginTop: 12 }}>
          <label className="fld">Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="bendahara@..." required autoComplete="email" />
          </label>
          <label className="fld">Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required autoComplete="current-password" />
          </label>
          <button className="btn" disabled={busy}>{busy ? 'Memeriksa...' : 'Masuk'}</button>
        </form>
        <div className="label" style={{ marginTop: 12, marginBottom: 0 }}>Halaman kas hanya untuk bendahara. Tidak ada pendaftaran akun baru.</div>
      </div>
    </div>
  );
}
