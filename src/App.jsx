import { Suspense, lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import Login from './pages/Login'
import { useAuth } from './contexts/AuthContext'
import { useStore } from './contexts/StoreContext'
import Layout from './components/layout/Layout'
import Logo from './components/ui/Logo'
import Dashboard from './pages/Dashboard'
import LearningCenter from './pages/LearningCenter'
import TopicDetail from './pages/TopicDetail'
const QuestionBank = lazy(() => import('./pages/QuestionBank'))
const Practice = lazy(() => import('./pages/Practice'))
const Cat = lazy(() => import('./pages/Cat'))
const Plan = lazy(() => import('./pages/Plan'))
const Tutor = lazy(() => import('./pages/Tutor'))
const Agent = lazy(() => import('./pages/Agent'))
const Skb = lazy(() => import('./pages/Skb'))
const Help = lazy(() => import('./pages/Help'))
import Settings from './pages/Settings'

function Splash() {
  return (
    <div className="splash" role="status" aria-live="polite">
      <Logo size={56} />
      <p>Memuat data belajar Anda…</p>
    </div>
  )
}

export default function App() {
  const auth = useAuth()
  const { hydrated } = useStore()
  if (!auth.ready) return <Splash />
  if (auth.recovery || (!auth.user && !auth.guest)) return <Login />
  if (!hydrated) return <Splash />
  return (
    <Suspense fallback={<p className="muted" role="status">Memuat…</p>}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="learn" element={<LearningCenter />} />
          <Route path="learn/:topicId" element={<TopicDetail />} />
          <Route path="bank" element={<QuestionBank />} />
          <Route path="practice" element={<Practice />} />
          <Route path="cat" element={<Cat />} />
          <Route path="tutor" element={<Tutor />} />
          <Route path="agent" element={<Agent />} />
          <Route path="skb" element={<Skb />} />
          <Route path="plan" element={<Plan />} />
          <Route path="settings" element={<Settings />} />
          <Route path="help" element={<Help />} />
          <Route path="*" element={<Dashboard />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
