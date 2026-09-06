-- ============================================================
-- SIPMA — Arahan Pimpinan
-- 1) Tambah aksi log baru 'commented' (idempotent — aman dijalankan
--    ulang walau sudah pernah jalan; enum sudah ada → dilewati).
-- 2) Policy insert KHUSUS role pimpinan, dibatasi hanya aksi 'commented'
--    (pimpinan tidak boleh mencatat aksi lain seperti accepted/completed).
-- Jalankan di: Supabase Dashboard → SQL Editor. Aman dijalankan ulang.
-- ============================================================

do $$ begin
  alter type public.log_action add value 'commented';
exception when duplicate_object then null;
end $$;

drop policy if exists "logs_insert_pimpinan" on public.complaint_logs;
create policy "logs_insert_pimpinan" on public.complaint_logs
  for insert
  with check (
    public.current_user_role() = 'pimpinan'
    and action = 'commented'
    and status_from is null
    and status_to is null
  );