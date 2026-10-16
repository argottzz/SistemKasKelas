// Daftar email bendahara dari env BENDAHARA_EMAILS (pisah koma).
// Dipakai middleware (Edge) + API routes (Node). Tanpa dependensi.
// Kosong = tolak semua (fail-closed) agar lupa isi env tidak membuka akses.
export function getAllowlist() {
  const raw = process.env.BENDAHARA_EMAILS || '';
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isBendahara(email) {
  const list = getAllowlist();
  if (!list.length) return false;
  return !!email && list.includes(String(email).toLowerCase());
}
