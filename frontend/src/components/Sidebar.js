'use client';
import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useProfile } from '../context/ProfileContext';
import { useTheme } from '../context/ThemeContext';

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
    <div style={{ width: size, height: size, borderRadius: '50%', background: '#3F72AF', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: size * 0.45 }}>
      {initialOf(nama)}
    </div>
  );
}

export function ThemeToggleButton() {
  const { theme, toggle } = useTheme() || { theme: 'light', toggle: () => {} };
  return (
    <button className="theme-btn" onClick={toggle} aria-label={theme === 'light' ? 'Ganti ke mode gelap' : 'Ganti ke mode terang'}>
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}

export function MobileBar({ open, onToggle }) {
  return (
    <header className="mobilebar">
      <button className="hamburger" onClick={onToggle} aria-label="Buka menu" aria-expanded={!!open}>
        ☰
      </button>
      <span className="mobilebar-title">💰 KasSave</span>
      <ThemeToggleButton />
    </header>
  );
}

export function SidebarDrawer({ open, onClose }) {
  const path = usePathname();
  const { profile } = useProfile();
  const { theme, toggle } = useTheme() || { theme: 'light', toggle: () => {} };
  return (
    <>
      {open && <div className="drawer-overlay" onClick={onClose} aria-hidden="true" />}
      <aside className={`sidebar${open ? ' open' : ''}`}>
        <h2>💰 KasSave</h2>
        <Link href="/profil" onClick={onClose} className={path.startsWith('/profil') ? 'active' : ''} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Avatar nama={profile.nama} foto={profile.foto} size={40} />
          <span>
            <div style={{ fontWeight: 700 }}>{profile.nama || 'Atur nama...'}</div>
            <div style={{ fontSize: 12, opacity: 0.75 }}>Bendahara Kelas</div>
          </span>
        </Link>
        {MENU.map((m) => (
          <Link key={m.href} href={m.href} onClick={onClose} className={path.startsWith(m.href) ? 'active' : ''}>
            {m.icon} {m.label}
          </Link>
        ))}
        <div style={{ marginTop: 'auto', display: 'grid', gap: 4 }}>
          <div className="theme-row">
            <span>Theme {theme === 'light' ? '☀️' : '🌙'}</span>
            <button className="theme-switch" data-on={theme === 'dark'} onClick={toggle} aria-label="Ganti tema terang/gelap" />
          </div>
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
