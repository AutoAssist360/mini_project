import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getJobById } from '../lib/api'

const card = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900'
const badge = (c) => `inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${c}`

function AdminJobDetailPage() {
  const { jobId } = useParams()
  const [job, setJob]         = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getJobById(jobId).then((r) => setJob(r.job || r)).catch(() => null).finally(() => setLoading(false))
  }, [jobId])

  if (loading) return <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center"><p className="text-slate-500">Loading…</p></div>
  if (!job) return <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center"><p className="text-slate-500">Job not found</p></div>

  const statusColor = (s) => {
    const m = { assigned: 'bg-amber-100 text-amber-800', in_progress: 'bg-indigo-100 text-indigo-800', completed: 'bg-green-100 text-green-800', verified: 'bg-emerald-100 text-emerald-800' }
    return m[s] || 'bg-slate-100 text-slate-700'
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <Link to="/admin/jobs" className="text-sm text-emerald-600 hover:underline dark:text-emerald-400">← Back to Jobs</Link>

        {/* header */}
        <div className={card + ' mt-4'}>
          <h1 className="text-lg font-bold">Job {job.job_id.slice(0, 8)}…</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className={badge(statusColor(job.status))}>{job.status?.replace(/_/g, ' ')}</span>
          </div>
        </div>

        {/* technician + request summary */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className={card}>
            <h3 className="text-sm font-semibold">Technician</h3>
            <p className="mt-1 text-sm">{job.technician?.user?.full_name || '--'}</p>
            <p className="text-xs text-slate-500">{job.technician?.user?.email}</p>
            <Link to={`/admin/technicians/${job.technician_id}`} className="mt-1 inline-block text-xs text-emerald-600 hover:underline dark:text-emerald-400">View profile →</Link>
          </div>
          <div className={card}>
            <h3 className="text-sm font-semibold">Service Request</h3>
            <p className="mt-1 text-sm capitalize">{job.request?.issue_type?.replace(/_/g, ' ') || '--'} — {job.request?.status?.replace(/_/g, ' ')}</p>
            <p className="text-xs text-slate-500">User: {job.request?.user?.full_name || '--'}</p>
            {job.request?.vehicle && <p className="text-xs text-slate-500">Vehicle: {job.request.vehicle.registration_number} {job.request.vehicle.variant ? `(${job.request.vehicle.variant.model?.company?.company_name || ''} ${job.request.vehicle.variant.model?.model_name || ''} ${job.request.vehicle.variant.variant_name})` : ''}</p>}
            <Link to={`/admin/requests/${job.request_id}`} className="mt-1 inline-block text-xs text-emerald-600 hover:underline dark:text-emerald-400">View request →</Link>
          </div>
        </div>

        {/* offer */}
        {job.offer && (
          <div className={card + ' mt-4'}>
            <h3 className="text-sm font-semibold">Accepted Offer</h3>
            <div className="mt-2 grid gap-2 text-sm sm:grid-cols-4">
              <p><strong>Mode:</strong> {job.offer.repair_mode?.replace(/_/g, ' ')}</p>
              <p><strong>Cost:</strong> ₹{job.offer.estimated_cost}</p>
              <p><strong>Time:</strong> {job.offer.estimated_time} min</p>
              <p><strong>Status:</strong> {job.offer.status}</p>
            </div>
            {job.offer.message && <p className="mt-1 text-xs text-slate-500">"{job.offer.message}"</p>}
          </div>
        )}

        {/* timeline */}
        <div className={card + ' mt-4'}>
          <h3 className="text-sm font-semibold">Timeline</h3>
          <div className="mt-2 space-y-1 text-sm">
            <p><strong>Started:</strong> {job.started_at ? new Date(job.started_at).toLocaleString() : 'Not yet'}</p>
            <p><strong>Completed:</strong> {job.completed_at ? new Date(job.completed_at).toLocaleString() : 'Not yet'}</p>
          </div>
        </div>

        {/* parts from request */}
        {job.request?.parts?.length > 0 && (
          <section className={card + ' mt-4'}>
            <h2 className="text-sm font-semibold">Parts Needed</h2>
            <ul className="mt-2 list-inside list-disc text-sm">
              {job.request.parts.map((p) => <li key={p.request_part_id}>{p.part?.part_name || `Part #${p.part_id}`} × {p.quantity}</li>)}
            </ul>
          </section>
        )}

        {/* invoice */}
        {job.invoice && (
          <section className={card + ' mt-4'}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Invoice</h2>
              <Link to={`/admin/invoices/${job.invoice.invoice_id}`} className="text-xs text-emerald-600 hover:underline dark:text-emerald-400">View full invoice →</Link>
            </div>
            <div className="mt-2 grid gap-2 text-sm sm:grid-cols-4">
              <p><strong>Subtotal:</strong> ₹{job.invoice.subtotal}</p>
              <p><strong>Tax:</strong> ₹{job.invoice.tax}</p>
              <p><strong>Total:</strong> ₹{job.invoice.total}</p>
              <p><strong>Payment:</strong> <span className={badge('bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300')}>{job.invoice.payment_status}</span></p>
            </div>
            {job.invoice.items?.length > 0 && (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead><tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="pb-1 pr-2">Type</th><th className="pb-1 pr-2">Description</th><th className="pb-1 pr-2">Qty</th><th className="pb-1 pr-2">Unit ₹</th><th className="pb-1">Total ₹</th>
                  </tr></thead>
                  <tbody>
                    {job.invoice.items.map((i) => (
                      <tr key={i.item_id} className="border-b border-slate-100 dark:border-slate-800">
                        <td className="py-1 pr-2 capitalize">{i.item_type}</td>
                        <td className="py-1 pr-2">{i.description}</td>
                        <td className="py-1 pr-2">{i.quantity}</td>
                        <td className="py-1 pr-2">{i.unit_price}</td>
                        <td className="py-1">{i.total_price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}

export default AdminJobDetailPage
