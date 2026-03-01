import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getWarehouses,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  ApiError,
} from '../lib/api'

function VendorWarehousesPage({ theme, onToggleTheme }) {
  const [warehouses, setWarehouses] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionMsg, setActionMsg] = useState('')

  // Create form
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState(null)
  const emptyForm = { name: '', address: '', city: '', state: '', postal_code: '', latitude: '', longitude: '', phone: '' }
  const [form, setForm] = useState(emptyForm)

  const limit = 10

  const loadWarehouses = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getWarehouses(page, limit)
      setWarehouses(res?.warehouses ?? [])
      setTotal(res?.total ?? 0)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load warehouses')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { loadWarehouses() }, [loadWarehouses])

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const openCreate = () => { setEditId(null); setForm(emptyForm); setShowForm(true) }
  const openEdit = (w) => {
    setEditId(w.warehouse_id)
    setForm({
      name: w.name || '', address: w.address || '', city: w.city || '', state: w.state || '',
      postal_code: w.postal_code || '', latitude: w.latitude ?? '', longitude: w.longitude ?? '', phone: w.phone || '',
    })
    setShowForm(true)
  }
  const cancelForm = () => { setShowForm(false); setEditId(null); setForm(emptyForm) }

  const handleSave = async () => {
    setSaving(true)
    setActionMsg('')
    try {
      const payload = {
        name: form.name,
        address: form.address,
        city: form.city,
        state: form.state,
        postal_code: form.postal_code,
        ...(form.latitude ? { latitude: Number(form.latitude) } : {}),
        ...(form.longitude ? { longitude: Number(form.longitude) } : {}),
        ...(form.phone ? { phone: form.phone } : {}),
      }
      if (editId) {
        await updateWarehouse(editId, payload)
        setActionMsg('Warehouse updated!')
      } else {
        await createWarehouse(payload)
        setActionMsg('Warehouse created!')
      }
      cancelForm()
      await loadWarehouses()
    } catch (err) {
      setActionMsg(err instanceof ApiError ? err.message : 'Failed to save warehouse')
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivate = async (warehouseId) => {
    setActionMsg('')
    try {
      await deleteWarehouse(warehouseId)
      setActionMsg('Warehouse deactivated')
      await loadWarehouses()
    } catch (err) {
      setActionMsg(err instanceof ApiError ? err.message : 'Failed to deactivate')
    }
  }

  const totalPages = Math.ceil(total / limit) || 1

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link to="/dashboard" className="text-sm text-emerald-600 hover:text-emerald-500 dark:text-emerald-300">← Dashboard</Link>
              <h1 className="text-xl font-semibold">Warehouses</h1>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={openCreate} className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500">+ New Warehouse</button>
              <button type="button" onClick={onToggleTheme} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</button>
            </div>
          </div>
        </header>

        {actionMsg && (
          <div className={`mt-4 rounded-xl border px-3 py-2 text-sm ${actionMsg.includes('!') || actionMsg.includes('deactivated') ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-300' : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300'}`}>
            {actionMsg}
          </div>
        )}

        {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">{error}</div>}

        {/* Create/Edit Form */}
        {showForm && (
          <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-base font-semibold">{editId ? 'Edit Warehouse' : 'New Warehouse'}</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {[
                { field: 'name', label: 'Name', type: 'text', placeholder: 'Warehouse name' },
                { field: 'address', label: 'Address', type: 'text', placeholder: 'Full address' },
                { field: 'city', label: 'City', type: 'text', placeholder: 'City' },
                { field: 'state', label: 'State', type: 'text', placeholder: 'State' },
                { field: 'postal_code', label: 'Postal Code', type: 'text', placeholder: '6 digits' },
                { field: 'phone', label: 'Phone', type: 'text', placeholder: '10 digits (optional)' },
                { field: 'latitude', label: 'Latitude', type: 'number', placeholder: '0.0' },
                { field: 'longitude', label: 'Longitude', type: 'number', placeholder: '0.0' },
              ].map((f) => (
                <div key={f.field}>
                  <label className="mb-1 block text-sm font-medium">{f.label}</label>
                  <input type={f.type} value={form[f.field]} onChange={handleChange(f.field)} placeholder={f.placeholder} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800" />
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={handleSave} disabled={saving || !form.name || !form.address || !form.city || !form.state || !form.postal_code} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60">
                {saving ? 'Saving...' : editId ? 'Update' : 'Create'}
              </button>
              <button type="button" onClick={cancelForm} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">Cancel</button>
            </div>
          </section>
        )}

        {/* Warehouse list */}
        {loading ? (
          <div className="mt-10 text-center text-sm text-slate-500">Loading...</div>
        ) : warehouses.length === 0 ? (
          <div className="mt-10 text-center text-sm text-slate-500">No warehouses yet. Create one above.</div>
        ) : (
          <section className="mt-5 space-y-3">
            {warehouses.map((w) => (
              <div key={w.warehouse_id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{w.name}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${w.is_active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>
                        {w.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{w.address}, {w.city}, {w.state} {w.postal_code}</p>
                    {w.phone && <p className="text-xs text-slate-500">{w.phone}</p>}
                    <p className="mt-1 text-xs text-slate-400">
                      Items: {w._count?.inventories ?? '?'} · Orders: {w._count?.orders ?? '?'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/warehouses/${w.warehouse_id}/inventory`} className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">Inventory</Link>
                    <button type="button" onClick={() => openEdit(w)} className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">Edit</button>
                    {w.is_active && (
                      <button type="button" onClick={() => handleDeactivate(w.warehouse_id)} className="rounded-xl border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20">Deactivate</button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs disabled:opacity-40 dark:border-slate-700">Prev</button>
                <span className="text-xs text-slate-500">{page}/{totalPages}</span>
                <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs disabled:opacity-40 dark:border-slate-700">Next</button>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}

export default VendorWarehousesPage
