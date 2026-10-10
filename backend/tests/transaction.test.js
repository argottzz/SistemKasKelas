const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateTransactionInput } = require('../src/services/transactionService');

test('terima income valid', () => {
  assert.equal(validateTransactionInput({ jenis: 'income', nominal: 50000, tanggal_transaksi: '2026-10-01', keterangan: 'Iuran' }), null);
});

test('tolak jenis asing', () => {
  assert.match(validateTransactionInput({ jenis: 'bonus', nominal: 1, tanggal_transaksi: '2026-10-01', keterangan: 'x' }), /Jenis/);
});

test('tolak nominal nol/negatif', () => {
  assert.match(validateTransactionInput({ jenis: 'expense', nominal: 0, tanggal_transaksi: '2026-10-01', keterangan: 'x' }), /Nominal/);
  assert.match(validateTransactionInput({ jenis: 'expense', nominal: -5, tanggal_transaksi: '2026-10-01', keterangan: 'x' }), /Nominal/);
});

test('savings wajib penerima, non-savings dilarang isi penerima', () => {
  assert.match(validateTransactionInput({ jenis: 'savings', nominal: 1, tanggal_transaksi: '2026-10-01', keterangan: 'x' }), /Penerima/);
  assert.equal(validateTransactionInput({ jenis: 'savings', nominal: 1, tanggal_transaksi: '2026-10-01', keterangan: 'x', penerima_tabungan: 'Tabungan kelas' }), null);
  assert.match(validateTransactionInput({ jenis: 'income', nominal: 1, tanggal_transaksi: '2026-10-01', keterangan: 'x', penerima_tabungan: 'Y' }), /hanya untuk jenis savings/);
});
