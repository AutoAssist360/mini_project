import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { addVehicle, ApiError, deleteVehicle, getMyVehicles, getVehicleVariants, updateVehicle, userLogout } from '../lib/api'
import { clearAuth } from '../store/authSlice'

function UserVehiclesPage({ theme, onToggleTheme }) {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const [vehicles, setVehicles] = useState([])
  const [variants, setVariants] = useState([])
  const [variantQuery, setVariantQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingVehicleId, setEditingVehicleId] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    variant_id: '',
    registration_number: '',
    vin_number: '',
  })

  const canSubmit = useMemo(() => {
    return form.variant_id && form.registration_number.trim() && form.vin_number.trim()
  }, [form])

  const loadVehicles = async () => {
    const response = await getMyVehicles()
    setVehicles(response?.vehicles || [])
  }

  const loadVariants = async (query = '') => {
    const response = await getVehicleVariants({ query, limit: 100 })
    setVariants(response?.variants || [])
  }

  const initializePage = async () => {
    setIsLoading(true)
    setError('')

    try {
      await Promise.all([loadVehicles(), loadVariants()])
    } catch (err) {
      if (err instanceof ApiError) setError(err.message)
      else setError('Unable to load vehicles data.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    initializePage()
  }, [])

  const handleSearchVariants = async () => {
    setError('')
    try {
      await loadVariants(variantQuery)
    } catch (err) {
      if (err instanceof ApiError) setError(err.message)
      else setError('Unable to search variants.')
    }
  }

  const resetForm = () => {
    setForm({ variant_id: '', registration_number: '', vin_number: '' })
    setEditingVehicleId(null)
  }

  const startEdit = (vehicle) => {
    setEditingVehicleId(vehicle.vehicle_id)
    setForm({
      variant_id: String(vehicle.variant_id || ''),
      registration_number: vehicle.registration_number || '',
      vin_number: vehicle.vin_number || '',
    })
    setMessage('')
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!canSubmit) return

    setIsSubmitting(true)
    setMessage('')
    setError('')

    try {
      const payload = {
        variant_id: Number(form.variant_id),
        registration_number: form.registration_number.trim().toUpperCase(),
        vin_number: form.vin_number.trim().toUpperCase(),
      }

      if (editingVehicleId) {
        await updateVehicle(editingVehicleId, payload)
        setMessage('Vehicle updated successfully.')
      } else {
        await addVehicle(payload)
        setMessage('Vehicle added successfully.')
      }

      await loadVehicles()
      resetForm()
    } catch (err) {
      if (err instanceof ApiError) setError(err.message)
      else setError('Unable to save vehicle.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (vehicleId) => {
    if (!window.confirm('Are you sure you want to delete this vehicle? This action cannot be undone.')) return

    setMessage('')
    setError('')

    try {
      await deleteVehicle(vehicleId)
      setMessage('Vehicle deleted successfully.')
      await loadVehicles()
      if (editingVehicleId === vehicleId) {
        resetForm()
      }
    } catch (err) {
      if (err instanceof ApiError) setError(err.message)
      else setError('Unable to delete vehicle.')
    }
  }

  const handleLogout = async () => {
    await userLogout().catch(() => null)
    dispatch(clearAuth())
    navigate('/auth/user/signin')
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-xl font-semibold">My Vehicles</h1>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={onToggleTheme} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</button>
              <Link to="/dashboard" className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">Dashboard</Link>
              <Link to="/requests/new" className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">Raise New Issue</Link>
              <button type="button" onClick={handleLogout} className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500">Logout</button>
            </div>
          </div>
        </header>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        )}

        {message && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-300">
            {message}
          </div>
        )}

        {isLoading ? (
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">Loading vehicles...</p>
        ) : (
          <main className="mt-5 grid gap-4 lg:grid-cols-2">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-base font-semibold">{editingVehicleId ? 'Edit Vehicle' : 'Add Vehicle'}</h2>

              <div className="mt-3 flex gap-2">
                <input value={variantQuery} onChange={(event) => setVariantQuery(event.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800" placeholder="Search company / model / variant" />
                <button type="button" onClick={handleSearchVariants} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">Search</button>
              </div>

              <form className="mt-4 grid gap-4" onSubmit={handleSubmit} noValidate>
                <div>
                  <label htmlFor="variant_id" className="mb-1 block text-sm font-medium">Vehicle Variant</label>
                  <select id="variant_id" value={form.variant_id} onChange={(event) => setForm((prev) => ({ ...prev, variant_id: event.target.value }))} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800">
                    <option value="">Select variant</option>
                    {variants.map((variant) => (
                      <option key={variant.variant_id} value={variant.variant_id}>
                        {variant.model?.company?.company_name || 'Company'} {variant.model?.model_name || 'Model'} {variant.variant_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="registration_number" className="mb-1 block text-sm font-medium">Registration Number</label>
                  <input id="registration_number" value={form.registration_number} onChange={(event) => setForm((prev) => ({ ...prev, registration_number: event.target.value }))} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800" placeholder="e.g. DL01AB1234" />
                </div>

                <div>
                  <label htmlFor="vin_number" className="mb-1 block text-sm font-medium">VIN Number</label>
                  <input id="vin_number" value={form.vin_number} onChange={(event) => setForm((prev) => ({ ...prev, vin_number: event.target.value }))} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800" placeholder="17 character VIN" />
                </div>

                <div className="flex flex-wrap gap-2">
                  <button type="submit" disabled={isSubmitting || !canSubmit} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60">
                    {isSubmitting ? 'Saving...' : editingVehicleId ? 'Update Vehicle' : 'Add Vehicle'}
                  </button>
                  {editingVehicleId && (
                    <button type="button" onClick={resetForm} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">
                      Cancel Edit
                    </button>
                  )}
                </div>
              </form>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-base font-semibold">Registered Vehicles</h2>

              {vehicles.length === 0 ? (
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">No vehicles added yet.</p>
              ) : (
                <div className="mt-3 grid gap-3">
                  {vehicles.map((vehicle) => (
                    <article key={vehicle.vehicle_id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                      <p className="text-sm font-semibold">{vehicle.variant?.model?.company?.company_name || 'Company'} {vehicle.variant?.model?.model_name || 'Model'} {vehicle.variant?.variant_name || 'Variant'}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Registration: {vehicle.registration_number}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">VIN: {vehicle.vin_number}</p>
                      <div className="mt-3 flex gap-2">
                        <button type="button" onClick={() => startEdit(vehicle)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">Edit</button>
                        <button type="button" onClick={() => handleDelete(vehicle.vehicle_id)} className="rounded-xl border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-900/20">Delete</button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </main>
        )}
      </div>
    </div>
  )
}

export default UserVehiclesPage
