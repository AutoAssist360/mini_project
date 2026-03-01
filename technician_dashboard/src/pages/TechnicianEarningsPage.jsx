import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getEarnings, ApiError } from '../lib/api'

const PAYMENT_COLORS = {
  pending: 'text-amber-600 dark:text-amber-300',
  completed: 'text-emerald-600 dark:text-emerald-300',
  failed: 'text-red-600 dark:text-red-300',
}

function TechnicianEarningsPage({ theme, onToggleTheme }) {
  const [summary, setSummary] = useState(null)
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadEarnings = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getEarnings()
      setSummary(res?.summary ?? null)
      setJobs(res?.jobs ?? [])
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load earnings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadEarnings() }, [loadEarnings])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link to="/dashboard" className="text-sm text-emerald-600 hover:text-emerald-500 dark:text-emerald-300">← Dashboard</Link>
              <h1 className="text-xl font-semibold">Earnings</h1>
            </div>
            <button type="button" onClick={onToggleTheme} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
        </header>

        {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">{error}</div>}

        {loading ? (
          <div className="mt-10 text-center text-sm text-slate-500">Loading earnings...</div>
        ) : (
          <>
            {/* Summary cards */}
            {summary && (
              <section className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Earned</p>
                  <p className="mt-2 text-3xl font-bold text-emerald-600 dark:text-emerald-400">₹{Number(summary.total_earned).toLocaleString()}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Pending</p>
                  <p className="mt-2 text-3xl font-bold text-amber-600 dark:text-amber-400">₹{Number(summary.total_pending).toLocaleString()}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Paid Invoices</p>
                  <p className="mt-2 text-3xl font-bold">{summary.paid_count}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Jobs</p>
                  <p className="mt-2 text-3xl font-bold">{summary.total_jobs}</p>
                </div>
              </section>
            )}

            {/* Job list */}
            <section className="mt-5">
              <h2 className="text-base font-semibold">Job Earnings Breakdown</h2>
              {jobs.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">No completed jobs yet.</p>
              ) : (
                <div className="mt-3 space-y-3">
                  {jobs.map((job) => (
                    <Link key={job.job_id} to={`/jobs/${job.job_id}`} className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-emerald-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-600">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium">{job.request?.issue_type?.replace(/_/g, ' ')} — {job.request?.issue_description?.slice(0, 60)}</p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {job.completed_at ? `Completed ${new Date(job.completed_at).toLocaleDateString()}` : job.status}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">₹{Number(job.invoice?.total ?? 0).toLocaleString()}</p>
                          <p className={`text-xs font-medium ${PAYMENT_COLORS[job.invoice?.payment_status] || ''}`}>
                            {job.invoice?.payment_status || 'no invoice'}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  )
}

export default TechnicianEarningsPage
