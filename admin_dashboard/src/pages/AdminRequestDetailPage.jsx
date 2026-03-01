import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getRequestById, cancelRequest, forceAssignTechnician } from '../lib/api'

const card = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900'
const btn  = 'rounded-lg px-3 py-1.5 text-xs font-semibold'
const badge = (c) => `inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${c}`

function AdminRequestDetailPage() {
  const { requestId } = useParams()
  const [req, setReq]         = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy]       = useState(false)
  const [err, setErr]         = useState('')

  // force-assign form
  const [showAssign, setShowAssign] = useState(false)
  const [assignForm, setAssignForm] = useState({ technician_id: '', repair_mode: 'onsite', estimated_cost: '', estimated_time: '' })

  const load = useCallback(() => {
    getRequestById(requestId).then((r) => setReq(r.request || r)).catch(() => null).finally(() => setLoading(false))
  }, [requestId])
  useEffect(() => { load() }, [load])

  const handleCancel = async () => {
    if (!confirm('Force-cancel this request?')) return
    setBusy(true); setErr('')
    try { await cancelRequest(requestId); load() } catch (e) { setErr(e.message) }
    setBusy(false)
  }

  const handleAssign = async (e) => {
    e.preventDefault()
    setBusy(true); setErr('')
    try {
      await forceAssignTechnician(requestId, {
        technician_id: assignForm.technician_id,
        repair_mode: assignForm.repair_mode,
        estimated_cost: Number(assignForm.estimated_cost),
        estimated_time: Number(assignForm.estimated_time),
      })
      setShowAssign(false)
      load()
    } catch (ex) { setErr(ex.message) }
    setBusy(false)
  }

  if (loading) return <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center"><p className="text-slate-500">Loading…</p></div>
  if (!req) return <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center"><p className="text-slate-500">Request not found</p></div>

  const canCancel = ['created', 'pending_offers', 'offer_accepted', 'in_progress'].includes(req.status)
  const canAssign = ['created', 'pending_offers'].includes(req.status)

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <Link to="/admin/requests" className="text-sm text-emerald-600 hover:underline dark:text-emerald-400">← Back to Requests</Link>

        {err && <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">{err}</div>}

        {/* header */}
        <div className={card + ' mt-4'}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-lg font-bold">Request {req.request_id.slice(0, 8)}…</h1>
              <div className="mt-1 flex flex-wrap gap-2">
                <span className={badge('bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 capitalize')}>{req.issue_type?.replace(/_/g, ' ')}</span>
                <span className={badge('bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200')}>{req.status?.replace(/_/g, ' ')}</span>
                {req.requires_towing && <span className={badge('bg-amber-100 text-amber-800')}>Towing required</span>}
              </div>
              <p className="mt-2 text-sm">{req.issue_description}</p>
            </div>
            <div className="flex gap-2">
              {canCancel && <button disabled={busy} onClick={handleCancel} className={btn + ' bg-red-600 text-white hover:bg-red-500'}>Cancel Request</button>}
              {canAssign && <button onClick={() => setShowAssign(!showAssign)} className={btn + ' bg-indigo-600 text-white hover:bg-indigo-500'}>{showAssign ? 'Hide' : 'Force Assign'}</button>}
            </div>
          </div>
        </div>

        {/* force-assign form */}
        {showAssign && (
          <form onSubmit={handleAssign} className={card + ' mt-4 grid gap-3 sm:grid-cols-2'}>
            <div>
              <label className="mb-1 block text-xs font-medium">Technician ID (UUID)</label>
              <input required value={assignForm.technician_id} onChange={(e) => setAssignForm((p) => ({ ...p, technician_id: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Repair Mode</label>
              <select value={assignForm.repair_mode} onChange={(e) => setAssignForm((p) => ({ ...p, repair_mode: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800">
                <option value="onsite">Onsite</option>
                <option value="tow_to_garage">Tow to Garage</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Estimated Cost</label>
              <input required type="number" min="0" step="0.01" value={assignForm.estimated_cost} onChange={(e) => setAssignForm((p) => ({ ...p, estimated_cost: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Estimated Time (min)</label>
              <input required type="number" min="1" value={assignForm.estimated_time} onChange={(e) => setAssignForm((p) => ({ ...p, estimated_time: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800" />
            </div>
            <div className="sm:col-span-2"><button type="submit" disabled={busy} className={btn + ' bg-emerald-600 text-white hover:bg-emerald-500'}>Assign Technician</button></div>
          </form>
        )}

        {/* user & vehicle */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className={card}>
            <h3 className="text-sm font-semibold">User</h3>
            <p className="mt-1 text-sm">{req.user?.full_name || '--'} ({req.user?.email})</p>
          </div>
          <div className={card}>
            <h3 className="text-sm font-semibold">Vehicle</h3>
            <p className="mt-1 text-sm">{req.vehicle?.registration_number || '--'} {req.vehicle?.variant?.variant_name ? `· ${req.vehicle.variant.model?.company?.company_name || ''} ${req.vehicle.variant.model?.model_name || ''} ${req.vehicle.variant.variant_name}` : ''}</p>
          </div>
        </div>

        {/* parts */}
        {req.parts?.length > 0 && (
          <section className={card + ' mt-4'}>
            <h2 className="text-sm font-semibold">Requested Parts</h2>
            <ul className="mt-2 list-inside list-disc text-sm">
              {req.parts.map((p) => <li key={p.request_part_id}>{p.part?.part_name || `Part #${p.part_id}`} × {p.quantity}</li>)}
            </ul>
          </section>
        )}

        {/* media */}
        {req.media?.length > 0 && (
          <section className={card + ' mt-4'}>
            <h2 className="text-sm font-semibold">Media ({req.media.length})</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {req.media.map((m) => (
                <a key={m.media_id} href={m.media_url} target="_blank" rel="noreferrer" className="text-xs text-emerald-600 underline">{m.media_type} →</a>
              ))}
            </div>
          </section>
        )}

        {/* offers */}
        {req.offers?.length > 0 && (
          <section className={card + ' mt-4'}>
            <h2 className="text-sm font-semibold">Offers ({req.offers.length})</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead><tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="pb-2 pr-3">Technician</th><th className="pb-2 pr-3">Mode</th><th className="pb-2 pr-3">Cost</th><th className="pb-2 pr-3">Time</th><th className="pb-2">Status</th>
                </tr></thead>
                <tbody>
                  {req.offers.map((o) => (
                    <tr key={o.offer_id} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="py-2 pr-3"><Link to={`/admin/technicians/${o.technician_id}`} className="text-emerald-600 hover:underline dark:text-emerald-400">{o.technician?.user?.full_name || o.technician_id.slice(0, 8)}</Link></td>
                      <td className="py-2 pr-3 capitalize">{o.repair_mode?.replace(/_/g, ' ')}</td>
                      <td className="py-2 pr-3">₹{o.estimated_cost}</td>
                      <td className="py-2 pr-3">{o.estimated_time} min</td>
                      <td className="py-2"><span className={badge('bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300')}>{o.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* job */}
        {req.job && (
          <section className={card + ' mt-4'}>
            <h2 className="text-sm font-semibold">Job</h2>
            <div className="mt-2 grid gap-2 text-sm sm:grid-cols-3">
              <p><strong>Status:</strong> {req.job.status}</p>
              <p><strong>Technician:</strong> <Link to={`/admin/technicians/${req.job.technician_id}`} className="text-emerald-600 hover:underline dark:text-emerald-400">{req.job.technician?.user?.full_name || '--'}</Link></p>
              <p><strong>Started:</strong> {req.job.started_at ? new Date(req.job.started_at).toLocaleString() : '--'}</p>
            </div>
            <Link to={`/admin/jobs/${req.job.job_id}`} className="mt-2 inline-block text-sm text-emerald-600 hover:underline dark:text-emerald-400">View job detail →</Link>
          </section>
        )}

        {/* messages (last 10) */}
        {req.messages?.length > 0 && (
          <section className={card + ' mt-4'}>
            <h2 className="text-sm font-semibold">Recent Messages</h2>
            <div className="mt-2 max-h-60 space-y-2 overflow-y-auto text-sm">
              {req.messages.map((m) => (
                <div key={m.message_id} className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800">
                  <p className="text-xs text-slate-500">{m.sender?.full_name || 'Unknown'} · {new Date(m.sent_at).toLocaleString()}</p>
                  <p className="mt-1">{m.message}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <p className="mt-4 text-xs text-slate-400">Created: {new Date(req.created_at).toLocaleString()}</p>
      </div>
    </div>
  )
}

export default AdminRequestDetailPage
