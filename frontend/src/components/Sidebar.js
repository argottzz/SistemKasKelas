'use client';
import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useProfile } from '../context/ProfileContext';

const MENU = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/laporan', label: 'Laporan', icon: '📑' },
  { href: '/impor', label: 'Impor', icon: '📤' },
  { href: '/profil', label: 'Profil', icon: '👤' },
];

export function initialOf(nama) {
  const s = String(nama || '').trim();
  return s ? s[0].toUpperCase() : '?';
}

export function Avatar({ nama, foto, size = 44 }) {
  if (foto) {
    return <img src={foto} alt={nama} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />;
  }
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: '#0ea5e9', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: size * 0.45 }}>
      {initialOf(nama)}
    </div>
  );
}

export function SidebarNav() {
  const path = usePathname();
  const { profile } = useProfile();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <header className="mobilebar">
        <button className="hamburger" onClick={() => setOpen((v) => !v)} aria-label="Buka menu" aria-expanded={open}>
          ☰
        </button>
        <span className="mobilebar-title">💰 KasSave</span>
        <span style={{ width: 44 }} />
      </header>
      {open && <div className="drawer-overlay" onClick={close} aria-hidden="true" />}
      <aside className={`sidebar${open ? ' open' : ''}`}>
        <h2>💰 KasSave</h2>
        <Link href="/profil" onClick={close} className={path.startsWith('/profil') ? 'active' : ''} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Avatar nama={profile.nama} foto={profile.foto} size={40} />
          <span>
            <div style={{ fontWeight: 700 }}>{profile.nama || 'Atur nama...'}</div>
            <div style={{ fontSize: 12, opacity: 0.75 }}>Bendahara Kelas</div>
          </span>
        </Link>
        {MENU.map((m) => (
          <Link key={m.href} href={m.href} onClick={close} className={path.startsWith(m.href) ? 'active' : ''}>
            {m.icon} {m.label}
          </Link>
        ))}
      </aside>
    </>
  );
}

export default SidebarNav;
