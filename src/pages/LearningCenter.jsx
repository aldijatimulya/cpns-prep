import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BadgeCheck, BookOpen, Brain, ChevronDown, LayoutGrid, Landmark, Lightbulb, Megaphone, Play, Users, ListChecks } from 'lucide-react'
import PageHero from '../components/ui/PageHero'
import ProgressRing from '../components/ui/ProgressRing'
import { useStore } from '../contexts/StoreContext'
import { categories, curriculum, examConfig, materiFor, questions, questionsForTopic } from '../data'
import { CAT_GOAL, progressSummary } from '../utils/stats'

const meta = {
  TWK: { icon: Landmark, cls: 'c-twk', blurb: 'Pelajari Pancasila, UUD 1945, NKRI, bahasa, dan wawasan kebangsaan.' },
  TIU: { icon: Brain, cls: 'c-tiu', blurb: 'Tingkatkan kemampuan verbal, numerik, dan figural Anda.' },
  TKP: { icon: Users, cls: 'c-tkp', blurb: 'Pelayanan publik, jejaring kerja, sosial budaya, TIK, profesionalisme.' },
}

const sorters = {
  priority: { label: 'Prioritas', fn: (a, b) => (b.priority === 'high') - (a.priority === 'high') || a.name.localeCompare(b.name, 'id') },
  name: { label: 'Nama A–Z', fn: (a, b) => a.name.localeCompare(b.name, 'id') },
  count: { label: 'Jumlah soal', fn: (a, b) => questionsForTopic(b.id).length - questionsForTopic(a.id).length },
}

