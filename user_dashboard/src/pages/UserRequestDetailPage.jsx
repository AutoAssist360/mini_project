import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { acceptOffer, ApiError, cancelServiceRequest, getRequestOffers, getServiceRequestById, rejectOffer, userLogout } from '../lib/api'
import { clearAuth } from '../store/authSlice'

const STATUS_COLORS = {
  created: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  pending_offers: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  offer_accepted: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  in_progress: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  accepted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

function UserRequestDetailPage({ theme, onToggleTheme }) {
  const { requestId } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const auth = useSelector((state) => state.auth)

  const [request, setRequest] = useState(null)
  const [offers, setOffers] = useState([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [actionMessage, setActionMessage] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const loadRequestData = async () => {
    setIsLoading(true)
    setError('')
    setActionMessage('')

    try {
      const [requestResponse, offersResponse] = await Promise.all([
        getServiceRequestById(requestId),
        getRequestOffers(requestId),
      ])

      setRequest(requestResponse?.serviceRequest || null)
      setOffers(offersResponse?.offers || [])
    } catch (err) {
      if (err instanceof ApiError) setError(err.message)
      else setError('Unable to load request details.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadRequestData()
  }, [requestId])

  const handleAcceptOffer = async (offerId) => {
    setActionLoading(true)
    try {
      await acceptOffer(offerId)
      setActionMessage('Offer accepted successfully.')
      await loadRequestData()
    } catch (err) {
      if (err instanceof ApiError) setError(err.message)
      else setError('Unable to accept offer.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRejectOffer = async (offerId) => {
    setActionLoading(true)
    try {
      await rejectOffer(offerId)
      setActionMessage('Offer rejected successfully.')
      await loadRequestData()
    } catch (err) {
      if (err instanceof ApiError) setError(err.message)
      else setError('Unable to reject offer.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancelRequest = async () => {
    if (!window.confirm('Are you sure you want to cancel this request?')) return
    setActionLoading(true)
    try {
      await cancelServiceRequest(requestId)
      setActionMessage('Request cancelled successfully.')
      await loadRequestData()
    } catch (err) {
      if (err instanceof ApiError) setError(err.message)
      else setError('Unable to cancel request.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleLogout = async () => {
    await userLogout().catch(() => null)
    dispatch(clearAuth())
    navigate('/auth/user/signin')
  }

  const canCancel = request && ['created', 'pending_offers'].includes(request.status)
  const statusBadge = STATUS_COLORS[request?.status] || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
  const formatCurrency = (v) => (v != null ? `₹${Number(v).toLocaleString('en-IN')}` : 'N/A')

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-xl font-semibold">Request Details</h1>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={onToggleTheme} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</button>
              <Link to="/requests" className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">My Requests</Link>
              <button type="button" onClick={handleLogout} className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500">Logout</button>
            </div>
          </div>
        </header>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        )}

        {actionMessage && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-300">
            {actionMessage}
          </div>
        )}

        {isLoading ? (
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">Loading request details...</p>
        ) : !request ? (
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">Request not found.</p>
        ) : (
          <>
            <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Request ID</p>
                  <p className="text-sm font-medium">{request.request_id}</p>
                </div>
                <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${statusBadge}`}>{request.status?.replace(/_/g, ' ')}</span>
              </div>

              <p className="mt-4 text-sm text-slate-700 dark:text-slate-200">{request.issue_description}</p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Issue Type</p>
                  <p className="mt-1 text-sm font-medium">{request.issue_type}</p>
                </div>
                <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Location Type</p>
                  <p className="mt-1 text-sm font-medium">{request.service_location_type}</p>
                </div>
                <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Requires Towing</p>
                  <p className="mt-1 text-sm font-medium">{request.requires_towing ? 'Yes' : 'No'}</p>
                </div>
                <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Vehicle</p>
                  <p className="mt-1 text-sm font-medium">{request.vehicle?.registration_number || 'N/A'}</p>
                </div>
              </div>

              {canCancel && (
                <button type="button" onClick={handleCancelRequest} disabled={actionLoading} className="mt-4 rounded-xl border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-900/20">
                  {actionLoading ? 'Processing...' : 'Cancel Request'}
                </button>
              )}
            </section>

            <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-base font-semibold">Technician Offers</h2>

              {offers.length === 0 ? (
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">No offers received yet.</p>
              ) : (
                <div className="mt-3 grid gap-3">
                  {offers.map((offer) => {
                    const offerBadge = STATUS_COLORS[offer.status] || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    return (
                    <article key={offer.offer_id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold">{offer.technician?.user?.full_name || 'Technician'}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{offer.repair_mode?.replace(/_/g, ' ')}</p>
                        </div>
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${offerBadge}`}>{offer.status?.replace(/_/g, ' ')}</span>
                      </div>

                      <div className="mt-3 grid gap-2 sm:grid-cols-3">
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Estimated Cost</p>
                          <p className="text-sm font-medium">{formatCurrency(offer.estimated_cost)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Estimated Time</p>
                          <p className="text-sm font-medium">{offer.estimated_time || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Message</p>
                          <p className="text-sm font-medium">{offer.message || 'No message'}</p>
                        </div>
                      </div>

                      {offer.status === 'pending' && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button type="button" onClick={() => handleAcceptOffer(offer.offer_id)} disabled={actionLoading} className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50">
                            {actionLoading ? 'Processing...' : 'Accept'}
                          </button>
                          <button type="button" onClick={() => handleRejectOffer(offer.offer_id)} disabled={actionLoading} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800">
                            {actionLoading ? 'Processing...' : 'Reject'}
                          </button>
                        </div>
                      )}
                    </article>
                    )
                  })}
                </div>
              )}
            </section>

            {/* Messages Link */}
            <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-base font-semibold">Messages</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Chat with a technician involved in this request.</p>
              <button type="button" onClick={() => navigate(`/requests/${requestId}/messages`)} className="mt-3 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500">Open Messages</button>
            </section>
          </>
        )}
      </div>
    </div>
  )
}

export default UserRequestDetailPage
