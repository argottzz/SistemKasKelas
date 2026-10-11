-- Migrasi aditif 002: kolom kategori opsional untuk transaksi.
-- Aman dijalankan ulang (IF NOT EXISTS tidak didukung semua versi Postgres untuk ADD COLUMN,
-- jadi guard via DO block). Data lama tanpa kategori tetap valid (NULL).
-- Cara pakai: Supabase Dashboard -> SQL Editor -> paste file ini -> Run.
-- API sudah fallback bila kolom belum ada, jadi boleh deploy dulu, migrasi belakangan.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'kategori'
  ) THEN
    ALTER TABLE transactions ADD COLUMN kategori TEXT NULL;
  END IF;
END $$;

-- Index parsial agar filter kategori tetap cepat tanpa membebani NULL.
CREATE INDEX IF NOT EXISTS idx_transactions_kategori ON transactions (kategori);
