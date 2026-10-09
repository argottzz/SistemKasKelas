const crypto = require('crypto');
const ExcelJS = require('exceljs');
const { parseTanggalIndonesia, toNumberID } = require('../utils/dateId');

const previews = new Map(); // previewId -> { rows, totals, fileHash, namaFile }

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function normJenis(v) {
  const s = String(v || '').trim().toLowerCase();
  if (['income', 'pemasukan', 'masuk', 'in'].includes(s)) return 'income';
  if (['expense', 'pengeluaran', 'keluar', 'out'].includes(s)) return 'expense';
  if (['savings', 'tabungan', 'nabung', 'saving'].includes(s)) return 'savings';
  if (['opening_balance', 'saldo awal', 'saldo_awal', 'sisa'].includes(s)) return 'opening_balance';
  return null;
}

// Template umum: baris 1 header [tanggal, keterangan, jenis, nominal, penerima_tabungan, kategori]
// Plus fallback otomatis untuk layout "Kelas 11" (3 blok) bila header tidak cocok.
async function parseWorkbook(buffer) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const ws = wb.worksheets[0];
  if (!ws) return { rows: [], errors: ['Sheet kosong'] };

  const header = [];
  ws.getRow(1).eachCell((c) => header.push(String(c.value || '').trim().toLowerCase()));
  const hasTemplate = header.some((h) => h.includes('tanggal')) && header.some((h) => h.includes('jenis') || h.includes('nominal'));

  if (hasTemplate) return parseTemplate(ws);
  return parseKelas11Layout(buffer);
}

function parseTemplate(ws) {
  // petakan indeks kolom dari header
  const idx = {};
  ws.getRow(1).eachCell((c, col) => { idx[String(c.value || '').trim().toLowerCase()] = col; });
  const findCol = (...names) => {
    for (const n of names) {
      for (const k of Object.keys(idx)) if (k.includes(n)) return idx[k];
    }
    return null;
  };
  const cTgl = findCol('tanggal');
  const cKet = findCol('keterangan');
  const cJenis = findCol('jenis');
  const cNom = findCol('nominal', 'jumlah');
  const cTerima = findCol('penerima', 'tabungan');
  const cKat = findCol('kategori');

  const rows = [];
  const errors = [];
  ws.eachRow((row, n) => {
    if (n === 1) return;
    const get = (c) => (c ? row.getCell(c).value : null);
    const rawTgl = get(cTgl);
    let tgl = null;
    if (rawTgl instanceof Date) tgl = rawTgl.toISOString().slice(0, 10);
    else if (typeof rawTgl === 'string') {
      const iso = parseTanggalIndonesia(rawTgl);
      tgl = iso || (isNaN(new Date(rawTgl).getTime()) ? null : new Date(rawTgl).toISOString().slice(0, 10));
    }
    const keterangan = get(cKet) ? String(get(cKet)).trim() : '';
    const jenis = normJenis(get(cJenis));
    let nominal = get(cNom);
    if (typeof nominal === 'string') nominal = toNumberID(nominal);
    nominal = Number(nominal);
    const penerima = get(cTerima) ? String(get(cTerima)).trim() : null;
    const kategori = get(cKat) ? String(get(cKat)).trim() : null;
    if (!tgl && !keterangan && !jenis && !nominal) return; // baris kosong
    const err = [];
    if (!tgl) err.push('tanggal invalid');
    if (!jenis) err.push('jenis invalid');
    if (!Number.isFinite(nominal) || nominal <= 0) err.push('nominal invalid');
    if (!keterangan) err.push('keterangan kosong');
    if (jenis === 'savings' && !penerima) err.push('penerima tabungan wajib');
    if (err.length) { errors.push(`Baris ${n}: ${err.join(', ')}`); return; }
    rows.push({ tanggal_transaksi: tgl, keterangan, jenis, nominal, penerima_tabungan: jenis === 'savings' ? penerima : null, nama_kategori: kategori });
  });
  return { rows, errors };
}

// Layout khusus Kelas 11: dipakai juga oleh seed (dipanggil dari script seed via modul ini bila perlu)
async function parseKelas11Layout(buffer) {
  const ExcelJS2 = require('exceljs');
  const wb = new ExcelJS2.Workbook();
  await wb.xlsx.load(buffer);
  const ws = wb.getWorksheet('Kelas 11') || wb.worksheets[0];
  const { parseTanggalIndonesia: p, toNumberID: n } = require('../utils/dateId');
  const rows = [];
  const errors = [];
  const push = (tglRaw, ket, jenis, nomRaw, penerima = null) => {
    const tgl = p(tglRaw);
    const nominal = n(nomRaw);
    if (!tgl || !nominal || !ket) { errors.push(`Lewati: ${ket} | ${tglRaw} | ${nomRaw}`); return; }
    rows.push({ tanggal_transaksi: tgl, keterangan: ket, jenis, nominal, penerima_tabungan: penerima, nama_kategori: null });
  };
  push('23 Juli 2026', 'Sisa uang kas kelas 10', 'opening_balance', 476000);
  // Pemasukan: kolom C/D/E (3,4,5) baris 4..42, lewati baris total
  ws.eachRow((row, r) => {
    if (r < 4 || r > 42) return;
    const label = String(row.getCell(3).value || '').trim();
    if (/^total/i.test(label)) return;
    const tglRaw = row.getCell(4).value;
    const nom = row.getCell(5).value;
    if (tglRaw && nom && n(nom)) {
      push(typeof tglRaw === 'string' ? tglRaw : String(tglRaw), `Iuran kas ${p(typeof tglRaw === 'string' ? tglRaw : String(tglRaw)) || ''}`.trim(), 'income', nom);
    }
  });
  // Pengeluaran: kolom G/H/I/J (7,8,9,10)
  ws.eachRow((row, r) => {
    if (r < 4 || r > 15) return;
    const label = String(row.getCell(7).value || '').trim();
    if (/^total/i.test(label)) return;
    const tglRaw = row.getCell(8).value;
    const ket = row.getCell(9).value ? String(row.getCell(9).value).trim() : '';
    const nom = row.getCell(10).value;
    if (tglRaw && ket && nom && n(nom)) push(typeof tglRaw === 'string' ? tglRaw : String(tglRaw), ket, 'expense', nom);
  });
  // Tabungan: kolom L/M (12,13) baris 4
  const tglNabung = ws.getCell('L4').value;
  const nomNabung = ws.getCell('M4').value;
  if (tglNabung && nomNabung) {
    push(typeof tglNabung === 'string' ? tglNabung : String(tglNabung), 'Setoran tabungan ke guru', 'savings', nomNabung, 'Guru / Wali Kelas');
  }
  return { rows, errors };
}

function totals(rows) {
  const t = { income: 0, expense: 0, savings: 0, opening: 0 };
  for (const r of rows) {
    if (r.jenis === 'income') t.income += r.nominal;
    else if (r.jenis === 'expense') t.expense += r.nominal;
    else if (r.jenis === 'savings') t.savings += r.nominal;
    else if (r.jenis === 'opening_balance') t.opening += r.nominal;
  }
  return t;
}

module.exports = { previews, sha256, parseWorkbook, parseKelas11Layout, totals, normJenis };
