import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getRevenueAnalytics,
  getOrderAnalytics,
  getInventoryAnalytics,
  ApiError,
} from '../lib/api'

function VendorAnalyticsPage({ theme, onToggleTheme }) {
  const [revenue, setRevenue] = useState(null)
  const [orderStats, setOrderStats] = useState(null)
  const [inventoryStats, setInventoryStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Date range
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const loadAnalytics = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const results = await Promise.allSettled([
        getRevenueAnalytics(from || undefined, to || undefined),
        getOrderAnalytics(from || undefined, to || undefined),
        getInventoryAnalytics(),
      ])
      if (results[0].status === 'fulfilled') setRevenue(results[0].value)
      if (results[1].status === 'fulfilled') setOrderStats(results[1].value)
      if (results[2].status === 'fulfilled') setInventoryStats(results[2].value)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }, [from, to])

  useEffect(() => { loadAnalytics() }, [loadAnalytics])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link to="/dashboard" className="text-sm text-emerald-600 hover:text-emerald-500 dark:text-emerald-300">← Dashboard</Link>
              <h1 className="text-xl font-semibold">Analytics</h1>
            </div>
            <button type="button" onClick={onToggleTheme} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</button>
          </div>
        </header>

        {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">{error}</div>}

        {/* Date range filter */}
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium">From</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-800" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">To</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-800" />
          </div>
          {(from || to) && (
            <button type="button" onClick={() => { setFrom(''); setTo('') }} className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">Clear</button>
          )}
        </div>

        {loading ? (
          <div className="mt-10 text-center text-sm text-slate-500">Loading analytics...</div>
        ) : (
          <>
            {/* Revenue */}
            {revenue && (
              <section className="mt-5">
                <h2 className="text-base font-semibold">Revenue</h2>
                <div className="mt-3 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Revenue</p>
                    <p className="mt-2 text-3xl font-bold text-emerald-600 dark:text-emerald-400">₹{Number(revenue.total_revenue).toLocaleString()}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Orders</p>
                    <p className="mt-2 text-3xl font-bold">{revenue.total_orders}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Avg Order Value</p>
                    <p className="mt-2 text-3xl font-bold">₹{Number(revenue.avg_order_value).toFixed(0)}</p>
                  </div>
                </div>
              </section>
            )}

            {/* Order breakdown */}
            {orderStats && (
              <section className="mt-5">
                <h2 className="text-base font-semibold">Orders Breakdown</h2>
                <div className="mt-3 grid gap-5 sm:grid-cols-2">
                  {/* By status */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">By Status</h3>
                    <div className="mt-3 space-y-2">
                      {Object.entries(orderStats.by_status || {}).map(([status, count]) => (
                        <div key={status} className="flex items-center justify-between">
                          <span className="text-sm capitalize">{status.replace(/_/g, ' ')}</span>
                          <span className="text-sm font-bold">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* By payment */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">By Payment</h3>
                    <div className="mt-3 space-y-2">
                      {Object.entries(orderStats.by_payment || {}).map(([status, count]) => (
                        <div key={status} className="flex items-center justify-between">
                          <span className="text-sm capitalize">{status}</span>
                          <span className="text-sm font-bold">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Inventory stats */}
            {inventoryStats && (
              <section className="mt-5">
                <h2 className="text-base font-semibold">Inventory Overview</h2>
                <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  {[
                    { label: 'Total Items', value: inventoryStats.total_items },
                    { label: 'Total Available', value: inventoryStats.total_available },
                    { label: 'Total Reserved', value: inventoryStats.total_reserved },
                    { label: 'Total Value', value: `₹${Number(inventoryStats.total_value).toLocaleString()}` },
                    { label: 'Low Stock', value: inventoryStats.low_stock_count, warn: inventoryStats.low_stock_count > 0 },
                  ].map((s) => (
                    <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                      <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">{s.label}</p>
                      <p className={`mt-2 text-2xl font-bold ${s.warn ? 'text-amber-600 dark:text-amber-400' : ''}`}>{s.value}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default VendorAnalyticsPage
