// Parser tanggal Indonesia: "JUMAT, 24 JULI 2026" / "Senin, 27 Juli 2026" -> "2026-07-24"
const BULAN = {
  JANUARI: '01', FEBRUARI: '02', MARET: '03', APRIL: '04',
  MEI: '05', JUNI: '06', JULI: '07', AGUSTUS: '08',
  SEPTEMBER: '09', OKTOBER: '10', NOVEMBER: '11', DESEMBER: '12',
};

function parseTanggalIndonesia(value) {
  if (!value) return null;
  if (value instanceof Date && !isNaN(value)) {
    return value.toISOString().slice(0, 10);
  }
  const s = String(value).trim().toUpperCase().replace(/\s+/g, ' ');
  const m = s.match(/(\d{1,2})\s+([A-Z]+)\s+(\d{4})/);
  if (!m) return null;
  const dd = m[1].padStart(2, '0');
  const mm = BULAN[m[2]];
  if (!mm) return null;
  const yyyy = m[3];
  const iso = `${yyyy}-${mm}-${dd}`;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return iso;
}

function toNumberID(v) {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const s = String(v).replace(/Rp|\.|,00|,/gi, '').replace(/[^\d-]/g, '');
  if (s === '' || s === '-') return null;
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}

module.exports = { parseTanggalIndonesia, toNumberID };
