import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getInvoiceById, markInvoicePaid } from '../lib/api'

const card = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900'
const btn  = 'rounded-lg px-3 py-1.5 text-xs font-semibold'
const badge = (c) => `inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${c}`

function AdminInvoiceDetailPage() {
  const { invoiceId } = useParams()
  const [inv, setInv]         = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy]       = useState(false)

  const load = useCallback(() => {
    getInvoiceById(invoiceId).then((r) => setInv(r.invoice || r)).catch(() => null).finally(() => setLoading(false))
  }, [invoiceId])
  useEffect(() => { load() }, [load])

  const handleMarkPaid = async () => { setBusy(true); try { await markInvoicePaid(invoiceId); load() } catch { /* */ } setBusy(false) }

  const payColor = (s) => {
    const m = { pending: 'bg-amber-100 text-amber-800', completed: 'bg-green-100 text-green-800', failed: 'bg-red-100 text-red-800', refunded: 'bg-purple-100 text-purple-800' }
    return m[s] || 'bg-slate-100 text-slate-700'
  }

  if (loading) return <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center"><p className="text-slate-500">Loading…</p></div>
  if (!inv) return <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center"><p className="text-slate-500">Invoice not found</p></div>

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <Link to="/admin/invoices" className="text-sm text-emerald-600 hover:underline dark:text-emerald-400">← Back to Invoices</Link>

        {/* header */}
        <div className={card + ' mt-4'}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-lg font-bold">Invoice {inv.invoice_id.slice(0, 8)}…</h1>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className={badge(payColor(inv.payment_status))}>{inv.payment_status}</span>
                {inv.payment_method && <span className={badge('bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300')}>{inv.payment_method}</span>}
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">₹{inv.total}</p>
              <p className="text-xs text-slate-500">Subtotal ₹{inv.subtotal} + Tax ₹{inv.tax}</p>
              {inv.payment_status !== 'completed' && inv.payment_status !== 'refunded' && (
                <button disabled={busy} onClick={handleMarkPaid} className={btn + ' mt-2 bg-emerald-600 text-white hover:bg-emerald-500'}>Mark as Paid</button>
              )}
            </div>
          </div>
        </div>

        {/* job info */}
        {inv.job && (
          <div className={card + ' mt-4'}>
            <h3 className="text-sm font-semibold">Related Job</h3>
            <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
              <p><strong>Job:</strong> <Link to={`/admin/jobs/${inv.job.job_id}`} className="text-emerald-600 hover:underline dark:text-emerald-400">{inv.job.job_id.slice(0, 8)}…</Link> ({inv.job.status})</p>
              <p><strong>User:</strong> {inv.job.request?.user?.full_name || '--'}</p>
              <p><strong>Technician:</strong> {inv.job.technician?.user?.full_name || '--'}</p>
              <p><strong>Issue:</strong> {inv.job.request?.issue_type?.replace(/_/g, ' ')}</p>
            </div>
          </div>
        )}

        {/* items */}
        {inv.items?.length > 0 && (
          <section className={card + ' mt-4'}>
            <h2 className="text-sm font-semibold">Line Items</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead><tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="pb-2 pr-3">Type</th><th className="pb-2 pr-3">Description</th><th className="pb-2 pr-3">Qty</th><th className="pb-2 pr-3">Unit ₹</th><th className="pb-2">Total ₹</th>
                </tr></thead>
                <tbody>
                  {inv.items.map((i) => (
                    <tr key={i.item_id} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="py-2 pr-3 capitalize">{i.item_type}</td>
                      <td className="py-2 pr-3">{i.description}</td>
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

        {/* dates */}
        <div className={card + ' mt-4'}>
          <h3 className="text-sm font-semibold">Dates</h3>
          <div className="mt-2 space-y-1 text-sm">
            <p><strong>Issued:</strong> {new Date(inv.issued_at).toLocaleString()}</p>
            <p><strong>Paid:</strong> {inv.paid_at ? new Date(inv.paid_at).toLocaleString() : 'Not paid'}</p>
            {inv.transaction_id && <p><strong>Transaction:</strong> {inv.transaction_id}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminInvoiceDetailPage
