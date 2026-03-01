import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  getOrderById,
  confirmOrder,
  cancelOrder,
  returnOrder,
  getOrderFulfillments,
  updateFulfillmentStatus,
  ApiError,
} from '../lib/api'

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  processing: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  shipped: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  in_transit: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  delivered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  returned: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
}

const FULFILLMENT_TRANSITIONS = {
  pending: ['processing', 'failed'],
  processing: ['shipped', 'failed'],
  shipped: ['in_transit', 'delivered', 'failed'],
  in_transit: ['delivered', 'failed'],
}

function VendorOrderDetailPage({ theme, onToggleTheme }) {
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [fulfillments, setFulfillments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionMsg, setActionMsg] = useState('')
  const [acting, setActing] = useState(false)

  // Fulfillment update form
  const [editFulfillmentId, setEditFulfillmentId] = useState(null)
  const [fulfillForm, setFulfillForm] = useState({ status: '', tracking_number: '', carrier: '', estimated_delivery: '', notes: '' })

  // Return form
  const [showReturnForm, setShowReturnForm] = useState(false)
  const [returnReason, setReturnReason] = useState('')

  const loadOrder = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [orderRes, fulfillRes] = await Promise.allSettled([
        getOrderById(orderId),
        getOrderFulfillments(orderId),
      ])
      if (orderRes.status === 'fulfilled') setOrder(orderRes.value?.order ?? null)
      if (fulfillRes.status === 'fulfilled') setFulfillments(fulfillRes.value?.fulfillments ?? [])
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load order')
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => { loadOrder() }, [loadOrder])

  const handleConfirm = async () => {
    setActing(true); setActionMsg('')
    try {
      await confirmOrder(orderId)
      setActionMsg('Order confirmed!')
      await loadOrder()
    } catch (err) { setActionMsg(err instanceof ApiError ? err.message : 'Failed') }
    finally { setActing(false) }
  }

  const handleCancel = async () => {
    setActing(true); setActionMsg('')
    try {
      await cancelOrder(orderId)
      setActionMsg('Order cancelled, reservations released')
      await loadOrder()
    } catch (err) { setActionMsg(err instanceof ApiError ? err.message : 'Failed') }
    finally { setActing(false) }
  }

  const handleReturn = async () => {
    if (!returnReason.trim()) return
    setActing(true); setActionMsg('')
    try {
      const res = await returnOrder(orderId, returnReason.trim())
      setActionMsg(res?.message || 'Return processed')
      setShowReturnForm(false)
      setReturnReason('')
      await loadOrder()
    } catch (err) { setActionMsg(err instanceof ApiError ? err.message : 'Failed') }
    finally { setActing(false) }
  }

  const openFulfillmentEdit = (f) => {
    setEditFulfillmentId(f.fulfillment_id)
    setFulfillForm({ status: '', tracking_number: f.tracking_number || '', carrier: f.carrier || '', estimated_delivery: '', notes: '' })
  }

  const handleFulfillmentUpdate = async () => {
    if (!fulfillForm.status) return
    setActing(true); setActionMsg('')
    try {
      const payload = { status: fulfillForm.status }
      if (fulfillForm.tracking_number) payload.tracking_number = fulfillForm.tracking_number
      if (fulfillForm.carrier) payload.carrier = fulfillForm.carrier
      if (fulfillForm.estimated_delivery) payload.estimated_delivery = new Date(fulfillForm.estimated_delivery).toISOString()
      if (fulfillForm.notes) payload.notes = fulfillForm.notes
      await updateFulfillmentStatus(editFulfillmentId, payload)
      setActionMsg('Fulfillment updated!')
      setEditFulfillmentId(null)
      await loadOrder()
    } catch (err) { setActionMsg(err instanceof ApiError ? err.message : 'Failed') }
    finally { setActing(false) }
  }

  const canConfirm = order?.order_status === 'pending'
  const canCancel = ['pending', 'confirmed', 'processing'].includes(order?.order_status)
  const canReturn = order?.order_status === 'delivered'

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link to="/orders" className="text-sm text-emerald-600 hover:text-emerald-500 dark:text-emerald-300">← Orders</Link>
              <h1 className="text-xl font-semibold">Order Details</h1>
            </div>
            <button type="button" onClick={onToggleTheme} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</button>
          </div>
        </header>

        {actionMsg && (
          <div className={`mt-4 rounded-xl border px-3 py-2 text-sm ${actionMsg.includes('!') || actionMsg.includes('processed') || actionMsg.includes('released') ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-300' : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300'}`}>
            {actionMsg}
          </div>
        )}
        {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">{error}</div>}

        {loading ? (
          <div className="mt-10 text-center text-sm text-slate-500">Loading...</div>
        ) : !order ? (
          <div className="mt-10 text-center text-sm text-slate-500">Order not found.</div>
        ) : (
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            {/* Order info */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">{order.order_number}</h2>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[order.order_status] || ''}`}>
                  {order.order_status?.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="mt-3 space-y-1.5 text-sm">
                <div><span className="text-slate-500 dark:text-slate-400">Customer:</span> {order.user?.full_name || order.user?.email}</div>
                <div><span className="text-slate-500 dark:text-slate-400">Warehouse:</span> {order.warehouse?.name} ({order.warehouse?.city})</div>
                <div><span className="text-slate-500 dark:text-slate-400">Payment:</span> <span className={order.payment_status === 'completed' ? 'text-emerald-600 dark:text-emerald-300' : 'text-amber-600 dark:text-amber-300'}>{order.payment_status}</span></div>
                <div><span className="text-slate-500 dark:text-slate-400">Subtotal:</span> ₹{Number(order.subtotal).toFixed(2)}</div>
                <div><span className="text-slate-500 dark:text-slate-400">Tax:</span> ₹{Number(order.tax).toFixed(2)}</div>
                <div className="font-bold"><span className="text-slate-500 dark:text-slate-400">Total:</span> ₹{Number(order.total).toFixed(2)}</div>
                <div><span className="text-slate-500 dark:text-slate-400">Created:</span> {new Date(order.created_at).toLocaleString()}</div>
                {order.notes && <div><span className="text-slate-500 dark:text-slate-400">Notes:</span> {order.notes}</div>}
              </div>
            </section>

            {/* Actions */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-base font-semibold">Actions</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {canConfirm && (
                  <button type="button" onClick={handleConfirm} disabled={acting} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60">
                    {acting ? 'Processing...' : 'Confirm Order'}
                  </button>
                )}
                {canCancel && (
                  <button type="button" onClick={handleCancel} disabled={acting} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60">
                    {acting ? 'Processing...' : 'Cancel Order'}
                  </button>
                )}
                {canReturn && (
                  <button type="button" onClick={() => setShowReturnForm(!showReturnForm)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">
                    {showReturnForm ? 'Cancel' : 'Process Return'}
                  </button>
                )}
              </div>

              {showReturnForm && (
                <div className="mt-3 space-y-2">
                  <textarea value={returnReason} onChange={(e) => setReturnReason(e.target.value)} placeholder="Return reason..." rows={2} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800" />
                  <button type="button" onClick={handleReturn} disabled={acting || !returnReason.trim()} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60">
                    {acting ? 'Processing...' : 'Submit Return'}
                  </button>
                </div>
              )}
            </section>

            {/* Items */}
            {order.items?.length > 0 && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2 dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-base font-semibold">Items ({order.items.length})</h2>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase text-slate-500 dark:border-slate-700">
                        <th className="pb-2 pr-4">Part</th>
                        <th className="pb-2 pr-4 text-right">Qty</th>
                        <th className="pb-2 pr-4 text-right">Unit Price</th>
                        <th className="pb-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item) => (
                        <tr key={item.order_item_id} className="border-b border-slate-100 dark:border-slate-800">
                          <td className="py-2 pr-4 font-medium">{item.part?.part_name || `Part #${item.part_id}`}</td>
                          <td className="py-2 pr-4 text-right">{item.quantity}</td>
                          <td className="py-2 pr-4 text-right">₹{Number(item.unit_price).toFixed(2)}</td>
                          <td className="py-2 text-right">₹{Number(item.total_price).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Fulfillments */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-base font-semibold">Fulfillments ({fulfillments.length})</h2>
              {fulfillments.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">No fulfillment records yet.</p>
              ) : (
                <div className="mt-3 space-y-3">
                  {fulfillments.map((f) => (
                    <div key={f.fulfillment_id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[f.status] || ''}`}>{f.status?.replace(/_/g, ' ')}</span>
                          {f.tracking_number && <span className="text-xs text-slate-500">Track: {f.tracking_number}</span>}
                          {f.carrier && <span className="text-xs text-slate-500">via {f.carrier}</span>}
                        </div>
                        {FULFILLMENT_TRANSITIONS[f.status] && (
                          <button type="button" onClick={() => openFulfillmentEdit(f)} className="rounded-lg border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">Update</button>
                        )}
                      </div>
                      {f.shipped_at && <p className="mt-1 text-xs text-slate-400">Shipped: {new Date(f.shipped_at).toLocaleString()}</p>}
                      {f.delivered_at && <p className="text-xs text-slate-400">Delivered: {new Date(f.delivered_at).toLocaleString()}</p>}
                      {f.notes && <p className="mt-1 text-xs text-slate-500">{f.notes}</p>}

                      {editFulfillmentId === f.fulfillment_id && (
                        <div className="mt-3 space-y-2 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                          <div className="grid gap-2 sm:grid-cols-2">
                            <div>
                              <label className="mb-1 block text-xs font-medium">New Status</label>
                              <select value={fulfillForm.status} onChange={(e) => setFulfillForm((p) => ({ ...p, status: e.target.value }))} className="w-full rounded-xl border border-slate-300 px-2 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-800">
                                <option value="">Select...</option>
                                {(FULFILLMENT_TRANSITIONS[f.status] || []).map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-medium">Tracking #</label>
                              <input value={fulfillForm.tracking_number} onChange={(e) => setFulfillForm((p) => ({ ...p, tracking_number: e.target.value }))} className="w-full rounded-xl border border-slate-300 px-2 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-800" />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-medium">Carrier</label>
                              <input value={fulfillForm.carrier} onChange={(e) => setFulfillForm((p) => ({ ...p, carrier: e.target.value }))} className="w-full rounded-xl border border-slate-300 px-2 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-800" />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-medium">Est. Delivery</label>
                              <input type="datetime-local" value={fulfillForm.estimated_delivery} onChange={(e) => setFulfillForm((p) => ({ ...p, estimated_delivery: e.target.value }))} className="w-full rounded-xl border border-slate-300 px-2 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-800" />
                            </div>
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium">Notes</label>
                            <input value={fulfillForm.notes} onChange={(e) => setFulfillForm((p) => ({ ...p, notes: e.target.value }))} className="w-full rounded-xl border border-slate-300 px-2 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-800" />
                          </div>
                          <div className="flex gap-2">
                            <button type="button" onClick={handleFulfillmentUpdate} disabled={acting || !fulfillForm.status} className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-60">
                              {acting ? 'Saving...' : 'Save'}
                            </button>
                            <button type="button" onClick={() => setEditFulfillmentId(null)} className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs dark:border-slate-700">Cancel</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Reservations */}
            {order.reservations?.length > 0 && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2 dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-base font-semibold">Reservations ({order.reservations.length})</h2>
                <div className="mt-3 space-y-2">
                  {order.reservations.map((r) => (
                    <div key={r.reservation_id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 p-2 text-sm dark:border-slate-700">
                      <span>{r.inventory?.part?.part_name || 'Part'} × {r.quantity}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[r.status] || ''}`}>{r.status}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default VendorOrderDetailPage
