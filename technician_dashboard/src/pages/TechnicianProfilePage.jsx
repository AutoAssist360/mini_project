import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { setAuthUser } from '../store/authSlice'
import {
  getTechnicianProfile,
  updateTechnicianProfile,
  addCertification,
  deleteCertification,
  ApiError,
} from '../lib/api'

function TechnicianProfilePage({ theme, onToggleTheme }) {
  const dispatch = useDispatch()

  const [loading, setLoading] = useState(true)
  const [profileData, setProfileData] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    business_name: '',
    location: '',
    latitude: '',
    longitude: '',
    service_radius: '',
    technician_type: 'individual',
  })

  const [certForm, setCertForm] = useState({
    certification: '',
    issued_by: '',
    issue_date: '',
    expiry_date: '',
  })
  const [addingCert, setAddingCert] = useState(false)
  const [showCertForm, setShowCertForm] = useState(false)

  const loadProfile = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getTechnicianProfile()
      const p = res?.profile
      setProfileData(p)
      dispatch(setAuthUser(p))
      setForm({
        business_name: p?.business_name || '',
        location: p?.location || '',
        latitude: String(p?.latitude ?? ''),
        longitude: String(p?.longitude ?? ''),
        service_radius: String(p?.service_radius ?? ''),
        technician_type: p?.technician_type || 'individual',
      })
    } catch {
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [dispatch])

  useEffect(() => { loadProfile() }, [loadProfile])

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const payload = {}
      if (form.business_name) payload.business_name = form.business_name
      if (form.location) payload.location = form.location
      if (form.latitude) payload.latitude = Number(form.latitude)
      if (form.longitude) payload.longitude = Number(form.longitude)
      if (form.service_radius) payload.service_radius = Number(form.service_radius)
      if (form.technician_type) payload.technician_type = form.technician_type

      await updateTechnicianProfile(payload)
      setMessage('Profile updated successfully')
      setEditMode(false)
      await loadProfile()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleAddCert = async () => {
    setAddingCert(true)
    setError('')
    try {
      await addCertification({
        certification: certForm.certification,
        issued_by: certForm.issued_by,
        issue_date: new Date(certForm.issue_date).toISOString(),
        ...(certForm.expiry_date ? { expiry_date: new Date(certForm.expiry_date).toISOString() } : {}),
      })
      setCertForm({ certification: '', issued_by: '', issue_date: '', expiry_date: '' })
      setShowCertForm(false)
      setMessage('Certification added')
      await loadProfile()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to add certification')
    } finally {
      setAddingCert(false)
    }
  }

  const handleDeleteCert = async (certId) => {
    if (!confirm('Delete this certification?')) return
    try {
      await deleteCertification(certId)
      await loadProfile()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete certification')
    }
  }

  const user = profileData?.user

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link to="/dashboard" className="text-sm text-emerald-600 hover:text-emerald-500 dark:text-emerald-300">← Dashboard</Link>
              <h1 className="text-xl font-semibold">My Profile</h1>
            </div>
            <button type="button" onClick={onToggleTheme} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
        </header>

        {message && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-300">{message}</div>
        )}
        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">{error}</div>
        )}

        {loading ? (
          <div className="mt-10 text-center text-sm text-slate-500">Loading profile...</div>
        ) : (
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            {/* Account info */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-base font-semibold">Account Info</h2>
              <div className="mt-3 space-y-2 text-sm">
                <div><span className="text-slate-500 dark:text-slate-400">Name:</span> {user?.full_name}</div>
                <div><span className="text-slate-500 dark:text-slate-400">Email:</span> {user?.email}</div>
                <div><span className="text-slate-500 dark:text-slate-400">Phone:</span> {user?.phone_number}</div>
                <div><span className="text-slate-500 dark:text-slate-400">Verified:</span> {profileData?.is_verified ? 'Yes' : 'No'}</div>
                <div><span className="text-slate-500 dark:text-slate-400">Rating:</span> {profileData?.rating ?? 'N/A'} ({profileData?.total_reviews ?? 0} reviews)</div>
              </div>
            </section>

            {/* Profile edit */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">Technician Info</h2>
                {!editMode && (
                  <button type="button" onClick={() => setEditMode(true)} className="text-sm text-emerald-600 hover:text-emerald-500 dark:text-emerald-300">Edit</button>
                )}
              </div>

              {editMode ? (
                <div className="mt-3 grid gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium">Business Name</label>
                    <input value={form.business_name} onChange={handleChange('business_name')} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium">Technician Type</label>
                    <select value={form.technician_type} onChange={handleChange('technician_type')} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800">
                      <option value="individual">Individual</option>
                      <option value="garage">Garage</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium">Location</label>
                    <input value={form.location} onChange={handleChange('location')} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium">Latitude</label>
                      <input value={form.latitude} onChange={handleChange('latitude')} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium">Longitude</label>
                      <input value={form.longitude} onChange={handleChange('longitude')} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium">Radius (km)</label>
                      <input value={form.service_radius} onChange={handleChange('service_radius')} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={handleSave} disabled={saving} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60">
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button type="button" onClick={() => setEditMode(false)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 space-y-2 text-sm">
                  <div><span className="text-slate-500 dark:text-slate-400">Business:</span> {profileData?.business_name || 'N/A'}</div>
                  <div><span className="text-slate-500 dark:text-slate-400">Type:</span> {profileData?.technician_type}</div>
                  <div><span className="text-slate-500 dark:text-slate-400">Location:</span> {profileData?.location}</div>
                  <div><span className="text-slate-500 dark:text-slate-400">Coordinates:</span> {profileData?.latitude}, {profileData?.longitude}</div>
                  <div><span className="text-slate-500 dark:text-slate-400">Service Radius:</span> {profileData?.service_radius} km</div>
                </div>
              )}
            </section>

            {/* Certifications */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">Certifications</h2>
                <button type="button" onClick={() => setShowCertForm(!showCertForm)} className="text-sm text-emerald-600 hover:text-emerald-500 dark:text-emerald-300">
                  {showCertForm ? 'Cancel' : '+ Add Certification'}
                </button>
              </div>

              {showCertForm && (
                <div className="mt-3 grid gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium">Certification</label>
                    <input value={certForm.certification} onChange={(e) => setCertForm((p) => ({ ...p, certification: e.target.value }))} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium">Issued by</label>
                    <input value={certForm.issued_by} onChange={(e) => setCertForm((p) => ({ ...p, issued_by: e.target.value }))} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium">Issue Date</label>
                    <input type="date" value={certForm.issue_date} onChange={(e) => setCertForm((p) => ({ ...p, issue_date: e.target.value }))} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium">Expiry Date (optional)</label>
                    <input type="date" value={certForm.expiry_date} onChange={(e) => setCertForm((p) => ({ ...p, expiry_date: e.target.value }))} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800" />
                  </div>
                  <div className="sm:col-span-2">
                    <button type="button" onClick={handleAddCert} disabled={addingCert || !certForm.certification || !certForm.issued_by || !certForm.issue_date} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60">
                      {addingCert ? 'Adding...' : 'Add Certification'}
                    </button>
                  </div>
                </div>
              )}

              {profileData?.certifications?.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {profileData.certifications.map((cert) => (
                    <div key={cert.certification_id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                      <div className="text-sm">
                        <p className="font-medium">{cert.certification}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {cert.issued_by} · {new Date(cert.issue_date).toLocaleDateString()}
                          {cert.expiry_date && ` — Expires ${new Date(cert.expiry_date).toLocaleDateString()}`}
                        </p>
                      </div>
                      <button type="button" onClick={() => handleDeleteCert(cert.certification_id)} className="text-xs text-red-600 hover:text-red-500">Delete</button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">No certifications added yet.</p>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  )
}

export default TechnicianProfilePage
