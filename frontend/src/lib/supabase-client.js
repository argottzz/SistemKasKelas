// Klien Supabase BROWSER-ONLY: anon key, sesi tersimpan di cookie.
// Dipakai halaman login + komponen client. Tidak pernah menyentuh service-role.
import { createBrowserClient } from '@supabase/ssr';

let client = null;

export function supabaseBrowser() {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY belum diisi');
  }
  client = createBrowserClient(url, key);
  return client;
}
