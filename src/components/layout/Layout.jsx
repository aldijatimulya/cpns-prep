import { NavLink, Outlet } from 'react-router-dom'
import { BookOpen, CalendarDays, ClipboardCheck, Library, LayoutDashboard, Settings, Timer } from 'lucide-react'

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/learn', label: 'Materi', icon: BookOpen },
  { to: '/bank', label: 'Bank Soal', icon: Library },
  { to: '/practice', label: 'Latihan', icon: Timer },
  { to: '/cat', label: 'Simulasi', icon: ClipboardCheck },
  { to: '/plan', label: 'Rencana', icon: CalendarDays },
  { to: '/settings', label: 'Pengaturan', icon: Settings },
]

export default function Layout() {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">✓</span>
          <div>
            <strong>CPNS Prep</strong>
            <small>Belajar pribadi · SKD</small>
          </div>
        </div>
        <nav aria-label="Menu utama">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? 'nav active' : 'nav')}>
              <Icon size={18} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <p className="sidebar-note">Alat bantu belajar. Bukan aplikasi resmi pemerintah.</p>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}
