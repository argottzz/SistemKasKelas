# Sistem Kas Kelas

Web pencatatan kas kelas — responsif (HP + laptop) + PWA. Satu codebase Next.js, API Express, MySQL.

## Data awal
44 transaksi Kelas 11 dari `Laporan Kas RPL 2 2627.xlsx` sudah masuk DB:
opening 476.000 + income 2.026.500 − expense 577.500 − savings 1.000.000 = **saldo 925.000**.

## Menu
Dashboard (ringkasan + transaksi terbaru) • Laporan (riwayat + tombol + Tambah popup pemasukan/pengeluaran/tabungan) • Impor Excel • Pengguna (khusus bendahara: ubah role pengurus↔bendahara).

## Cara menjalankan (2 terminal)

Terminal 1 — backend:
```
cd "backend"
npm install
node src/server.js
```
API: http://localhost:8000/api/health

Terminal 2 — frontend:
```
cd "frontend"
npm install
npm run dev
```
Buka: http://localhost:3000 (otomatis ke /dashboard → /login bila belum login)

## Login
- Tabel `users` mulai kosong. **Register dulu** di http://localhost:3000/register
- Pendaftar **pertama = bendahara**, sisanya = pengurus.
- Koneksi DB ikut Workbench `sistemKasKelas`: 127.0.0.1:3306, user root, tanpa password (lihat `backend/.env`).

## Seed ulang (opsional, idempoten)
```
cd backend
node scripts/seedKelas11.js
```
Dijalankan 2x tetap aman (ditolak via file_hash).

## Catatan
- Subtotal pemasukan Juli/Agustus/September di Excel salah; sistem menghitung ulang dari baris (sudah divalidasi 2.026.500).
- `npm run build` butuh RAM lega; di laptop ini (sisa ±300MB) jalankan via `npm run dev`.
