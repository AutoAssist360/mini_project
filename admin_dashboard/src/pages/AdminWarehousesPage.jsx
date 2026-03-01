import { useEffect, useState, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getWarehouses } from '../lib/api'

const card = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900'
const btn  = 'rounded-lg px-3 py-1.5 text-xs font-semibold'

function AdminWarehousesPage() {
  const [params, setParams] = useSearchParams()
  const page   = Number(params.get('page')) || 1
  const search = params.get('search') || ''
  const city   = params.get('city') || ''
  const state  = params.get('state') || ''

  const [data, setData]       = useState({ warehouses: [], pagination: {} })
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    const q = { page, limit: 15 }
    if (search) q.search = search
    if (city) q.city = city
    if (state) q.state = state
    getWarehouses(q).then((r) => setData(r)).catch(() => null).finally(() => setLoading(false))
  }, [page, search, city, state])

  useEffect(() => { load() }, [load])

  const set = (k, v) => { const p = new URLSearchParams(params); if (v) p.set(k, v); else p.delete(k); p.delete('page'); setParams(p) }
  const goPage = (p) => { const sp = new URLSearchParams(params); sp.set('page', p); setParams(sp) }

  const { warehouses = [], pagination: pg = {} } = data

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Link to="/admin/dashboard" className="text-sm text-emerald-600 hover:underline dark:text-emerald-400">← Dashboard</Link>
        <h1 className="mt-2 text-xl font-bold">Warehouses</h1>

        {/* filters */}
        <div className="mt-4 flex flex-wrap gap-3">
          <input value={search} onChange={(e) => set('search', e.target.value)} placeholder="Search name / address…" className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900 w-56" />
          <input value={city} onChange={(e) => set('city', e.target.value)} placeholder="Filter by city" className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900 w-40" />
          <input value={state} onChange={(e) => set('state', e.target.value)} placeholder="Filter by state" className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900 w-40" />
        </div>

        {/* table */}
        <section className={card + ' mt-5'}>
          {loading ? <p className="text-sm text-slate-500">Loading…</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead><tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="pb-2 pr-3">Name</th><th className="pb-2 pr-3">City</th><th className="pb-2 pr-3">State</th><th className="pb-2 pr-3">Active</th><th className="pb-2 pr-3">Vendor</th><th className="pb-2">Actions</th>
                </tr></thead>
                <tbody>
                  {warehouses.map((w) => (
                    <tr key={w.warehouse_id} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="py-2 pr-3 font-medium">{w.name}</td>
                      <td className="py-2 pr-3">{w.city || '--'}</td>
                      <td className="py-2 pr-3">{w.state || '--'}</td>
                      <td className="py-2 pr-3">{w.is_active ? '✓' : '✗'}</td>
                      <td className="py-2 pr-3">{w.vendor?.user?.full_name || '--'}</td>
                      <td className="py-2"><Link to={`/admin/warehouses/${w.warehouse_id}`} className="text-emerald-600 hover:underline dark:text-emerald-400">View</Link></td>
                    </tr>
                  ))}
                  {warehouses.length === 0 && <tr><td colSpan="6" className="py-4 text-center text-slate-500">No warehouses found</td></tr>}
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

export default AdminWarehousesPage
