import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import {
  BookOpen, CalendarDays, ClipboardCheck, Library, LayoutDashboard, LogOut, Menu, Search, Settings, Timer, X,
} from 'lucide-react'
import Logo from '../ui/Logo'
import { useStore } from '../../contexts/StoreContext'
import { daysUntil } from '../../utils/stats'

const groups = [
  { label: 'Belajar', items: [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/learn', label: 'Materi', icon: BookOpen },
    { to: '/bank', label: 'Bank Soal', icon: Library },
  ] },
  { label: 'Latihan', items: [
    { to: '/practice', label: 'Latihan', icon: Timer },
    { to: '/cat', label: 'Simulasi', icon: ClipboardCheck },
    { to: '/plan', label: 'Rencana', icon: CalendarDays },
  ] },
  { label: 'Lainnya', items: [{ to: '/settings', label: 'Pengaturan', icon: Settings }] },
]

const initials = (name) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?'

export default function Layout() {
  const { state, logout } = useStore()
  const [open, setOpen] = useState(false)
  const loc = useLocation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')
  const left = daysUntil(state.plan.examDate)

  useEffect(() => { setOpen(false) }, [loc.pathname])

  const search = (e) => {
    e.preventDefault()
    const v = q.trim()
    navigate(v ? `/bank?q=${encodeURIComponent(v)}` : '/bank')
  }

  return (
    <div className="shell">
      {open && <button className="scrim" aria-label="Tutup menu" onClick={() => setOpen(false)} />}
      <aside className={`sidebar${open ? ' open' : ''}`}>
        <div className="brand">
          <Logo size={42} />
          <div>
            <strong>CPNS Prep</strong>
            <small>Belajar · Latihan · Siap</small>
          </div>
          <button className="icon-btn dark close-nav" aria-label="Tutup menu" onClick={() => setOpen(false)}><X size={18} /></button>
        </div>
        <nav aria-label="Menu utama">
          {groups.map((g) => (
            <div key={g.label} className="nav-group">
              <span className="nav-label">{g.label}</span>
              {g.items.map(({ to, label, icon: Icon, end }) => (
                <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? 'nav active' : 'nav')}>
                  <Icon size={19} aria-hidden="true" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <Link to="/plan" className="side-card">
          {left != null && left >= 0 ? (
            <>
              <strong>{left} hari</strong>
              <span>menuju ujian. Tetap konsisten, sedikit demi sedikit.</span>
            </>
          ) : (
            <>
              <strong>Atur tanggal ujian</strong>
              <span>Isi setelah jadwal resmi terbit untuk melihat hitung mundur.</span>
            </>
          )}
        </Link>
        <p className="sidebar-note">Alat bantu belajar pribadi. Bukan aplikasi resmi pemerintah.</p>
      </aside>

      <div className="main">
        <header className="topbar">
          <button className="icon-btn menu-btn" aria-label="Buka menu" onClick={() => setOpen(true)}><Menu size={20} /></button>
          <form className="search" role="search" onSubmit={search}>
            <Search size={18} aria-hidden="true" />
            <input aria-label="Cari soal atau topik" placeholder="Cari soal, topik, atau ID soal" value={q} onChange={(e) => setQ(e.target.value)} />
          </form>
          <div className="profile">
            <Link to="/settings" className="profile-chip" aria-label="Profil dan pengaturan">
              <span className="avatar" aria-hidden="true">{initials(state.profile.name)}</span>
              <span className="pname">{state.profile.name}</span>
            </Link>
            <button className="icon-btn" aria-label="Keluar" title="Keluar" onClick={logout}><LogOut size={18} /></button>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
