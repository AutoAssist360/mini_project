import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getVendorById, suspendVendor, unsuspendVendor, getVendorWarehouses } from '../lib/api'

const card = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900'
const btn  = 'rounded-lg px-3 py-1.5 text-xs font-semibold'
const badge = (c) => `inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${c}`

function AdminVendorDetailPage() {
  const { vendorId } = useParams()
  const [vendor, setVendor]     = useState(null)
  const [warehouses, setWarehouses] = useState([])
  const [whPag, setWhPag]       = useState({})
  const [whPage, setWhPage]     = useState(1)
  const [loading, setLoading]   = useState(true)
  const [busy, setBusy]         = useState(false)

  const load = useCallback(() => {
    getVendorById(vendorId).then((r) => setVendor(r.vendor || r)).catch(() => null).finally(() => setLoading(false))
  }, [vendorId])
  useEffect(() => { load() }, [load])

  const loadWh = useCallback(() => {
    getVendorWarehouses(vendorId, { page: whPage, limit: 10 }).then((r) => { setWarehouses(r.warehouses || []); setWhPag(r.pagination || {}) }).catch(() => null)
  }, [vendorId, whPage])
  useEffect(() => { loadWh() }, [loadWh])

  const act = async (fn) => { setBusy(true); try { await fn(vendorId); load() } catch { /* */ } setBusy(false) }

  if (loading) return <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center"><p className="text-slate-500">Loading…</p></div>
  if (!vendor) return <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center"><p className="text-slate-500">Vendor not found</p></div>

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <Link to="/admin/vendors" className="text-sm text-emerald-600 hover:underline dark:text-emerald-400">← Back to Vendors</Link>

        <div className={card + ' mt-4'}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold">{vendor.full_name}</h1>
              <p className="text-sm text-slate-500">{vendor.email} · {vendor.phone_number || 'No phone'}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className={badge(vendor.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200')}>{vendor.is_active ? 'Active' : 'Suspended'}</span>
              </div>
            </div>
            <div className="flex gap-2">
              {vendor.is_active
                ? <button disabled={busy} onClick={() => act(suspendVendor)} className={btn + ' bg-amber-600 text-white hover:bg-amber-500'}>Suspend</button>
                : <button disabled={busy} onClick={() => act(unsuspendVendor)} className={btn + ' bg-emerald-600 text-white hover:bg-emerald-500'}>Unsuspend</button>
              }
            </div>
          </div>
        </div>

        {/* counts */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className={card}><p className="text-xs text-slate-500 dark:text-slate-400">Warehouses</p><p className="mt-1 text-lg font-bold">{vendor._count?.warehouses ?? vendor.warehouses?.length ?? '--'}</p></div>
          <div className={card}><p className="text-xs text-slate-500 dark:text-slate-400">Orders</p><p className="mt-1 text-lg font-bold">{vendor._count?.orders ?? '--'}</p></div>
        </div>

        {/* warehouses */}
        <section className={card + ' mt-4'}>
          <h2 className="text-base font-semibold">Warehouses</h2>
          {warehouses.length === 0 && <p className="mt-2 text-sm text-slate-500">No warehouses</p>}
          {warehouses.length > 0 && (
            <>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead><tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="pb-2 pr-3">Name</th><th className="pb-2 pr-3">City</th><th className="pb-2 pr-3">State</th><th className="pb-2 pr-3">Active</th><th className="pb-2">Inventory</th>
                  </tr></thead>
                  <tbody>
                    {warehouses.map((w) => (
                      <tr key={w.warehouse_id} className="border-b border-slate-100 dark:border-slate-800">
                        <td className="py-2 pr-3"><Link to={`/admin/warehouses/${w.warehouse_id}`} className="text-emerald-600 hover:underline dark:text-emerald-400">{w.name}</Link></td>
                        <td className="py-2 pr-3">{w.city}</td>
                        <td className="py-2 pr-3">{w.state}</td>
                        <td className="py-2 pr-3">{w.is_active ? 'Yes' : <span className="text-red-500">No</span>}</td>
                        <td className="py-2">{w._count?.inventories ?? '--'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span>Page {whPag.page || 1} / {whPag.totalPages || 1}</span>
                <div className="flex gap-2">
                  <button disabled={whPage <= 1} onClick={() => setWhPage((p) => p - 1)} className={btn + ' border border-slate-300 dark:border-slate-700'}>Prev</button>
                  <button disabled={whPage >= (whPag.totalPages || 1)} onClick={() => setWhPage((p) => p + 1)} className={btn + ' border border-slate-300 dark:border-slate-700'}>Next</button>
                </div>
              </div>
            </>
          )}
        </section>

        <p className="mt-4 text-xs text-slate-400">Joined: {new Date(vendor.created_at).toLocaleString()}</p>
      </div>
    </div>
  )
}

export default AdminVendorDetailPage
