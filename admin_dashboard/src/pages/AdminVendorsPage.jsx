import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getVendors, suspendVendor, unsuspendVendor } from '../lib/api'

const card = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900'
const btn  = 'rounded-lg px-3 py-1.5 text-xs font-semibold'

function AdminVendorsPage() {
  const [vendors, setVendors]     = useState([])
  const [pagination, setPagination] = useState({})
  const [page, setPage]           = useState(1)
  const [search, setSearch]       = useState('')
  const [activeFilter, setActiveFilter] = useState('')
  const [loading, setLoading]     = useState(true)
  const [busy, setBusy]           = useState(null)

  const load = useCallback(() => {
    getVendors({ page, limit: 15, search: search || undefined, is_active: activeFilter || undefined })
      .then((r) => { setVendors(r.vendors || []); setPagination(r.pagination || {}) })
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [page, search, activeFilter])

  useEffect(() => { load() }, [load])

  const act = async (fn, id) => { setBusy(id); try { await fn(id); load() } catch { /* */ } setBusy(null) }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Vendors</h1>
          <Link to="/admin/dashboard" className="text-sm text-emerald-600 hover:underline dark:text-emerald-400">← Dashboard</Link>
        </div>

        <div className={'mt-4 flex flex-wrap gap-3 ' + card}>
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Search name / email…" className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800" />
          <select value={activeFilter} onChange={(e) => { setActiveFilter(e.target.value); setPage(1) }} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800">
            <option value="">All</option>
            <option value="true">Active</option>
            <option value="false">Suspended</option>
          </select>
        </div>

        {loading && <p className="mt-6 text-center text-sm text-slate-500">Loading…</p>}

        {!loading && (
          <>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead><tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="pb-2 pr-3">Name</th><th className="pb-2 pr-3">Email</th><th className="pb-2 pr-3">Phone</th><th className="pb-2 pr-3">Warehouses</th><th className="pb-2 pr-3">Orders</th><th className="pb-2 pr-3">Active</th><th className="pb-2">Actions</th>
                </tr></thead>
                <tbody>
                  {vendors.map((v) => (
                    <tr key={v.user_id} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="py-2 pr-3"><Link to={`/admin/vendors/${v.user_id}`} className="text-emerald-600 hover:underline dark:text-emerald-400">{v.full_name}</Link></td>
                      <td className="py-2 pr-3">{v.email}</td>
                      <td className="py-2 pr-3">{v.phone_number || '--'}</td>
                      <td className="py-2 pr-3">{v._count?.warehouses ?? '--'}</td>
                      <td className="py-2 pr-3">{v._count?.orders ?? '--'}</td>
                      <td className="py-2 pr-3">{v.is_active ? <span className="text-green-600">Yes</span> : <span className="text-red-500">No</span>}</td>
                      <td className="flex gap-1 py-2">
                        {v.is_active
                          ? <button disabled={busy === v.user_id} onClick={() => act(suspendVendor, v.user_id)} className={btn + ' bg-amber-600 text-white hover:bg-amber-500'}>Suspend</button>
                          : <button disabled={busy === v.user_id} onClick={() => act(unsuspendVendor, v.user_id)} className={btn + ' bg-emerald-600 text-white hover:bg-emerald-500'}>Unsuspend</button>
                        }
                      </td>
                    </tr>
                  ))}
                  {vendors.length === 0 && <tr><td colSpan={7} className="py-6 text-center text-slate-500">No vendors found</td></tr>}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm">
              <span>Page {pagination.page || 1} of {pagination.totalPages || 1}</span>
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

export default AdminVendorsPage
