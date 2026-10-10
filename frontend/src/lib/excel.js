// Export & impor Excel KasSave — format menyerupai "Laporan Kas RPL 2 2627"
// sheet "Kelas 11": blok Pemasukan | Pengeluaran | Nabung + baris saldo awal & total.
import * as XLSX from 'xlsx';
import { fmtExcel, monthKey, monthNameUpper, monthNameTitle, parseID, todayID } from './tanggal';

function num(v) {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') return Number.isFinite(v) && v > 0 ? v : null;
  const n = Number(String(v).replace(/[^0-9-]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function sortedMonths(rows) {
  return [...new Set(rows.map((r) => monthKey(r.tanggal)))].sort();
}

// rows: [{jenis, nominal, tanggal, keterangan, penerima}]
export function buildWorkbook(rows) {
  const opening = rows.find((r) => r.jenis === 'opening_balance');
  const incomes = rows.filter((r) => r.jenis === 'income').sort((a, b) => (a.tanggal < b.tanggal ? -1 : 1));
  const expenses = rows.filter((r) => r.jenis === 'expense').sort((a, b) => (a.tanggal < b.tanggal ? -1 : 1));
  const savings = rows.filter((r) => r.jenis === 'savings').sort((a, b) => (a.tanggal < b.tanggal ? -1 : 1));

  // Blok kolom C-E (pemasukan): [bulan, tanggal, jumlah]
  const inc = [];
  if (opening) inc.push(['Sisa uang kas kelas 10', fmtExcel(opening.tanggal), opening.nominal]);
  for (const k of sortedMonths(incomes)) {
    const list = incomes.filter((r) => monthKey(r.tanggal) === k);
    list.forEach((r, i) => inc.push([i === 0 ? monthNameUpper(k) : '', fmtExcel(r.tanggal), r.nominal]));
    inc.push([`Total Pemasukan ${monthNameTitle(k)}`, '', list.reduce((a, r) => a + r.nominal, 0)]);
  }

  // Blok kolom G-J (pengeluaran): [bulan, tanggal, keterangan, jumlah]
  const exp = [];
  for (const k of sortedMonths(expenses)) {
    const list = expenses.filter((r) => monthKey(r.tanggal) === k);
    list.forEach((r, i) => exp.push([i === 0 ? monthNameUpper(k) : '', fmtExcel(r.tanggal), r.keterangan, r.nominal]));
    exp.push([`Total Pengeluaran ${monthNameTitle(k)}`, '', '', list.reduce((a, r) => a + r.nominal, 0)]);
  }
  const totalExp = expenses.reduce((a, r) => a + r.nominal, 0);
  if (expenses.length) exp.push(['Total', '', '', totalExp]);

  // Blok kolom L-M (nabung): [tanggal, jumlah]
  const sav = savings.map((r) => [fmtExcel(r.tanggal), r.nominal]);

  const n = Math.max(inc.length, exp.length, sav.length, 1);
  const aoa = [];
  aoa.push([]); // baris 1 kosong (seperti file asli)
  aoa.push(['', '', 'Pemasukan S1', '', '', '', 'Pengeluaran S1', '', '', '', '', 'Nabung', '']); // baris 2
  aoa.push(['', '', 'Bulan', 'Hari & Tanggal', 'Jumlah', '', 'Bulan', 'Hari & Tanggal', 'Keterangan', 'Jumlah', '', 'Hari & Tanggal', 'Jumlah']); // baris 3
  for (let i = 0; i < n; i++) {
    const a = inc[i] || ['', '', ''];
    const b = exp[i] || ['', '', '', ''];
    const c = sav[i] || ['', ''];
    aoa.push(['', '', a[0], a[1], a[2], '', b[0], b[1], b[2], b[3], '', c[0], c[1]]);
  }
  const t = { opening: opening?.nominal || 0, income: incomes.reduce((a, r) => a + r.nominal, 0), expense: totalExp, savings: savings.reduce((a, r) => a + r.nominal, 0) };
  const saldo = t.opening + t.income - t.expense - t.savings;
  aoa.push(['', '', 'Total', saldo, '', '', '', '', '', '', '', '', '']);

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = [{}, {}, { wch: 24 }, { wch: 24 }, { wch: 14 }, {}, { wch: 26 }, { wch: 24 }, { wch: 34 }, { wch: 14 }, {}, { wch: 24 }, { wch: 14 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Kelas 11');
  return { wb, totals: { ...t, saldo }, count: rows.length };
}

export function downloadExcel(rows) {
  const { wb, totals } = buildWorkbook(rows);
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  XLSX.writeFile(wb, `KasSave-Kelas11-${stamp}.xlsx`);
  return totals;
}

// Baca kembali file format di atas (hasil export aplikasi ini maupun file asli).
// Catatan: blok pemasukan & nabung file asli tidak punya kolom keterangan,
// sehingga keterangan diregenerasi ("Iuran kas {tanggal}" / "Setoran tabungan").
export function parseWorkbook(arrayBuffer) {
  const wb = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
  const ws = wb.Sheets['Kelas 11'] || wb.Sheets[wb.SheetNames[0]];
  if (!ws) return { rows: [], errors: ['Sheet kosong'] };
  const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: true });

  const rows = [];
  const errors = [];
  let hasOpening = false;

  // Deteksi kolom dari baris judul (tahan terhadap kolom kosong di depan
  // yang kadang dipangkas pustaka Excel, seperti pada file asli).
  // Fallback = layout file aplikasi (A,B kosong: C=2, D=3, E=4, dst).
  let cBulan1 = 2, cTgl1 = 3, cJml1 = 4, cBulan2 = 6, cTgl2 = 7, cKet2 = 8, cJml2 = 9, cTgl3 = 11, cJml3 = 12;
  const headRow = aoa.find((r) => r && r.some((v) => typeof v === 'string' && /hari\s*&\s*tanggal/i.test(v)));
  if (headRow) {
    const idx = [];
    headRow.forEach((v, i) => { if (typeof v === 'string' && /hari\s*&\s*tanggal/i.test(v)) idx.push(i); });
    if (idx.length >= 1) { cTgl1 = idx[0]; cBulan1 = idx[0] - 1; cJml1 = idx[0] + 1; }
    if (idx.length >= 2) { cTgl2 = idx[1]; cBulan2 = idx[1] - 1; cKet2 = idx[1] + 1; cJml2 = idx[1] + 2; }
    if (idx.length >= 3) { cTgl3 = idx[2]; cJml3 = idx[2] + 1; }
  }
  // Catatan: baris pertama yang kosong pada sheet (seperti file asli)
  // tidak disimpan oleh pustaka Excel, jadi JANGAN filter by nomor baris.
  // Setiap blok (C-E, G-J, L-M) dinilai independen berdasarkan isinya:
  // baris judul/subtotal gugur sendiri karena tanggal/nominalnya tak valid.
  aoa.forEach((r) => {
    if (!r) return;
    const C = r[cBulan1], D = r[cTgl1], E = r[cJml1];
    const G = r[cBulan2], H = r[cTgl2], I = r[cKet2], J = r[cJml2];
    const L = r[cTgl3], M = r[cJml3];

    // Saldo awal: sel C berisi kata "Sisa". Nominal bisa di D (file asli) atau E (file aplikasi).
    if (typeof C === 'string' && /sisa/i.test(C)) {
      const nominal = num(E) ?? num(D);
      const tgl = parseID(D) || parseID(E);
      if (nominal && !hasOpening) {
        rows.push({ jenis: 'opening_balance', nominal, tanggal: tgl || null, keterangan: C.trim(), penerima: null });
        hasOpening = true;
      } else if (!nominal) {
        errors.push('Saldo awal tidak valid');
      }
    } else if (typeof C !== 'string' || !/^total/i.test(C || '')) {
      // Pemasukan: D tanggal valid + E nominal. Baris subtotal/judul gugur sendiri.
      const tglIn = parseID(D);
      const nomIn = num(E);
      if (tglIn && nomIn) {
        rows.push({ jenis: 'income', nominal: nomIn, tanggal: tglIn, keterangan: `Iuran kas ${tglIn}`, penerima: null });
      }
    }

    // Pengeluaran (kolom G-J) — dinilai sendiri, tidak peduli isi kolom C.
    if (typeof G !== 'string' || !/^total/i.test(G || '')) {
      const tglOut = parseID(H);
      const nomOut = num(J);
      if (tglOut && nomOut) {
        rows.push({ jenis: 'expense', nominal: nomOut, tanggal: tglOut, keterangan: I ? String(I).trim() : 'Pengeluaran', penerima: null });
      }
    }

    // Nabung (kolom L-M)
    const tglSav = parseID(L);
    const nomSav = num(M);
    if (tglSav && nomSav) {
      rows.push({ jenis: 'savings', nominal: nomSav, tanggal: tglSav, keterangan: 'Setoran tabungan', penerima: 'Guru / Wali Kelas' });
    }
  });
  // Tanggal saldo awal tak diketahui (file asli) -> ikuti pemasukan paling awal.
  const firstIncome = rows.filter((r) => r.jenis === 'income').map((r) => r.tanggal).sort()[0];
  for (const r of rows) {
    if (r.jenis === 'opening_balance' && !r.tanggal) r.tanggal = firstIncome || todayID();
  }
  return { rows, errors };
}

export function totalsOf(rows) {
  const t = { opening: 0, income: 0, expense: 0, savings: 0 };
  for (const r of rows) {
    if (r.jenis === 'opening_balance') t.opening += r.nominal;
    else if (r.jenis === 'income') t.income += r.nominal;
    else if (r.jenis === 'expense') t.expense += r.nominal;
    else if (r.jenis === 'savings') t.savings += r.nominal;
  }
  return { ...t, saldo: t.opening + t.income - t.expense - t.savings, count: rows.length };
}
