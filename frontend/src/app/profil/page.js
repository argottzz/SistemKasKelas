'use client';
import { useEffect, useState } from 'react';
import { getProfile } from '../../lib/store';
import { useProfile } from '../../context/ProfileContext';
import { useTheme } from '../../context/ThemeContext';
import { Avatar } from '../../components/Sidebar';
import { Icon } from '../../components/icons';
import { useToast } from '../../components/Toast';
import { rupiah } from '../../lib/api';

function fileToResizedDataURL(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const max = 256;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const cv = document.createElement('canvas');
      cv.width = w; cv.height = h;
      cv.getContext('2d').drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(cv.toDataURL('image/jpeg', 0.72));
    };
    img.onerror = () => reject(new Error('File bukan gambar yang valid'));
    img.src = url;
  });
}

export default function ProfilPage() {
  const { profile, save } = useProfile();
  const { theme, setTheme } = useTheme() || {};
  const toast = useToast();
  const [nama, setNama] = useState('');
  const [foto, setFoto] = useState(null);
  const [err, setErr] = useState('');
  const [sum, setSum] = useState(null);

  useEffect(() => {
    const p = getProfile();
    setNama(p.nama || '');
    setFoto(p.foto || null);
  }, [profile]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/summary');
        if (res.ok) setSum(await res.json());
      } catch {}
    })();
  }, []);

  const pilihFoto = async (f) => {
    setErr('');
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { setErr('Ukuran foto maksimal 5MB'); return; }
    try {
      setFoto(await fileToResizedDataURL(f));
    } catch (e) {
      setErr(e.message);
    }
  };

  const simpan = (e) => {
    e.preventDefault();
    setErr('');
    if (!nama.trim()) { setErr('Nama wajib diisi'); return; }
    save(nama, foto);
    toast?.show('Profil tersimpan.');
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Profil</h2>
          <div className="greet-sub">Identitas bendahara + preferensi tampilan.</div>
        </div>
      </div>
      {err && <div className="error">{err}</div>}

      <div className="card" style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 14 }}>
        <Avatar nama={nama} foto={foto} size={72} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>{nama || '(belum ada nama)'}</div>
          <div className="label">Bendahara Kelas • tersimpan di perangkat ini</div>
        </div>
      </div>

      {sum && (
        <div className="stat-row">
          <div className="stat-box"><div className="t">Saldo</div><div className="n">{rupiah(sum.saldo_tersedia)}</div></div>
          <div className="stat-box"><div className="t">Transaksi</div><div className="n">{sum.jumlah_transaksi}</div></div>
          <div className="stat-box"><div className="t">Tabungan guru</div><div className="n">{rupiah(sum.total_savings)}</div></div>
        </div>
      )}

      <form className="form" onSubmit={simpan} style={{ marginBottom: 14 }}>
        <h3 style={{ margin: 0 }}>Identitas</h3>
        <label>Nama
          <input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="cth: Arga" maxLength={100} required />
        </label>
        <label>Foto profil
          <input type="file" accept="image/*" onChange={(e) => pilihFoto(e.target.files?.[0])} />
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          {foto && <button type="button" className="btn ghost" onClick={() => setFoto(null)}>Hapus foto</button>}
          <button className="btn"><span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}><Icon name="user" size={17} /> Simpan Profil</span></button>
        </div>
      </form>

      <div className="card" style={{ marginBottom: 14 }}>
        <h3>Tampilan</h3>
        <div className="label">Pilih tema yang nyaman di mata.</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['light', 'dark'].map((t) => (
            <button key={t} type="button" className={theme === t ? 'btn' : 'btn ghost'} onClick={() => setTheme?.(t)}>
              <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}><Icon name={t === 'light' ? 'sun' : 'moon'} size={17} /> {t === 'light' ? 'Terang' : 'Gelap'}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>Tentang</h3>
        <div className="label">KasSave • pencatatan kas kelas • v1.1 • data transaksi di server, profil di perangkat ini.</div>
      </div>
    </>
  );
}
