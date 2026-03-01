import { useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { clearAuth, setAuthUser } from '../store/authSlice'
import {
  technicianLogout,
  getTechnicianProfile,
  updateAvailability,
  getPendingAssignments,
  getJobs,
  getEarnings,
} from '../lib/api'

function TechnicianDashboardPage({ theme, onToggleTheme }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const auth = useSelector((state) => state.auth)
  const profile = auth.user

  const [isOnline, setIsOnline] = useState(profile?.is_online ?? false)
  const [togglingOnline, setTogglingOnline] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [activeJobsCount, setActiveJobsCount] = useState(0)
  const [earningsSummary, setEarningsSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadDashboardData = useCallback(async () => {
    setLoading(true)
    try {
      const [profileRes, assignRes, jobsRes, earningsRes] = await Promise.allSettled([
        getTechnicianProfile(),
        getPendingAssignments(),
        getJobs(1, 1, 'in_progress'),
        getEarnings(),
      ])

      if (profileRes.status === 'fulfilled' && profileRes.value?.profile) {
        dispatch(setAuthUser(profileRes.value.profile))
        setIsOnline(profileRes.value.profile.is_online ?? false)
      }
      if (assignRes.status === 'fulfilled') {
        setPendingCount(assignRes.value?.assignments?.length ?? 0)
      }
      if (jobsRes.status === 'fulfilled') {
        setActiveJobsCount(jobsRes.value?.total ?? 0)
      }
      if (earningsRes.status === 'fulfilled') {
        setEarningsSummary(earningsRes.value?.summary ?? null)
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false)
    }
  }, [dispatch])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  const handleToggleOnline = async () => {
    setTogglingOnline(true)
    try {
      const res = await updateAvailability(!isOnline)
      setIsOnline(res?.availability?.is_online ?? !isOnline)
    } catch {
      /* silent */
    } finally {
      setTogglingOnline(false)
    }
  }

  const handleLogout = async () => {
    await technicianLogout().catch(() => null)
    dispatch(clearAuth())
    navigate('/auth/technician/signin')
  }

  const techName = profile?.user?.full_name || 'Technician'
  const isVerified = profile?.is_verified ?? false

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold">Technician Dashboard</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Welcome, {techName}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={onToggleTheme} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </button>
              <a href={import.meta.env.VITE_LANDING_APP_URL || 'http://localhost:5173'} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">
                Home
              </a>
              <button type="button" onClick={handleLogout} className="rounded-xl bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-500">
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Status bar */}
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={handleToggleOnline}
            disabled={togglingOnline}
            className={`rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-colors ${
              isOnline
                ? 'bg-emerald-600 hover:bg-emerald-500'
                : 'bg-slate-500 hover:bg-slate-400'
            } disabled:opacity-60`}
          >
            {togglingOnline ? 'Updating...' : isOnline ? '● Online' : '○ Offline'}
          </button>

          {!isVerified && (
            <span className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
              Account pending verification by admin
            </span>
          )}

          {isVerified && (
            <span className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300">
              Verified
            </span>
          )}
        </div>

        {loading ? (
          <div className="mt-10 text-center text-sm text-slate-500">Loading dashboard...</div>
        ) : (
          <>
            {/* Stats */}
            <section className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Pending Assignments</p>
                <p className="mt-2 text-3xl font-bold">{pendingCount}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Active Jobs</p>
                <p className="mt-2 text-3xl font-bold">{activeJobsCount}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Earned</p>
                <p className="mt-2 text-3xl font-bold">₹{Number(earningsSummary?.total_earned ?? 0).toLocaleString()}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Completed Jobs</p>
                <p className="mt-2 text-3xl font-bold">{earningsSummary?.total_jobs ?? 0}</p>
              </div>
            </section>

            {/* Quick Actions */}
            <section className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Link to="/offers" className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-emerald-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-600">
                <h2 className="font-semibold group-hover:text-emerald-600">My Offers</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Browse requests &amp; submit offers to customers</p>
              </Link>

              <Link to="/assignments" className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-emerald-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-600">
                <h2 className="font-semibold group-hover:text-emerald-600">Assignments</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {pendingCount > 0 ? `${pendingCount} pending` : 'No pending'} assignment{pendingCount !== 1 ? 's' : ''}
                </p>
              </Link>

              <Link to="/jobs" className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-emerald-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-600">
                <h2 className="font-semibold group-hover:text-emerald-600">Jobs</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">View &amp; manage all your jobs</p>
              </Link>

              <Link to="/earnings" className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-emerald-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-600">
                <h2 className="font-semibold group-hover:text-emerald-600">Earnings</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Track your revenue &amp; payouts</p>
              </Link>

              <Link to="/profile" className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-emerald-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-600">
                <h2 className="font-semibold group-hover:text-emerald-600">Profile</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Update your info &amp; certifications</p>
              </Link>
            </section>
          </>
        )}
      </div>
    </div>
  )
}

export default TechnicianDashboardPage
