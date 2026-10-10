-- KasSave RLS aman: backend = server tepercaya (service-role key, hanya di backend/.env).
-- Prinsip: RLS AKTIF, TIDAK ADA policy untuk role anon -> akses langsung dari
-- browser dengan anon key selalu ditolak (0 baris / error RLS).
-- Seluruh baca/tulis lewat backend Express yang memakai service-role key.
-- Aman dijalankan berulang (idempoten). Jalankan di Supabase SQL Editor.

-- 1. Cabut policy terbuka yang mungkin terlanjur dibuat (abaikan jika tidak ada)
drop policy if exists "publik baca tx" on transactions;
drop policy if exists "publik tulis tx" on transactions;
drop policy if exists "publik ubah tx" on transactions;
drop policy if exists "publik hapus tx" on transactions;
drop policy if exists "publik baca batch" on import_batches;
drop policy if exists "publik tulis batch" on import_batches;

-- 2. Pastikan RLS aktif di kedua tabel
alter table transactions enable row level security;
alter table import_batches enable row level security;

-- 3. Verifikasi: harus 0 policy tersisa (hasil kosong = benar)
-- select policyname, cmd, roles from pg_policies
-- where tablename in ('transactions','import_batches');
