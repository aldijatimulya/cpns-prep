import { createClient } from '@supabase/supabase-js'

// URL dan anon key ada di file .env lokal (VITE_...) dan, untuk situs yang dipublikasikan, di GitHub Secrets.
// Anon key memang publik (dilindungi Row Level Security di database), tapi JANGAN pernah memakai service_role key di sini.
const url = import.meta.env.VITE_SUPABASE_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isCloudEnabled = Boolean(url && anon)

// flowType 'pkce': tautan konfirmasi email membawa ?code=..., bukan token di hash,
// supaya tidak bentrok dengan HashRouter (#/rute) yang dipakai aplikasi ini.
export const supabase = isCloudEnabled
  ? createClient(url, anon, { auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
  : null

/** Alamat yang dituju setelah klik tautan di email (harus didaftarkan di Supabase > Authentication > URL Configuration). */
export const redirectUrl = () => `${window.location.origin}${window.location.pathname}`
