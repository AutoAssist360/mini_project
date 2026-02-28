import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import { getJobById, createReview, userLogout } from '../lib/api'
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

function InfoRow({ label, children }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-sm font-medium">{children}</span>
    </div>
  )
}

function UserJobDetailPage({ theme, onToggleTheme }) {
  const { jobId } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Review form
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewMsg, setReviewMsg] = useState('')
  const [reviewError, setReviewError] = useState('')

  useEffect(() => {
    let cancelled = false
    const fetchData = async () => {
      try {
        const data = await getJobById(jobId)
        if (!cancelled) {
          setJob(data.job || data)
          setError('')
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load job')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchData()
    return () => { cancelled = true }
  }, [jobId])

  const handleLogout = async () => {
    await userLogout().catch(() => null)
    dispatch(clearAuth())
    navigate('/auth/user/signin')
  }

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    setReviewSubmitting(true)
    setReviewMsg('')
    setReviewError('')
    try {
      await createReview({ job_id: jobId, rating: reviewRating, comment: reviewComment || undefined })
      setReviewMsg('Review submitted successfully!')
      // Reload job to reflect
      const data = await getJobById(jobId)
      setJob(data.job || data)
    } catch (err) {
      setReviewError(err.message || 'Failed to submit review')
    } finally {
      setReviewSubmitting(false)
    }
  }

  const request = job?.request
  const technician = job?.technician
  const offer = job?.offer
  const invoice = job?.invoice
  const vehicle = request?.vehicle
  const variant = vehicle?.variant
  const company = variant?.model?.company

  const canReview = job && ['completed', 'verified'].includes(job.status)

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-xl font-semibold">Job Detail</h1>
            <div className="flex gap-2">
              <button type="button" onClick={onToggleTheme} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</button>
              <button type="button" onClick={() => navigate('/jobs')} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">Back to Jobs</button>
              <button type="button" onClick={() => navigate('/dashboard')} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">Dashboard</button>
              <button type="button" onClick={handleLogout} className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500">Logout</button>
            </div>
          </div>
        </header>

        {loading && <p className="mt-5 text-sm text-slate-500">Loading job…</p>}
        {error && <p className="mt-5 text-sm text-red-600">{error}</p>}

        {!loading && !error && job && (
          <>
            {/* Job Info */}
            <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-base font-semibold">Job Information</h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <InfoRow label="Job ID">{job.job_id}</InfoRow>
                <InfoRow label="Status"><Badge status={job.status} /></InfoRow>
                <InfoRow label="Started At">{job.started_at ? new Date(job.started_at).toLocaleString() : '—'}</InfoRow>
                <InfoRow label="Completed At">{job.completed_at ? new Date(job.completed_at).toLocaleString() : '—'}</InfoRow>
                {job.notes && <InfoRow label="Notes">{job.notes}</InfoRow>}
              </div>
            </section>

            {/* Request Info */}
            {request && (
              <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-base font-semibold">Service Request</h2>
                <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <InfoRow label="Request ID">
                    <button type="button" onClick={() => navigate(`/requests/${request.request_id}`)} className="text-emerald-600 hover:underline dark:text-emerald-400">{request.request_id.slice(0, 8)}…</button>
                  </InfoRow>
                  <InfoRow label="Issue Type">{request.issue_type || '—'}</InfoRow>
                  <InfoRow label="Request Status"><Badge status={request.status} /></InfoRow>
                  <InfoRow label="Description">{request.issue_description || '—'}</InfoRow>
                </div>
                {vehicle && (
                  <div className="mt-3">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Vehicle</p>
                    <p className="text-sm font-medium">
                      {company?.company_name} {variant?.model?.model_name} {variant?.variant_name}
                      {vehicle.registration_number ? ` — ${vehicle.registration_number}` : ''}
                    </p>
                  </div>
                )}
              </section>
            )}

            {/* Technician Info */}
            {technician && (
              <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-base font-semibold">Technician</h2>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <InfoRow label="Name">{technician.user?.full_name || '—'}</InfoRow>
                  <InfoRow label="Email">{technician.user?.email || '—'}</InfoRow>
                </div>
              </section>
            )}

            {/* Offer Details */}
            {offer && (
              <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-base font-semibold">Offer Details</h2>
                <div className="mt-3 grid gap-4 sm:grid-cols-3">
                  <InfoRow label="Repair Mode">{offer.repair_mode || '—'}</InfoRow>
                  <InfoRow label="Estimated Cost">{offer.estimated_cost != null ? `₹${offer.estimated_cost}` : '—'}</InfoRow>
                  <InfoRow label="Estimated Time">{offer.estimated_time || '—'}</InfoRow>
                  {offer.diagnosis && <InfoRow label="Diagnosis">{offer.diagnosis}</InfoRow>}
                </div>
              </section>
            )}

            {/* Invoice */}
            {invoice && (
              <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-base font-semibold">Invoice</h2>
                <div className="mt-3 grid gap-4 sm:grid-cols-3">
                  <InfoRow label="Invoice ID">
                    <button type="button" onClick={() => navigate(`/invoices/${invoice.invoice_id}`)} className="text-emerald-600 hover:underline dark:text-emerald-400">{invoice.invoice_id.slice(0, 8)}…</button>
                  </InfoRow>
                  <InfoRow label="Total">₹{invoice.total}</InfoRow>
                  <InfoRow label="Payment Status"><Badge status={invoice.payment_status} /></InfoRow>
                </div>
                {invoice.items && invoice.items.length > 0 && (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="pb-2 pr-3 font-semibold">Description</th>
                          <th className="pb-2 pr-3 font-semibold">Qty</th>
                          <th className="pb-2 pr-3 font-semibold">Unit Price</th>
                          <th className="pb-2 font-semibold">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoice.items.map((item, i) => (
                          <tr key={item.invoice_item_id || i} className="border-b border-slate-100 dark:border-slate-800">
                            <td className="py-2 pr-3">{item.description || '—'}</td>
                            <td className="py-2 pr-3">{item.quantity}</td>
                            <td className="py-2 pr-3">₹{item.unit_price}</td>
                            <td className="py-2">₹{item.total}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}

            {/* Parts Requested */}
            {request?.parts && request.parts.length > 0 && (
              <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-base font-semibold">Requested Parts</h2>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="pb-2 pr-3 font-semibold">Part</th>
                        <th className="pb-2 pr-3 font-semibold">Qty</th>
                        <th className="pb-2 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {request.parts.map((rp, i) => (
                        <tr key={rp.request_part_id || i} className="border-b border-slate-100 dark:border-slate-800">
                          <td className="py-2 pr-3">{rp.part?.part_name || rp.part_name || '—'}</td>
                          <td className="py-2 pr-3">{rp.quantity}</td>
                          <td className="py-2"><Badge status={rp.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Messages link */}
            {request && (
              <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-base font-semibold">Messages</h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Communicate with the technician assigned to this request.</p>
                <button type="button" onClick={() => navigate(`/requests/${request.request_id}/messages`)} className="mt-3 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500">Open Messages</button>
              </section>
            )}

            {/* Review Section */}
            {canReview && (
              <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-base font-semibold">Leave a Review</h2>
                {reviewMsg && <p className="mt-2 text-sm text-emerald-600">{reviewMsg}</p>}
                {reviewError && <p className="mt-2 text-sm text-red-600">{reviewError}</p>}
                {!reviewMsg && (
                  <form onSubmit={handleSubmitReview} className="mt-3 space-y-3">
                    <div>
                      <label className="block text-sm font-medium">Rating</label>
                      <div className="mt-1 flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button key={star} type="button" onClick={() => setReviewRating(star)} className={`text-2xl ${star <= reviewRating ? 'text-yellow-400' : 'text-slate-300 dark:text-slate-600'}`}>★</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium">Comment (optional)</label>
                      <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} maxLength={2000} rows={3} className="mt-1 w-full rounded-xl border border-slate-300 bg-transparent px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:border-slate-700" placeholder="Share your experience…" />
                    </div>
                    <button type="submit" disabled={reviewSubmitting} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50">{reviewSubmitting ? 'Submitting…' : 'Submit Review'}</button>
                  </form>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default UserJobDetailPage
