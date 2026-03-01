import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  getInventory,
  addInventory,
  updateInventory,
  deleteInventory,
  ApiError,
} from '../lib/api'

function VendorInventoryPage({ theme, onToggleTheme }) {
  const { warehouseId } = useParams()
  const [inventory, setInventory] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionMsg, setActionMsg] = useState('')

  // Form
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const emptyForm = { part_id: '', quantity_available: '', unit_cost: '', reorder_level: '0' }
  const [form, setForm] = useState(emptyForm)

  const limit = 20

  const loadInventory = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getInventory(warehouseId, page, limit, lowStockOnly)
      setInventory(res?.inventory ?? [])
      setTotal(res?.total ?? 0)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }, [warehouseId, page, lowStockOnly])

  useEffect(() => { loadInventory() }, [loadInventory])

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const openCreate = () => { setEditId(null); setForm(emptyForm); setShowForm(true) }
  const openEdit = (item) => {
    setEditId(item.inventory_id)
    setForm({
      part_id: item.part_id?.toString() || '',
      quantity_available: item.quantity_available?.toString() || '',
      unit_cost: item.unit_cost?.toString() || '',
      reorder_level: item.reorder_level?.toString() || '0',
    })
    setShowForm(true)
  }
  const cancelForm = () => { setShowForm(false); setEditId(null); setForm(emptyForm) }

  const handleSave = async () => {
    setSaving(true)
    setActionMsg('')
    try {
      if (editId) {
        await updateInventory(editId, {
          quantity_available: Number(form.quantity_available),
          unit_cost: Number(form.unit_cost),
          reorder_level: Number(form.reorder_level),
        })
        setActionMsg('Inventory updated!')
      } else {
        await addInventory(warehouseId, {
          part_id: Number(form.part_id),
          quantity_available: Number(form.quantity_available),
          unit_cost: Number(form.unit_cost),
          reorder_level: Number(form.reorder_level),
        })
        setActionMsg('Inventory added!')
      }
      cancelForm()
      await loadInventory()
    } catch (err) {
      setActionMsg(err instanceof ApiError ? err.message : 'Failed to save inventory')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (inventoryId) => {
    setActionMsg('')
    try {
      await deleteInventory(inventoryId)
      setActionMsg('Inventory deleted')
      await loadInventory()
    } catch (err) {
      setActionMsg(err instanceof ApiError ? err.message : 'Failed to delete')
    }
  }

  const totalPages = Math.ceil(total / limit) || 1

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link to="/warehouses" className="text-sm text-emerald-600 hover:text-emerald-500 dark:text-emerald-300">← Warehouses</Link>
              <h1 className="text-xl font-semibold">Inventory</h1>
              <span className="text-xs text-slate-400">{warehouseId?.slice(0, 8)}...</span>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => { setLowStockOnly(!lowStockOnly); setPage(1) }} className={`rounded-xl border px-3 py-2 text-xs font-medium ${lowStockOnly ? 'border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300' : 'border-slate-300 dark:border-slate-700'}`}>
                {lowStockOnly ? '✓ Low Stock' : 'Low Stock'}
              </button>
              <button type="button" onClick={openCreate} className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500">+ Add Item</button>
              <button type="button" onClick={onToggleTheme} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</button>
            </div>
          </div>
        </header>

        {actionMsg && (
          <div className={`mt-4 rounded-xl border px-3 py-2 text-sm ${actionMsg.includes('!') || actionMsg.includes('deleted') ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-300' : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300'}`}>
            {actionMsg}
          </div>
        )}
        {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">{error}</div>}

        {/* Form */}
        {showForm && (
          <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-base font-semibold">{editId ? 'Edit Inventory' : 'Add Inventory Item'}</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {!editId && (
                <div>
                  <label className="mb-1 block text-sm font-medium">Part ID</label>
                  <input type="number" value={form.part_id} onChange={handleChange('part_id')} placeholder="e.g. 1" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800" />
                </div>
              )}
              <div>
                <label className="mb-1 block text-sm font-medium">Quantity Available</label>
                <input type="number" value={form.quantity_available} onChange={handleChange('quantity_available')} placeholder="0" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Unit Cost (₹)</label>
                <input type="number" value={form.unit_cost} onChange={handleChange('unit_cost')} placeholder="0.00" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Reorder Level</label>
                <input type="number" value={form.reorder_level} onChange={handleChange('reorder_level')} placeholder="0" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800" />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={handleSave} disabled={saving || (!editId && !form.part_id) || !form.quantity_available || !form.unit_cost} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60">
                {saving ? 'Saving...' : editId ? 'Update' : 'Add'}
              </button>
              <button type="button" onClick={cancelForm} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">Cancel</button>
            </div>
          </section>
        )}

        {/* List */}
        {loading ? (
          <div className="mt-10 text-center text-sm text-slate-500">Loading...</div>
        ) : inventory.length === 0 ? (
          <div className="mt-10 text-center text-sm text-slate-500">{lowStockOnly ? 'No low stock items.' : 'No inventory items yet.'}</div>
        ) : (
          <>
            <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase text-slate-500 dark:border-slate-700">
                    <th className="px-4 py-3">Part</th>
                    <th className="px-4 py-3 text-right">Available</th>
                    <th className="px-4 py-3 text-right">Reserved</th>
                    <th className="px-4 py-3 text-right">Unit Cost</th>
                    <th className="px-4 py-3 text-right">Reorder Lvl</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((item) => {
                    const isLow = item.reorder_level > 0 && item.quantity_available <= item.reorder_level
                    return (
                      <tr key={item.inventory_id} className={`border-b border-slate-100 dark:border-slate-800 ${isLow ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}`}>
                        <td className="px-4 py-3 font-medium">
                          {item.part?.part_name || `Part #${item.part_id}`}
                          {isLow && <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">LOW</span>}
                        </td>
                        <td className="px-4 py-3 text-right">{item.quantity_available}</td>
                        <td className="px-4 py-3 text-right">{item.quantity_reserved}</td>
                        <td className="px-4 py-3 text-right">₹{Number(item.unit_cost).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right">{item.reorder_level}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <button type="button" onClick={() => openEdit(item)} className="rounded-lg border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">Edit</button>
                            <button type="button" onClick={() => handleDelete(item.inventory_id)} className="rounded-lg border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20">Del</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="mt-3 flex items-center justify-center gap-2">
                <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs disabled:opacity-40 dark:border-slate-700">Prev</button>
                <span className="text-xs text-slate-500">{page}/{totalPages}</span>
                <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs disabled:opacity-40 dark:border-slate-700">Next</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default VendorInventoryPage
