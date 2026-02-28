import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { ApiError, getInvoiceById, payInvoice, userLogout } from '../lib/api'
import { clearAuth } from '../store/authSlice'

const PAYMENT_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  refunded: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
}

function formatCurrency(value) {
  if (value == null) return 'N/A'
  return `₹${Number(value).toLocaleString('en-IN')}`
}

function UserInvoiceDetailPage({ theme, onToggleTheme }) {
  const { invoiceId } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const [invoice, setInvoice] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [payment, setPayment] = useState({ payment_method: 'upi', transaction_id: '' })
  const [isPaying, setIsPaying] = useState(false)
  const [message, setMessage] = useState('')
  const [manualId, setManualId] = useState('')

  const loadInvoice = async (targetInvoiceId = invoiceId) => {
    if (!targetInvoiceId?.trim()) return

    setIsLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await getInvoiceById(targetInvoiceId.trim())
      setInvoice(response?.invoice || null)
    } catch (err) {
      setInvoice(null)
      if (err instanceof ApiError) setError(err.message)
      else setError('Unable to load invoice details.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (invoiceId) {
      loadInvoice(invoiceId)
    }
  }, [invoiceId])

  const handlePay = async (event) => {
    event.preventDefault()
    const activeInvoiceId = invoice?.invoice_id || invoiceId
    if (!activeInvoiceId || !payment.transaction_id.trim()) return

    setIsPaying(true)
    setError('')
    setMessage('')

    try {
      await payInvoice(activeInvoiceId, {
        payment_method: payment.payment_method,
        transaction_id: payment.transaction_id.trim(),
      })

      setMessage('Invoice payment successful.')
      setPayment((prev) => ({ ...prev, transaction_id: '' }))
      await loadInvoice(activeInvoiceId)
    } catch (err) {
      if (err instanceof ApiError) setError(err.message)
      else setError('Unable to complete invoice payment.')
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
            <h1 className="text-xl font-semibold">Invoice Details</h1>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={onToggleTheme} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</button>
              <Link to="/dashboard" className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">Dashboard</Link>
              <button type="button" onClick={handleLogout} className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500">Logout</button>
            </div>
          </div>
        </header>

        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Enter an invoice ID to look up details, or arrive here from a job page link.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <input
              value={manualId}
              onChange={(event) => setManualId(event.target.value)}
              onKeyDown={(event) => { if (event.key === 'Enter' && manualId.trim()) navigate(`/invoices/${manualId.trim()}`) }}
              className="w-full max-w-xl rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800"
              placeholder="Enter invoice UUID"
            />
            <button type="button" onClick={() => { if (manualId.trim()) navigate(`/invoices/${manualId.trim()}`) }} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500" disabled={isLoading || !manualId.trim()}>
              {isLoading ? 'Loading...' : 'Load Invoice'}
            </button>
          </div>

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

          {invoice && (
            <>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Invoice ID</p>
                  <p className="mt-1 text-sm font-medium">{invoice.invoice_id}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Payment Status</p>
                  <p className="mt-1"><span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${PAYMENT_COLORS[invoice.payment_status] || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>{invoice.payment_status?.replace(/_/g, ' ')}</span></p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Total</p>
                  <p className="mt-1 text-sm font-semibold text-emerald-700 dark:text-emerald-400">{formatCurrency(invoice.total)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Technician</p>
                  <p className="mt-1 text-sm font-medium">{invoice.job?.technician?.user?.full_name || 'N/A'}</p>
                </div>
              </div>

              <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                  <thead className="bg-slate-50 dark:bg-slate-900/70">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold">Type</th>
                      <th className="px-3 py-2 text-left font-semibold">Description</th>
                      <th className="px-3 py-2 text-left font-semibold">Qty</th>
                      <th className="px-3 py-2 text-left font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {(invoice.items || []).map((item) => (
                      <tr key={item.invoice_item_id}>
                        <td className="px-3 py-2">{item.item_type || 'N/A'}</td>
                        <td className="px-3 py-2">{item.description || 'N/A'}</td>
                        <td className="px-3 py-2">{item.quantity ?? 'N/A'}</td>
                        <td className="px-3 py-2 font-medium">{formatCurrency(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {invoice.payment_status !== 'completed' && (
                <form className="mt-4 grid gap-3 sm:max-w-md" onSubmit={handlePay}>
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
                    {isPaying ? 'Processing payment...' : 'Pay Invoice'}
                  </button>
                </form>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  )
}

export default UserInvoiceDetailPage
