import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { setAuthUser, setDashboardSnapshot, clearAuth } from './store/authSlice'
import { refreshSession, getDashboard } from './lib/api'

import AdminLoginPage           from './pages/AdminLoginPage'
import AdminDashboardPage       from './pages/AdminDashboardPage'
import AdminUsersPage           from './pages/AdminUsersPage'
import AdminUserDetailPage      from './pages/AdminUserDetailPage'
import AdminTechniciansPage     from './pages/AdminTechniciansPage'
import AdminTechnicianDetailPage from './pages/AdminTechnicianDetailPage'
import AdminVendorsPage         from './pages/AdminVendorsPage'
import AdminVendorDetailPage    from './pages/AdminVendorDetailPage'
import AdminWarehousesPage      from './pages/AdminWarehousesPage'
import AdminWarehouseDetailPage from './pages/AdminWarehouseDetailPage'
import AdminRequestsPage        from './pages/AdminRequestsPage'
import AdminRequestDetailPage   from './pages/AdminRequestDetailPage'
import AdminJobsPage            from './pages/AdminJobsPage'
import AdminJobDetailPage       from './pages/AdminJobDetailPage'
import AdminOrdersPage          from './pages/AdminOrdersPage'
import AdminOrderDetailPage     from './pages/AdminOrderDetailPage'
import AdminInvoicesPage        from './pages/AdminInvoicesPage'
import AdminInvoiceDetailPage   from './pages/AdminInvoiceDetailPage'
import AdminAnalyticsPage       from './pages/AdminAnalyticsPage'
import AdminAuditLogsPage       from './pages/AdminAuditLogsPage'

function RequireAuth({ children }) {
  const { isAuthenticated, isInitializing } = useSelector((state) => state.auth)
  if (isInitializing) return null
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />
  return children
}

function Auth({ children }) {
  return <RequireAuth>{children}</RequireAuth>
}

function App() {
  const dispatch = useDispatch()
  const isInitializing = useSelector((state) => state.auth.isInitializing)

  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem('qa-admin-theme')
    if (stored) return stored
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('qa-admin-theme', theme)
  }, [theme])

  // ── Session check on mount ───────────────────────────────
  // The httpOnly cookies are sent automatically. If the refresh cookie
  // is still valid we restore the session; otherwise admin must log in.
  useEffect(() => {
    const checkSession = async () => {
      try {
        await refreshSession()
        // Session valid — pre-fetch dashboard snapshot
        try {
          const dashData = await getDashboard()
          dispatch(setDashboardSnapshot(dashData || null))
        } catch {
          // dashboard fetch optional — session is still valid
        }
        dispatch(setAuthUser({ role: 'admin' }))
      } catch {
        dispatch(clearAuth())
      }
    }
    checkSession()
  }, [dispatch])

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark')

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
      <Route path="/" element={<Navigate to="/admin/login" replace />} />
      <Route path="/admin/login" element={<AdminLoginPage {...tp} />} />

      <Route path="/admin/dashboard"              element={<Auth><AdminDashboardPage {...tp} /></Auth>} />

      <Route path="/admin/users"                   element={<Auth><AdminUsersPage /></Auth>} />
      <Route path="/admin/users/:userId"           element={<Auth><AdminUserDetailPage /></Auth>} />

      <Route path="/admin/technicians"             element={<Auth><AdminTechniciansPage /></Auth>} />
      <Route path="/admin/technicians/:techId"     element={<Auth><AdminTechnicianDetailPage /></Auth>} />

      <Route path="/admin/vendors"                 element={<Auth><AdminVendorsPage /></Auth>} />
      <Route path="/admin/vendors/:vendorId"       element={<Auth><AdminVendorDetailPage /></Auth>} />

      <Route path="/admin/warehouses"              element={<Auth><AdminWarehousesPage /></Auth>} />
      <Route path="/admin/warehouses/:warehouseId" element={<Auth><AdminWarehouseDetailPage /></Auth>} />

      <Route path="/admin/requests"                element={<Auth><AdminRequestsPage /></Auth>} />
      <Route path="/admin/requests/:requestId"     element={<Auth><AdminRequestDetailPage /></Auth>} />

      <Route path="/admin/jobs"                    element={<Auth><AdminJobsPage /></Auth>} />
      <Route path="/admin/jobs/:jobId"             element={<Auth><AdminJobDetailPage /></Auth>} />

      <Route path="/admin/orders"                  element={<Auth><AdminOrdersPage /></Auth>} />
      <Route path="/admin/orders/:orderId"         element={<Auth><AdminOrderDetailPage /></Auth>} />

      <Route path="/admin/invoices"                element={<Auth><AdminInvoicesPage /></Auth>} />
      <Route path="/admin/invoices/:invoiceId"     element={<Auth><AdminInvoiceDetailPage /></Auth>} />

      <Route path="/admin/analytics"               element={<Auth><AdminAnalyticsPage /></Auth>} />
      <Route path="/admin/audit-logs"              element={<Auth><AdminAuditLogsPage /></Auth>} />

      <Route path="*" element={<Navigate to="/admin/login" replace />} />
    </Routes>
  )
}

export default App
