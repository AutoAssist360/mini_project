import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { getReviews, userLogout } from '../lib/api'
import { clearAuth } from '../store/authSlice'

function Stars({ count }) {
  return (
    <span className="inline-flex gap-0.5 text-yellow-400">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={s <= count ? '' : 'text-slate-300 dark:text-slate-600'}>★</span>
      ))}
    </span>
  )
}

function UserReviewsPage({ theme, onToggleTheme }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [reviews, setReviews] = useState([])
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
        const data = await getReviews({ page, limit })
        if (!cancelled) {
          setReviews(data.reviews || [])
          setTotal(data.total || 0)
          setError('')
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load reviews')
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
            <h1 className="text-xl font-semibold">My Reviews</h1>
            <div className="flex gap-2">
              <button type="button" onClick={onToggleTheme} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</button>
              <button type="button" onClick={() => navigate('/dashboard')} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">Dashboard</button>
              <button type="button" onClick={handleLogout} className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500">Logout</button>
            </div>
          </div>
        </header>

        {/* Content */}
        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {loading && <p className="text-sm text-slate-500">Loading reviews…</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}

          {!loading && !error && reviews.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-slate-500">You haven't submitted any reviews yet.</p>
              <p className="mt-1 text-sm text-slate-400">After a job is completed, you can leave a review from the job detail page.</p>
              <button type="button" onClick={() => navigate('/jobs')} className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500">View Jobs</button>
            </div>
          )}

          {!loading && !error && reviews.length > 0 && (
            <>
              <div className="space-y-4">
                {reviews.map((r) => (
                  <div key={r.review_id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3">
                        <Stars count={r.rating} />
                        <span className="text-sm font-semibold">{r.rating}/5</span>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{new Date(r.created_at).toLocaleDateString()}</span>
                    </div>
                    {r.comment && <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{r.comment}</p>}
                    <div className="mt-2 flex gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <button type="button" onClick={() => navigate(`/jobs/${r.job_id}`)} className="text-emerald-600 hover:underline dark:text-emerald-400">View Job</button>
                    </div>
                  </div>
                ))}
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

export default UserReviewsPage
