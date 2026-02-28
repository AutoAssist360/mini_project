import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { adminLogout } from '../lib/api'
import { clearAuth } from '../store/authSlice'

function AdminDashboardPage({ theme, onToggleTheme }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const auth = useSelector((state) => state.auth)
  const dashboard = useSelector((state) => state.auth.dashboard)

  const handleLogout = async () => {
    await adminLogout().catch(() => null)
    dispatch(clearAuth())
    navigate('/admin/login')
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-xl font-semibold">Admin Dashboard (Phase 1)</h1>
            <div className="flex gap-2">
              <button type="button" onClick={onToggleTheme} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</button>
              <a href={import.meta.env.VITE_LANDING_APP_URL || 'http://localhost:5173'} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">Go to Landing</a>
              <button type="button" onClick={handleLogout} className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500">Logout</button>
            </div>
          </div>
        </header>

        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-base font-semibold">Session State (Redux)</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400">Authenticated</p>
              <p className="mt-1 text-sm font-semibold">{auth.isAuthenticated ? 'Yes' : 'No'}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400">Access Token</p>
              <p className="mt-1 break-all text-xs">{auth.accessToken ? `${auth.accessToken.slice(0, 20)}...` : 'Not available'}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400">Admin Email</p>
              <p className="mt-1 text-sm font-semibold">{auth.user?.email || 'Unknown'}</p>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs text-slate-500 dark:text-slate-400">Total Users</p>
            <p className="mt-1 text-2xl font-bold">{dashboard?.users?.total ?? '--'}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs text-slate-500 dark:text-slate-400">Technicians</p>
            <p className="mt-1 text-2xl font-bold">{dashboard?.technicians?.total ?? '--'}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs text-slate-500 dark:text-slate-400">Vendors</p>
            <p className="mt-1 text-2xl font-bold">{dashboard?.vendors?.total ?? '--'}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs text-slate-500 dark:text-slate-400">Active Warehouses</p>
            <p className="mt-1 text-2xl font-bold">{dashboard?.warehouses?.active ?? '--'}</p>
          </article>
        </section>
      </div>
    </div>
  )
}

export default AdminDashboardPage
