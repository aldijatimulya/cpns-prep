import { Link } from 'react-router-dom'
import StatusBanner from '../components/layout/StatusBanner'
import { useStore } from '../contexts/StoreContext'
import { categories, examConfig, masteredAccuracy, questions, topicById, topics } from '../data'
import { BookOpen, CalendarClock, ChevronRight, ClipboardCheck, Flame, Library, Megaphone, Play, Trophy } from 'lucide-react'
import { BuildingArt } from '../components/ui/art'
import ProgressRing from '../components/ui/ProgressRing'
import ActivityChart from '../components/ui/ActivityChart'
import { dailyActivity, daysUntil, overall, pct, progressSummary, sectionScores, topicStats, weakQuestionIds } from '../utils/stats'
import { CatHistory, Heatmap } from '../components/Heatmap'

const statusClass = {
  'Not Started': 'st-none',
  Learning: 'st-learn',
  'Needs Improvement': 'st-weak',
  Mastered: 'st-ok',
}

const catClass = { TWK: 'c-twk', TIU: 'c-tiu', TKP: 'c-tkp' }

export default function Dashboard() {
  const { state, profileName } = useStore()
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
  const target = Math.max(1, Number(state.plan.dailyTarget) || 1)
  const reviewN = weakQuestionIds(state.attempts, state.bookmarks).size

  const prog = progressSummary(state.attempts)
  const { answeredIds, pMateri, pSoal, pCat, pAll } = prog

  const weakest = allTopics
    .filter((t) => stats[t.id].accuracy != null && stats[t.id].status !== 'Mastered')
    .sort((a, b) => stats[a.id].accuracy - stats[b.id].accuracy)
    .slice(0, 3)
  const untouched = allTopics
    .filter((t) => stats[t.id].answered === 0 && t.priority === 'high' && questions.some((q) => q.topic_id === t.id))
  const recs = weakest.length ? weakest : untouched.slice(0, 3)
  const priority = [...weakest, ...untouched, ...allTopics.filter((t) => t.priority === 'high')]
    .filter((t, i, arr) => arr.findIndex((x) => x.id === t.id) === i)
    .slice(0, 5)

  // Topik untuk "Lanjutkan Belajar": topik pada sesi terakhir, atau rekomendasi pertama.
  const lastItem = state.attempts.length ? [...state.attempts[state.attempts.length - 1].items].reverse().find((i) => topicById[i.topic_id]) : null
  const cont = (lastItem && topicById[lastItem.topic_id]) || recs[0] || allTopics[0]
  const contQs = cont ? questions.filter((q) => q.topic_id === cont.id) : []
  const contDone = cont ? contQs.filter((q) => answeredIds.has(q.id)).length : 0
  const contPct = contQs.length ? contDone / contQs.length : 0

  const schedule = [
    { id: 'today', when: 'Hari ini', what: `Target ${act.today}/${target} soal`, to: '/practice', done: act.today >= target },
    { id: 'review', when: 'Ulasan', what: reviewN > 0 ? `${reviewN} soal perlu diulas` : 'Belum ada soal untuk diulas', to: '/practice?review=1', done: reviewN === 0 },
    { id: 'exam', when: 'Ujian', what: state.plan.examDate ? new Date(`${state.plan.examDate}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Tanggal belum diatur', to: '/plan', done: false },
  ]

  return (
    <>
      <div className="dash-top">
        <section className="phero dash-hero art-building">
          <div className="phero-body">
            <span className="phero-kicker"><CalendarClock size={16} aria-hidden="true" /> CPNS 2026</span>
            <h1>Selamat datang,<br /><em>{profileName}!</em></h1>
            <p>
              {ov.answered > 0
                ? `Sudah ${ov.answered} soal dikerjakan dengan akurasi ${pct(ov.accuracy)}. Terus belajar untuk meraih masa depan sebagai ASN!`
                : 'Mulai dari satu sesi latihan singkat. Hasilnya akan membentuk peta kelemahan Anda.'}
            </p>
            <div className="phero-actions">
              <Link className="btn gold" to={cont ? `/practice?topic=${cont.id}` : '/practice'}><Play size={16} aria-hidden="true" fill="currentColor" /> {ov.answered > 0 ? 'Lanjut Belajar' : 'Mulai Belajar Sekarang'} →</Link>
            </div>
          </div>
          <BuildingArt className="phero-art" />
        </section>

        <section className="card prog-card" aria-label="Progres belajar">
          <div className="row"><h2>Progres Belajar Anda</h2><Trophy size={22} className="ico-teal" aria-hidden="true" /></div>
          <div className="prog-body">
            <ProgressRing value={pAll} size={132} label="Progres keseluruhan" />
            <ul className="prog-list">
              <li><span className="dot ok" /> Materi <b>{pct(pMateri)}</b></li>
              <li><span className="dot ok" /> Latihan Soal <b>{pct(pSoal)}</b></li>
              <li><span className="dot wait" /> Simulasi CAT <b>{pct(pCat)}</b></li>
            </ul>
          </div>
          <small className="center">Progres keseluruhan · rata-rata tiga bagian</small>
          <Link className="btn wide" to="/plan">Lihat Detail →</Link>
        </section>
      </div>
      <StatusBanner />

      <section className="stats" aria-label="Ringkasan">
        <Link to="/learn" className="stat"><span className="ico t1"><BookOpen size={26} /></span><div><small>Total Materi</small><strong>{allTopics.length}</strong><em>Topik Pembelajaran</em></div><ChevronRight size={18} className="go" aria-hidden="true" /></Link>
        <Link to="/bank" className="stat"><span className="ico t2"><Library size={26} /></span><div><small>Total Soal</small><strong>{questions.length}</strong><em>Soal Tersedia (draft)</em></div><ChevronRight size={18} className="go" aria-hidden="true" /></Link>
        <Link to="/cat" className="stat"><span className="ico t3"><ClipboardCheck size={26} /></span><div><small>Simulasi CAT</small><strong>{cats.length}</strong><em>{lastCatPts == null ? 'Belum ada simulasi' : `Skor terakhir ${lastCatPts}`}</em></div><ChevronRight size={18} className="go" aria-hidden="true" /></Link>
        <Link to="/plan" className="stat"><span className="ico t4"><CalendarClock size={26} /></span><div><small>Hari Menuju Ujian</small><strong>{left != null && left >= 0 ? left : '–'}</strong><em>{left != null && left >= 0 ? 'Hari Lagi' : 'Tanggal belum diatur'}</em></div><ChevronRight size={18} className="go" aria-hidden="true" /></Link>
      </section>

      <div className="trio">
        <section className="card">
          <div className="row"><h2><Play size={18} className="ico-teal" aria-hidden="true" /> Lanjutkan Belajar</h2><Link className="more" to="/learn">Lihat Semua →</Link></div>
          {cont && (
            <div className="cont">
              <div className={`cont-tile ${catClass[cont.category] ?? 'c-twk'}`}>
                <strong>{cont.category}</strong>
                <small>{categories.find((c) => c.id === cont.category)?.name}</small>
                <div className="mini-bar" aria-hidden="true"><span style={{ width: `${contPct * 100}%` }} /><b>{Math.round(contPct * 100)}%</b></div>
              </div>
              <div className="cont-info">
                <strong>{cont.name}</strong>
                <p className="muted">{contQs.length ? `${contDone} dari ${contQs.length} soal sudah dikerjakan.` : 'Belum ada soal untuk topik ini.'}</p>
                <Link className="btn" to={`/practice?topic=${cont.id}`}><Play size={15} aria-hidden="true" fill="currentColor" /> Lanjutkan Belajar</Link>
              </div>
            </div>
          )}
        </section>

        <section className="card">
          <div className="row"><h2><CalendarClock size={18} className="ico-teal" aria-hidden="true" /> Jadwal Belajar</h2><Link className="more" to="/plan">Atur →</Link></div>
          <ul className="sched">
            {schedule.map((x) => (
              <li key={x.id} className={x.done ? 'done' : ''}>
                <span className="tick" aria-hidden="true" />
                <Link to={x.to}><small>{x.when}</small><b>{x.what}</b></Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="card">
          <div className="row"><h2><Flame size={18} className="ico-orange" aria-hidden="true" /> Topik Prioritas</h2><Link className="more" to="/bank">Bank Soal →</Link></div>
          <ol className="pop-topics">
            {priority.map((t, i) => (
              <li key={t.id}>
                <span className="rank">{i + 1}</span>
                <Link to={`/learn/${t.id}`}><b>{t.category} - {t.name}</b></Link>
                <span className={`pill ${statusClass[stats[t.id].status]}`}>{stats[t.id].accuracy != null ? pct(stats[t.id].accuracy) : 'Baru'}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <div className="infobar" role="note">
        <span className="ico-circle"><Megaphone size={22} aria-hidden="true" /></span>
        <div><strong>Informasi Penting!</strong><p>Angka ujian di aplikasi ini masih referensi pola 2024. Pantau pengumuman resmi seleksi CPNS 2026 dan tetap belajar secara konsisten.</p></div>
        <a className="btn small ghost" href="https://sscasn.bkn.go.id" target="_blank" rel="noreferrer">Lihat Info →</a>
      </div>

      <div className="two">
        <section className="card">
          <div className="row"><h2>Aktivitas belajar</h2><small>7 hari terakhir</small></div>
          <div className="chips-stat">
            <span><b>{tried}</b>/{allTopics.length} topik dicoba</span>
            <span><b>{mastered}</b> topik Mastered</span>
            <span>Hari ini <b>{act.today}</b>/{state.plan.dailyTarget} soal</span>
            <span><b>{act.streak}</b> hari beruntun</span>
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
