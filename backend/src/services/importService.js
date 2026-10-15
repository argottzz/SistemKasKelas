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
// Dinamis: pindai semua baris (bukan hardcode 4..42 / 4..15 / L4 saja) agar
// tahan terhadap tambahan baris Okt (36..47+), banyak baris nabung, dan label
// bulan yang salah (10 & 15 Okt tertulis NOVEMBER tapi tanggalnya Oktober).
async function parseKelas11Layout(buffer) {
  const ExcelJS2 = require('exceljs');
  const wb = new ExcelJS2.Workbook();
  await wb.xlsx.load(buffer);
  const ws = wb.getWorksheet('Kelas 11') || wb.worksheets[0];
  const { parseTanggalIndonesia: p, toNumberID: n } = require('../utils/dateId');
  const rows = [];
  const errors = [];
  // Nilai sel bisa berupa objek formula { result, formula } -> pakai result.
  const val = (cell) => {
    const v = cell ? cell.value : null;
    if (v && typeof v === 'object') {
      if (v.result !== undefined) return v.result;
      if (v.richText) return v.richText.map((x) => x.text).join('');
      if (v.text) return v.text;
    }
    return v;
  };
  const str = (v) => (v === null || v === undefined ? '' : String(v).trim());
  const push = (tglRaw, ket, jenis, nomRaw, penerima = null) => {
    const tgl = tglRaw instanceof Date ? p(tglRaw) : p(tglRaw);
    const nominal = n(nomRaw && nomRaw.result !== undefined ? nomRaw.result : nomRaw);
    if (!tgl || !nominal || !ket) { errors.push(`Lewati: ${ket} | ${tglRaw} | ${nomRaw}`); return; }
    rows.push({ tanggal_transaksi: tgl, keterangan: ket, jenis, nominal, penerima_tabungan: penerima, nama_kategori: null });
  };
  let hasOpening = false;
  ws.eachRow((row) => {
    const C = val(row.getCell(3)), D = val(row.getCell(4)), E = val(row.getCell(5));
    const G = val(row.getCell(7)), H = val(row.getCell(8)), I = val(row.getCell(9)), J = val(row.getCell(10));
    const L = val(row.getCell(12)), M = val(row.getCell(13));

    // Saldo awal: C mengandung "sisa". Nominal bisa di D (file asli) atau E (export app).
    if (typeof C === 'string' && /sisa/i.test(C)) {
      const nominal = n(E) ?? n(D);
      const tgl = p(D) || p(E);
      if (nominal && !hasOpening) {
        rows.push({ tanggal_transaksi: tgl || null, keterangan: str(C), jenis: 'opening_balance', nominal, penerima_tabungan: null, nama_kategori: null });
        hasOpening = true;
      } else if (!nominal) {
        errors.push('Saldo awal tidak valid');
      }
    } else if (typeof C !== 'string' || !/^(total|saldo akhir|uang di bendahara|ringkasan|pemasukan|pengeluaran|tabungan)/i.test(str(C))) {
      // Pemasukan: D tanggal valid + E nominal. Baris subtotal gugur sendiri.
      const tglIn = D instanceof Date ? p(D) : p(D);
      const nomIn = n(E);
      if (tglIn && nomIn) {
        rows.push({ tanggal_transaksi: tglIn, keterangan: `Iuran kas ${tglIn}`, jenis: 'income', nominal: nomIn, penerima_tabungan: null, nama_kategori: null });
      }
    } else if (/^saldo akhir/i.test(str(C))) {
      // Baris "Saldo Akhir ..." adalah net bulanan (bukan transaksi) -> lewati.
    }

    // Pengeluaran (kolom G-J): lewati baris total/saldo/ringkasan.
    if (typeof G !== 'string' || !/^(total|saldo|uang|ringkasan)/i.test(str(G))) {
      const tglOut = H instanceof Date ? p(H) : p(H);
      const nomOut = n(J);
      if (tglOut && nomOut) {
        const ket = str(I) || 'Pengeluaran';
        rows.push({ tanggal_transaksi: tglOut, keterangan: ket, jenis: 'expense', nominal: nomOut, penerima_tabungan: null, nama_kategori: null });
      }
    }

    // Nabung (kolom L-M): dukung banyak baris, lewati total/bawaan/ringkasan.
    // Baris bawaan "Saldo tabungan bawaan" tidak punya tanggal valid -> gugur sendiri.
    const tglSav = L instanceof Date ? p(L) : p(L);
    const nomSav = n(M);
    if (tglSav && nomSav) {
      rows.push({ tanggal_transaksi: tglSav, keterangan: 'Setoran tabungan ke guru', jenis: 'savings', nominal: nomSav, penerima_tabungan: 'Guru / Wali Kelas', nama_kategori: null });
    }
  });
  // Tanggal saldo awal tak diketahui -> ikuti pemasukan paling awal.
  const firstIncome = rows.filter((r) => r.jenis === 'income').map((r) => r.tanggal_transaksi).sort()[0];
  for (const r of rows) {
    if (r.jenis === 'opening_balance' && !r.tanggal_transaksi) r.tanggal_transaksi = firstIncome || '2026-07-23';
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
