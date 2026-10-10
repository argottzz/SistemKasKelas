const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
require('dotenv').config();
const { parseKelas11Layout, totals } = require('../src/services/importService');

test('Excel asli -> 46 baris, subtotal tidak ikut, saldo 1226000', async () => {
  const buf = fs.readFileSync(process.env.EXCEL_PATH);
  const { rows } = await parseKelas11Layout(buf);
  const byJenis = (j) => rows.filter((r) => r.jenis === j).length;
  assert.equal(rows.length, 46);
  assert.equal(byJenis('opening_balance'), 1);
  assert.equal(byJenis('income'), 35);
  assert.equal(byJenis('expense'), 9);
  assert.equal(byJenis('savings'), 1);
  // Tidak ada baris subtotal/saldo Excel yang lolos sebagai transaksi
  assert.ok(rows.every((r) => !/^(total|saldo akhir|uang di bendahara)/i.test(r.keterangan || '') || r.jenis === 'opening_balance' && /sisa/i.test(r.keterangan)));
  const t = totals(rows);
  assert.deepEqual(t, { income: 2371500, expense: 621500, savings: 1000000, opening: 476000 });
  assert.equal(t.opening + t.income - t.expense - t.savings, 1226000);
});
