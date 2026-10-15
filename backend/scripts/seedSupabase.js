// Migrasi Excel -> Supabase (idempoten).
// - Sumber kebenaran: file Excel via EXCEL_PATH
// - Anti-ganda lapis 1: import_batches.file_hash UNIQUE
// - Anti-ganda lapis 2: tolak nama file sama yang sudah success (kecuali --force)
// - Anti-ganda lapis 3: dedup per-baris (tanggal|jenis|nominal|keterangan)
// - Backup data existing ke backend/backups/ sebelum menulis.
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { supabase } = require('../src/config/supabase');
const { parseKelas11Layout, totals } = require('../src/services/importService');

const NAMA_FILE = 'Laporan Kas RPL 2 2627.xlsx';
const TARGET = { opening: 476000, income: 2421500, expense: 666000, savings: 1000000, saldo: 1231500, count: 48 };

const norm = (s) => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');
// Identitas transaksi konsisten di kedua format:
// - baris Supabase memakai kolom `tanggal`, parser memakai `tanggal_transaksi`.
// - nominal dinormalisasi via Number agar number/string dianggap sama.
const keyOfTx = (r) => [r.tanggal, r.jenis, Number(r.nominal), norm(r.keterangan)].join('|');
const keyOfParsed = (r) => [r.tanggal_transaksi, r.jenis, Number(r.nominal), norm(r.keterangan)].join('|');

async function backup() {
  const dir = path.join(__dirname, '..', 'backups');
  fs.mkdirSync(dir, { recursive: true });
  const t = await supabase.from('transactions').select('*').order('id');
  if (t.error) throw t.error;
  const b = await supabase.from('import_batches').select('*').order('id');
  if (b.error) throw b.error;
  const f = path.join(dir, `backup-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`);
  fs.writeFileSync(f, JSON.stringify({ at: new Date().toISOString(), transactions: t.data, import_batches: b.data }, null, 1));
  console.log('[seed] backup:', f, `(${t.data.length} tx, ${b.data.length} batch)`);
  return { tx: t.data, batches: b.data };
}

async function main() {
  const excelPath = process.env.EXCEL_PATH;
  if (!excelPath || !fs.existsSync(excelPath)) throw new Error(`File Excel tidak ditemukan: ${excelPath}`);
  const buf = fs.readFileSync(excelPath);
  const fileHash = crypto.createHash('sha256').update(buf).digest('hex');
  console.log('[seed] file:', excelPath);
  console.log('[seed] hash:', fileHash);

  const { rows, errors } = await parseKelas11Layout(buf);
  if (errors.length) console.log('[seed] baris dilewati:', errors.length);
  // Normalisasi penerima tabungan sesuai ketentuan: 'Tabungan kelas'
  for (const r of rows) if (r.jenis === 'savings') r.penerima_tabungan = 'Tabungan kelas';
  const t = totals(rows);
  const saldo = t.opening + t.income - t.expense - t.savings;
  console.log('[seed] parsed:', rows.length, 'rows', t, 'saldo', saldo);
  const ok = t.opening === TARGET.opening && t.income === TARGET.income && t.expense === TARGET.expense
    && t.savings === TARGET.savings && saldo === TARGET.saldo && rows.length === TARGET.count;
  if (!ok) {
    console.error('[seed] VALIDASI GAGAL. Diharapkan:', TARGET);
    console.error('[seed] Didapat:', { ...t, saldo, count: rows.length });
    process.exit(2);
  }
  console.log('[seed] validasi OK (48 transaksi, saldo 1231500)');

  const before = await backup();

  const { data: dup } = await supabase.from('import_batches').select('id').eq('file_hash', fileHash).maybeSingle();
  if (dup) {
    console.log('[seed] sudah pernah dimigrasi (batch id=%s). 0 baris ditambahkan, tidak ganda.', dup.id);
    return;
  }
  const { data: sameFile } = await supabase.from('import_batches').select('id').eq('nama_file', NAMA_FILE).limit(1);
  if (sameFile && sameFile.length && !process.argv.includes('--force')) {
    console.error('[seed] DITOLAK: batch "%s" sudah ada (id=%s) dengan hash berbeda.', NAMA_FILE, sameFile[0].id);
    process.exit(3);
  }

  const existingKeys = new Set(before.tx.map(keyOfTx));
  // Guard savings: satu setoran yang sama bisa bereda redaksi keterangan
  // (parser: 'Setoran tabungan ke guru' vs existing: 'Tabungan kelas').
  // Cocokkan savings via tanggal+nominal agar tidak ter-insert ulang.
  const existingSavings = new Set(
    before.tx.filter((r) => r.jenis === 'savings').map((r) => `${r.tanggal}|${Number(r.nominal)}`)
  );
  // Opening balance existing (2026-07-01, Rp476.000) dipertahankan apa adanya:
  // baris opening dari parser tidak pernah di-insert agar tidak duplikat.
  const skippedOpening = rows.filter((r) => r.jenis === 'opening_balance').length;
  const fresh = rows.filter((r) => {
    if (r.jenis === 'opening_balance') return false;
    if (r.jenis === 'savings' && existingSavings.has(`${r.tanggal_transaksi}|${Number(r.nominal)}`)) return false;
    return !existingKeys.has(keyOfParsed(r));
  });
  console.log(`[seed] lewati opening_balance dari parser: ${skippedOpening} baris (existing dipertahankan)`);
  console.log(`[seed] baris baru yang akan ditambahkan: ${fresh.length} dari ${rows.length}`);

  const { data: batch, error: e1 } = await supabase.from('import_batches')
    .insert({ nama_file: NAMA_FILE, file_hash: fileHash, jumlah: fresh.length })
    .select('id').single();
  if (e1) throw e1;

  if (fresh.length) {
    const payload = fresh.map((r) => ({
      import_id: batch.id, jenis: r.jenis, nominal: r.nominal, tanggal: r.tanggal_transaksi,
      keterangan: r.keterangan, penerima: r.penerima_tabungan || null,
    }));
    const { error: e2 } = await supabase.from('transactions').insert(payload);
    if (e2) throw e2;
  }
  const { count } = await supabase.from('transactions').select('id', { count: 'exact', head: true });
  console.log(`[seed] sukses: +${fresh.length} transaksi, batch id=${batch.id}, total kini ${count}`);
}

main().catch((e) => { console.error('[seed] gagal:', e.message); process.exit(1); });
