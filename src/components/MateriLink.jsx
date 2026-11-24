import { Link } from 'react-router-dom'
import { BookOpen } from 'lucide-react'
import { indicatorText, materiFor } from '../data'

/** Tautan dari soal ke indikator kisi-kisi dan materinya. */
export default function MateriLink({ q }) {
  const text = indicatorText(q)
  if (text == null) return null
  const has = !!materiFor(q.topic_id)
  return (
    <p className="materi-link">
      <small>Kisi-kisi: {text}</small>
      {has && (
        <Link to={`/learn/${q.topic_id}?i=${q.indicator}`}><BookOpen size={14} aria-hidden="true" /> Baca materi indikator ini</Link>
      )}
    </p>
  )
}
