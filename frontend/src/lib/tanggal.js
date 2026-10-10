// Util tanggal Indonesia untuk format laporan ala file asli:
// "Jumat, 24 Juli 2026", label bulan "JULI", dan parsing balikannya.
export const NAMA_HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
export const NAMA_BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const IDX_BULAN = { JANUARI: 0, FEBRUARI: 1, MARET: 2, APRIL: 3, MEI: 4, JUNI: 5, JULI: 6, AGUSTUS: 7, SEPTEMBER: 8, OKTOBER: 9, NOVEMBER: 10, DESEMBER: 11 };

export function fmtExcel(iso) {
  if (!iso) return '';
  const d = new Date(String(iso).slice(0, 10) + 'T00:00:00');
  if (isNaN(d.getTime())) return String(iso);
  return `${NAMA_HARI[d.getDay()]}, ${d.getDate()} ${NAMA_BULAN[d.getMonth()]} ${d.getFullYear()}`;
}

export function monthKey(iso) {
  return String(iso).slice(0, 7); // '2026-07'
}

export function monthNameUpper(key) {
  const m = Number(String(key).slice(5, 7)) - 1;
  return (NAMA_BULAN[m] || '').toUpperCase();
}

export function monthNameTitle(key) {
  const m = Number(String(key).slice(5, 7)) - 1;
  return NAMA_BULAN[m] || key;
}

// 'JUMAT, 24 JULI 2026' / 'Senin, 27 Juli 2026' / '2026-07-24' / Date -> 'YYYY-MM-DD'
export function parseID(v) {
  if (v === null || v === undefined || v === '') return null;
  if (v instanceof Date && !isNaN(v)) {
    return `${v.getFullYear()}-${String(v.getMonth() + 1).padStart(2, '0')}-${String(v.getDate()).padStart(2, '0')}`;
  }
  const s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const m = s.toUpperCase().replace(/\s+/g, ' ').match(/(\d{1,2})\s+([A-Z]+)\s+(\d{4})/);
  if (!m) return null;
  const mi = IDX_BULAN[m[2]];
  if (mi === undefined) return null;
  const iso = `${m[3]}-${String(mi + 1).padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  return isNaN(new Date(iso + 'T00:00:00').getTime()) ? null : iso;
}

export function todayID() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
