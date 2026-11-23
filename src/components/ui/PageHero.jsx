import { BooksArt, BuildingArt, CalendarArt, MonitorArt } from './art'

const arts = { building: BuildingArt, books: BooksArt, monitor: MonitorArt, calendar: CalendarArt }

/** Banner judul halaman bergaya sama di semua menu: label kecil, judul, teks, tombol, dan ilustrasi. */
export default function PageHero({ kicker, title, text, actions, art = 'building', children }) {
  const Art = arts[art] ?? BuildingArt
  return (
    <section className={`phero art-${art}`}>
      <div className="phero-body">
        {kicker && <span className="phero-kicker">{kicker}</span>}
        <h1>{title}</h1>
        {text && <p>{text}</p>}
        {children}
        {actions && <div className="phero-actions">{actions}</div>}
      </div>
      <Art className="phero-art" />
    </section>
  )
}
