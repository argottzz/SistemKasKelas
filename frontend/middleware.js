// Penjaga rute: refresh sesi Supabase + arahkan belum-login ke /login.
// Berjalan di Edge — hanya pakai anon key publik.
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(req) {
  const res = NextResponse.next({ request: req });
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
  const path = req.nextUrl.pathname;
  const isLogin = path === '/login';
  const isApi = path.startsWith('/api/');

  // API menjaga dirinya sendiri (401 via requireSession) — middleware hanya urus halaman.
  if (!isApi && !user && !isLogin) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  if (user && isLogin) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|ico|webmanifest)).*)'],
};
