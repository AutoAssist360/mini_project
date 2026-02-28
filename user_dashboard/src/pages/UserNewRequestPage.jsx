import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { ApiError, createServiceRequest, getMyVehicles, userLogout } from '../lib/api'
import { clearAuth } from '../store/authSlice'

function UserNewRequestPage({ theme, onToggleTheme }) {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const [vehicles, setVehicles] = useState([])
  const [isVehiclesLoading, setIsVehiclesLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState({
    vehicle_id: '',
    issue_description: '',
    issue_type: '',
    form: '',
  })

  const [form, setForm] = useState({
    vehicle_id: '',
    issue_description: '',
    issue_type: 'mechanical_failure',
    breakdown_latitude: '',
    breakdown_longitude: '',
    service_location_type: 'roadside',
    requires_towing: false,
  })

  useEffect(() => {
    const loadVehicles = async () => {
      setIsVehiclesLoading(true)
      setErrors((prev) => ({ ...prev, form: '' }))

      try {
        const response = await getMyVehicles()
        const vehicleList = response?.vehicles || []
        setVehicles(vehicleList)
        if (vehicleList.length > 0) {
          setForm((prev) => ({ ...prev, vehicle_id: prev.vehicle_id || vehicleList[0].vehicle_id }))
        }
      } catch (err) {
        if (err instanceof ApiError) setErrors((prev) => ({ ...prev, form: err.message }))
        else setErrors((prev) => ({ ...prev, form: 'Unable to load vehicles.' }))
      } finally {
        setIsVehiclesLoading(false)
      }
    }

    loadVehicles()
  }, [])

  const canSubmit = useMemo(() => {
    return !isSubmitting && form.vehicle_id && form.issue_description.trim() && form.issue_type
  }, [isSubmitting, form])

  const handleChange = (field) => (event) => {
    const value = field === 'requires_towing' ? event.target.checked : event.target.value
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: '', form: '' }))
  }

  const validate = () => {
    const nextErrors = { vehicle_id: '', issue_description: '', issue_type: '', form: '' }

    if (!form.vehicle_id) nextErrors.vehicle_id = 'Please select a vehicle'
    if (!form.issue_description.trim()) nextErrors.issue_description = 'Issue description is required'
    if (!form.issue_type) nextErrors.issue_type = 'Issue type is required'

    setErrors(nextErrors)
    return !Object.values(nextErrors).some(Boolean)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    setErrors((prev) => ({ ...prev, form: '' }))

    try {
      const payload = {
        vehicle_id: form.vehicle_id,
        issue_description: form.issue_description.trim(),
        issue_type: form.issue_type,
        service_location_type: form.service_location_type,
        requires_towing: form.requires_towing,
      }

      if (form.breakdown_latitude !== '') payload.breakdown_latitude = Number(form.breakdown_latitude)
      if (form.breakdown_longitude !== '') payload.breakdown_longitude = Number(form.breakdown_longitude)

      const response = await createServiceRequest(payload)
      const requestId = response?.serviceRequest?.request_id

      if (requestId) {
        navigate(`/requests/${requestId}`)
      } else {
        navigate('/requests')
      }
    } catch (err) {
      if (err instanceof ApiError) setErrors((prev) => ({ ...prev, form: err.message }))
      else setErrors((prev) => ({ ...prev, form: 'Unable to create request. Please try again.' }))
    } finally {
      setIsSubmitting(false)
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
            <h1 className="text-xl font-semibold">Raise New Issue</h1>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={onToggleTheme} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</button>
              <Link to="/requests" className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">My Requests</Link>
              <button type="button" onClick={handleLogout} className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500">Logout</button>
            </div>
          </div>
        </header>

        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {isVehiclesLoading ? (
            <p className="text-sm text-slate-600 dark:text-slate-300">Loading vehicles...</p>
          ) : vehicles.length === 0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300">
              <p>You do not have any vehicles yet.</p>
              <Link to="/vehicles" className="mt-2 inline-block font-semibold text-amber-800 underline dark:text-amber-200">Go to vehicle management</Link>
            </div>
          ) : (
            <form className="grid gap-4" onSubmit={handleSubmit} noValidate>
              <div>
                <label htmlFor="vehicle_id" className="mb-1 block text-sm font-medium">Vehicle</label>
                <select id="vehicle_id" value={form.vehicle_id} onChange={handleChange('vehicle_id')} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800">
                  {vehicles.map((vehicle) => {
                    const company = vehicle.variant?.model?.company?.company_name || 'Company'
                    const model = vehicle.variant?.model?.model_name || 'Model'
                    const variant = vehicle.variant?.variant_name || 'Variant'
                    return (
                      <option key={vehicle.vehicle_id} value={vehicle.vehicle_id}>
                        {company} {model} {variant} ({vehicle.registration_number})
                      </option>
                    )
                  })}
                </select>
                {errors.vehicle_id && <p className="mt-1 text-xs text-red-600">{errors.vehicle_id}</p>}
              </div>

              <div>
                <label htmlFor="issue_type" className="mb-1 block text-sm font-medium">Issue type</label>
                <select id="issue_type" value={form.issue_type} onChange={handleChange('issue_type')} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800">
                  <option value="mechanical_failure">Mechanical failure</option>
                  <option value="electrical_issue">Electrical issue</option>
                  <option value="tire_related">Tire related</option>
                  <option value="battery_issue">Battery issue</option>
                  <option value="engine_problem">Engine problem</option>
                  <option value="brake_issue">Brake issue</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="issue_description" className="mb-1 block text-sm font-medium">Issue description</label>
                <textarea id="issue_description" rows={4} value={form.issue_description} onChange={handleChange('issue_description')} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800" placeholder="Describe the issue in detail" />
                {errors.issue_description && <p className="mt-1 text-xs text-red-600">{errors.issue_description}</p>}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="breakdown_latitude" className="mb-1 block text-sm font-medium">Latitude (optional)</label>
                  <input id="breakdown_latitude" type="number" step="any" value={form.breakdown_latitude} onChange={handleChange('breakdown_latitude')} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800" placeholder="e.g. 28.6139" />
                </div>
                <div>
                  <label htmlFor="breakdown_longitude" className="mb-1 block text-sm font-medium">Longitude (optional)</label>
                  <input id="breakdown_longitude" type="number" step="any" value={form.breakdown_longitude} onChange={handleChange('breakdown_longitude')} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800" placeholder="e.g. 77.2090" />
                </div>
              </div>

              <div>
                <label htmlFor="service_location_type" className="mb-1 block text-sm font-medium">Service location type</label>
                <select id="service_location_type" value={form.service_location_type} onChange={handleChange('service_location_type')} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800">
                  <option value="roadside">Roadside</option>
                  <option value="home">Home</option>
                  <option value="office">Office</option>
                </select>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.requires_towing} onChange={handleChange('requires_towing')} />
                Requires towing service
              </label>

              {errors.form && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
                  {errors.form}
                </div>
              )}

              <button type="submit" disabled={!canSubmit} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60">
                {isSubmitting ? 'Creating request...' : 'Submit Request'}
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  )
}

export default UserNewRequestPage
