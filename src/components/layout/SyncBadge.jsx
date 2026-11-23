import { Cloud, CloudAlert, CloudOff, Loader2 } from 'lucide-react'
import { useStore } from '../../contexts/StoreContext'

const view = {
  syncing: { icon: Loader2, text: 'Menyimpan…', cls: 'busy' },
  saved: { icon: Cloud, text: 'Tersimpan', cls: 'ok' },
  offline: { icon: CloudOff, text: 'Offline', cls: 'warn' },
  error: { icon: CloudAlert, text: 'Gagal sinkron', cls: 'bad' },
}

/** Status penyimpanan akun online. Tidak tampil untuk mode tamu. */
export default function SyncBadge() {
  const { mode, sync, retrySync } = useStore()
  const v = view[sync]
  if (mode !== 'cloud' || !v) return null
  const Icon = v.icon
  const retry = sync === 'error' || sync === 'offline'
  const body = <><Icon size={16} aria-hidden="true" className={sync === 'syncing' ? 'spin' : ''} /><span>{v.text}</span></>
  return retry
    ? <button type="button" className={`sync ${v.cls}`} onClick={retrySync} title="Coba kirim ulang" aria-label={`${v.text}. Coba kirim ulang`}>{body}</button>
    : <span className={`sync ${v.cls}`} role="status">{body}</span>
}
