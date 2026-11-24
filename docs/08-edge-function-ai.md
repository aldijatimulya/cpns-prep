# AI lewat server (Edge Function `ai-proxy`)

Dengan cara ini pengguna yang sudah masuk akun memakai Tutor AI dan Agent AI **tanpa mengisi kunci**. Kunci Gemini hanya ada di server Supabase.

## Langkah 1. Pembatas pemakaian (SQL Editor, jalankan sekali)
```sql
create table if not exists public.ai_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null default (now() at time zone 'utc')::date,
  n int not null default 0,
  primary key (user_id, day)
);
alter table public.ai_usage enable row level security;   -- tanpa policy: hanya fungsi di bawah yang boleh menulis

create or replace function public.ai_take_quota(p_limit int)
returns boolean
language plpgsql security definer set search_path = public
as $$
declare uid uuid := auth.uid(); cur int;
begin
  if uid is null then return false; end if;
  insert into public.ai_usage (user_id, day, n) values (uid, (now() at time zone 'utc')::date, 1)
  on conflict (user_id, day) do update set n = public.ai_usage.n + 1
  returning n into cur;
  return cur <= p_limit;
end $$;
revoke all on function public.ai_take_quota(int) from public, anon;
grant execute on function public.ai_take_quota(int) to authenticated;
```

## Langkah 2. Secret (Edge Functions > Secrets)
- `GEMINI_API_KEY`: kunci dari Google AI Studio.
- `ALLOWED_ORIGIN`: `https://aldijatimulya.github.io` (tanpa garis miring dan tanpa `/cpns-prep`).
- Opsional: `GEMINI_MODEL` (default `gemini-3.5-flash-lite`), `AI_DAILY_LIMIT` (default 30).

## Langkah 3. Deploy fungsi
Edge Functions > Deploy a new function > Via Editor. Nama persis `ai-proxy`, isi dari `supabase/functions/ai-proxy/index.ts`, biarkan "Verify JWT" aktif.

## Langkah 4. Di aplikasi
Pengaturan > Tutor AI dan Agent AI > Penyedia "Server aplikasi" > Simpan. Untuk situs yang sudah memakai akun online, ini otomatis menjadi pilihan awal.

## Jika gagal
| Pesan | Penyebab |
|---|---|
| Fungsi ai-proxy belum ada | Langkah 3 belum dilakukan atau namanya beda |
| Tidak bisa menghubungi server AI | `ALLOWED_ORIGIN` tidak sama persis dengan alamat situs, atau fungsi belum di-deploy |
| Pembatas pemakaian belum disiapkan | Langkah 1 belum dijalankan |
| Layanan AI belum dikonfigurasi | secret `GEMINI_API_KEY` belum ada |
| Penyedia AI menolak (kode 400/404) | nama model salah: isi secret `GEMINI_MODEL` |
