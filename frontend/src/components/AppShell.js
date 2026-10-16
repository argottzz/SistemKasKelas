'use client';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { MobileBar, SidebarDrawer } from './Sidebar';

export default function AppShell({ children }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  if (path === '/' || path === '/login' || path === '/publik' || path === '/unduh') return <main className="main">{children}</main>;
  return (
    <>
      <MobileBar open={open} onToggle={() => setOpen((v) => !v)} />
      <div className="layout">
        <SidebarDrawer open={open} onClose={() => setOpen(false)} />
        <main className="main">{children}</main>
      </div>
    </>
  );
}
