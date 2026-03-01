import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getOrderById, refundOrder } from '../lib/api'

const card = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900'
const btn  = 'rounded-lg px-3 py-1.5 text-xs font-semibold'
const badge = (c) => `inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${c}`

function AdminOrderDetailPage() {
  const { orderId } = useParams()
  const [order, setOrder]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy]       = useState(false)
  const [err, setErr]         = useState('')
  const [refundReason, setRefundReason] = useState('')

  const load = useCallback(() => {
    getOrderById(orderId).then((r) => setOrder(r.order || r)).catch(() => null).finally(() => setLoading(false))
  }, [orderId])
  useEffect(() => { load() }, [load])

  const handleRefund = async () => {
    if (!refundReason.trim()) return setErr('Refund reason is required')
    setBusy(true); setErr('')
    try { await refundOrder(orderId, refundReason); setRefundReason(''); load() } catch (e) { setErr(e.message) }
    setBusy(false)
  }

  if (loading) return <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center"><p className="text-slate-500">Loading…</p></div>
  if (!order) return <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center"><p className="text-slate-500">Order not found</p></div>

  const canRefund = order.payment_status === 'completed' && order.order_status !== 'cancelled'

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <Link to="/admin/orders" className="text-sm text-emerald-600 hover:underline dark:text-emerald-400">← Back to Orders</Link>

        {err && <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">{err}</div>}

        {/* header */}
        <div className={card + ' mt-4'}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-lg font-bold">Order #{order.order_number || order.order_id.slice(0, 8)}</h1>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className={badge('bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200')}>{order.order_status}</span>
                <span className={badge('bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300')}>Pay: {order.payment_status}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">₹{order.total}</p>
              <p className="text-xs text-slate-500">Subtotal ₹{order.subtotal} + Tax ₹{order.tax}</p>
            </div>
          </div>
        </div>

        {/* refund */}
        {canRefund && (
          <div className={card + ' mt-4'}>
            <h3 className="text-sm font-semibold">Refund Order</h3>
            <div className="mt-2 flex gap-2">
              <input value={refundReason} onChange={(e) => setRefundReason(e.target.value)} placeholder="Reason for refund…" className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800" />
              <button disabled={busy} onClick={handleRefund} className={btn + ' bg-red-600 text-white hover:bg-red-500'}>Refund</button>
            </div>
          </div>
        )}

        {/* user & warehouse */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className={card}>
            <h3 className="text-sm font-semibold">Buyer</h3>
            <p className="mt-1 text-sm">{order.user?.full_name || '--'}</p>
            <p className="text-xs text-slate-500">{order.user?.email}</p>
          </div>
          <div className={card}>
            <h3 className="text-sm font-semibold">Warehouse</h3>
            <p className="mt-1 text-sm">{order.warehouse?.name || '--'} ({order.warehouse?.city || ''})</p>
            <p className="text-xs text-slate-500">Vendor: {order.warehouse?.vendor?.full_name || '--'}</p>
            <Link to={`/admin/warehouses/${order.warehouse_id}`} className="mt-1 inline-block text-xs text-emerald-600 hover:underline dark:text-emerald-400">View warehouse →</Link>
          </div>
        </div>

        {/* items */}
        {order.items?.length > 0 && (
          <section className={card + ' mt-4'}>
            <h2 className="text-sm font-semibold">Items ({order.items.length})</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead><tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="pb-2 pr-3">Part</th><th className="pb-2 pr-3">Qty</th><th className="pb-2 pr-3">Unit ₹</th><th className="pb-2">Total ₹</th>
                </tr></thead>
                <tbody>
                  {order.items.map((i) => (
                    <tr key={i.order_item_id} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="py-2 pr-3">{i.part?.part_name || `Part #${i.part_id}`}</td>
                      <td className="py-2 pr-3">{i.quantity}</td>
                      <td className="py-2 pr-3">{i.unit_price}</td>
                      <td className="py-2">{i.total_price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* fulfillments */}
        {order.fulfillments?.length > 0 && (
          <section className={card + ' mt-4'}>
            <h2 className="text-sm font-semibold">Fulfillments</h2>
            <div className="mt-3 space-y-3">
              {order.fulfillments.map((f) => (
                <div key={f.fulfillment_id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                  <div className="flex flex-wrap gap-3 text-sm">
                    <span className={badge('bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300')}>{f.status}</span>
                    {f.tracking_number && <span>Tracking: {f.tracking_number}</span>}
                    {f.carrier && <span>Carrier: {f.carrier}</span>}
                    {f.estimated_delivery && <span>Est: {new Date(f.estimated_delivery).toLocaleDateString()}</span>}
                  </div>
                  {f.notes && <p className="mt-1 text-xs text-slate-500">{f.notes}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* reservations */}
        {order.reservations?.length > 0 && (
          <section className={card + ' mt-4'}>
            <h2 className="text-sm font-semibold">Inventory Reservations</h2>
            <div className="mt-2 space-y-1 text-sm">
              {order.reservations.map((r) => (
                <p key={r.reservation_id}>{r.quantity} units · <span className={badge('bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300')}>{r.status}</span> · expires {new Date(r.expires_at).toLocaleString()}</p>
              ))}
            </div>
          </section>
        )}

        <p className="mt-4 text-xs text-slate-400">Created: {new Date(order.created_at).toLocaleString()}</p>
      </div>
    </div>
  )
}

export default AdminOrderDetailPage
