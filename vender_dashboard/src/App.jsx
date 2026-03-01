import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { setAuthUser, clearAuth } from './store/authSlice'
import { refreshSession } from './lib/api'
import VendorSignInPage from './pages/VendorSignInPage'
import VendorSignUpPage from './pages/VendorSignUpPage'
import VendorDashboardPage from './pages/VendorDashboardPage'
import VendorWarehousesPage from './pages/VendorWarehousesPage'
import VendorInventoryPage from './pages/VendorInventoryPage'
import VendorOrdersPage from './pages/VendorOrdersPage'
import VendorOrderDetailPage from './pages/VendorOrderDetailPage'
import VendorAnalyticsPage from './pages/VendorAnalyticsPage'

function RequireAuth({ children }) {
  const { isAuthenticated, isInitializing } = useSelector((state) => state.auth)
  if (isInitializing) return null
  if (!isAuthenticated) {
    return <Navigate to="/auth/vendor/signin" replace />
  }
  return children
}

function App() {
  const dispatch = useDispatch()
  const isInitializing = useSelector((state) => state.auth.isInitializing)

  const [theme, setTheme] = useState(() => {
    const storedTheme = localStorage.getItem('qa-vendor-theme')
    if (storedTheme) {
      return storedTheme
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('qa-vendor-theme', theme)
  }, [theme])

  // ── Session check on mount ───────────────────────────────
  // The httpOnly cookies are sent automatically. If the refresh cookie
  // is still valid we restore the session; otherwise user must sign in.
  useEffect(() => {
    const checkSession = async () => {
      try {
        await refreshSession()
        dispatch(setAuthUser({ role: 'vendor' }))
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

  const vp = { theme, onToggleTheme: toggleTheme }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/auth/vendor/signin" replace />} />
      <Route path="/auth/vendor/signin" element={<VendorSignInPage {...vp} />} />
      <Route path="/auth/vendor/signup" element={<VendorSignUpPage {...vp} />} />
      <Route path="/dashboard" element={<RequireAuth><VendorDashboardPage {...vp} /></RequireAuth>} />
      <Route path="/warehouses" element={<RequireAuth><VendorWarehousesPage {...vp} /></RequireAuth>} />
      <Route path="/warehouses/:warehouseId/inventory" element={<RequireAuth><VendorInventoryPage {...vp} /></RequireAuth>} />
      <Route path="/orders" element={<RequireAuth><VendorOrdersPage {...vp} /></RequireAuth>} />
      <Route path="/orders/:orderId" element={<RequireAuth><VendorOrderDetailPage {...vp} /></RequireAuth>} />
      <Route path="/analytics" element={<RequireAuth><VendorAnalyticsPage {...vp} /></RequireAuth>} />
      <Route path="*" element={<Navigate to="/auth/vendor/signin" replace />} />
    </Routes>
  )
}

export default App
