import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Bell, Bot, BookMarked, BookOpen, Compass, CalendarDays, ChevronDown, CircleHelp, ClipboardCheck, LayoutDashboard, Library, LogOut, Menu, Search, Settings, Timer, Trophy, X,
} from 'lucide-react'
import Logo from '../ui/Logo'
import { Skyline } from '../ui/art'
import SyncBadge from './SyncBadge'
import { useStore } from '../../contexts/StoreContext'
import { dailyActivity, daysUntil, weakQuestionIds } from '../../utils/stats'

const groups = [
  { label: null, items: [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/learn', label: 'Materi', icon: BookOpen },
    { to: '/bank', label: 'Bank Soal', icon: Library },
  ] },
  { label: 'Latihan', items: [
    { to: '/practice', label: 'Latihan', icon: Timer },
    { to: '/cat', label: 'Simulasi CAT', icon: ClipboardCheck },
    { to: '/skb', label: 'Simulasi SKB', icon: BookMarked },
    { to: '/plan', label: 'Rencana Belajar', icon: CalendarDays },
  ] },
  { label: 'Asisten AI', items: [
    { to: '/tutor', label: 'Tutor AI', icon: Bot },
    { to: '/agent', label: 'Agent AI', icon: Compass },
  ] },
  { label: 'Lainnya', items: [
    { to: '/settings', label: 'Pengaturan', icon: Settings },
    { to: '/help', label: 'Bantuan', icon: CircleHelp },
  ] },
]

const initials = (name) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?'

/** Menutup panel saat klik di luar atau tekan Escape. */
function usePopover() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return undefined
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])
  return { open, setOpen, ref }
}

