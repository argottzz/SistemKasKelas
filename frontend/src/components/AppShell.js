'use client';
import { usePathname } from 'next/navigation';
import { SidebarNav } from './Sidebar';

export default function AppShell({ children }) {
  const path = usePathname();
  if (path === '/') return <>{children}</>;
  return (
    <div className="layout">
      <SidebarNav />
      <main className="main">{children}</main>
    </div>
  );
}
