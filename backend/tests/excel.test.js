const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
require('dotenv').config();
const { parseKelas11Layout, totals } = require('../src/services/importService');

test('Excel asli -> 48 baris, subtotal tidak ikut, saldo 1231500', async () => {
  const buf = fs.readFileSync(process.env.EXCEL_PATH);
  const { rows } = await parseKelas11Layout(buf);
  const byJenis = (j) => rows.filter((r) => r.jenis === j).length;
  assert.equal(rows.length, 48);
  assert.equal(byJenis('opening_balance'), 1);
  assert.equal(byJenis('income'), 36);
  assert.equal(byJenis('expense'), 10);
  assert.equal(byJenis('savings'), 1);
  // Tidak ada baris subtotal/saldo Excel yang lolos sebagai transaksi
  assert.ok(rows.every((r) => !/^(total|saldo akhir|uang di bendahara)/i.test(r.keterangan || '') || r.jenis === 'opening_balance' && /sisa/i.test(r.keterangan)));
  const t = totals(rows);
  assert.deepEqual(t, { income: 2421500, expense: 666000, savings: 1000000, opening: 476000 });
  assert.equal(t.opening + t.income - t.expense - t.savings, 1231500);
});

test('Ringkasan S1: pemasukan 7431500, bendahara 1231500', async () => {
  const buf = fs.readFileSync(process.env.EXCEL_PATH);
  const { rows } = await parseKelas11Layout(buf);
  const t = totals(rows);
  const TABUNGAN_BAWAAN = 5200000;
  const bendahara = t.opening + t.income - t.expense - t.savings;
  const tabungan = t.savings + TABUNGAN_BAWAAN;
  const pemasukan = bendahara + tabungan;
  assert.equal(bendahara, 1231500);
  assert.equal(tabungan, 6200000);
  assert.equal(pemasukan, 7431500);
  assert.equal(pemasukan - t.expense, 6765500);
});
