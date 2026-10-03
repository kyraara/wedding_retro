-- =====================================================================
-- The Premiere · Skema database Supabase
-- Jalankan SEKALI di Supabase Dashboard → SQL Editor → New query → Run.
-- Aman dijalankan ulang (idempotent).
-- =====================================================================

-- ---------- Tabel ----------

create table if not exists public.site_content (
  id int primary key default 1 check (id = 1),
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.guests (
  id text primary key,
  code text not null unique,
  name text not null,
  salutation text,
  group_name text,
  phone text,
  max_pax int not null default 2 check (max_pax between 1 and 20),
  sent_at timestamptz,
  opened_at timestamptz,
  open_count int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.rsvps (
  id text primary key default ('rsvp-' || gen_random_uuid()),
  guest_code text,
  ticket_code text not null unique,
  name text not null check (char_length(name) between 1 and 80),
  attendance text not null check (attendance in ('hadir', 'tidak_hadir', 'ragu')),
  pax int not null default 0 check (pax between 0 and 20),
  note text check (char_length(note) <= 500),
  checked_in_at timestamptz,
  checked_in_pax int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wishes (
  id text primary key default ('w-' || gen_random_uuid()),
  name text not null check (char_length(name) between 1 and 60),
  message text not null check (char_length(message) between 1 and 500),
  relationship text check (char_length(relationship) <= 40),
  is_hidden boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists guests_code_lower_idx on public.guests (lower(code));
create index if not exists rsvps_ticket_lower_idx on public.rsvps (lower(ticket_code));

-- ---------- Row Level Security ----------
-- Publik (tamu) hanya boleh: membaca konten, membaca ucapan yang tampil, mengirim ucapan.
-- Data tamu & RSVP hanya bisa diakses tamu lewat fungsi di bawah (per kode miliknya).
-- Admin = pengguna yang login (Supabase Auth). Matikan pendaftaran publik di dashboard!

alter table public.site_content enable row level security;
alter table public.guests enable row level security;
alter table public.rsvps enable row level security;
alter table public.wishes enable row level security;

drop policy if exists "content public read" on public.site_content;
create policy "content public read" on public.site_content for select using (true);
drop policy if exists "content admin write" on public.site_content;
create policy "content admin write" on public.site_content for all to authenticated using (true) with check (true);

drop policy if exists "guests admin all" on public.guests;
create policy "guests admin all" on public.guests for all to authenticated using (true) with check (true);

drop policy if exists "rsvps admin all" on public.rsvps;
create policy "rsvps admin all" on public.rsvps for all to authenticated using (true) with check (true);

drop policy if exists "wishes public read" on public.wishes;
create policy "wishes public read" on public.wishes for select to anon using (is_hidden = false);
drop policy if exists "wishes public insert" on public.wishes;
create policy "wishes public insert" on public.wishes for insert to anon with check (is_hidden = false);
drop policy if exists "wishes admin all" on public.wishes;
create policy "wishes admin all" on public.wishes for all to authenticated using (true) with check (true);

-- Tamu hanya boleh mengisi nama, pesan, dan hubungan. Kolom lain (id, created_at, is_hidden)
-- selalu diisi default oleh server, jadi tanggal ucapan tidak bisa dipalsukan agar tampil paling atas.
revoke insert on public.wishes from anon;
grant insert (name, message, relationship) on public.wishes to anon;

-- ---------- Fungsi untuk tamu (security definer) ----------

-- Data minimal tamu berdasarkan kode di link undangan.
create or replace function public.get_guest(p_code text)
returns table (code text, name text, salutation text, max_pax int)
language sql stable security definer set search_path = public as $$
  select g.code, g.name, g.salutation, g.max_pax
  from guests g where lower(g.code) = lower(p_code) limit 1;
$$;

-- Catat bahwa link undangan dibuka.
create or replace function public.track_open(p_code text)
returns void
language sql security definer set search_path = public as $$
  update guests
  set open_count = open_count + 1, opened_at = coalesce(opened_at, now())
  where lower(code) = lower(p_code);
$$;

-- RSVP milik satu tiket.
create or replace function public.get_rsvp(p_ticket text)
returns setof rsvps
language sql stable security definer set search_path = public as $$
  select * from rsvps where lower(ticket_code) = lower(p_ticket) limit 1;
$$;

-- Kirim / perbarui RSVP. Semua aturan dicek di server (tidak bisa dilewati lewat browser):
--  * batas waktu konfirmasi (rsvp.deadlineISO di site_content),
--  * kode tamu harus terdaftar, dan tiket tamu terdaftar wajib sama dengan kode tamunya,
--  * jumlah kursi dibatasi max_pax tamu (2 untuk tamu umum tanpa link personal).
create or replace function public.submit_rsvp(
  p_ticket text,
  p_guest_code text,
  p_name text,
  p_attendance text,
  p_pax int,
  p_note text
) returns rsvps
language plpgsql security definer set search_path = public as $$
declare
  v_guest guests;
  v_deadline text;
  v_deadline_at timestamptz;
  v_pax int;
  v_result rsvps;
begin
  if p_ticket is null or char_length(trim(p_ticket)) = 0 or char_length(p_ticket) > 80 then
    raise exception 'Kode tiket tidak valid';
  end if;

  select data #>> '{rsvp,deadlineISO}' into v_deadline from site_content where id = 1;
  begin
    v_deadline_at := nullif(v_deadline, '')::timestamptz;
  exception when others then
    v_deadline_at := null; -- format tanggal rusak: jangan blokir semua RSVP
  end;
  if v_deadline_at is not null and now() > v_deadline_at then
    raise exception 'Batas waktu konfirmasi kehadiran sudah lewat';
  end if;

  if p_guest_code is not null and char_length(trim(p_guest_code)) > 0 then
    select * into v_guest from guests where lower(code) = lower(p_guest_code) limit 1;
    if v_guest.code is null then
      raise exception 'Kode tamu tidak terdaftar';
    end if;
    if upper(trim(p_ticket)) <> upper(v_guest.code) then
      raise exception 'Kode tiket tidak cocok dengan kode tamu';
    end if;
  elsif exists (select 1 from guests where upper(code) = upper(trim(p_ticket))) then
    -- Tiket milik tamu terdaftar hanya bisa diubah lewat link personal tamu tersebut.
    raise exception 'Kode tiket tidak valid';
  end if;

  v_pax := case
    when p_attendance = 'hadir' then greatest(1, least(coalesce(p_pax, 1), coalesce(v_guest.max_pax, 2)))
    else 0
  end;

  insert into rsvps (ticket_code, guest_code, name, attendance, pax, note)
  values (upper(trim(p_ticket)), v_guest.code, left(trim(p_name), 80), p_attendance, v_pax, left(coalesce(p_note, ''), 500))
  on conflict (ticket_code) do update
    set name = excluded.name,
        attendance = excluded.attendance,
        pax = excluded.pax,
        note = excluded.note,
        updated_at = now()
  returning * into v_result;

  return v_result;
end;
$$;

grant execute on function public.get_guest(text) to anon, authenticated;
grant execute on function public.track_open(text) to anon, authenticated;
grant execute on function public.get_rsvp(text) to anon, authenticated;
grant execute on function public.submit_rsvp(text, text, text, text, int, text) to anon, authenticated;

-- ---------- Storage untuk foto, video, musik ----------

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

-- Bucket public: file tetap bisa dibuka lewat URL publik tanpa policy SELECT.
-- SELECT hanya untuk admin, agar orang luar tidak bisa melihat daftar semua file.
drop policy if exists "media public read" on storage.objects;
drop policy if exists "media admin read" on storage.objects;
create policy "media admin read" on storage.objects for select to authenticated using (bucket_id = 'media');
drop policy if exists "media admin insert" on storage.objects;
create policy "media admin insert" on storage.objects for insert to authenticated with check (bucket_id = 'media');
drop policy if exists "media admin update" on storage.objects;
create policy "media admin update" on storage.objects for update to authenticated using (bucket_id = 'media');
drop policy if exists "media admin delete" on storage.objects;
create policy "media admin delete" on storage.objects for delete to authenticated using (bucket_id = 'media');
