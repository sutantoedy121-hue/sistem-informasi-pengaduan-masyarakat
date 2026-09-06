-- ============================================================
-- SIPMA — Fix trigger nomor tiket & log aduan (v2)
-- ------------------------------------------------------------
-- Masalah bertingkat:
--  1) RLS menolak insert log saat warga mengajukan aduan
--     (fungsi trigger jalan atas nama warga, dan baris complaints
--      belum terlihat di statement snapshot).
--  2) Setelah trigger dijadikan SECURITY DEFINER (fix v1), muncul
--     error FK: "insert ... complaint_logs violates foreign key
--     complaint_logs_complaint_id_fkey" karena log dibuat di
--     trigger BEFORE INSERT — baris complaints BELUM ada sehingga
--     FK belum bisa dipenuhi.
--
-- Solusi (v2): pisah jadi DUA trigger.
--  a) BEFORE INSERT  → cukup mengisi new.ticket (generate_ticket).
--  b) AFTER INSERT   → insert log 'created' (baris complaints sudah
--     ada → FK valid). Fungsi tetap SECURITY DEFINER (pola handle_new_user)
--     supaya tidak terblokir RLS.
--
-- Jalankan file ini di: Supabase Dashboard → SQL Editor
-- ============================================================

create or replace function public.handle_new_complaint()
returns trigger language plpgsql
security definer set search_path = public as $$
begin
  new.ticket := public.generate_ticket();
  return new;
end $$;

create or replace function public.handle_new_complaint_log()
returns trigger language plpgsql
security definer set search_path = public as $$
begin
  insert into public.complaint_logs (complaint_id, actor_id, action, status_to, description)
  values (new.id, new.reporter_id, 'created', 'diajukan', 'Aduan diajukan oleh warga');
  return new;
end $$;

-- bersihkan trigger lama bila ada
drop trigger if exists trg_complaints_ticket on public.complaints;
drop trigger if exists trg_complaints_log on public.complaints;

-- trigger a: terbitkan tiket SEBELUM insert
create trigger trg_complaints_ticket
  before insert on public.complaints
  for each row execute function public.handle_new_complaint();

-- trigger b: catat log 'created' SESUDAH insert (FK aman)
create trigger trg_complaints_log
  after insert on public.complaints
  for each row execute function public.handle_new_complaint_log();
