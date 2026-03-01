import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getOrders, ApiError } from '../lib/api'

const ORDER_STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  processing: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  shipped: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  delivered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  returned: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
}

const STATUS_FILTERS = ['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned']

function VendorOrdersPage({ theme, onToggleTheme }) {
  const [orders, setOrders] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const limit = 15

  const loadOrders = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const filters = {}
      if (statusFilter !== 'all') filters.order_status = statusFilter
      const res = await getOrders(page, limit, filters)
      setOrders(res?.orders ?? [])
      setTotal(res?.total ?? 0)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter])

  useEffect(() => { loadOrders() }, [loadOrders])

  const totalPages = Math.ceil(total / limit) || 1

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link to="/dashboard" className="text-sm text-emerald-600 hover:text-emerald-500 dark:text-emerald-300">← Dashboard</Link>
              <h1 className="text-xl font-semibold">Orders</h1>
              <span className="text-xs text-slate-400">({total})</span>
            </div>
            <button type="button" onClick={onToggleTheme} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</button>
          </div>
        </header>

        {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">{error}</div>}

        {/* Filters */}
        <div className="mt-4 flex flex-wrap gap-2">
          {STATUS_FILTERS.map((s) => (
            <button key={s} type="button" onClick={() => { setStatusFilter(s); setPage(1) }} className={`rounded-xl border px-3 py-1.5 text-xs font-medium capitalize ${statusFilter === s ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300' : 'border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400'}`}>
              {s === 'all' ? 'All' : s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="mt-10 text-center text-sm text-slate-500">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="mt-10 text-center text-sm text-slate-500">No orders found.</div>
        ) : (
          <>
            <section className="mt-4 space-y-3">
              {orders.map((order) => (
                <Link key={order.order_id} to={`/orders/${order.order_id}`} className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-emerald-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-600">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{order.order_number}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ORDER_STATUS_COLORS[order.order_status] || ''}`}>
                          {order.order_status?.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {order.user?.full_name || order.user?.email} · {order.warehouse?.name}
                      </p>
                      <p className="text-xs text-slate-400">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">₹{Number(order.total).toLocaleString()}</p>
                      <p className={`text-xs ${order.payment_status === 'completed' ? 'text-emerald-600 dark:text-emerald-300' : order.payment_status === 'refunded' ? 'text-slate-500' : 'text-amber-600 dark:text-amber-300'}`}>
                        {order.payment_status}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {order._count?.items ?? 0} items · {order._count?.fulfillments ?? 0} fulfillments
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </section>

            {totalPages > 1 && (
              <div className="mt-3 flex items-center justify-center gap-2">
                <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs disabled:opacity-40 dark:border-slate-700">Prev</button>
                <span className="text-xs text-slate-500">{page}/{totalPages}</span>
                <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs disabled:opacity-40 dark:border-slate-700">Next</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default VendorOrdersPage
