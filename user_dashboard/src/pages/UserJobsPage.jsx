import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { getJobs, userLogout } from '../lib/api'
import { clearAuth } from '../store/authSlice'

const STATUS_COLORS = {
  assigned: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  in_progress: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  verified: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
}

function Badge({ status }) {
  const color = STATUS_COLORS[status] || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${color}`}>{status?.replace(/_/g, ' ')}</span>
}

function UserJobsPage({ theme, onToggleTheme }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [jobs, setJobs] = useState([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const limit = 10

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const fetchData = async () => {
      try {
        const data = await getJobs({ page, limit })
        if (!cancelled) {
          setJobs(data.jobs || [])
          setTotal(data.total || 0)
          setError('')
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load jobs')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchData()
    return () => { cancelled = true }
  }, [page])

  const totalPages = Math.max(1, Math.ceil(total / limit))

  const handleLogout = async () => {
    await userLogout().catch(() => null)
    dispatch(clearAuth())
    navigate('/auth/user/signin')
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-xl font-semibold">My Jobs</h1>
            <div className="flex gap-2">
              <button type="button" onClick={onToggleTheme} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</button>
              <button type="button" onClick={() => navigate('/dashboard')} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">Dashboard</button>
              <button type="button" onClick={handleLogout} className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500">Logout</button>
            </div>
          </div>
        </header>

        {/* Content */}
        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {loading && <p className="text-sm text-slate-500">Loading jobs…</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}

          {!loading && !error && jobs.length === 0 && (
            <p className="text-sm text-slate-500">No jobs found. Jobs are created when a technician starts working on your service request.</p>
          )}

          {!loading && !error && jobs.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="pb-2 pr-3 font-semibold">Job ID</th>
                      <th className="pb-2 pr-3 font-semibold">Issue Type</th>
                      <th className="pb-2 pr-3 font-semibold">Status</th>
                      <th className="pb-2 pr-3 font-semibold">Technician</th>
                      <th className="pb-2 pr-3 font-semibold">Est. Cost</th>
                      <th className="pb-2 pr-3 font-semibold">Invoice</th>
                      <th className="pb-2 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map((j) => (
                      <tr key={j.job_id} className="border-b border-slate-100 dark:border-slate-800">
                        <td className="py-2 pr-3 font-mono text-xs">{j.job_id.slice(0, 8)}…</td>
                        <td className="py-2 pr-3">{j.request?.issue_type || '—'}</td>
                        <td className="py-2 pr-3"><Badge status={j.status} /></td>
                        <td className="py-2 pr-3">{j.technician?.user?.full_name || '—'}</td>
                        <td className="py-2 pr-3">{j.offer?.estimated_cost != null ? `₹${j.offer.estimated_cost}` : '—'}</td>
                        <td className="py-2 pr-3">
                          {j.invoice ? (
                            <button type="button" onClick={() => navigate(`/invoices/${j.invoice.invoice_id}`)} className="text-emerald-600 hover:underline dark:text-emerald-400">
                              ₹{j.invoice.total} ({j.invoice.payment_status})
                            </button>
                          ) : '—'}
                        </td>
                        <td className="py-2">
                          <button type="button" onClick={() => navigate(`/jobs/${j.job_id}`)} className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-500">Open</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="mt-4 flex items-center justify-between text-sm">
                <p className="text-slate-500">Page {page} of {totalPages} ({total} total)</p>
                <div className="flex gap-2">
                  <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-slate-300 px-3 py-1 text-sm disabled:opacity-40 dark:border-slate-700">Prev</button>
                  <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-slate-300 px-3 py-1 text-sm disabled:opacity-40 dark:border-slate-700">Next</button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}

export default UserJobsPage
