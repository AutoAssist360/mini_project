import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { ApiError, getMyProfile, updateMyProfile, userLogout } from '../lib/api'
import { clearAuth, setAuthUser } from '../store/authSlice'

function UserProfilePage({ theme, onToggleTheme }) {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({ full_name: '', phone_number: '' })
  const [errors, setErrors] = useState({ full_name: '', phone_number: '', form: '' })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')

  const loadProfile = async () => {
    setIsLoading(true)
    setErrors({ full_name: '', phone_number: '', form: '' })

    try {
      const response = await getMyProfile()
      const user = response?.user || null
      setProfile(user)
      setForm({
        full_name: user?.full_name || '',
        phone_number: user?.phone_number || '',
      })
    } catch (err) {
      if (err instanceof ApiError) setErrors((prev) => ({ ...prev, form: err.message }))
      else setErrors((prev) => ({ ...prev, form: 'Unable to load profile.' }))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
  }, [])

  const handleChange = (field) => (event) => {
    const value = event.target.value
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: '', form: '' }))
    setMessage('')
  }

  const validate = () => {
    const next = { full_name: '', phone_number: '', form: '' }

    if (!form.full_name.trim()) {
      next.full_name = 'Full name is required'
    }

    if (form.phone_number && !/^\d{10}$/.test(form.phone_number)) {
      next.phone_number = 'Phone number must be exactly 10 digits'
    }

    setErrors(next)
    return !next.full_name && !next.phone_number
  }

  const handleSave = async (event) => {
    event.preventDefault()
    if (!validate()) return

    setIsSaving(true)
    setErrors((prev) => ({ ...prev, form: '' }))
    setMessage('')

    try {
      const response = await updateMyProfile(
        {
          full_name: form.full_name.trim(),
          phone_number: form.phone_number || undefined,
        },
      )

      const user = response?.user || null
      setProfile(user)
      dispatch(setAuthUser(user))
      setMessage(response?.message || 'Profile updated successfully.')
    } catch (err) {
      if (err instanceof ApiError) setErrors((prev) => ({ ...prev, form: err.message }))
      else setErrors((prev) => ({ ...prev, form: 'Unable to update profile.' }))
    } finally {
      setIsSaving(false)
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
            <h1 className="text-xl font-semibold">My Profile</h1>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={onToggleTheme} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</button>
              <Link to="/dashboard" className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">Dashboard</Link>
              <button type="button" onClick={handleLogout} className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500">Logout</button>
            </div>
          </div>
        </header>

        {errors.form && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
            {errors.form}
          </div>
        )}

        {message && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-300">
            {message}
          </div>
        )}

        {isLoading ? (
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">Loading profile...</p>
        ) : (
          <main className="mt-5 grid gap-4 lg:grid-cols-2">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-base font-semibold">Account Details</h2>
              <div className="mt-3 grid gap-2 text-sm">
                <p><span className="font-medium">User ID:</span> {profile?.user_id}</p>
                <p><span className="font-medium">Email:</span> {profile?.email}</p>
                <p><span className="font-medium">Role:</span> {profile?.role}</p>
                <p><span className="font-medium">Status:</span> {profile?.is_active ? 'Active' : 'Inactive'}</p>
                <p><span className="font-medium">Created:</span> {profile?.created_at ? new Date(profile.created_at).toLocaleString() : 'N/A'}</p>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-base font-semibold">Update Profile</h2>
              <form className="mt-3 grid gap-4" onSubmit={handleSave} noValidate>
                <div>
                  <label htmlFor="full_name" className="mb-1 block text-sm font-medium">Full name</label>
                  <input id="full_name" value={form.full_name} onChange={handleChange('full_name')} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800" />
                  {errors.full_name && <p className="mt-1 text-xs text-red-600">{errors.full_name}</p>}
                </div>
                <div>
                  <label htmlFor="phone_number" className="mb-1 block text-sm font-medium">Phone number</label>
                  <input id="phone_number" value={form.phone_number} onChange={handleChange('phone_number')} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800" placeholder="10 digits" />
                  {errors.phone_number && <p className="mt-1 text-xs text-red-600">{errors.phone_number}</p>}
                </div>
                <button type="submit" disabled={isSaving} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60">
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </section>
          </main>
        )}
      </div>
    </div>
  )
}

export default UserProfilePage
