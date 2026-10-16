// Penjaga rute: refresh sesi Supabase + arahkan belum-login ke /login.
// Berjalan di Edge — hanya pakai anon key publik.
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { isBendahara } from './lib/allowlist';

export async function middleware(req) {
  const path = req.nextUrl.pathname;
  const isLogin = path === '/login';
  const isPublik = path === '/publik' || path === '/unduh' || path === '/akses-ditolak';
  const isApi = path.startsWith('/api/');
  const isSw = path === '/sw.js';
  const loginUrl = new URL('/login', req.url);

  // Konfigurasi belum lengkap (Env Vercel/Netlify kurang) -> jangan 500,
  // arahkan ke login. Halaman login menampilkan pesan konfigurasi yang jelas.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    if (!isApi && !isSw && !isLogin && !isPublik) return NextResponse.redirect(loginUrl);
    if (!isApi && !isSw) return NextResponse.next();
    return NextResponse.json({ message: 'Konfigurasi server belum lengkap.' }, { status: 500 });
  }

  let res = NextResponse.next({ request: req });
  try {
    const sb = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll: () => req.cookies.getAll(),
          setAll: (list) => {
            list.forEach(({ name, value, options }) => {
              req.cookies.set(name, value);
              res.cookies.set(name, value, options);
            });
          },
        },
      }
    );
    const { data } = await sb.auth.getUser();
    const user = data?.user || null;

    // Halaman penolakan selalu boleh dibuka (publik, perlu untuk pesan ramah).
    if (path === '/akses-ditolak') return NextResponse.next();
    // Login tapi email tidak ada di BENDAHARA_EMAILS -> tolak dengan ramah.
    if (user && !isBendahara(user.email)) {
      if (isApi) {
        return NextResponse.json(
          { message: 'Akses ditolak: email belum terdaftar sebagai bendahara.' },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL('/akses-ditolak', req.url));
    }

    // Root: tamu -> /publik (siswa/wali), sesi login -> /dashboard (bendahara).
    if (path === '/') {
      return NextResponse.redirect(new URL(user ? '/dashboard' : '/publik', req.url));
    }
    // API menjaga dirinya sendiri (401 via requireSession) — middleware hanya urus halaman.
    // /publik + /unduh boleh dibuka tanpa login. /sw.js jangan dicegat.
    if (isSw) return NextResponse.next();
    if (!isApi && !user && !isLogin && !isPublik) {
      return NextResponse.redirect(loginUrl);
    }
    if (user && isLogin) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    return res;
  } catch {
    // Gagal refresh sesi (mis. Supabase tidak terjangkau) -> aman: ke login.
    if (!isApi && !isLogin) return NextResponse.redirect(loginUrl);
    res = NextResponse.next({ request: req });
    return res;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sw.js|.*\\.(?:svg|png|jpg|ico|webmanifest)).*)'],
};
