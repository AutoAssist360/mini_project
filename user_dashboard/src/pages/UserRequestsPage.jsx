import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError, getServiceRequests, userLogout } from '../lib/api'
import { clearAuth } from '../store/authSlice'

const STATUS_COLORS = {
  created: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  pending_offers: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  offer_accepted: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  in_progress: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

function UserRequestsPage({ theme, onToggleTheme }) {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const auth = useSelector((state) => state.auth)

  const [requests, setRequests] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 10

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError('')

    const loadRequests = async () => {
      try {
        const response = await getServiceRequests(
          { page, limit, status: statusFilter || undefined },
        )
        if (!cancelled) {
          setRequests(response?.requests || [])
          setTotal(response?.total || 0)
        }
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError) setError(err.message)
          else setError('Unable to load requests right now.')
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadRequests()
    return () => { cancelled = true }
  }, [statusFilter, page])

  const totalPages = Math.max(1, Math.ceil(total / limit))

  const handleFilterChange = (event) => {
    setStatusFilter(event.target.value)
    setPage(1)
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
            <h1 className="text-xl font-semibold">My Requests</h1>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={onToggleTheme} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</button>
              <Link to="/dashboard" className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">Dashboard</Link>
              <button type="button" onClick={handleLogout} className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500">Logout</button>
            </div>
          </div>
        </header>

        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="status" className="text-sm font-medium">Filter status</label>
              <select id="status" value={statusFilter} onChange={handleFilterChange} className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800">
                <option value="">All</option>
                <option value="created">Created</option>
                <option value="pending_offers">Pending offers</option>
                <option value="offer_accepted">Offer accepted</option>
                <option value="in_progress">In progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <Link to="/requests/new" className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500">Raise New Issue</Link>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
              {error}
            </div>
          )}

          {isLoading ? (
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">Loading requests...</p>
          ) : requests.length === 0 ? (
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">No requests found for the selected filter.</p>
          ) : (
            <>
              <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                  <thead className="bg-slate-50 dark:bg-slate-900/70">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold">Request ID</th>
                      <th className="px-3 py-2 text-left font-semibold">Issue Type</th>
                      <th className="px-3 py-2 text-left font-semibold">Status</th>
                      <th className="px-3 py-2 text-left font-semibold">Offers</th>
                      <th className="px-3 py-2 text-left font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {requests.map((request) => {
                      const badgeColor = STATUS_COLORS[request.status] || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      return (
                        <tr key={request.request_id}>
                          <td className="px-3 py-2 font-mono text-xs">{request.request_id.slice(0, 8)}...</td>
                          <td className="px-3 py-2">{request.issue_type?.replace(/_/g, ' ')}</td>
                          <td className="px-3 py-2">
                            <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${badgeColor}`}>{request.status?.replace(/_/g, ' ')}</span>
                          </td>
                          <td className="px-3 py-2">{request.offers?.length || 0}</td>
                          <td className="px-3 py-2">
                            <Link to={`/requests/${request.request_id}`} className="text-emerald-600 hover:text-emerald-500 dark:text-emerald-300">Open</Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

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

export default UserRequestsPage
