// Helper format murni (tidak ada fetch / akses database).
// Frontend offline: data dari localStorage (lib/store.js), bukan dari backend/Supabase.

export const rupiah = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(n) || 0);

export const fmtTanggal = (iso) => {
  if (!iso) return '-';
  const d = new Date(iso.length <= 10 ? iso + 'T00:00:00' : iso);
  return d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
};

export const labelJenis = (j) =>
  ({ income: 'Pemasukan', expense: 'Pengeluaran', savings: 'Tabungan', opening_balance: 'Saldo Awal' }[j] || j);
