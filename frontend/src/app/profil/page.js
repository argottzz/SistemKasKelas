'use client';
import { useEffect, useState } from 'react';
import { getProfile } from '../../lib/store';
import { useProfile } from '../../context/ProfileContext';
import { Avatar } from '../../components/Sidebar';

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
  const [nama, setNama] = useState('');
  const [foto, setFoto] = useState(null);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');

  useEffect(() => {
    const p = getProfile();
    setNama(p.nama || '');
    setFoto(p.foto || null);
  }, [profile]);

  const pilihFoto = async (f) => {
    setErr(''); setOk('');
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
    setErr(''); setOk('');
    if (!nama.trim()) { setErr('Nama wajib diisi'); return; }
    save(nama, foto);
    setOk('Profil tersimpan ✓');
  };

  return (
    <>
      <h2 style={{ marginTop: 0 }}>Profil</h2>
      {err && <div className="error">{err}</div>}
      {ok && <div className="card" style={{ marginBottom: 12, borderLeft: '4px solid #16a34a' }}>{ok}</div>}
      <div className="card" style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 14 }}>
        <Avatar nama={nama} foto={foto} size={72} />
        <div>
          <div style={{ fontWeight: 800, fontSize: 18 }}>{nama || '(belum ada nama)'}</div>
          <div className="label">Bendahara Kelas • data tersimpan di perangkat ini</div>
        </div>
      </div>
      <form className="form" onSubmit={simpan}>
        <label>Nama
          <input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="cth: Arga" maxLength={100} required />
        </label>
        <label>Foto profil
          <input type="file" accept="image/*" onChange={(e) => pilihFoto(e.target.files?.[0])} />
        </label>
        {foto && <button type="button" className="btn ghost" onClick={() => setFoto(null)}>Hapus foto</button>}
        <button className="btn">Simpan Profil</button>
      </form>
    </>
  );
}
