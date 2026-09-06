-- ============================================================
-- FIX & VERIFIKASI TRIGGER SUPABASE
-- Jalankan di SQL Editor jika profile tidak otomatis terbuat saat signup
-- ============================================================

-- 1. Cek apakah function handle_new_user ada
SELECT proname FROM pg_proc WHERE proname = 'handle_new_user';

-- 2. Cek apakah trigger on_auth_user_created ada di auth.users
SELECT tgname, tgrelid::regclass AS tabel, tgenabled
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';

-- 3. Jalankan ulang pembuatan function & trigger (idempotent)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name, phone)
  VALUES (
    new.id,
    'masyarakat'::user_role,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. BUAT PROFILE MANUAL untuk user yang sudah terdaftar sebelum trigger aktif
--    (testing tadi: testsipma@gmail.com)
INSERT INTO public.profiles (id, role, full_name, phone)
SELECT
  u.id,
  'masyarakat'::user_role,
  COALESCE(u.raw_user_meta_data->>'full_name', u.email),
  u.raw_user_meta_data->>'phone'
FROM auth.users u
WHERE u.id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- 5. Cek ulang hasilnya — harusnya muncul 1 baris (user test tadi)
SELECT id, email, raw_user_meta_data
FROM auth.users
WHERE email = 'testsipma@gmail.com';

SELECT id, role, full_name, created_at
FROM public.profiles
WHERE id = 'c933e804-b267-41ec-a334-5aaf7bb06c54';

-- ============================================================
-- CATATAN: Setelah ini, setiap signup baru otomatis terbuat profile-nya.
-- Untuk development cepat, MATIKAN email confirmation:
-- Authentication → Sign In/Up → Disable "Confirm email"
-- ============================================================