export default function Layout() {
  const { state, profileName, email, mode, sync, logout, legacyCount, importLegacy, dismissLegacy } = useStore()
  const [navOpen, setNavOpen] = useState(false)
  const loc = useLocation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')
  const searchRef = useRef(null)
  const bell = usePopover()
  const user = usePopover()
  const left = daysUntil(state.plan.examDate)

  useEffect(() => { setNavOpen(false); bell.setOpen(false); user.setOpen(false) }, [loc.pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); searchRef.current?.focus() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Notifikasi dihitung dari data nyata pengguna, bukan konten tetap.
  const notices = useMemo(() => {
    const out = []
    const act = dailyActivity(state.attempts)
    const target = Math.max(1, Number(state.plan.dailyTarget) || 1)
    const review = weakQuestionIds(state.attempts, state.bookmarks).size
    if (sync === 'error') out.push({ id: 'sync', to: '/settings', t: 'Data belum tersinkron', d: 'Buka Pengaturan lalu coba kirim ulang.' })
    if (act.today < target) out.push({ id: 'target', to: '/practice', t: `Target hari ini ${act.today}/${target} soal`, d: 'Kerjakan satu sesi latihan singkat.' })
    if (review > 0) out.push({ id: 'review', to: '/practice?review=1', t: `${review} soal perlu diulas`, d: 'Soal yang salah, ragu-ragu, atau Anda tandai.' })
    if (!state.plan.examDate) out.push({ id: 'date', to: '/plan', t: 'Tanggal ujian belum diatur', d: 'Isi setelah jadwal resmi terbit.' })
    if (state.verified.length === 0) out.push({ id: 'verify', to: '/bank', t: 'Belum ada soal terverifikasi', d: 'Cek soal draft ke sumber resmi.' })
    return out
  }, [state, sync])

  const search = (e) => {
    e.preventDefault()
    const v = q.trim()
    navigate(v ? `/bank?q=${encodeURIComponent(v)}` : '/bank')
  }

  return (
    <div className="shell">
      {navOpen && <button className="scrim" aria-label="Tutup menu" onClick={() => setNavOpen(false)} />}
      <aside className={`sidebar${navOpen ? ' open' : ''}`}>
        <div className="brand">
          <Logo size={44} />
          <div>
            <strong>CPNS Prep</strong>
            <small>Belajar · Latihan · Sukses</small>
          </div>
          <button className="icon-btn dark close-nav" aria-label="Tutup menu" onClick={() => setNavOpen(false)}><X size={18} /></button>
        </div>
        <nav aria-label="Menu utama">
          {groups.map((g, i) => (
            <div key={g.label ?? i} className="nav-group">
              {g.label && <span className="nav-label">{g.label}</span>}
              {g.items.map(({ to, label, icon: Icon, end }) => (
                <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? 'nav active' : 'nav')}>
                  <Icon size={20} aria-hidden="true" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <Link to="/plan" className="side-card">
          <div>
            {left != null && left >= 0 ? (
              <><strong>{left} hari lagi</strong><span>menuju ujian. Tetap konsisten, sedikit demi sedikit.</span></>
            ) : (
              <><strong>Semangat Belajar!</strong><span>Atur tanggal ujian untuk melihat hitung mundur.</span></>
            )}
            <em>Tetap Semangat →</em>
          </div>
          <Trophy size={44} aria-hidden="true" />
        </Link>
        <p className="sidebar-note">Alat bantu belajar pribadi. Bukan aplikasi resmi pemerintah.</p>
        <Skyline className="side-sky" />
      </aside>

      <div className="main">
        <header className="topbar">
          <button className="icon-btn menu-btn" aria-label="Buka menu" onClick={() => setNavOpen(true)}><Menu size={20} /></button>
          <form className="search" role="search" onSubmit={search}>
            <Search size={18} aria-hidden="true" />
            <input ref={searchRef} aria-label="Cari soal atau topik" placeholder="Cari materi, soal, atau topik…" value={q} onChange={(e) => setQ(e.target.value)} />
            <kbd aria-hidden="true">Ctrl K</kbd>
          </form>
          <div className="top-right">
            <SyncBadge />
            <div className="pop" ref={bell.ref}>
              <button type="button" className="bell" aria-label={`Notifikasi, ${notices.length} baru`} aria-expanded={bell.open} onClick={() => { bell.setOpen(!bell.open); user.setOpen(false) }}>
                <Bell size={20} aria-hidden="true" />
                {notices.length > 0 && <span className="badge">{notices.length}</span>}
              </button>
              {bell.open && (
                <div className="pop-panel notices" role="dialog" aria-label="Notifikasi">
                  <strong>Pengingat</strong>
                  {notices.length === 0 ? <p className="muted">Semua beres. Tidak ada pengingat.</p> : (
                    <ul>
                      {notices.map((n) => (
                        <li key={n.id}><Link to={n.to}><b>{n.t}</b><small>{n.d}</small></Link></li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
            <div className="pop" ref={user.ref}>
              <button type="button" className="profile-chip" aria-expanded={user.open} aria-label="Menu akun" onClick={() => { user.setOpen(!user.open); bell.setOpen(false) }}>
                <span className="avatar" aria-hidden="true">{initials(profileName)}</span>
                <span className="pname">{profileName}</span>
                <ChevronDown size={16} aria-hidden="true" className="chev" />
              </button>
              {user.open && (
                <div className="pop-panel menu" role="menu">
                  <div className="who">
                    <b>{profileName}</b>
                    <small>{mode === 'cloud' ? email : 'Mode tamu (data di browser ini)'}</small>
                  </div>
                  <Link role="menuitem" to="/settings"><Settings size={16} aria-hidden="true" /> Pengaturan</Link>
                  <Link role="menuitem" to="/help"><CircleHelp size={16} aria-hidden="true" /> Bantuan</Link>
                  <button role="menuitem" type="button" onClick={logout}><LogOut size={16} aria-hidden="true" /> {mode === 'cloud' ? 'Keluar' : 'Ke halaman masuk'}</button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="content">
          {legacyCount > 0 && (
            <div className="notice-bar" role="status">
              <p><strong>Ada data belajar lama di browser ini</strong> ({legacyCount} sesi, dari sebelum akun online). Gabungkan ke akun Anda agar ikut tersimpan online?</p>
              <div>
                <button className="btn small gold" onClick={importLegacy}>Gabungkan</button>
                <button className="btn small ghost" onClick={dismissLegacy}>Abaikan</button>
              </div>
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  )
}
