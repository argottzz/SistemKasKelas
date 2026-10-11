'use client';
import Link from 'next/link';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useProfile } from '../context/ProfileContext';
import { useTheme } from '../context/ThemeContext';
import { supabaseBrowser } from '../lib/supabase-client';
import { Icon } from './icons';

const MENU = [
  { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { href: '/laporan', label: 'Laporan', icon: 'report' },
  { href: '/impor', label: 'Impor', icon: 'upload' },
  { href: '/profil', label: 'Profil', icon: 'user' },
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
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'var(--primary)', color: 'var(--primary-ink)', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: size * 0.45 }}>
      {initialOf(nama)}
    </div>
  );
}

export function ThemeToggleButton() {
  const { theme, toggle } = useTheme() || { theme: 'light', toggle: () => {} };
  return (
    <button className="theme-btn" onClick={toggle} aria-label={theme === 'light' ? 'Ganti ke mode gelap' : 'Ganti ke mode terang'}>
      <Icon name={theme === 'light' ? 'moon' : 'sun'} size={20} />
    </button>
  );
}

export function MobileBar({ open, onToggle }) {
  return (
    <header className="mobilebar">
      <button className="hamburger" onClick={onToggle} aria-label="Buka menu" aria-expanded={!!open}>
        <Icon name="menu" size={22} />
      </button>
      <span className="mobilebar-title"><img src="/logo.png" alt="KasSave" className="brand-logo" /> KasSave</span>
      <ThemeToggleButton />
    </header>
  );
}

export function SidebarDrawer({ open, onClose }) {
  const path = usePathname();
  const router = useRouter();
  const { profile } = useProfile();
  const { theme, toggle } = useTheme() || { theme: 'light', toggle: () => {} };
  const keluar = async () => {
    try {
      await supabaseBrowser().auth.signOut();
    } catch {}
    onClose();
    router.replace('/login');
    router.refresh();
  };
  return (
    <>
      {open && <div className="drawer-overlay" onClick={onClose} aria-hidden="true" />}
      <aside className={`sidebar${open ? ' open' : ''}`}>
        <h2><img src="/logo.png" alt="KasSave" className="brand-logo" /> KasSave</h2>
        <Link href="/profil" onClick={onClose} className={path.startsWith('/profil') ? 'active' : ''} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Avatar nama={profile.nama} foto={profile.foto} size={40} />
          <span>
            <div style={{ fontWeight: 700 }}>{profile.nama || 'Atur nama...'}</div>
            <div style={{ fontSize: 12, opacity: 0.75 }}>Bendahara Kelas</div>
          </span>
        </Link>
        {MENU.map((m) => (
          <Link key={m.href} href={m.href} onClick={onClose} className={path.startsWith(m.href) ? 'active' : ''}>
            <Icon name={m.icon} size={18} /> {m.label}
          </Link>
        ))}
        <div style={{ marginTop: 'auto', display: 'grid', gap: 4 }}>
          <div className="theme-row">
            <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Icon name={theme === 'light' ? 'sun' : 'moon'} size={18} /> Tema</span>
            <button className="theme-switch" data-on={theme === 'dark'} onClick={toggle} aria-label="Ganti tema terang/gelap" />
          </div>
          <button className="side-logout" onClick={keluar}>
            <Icon name="out" size={18} /> Keluar
          </button>
        </div>
      </aside>
    </>
  );
}

export function SidebarNav() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <>
      <MobileBar open={open} onToggle={() => setOpen((v) => !v)} />
      <SidebarDrawer open={open} onClose={close} />
    </>
  );
}

export default SidebarNav;
