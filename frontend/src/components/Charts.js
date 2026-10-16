'use client';
import { useId, useState } from 'react';
import { rupiah } from '../lib/api';

// Grafik area saldo kumulatif (SVG murni, tanpa library). Palet logo: navy, hijau, emas.
export function AreaChart({ points, height = 170 }) {
  const gid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const W = 320, H = 100;
  if (!points || points.length < 2) {
    return <div className="label" style={{ padding: '40px 0', textAlign: 'center' }}>Belum cukup data untuk grafik</div>;
  }
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const X = (i) => (i / (points.length - 1)) * W;
  const Y = (v) => H - 8 - ((v - min) / span) * (H - 20);
  const line = points.map((v, i) => `${i === 0 ? 'M' : 'L'}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H + 14}`} style={{ width: '100%', height, display: 'block' }} role="img" aria-label="Grafik saldo">
      <defs>
        <linearGradient id={`g${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2FA36B" stopOpacity=".35" />
          <stop offset="1" stopColor="#2FA36B" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${W},${H + 14} L0,${H + 14} Z`} fill={`url(#g${gid})`} />
      <path d={line} fill="none" stroke="#2FA36B" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={X(points.length - 1)} cy={Y(points[points.length - 1])} r="4" fill="#2FA36B" stroke="#fff" strokeWidth="1.5" />
    </svg>
  );
}

// Arus kas bulanan: garis + area nilai bersih per bulan, sumbu X nama bulan,
// gridline Y, titik + label di puncak. Data: [{label, key, masuk, keluar, savings, net}].
// Arahkan kursor / ketuk titik mana pun -> tooltip rincian bulan itu.
export function MonthlyFlow({ data }) {
  const [hov, setHov] = useState(-1);
  const gid = useId().replace(/[^a-zA-Z0-9]/g, '');
  if (!data || data.length < 2) {
    return <div className="label" style={{ padding: '40px 0', textAlign: 'center' }}>Belum cukup data untuk grafik</div>;
  }
  // Semua nol -> garis datar 0 menipu; tampilkan empty state netral.
  const kosong = data.every((d) => !Number(d.masuk) && !Number(d.keluar) && !Number(d.savings));
  if (kosong) {
    return <div className="label" style={{ padding: '40px 0', textAlign: 'center' }}>Belum ada data keuangan untuk ditampilkan</div>;
  }
  const W = 640, H = 170, padB = 24, padT = 26, padX = 10;
  const vals = data.map((d) => d.net);
  const lo = Math.min(...vals, 0), hi = Math.max(...vals, 0);
  const span = hi - lo || 1;
  // Tick sumbu Y bulat-bulat (snap 1 / 2 / 2.5 / 5 x orde) biar label rapi.
  const rawStep = span / 3;
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const norm = rawStep / mag;
  const step = (norm >= 5 ? 5 : norm >= 2.5 ? 2.5 : norm >= 2 ? 2 : 1) * mag;
  const t0 = Math.floor(lo / step) * step;
  const ticks = [0, 1, 2, 3, 4, 5].map((i) => t0 + i * step).filter((v) => v >= lo && v <= hi);
  const halo = { paintOrder: 'stroke', stroke: 'var(--card)', strokeWidth: 4 };
  const X = (i) => padX + (i / (data.length - 1)) * (W - padX * 2);
  const Y = (v) => padT + (1 - (v - lo) / span) * (H - padT - padB);
  const line = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${X(i).toFixed(1)},${Y(d.net).toFixed(1)}`).join(' ');
  const shortRp = (v) => {
    const a = Math.abs(v);
    if (a >= 1e6) return `${(v / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt`;
    if (a >= 1e3) return `${Math.round(v / 1e3)} rb`;
    return `${v}`;
  };
  // Kotak tooltip bulan yang di-hover: Masuk / Keluar / Tabungan / Bersih.
  const hd = hov >= 0 && hov < data.length ? data[hov] : null;
  const hx = hd ? X(hov) : 0, hy = hd ? Y(hd.net) : 0;
  const hTitle = hd ? (hd.key ? new Date(hd.key + '-01T00:00:00').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) : hd.label) : '';
  const hMasuk = hd ? (hd.masuk ?? hd.income ?? 0) : 0;
  const hKeluar = hd ? (hd.keluar ?? hd.expense ?? 0) : 0;
  const hSav = hd ? (hd.savings ?? 0) : 0;
  // Tooltip HTML (overlay) — tidak terpotong batas SVG. Flip di tepi.
  const tipLeft = `${(hx / W) * 100}%`;
  const tipTop = `${(hy / H) * 100}%`;
  const tipTransform = `${hx > W - 230 ? 'translateX(calc(-100% - 14px))' : 'translateX(14px)'} ${hy > H * 0.5 ? 'translateY(calc(-100% - 12px))' : 'translateY(16px)'}`;
  return (
    <div className="monthly-wrap">
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block', color: 'var(--muted)' }} role="img" aria-label="Grafik arus kas bulanan">
      <defs>
        <linearGradient id={`f${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#BE861C" stopOpacity=".35" />
          <stop offset="1" stopColor="#BE861C" stopOpacity="0" />
        </linearGradient>
      </defs>
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={padX} y1={Y(t)} x2={W - padX} y2={Y(t)} stroke="currentColor" strokeOpacity=".25" strokeDasharray="4 4" />
          <text x={padX + 2} y={Y(t) - 4} fontSize="10" fill="currentColor" style={halo}>{shortRp(Math.round(t))}</text>
        </g>
      ))}
      <path d={`${line} L${X(data.length - 1)},${H - padB} L${X(0)},${H - padB} Z`} fill={`url(#f${gid})`} />
      <path d={line} fill="none" stroke="#BE861C" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => (
        <text key={i} x={X(i)} y={H - 8} textAnchor="middle" fontSize="10" fill="currentColor">{d.label}</text>
      ))}
      {data.map((d, i) => (
        <g key={`h${i}`}>
          {hov === i && <circle cx={X(i)} cy={Y(d.net)} r="6" fill="#BE861C" stroke="#fff" strokeWidth="2" />}
          <circle
            cx={X(i)}
            cy={Y(d.net)}
            r="13"
            fill="transparent"
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => setHov(i)}
            onMouseLeave={() => setHov(-1)}
            onClick={() => setHov(hov === i ? -1 : i)}
          />
        </g>
      ))}
    </svg>
      {hd && (
        <div className="mtip" style={{ left: tipLeft, top: tipTop, transform: tipTransform }}>
          <b>{hTitle}</b>
          <span>Masuk <b>{rupiah(hMasuk)}</b></span>
          <span>Keluar <b>{rupiah(hKeluar)}</b></span>
          <span>Tabungan <b>{rupiah(hSav)}</b></span>
          <span className="bersih">Bersih {rupiah(hd.net)}</span>
        </div>
      )}
    </div>
  );
}

