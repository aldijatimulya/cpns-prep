-- CPNS Prep v3.0: skema akun online. Jalankan SEKALI di Supabase > SQL Editor (proyek milik Anda sendiri).
-- Aman dijalankan ulang (memakai "if not exists" dan "drop policy if exists").
-- Menggantikan docs/03-supabase-schema.sql (versi lama, tidak dipakai lagi).

-- 1) Satu baris per sesi latihan/simulasi. Primary key gabungan agar dua akun boleh punya id sesi yang sama.
create table if not exists public.attempts (
  user_id  uuid        not null default auth.uid() references auth.users(id) on delete cascade,
  id       text        not null,
  kind     text        not null default 'latihan',      -- 'latihan' | 'cat'
  taken_at timestamptz not null,
  payload  jsonb       not null,                        -- seluruh objek sesi (items, skor, dll)
  primary key (user_id, id)
);
create index if not exists attempts_user_time on public.attempts (user_id, taken_at);

-- 2) Satu baris per akun untuk data kecil: catatan, penanda, verifikasi, rencana, daftar SKB.
create table if not exists public.user_state (
  user_id    uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  data       jsonb       not null default '{}',
  updated_at timestamptz not null default now()
);

-- 3) Row Level Security: setiap pengguna hanya bisa melihat dan mengubah barisnya sendiri.
alter table public.attempts   enable row level security;
alter table public.user_state enable row level security;

drop policy if exists "own attempts" on public.attempts;
create policy "own attempts" on public.attempts
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "own state" on public.user_state;
create policy "own state" on public.user_state
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
