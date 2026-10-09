'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

const MENU = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/laporan', label: 'Laporan', icon: '📑' },
  { href: '/impor', label: 'Impor', icon: '📤' },
];

export function SidebarNav() {
  const path = usePathname();
  const { user, logout } = useAuth();
  return (
    <>
      <aside className="sidebar">
        <h2>💰 Kas Kelas</h2>
        {MENU.map((m) => (
          <Link key={m.href} href={m.href} className={path.startsWith(m.href) ? 'active' : ''}>
            {m.icon} {m.label}
          </Link>
        ))}
        {user?.role === 'bendahara' && (
          <Link href="/pengguna" className={path.startsWith('/pengguna') ? 'active' : ''}>👥 Pengguna</Link>
        )}
        <div style={{ marginTop: 'auto', fontSize: 12, opacity: 0.9, padding: '8px 6px' }}>
          <div>{user?.nama} ({user?.role})</div>
          <button className="btn ghost" style={{ marginTop: 8, width: '100%' }} onClick={logout}>Logout</button>
        </div>
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
