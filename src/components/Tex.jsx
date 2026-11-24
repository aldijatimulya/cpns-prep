import { useEffect, useState } from 'react'

// KaTeX dimuat saat pertama dibutuhkan (tidak membebani halaman lain). Output KaTeX aman: trust dimatikan.
let katexPromise = null
const loadKatex = () => (katexPromise ??= Promise.all([import('katex'), import('katex/dist/katex.min.css')]).then(([m]) => m.default ?? m))

export function renderTex(katex, src, display) {
  return katex.renderToString(src, { displayMode: display, throwOnError: false, strict: 'ignore', trust: false, maxExpand: 1000, maxSize: 20, output: 'html' })
}

export default function Tex({ src, display = false }) {
  const [html, setHtml] = useState('')
  useEffect(() => {
    let alive = true
    loadKatex().then((k) => { if (alive) setHtml(renderTex(k, src, display)) }).catch(() => {})
    return () => { alive = false }
  }, [src, display])
  const Tag = display ? 'div' : 'span'
  if (!html) return <Tag className={display ? 'tex-block tex-raw' : 'tex-raw'}>{src}</Tag>
  return <Tag className={display ? 'tex-block' : 'tex-inline'} dangerouslySetInnerHTML={{ __html: html }} />
}
