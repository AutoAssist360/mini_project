import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getOffers, createOffer, ApiError } from '../lib/api'

const ISSUE_LABELS = {
  mechanical_failure: 'Mechanical',
  electrical_issue: 'Electrical',
  tire_related: 'Tire',
  battery_issue: 'Battery',
  engine_problem: 'Engine',
  brake_issue: 'Brake',
  other: 'Other',
}

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  accepted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  expired: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
}

function TechnicianOffersPage({ theme, onToggleTheme }) {
  const [offers, setOffers] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // New offer form
  const [showForm, setShowForm] = useState(false)
  const [offerForm, setOfferForm] = useState({
    request_id: '',
    repair_mode: 'onsite',
    estimated_cost: '',
    estimated_time: '',
    message: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [formMsg, setFormMsg] = useState('')

  const loadOffers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getOffers(page, 20)
      setOffers(res?.offers ?? [])
      setTotal(res?.total ?? 0)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load offers')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { loadOffers() }, [loadOffers])

  const totalPages = Math.ceil(total / 20) || 1

  const handleSubmitOffer = async () => {
    setSubmitting(true)
    setFormMsg('')
    try {
      await createOffer({
        request_id: offerForm.request_id.trim(),
        repair_mode: offerForm.repair_mode,
        estimated_cost: Number(offerForm.estimated_cost),
        estimated_time: Number(offerForm.estimated_time),
        ...(offerForm.message ? { message: offerForm.message } : {}),
      })
      setFormMsg('Offer submitted successfully!')
      setOfferForm({ request_id: '', repair_mode: 'onsite', estimated_cost: '', estimated_time: '', message: '' })
      setShowForm(false)
      await loadOffers()
    } catch (err) {
      setFormMsg(err instanceof ApiError ? err.message : 'Failed to submit offer')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link to="/dashboard" className="text-sm text-emerald-600 hover:text-emerald-500 dark:text-emerald-300">← Dashboard</Link>
              <h1 className="text-xl font-semibold">My Offers</h1>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowForm(!showForm)} className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500">
                {showForm ? 'Cancel' : '+ New Offer'}
              </button>
              <button type="button" onClick={onToggleTheme} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </button>
            </div>
          </div>
        </header>

        {formMsg && (
          <div className={`mt-4 rounded-xl border px-3 py-2 text-sm ${formMsg.includes('success') ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-300' : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300'}`}>
            {formMsg}
          </div>
        )}

        {/* New Offer Form */}
        {showForm && (
          <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-base font-semibold">Submit New Offer</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium">Request ID</label>
                <input value={offerForm.request_id} onChange={(e) => setOfferForm((p) => ({ ...p, request_id: e.target.value }))} placeholder="UUID of the service request" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Repair Mode</label>
                <select value={offerForm.repair_mode} onChange={(e) => setOfferForm((p) => ({ ...p, repair_mode: e.target.value }))} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800">
                  <option value="onsite">Onsite</option>
                  <option value="tow_to_garage">Tow to Garage</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Estimated Cost (₹)</label>
                <input type="number" value={offerForm.estimated_cost} onChange={(e) => setOfferForm((p) => ({ ...p, estimated_cost: e.target.value }))} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Estimated Time (minutes)</label>
                <input type="number" value={offerForm.estimated_time} onChange={(e) => setOfferForm((p) => ({ ...p, estimated_time: e.target.value }))} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium">Message (optional)</label>
                <textarea value={offerForm.message} onChange={(e) => setOfferForm((p) => ({ ...p, message: e.target.value }))} rows={2} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800" />
              </div>
              <div>
                <button type="button" onClick={handleSubmitOffer} disabled={submitting || !offerForm.request_id || !offerForm.estimated_cost || !offerForm.estimated_time} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60">
                  {submitting ? 'Submitting...' : 'Submit Offer'}
                </button>
              </div>
            </div>
          </section>
        )}

        {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">{error}</div>}

        {loading ? (
          <div className="mt-10 text-center text-sm text-slate-500">Loading offers...</div>
        ) : offers.length === 0 ? (
          <div className="mt-10 text-center text-sm text-slate-500">No offers yet. Submit your first offer to a service request!</div>
        ) : (
          <>
            <section className="mt-5 space-y-3">
              {offers.map((offer) => (
                <div key={offer.offer_id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{ISSUE_LABELS[offer.request?.issue_type] || offer.request?.issue_type} — {offer.request?.issue_description?.slice(0, 80)}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {offer.repair_mode === 'onsite' ? 'Onsite' : 'Tow to Garage'} · ₹{Number(offer.estimated_cost).toLocaleString()} · {offer.estimated_time} min
                      </p>
                      <p className="mt-1 text-xs text-slate-400">{new Date(offer.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[offer.status] || ''}`}>
                      {offer.status}
                    </span>
                  </div>
                </div>
              ))}
            </section>

            {/* Pagination */}
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

export default TechnicianOffersPage
