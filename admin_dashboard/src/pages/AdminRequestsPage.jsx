import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getRequests } from '../lib/api'

const card = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900'
const btn  = 'rounded-lg px-3 py-1.5 text-xs font-semibold'
const badge = (c) => `inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${c}`

const STATUS_OPTS = ['', 'created', 'pending_offers', 'offer_accepted', 'in_progress', 'completed', 'cancelled']
const ISSUE_OPTS  = ['', 'mechanical_failure', 'electrical_issue', 'tire_related', 'battery_issue', 'engine_problem', 'brake_issue', 'other']

function AdminRequestsPage() {
  const [requests, setRequests]   = useState([])
  const [pagination, setPagination] = useState({})
  const [page, setPage]           = useState(1)
  const [status, setStatus]       = useState('')
  const [issueType, setIssueType] = useState('')
  const [loading, setLoading]     = useState(true)

  const load = useCallback(() => {
    getRequests({ page, limit: 15, status: status || undefined, issue_type: issueType || undefined })
      .then((r) => { setRequests(r.requests || []); setPagination(r.pagination || {}) })
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [page, status, issueType])

  useEffect(() => { load() }, [load])

  const statusColor = (s) => {
    const map = { created: 'bg-slate-100 text-slate-700', pending_offers: 'bg-amber-100 text-amber-800', offer_accepted: 'bg-blue-100 text-blue-800', in_progress: 'bg-indigo-100 text-indigo-800', completed: 'bg-green-100 text-green-800', cancelled: 'bg-red-100 text-red-800' }
    return map[s] || 'bg-slate-100 text-slate-700'
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Service Requests</h1>
          <Link to="/admin/dashboard" className="text-sm text-emerald-600 hover:underline dark:text-emerald-400">← Dashboard</Link>
        </div>

        <div className={'mt-4 flex flex-wrap gap-3 ' + card}>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800">
            {STATUS_OPTS.map((s) => <option key={s} value={s}>{s ? s.replace(/_/g, ' ') : 'All statuses'}</option>)}
          </select>
          <select value={issueType} onChange={(e) => { setIssueType(e.target.value); setPage(1) }} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800">
            {ISSUE_OPTS.map((i) => <option key={i} value={i}>{i ? i.replace(/_/g, ' ') : 'All issue types'}</option>)}
          </select>
        </div>

        {loading && <p className="mt-6 text-center text-sm text-slate-500">Loading…</p>}

        {!loading && (
          <>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead><tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="pb-2 pr-3">Request</th><th className="pb-2 pr-3">User</th><th className="pb-2 pr-3">Type</th><th className="pb-2 pr-3">Status</th><th className="pb-2 pr-3">Offers</th><th className="pb-2">Created</th>
                </tr></thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r.request_id} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="py-2 pr-3"><Link to={`/admin/requests/${r.request_id}`} className="text-emerald-600 hover:underline dark:text-emerald-400">{r.request_id.slice(0, 8)}…</Link></td>
                      <td className="py-2 pr-3">{r.user?.full_name || '--'}</td>
                      <td className="py-2 pr-3 capitalize">{r.issue_type?.replace(/_/g, ' ')}</td>
                      <td className="py-2 pr-3"><span className={badge(statusColor(r.status))}>{r.status?.replace(/_/g, ' ')}</span></td>
                      <td className="py-2 pr-3">{r._count?.offers ?? 0}</td>
                      <td className="py-2">{new Date(r.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {requests.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-slate-500">No requests found</td></tr>}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm">
              <span>Page {pagination.page || 1} of {pagination.totalPages || 1} ({pagination.total || 0} total)</span>
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

export default AdminRequestsPage
