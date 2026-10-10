'use client';
import { useId } from 'react';

// Grafik area saldo kumulatif (SVG murni, tanpa library).
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
          <stop offset="0" stopColor="#2f54eb" stopOpacity=".35" />
          <stop offset="1" stopColor="#2f54eb" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${W},${H + 14} L0,${H + 14} Z`} fill={`url(#g${gid})`} />
      <path d={line} fill="none" stroke="#2f54eb" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={X(points.length - 1)} cy={Y(points[points.length - 1])} r="4" fill="#0f172a" />
    </svg>
  );
}

// Batang 7 hari terakhir: pemasukan (biru) vs pengeluaran (oranye).
export function WeekBars({ days }) {
  if (!days || !days.length) return <div className="label">Belum ada data minggu ini</div>;
  const mx = Math.max(...days.flatMap((d) => [d.income, d.expense]), 1);
  return (
    <div className="weekbars">
      {days.map((d, i) => (
        <div className="weekbar" key={i}>
          <div className="cols">
            <div className="cb in" style={{ height: Math.max(4, (d.income / mx) * 96) }} title={`Masuk ${d.income}`} />
            <div className="cb out" style={{ height: Math.max(4, (d.expense / mx) * 96) }} title={`Keluar ${d.expense}`} />
          </div>
          <span>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// Gauge setengah lingkaran: porsi pengeluaran dari total dana masuk.
export function Gauge({ ratio, label }) {
  const r = 64, cx = 80, cy = 78;
  const arc = (a0, a1) => {
    const p = (a) => [cx + r * Math.cos(a), cy - r * Math.sin(a)];
    const [x0, y0] = p(a0), [x1, y1] = p(a1);
    return `M${x0.toFixed(1)},${y0.toFixed(1)} A${r},${r} 0 0 1 ${x1.toFixed(1)},${y1.toFixed(1)}`;
  };
  const cl = Math.min(Math.max(ratio, 0), 1);
  return (
    <svg viewBox="0 0 160 92" style={{ width: '100%', maxWidth: 260, display: 'block', margin: '0 auto' }} role="img" aria-label={label}>
      <path d={arc(Math.PI, 0)} fill="none" stroke="#e8edf5" strokeWidth="13" strokeLinecap="round" />
      <path d={arc(Math.PI, Math.PI - cl * Math.PI)} fill="none" stroke={cl < 0.34 ? '#2f54eb' : cl < 0.67 ? '#22c55e' : '#f97316'} strokeWidth="13" strokeLinecap="round" />
      <text x={cx} y={cy - 12} textAnchor="middle" fontSize="19" fontWeight="800" fill="#0f172a">{Math.round(cl * 100)}%</text>
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize="10" fill="#64748b">{label}</text>
    </svg>
  );
}
