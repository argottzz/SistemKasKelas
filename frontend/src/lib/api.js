const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

async function req(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { message: text }; }
  if (!res.ok) throw new Error(data?.message || `Error ${res.status}`);
  return data;
}

export const api = {
  get: (p) => req(p),
  post: (p, body) => req(p, { method: 'POST', body: JSON.stringify(body) }),
  put: (p, body) => req(p, { method: 'PUT', body: JSON.stringify(body) }),
  del: (p) => req(p, { method: 'DELETE' }),
  upload: async (p, formData) => {
    const res = await fetch(`${API}${p}`, { method: 'POST', credentials: 'include', body: formData });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || `Error ${res.status}`);
    return data;
  },
};

export const rupiah = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(n) || 0);

export const fmtTanggal = (iso) => {
  if (!iso) return '-';
  const d = new Date(iso.length <= 10 ? iso + 'T00:00:00' : iso);
  return d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
};

export const labelJenis = (j) =>
  ({ income: 'Pemasukan', expense: 'Pengeluaran', savings: 'Tabungan', opening_balance: 'Saldo Awal' }[j] || j);
