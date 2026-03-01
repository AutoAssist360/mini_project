import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  getJobById,
  updateJobStatus,
  completeJob,
  createInvoice,
  suggestParts,
  ApiError,
} from '../lib/api'

const STATUS_COLORS = {
  assigned: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  in_progress: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  verified: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
}

const PAYMENT_COLORS = {
  pending: 'text-amber-600 dark:text-amber-300',
  completed: 'text-emerald-600 dark:text-emerald-300',
  failed: 'text-red-600 dark:text-red-300',
  refunded: 'text-slate-500',
}

const ITEM_TYPES = ['labor', 'part', 'towing', 'diagnostic', 'other']

function TechnicianJobDetailPage({ theme, onToggleTheme }) {
  const { jobId } = useParams()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionMsg, setActionMsg] = useState('')
  const [acting, setActing] = useState(false)

  // Invoice form
  const [showInvoiceForm, setShowInvoiceForm] = useState(false)
  const [invoiceItems, setInvoiceItems] = useState([
    { item_type: 'labor', description: '', quantity: 1, unit_price: '' },
  ])
  const [taxRate, setTaxRate] = useState('18')
  const [creatingInvoice, setCreatingInvoice] = useState(false)

  // Parts suggest
  const [showPartsForm, setShowPartsForm] = useState(false)
  const [partsToSuggest, setPartsToSuggest] = useState([{ part_id: '', quantity: 1 }])
  const [suggestingParts, setSuggestingParts] = useState(false)

  const loadJob = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getJobById(jobId)
      setJob(res?.job ?? null)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load job')
    } finally {
      setLoading(false)
    }
  }, [jobId])

  useEffect(() => { loadJob() }, [loadJob])

  const handleStatusUpdate = async (newStatus) => {
    setActing(true)
    setActionMsg('')
    try {
      if (newStatus === 'completed') {
        await completeJob(jobId)
        setActionMsg('Job completed!')
      } else {
        await updateJobStatus(jobId, newStatus)
        setActionMsg(`Job status updated to ${newStatus.replace(/_/g, ' ')}`)
      }
      await loadJob()
    } catch (err) {
      setActionMsg(err instanceof ApiError ? err.message : 'Failed to update status')
    } finally {
      setActing(false)
    }
  }

  const handleCreateInvoice = async () => {
    setCreatingInvoice(true)
    setActionMsg('')
    try {
      const items = invoiceItems.map((i) => ({
        item_type: i.item_type,
        description: i.description,
        quantity: Number(i.quantity),
        unit_price: Number(i.unit_price),
      }))
      await createInvoice(jobId, { items, tax_rate: Number(taxRate) })
      setActionMsg('Invoice created successfully!')
      setShowInvoiceForm(false)
      await loadJob()
    } catch (err) {
      setActionMsg(err instanceof ApiError ? err.message : 'Failed to create invoice')
    } finally {
      setCreatingInvoice(false)
    }
  }

  const handleSuggestParts = async () => {
    setSuggestingParts(true)
    setActionMsg('')
    try {
      const parts = partsToSuggest.filter((p) => p.part_id).map((p) => ({
        part_id: Number(p.part_id),
        quantity: Number(p.quantity),
      }))
      await suggestParts(jobId, parts)
      setActionMsg('Parts suggested!')
      setShowPartsForm(false)
      await loadJob()
    } catch (err) {
      setActionMsg(err instanceof ApiError ? err.message : 'Failed to suggest parts')
    } finally {
      setSuggestingParts(false)
    }
  }

  const addInvoiceRow = () => setInvoiceItems((prev) => [...prev, { item_type: 'labor', description: '', quantity: 1, unit_price: '' }])
  const removeInvoiceRow = (idx) => setInvoiceItems((prev) => prev.filter((_, i) => i !== idx))
  const updateInvoiceRow = (idx, field, value) => setInvoiceItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)))

  const addPartRow = () => setPartsToSuggest((prev) => [...prev, { part_id: '', quantity: 1 }])
  const removePartRow = (idx) => setPartsToSuggest((prev) => prev.filter((_, i) => i !== idx))
  const updatePartRow = (idx, field, value) => setPartsToSuggest((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)))

  const invoicePreviewSubtotal = invoiceItems.reduce((sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.unit_price) || 0), 0)
  const invoicePreviewTax = invoicePreviewSubtotal * (Number(taxRate) || 0) / 100
  const invoicePreviewTotal = invoicePreviewSubtotal + invoicePreviewTax

  const req = job?.request
  const offer = job?.offer
  const invoice = job?.invoice
  const vehicle = req?.vehicle

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link to="/jobs" className="text-sm text-emerald-600 hover:text-emerald-500 dark:text-emerald-300">← Jobs</Link>
              <h1 className="text-xl font-semibold">Job Details</h1>
            </div>
            <button type="button" onClick={onToggleTheme} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
        </header>

        {actionMsg && (
          <div className={`mt-4 rounded-xl border px-3 py-2 text-sm ${actionMsg.includes('success') || actionMsg.includes('completed') || actionMsg.includes('updated') || actionMsg.includes('suggested') || actionMsg.includes('created') ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-300' : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300'}`}>
            {actionMsg}
          </div>
        )}

        {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">{error}</div>}

        {loading ? (
          <div className="mt-10 text-center text-sm text-slate-500">Loading job...</div>
        ) : !job ? (
          <div className="mt-10 text-center text-sm text-slate-500">Job not found.</div>
        ) : (
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            {/* Job info */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">Job Info</h2>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[job.status] || ''}`}>
                  {job.status?.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="mt-3 space-y-1.5 text-sm">
                <div><span className="text-slate-500 dark:text-slate-400">Issue:</span> {req?.issue_type?.replace(/_/g, ' ')}</div>
                <div><span className="text-slate-500 dark:text-slate-400">Description:</span> {req?.issue_description}</div>
                <div><span className="text-slate-500 dark:text-slate-400">Location:</span> {req?.service_location_type}</div>
                {req?.breakdown_latitude && <div><span className="text-slate-500 dark:text-slate-400">GPS:</span> {req.breakdown_latitude.toFixed(4)}, {req.breakdown_longitude?.toFixed(4)}</div>}
                <div><span className="text-slate-500 dark:text-slate-400">Repair Mode:</span> {offer?.repair_mode === 'onsite' ? 'Onsite' : 'Tow to Garage'}</div>
                <div><span className="text-slate-500 dark:text-slate-400">Est. Cost:</span> ₹{Number(offer?.estimated_cost ?? 0).toLocaleString()}</div>
                <div><span className="text-slate-500 dark:text-slate-400">Est. Time:</span> {offer?.estimated_time} min</div>
                {job.started_at && <div><span className="text-slate-500 dark:text-slate-400">Started:</span> {new Date(job.started_at).toLocaleString()}</div>}
                {job.completed_at && <div><span className="text-slate-500 dark:text-slate-400">Completed:</span> {new Date(job.completed_at).toLocaleString()}</div>}
              </div>

              {/* Chat link */}
              {req?.request_id && (
                <Link to={`/messages/${req.request_id}`} className="mt-3 inline-block text-sm text-emerald-600 hover:text-emerald-500 dark:text-emerald-300">
                  Chat with customer →
                </Link>
              )}
            </section>

            {/* Vehicle */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-base font-semibold">Vehicle</h2>
              {vehicle ? (
                <div className="mt-3 space-y-1.5 text-sm">
                  <div><span className="text-slate-500 dark:text-slate-400">Company:</span> {vehicle.variant?.model?.company?.company_name || 'N/A'}</div>
                  <div><span className="text-slate-500 dark:text-slate-400">Model:</span> {vehicle.variant?.model?.model_name || 'N/A'}</div>
                  <div><span className="text-slate-500 dark:text-slate-400">Variant:</span> {vehicle.variant?.variant_name || 'N/A'} ({vehicle.variant?.year})</div>
                  <div><span className="text-slate-500 dark:text-slate-400">Registration:</span> {vehicle.registration_number}</div>
                  <div><span className="text-slate-500 dark:text-slate-400">Fuel:</span> {vehicle.variant?.fuel_type}</div>
                  <div><span className="text-slate-500 dark:text-slate-400">Transmission:</span> {vehicle.variant?.transmission}</div>
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">Vehicle info not available</p>
              )}

              {/* Requested parts */}
              {req?.parts?.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium">Requested Parts</h3>
                  <div className="mt-2 space-y-1">
                    {req.parts.map((p) => (
                      <div key={p.request_part_id} className="text-xs text-slate-600 dark:text-slate-300">
                        {p.part?.part_name} × {p.quantity}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Actions */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-base font-semibold">Actions</h2>
              <div className="mt-3 flex flex-wrap gap-3">
                {job.status === 'assigned' && (
                  <button type="button" onClick={() => handleStatusUpdate('in_progress')} disabled={acting} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60">
                    {acting ? 'Updating...' : 'Start Job'}
                  </button>
                )}
                {job.status === 'in_progress' && (
                  <>
                    <button type="button" onClick={() => handleStatusUpdate('completed')} disabled={acting} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60">
                      {acting ? 'Updating...' : 'Complete Job'}
                    </button>
                    <button type="button" onClick={() => setShowPartsForm(!showPartsForm)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">
                      {showPartsForm ? 'Cancel Parts' : 'Suggest Parts'}
                    </button>
                  </>
                )}
                {job.status === 'completed' && !invoice && (
                  <button type="button" onClick={() => setShowInvoiceForm(!showInvoiceForm)} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500">
                    {showInvoiceForm ? 'Cancel' : 'Create Invoice'}
                  </button>
                )}
              </div>

              {/* Parts suggest form */}
              {showPartsForm && (
                <div className="mt-4 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                  <h3 className="text-sm font-medium">Suggest Parts</h3>
                  <div className="mt-2 space-y-2">
                    {partsToSuggest.map((p, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input type="number" placeholder="Part ID" value={p.part_id} onChange={(e) => updatePartRow(idx, 'part_id', e.target.value)} className="w-28 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-800" />
                        <input type="number" placeholder="Qty" value={p.quantity} onChange={(e) => updatePartRow(idx, 'quantity', e.target.value)} className="w-20 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-800" />
                        {partsToSuggest.length > 1 && (
                          <button type="button" onClick={() => removePartRow(idx)} className="text-xs text-red-600">Remove</button>
                        )}
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <button type="button" onClick={addPartRow} className="text-xs text-emerald-600">+ Add Part</button>
                      <button type="button" onClick={handleSuggestParts} disabled={suggestingParts} className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-60">
                        {suggestingParts ? 'Submitting...' : 'Submit'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Invoice create form */}
              {showInvoiceForm && (
                <div className="mt-4 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                  <h3 className="text-sm font-medium">Create Invoice</h3>
                  <div className="mt-2 space-y-3">
                    {invoiceItems.map((item, idx) => (
                      <div key={idx} className="flex flex-wrap gap-2">
                        <select value={item.item_type} onChange={(e) => updateInvoiceRow(idx, 'item_type', e.target.value)} className="rounded-xl border border-slate-300 px-2 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-800">
                          {ITEM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <input placeholder="Description" value={item.description} onChange={(e) => updateInvoiceRow(idx, 'description', e.target.value)} className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-800" />
                        <input type="number" placeholder="Qty" value={item.quantity} onChange={(e) => updateInvoiceRow(idx, 'quantity', e.target.value)} className="w-16 rounded-xl border border-slate-300 px-2 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-800" />
                        <input type="number" placeholder="Price" value={item.unit_price} onChange={(e) => updateInvoiceRow(idx, 'unit_price', e.target.value)} className="w-24 rounded-xl border border-slate-300 px-2 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-800" />
                        {invoiceItems.length > 1 && (
                          <button type="button" onClick={() => removeInvoiceRow(idx)} className="text-xs text-red-600">×</button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={addInvoiceRow} className="text-xs text-emerald-600">+ Add Item</button>

                    <div className="flex items-center gap-3">
                      <label className="text-xs font-medium">Tax Rate (%)</label>
                      <input type="number" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} className="w-20 rounded-xl border border-slate-300 px-2 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-800" />
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800">
                      <div className="flex justify-between"><span>Subtotal</span><span>₹{invoicePreviewSubtotal.toFixed(2)}</span></div>
                      <div className="flex justify-between"><span>Tax ({taxRate}%)</span><span>₹{invoicePreviewTax.toFixed(2)}</span></div>
                      <div className="mt-1 flex justify-between border-t border-slate-200 pt-1 font-semibold dark:border-slate-700"><span>Total</span><span>₹{invoicePreviewTotal.toFixed(2)}</span></div>
                    </div>

                    <button type="button" onClick={handleCreateInvoice} disabled={creatingInvoice || invoiceItems.some((i) => !i.description || !i.unit_price)} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60">
                      {creatingInvoice ? 'Creating...' : 'Create Invoice'}
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* Existing invoice */}
            {invoice && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold">Invoice</h2>
                  <span className={`text-sm font-medium ${PAYMENT_COLORS[invoice.payment_status] || ''}`}>
                    {invoice.payment_status}
                  </span>
                </div>

                {invoice.items?.length > 0 && (
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase text-slate-500 dark:border-slate-700">
                          <th className="pb-2 pr-4">Type</th>
                          <th className="pb-2 pr-4">Description</th>
                          <th className="pb-2 pr-4 text-right">Qty</th>
                          <th className="pb-2 pr-4 text-right">Price</th>
                          <th className="pb-2 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoice.items.map((item) => (
                          <tr key={item.item_id} className="border-b border-slate-100 dark:border-slate-800">
                            <td className="py-2 pr-4">{item.item_type}</td>
                            <td className="py-2 pr-4">{item.description}</td>
                            <td className="py-2 pr-4 text-right">{item.quantity}</td>
                            <td className="py-2 pr-4 text-right">₹{Number(item.unit_price).toFixed(2)}</td>
                            <td className="py-2 text-right">₹{Number(item.total_price).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="mt-3 space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Subtotal</span><span>₹{Number(invoice.subtotal).toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Tax</span><span>₹{Number(invoice.tax).toFixed(2)}</span></div>
                  <div className="flex justify-between border-t border-slate-200 pt-1 font-semibold dark:border-slate-700"><span>Total</span><span>₹{Number(invoice.total).toFixed(2)}</span></div>
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default TechnicianJobDetailPage
