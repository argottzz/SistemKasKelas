// Penyimpanan lokal KasSave (pengganti backend + MySQL).
// Sumber kebenaran = localStorage browser; data awal dibundel di awal.json.
import awal from '../data/awal.json';

const TX_KEY = 'kassave_tx_v1';
const IMP_KEY = 'kassave_imports_v1';
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

function write(key, val) {
  window.localStorage.setItem(key, JSON.stringify(val));
}

function seed() {
  return awal.map((r, i) => ({ id: i + 1, ...r }));
}

// ---------- Transaksi ----------
export function loadTx() {
  const l = read(TX_KEY, null);
  if (Array.isArray(l) && l.length) return l;
  const s = seed();
  if (isBrowser) write(TX_KEY, s);
  return s;
}

export function summary(list) {
  const t = { opening: 0, income: 0, expense: 0, savings: 0 };
  for (const r of list) {
    if (r.jenis === 'opening_balance') t.opening += r.nominal;
    else if (r.jenis === 'income') t.income += r.nominal;
    else if (r.jenis === 'expense') t.expense += r.nominal;
    else if (r.jenis === 'savings') t.savings += r.nominal;
  }
  return {
    opening_balance: t.opening,
    total_income: t.income,
    total_expense: t.expense,
    total_savings: t.savings,
    saldo_tersedia: t.opening + t.income - t.expense - t.savings,
    jumlah_transaksi: list.length,
    peringatan_saldo_besar: t.opening + t.income - t.expense - t.savings > 1000000,
  };
}

export function validateTx({ jenis, nominal, tanggal, keterangan, penerima }) {
  if (!['income', 'expense', 'savings', 'opening_balance'].includes(jenis)) return 'Jenis tidak valid';
  if (!Number.isFinite(Number(nominal)) || Number(nominal) <= 0) return 'Nominal harus lebih dari 0';
  if (!tanggal) return 'Tanggal wajib diisi';
  if (!String(keterangan || '').trim()) return 'Keterangan wajib diisi';
  if (jenis === 'savings' && !String(penerima || '').trim()) return 'Nama penerima wajib diisi';
  return null;
}

export function addTx({ jenis, nominal, tanggal, keterangan, penerima }) {
  const err = validateTx({ jenis, nominal, tanggal, keterangan, penerima });
  if (err) throw new Error(err);
  const l = loadTx();
  const id = l.length ? Math.max(...l.map((t) => t.id)) + 1 : 1;
  const row = {
    id,
    jenis,
    nominal: Number(nominal),
    tanggal: String(tanggal).slice(0, 10),
    keterangan: String(keterangan).trim(),
    penerima: jenis === 'savings' ? String(penerima).trim() : null,
  };
  write(TX_KEY, [...l, row]);
  return row;
}

export function addMany(rows) {
  const l = loadTx();
  let id = l.length ? Math.max(...l.map((t) => t.id)) : 0;
  const clean = rows.map((r) => ({ ...r, id: ++id }));
  write(TX_KEY, [...l, ...clean]);
  return clean.length;
}

export function removeTx(id) {
  write(TX_KEY, loadTx().filter((t) => t.id !== Number(id)));
}

// ---------- Impor (anti ganda via hash file) ----------
export function getImportLog() {
  return read(IMP_KEY, []);
}

export function hasHash(h) {
  return getImportLog().some((x) => x.hash === h);
}

export function addHash(hash, info) {
  const log = getImportLog();
  write(IMP_KEY, [{ hash, at: new Date().toISOString(), ...info }, ...log].slice(0, 50));
}

export async function sha256hex(buf) {
  try {
    const d = await crypto.subtle.digest('SHA-256', buf);
    return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    let h = 5381;
    const v = new Uint8Array(buf);
    for (let i = 0; i < v.length; i++) h = ((h << 5) + h + v[i]) >>> 0;
    return 'djb2-' + h.toString(16);
  }
}

// ---------- Profil lokal ----------
export function getProfile() {
  return read(PROF_KEY, { nama: '', foto: null });
}

export function saveProfile(p) {
  const cur = getProfile();
  const next = { nama: String(p.nama || '').trim().slice(0, 100), foto: p.foto || null };
  write(PROF_KEY, { ...cur, ...next });
  return getProfile();
}
