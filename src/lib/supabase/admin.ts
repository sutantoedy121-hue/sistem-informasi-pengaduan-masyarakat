import { createClient } from "@supabase/supabase-js";

/**
 * Admin Supabase client memakai service_role key (pakai createClient polos,
 * BUKAN createServerClient supabase-js/ssr): ssr membaca cookies dan memakai
 * access token sesi user → storage dijalankan sebagai 'authenticated' dan
 * kena RLS. Service-role harus dipresentasikan DARI key, tanpa sesi.
 * MELEWATI RLS — gunakan HANYA di server terpercaya untuk operasi admin.
 * Jangan pernah expose ke client.
 */
export async function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
