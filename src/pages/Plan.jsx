import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays } from 'lucide-react'
import PageHero from '../components/ui/PageHero'
import { useStore } from '../contexts/StoreContext'
import { questions, topics } from '../data'
import { dailyActivity, daysUntil, topicStats, pct, weakQuestionIds } from '../utils/stats'

export default function Plan() {
  const { state, setPlan, addSkb, updateSkb, removeSkb } = useStore()
  const [title, setTitle] = useState('')
  const act = dailyActivity(state.attempts)
  const left = daysUntil(state.plan.examDate)
  const target = Math.max(1, Number(state.plan.dailyTarget) || 1)
  const stats = topicStats(state.attempts)
  const weak = topics
    .filter((t) => stats[t.id].accuracy != null && stats[t.id].status !== 'Mastered')
    .sort((a, b) => stats[a.id].accuracy - stats[b.id].accuracy)
    .slice(0, 3)
  const untouched = topics.filter((t) => stats[t.id].answered === 0 && t.priority === 'high' && questions.some((q) => q.topic_id === t.id)).slice(0, 3)
  const reviewN = weakQuestionIds(state.attempts, state.bookmarks).size
  const maxN = Math.max(target, ...act.days.map((d) => d.n))
  const done = state.skb.filter((x) => x.done).length

  return (
    <>
      <PageHero
        art="calendar"
        kicker={<><CalendarDays size={16} aria-hidden="true" /> Rencana Belajar</>}
        title="Rencana Belajar"
        text="Atur tanggal ujian, target harian, dan daftar materi SKB Anda sendiri."
      />

      <section className="card form">
        <label>Tanggal ujian (isi setelah jadwal resmi terbit)
          <input type="date" value={state.plan.examDate} onChange={(e) => setPlan({ examDate: e.target.value })} />
        </label>
        <label>Target soal per hari
          <input type="number" min="1" max="500" value={state.plan.dailyTarget} onChange={(e) => setPlan({ dailyTarget: Number(e.target.value) || 1 })} />
        </label>
        <p>
          {left == null && 'Tanggal ujian belum diatur.'}
          {left != null && left > 0 && <><strong>{left} hari</strong> menuju ujian.</>}
          {left === 0 && <strong>Ujian hari ini.</strong>}
          {left != null && left < 0 && 'Tanggal tersebut sudah lewat. Perbarui tanggalnya.'}
        </p>
      </section>

      <section className="card">
        <h2>Aktivitas 7 hari</h2>
        <p>Hari ini {act.today} / {target} soal · streak {act.streak} hari</p>
        <div className="week" role="img" aria-label={`Soal dijawab per hari: ${act.days.map((d) => `${d.label} ${d.n}`).join(', ')}`}>
          {act.days.map((d) => (
            <div key={d.key} className="weekcol">
              <span className="weekn">{d.n}</span>
              <div className="weekbar"><i style={{ height: `${(d.n / maxN) * 100}%` }} className={d.n >= target ? 'hit' : ''} /></div>
              <small>{d.label}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Fokus berikutnya</h2>
        <ul className="rec-list">
          {reviewN > 0 && (
            <li><div><strong>Ulasan soal bermasalah</strong><small>{reviewN} soal salah, ragu-ragu, atau ditandai</small></div>
              <Link className="btn small" to="/practice?review=1">Ulas</Link></li>
          )}
          {(weak.length ? weak : untouched).map((t) => (
            <li key={t.id}><div><strong>{t.name}</strong><small>{t.category} · {stats[t.id].accuracy != null ? `akurasi ${pct(stats[t.id].accuracy)}` : 'belum dicoba'}</small></div>
              <Link className="btn small" to={`/practice?topic=${t.id}`}>Latih</Link></li>
          ))}
          {reviewN === 0 && weak.length === 0 && untouched.length === 0 && <li className="muted">Belum ada data. Mulai latihan dulu.</li>}
        </ul>
      </section>

      <section className="card">
        <h2>Materi SKB (daftar Anda sendiri)</h2>
        <p className="muted">
          Isi SKB belum diumumkan resmi, jadi daftar ini kosong. Tambahkan materi setelah formasi dan
          kisi-kisi instansi terbit, misalnya bidang ilmu, regulasi, atau persiapan praktik. {state.skb.length > 0 && `Selesai ${done} / ${state.skb.length}.`}
        </p>
        <form className="row" onSubmit={(e) => { e.preventDefault(); if (title.trim()) { addSkb(title.trim()); setTitle('') } }}>
          <input aria-label="Materi SKB baru" placeholder="Nama materi" value={title} onChange={(e) => setTitle(e.target.value)} />
          <button className="btn small" type="submit">Tambah</button>
        </form>
        <ul className="skb-list">
          {state.skb.map((x) => (
            <li key={x.id}>
              <label className="check">
                <input type="checkbox" checked={x.done} onChange={(e) => updateSkb(x.id, { done: e.target.checked })} />
                <span className={x.done ? 'done' : ''}>{x.title}</span>
              </label>
              <input aria-label={`Catatan ${x.title}`} placeholder="Catatan" value={x.note} onChange={(e) => updateSkb(x.id, { note: e.target.value })} />
              <button className="btn small ghost" onClick={() => removeSkb(x.id)} aria-label={`Hapus ${x.title}`}>Hapus</button>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
