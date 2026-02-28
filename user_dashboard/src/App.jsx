import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { setAuthUser, clearAuth } from './store/authSlice'
import { getMyProfile } from './lib/api'
import UserSignInPage from './pages/UserSignInPage'
import UserSignUpPage from './pages/UserSignUpPage'
import UserDashboardPage from './pages/UserDashboardPage'
import UserRequestsPage from './pages/UserRequestsPage'
import UserNewRequestPage from './pages/UserNewRequestPage'
import UserRequestDetailPage from './pages/UserRequestDetailPage'
import UserOrdersPage from './pages/UserOrdersPage'
import UserOrderDetailPage from './pages/UserOrderDetailPage'
import UserInvoiceDetailPage from './pages/UserInvoiceDetailPage'
import UserProfilePage from './pages/UserProfilePage'
import UserVehiclesPage from './pages/UserVehiclesPage'
import UserJobsPage from './pages/UserJobsPage'
import UserJobDetailPage from './pages/UserJobDetailPage'
import UserReviewsPage from './pages/UserReviewsPage'
import UserMessagesPage from './pages/UserMessagesPage'

function RequireAuth({ children }) {
  const { isAuthenticated, isInitializing } = useSelector((state) => state.auth)
  if (isInitializing) return null // App-level loader handles this
  if (!isAuthenticated) {
    return <Navigate to="/auth/user/signin" replace />
  }
  return children
}

function App() {
  const dispatch = useDispatch()
  const isInitializing = useSelector((state) => state.auth.isInitializing)

  const [theme, setTheme] = useState(() => {
    const storedTheme = localStorage.getItem('qa-user-theme')
    if (storedTheme) {
      return storedTheme
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('qa-user-theme', theme)
  }, [theme])

  // ── Session check on mount ───────────────────────────────
  // The httpOnly cookies are sent automatically. If valid the user
  // is restored; if the access token expired the api layer auto-calls
  // POST /auth/refresh before retrying.
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await getMyProfile()
        if (response?.user?.role === 'user') {
          dispatch(setAuthUser(response.user))
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

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/auth/user/signin" replace />} />
      <Route path="/auth/user/signin" element={<UserSignInPage theme={theme} onToggleTheme={toggleTheme} />} />
      <Route path="/auth/user/signup" element={<UserSignUpPage theme={theme} onToggleTheme={toggleTheme} />} />
      <Route
        path="/dashboard"
        element={(
          <RequireAuth>
            <UserDashboardPage theme={theme} onToggleTheme={toggleTheme} />
          </RequireAuth>
        )}
      />
      <Route
        path="/requests"
        element={(
          <RequireAuth>
            <UserRequestsPage theme={theme} onToggleTheme={toggleTheme} />
          </RequireAuth>
        )}
      />
      <Route
        path="/requests/new"
        element={(
          <RequireAuth>
            <UserNewRequestPage theme={theme} onToggleTheme={toggleTheme} />
          </RequireAuth>
        )}
      />
      <Route
        path="/requests/:requestId"
        element={(
          <RequireAuth>
            <UserRequestDetailPage theme={theme} onToggleTheme={toggleTheme} />
          </RequireAuth>
        )}
      />
      <Route
        path="/orders"
        element={(
          <RequireAuth>
            <UserOrdersPage theme={theme} onToggleTheme={toggleTheme} />
          </RequireAuth>
        )}
      />
      <Route
        path="/orders/:orderId"
        element={(
          <RequireAuth>
            <UserOrderDetailPage theme={theme} onToggleTheme={toggleTheme} />
          </RequireAuth>
        )}
      />
      <Route
        path="/invoices/:invoiceId"
        element={(
          <RequireAuth>
            <UserInvoiceDetailPage theme={theme} onToggleTheme={toggleTheme} />
          </RequireAuth>
        )}
      />
      <Route
        path="/jobs"
        element={(
          <RequireAuth>
            <UserJobsPage theme={theme} onToggleTheme={toggleTheme} />
          </RequireAuth>
        )}
      />
      <Route
        path="/jobs/:jobId"
        element={(
          <RequireAuth>
            <UserJobDetailPage theme={theme} onToggleTheme={toggleTheme} />
          </RequireAuth>
        )}
      />
      <Route
        path="/reviews"
        element={(
          <RequireAuth>
            <UserReviewsPage theme={theme} onToggleTheme={toggleTheme} />
          </RequireAuth>
        )}
      />
      <Route
        path="/requests/:requestId/messages"
        element={(
          <RequireAuth>
            <UserMessagesPage theme={theme} onToggleTheme={toggleTheme} />
          </RequireAuth>
        )}
      />
      <Route
        path="/profile"
        element={(
          <RequireAuth>
            <UserProfilePage theme={theme} onToggleTheme={toggleTheme} />
          </RequireAuth>
        )}
      />
      <Route
        path="/vehicles"
        element={(
          <RequireAuth>
            <UserVehiclesPage theme={theme} onToggleTheme={toggleTheme} />
          </RequireAuth>
        )}
      />
      <Route path="*" element={<Navigate to="/auth/user/signin" replace />} />
    </Routes>
  )
}

export default App
