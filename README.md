# KasSave

Web pencatatan kas kelas — responsif (HP + laptop) + PWA. Satu codebase Next.js, API Express, MySQL.

## Data awal
48 transaksi Kelas 11 dari `Laporan Kas RPL 2 2627.xlsx` sudah masuk DB (Supabase live):
opening 476.000 + income 2.421.500 − expense 666.000 − savings_baru 1.000.000 = **bendahara 1.231.500**.
Tabungan total = 1.000.000 + bawaan 5.200.000 (Excel M9) = **6.200.000**.
Total Pemasukan / aset (M14) = bendahara + tabungan = **7.431.500**.

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

## Deploy ke Netlify (frontend)
Penyebab "Page Not Found" kemarin: deploy Next.js App Router butuh runtime
`@netlify/plugin-nextjs` + setting base/publish yang benar. Sudah diperbaiki
via `netlify.toml` di folder ini + plugin di `frontend/package.json`.
1. Push folder ini ke GitHub (atau jadikan root repo = folder ini).
2. Netlify → Add new site → Import from Git → pilih repo.
   Jika root repo BUKAN folder ini, isi manual: Base directory =
   path ke folder `frontend`, Build command = `npm run build`,
   Publish directory = `frontend/.next`.
3. Site settings → Environment variables → tambah:
   `NEXT_PUBLIC_API_URL = https://URL-BACKEND-KAMU/api`
   (lalu Trigger deploy → Clear cache and deploy).
4. PENTING: backend Express + MySQL tidak bisa jalan di Netlify.
   Deploy backend+PWA secara terpisah (mis. Railway/Render + MySQL
   ter-hosting), lalu isi URL-nya di langkah 3. Selama backend masih
   `http://localhost:8000`, versi Netlify tidak bisa login/ambil data —
   itu normal, bukan bug frontend.

## Publish full online (biar orang lain bisa buka)
Arsitektur: Netlify = frontend saja. Backend + MySQL harus online juga.
A. Push ke GitHub:
   ```
   git add -A
   git commit -m "KasSave siap publish"
   git push -u origin main   (atau nama branch kamu)
   ```
B. Backend + database di Railway (gratis starter, ada MySQL plugin):
   1. railway.app → New Project → Deploy from GitHub → pilih repo ini.
      Tambah service dulu untuk backend: Settings → Root Directory = `backend`,
      Start Command = `node src/server.js`.
   2. + New → Database → MySQL. Di service backend isi Variables:
      `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
      (copy dari tab Connect/ Variables MySQL), plus:
      `JWT_SECRET` (isi acak panjang), `NODE_ENV=production`,
      `FRONTEND_URL=https://ALAMAT-NETLIFY-KAMU`.
   3. Masukkan data awal: di Railway MySQL pakai Query tab, jalankan isi
      `backend/schema.sql` lalu `backend/seed-data.sql` (urut, jangan dibalik).
      Cek: harus 44 baris, saldo 925.000.
   4. Buka `https://BACKEND-KAMU.up.railway.app/api/health` → harus `{"ok":true}`.
C. Frontend di Netlify seperti bagian atas, dengan
   `NEXT_PUBLIC_API_URL=https://BACKEND-KAMU.up.railway.app/api`.
   Deploy ulang → buka URL Netlify → register akun pertama (= bendahara).
D. Alternatif cepat tanpa cloud (laptop harus nyala + satu WiFi):
   1. Di `frontend/.env.local` ganti URL localhost dengan IP laptop,
      mis. `NEXT_PUBLIC_API_URL=http://192.168.1.5:8000/api`, lalu
      rebuild (`npm run build`) + jalankan (`npm start`) — atau `npm run dev`.
   2. Di `backend/.env` set `FRONTEND_URL=http://192.168.1.5:3000`,
      restart backend. Cari IP via `ipconfig`.
   3. Teman buka `http://192.168.1.5:3000` di HP/laptopnya.
