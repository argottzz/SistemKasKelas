'use client';
import Link from 'next/link';
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
  return (
    <>
      <aside className="sidebar">
        <h2>💰 KasSave</h2>
        <Link href="/profil" className={path.startsWith('/profil') ? 'active' : ''} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Avatar nama={profile.nama} foto={profile.foto} size={40} />
          <span>
            <div style={{ fontWeight: 700 }}>{profile.nama || 'Atur nama...'}</div>
            <div style={{ fontSize: 12, opacity: 0.75 }}>Bendahara Kelas</div>
          </span>
        </Link>
        {MENU.map((m) => (
          <Link key={m.href} href={m.href} className={path.startsWith(m.href) ? 'active' : ''}>
            {m.icon} {m.label}
          </Link>
        ))}
      </aside>
      <nav className="bottomnav">
        {MENU.map((m) => (
          <Link key={m.href} href={m.href} className={path.startsWith(m.href) ? 'active' : ''}>
            <div style={{ fontSize: 18 }}>{m.icon}</div>{m.label}
          </Link>
        ))}
      </nav>
    </>
  );
}

export default SidebarNav;
