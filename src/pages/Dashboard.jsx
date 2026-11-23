import { Link } from 'react-router-dom'
import StatusBanner from '../components/layout/StatusBanner'
import { useStore } from '../contexts/StoreContext'
import { categories, examConfig, masteredAccuracy, questions, topics } from '../data'
import { BookOpen, Library, Target, TrendingUp } from 'lucide-react'
import HeroArt from '../components/ui/HeroArt'
import ProgressRing from '../components/ui/ProgressRing'
import ActivityChart from '../components/ui/ActivityChart'
import { dailyActivity, daysUntil, overall, pct, sectionScores, topicStats } from '../utils/stats'
import { CatHistory, Heatmap } from '../components/Heatmap'

const statusClass = {
  'Not Started': 'st-none',
  Learning: 'st-learn',
  'Needs Improvement': 'st-weak',
  Mastered: 'st-ok',
}

export default function Dashboard() {
  const { state } = useStore()
  const ov = overall(state.attempts)
  const stats = topicStats(state.attempts)

  const allTopics = topics
  const act = dailyActivity(state.attempts)
  const left = daysUntil(state.plan.examDate)
  const tried = allTopics.filter((t) => stats[t.id].answered > 0).length
  const mastered = allTopics.filter((t) => stats[t.id].status === 'Mastered').length
  const cats = state.attempts.filter((a) => a.kind === 'cat')
  const lastCat = cats[cats.length - 1]
  const lastCatPts = lastCat ? Object.values(sectionScores(lastCat)).reduce((a, x) => a + x.points, 0) : null
  const weakest = allTopics
    .filter((t) => stats[t.id].accuracy != null && stats[t.id].status !== 'Mastered')
    .sort((a, b) => stats[a.id].accuracy - stats[b.id].accuracy)
    .slice(0, 3)
  const untouched = allTopics
    .filter((t) => stats[t.id].answered === 0 && t.priority === 'high' && questions.some((q) => q.topic_id === t.id))
    .slice(0, 3)
  const recs = weakest.length ? weakest : untouched

  return (
    <>
      <section className="hero">
        <div className="hero-text">
          <small className="hero-kicker">Dashboard</small>
          <h1>Selamat datang, {state.profile.name}!</h1>
          <p>
            {ov.answered > 0
              ? `Sudah ${ov.answered} soal dikerjakan dengan akurasi ${pct(ov.accuracy)}. Lanjutkan dari topik yang paling perlu diperkuat.`
              : 'Mulai dari satu sesi latihan singkat. Hasilnya akan membentuk peta kelemahan Anda.'}
          </p>
          <div className="hero-actions">
            <Link className="btn light" to={recs[0] ? `/practice?topic=${recs[0].id}` : '/practice'}>{ov.answered > 0 ? 'Lanjut belajar' : 'Mulai belajar'}</Link>
            <Link className="btn outline-light" to="/cat">Simulasi CAT</Link>
          </div>
        </div>
        <HeroArt />
      </section>
      <StatusBanner />

      <section className="stats" aria-label="Ringkasan">
        <div className="stat"><span className="ico t1"><BookOpen size={22} /></span><div><small>Topik materi</small><strong>{allTopics.length}</strong></div></div>
        <div className="stat"><span className="ico t2"><Library size={22} /></span><div><small>Soal tersedia</small><strong>{questions.length}</strong><em>draft, perlu verifikasi</em></div></div>
        <div className="stat"><span className="ico t3"><TrendingUp size={22} /></span><div><small>Akurasi keseluruhan</small><strong>{pct(ov.accuracy)}</strong><em>{ov.answered} soal, {ov.sessions} sesi</em></div></div>
        <div className="stat"><span className="ico t4"><Target size={22} /></span><div><small>Simulasi terakhir</small><strong>{lastCatPts == null ? '–' : lastCatPts}</strong><em>{lastCat ? `skor dari ${cats.length} simulasi` : 'belum ada simulasi'}</em></div></div>
      </section>

      <div className="two">
        <section className="card">
          <div className="row"><h2>Progres belajar</h2><small>7 hari terakhir</small></div>
          <div className="progress-row">
            <ProgressRing value={allTopics.length ? tried / allTopics.length : 0} label="Topik yang sudah dicoba" sub="topik dicoba" />
            <div className="progress-side">
              <p><strong>{tried}</strong> dari {allTopics.length} topik sudah dicoba</p>
              <p><strong>{mastered}</strong> topik berstatus Mastered</p>
              <p className="muted">Hari ini {act.today} / {state.plan.dailyTarget} soal · streak {act.streak} hari</p>
              <Link className="btn small ghost" to="/plan">Atur target</Link>
            </div>
          </div>
          <ActivityChart days={act.days} target={state.plan.dailyTarget} />
        </section>

        <section className="card info">
          <h2>Informasi ujian</h2>
          <ul className="info-list">
            <li><span>Status data</span><b>Referensi pola 2024</b></li>
            <li><span>Komposisi SKD</span><b>{examConfig.total_questions ?? 110} soal · {examConfig.duration_minutes ?? 100} menit</b></li>
            <li><span>Ambang referensi</span><b>TWK {examConfig.sections[0].threshold} · TIU {examConfig.sections[1].threshold} · TKP {examConfig.sections[2].threshold}</b></li>
            <li><span>Tanggal ujian</span><b>{state.plan.examDate ? (left >= 0 ? `${left} hari lagi` : 'sudah lewat') : 'belum diatur'}</b></li>
          </ul>
          <p className="muted">Angka resmi 2026 belum diumumkan. Pantau sscasn.bkn.go.id dan menpan.go.id.</p>
          <a className="btn small ghost" href="https://sscasn.bkn.go.id" target="_blank" rel="noreferrer">Buka sscasn.bkn.go.id</a>
        </section>
      </div>

      <section className="card">
        <h2>Prioritas belajar</h2>
        {recs.length === 0 ? (
          <p className="muted">Belum ada data. Mulai satu sesi latihan agar rekomendasi muncul.</p>
        ) : (
          <ul className="rec-list">
            {recs.map((t) => (
              <li key={t.id}>
                <div>
                  <strong>{t.name}</strong>
                  <small>{t.category} · {stats[t.id].accuracy != null ? `akurasi ${pct(stats[t.id].accuracy)}` : 'belum dicoba'}</small>
                </div>
                <Link className="btn small" to={`/practice?topic=${t.id}`}>Latih</Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Heatmap attempts={state.attempts} />
      <CatHistory attempts={state.attempts} />

      {categories.map((c) => (
        <section className="card" key={c.id}>
          <h2>{c.id} <span className="muted">· {c.name}</span></h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Topik</th><th>Dijawab</th><th>Akurasi</th><th>Status</th></tr>
              </thead>
              <tbody>
                {c.topics.map((t) => {
                  const s = stats[t.id]
                  return (
                    <tr key={t.id}>
                      <td><Link to={`/learn/${t.id}`}>{t.name}</Link></td>
                      <td>{s.answered}</td>
                      <td>
                        <div className="bar" aria-label={`Akurasi ${pct(s.accuracy)}`}>
                          <span style={{ width: `${(s.accuracy ?? 0) * 100}%` }} />
                          <i style={{ left: `${masteredAccuracy * 100}%` }} title="Target internal" />
                        </div>
                        <small>{pct(s.accuracy)}</small>
                      </td>
                      <td><span className={`pill ${statusClass[s.status]}`}>{s.status}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}
      <p className="muted foot">
        Target internal Mastered: akurasi ≥ {masteredAccuracy * 100}% (≥10 jawaban, ≥2 sesi). Bukan standar
        kelulusan resmi. Ambang batas referensi: TWK {examConfig.sections[0].threshold}, TIU {examConfig.sections[1].threshold}, TKP {examConfig.sections[2].threshold}.
      </p>
    </>
  )
}
