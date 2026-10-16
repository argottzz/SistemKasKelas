'use client';
import Link from 'next/link';
import InstallButton from '../../components/InstallButton';
import { Icon } from '../../components/icons';

export default function UnduhPage() {
  return (
    <>
      <div className="page-head">
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <img src="/logo.png" alt="KasSave" className="brand-logo" style={{ width: 40, height: 40 }} />
          <div>
            <h2>Download Aplikasi</h2>
            <div className="greet-sub">Pasang KasSave di HP tanpa Play Store. Gratis, sekali tap.</div>
          </div>
        </div>
        <Link className="btn ghost" href="/publik">Lihat kas publik</Link>
      </div>

      <div className="hero-card">
        <div className="hero-label">KasSave • PWA</div>
        <div className="hero-value">Kas kelas dalam satu ikon HP</div>
        <div className="hero-sub">Tetap butuh internet untuk lihat data terbaru. Data kas tersimpan aman di server.</div>
        <div className="hero-actions">
          <InstallButton large />
        </div>
      </div>

      <div className="fin-grid">
        <div className="card">
          <div className="card-head"><h3>Android (Chrome)</h3><span className="badge savings">1 menit</span></div>
          <div className="label">1. Tap tombol Download di atas → pilih <b>Install</b>.</div>
          <div className="label">2. Kalau tombol tidak muncul notif: titik 3 di Chrome → <b>Add to Home screen / Install app</b>.</div>
          <div className="label">3. Ikon KasSave muncul di beranda → buka fullscreen.</div>
        </div>
        <div className="card" id="iphone">
          <div className="card-head"><h3>iPhone (Safari)</h3><span className="badge savings">1 menit</span></div>
          <div className="label">1. Buka halaman ini di <b>Safari</b> (bukan Chrome iOS).</div>
          <div className="label">2. Tap <b>Share</b> → <b>Add to Home Screen</b> → <b>Add</b>.</div>
          <div className="label">3. Ikon KasSave muncul di beranda → buka seperti aplikasi.</div>
        </div>
        <div className="card">
          <div className="card-head"><h3>Laptop</h3><span className="badge savings">opsional</span></div>
          <div className="label">Di Chrome/Edge address bar ada ikon <b>Install</b> → klik → <b>Install</b>.</div>
          <div className="label">Cocok untuk bendahara yang input kas dari laptop.</div>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3><span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}><Icon name="card" size={18} /> Kenapa bukan Play Store?</span></h3></div>
        <div className="label">KasSave memakai teknologi PWA: install langsung dari website, tanpa upload ke Play Store, tanpa file APK, update otomatis tiap buka. Cukup share link <b>/unduh</b> ke grup kelas.</div>
      </div>
    </>
  );
}