export default function LearningCenter() {
  const { state } = useStore()
  const [tab, setTab] = useState('ALL')
  const [sort, setSort] = useState('priority')
  const prog = useMemo(() => progressSummary(state.attempts), [state.attempts])
  const verified = questions.filter((q) => state.verified.includes(q.id)).length
  const shown = categories.filter((c) => tab === 'ALL' || c.id === tab)

  const openCategory = (id) => {
    setTab(id)
    setTimeout(() => document.getElementById('daftar-topik')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30)
  }

  return (
    <>
      <PageHero
        art="books"
        kicker={<><BookOpen size={16} aria-hidden="true" /> Materi Pembelajaran</>}
        title={<>Persiapkan Dirimu Menghadapi Seleksi <em>CPNS 2026!</em></>}
        text={`Pelajari peta belajar SKD v${curriculum.version} sesuai pola terbaru. ${curriculum.disclaimer}`}
        actions={<button className="btn gold" onClick={() => openCategory('ALL')}><Play size={16} fill="currentColor" aria-hidden="true" /> Mulai Belajar Sekarang →</button>}
      />

      <div className="tabs" role="tablist" aria-label="Kategori materi">
        <button role="tab" aria-selected={tab === 'ALL'} className={tab === 'ALL' ? 'on' : ''} onClick={() => setTab('ALL')}><LayoutGrid size={18} aria-hidden="true" /> Semua Materi</button>
        {categories.map((c) => {
          const Icon = meta[c.id]?.icon ?? Landmark
          return <button key={c.id} role="tab" aria-selected={tab === c.id} className={`${tab === c.id ? 'on' : ''} t-${c.id}`} onClick={() => setTab(c.id)}><Icon size={18} aria-hidden="true" /> {c.id}</button>
        })}
      </div>

      <div className="learn-grid">
        <div>
          <div className="list-head">
            <div>
              <h2><BookOpen size={22} className="ico-teal" aria-hidden="true" /> Daftar Materi Pembelajaran</h2>
              <p className="muted">Akses materi lengkap untuk semua bidang tes SKD.</p>
            </div>
            <label className="select-pill">
              <span className="sr-only">Urutkan</span>
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                {Object.entries(sorters).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <ChevronDown size={16} aria-hidden="true" />
            </label>
          </div>

          <section className="catcards" aria-label="Kategori">
            {categories.map((c) => {
              const m = meta[c.id] ?? meta.TWK
              const Icon = m.icon
              const n = c.topics.reduce((a, t) => a + questionsForTopic(t.id).length, 0)
              const ver = c.topics.reduce((a, t) => a + questionsForTopic(t.id).filter((q) => state.verified.includes(q.id)).length, 0)
              return (
                <article key={c.id} className={`catcard ${m.cls}`}>
                  <header>
                    <span className="catico"><Icon size={26} aria-hidden="true" /></span>
                    <div><strong>{c.id}</strong><small>{c.name}</small></div>
                  </header>
                  <p>{m.blurb}</p>
                  <ul>
                    <li><BookOpen size={16} aria-hidden="true" /> Materi Lengkap <b>{c.topics.length} Topik</b></li>
                    <li><ListChecks size={16} aria-hidden="true" /> Latihan Soal <b>{n} Soal</b></li>
                    <li><BadgeCheck size={16} aria-hidden="true" /> Terverifikasi Anda <b>{ver} Soal</b></li>
                  </ul>
                  <button className="btn cat-btn" onClick={() => openCategory(c.id)}>Lihat Materi →</button>
                </article>
              )
            })}
          </section>

          <div id="daftar-topik" />
          {shown.map((c) => (
            <section key={c.id} id={`cat-${c.id}`}>
              <h2 className="section-title">{c.id} <span className="muted">· {c.name}</span> <small className="count">{c.questions_in_exam} soal di ujian (referensi)</small></h2>
              <div className="grid">
                {[...c.topics].sort(sorters[sort].fn).map((t) => (
                  <Link key={t.id} to={`/learn/${t.id}`} className="card topic-card">
                    <div className="row">
                      <strong>{t.name}</strong>
                      <span className={`pill pr-${t.priority}`}>{t.priority}</span>
                    </div>
                    <small>{t.group}{t.official_blueprint ? '' : ' · pendukung'}</small>
                    <small className={`lk-${t.likelihood}`}>perkiraan prioritas: {t.likelihood}</small>
                    <small>{questionsForTopic(t.id).length} soal · {t.indicators.length} indikator{materiFor(t.id) ? ' · materi tersedia' : ' · materi belum ada'}</small>
                  </Link>
                ))}
              </div>
            </section>
          ))}
          <section className="card muted-card">
            <strong>SKB</strong>
            <p>Materi SKB bergantung pada jabatan dan instansi. Modul ini dibuka setelah jabatan target dipilih. Sementara itu, catat materi SKB Anda di menu Rencana Belajar.</p>
          </section>
        </div>

        <aside className="learn-side">
          <section className="card">
            <h2>Progres Belajar Anda</h2>
            <div className="prog-body">
              <ProgressRing value={prog.pAll} size={120} label="Progres keseluruhan" />
              <ul className="prog-list">
                <li><span className="dot ok" /> Materi <b>{prog.tried} / {prog.totalTopics}</b></li>
                <li><span className="dot ok" /> Latihan Soal <b>{prog.answered} / {prog.totalQuestions}</b></li>
                <li><span className="dot wait" /> Simulasi CAT <b>{prog.cats} / {CAT_GOAL}</b></li>
              </ul>
            </div>
            <Link className="btn wide" to="/plan">Lihat Detail Progress →</Link>
          </section>
          <section className="card">
            <div className="row"><h2><Megaphone size={18} className="ico-teal" aria-hidden="true" /> Informasi Terbaru</h2></div>
            <ul className="news">
              <li><span className="dot warn" /><div><small>Status data</small><b>Angka ujian masih referensi pola 2024 ({examConfig.id})</b></div></li>
              <li><span className="dot ok" /><div><small>{new Date(curriculum.created).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</small><b>Peta belajar v{curriculum.version} dimuat</b></div></li>
              <li><span className="dot ok" /><div><small>Verifikasi</small><b>{verified} dari {questions.length} soal sudah Anda verifikasi</b></div></li>
            </ul>
          </section>
        </aside>
      </div>

      <div className="infobar tip" role="note">
        <span className="ico-circle"><Lightbulb size={22} aria-hidden="true" /></span>
        <div><strong>Ingat!</strong><p>Belajar secara rutin dan pahami materi dengan baik adalah kunci utama sukses dalam seleksi CPNS 2026.</p></div>
        <Link className="btn small ghost" to="/practice">Mulai Latihan →</Link>
      </div>
    </>
  )
}
