'use client';
import Link from 'next/link';
import InstallButton from '../../components/InstallButton';
import { Icon } from '../../components/icons';

const PWA_POINTS = [
  { title: 'Tanpa file APK', desc: 'Install langsung dari website, tanpa Play Store.' },
  { title: 'Hemat penyimpanan', desc: 'Ringan, ikon kecil, tidak makan memori HP.' },
  { title: 'Pembaruan otomatis', desc: 'Selalu versi terbaru setiap dibuka.' },
];

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
        <Link className="btn ghost unduh-publik" href="/publik">
          <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}><Icon name="eye" size={17} /> Lihat kas publik</span>
        </Link>
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
          <div className="card-head">
            <h3 className="plat-head"><span className="plat-ico"><Icon name="phone" size={20} /></span> Android (Chrome)</h3>
            <span className="badge badge-muted">1 menit</span>
          </div>
          <div className="step-list">
            <div className="step-item">1. Tap tombol Download di atas → pilih <b>Install</b>.</div>
            <div className="step-item">2. Kalau tidak ada notif: titik 3 di Chrome → <b>Add to Home screen / Install app</b>.</div>
            <div className="step-item">3. Ikon KasSave muncul di beranda → buka fullscreen.</div>
          </div>
        </div>
        <div className="card" id="iphone">
          <div className="card-head">
            <h3 className="plat-head"><span className="plat-ico"><Icon name="apple" size={20} /></span> iPhone (Safari)</h3>
            <span className="badge badge-muted">1 menit</span>
          </div>
          <div className="step-list">
            <div className="step-item">1. Buka halaman ini di <b>Safari</b> (bukan Chrome iOS).</div>
            <div className="step-item">2. Tap <b>Share</b> → <b>Add to Home Screen</b> → <b>Add</b>.</div>
            <div className="step-item">3. Ikon KasSave muncul di beranda → buka seperti aplikasi.</div>
          </div>
        </div>
        <div className="card">
          <div className="card-head">
            <h3 className="plat-head"><span className="plat-ico"><Icon name="monitor" size={20} /></span> Laptop</h3>
            <span className="badge badge-muted">opsional</span>
          </div>
          <div className="step-list">
            <div className="step-item">Di Chrome/Edge address bar ada ikon <b>Install</b> → klik → <b>Install</b>.</div>
            <div className="step-item">Cocok untuk bendahara yang input kas dari laptop.</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3><span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}><Icon name="download" size={18} /> Kenapa bukan Play Store?</span></h3></div>
        <ul className="pwa-points">
          {PWA_POINTS.map((p) => (
            <li key={p.title}>
              <span className="pwa-check"><Icon name="check" size={14} /></span>
              <span><b>{p.title}</b> — {p.desc}</span>
            </li>
          ))}
        </ul>
        <div className="label" style={{ marginTop: 10, marginBottom: 0 }}>Cukup share link <b>/unduh</b> ke grup kelas.</div>
      </div>
    </>
  );
}
