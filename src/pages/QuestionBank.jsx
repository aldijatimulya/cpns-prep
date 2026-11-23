import { useMemo, useState } from 'react'
import { Bookmark } from 'lucide-react'
import TutorPanel from '../components/TutorPanel'
import { useStore } from '../contexts/StoreContext'
import { categories, questions, topicById } from '../data'
import { FigOptions, StemFigure, hasFigureOptions } from '../components/FigureQuestion'

export default function QuestionBank() {
  const { state, toggleBookmark, toggleVerified } = useStore()
  const [cat, setCat] = useState('ALL')
  const [topic, setTopic] = useState('ALL')
  const [onlyMarked, setOnlyMarked] = useState(false)
  const [onlyUnverified, setOnlyUnverified] = useState(false)
  const [open, setOpen] = useState(null)

  const topicsOfCat = useMemo(
    () => categories.filter((c) => cat === 'ALL' || c.id === cat).flatMap((c) => c.topics),
    [cat],
  )
  const list = questions.filter(
    (q) =>
      (cat === 'ALL' || q.category === cat) &&
      (topic === 'ALL' || q.topic_id === topic) &&
      (!onlyMarked || state.bookmarks.includes(q.id)) &&
      (!onlyUnverified || !state.verified.includes(q.id)),
  )
  const verifiedCount = questions.filter((q) => state.verified.includes(q.id)).length

  return (
    <>
      <header className="page-head">
        <h1>Bank Soal</h1>
        <p>{list.length} dari {questions.length} soal. Terverifikasi oleh Anda: {verifiedCount}. Soal lain masih draft.</p>
      </header>

      <div className="filters card">
        <label>Kategori
          <select value={cat} onChange={(e) => { setCat(e.target.value); setTopic('ALL') }}>
            <option value="ALL">Semua</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.id}</option>)}
          </select>
        </label>
        <label>Topik
          <select value={topic} onChange={(e) => setTopic(e.target.value)}>
            <option value="ALL">Semua</option>
            {topicsOfCat.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </label>
        <label className="check">
          <input type="checkbox" checked={onlyMarked} onChange={(e) => setOnlyMarked(e.target.checked)} />
          Hanya yang ditandai
        </label>
        <label className="check">
          <input type="checkbox" checked={onlyUnverified} onChange={(e) => setOnlyUnverified(e.target.checked)} />
          Belum diverifikasi
        </label>
      </div>

      <ul className="qlist">
        {list.map((q) => {
          const marked = state.bookmarks.includes(q.id)
          const isOpen = open === q.id
          return (
            <li key={q.id} className="card">
              <div className="row">
                <small>
                  {q.id} · {topicById[q.topic_id]?.name} · level {q.difficulty}
                  {state.verified.includes(q.id) && <span className="vmark">✓ terverifikasi</span>}
                </small>
                <button
                  className={marked ? 'icon-btn on' : 'icon-btn'}
                  aria-pressed={marked}
                  aria-label={marked ? 'Hapus tanda' : 'Tandai soal'}
                  onClick={() => toggleBookmark(q.id)}
                >
                  <Bookmark size={18} />
                </button>
              </div>
              <p className="stem">{q.stem}</p>
              <StemFigure q={q} />
              <button className="link-btn" onClick={() => setOpen(isOpen ? null : q.id)}>
                {isOpen ? 'Sembunyikan opsi dan pembahasan' : 'Lihat opsi dan pembahasan'}
              </button>
              {isOpen && (
                <div className="reveal">
                  {hasFigureOptions(q) ? (
                    <FigOptions q={q} />
                  ) : (
                    <ol type="A">
                      {q.options.map((o) => (
                        <li key={o.key} className={q.answer === o.key ? 'right' : ''}>
                          {o.text}{o.score ? ` (skor ${o.score})` : ''}
                        </li>
                      ))}
                    </ol>
                  )}
                  <p><strong>Ringkas:</strong> {q.explanation.quick}</p>
                  <p><strong>Rinci:</strong> {q.explanation.detailed}</p>
                  <TutorPanel q={q} chosen={null} />
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={state.verified.includes(q.id)}
                      onChange={() => toggleVerified(q.id)}
                    />
                    Saya sudah memeriksa kunci dan pembahasan soal ini
                  </label>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </>
  )
}
