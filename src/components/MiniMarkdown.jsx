// Penampil jawaban AI: judul, daftar, tabel, kutipan, kode, **tebal**, *miring*, `kode`, dan rumus LaTeX
// ($...$ sebaris, $$...$$ atau \[...\] satu baris sendiri). Tanpa HTML mentah, jadi aman.
import Tex from './Tex'

const MATH = /\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\$(?=\S)[^$\n]*?\S\$(?!\d)/g

function emphasis(text, key) {
  const out = []
  const re = /(\*\*[^*]+\*\*|`[^`]+`|(?<![*\w])\*[^*\s][^*]*\*(?![*\w]))/g
  let last = 0
  let m
  let n = 0
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const t = m[0]
    if (t.startsWith('**')) out.push(<strong key={`${key}b${n++}`}>{t.slice(2, -2)}</strong>)
    else if (t.startsWith('`')) out.push(<code key={`${key}c${n++}`}>{t.slice(1, -1)}</code>)
    else out.push(<em key={`${key}i${n++}`}>{t.slice(1, -1)}</em>)
    last = m.index + t.length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

export function inline(text, key = 'x') {
  const out = []
  let last = 0
  let n = 0
  for (const m of text.matchAll(MATH)) {
    if (m.index > last) out.push(...emphasis(text.slice(last, m.index), `${key}t${n}`))
    const t = m[0]
    const display = t.startsWith('$$') || t.startsWith('\\[')
    const body = t.startsWith('$$') ? t.slice(2, -2) : t.startsWith('\\[') || t.startsWith('\\(') ? t.slice(2, -2) : t.slice(1, -1)
    out.push(<Tex key={`${key}m${n++}`} src={body.trim()} display={display} />)
    last = m.index + t.length
  }
  if (last < text.length) out.push(...emphasis(text.slice(last), `${key}e`))
  return out
}

const cells = (l) => l.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim())
const isSep = (l) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(l) && l.includes('-')

export function parseBlocks(text) {
  const lines = String(text).replace(/\r/g, '').split('\n')
  const blocks = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    const t = line.trim()
    if (!t) { i++; continue }
    if (t.startsWith('```')) {
      const buf = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) buf.push(lines[i++])
      i++
      blocks.push({ t: 'code', text: buf.join('\n') })
      continue
    }
    if (t.startsWith('$$') || t.startsWith('\\[')) {
      const close = t.startsWith('$$') ? '$$' : '\\]'
      const open = t.startsWith('$$') ? '$$' : '\\['
      let body = t.slice(2)
      if (body.includes(close) && body.trimEnd().endsWith(close)) { blocks.push({ t: 'math', text: body.trimEnd().slice(0, -2) }); i++; continue }
      const buf = [body]
      i++
      while (i < lines.length && !lines[i].includes(close)) buf.push(lines[i++])
      if (i < lines.length) buf.push(lines[i++].split(close)[0])
      blocks.push({ t: 'math', text: buf.join('\n') })
      void open
      continue
    }
    if (/^-{3,}$|^\*{3,}$/.test(t)) { blocks.push({ t: 'hr' }); i++; continue }
    const h = t.match(/^#{1,4}\s+(.*)$/)
    if (h) { blocks.push({ t: 'h', text: h[1] }); i++; continue }
    if (t.startsWith('|') && i + 1 < lines.length && isSep(lines[i + 1])) {
      const head = cells(t)
      i += 2
      const rows = []
      while (i < lines.length && lines[i].trim().startsWith('|')) rows.push(cells(lines[i++]))
      blocks.push({ t: 'table', head, rows })
      continue
    }
    if (t.startsWith('>')) {
      const buf = []
      while (i < lines.length && lines[i].trim().startsWith('>')) buf.push(lines[i++].trim().replace(/^>\s?/, ''))
      blocks.push({ t: 'quote', text: buf.join('\n') })
      continue
    }
    const li = line.match(/^\s*([-*]|\d+[.)])\s+(.*)$/)
    if (li) {
      const ordered = /\d/.test(li[1])
      const items = []
      while (i < lines.length) {
        const m = lines[i].match(/^\s*([-*]|\d+[.)])\s+(.*)$/)
        if (!m || /\d/.test(m[1]) !== ordered) break
        items.push(m[2]); i++
      }
      blocks.push({ t: ordered ? 'ol' : 'ul', items })
      continue
    }
    const buf = [line.trim()]
    i++
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|```|\$\$|\\\[|>|\||\s*([-*]|\d+[.)])\s)/.test(lines[i].trim() === lines[i] ? lines[i] : lines[i].trimStart())) buf.push(lines[i++].trim())
    blocks.push({ t: 'p', text: buf.join('\n') })
  }
  return blocks
}

export default function MiniMarkdown({ text }) {
  const blocks = parseBlocks(text)
  return (
    <div className="md">
      {blocks.map((b, i) => {
        const k = `b${i}`
        switch (b.t) {
          case 'h': return <h4 key={k}>{inline(b.text, k)}</h4>
          case 'ul': return <ul key={k}>{b.items.map((x, j) => <li key={j}>{inline(x, `${k}-${j}`)}</li>)}</ul>
          case 'ol': return <ol key={k}>{b.items.map((x, j) => <li key={j}>{inline(x, `${k}-${j}`)}</li>)}</ol>
          case 'math': return <Tex key={k} src={b.text.trim()} display />
          case 'code': return <pre key={k}><code>{b.text}</code></pre>
          case 'hr': return <hr key={k} />
          case 'quote': return <blockquote key={k}>{inline(b.text, k)}</blockquote>
          case 'table': return (
            <div className="md-table" key={k}>
              <table>
                <thead><tr>{b.head.map((c, j) => <th key={j}>{inline(c, `${k}h${j}`)}</th>)}</tr></thead>
                <tbody>{b.rows.map((r, j) => <tr key={j}>{r.map((c, x) => <td key={x}>{inline(c, `${k}r${j}${x}`)}</td>)}</tr>)}</tbody>
              </table>
            </div>
          )
          default: return <p key={k}>{inline(b.text, k)}</p>
        }
      })}
    </div>
  )
}
