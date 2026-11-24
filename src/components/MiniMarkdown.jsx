// Penampil teks jawaban AI: hanya judul (## ), butir (- ), dan **tebal**. Tanpa HTML mentah, jadi aman.
const inline = (t) => t.split(/(\*\*[^*]+\*\*)/g).map((p, i) => (p.startsWith('**') && p.endsWith('**') && p.length > 4 ? <strong key={i}>{p.slice(2, -2)}</strong> : p))

export default function MiniMarkdown({ text }) {
  const blocks = []
  let list = null
  for (const raw of String(text).split('\n')) {
    const line = raw.trimEnd()
    const li = line.match(/^\s*(?:[-*]|\d+\.)\s+(.*)$/)
    if (li) {
      if (!list) { list = []; blocks.push({ t: 'ul', items: list }) }
      list.push(li[1])
      continue
    }
    list = null
    if (!line.trim()) continue
    const h = line.match(/^#{1,4}\s+(.*)$/)
    blocks.push(h ? { t: 'h', text: h[1] } : { t: 'p', text: line })
  }
  return (
    <div className="md">
      {blocks.map((b, i) => (b.t === 'h' ? <h3 key={i}>{inline(b.text)}</h3>
        : b.t === 'ul' ? <ul key={i}>{b.items.map((x, j) => <li key={j}>{inline(x)}</li>)}</ul>
          : <p key={i}>{inline(b.text)}</p>))}
    </div>
  )
}
