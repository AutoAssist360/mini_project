import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getJobs } from '../lib/api'

const card = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900'
const btn  = 'rounded-lg px-3 py-1.5 text-xs font-semibold'
const badge = (c) => `inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${c}`

const STATUS_OPTS = ['', 'assigned', 'in_progress', 'completed', 'verified']

function AdminJobsPage() {
  const [jobs, setJobs]           = useState([])
  const [pagination, setPagination] = useState({})
  const [page, setPage]           = useState(1)
  const [status, setStatus]       = useState('')
  const [loading, setLoading]     = useState(true)

  const load = useCallback(() => {
    getJobs({ page, limit: 15, status: status || undefined })
      .then((r) => { setJobs(r.jobs || []); setPagination(r.pagination || {}) })
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [page, status])

  useEffect(() => { load() }, [load])

  const statusColor = (s) => {
    const m = { assigned: 'bg-amber-100 text-amber-800', in_progress: 'bg-indigo-100 text-indigo-800', completed: 'bg-green-100 text-green-800', verified: 'bg-emerald-100 text-emerald-800' }
    return m[s] || 'bg-slate-100 text-slate-700'
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Jobs</h1>
          <Link to="/admin/dashboard" className="text-sm text-emerald-600 hover:underline dark:text-emerald-400">← Dashboard</Link>
        </div>

        <div className={'mt-4 flex flex-wrap gap-3 ' + card}>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800">
            {STATUS_OPTS.map((s) => <option key={s} value={s}>{s ? s.replace(/_/g, ' ') : 'All statuses'}</option>)}
          </select>
        </div>

        {loading && <p className="mt-6 text-center text-sm text-slate-500">Loading…</p>}

        {!loading && (
          <>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead><tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="pb-2 pr-3">Job</th><th className="pb-2 pr-3">Issue</th><th className="pb-2 pr-3">Technician</th><th className="pb-2 pr-3">Status</th><th className="pb-2 pr-3">Invoice</th><th className="pb-2">Started</th>
                </tr></thead>
                <tbody>
                  {jobs.map((j) => (
                    <tr key={j.job_id} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="py-2 pr-3"><Link to={`/admin/jobs/${j.job_id}`} className="text-emerald-600 hover:underline dark:text-emerald-400">{j.job_id.slice(0, 8)}…</Link></td>
                      <td className="py-2 pr-3 capitalize">{j.request?.issue_type?.replace(/_/g, ' ') || '--'}</td>
                      <td className="py-2 pr-3">{j.technician?.user?.full_name || '--'}</td>
                      <td className="py-2 pr-3"><span className={badge(statusColor(j.status))}>{j.status?.replace(/_/g, ' ')}</span></td>
                      <td className="py-2 pr-3">{j.invoice ? <span>₹{j.invoice.total} <span className={badge('bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400')}>{j.invoice.payment_status}</span></span> : '--'}</td>
                      <td className="py-2">{j.started_at ? new Date(j.started_at).toLocaleDateString() : '--'}</td>
                    </tr>
                  ))}
                  {jobs.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-slate-500">No jobs found</td></tr>}
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

export default AdminJobsPage
