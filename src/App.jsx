import { Suspense, lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import Login from './pages/Login'
import { useStore } from './contexts/StoreContext'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import LearningCenter from './pages/LearningCenter'
import TopicDetail from './pages/TopicDetail'
const QuestionBank = lazy(() => import('./pages/QuestionBank'))
const Practice = lazy(() => import('./pages/Practice'))
const Cat = lazy(() => import('./pages/Cat'))
const Plan = lazy(() => import('./pages/Plan'))
import Settings from './pages/Settings'

export default function App() {
  const { state } = useStore()
  if (!state.profile?.name) return <Login />
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
        <Route path="plan" element={<Plan />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Dashboard />} />
      </Route>
    </Routes>
    </Suspense>
  )
}
