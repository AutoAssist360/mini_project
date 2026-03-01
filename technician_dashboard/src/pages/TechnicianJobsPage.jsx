import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getJobs, ApiError } from '../lib/api'

const STATUS_COLORS = {
  assigned: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  in_progress: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  verified: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
}

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
]

function TechnicianJobsPage({ theme, onToggleTheme }) {
  const [jobs, setJobs] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadJobs = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getJobs(page, 20, statusFilter)
      setJobs(res?.jobs ?? [])
      setTotal(res?.total ?? 0)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter])

  useEffect(() => { loadJobs() }, [loadJobs])

  const totalPages = Math.ceil(total / 20) || 1

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link to="/dashboard" className="text-sm text-emerald-600 hover:text-emerald-500 dark:text-emerald-300">← Dashboard</Link>
              <h1 className="text-xl font-semibold">My Jobs</h1>
            </div>
            <button type="button" onClick={onToggleTheme} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
        </header>

        {/* Filter */}
        <div className="mt-5 flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { setStatusFilter(opt.value); setPage(1) }}
              className={`rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === opt.value
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300'
                  : 'border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">{error}</div>}

        {loading ? (
          <div className="mt-10 text-center text-sm text-slate-500">Loading jobs...</div>
        ) : jobs.length === 0 ? (
          <div className="mt-10 text-center text-sm text-slate-500">No jobs found.</div>
        ) : (
          <>
            <section className="mt-5 space-y-3">
              {jobs.map((job) => (
                <Link key={job.job_id} to={`/jobs/${job.job_id}`} className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-emerald-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-600">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{job.request?.issue_type?.replace(/_/g, ' ')} — {job.request?.issue_description?.slice(0, 80)}</p>
                      <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <span>Mode: {job.offer?.repair_mode === 'onsite' ? 'Onsite' : 'Tow'}</span>
                        <span>Est. ₹{Number(job.offer?.estimated_cost ?? 0).toLocaleString()}</span>
                        {job.started_at && <span>Started: {new Date(job.started_at).toLocaleDateString()}</span>}
                        {job.completed_at && <span>Completed: {new Date(job.completed_at).toLocaleDateString()}</span>}
                        {job.invoice && <span>Invoice: {job.invoice.payment_status}</span>}
                      </div>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[job.status] || ''}`}>
                      {job.status?.replace(/_/g, ' ')}
                    </span>
                  </div>
                </Link>
              ))}
            </section>

            {totalPages > 1 && (
              <div className="mt-5 flex items-center justify-center gap-2">
                <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="rounded-xl border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-slate-700">Prev</button>
                <span className="text-sm">Page {page} of {totalPages}</span>
                <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="rounded-xl border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-slate-700">Next</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default TechnicianJobsPage
