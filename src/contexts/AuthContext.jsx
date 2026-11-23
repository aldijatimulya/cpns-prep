import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { isCloudEnabled, redirectUrl, supabase } from '../services/supabase'
import { isGuest, setGuest } from '../services/storage'

const AuthContext = createContext(null)

// Pesan galat Supabase -> bahasa Indonesia yang ramah.
export function authMessage(err) {
  const m = String(err?.message ?? err ?? '').toLowerCase()
  if (m.includes('invalid login')) return 'Email atau password salah.'
  if (m.includes('email not confirmed')) return 'Email belum dikonfirmasi. Buka kotak masuk Anda dan klik tautan konfirmasi.'
  if (m.includes('already registered') || m.includes('already been registered')) return 'Email ini sudah terdaftar. Silakan masuk, atau pakai "Lupa password".'
  if (m.includes('at least') && m.includes('character')) return 'Password terlalu pendek. Gunakan minimal 8 karakter.'
  if (m.includes('weak') || m.includes('easy to guess')) return 'Password terlalu mudah ditebak. Gabungkan huruf, angka, dan simbol.'
  if (m.includes('rate limit') || m.includes('too many') || m.includes('security purposes')) return 'Terlalu banyak percobaan. Tunggu beberapa menit lalu coba lagi.'
  if (m.includes('same password') || m.includes('different from the old')) return 'Password baru harus berbeda dari yang lama.'
  if (m.includes('invalid email') || m.includes('unable to validate email')) return 'Format email tidak valid.'
  if (m.includes('failed to fetch') || m.includes('network')) return 'Tidak ada koneksi ke server. Periksa internet Anda.'
  return 'Terjadi kesalahan. Coba lagi sebentar lagi.'
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [ready, setReady] = useState(!isCloudEnabled)
  const [recovery, setRecovery] = useState(false)
  const [guest, setGuestState] = useState(isGuest)

  useEffect(() => {
    if (!isCloudEnabled) return undefined
    let alive = true
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return
      setSession(data.session ?? null)
      setReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s ?? null)
      if (event === 'PASSWORD_RECOVERY') setRecovery(true)
      if (event === 'SIGNED_OUT') setRecovery(false)
      setReady(true)
    })
    return () => { alive = false; sub.subscription.unsubscribe() }
  }, [])

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) throw new Error(authMessage(error))
    setGuest(false); setGuestState(false)
  }, [])

  const signUp = useCallback(async (name, email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: name.trim() }, emailRedirectTo: redirectUrl() },
    })
    if (error) throw new Error(authMessage(error))
    setGuest(false); setGuestState(false)
    // Bila konfirmasi email aktif, session kosong sampai tautan di email diklik.
    return { needsConfirm: !data.session }
  }, [])

  const resetPassword = useCallback(async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: redirectUrl() })
    if (error) throw new Error(authMessage(error))
  }, [])

  const updatePassword = useCallback(async (password) => {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw new Error(authMessage(error))
    setRecovery(false)
  }, [])

  const updateName = useCallback(async (name) => {
    const { error } = await supabase.auth.updateUser({ data: { full_name: name.trim().slice(0, 40) } })
    if (error) throw new Error(authMessage(error))
  }, [])

  const signOut = useCallback(async () => {
    if (isCloudEnabled) await supabase.auth.signOut()
    setSession(null)
    setGuest(false); setGuestState(false)
  }, [])

  const continueAsGuest = useCallback(() => { setGuest(true); setGuestState(true) }, [])

  const value = useMemo(() => {
    const user = session?.user ?? null
    const meta = user?.user_metadata ?? {}
    const name = (meta.full_name || meta.name || user?.email?.split('@')[0] || '').trim()
    return {
      user, name, email: user?.email ?? '', ready, recovery, guest: !user && guest,
      signIn, signUp, signOut, resetPassword, updatePassword, updateName, continueAsGuest,
    }
  }, [session, ready, recovery, guest, signIn, signUp, signOut, resetPassword, updatePassword, updateName, continueAsGuest])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
