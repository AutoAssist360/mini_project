import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getInvoices, markInvoicePaid } from '../lib/api'

const card = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900'
const btn  = 'rounded-lg px-3 py-1.5 text-xs font-semibold'
const badge = (c) => `inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${c}`

const PAY_STATUS = ['', 'pending', 'completed', 'failed', 'refunded']

function AdminInvoicesPage() {
  const [invoices, setInvoices]   = useState([])
  const [pagination, setPagination] = useState({})
  const [page, setPage]           = useState(1)
  const [payStatus, setPayStatus] = useState('')
  const [loading, setLoading]     = useState(true)
  const [busy, setBusy]           = useState(null)

  const load = useCallback(() => {
    getInvoices({ page, limit: 15, payment_status: payStatus || undefined })
      .then((r) => { setInvoices(r.invoices || []); setPagination(r.pagination || {}) })
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [page, payStatus])

  useEffect(() => { load() }, [load])

  const handleMarkPaid = async (id) => { setBusy(id); try { await markInvoicePaid(id); load() } catch { /* */ } setBusy(null) }

  const payColor = (s) => {
    const m = { pending: 'bg-amber-100 text-amber-800', completed: 'bg-green-100 text-green-800', failed: 'bg-red-100 text-red-800', refunded: 'bg-purple-100 text-purple-800' }
    return m[s] || 'bg-slate-100 text-slate-700'
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Invoices</h1>
          <Link to="/admin/dashboard" className="text-sm text-emerald-600 hover:underline dark:text-emerald-400">← Dashboard</Link>
        </div>

        <div className={'mt-4 flex flex-wrap gap-3 ' + card}>
          <select value={payStatus} onChange={(e) => { setPayStatus(e.target.value); setPage(1) }} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800">
            {PAY_STATUS.map((s) => <option key={s} value={s}>{s || 'All payment statuses'}</option>)}
          </select>
        </div>

        {loading && <p className="mt-6 text-center text-sm text-slate-500">Loading…</p>}

        {!loading && (
          <>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead><tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="pb-2 pr-3">Invoice</th><th className="pb-2 pr-3">Issue Type</th><th className="pb-2 pr-3">Technician</th><th className="pb-2 pr-3">Total</th><th className="pb-2 pr-3">Payment</th><th className="pb-2 pr-3">Issued</th><th className="pb-2">Actions</th>
                </tr></thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.invoice_id} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="py-2 pr-3"><Link to={`/admin/invoices/${inv.invoice_id}`} className="text-emerald-600 hover:underline dark:text-emerald-400">{inv.invoice_id.slice(0, 8)}…</Link></td>
                      <td className="py-2 pr-3 capitalize">{inv.job?.request?.issue_type?.replace(/_/g, ' ') || '--'}</td>
                      <td className="py-2 pr-3">{inv.job?.technician?.user?.full_name || '--'}</td>
                      <td className="py-2 pr-3">₹{inv.total}</td>
                      <td className="py-2 pr-3"><span className={badge(payColor(inv.payment_status))}>{inv.payment_status}</span></td>
                      <td className="py-2 pr-3">{new Date(inv.issued_at).toLocaleDateString()}</td>
                      <td className="py-2">
                        {inv.payment_status !== 'completed' && inv.payment_status !== 'refunded' && (
                          <button disabled={busy === inv.invoice_id} onClick={() => handleMarkPaid(inv.invoice_id)} className={btn + ' bg-emerald-600 text-white hover:bg-emerald-500'}>Mark Paid</button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {invoices.length === 0 && <tr><td colSpan={7} className="py-6 text-center text-slate-500">No invoices found</td></tr>}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm">
              <span>Page {pagination.page || 1} of {pagination.totalPages || 1}</span>
              <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className={btn + ' border border-slate-300 dark:border-slate-700'}>Prev</button>
                <button disabled={page >= (pagination.totalPages || 1)} onClick={() => setPage((p) => p + 1)} className={btn + ' border border-slate-300 dark:border-slate-700'}>Next</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default AdminInvoicesPage
