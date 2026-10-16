// Klien Supabase SERVER per-request untuk Route Handlers.
// Anon key + cookie sesi -> query berjalan sebagai user login -> RLS berlaku.
// Tidak memakai service-role key.
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export function supabaseRoute() {
  const store = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll: (list) => {
          list.forEach(({ name, value, options }) => {
            try {
              store.set(name, value, options);
            } catch {
              // Abaikan bila dipanggil dari konteks read-only (refresh dilakukan middleware).
            }
          });
        },
      },
    }
  );
}

// Ambil sesi user login. Kembalikan { sb, user } atau { sb: null, user: null }.
export async function requireSession() {
  const sb = supabaseRoute();
  const { data, error } = await sb.auth.getUser();
  if (error || !data?.user) return { sb: null, user: null };
  return { sb, user: data.user };
}
