import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { ApiError, getOrderById, getOrderFulfillment, payOrder, userLogout } from '../lib/api'
import { clearAuth } from '../store/authSlice'

const ORDER_STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  shipped: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
  delivered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
}

const PAYMENT_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  refunded: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
}

const FULFILLMENT_COLORS = {
  processing: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  shipped: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  delivered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  returned: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
}

function formatCurrency(value) {
  if (value == null) return 'N/A'
  return `₹${Number(value).toLocaleString('en-IN')}`
}

function StatusBadge({ status, colorMap }) {
  const color = colorMap?.[status] || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${color}`}>{status?.replace(/_/g, ' ')}</span>
}

function UserOrderDetailPage({ theme, onToggleTheme }) {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const [order, setOrder] = useState(null)
  const [fulfillments, setFulfillments] = useState([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [payment, setPayment] = useState({ payment_method: 'upi', transaction_id: '' })
  const [isPaying, setIsPaying] = useState(false)
  const [message, setMessage] = useState('')

  const loadOrder = async () => {
    setIsLoading(true)
    setError('')

    try {
      const [orderResponse, fulfillmentResponse] = await Promise.all([
        getOrderById(orderId),
        getOrderFulfillment(orderId),
      ])

      setOrder(orderResponse?.order || null)
      setFulfillments(fulfillmentResponse?.fulfillments || [])
    } catch (err) {
      if (err instanceof ApiError) setError(err.message)
      else setError('Unable to load order details.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadOrder()
  }, [orderId])

  const handlePay = async (event) => {
    event.preventDefault()
    if (!payment.payment_method || !payment.transaction_id.trim()) return

    setIsPaying(true)
    setError('')
    setMessage('')

    try {
      await payOrder(orderId, {
        payment_method: payment.payment_method,
        transaction_id: payment.transaction_id.trim(),
      })

      setMessage('Order payment successful.')
      setPayment((prev) => ({ ...prev, transaction_id: '' }))
      await loadOrder()
    } catch (err) {
      if (err instanceof ApiError) setError(err.message)
      else setError('Unable to complete order payment.')
    } finally {
      setIsPaying(false)
    }
  }

  const handleLogout = async () => {
    await userLogout().catch(() => null)
    dispatch(clearAuth())
    navigate('/auth/user/signin')
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-xl font-semibold">Order Details</h1>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={onToggleTheme} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</button>
              <Link to="/orders" className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">My Orders</Link>
              <button type="button" onClick={handleLogout} className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500">Logout</button>
            </div>
          </div>
        </header>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        )}

        {message && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-300">
            {message}
          </div>
        )}

        {isLoading ? (
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">Loading order details...</p>
        ) : !order ? (
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">Order not found.</p>
        ) : (
          <>
            <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Order Number</p>
                  <p className="mt-1 text-sm font-medium">{order.order_number || order.order_id}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Order Status</p>
                  <p className="mt-1"><StatusBadge status={order.order_status} colorMap={ORDER_STATUS_COLORS} /></p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Payment Status</p>
                  <p className="mt-1"><StatusBadge status={order.payment_status} colorMap={PAYMENT_COLORS} /></p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Total</p>
                  <p className="mt-1 text-sm font-semibold text-emerald-700 dark:text-emerald-400">{formatCurrency(order.total)}</p>
                </div>
              </div>

              <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                  <thead className="bg-slate-50 dark:bg-slate-900/70">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold">Part</th>
                      <th className="px-3 py-2 text-left font-semibold">Qty</th>
                      <th className="px-3 py-2 text-left font-semibold">Unit Price</th>
                      <th className="px-3 py-2 text-left font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {(order.items || []).map((item) => (
                      <tr key={item.order_item_id}>
                        <td className="px-3 py-2">{item.part?.part_name || item.part_id}</td>
                        <td className="px-3 py-2">{item.quantity}</td>
                        <td className="px-3 py-2">{formatCurrency(item.unit_price)}</td>
                        <td className="px-3 py-2 font-medium">{formatCurrency(item.total_price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-base font-semibold">Fulfillment Timeline</h2>
              {fulfillments.length === 0 ? (
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">No fulfillment updates available yet.</p>
              ) : (
                <ul className="mt-3 space-y-2 text-sm">
                  {fulfillments.map((fulfillment) => (
                    <li key={fulfillment.fulfillment_id} className="rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700">
                      <StatusBadge status={fulfillment.status} colorMap={FULFILLMENT_COLORS} />
                      <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">{new Date(fulfillment.created_at).toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {order.payment_status !== 'completed' && (
              <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-base font-semibold">Pay Order</h2>
                <form className="mt-3 grid gap-3 sm:max-w-md" onSubmit={handlePay}>
                  <div>
                    <label htmlFor="payment_method" className="mb-1 block text-sm font-medium">Payment Method</label>
                    <select id="payment_method" value={payment.payment_method} onChange={(event) => setPayment((prev) => ({ ...prev, payment_method: event.target.value }))} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800">
                      <option value="upi">UPI</option>
                      <option value="card">Card</option>
                      <option value="netbanking">Net Banking</option>
                      <option value="cash">Cash</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="transaction_id" className="mb-1 block text-sm font-medium">Transaction ID</label>
                    <input id="transaction_id" value={payment.transaction_id} onChange={(event) => setPayment((prev) => ({ ...prev, transaction_id: event.target.value }))} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800" placeholder="Enter transaction ID" />
                  </div>
                  <button type="submit" disabled={isPaying || !payment.transaction_id.trim()} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60">
                    {isPaying ? 'Processing payment...' : 'Pay Order'}
                  </button>
                </form>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default UserOrderDetailPage
