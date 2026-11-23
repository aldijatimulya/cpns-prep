-- Skema Supabase untuk sinkronisasi lintas perangkat (BELUM terhubung ke aplikasi).
-- Dibuat mengikuti bentuk data di localStorage. Jalankan di SQL Editor proyek Anda sendiri.
create table if not exists attempts (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null default 'latihan',        -- 'latihan' | 'cat'
  taken_at timestamptz not null,
  payload jsonb not null                        -- seluruh objek attempt (items, thresholds, dll)
);
create table if not exists user_state (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  notes jsonb not null default '{}',
  bookmarks text[] not null default '{}',
  verified text[] not null default '{}',
  plan jsonb not null default '{}',
  skb jsonb not null default '[]',
  updated_at timestamptz not null default now()
);
alter table attempts enable row level security;
alter table user_state enable row level security;
create policy "own attempts" on attempts for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own state" on user_state for all using (user_id = auth.uid()) with check (user_id = auth.uid());
