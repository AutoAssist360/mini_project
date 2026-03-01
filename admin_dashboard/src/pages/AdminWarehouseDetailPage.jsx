import { useEffect, useState, useCallback } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { getWarehouseById, getWarehouseInventory } from '../lib/api'

const card = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900'
const btn  = 'rounded-lg px-3 py-1.5 text-xs font-semibold'

function AdminWarehouseDetailPage() {
  const { warehouseId } = useParams()
  const [params, setParams] = useSearchParams()
  const invPage = Number(params.get('page')) || 1

  const [wh, setWh]           = useState(null)
  const [inv, setInv]         = useState({ inventory: [], pagination: {} })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getWarehouseById(warehouseId).then((r) => setWh(r.warehouse || r)).catch(() => null).finally(() => setLoading(false))
  }, [warehouseId])

  const loadInv = useCallback(() => {
    getWarehouseInventory(warehouseId, { page: invPage, limit: 15 }).then((r) => setInv(r)).catch(() => null)
  }, [warehouseId, invPage])
  useEffect(loadInv, [loadInv])

  const goPage = (p) => { const sp = new URLSearchParams(params); sp.set('page', p); setParams(sp) }

  if (loading) return <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center"><p className="text-slate-500">Loading…</p></div>
  if (!wh) return <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center"><p className="text-slate-500">Warehouse not found</p></div>

  const { inventory = [], pagination: pg = {} } = inv

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <Link to="/admin/warehouses" className="text-sm text-emerald-600 hover:underline dark:text-emerald-400">← Back to Warehouses</Link>

        {/* header */}
        <div className={card + ' mt-4'}>
          <h1 className="text-lg font-bold">{wh.name}</h1>
          <p className="mt-1 text-sm text-slate-500">{[wh.address_line, wh.city, wh.state, wh.zip_code, wh.country].filter(Boolean).join(', ')}</p>
          <div className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
            <p><strong>Active:</strong> {wh.is_active ? 'Yes' : 'No'}</p>
            <p><strong>Phone:</strong> {wh.phone || '--'}</p>
            <p><strong>Email:</strong> {wh.email || '--'}</p>
            <p><strong>Vendor:</strong> {wh.vendor?.user?.full_name ? <Link to={`/admin/vendors/${wh.vendor_id}`} className="text-emerald-600 hover:underline dark:text-emerald-400">{wh.vendor.user.full_name}</Link> : '--'}</p>
            <p><strong>Created:</strong> {new Date(wh.created_at).toLocaleDateString()}</p>
          </div>
          {wh.operating_hours && <p className="mt-2 text-sm"><strong>Hours:</strong> {wh.operating_hours}</p>}
        </div>

        {/* inventory */}
        <section className={card + ' mt-5'}>
          <h2 className="text-sm font-semibold">Inventory</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="pb-2 pr-3">Part Name</th><th className="pb-2 pr-3">Category</th><th className="pb-2 pr-3">Available</th><th className="pb-2 pr-3">Reserved</th><th className="pb-2 pr-3">Min Stock</th><th className="pb-2 pr-3">Reorder Lvl</th><th className="pb-2">Unit ₹</th>
              </tr></thead>
              <tbody>
                {inventory.map((i) => (
                  <tr key={i.inventory_id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-2 pr-3 font-medium">{i.part_name}</td>
                    <td className="py-2 pr-3 capitalize">{i.category?.replace(/_/g, ' ') || '--'}</td>
                    <td className="py-2 pr-3">{i.available_quantity}</td>
                    <td className="py-2 pr-3">{i.reserved_quantity}</td>
                    <td className="py-2 pr-3">{i.minimum_stock_level}</td>
                    <td className="py-2 pr-3">{i.reorder_level ?? '--'}</td>
                    <td className="py-2">{i.unit_cost}</td>
                  </tr>
                ))}
                {inventory.length === 0 && <tr><td colSpan="7" className="py-4 text-center text-slate-500">No inventory items</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        {pg.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-2">
            <button disabled={invPage <= 1} onClick={() => goPage(invPage - 1)} className={btn + ' border border-slate-300 dark:border-slate-700'}>Prev</button>
            <span className="text-sm">{invPage} / {pg.totalPages}</span>
            <button disabled={invPage >= pg.totalPages} onClick={() => goPage(invPage + 1)} className={btn + ' border border-slate-300 dark:border-slate-700'}>Next</button>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminWarehouseDetailPage
