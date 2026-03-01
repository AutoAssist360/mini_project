import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { setAuthUser, clearAuth } from './store/authSlice'
import { getTechnicianProfile } from './lib/api'
import TechnicianSignInPage from './pages/TechnicianSignInPage'
import TechnicianSignUpPage from './pages/TechnicianSignUpPage'
import TechnicianDashboardPage from './pages/TechnicianDashboardPage'
import TechnicianProfilePage from './pages/TechnicianProfilePage'
import TechnicianOffersPage from './pages/TechnicianOffersPage'
import TechnicianAssignmentsPage from './pages/TechnicianAssignmentsPage'
import TechnicianJobsPage from './pages/TechnicianJobsPage'
import TechnicianJobDetailPage from './pages/TechnicianJobDetailPage'
import TechnicianEarningsPage from './pages/TechnicianEarningsPage'
import TechnicianMessagesPage from './pages/TechnicianMessagesPage'

function RequireAuth({ children }) {
  const { isAuthenticated, isInitializing } = useSelector((state) => state.auth)
  if (isInitializing) return null
  if (!isAuthenticated) {
    return <Navigate to="/auth/technician/signin" replace />
  }
  return children
}

function App() {
  const dispatch = useDispatch()
  const isInitializing = useSelector((state) => state.auth.isInitializing)

  const [theme, setTheme] = useState(() => {
    const storedTheme = localStorage.getItem('qa-technician-theme')
    if (storedTheme) {
      return storedTheme
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('qa-technician-theme', theme)
  }, [theme])

  // ── Session check on mount ───────────────────────────────
  // The httpOnly cookies are sent automatically. If valid the user
  // is restored; if the access token expired the api layer auto-calls
  // POST /tech/auth/refresh before retrying.
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await getTechnicianProfile()
        if (response?.profile) {
          dispatch(setAuthUser(response.profile))
        } else {
          dispatch(clearAuth())
        }
      } catch {
        dispatch(clearAuth())
      }
    }
    checkSession()
  }, [dispatch])

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
  }

  // Show a minimal loading screen while verifying the session cookie
  if (isInitializing) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${theme === 'dark' ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
        <p className="text-sm text-slate-500">Checking session...</p>
      </div>
    )
  }

  const tp = { theme, onToggleTheme: toggleTheme }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/auth/technician/signin" replace />} />
      <Route path="/auth/technician/signin" element={<TechnicianSignInPage {...tp} />} />
      <Route path="/auth/technician/signup" element={<TechnicianSignUpPage {...tp} />} />
      <Route path="/dashboard" element={<RequireAuth><TechnicianDashboardPage {...tp} /></RequireAuth>} />
      <Route path="/profile" element={<RequireAuth><TechnicianProfilePage {...tp} /></RequireAuth>} />
      <Route path="/offers" element={<RequireAuth><TechnicianOffersPage {...tp} /></RequireAuth>} />
      <Route path="/assignments" element={<RequireAuth><TechnicianAssignmentsPage {...tp} /></RequireAuth>} />
      <Route path="/jobs" element={<RequireAuth><TechnicianJobsPage {...tp} /></RequireAuth>} />
      <Route path="/jobs/:jobId" element={<RequireAuth><TechnicianJobDetailPage {...tp} /></RequireAuth>} />
      <Route path="/earnings" element={<RequireAuth><TechnicianEarningsPage {...tp} /></RequireAuth>} />
      <Route path="/messages/:requestId" element={<RequireAuth><TechnicianMessagesPage {...tp} /></RequireAuth>} />
      <Route path="*" element={<Navigate to="/auth/technician/signin" replace />} />
    </Routes>
  )
}

export default App
