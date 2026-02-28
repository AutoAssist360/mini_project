import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError, technicianSignUp } from '../lib/api'

function TechnicianSignUpPage({ theme, onToggleTheme }) {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    password: '',
    confirmPassword: '',
    business_name: '',
    technician_type: 'individual',
    location: '',
    latitude: '',
    longitude: '',
    service_radius: '',
  })

  const [errors, setErrors] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    password: '',
    confirmPassword: '',
    technician_type: '',
    location: '',
    latitude: '',
    longitude: '',
    service_radius: '',
    form: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const isDisabled = useMemo(() => {
    return (
      isSubmitting ||
      !form.full_name ||
      !form.email ||
      !form.phone_number ||
      !form.password ||
      !form.confirmPassword ||
      !form.technician_type ||
      !form.location ||
      !form.latitude ||
      !form.longitude ||
      !form.service_radius
    )
  }, [isSubmitting, form])

  const handleChange = (field) => (event) => {
    const value = event.target.value
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: '', form: '' }))
  }

  const validate = () => {
    const nextErrors = {
      full_name: '',
      email: '',
      phone_number: '',
      password: '',
      confirmPassword: '',
      technician_type: '',
      location: '',
      latitude: '',
      longitude: '',
      service_radius: '',
      form: '',
    }

    if (!form.full_name.trim()) nextErrors.full_name = 'Full name is required'

    if (!form.email) nextErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) nextErrors.email = 'Enter a valid email address'

    if (!form.phone_number) nextErrors.phone_number = 'Phone number is required'
    else if (!/^\d{10}$/.test(form.phone_number)) nextErrors.phone_number = 'Phone number must be exactly 10 digits'

    if (!form.password) nextErrors.password = 'Password is required'
    else if (form.password.length < 8) nextErrors.password = 'Password must be at least 8 characters'

    if (!form.confirmPassword) nextErrors.confirmPassword = 'Please confirm your password'
    else if (form.password !== form.confirmPassword) nextErrors.confirmPassword = 'Passwords do not match'

    if (!['individual', 'garage'].includes(form.technician_type)) {
      nextErrors.technician_type = 'Technician type must be individual or garage'
    }

    if (!form.location.trim()) nextErrors.location = 'Location is required'

    const latitude = Number(form.latitude)
    const longitude = Number(form.longitude)
    const serviceRadius = Number(form.service_radius)

    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      nextErrors.latitude = 'Latitude must be between -90 and 90'
    }

    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      nextErrors.longitude = 'Longitude must be between -180 and 180'
    }

    if (!Number.isInteger(serviceRadius) || serviceRadius <= 0) {
      nextErrors.service_radius = 'Service radius must be a positive integer'
    }

    setErrors(nextErrors)
    return !Object.values(nextErrors).some(Boolean)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    setErrors((prev) => ({ ...prev, form: '' }))

    try {
      await technicianSignUp({
        full_name: form.full_name.trim(),
        email: form.email,
        phone_number: form.phone_number,
        password: form.password,
        business_name: form.business_name.trim() || undefined,
        technician_type: form.technician_type,
        location: form.location.trim(),
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        service_radius: Number(form.service_radius),
      })
      navigate('/auth/technician/signin', {
        replace: true,
        state: { signupSuccess: 'Technician account created successfully. Please sign in.' },
      })
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors((prev) => ({ ...prev, form: error.message }))
      } else {
        const fallbackMessage =
          error?.message === 'Failed to fetch'
            ? 'Network/CORS issue: check backend is running and allows this app origin.'
            : 'Unable to create account. Please try again.'
        setErrors((prev) => ({ ...prev, form: fallbackMessage }))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <a href={import.meta.env.VITE_LANDING_APP_URL || 'http://localhost:5173'} className="text-lg font-semibold">Quick Auto Assist</a>
            <button type="button" onClick={onToggleTheme} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
        </header>

        <main className="mt-5 grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-300">Technician Registration</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight">Create your technician account</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Signup writes user + technician profile data in one backend transaction.</p>

            <form className="mt-5 grid gap-4" onSubmit={handleSubmit} noValidate>
              <div>
                <label htmlFor="full_name" className="mb-1 block text-sm font-medium">Full name</label>
                <input id="full_name" value={form.full_name} onChange={handleChange('full_name')} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800" placeholder="Your name" />
                {errors.full_name && <p className="mt-1 text-xs text-red-600">{errors.full_name}</p>}
              </div>

              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-medium">Email</label>
                <input id="email" type="email" value={form.email} onChange={handleChange('email')} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800" placeholder="you@example.com" />
                {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="phone_number" className="mb-1 block text-sm font-medium">Phone number</label>
                <input id="phone_number" value={form.phone_number} onChange={handleChange('phone_number')} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800" placeholder="10 digit number" />
                {errors.phone_number && <p className="mt-1 text-xs text-red-600">{errors.phone_number}</p>}
              </div>

              <div>
                <label htmlFor="password" className="mb-1 block text-sm font-medium">Password</label>
                <input id="password" type="password" value={form.password} onChange={handleChange('password')} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800" placeholder="At least 8 characters" />
                {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium">Confirm password</label>
                <input id="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange('confirmPassword')} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800" placeholder="Re-enter password" />
                {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>}
              </div>

              <div>
                <label htmlFor="technician_type" className="mb-1 block text-sm font-medium">Technician type</label>
                <select id="technician_type" value={form.technician_type} onChange={handleChange('technician_type')} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800">
                  <option value="individual">Individual</option>
                  <option value="garage">Garage</option>
                </select>
                {errors.technician_type && <p className="mt-1 text-xs text-red-600">{errors.technician_type}</p>}
              </div>

              <div>
                <label htmlFor="business_name" className="mb-1 block text-sm font-medium">Business name (optional)</label>
                <input id="business_name" value={form.business_name} onChange={handleChange('business_name')} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800" placeholder="Garage or workshop name" />
              </div>

              <div>
                <label htmlFor="location" className="mb-1 block text-sm font-medium">Location</label>
                <input id="location" value={form.location} onChange={handleChange('location')} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800" placeholder="City, area, landmark" />
                {errors.location && <p className="mt-1 text-xs text-red-600">{errors.location}</p>}
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="latitude" className="mb-1 block text-sm font-medium">Latitude</label>
                  <input id="latitude" value={form.latitude} onChange={handleChange('latitude')} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800" placeholder="e.g. 28.6139" />
                  {errors.latitude && <p className="mt-1 text-xs text-red-600">{errors.latitude}</p>}
                </div>
                <div>
                  <label htmlFor="longitude" className="mb-1 block text-sm font-medium">Longitude</label>
                  <input id="longitude" value={form.longitude} onChange={handleChange('longitude')} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800" placeholder="e.g. 77.2090" />
                  {errors.longitude && <p className="mt-1 text-xs text-red-600">{errors.longitude}</p>}
                </div>
                <div>
                  <label htmlFor="service_radius" className="mb-1 block text-sm font-medium">Service radius (km)</label>
                  <input id="service_radius" value={form.service_radius} onChange={handleChange('service_radius')} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800" placeholder="e.g. 10" />
                  {errors.service_radius && <p className="mt-1 text-xs text-red-600">{errors.service_radius}</p>}
                </div>
              </div>

              {errors.form && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
                  {errors.form}
                </div>
              )}

              <button type="submit" disabled={isDisabled} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60">
                {isSubmitting ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <div className="mt-4 text-sm">
              <Link to="/auth/technician/signin" className="text-emerald-600 hover:text-emerald-500 dark:text-emerald-300">Already have an account? Sign in</Link>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-semibold">Backend + Prisma flow</h2>
            <ol className="mt-3 list-inside list-decimal space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <li>POST /tech/auth/signup receives user + profile payload.</li>
              <li>Backend creates user and technician profile in one transaction.</li>
              <li>Backend returns account-created response.</li>
              <li>Frontend redirects to technician sign-in page.</li>
              <li>Technician signs in manually and enters dashboard.</li>
            </ol>
          </section>
        </main>
      </div>
    </div>
  )
}

export default TechnicianSignUpPage
