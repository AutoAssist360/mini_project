import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { clearAuth } from '../store/authSlice'
import {
  vendorLogout,
  getWarehouses,
  getRevenueAnalytics,
  getOrderAnalytics,
  getInventoryAnalytics,
  ApiError,
} from '../lib/api'

function VendorDashboardPage({ theme, onToggleTheme }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [revenue, setRevenue] = useState(null)
  const [orderStats, setOrderStats] = useState(null)
  const [inventoryStats, setInventoryStats] = useState(null)
  const [warehouseCount, setWarehouseCount] = useState(0)
  const [error, setError] = useState('')

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const results = await Promise.allSettled([
        getRevenueAnalytics(),
        getOrderAnalytics(),
        getInventoryAnalytics(),
        getWarehouses(1, 1),
      ])
      if (results[0].status === 'fulfilled') setRevenue(results[0].value)
      if (results[1].status === 'fulfilled') setOrderStats(results[1].value)
      if (results[2].status === 'fulfilled') setInventoryStats(results[2].value)
      if (results[3].status === 'fulfilled') setWarehouseCount(results[3].value?.total ?? 0)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadDashboard() }, [loadDashboard])

  const handleLogout = async () => {
    await vendorLogout().catch(() => null)
    dispatch(clearAuth())
    navigate('/auth/vendor/signin')
  }

  const statCards = [
    { label: 'Total Revenue', value: revenue ? `₹${Number(revenue.total_revenue).toLocaleString()}` : '—', color: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Total Orders', value: revenue?.total_orders ?? '—', color: '' },
    { label: 'Avg Order Value', value: revenue ? `₹${Number(revenue.avg_order_value).toFixed(0)}` : '—', color: '' },
    { label: 'Warehouses', value: warehouseCount, color: '' },
    { label: 'Inventory Items', value: inventoryStats?.total_items ?? '—', color: '' },
    { label: 'Low Stock Alerts', value: inventoryStats?.low_stock_count ?? '—', color: inventoryStats?.low_stock_count > 0 ? 'text-amber-600 dark:text-amber-400' : '' },
  ]

  const quickLinks = [
    { label: 'Warehouses', to: '/warehouses', desc: 'Manage your warehouses' },
    { label: 'Orders', to: '/orders', desc: 'View & fulfill orders' },
    { label: 'Analytics', to: '/analytics', desc: 'Revenue, inventory & order analytics' },
  ]

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-xl font-semibold">Vendor Dashboard</h1>
            <div className="flex gap-2">
              <button type="button" onClick={onToggleTheme} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</button>
              <a href={import.meta.env.VITE_LANDING_APP_URL || 'http://localhost:5173'} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">Go to Landing</a>
              <button type="button" onClick={handleLogout} className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500">Logout</button>
            </div>
          </div>
        </header>

        {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">{error}</div>}

        {loading ? (
          <div className="mt-10 text-center text-sm text-slate-500">Loading dashboard...</div>
        ) : (
          <>
            {/* Stats */}
            <section className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {statCards.map((c) => (
                <div key={c.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">{c.label}</p>
                  <p className={`mt-2 text-2xl font-bold ${c.color}`}>{c.value}</p>
                </div>
              ))}
            </section>

            {/* Order status breakdown */}
            {orderStats?.by_status && (
              <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-base font-semibold">Orders by Status</h2>
                <div className="mt-3 flex flex-wrap gap-3">
                  {Object.entries(orderStats.by_status).map(([status, count]) => (
                    <div key={status} className="rounded-xl border border-slate-200 px-3 py-2 text-center dark:border-slate-700">
                      <p className="text-lg font-bold">{count}</p>
                      <p className="text-xs capitalize text-slate-500 dark:text-slate-400">{status.replace(/_/g, ' ')}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Quick links */}
            <section className="mt-5 grid gap-4 sm:grid-cols-3">
              {quickLinks.map((lnk) => (
                <Link key={lnk.to} to={lnk.to} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-emerald-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-600">
                  <h3 className="font-semibold text-emerald-600 dark:text-emerald-300">{lnk.label}</h3>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{lnk.desc}</p>
                </Link>
              ))}
            </section>
          </>
        )}
      </div>
    </div>
  )
}

export default VendorDashboardPage