// Batang per periode: pemasukan (biru) vs pengeluaran (oranye).
// Arahkan kursor / ketuk bar -> baris info di atas menampilkan nominalnya.
export function WeekBars({ days, hint }) {
  const [hi, setHi] = useState(-1);
  if (!days || !days.length) return <div className="label">Belum ada data minggu ini</div>;
  const mx = Math.max(...days.flatMap((d) => [d.income, d.expense]), 1);
  const d = hi >= 0 && hi < days.length ? days[hi] : null;
  return (
    <>
      <div className="wbinfo label" aria-live="polite">
        {d ? (
          <span>
            <b>{d.label}</b> • Masuk {rupiah(d.income)} • Keluar {rupiah(d.expense)}
            {d.savings > 0 && <> • Tabungan {rupiah(d.savings)}</>}
            {d.net !== undefined && d.net !== null && <> • Bersih {rupiah(d.net)}</>}
          </span>
        ) : (hint || 'Arahkan kursor / ketuk bar untuk detail nominal')}
      </div>
      <div className="weekbars">
        {days.map((x, i) => (
          <div
            className={`weekbar${hi === i ? ' hot' : ''}`}
            key={i}
            onMouseEnter={() => setHi(i)}
            onMouseLeave={() => setHi(-1)}
            onClick={() => setHi(hi === i ? -1 : i)}
          >
            <div className="cols">
              <div className="cb in" style={{ height: Math.max(4, (x.income / mx) * 96) }} />
              <div className="cb out" style={{ height: Math.max(4, (x.expense / mx) * 96) }} />
            </div>
            <span>{x.label}</span>
          </div>
        ))}
      </div>
    </>
  );
}

// Gauge setengah lingkaran: porsi pengeluaran dari total dana masuk. Satu warna primer (hemat palet).
export function Gauge({ ratio, label }) {
  const r = 64, cx = 80, cy = 78;
  const arc = (a0, a1) => {
    const p = (a) => [cx + r * Math.cos(a), cy - r * Math.sin(a)];
    const [x0, y0] = p(a0), [x1, y1] = p(a1);
    return `M${x0.toFixed(1)},${y0.toFixed(1)} A${r},${r} 0 0 1 ${x1.toFixed(1)},${y1.toFixed(1)}`;
  };
  const cl = Math.min(Math.max(ratio, 0), 1);
  return (
    <svg viewBox="0 0 160 92" style={{ width: '100%', maxWidth: 260, display: 'block', margin: '0 auto', color: 'var(--ink)' }} role="img" aria-label={label}>
      <path d={arc(Math.PI, 0)} fill="none" stroke="rgba(47,163,107,.25)" strokeWidth="13" strokeLinecap="round" />
      <path d={arc(Math.PI, Math.PI - cl * Math.PI)} fill="none" stroke="#2FA36B" strokeWidth="13" strokeLinecap="round" />
      <text x={cx} y={cy - 12} textAnchor="middle" fontSize="19" fontWeight="800" fill="currentColor">{Math.round(cl * 100)}%</text>
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize="10" fill="currentColor" opacity=".65">{label}</text>
    </svg>
  );
}
