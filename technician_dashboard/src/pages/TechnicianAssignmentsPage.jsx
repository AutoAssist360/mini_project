import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPendingAssignments, acceptAssignment, rejectAssignment, ApiError } from '../lib/api'

const ISSUE_LABELS = {
  mechanical_failure: 'Mechanical',
  electrical_issue: 'Electrical',
  tire_related: 'Tire',
  battery_issue: 'Battery',
  engine_problem: 'Engine',
  brake_issue: 'Brake',
  other: 'Other',
}

function TechnicianAssignmentsPage({ theme, onToggleTheme }) {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionMsg, setActionMsg] = useState('')
  const [acting, setActing] = useState(null)

  const loadAssignments = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getPendingAssignments()
      setAssignments(res?.assignments ?? [])
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load assignments')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadAssignments() }, [loadAssignments])

  const handleAccept = async (jobId) => {
    setActing(jobId)
    setActionMsg('')
    try {
      await acceptAssignment(jobId)
      setActionMsg('Assignment accepted! Redirecting to jobs...')
      await loadAssignments()
    } catch (err) {
      setActionMsg(err instanceof ApiError ? err.message : 'Failed to accept')
    } finally {
      setActing(null)
    }
  }

  const handleReject = async (jobId) => {
    if (!confirm('Are you sure you want to reject this assignment?')) return
    setActing(jobId)
    setActionMsg('')
    try {
      await rejectAssignment(jobId)
      setActionMsg('Assignment rejected')
      await loadAssignments()
    } catch (err) {
      setActionMsg(err instanceof ApiError ? err.message : 'Failed to reject')
    } finally {
      setActing(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link to="/dashboard" className="text-sm text-emerald-600 hover:text-emerald-500 dark:text-emerald-300">← Dashboard</Link>
              <h1 className="text-xl font-semibold">Pending Assignments</h1>
            </div>
            <button type="button" onClick={onToggleTheme} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
        </header>

        {actionMsg && (
          <div className={`mt-4 rounded-xl border px-3 py-2 text-sm ${actionMsg.includes('accepted') || actionMsg.includes('rejected') ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-300' : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300'}`}>
            {actionMsg}
          </div>
        )}

        {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">{error}</div>}

        {loading ? (
          <div className="mt-10 text-center text-sm text-slate-500">Loading assignments...</div>
        ) : assignments.length === 0 ? (
          <div className="mt-10 text-center text-sm text-slate-500">No pending assignments at the moment.</div>
        ) : (
          <section className="mt-5 space-y-4">
            {assignments.map((a) => (
              <div key={a.job_id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-semibold">
                      {ISSUE_LABELS[a.request?.issue_type] || a.request?.issue_type}
                    </p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {a.request?.issue_description}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span>Location: {a.request?.service_location_type}</span>
                      {a.request?.breakdown_latitude && <span>GPS: {a.request.breakdown_latitude.toFixed(4)}, {a.request.breakdown_longitude?.toFixed(4)}</span>}
                      <span>Repair: {a.offer?.repair_mode === 'onsite' ? 'Onsite' : 'Tow to Garage'}</span>
                      <span>Est. ₹{Number(a.offer?.estimated_cost ?? 0).toLocaleString()}</span>
                      <span>Est. {a.offer?.estimated_time} min</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => handleAccept(a.job_id)} disabled={acting === a.job_id} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60">
                      {acting === a.job_id ? '...' : 'Accept'}
                    </button>
                    <button type="button" onClick={() => handleReject(a.job_id)} disabled={acting === a.job_id} className="rounded-xl border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 disabled:opacity-60">
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  )
}

export default TechnicianAssignmentsPage
