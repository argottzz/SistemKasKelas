// Profil lokal (nama + foto) tetap tersimpan di browser masing-masing perangkat.
// Data transaksi kini dari Supabase via API routes (/api/...), bukan file ini.
const PROF_KEY = 'kassave_profile_v1';

const isBrowser = typeof window !== 'undefined';

function read(key, fb) {
  if (!isBrowser) return fb;
  try {
    const v = window.localStorage.getItem(key);
    return v ? JSON.parse(v) : fb;
  } catch {
    return fb;
  }
}

export function getProfile() {
  return read(PROF_KEY, { nama: '', foto: null });
}

export function saveProfile(p) {
  const cur = getProfile();
  const next = { nama: String(p.nama || '').trim().slice(0, 100), foto: p.foto || null };
  window.localStorage.setItem(PROF_KEY, JSON.stringify({ ...cur, ...next }));
  return getProfile();
}
