-- ============================================================
-- CEK & AKTIFKAN REALTIME UNTUK SIPMA  (idempotent)
-- Jalankan di: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. CEK kondisi sekarang: tabel mana yg sudah ada di publication realtime
SELECT
  schemaname AS schema,
  tablename  AS tabel
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- 2. TAMBAH tabel yg belum terdaftar (aman diulang — tidak error walau
--    salah satu sudah member). Hanya menambah yg belum ada.
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['complaints', 'complaint_logs', 'notifications']
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;
-- Output kosong = normal. Cek hasilnya lewat query #1 di bawah.

-- 3. JALANKAN ULANG query #1 untuk konfirmasi: complaints,
--    complaint_logs, notifications harus semuanya muncul.