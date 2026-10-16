'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '../../lib/supabase-client';
import { Icon } from '../../components/icons';

export default function AksesDitolakPage() {
  const router = useRouter();
  const [email, setEmail] = useState(null);
  const [siap, setSiap] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabaseBrowser().auth.getUser();
        setEmail(data?.user?.email || null);
      } catch {
        setEmail(null);
      } finally {
        setSiap(true);
      }
    })();
  }, []);

  const keluar = async () => {
    try {
      await supabaseBrowser().auth.signOut();
    } catch {}
    router.replace('/publik');
    router.refresh();
  };

  return (
    <div style={{ minHeight: '80dvh', display: 'grid', placeItems: 'center', padding: 16 }}>
      <div className="card" style={{ width: '100%', maxWidth: 440, textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <span className="plat-ico" style={{ width: 52, height: 52 }}><Icon name="lock" size={26} /></span>
        </div>
        <h2 style={{ margin: '0 0 6px', fontSize: 20 }}>Akses Ditolak</h2>
        <div className="label">
          Akun Gmail kamu belum terdaftar sebagai bendahara. Hubungi pengurus untuk minta akses.
        </div>
        {siap && email && (
          <div className="label" style={{ overflowWrap: 'anywhere' }}>
            Masuk sebagai: <b>{email}</b>
          </div>
        )}
        <div style={{ display: 'grid', gap: 8, marginTop: 14 }}>
          <Link className="btn ghost" href="/publik">
            <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}><Icon name="eye" size={17} /> Kembali ke Halaman Publik</span>
          </Link>
          {siap && email && (
            <button type="button" className="btn-outline" onClick={keluar}>
              <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}><Icon name="out" size={17} /> Keluar & ganti akun</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
