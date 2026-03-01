import { useEffect, useState, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getAuditLogs } from '../lib/api'

const card = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900'
const btn  = 'rounded-lg px-3 py-1.5 text-xs font-semibold'

function AdminAuditLogsPage() {
  const [params, setParams] = useSearchParams()
  const page        = Number(params.get('page')) || 1
  const entityType  = params.get('entity_type') || ''
  const action      = params.get('action') || ''
  const performedBy = params.get('performed_by') || ''
  const from        = params.get('from') || ''
  const to          = params.get('to') || ''

  const [data, setData]       = useState({ logs: [], pagination: {} })
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    const q = { page, limit: 20 }
    if (entityType) q.entity_type = entityType
    if (action) q.action = action
    if (performedBy) q.performed_by = performedBy
    if (from) q.from = from
    if (to) q.to = to
    getAuditLogs(q).then((r) => setData(r)).catch(() => null).finally(() => setLoading(false))
  }, [page, entityType, action, performedBy, from, to])

  useEffect(() => { load() }, [load])

  const set = (k, v) => { const p = new URLSearchParams(params); if (v) p.set(k, v); else p.delete(k); p.delete('page'); setParams(p) }
  const goPage = (p) => { const sp = new URLSearchParams(params); sp.set('page', p); setParams(sp) }

  const { logs = [], pagination: pg = {} } = data

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Link to="/admin/dashboard" className="text-sm text-emerald-600 hover:underline dark:text-emerald-400">← Dashboard</Link>
        <h1 className="mt-2 text-xl font-bold">Audit Logs</h1>

        {/* filters */}
        <div className="mt-4 flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium mb-1">Entity Type</label>
            <select value={entityType} onChange={(e) => set('entity_type', e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900">
              <option value="">All</option>
              <option value="user">User</option>
              <option value="technician">Technician</option>
              <option value="vendor">Vendor</option>
              <option value="warehouse">Warehouse</option>
              <option value="service_request">Service Request</option>
              <option value="job">Job</option>
              <option value="order">Order</option>
              <option value="invoice">Invoice</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Action</label>
            <select value={action} onChange={(e) => set('action', e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900">
              <option value="">All</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="block">Block</option>
              <option value="unblock">Unblock</option>
              <option value="suspend">Suspend</option>
              <option value="unsuspend">Unsuspend</option>
              <option value="verify">Verify</option>
              <option value="refund">Refund</option>
              <option value="mark_paid">Mark Paid</option>
              <option value="force_assign">Force Assign</option>
              <option value="cancel">Cancel</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Performed By (UUID)</label>
            <input value={performedBy} onChange={(e) => set('performed_by', e.target.value)} placeholder="admin user id" className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900 w-52" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">From</label>
            <input type="date" value={from} onChange={(e) => set('from', e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">To</label>
            <input type="date" value={to} onChange={(e) => set('to', e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
          </div>
        </div>

        {/* table */}
        <section className={card + ' mt-5'}>
          {loading ? <p className="text-sm text-slate-500">Loading…</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead><tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="pb-2 pr-3">Time</th><th className="pb-2 pr-3">Entity</th><th className="pb-2 pr-3">Entity ID</th><th className="pb-2 pr-3">Action</th><th className="pb-2 pr-3">Performed By</th><th className="pb-2">Details</th>
                </tr></thead>
                <tbody>
                  {logs.map((l) => (
                    <tr key={l.log_id} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="py-2 pr-3 whitespace-nowrap">{new Date(l.created_at).toLocaleString()}</td>
                      <td className="py-2 pr-3 capitalize">{l.entity_type?.replace(/_/g, ' ')}</td>
                      <td className="py-2 pr-3 font-mono text-xs">{l.entity_id?.slice(0, 8)}…</td>
                      <td className="py-2 pr-3 capitalize">{l.action?.replace(/_/g, ' ')}</td>
                      <td className="py-2 pr-3">{l.performer?.full_name || l.performed_by?.slice(0, 8) || '--'}</td>
                      <td className="py-2 max-w-xs truncate">
                        {l.old_values && <span className="text-red-400 mr-2" title={JSON.stringify(l.old_values)}>old</span>}
                        {l.new_values && <span className="text-green-400" title={JSON.stringify(l.new_values)}>new</span>}
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 && <tr><td colSpan="6" className="py-4 text-center text-slate-500">No audit logs found</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* pagination */}
        {pg.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-2">
            <button disabled={page <= 1} onClick={() => goPage(page - 1)} className={btn + ' border border-slate-300 dark:border-slate-700'}>Prev</button>
            <span className="text-sm">{page} / {pg.totalPages}</span>
            <button disabled={page >= pg.totalPages} onClick={() => goPage(page + 1)} className={btn + ' border border-slate-300 dark:border-slate-700'}>Next</button>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminAuditLogsPage
