import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLocation } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { ApiError, getTechnicianProfile, technicianSignIn } from '../lib/api'
import { setAuthTokens, setAuthUser } from '../store/authSlice'

function TechnicianSignInPage({ theme, onToggleTheme }) {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const signupSuccessMessage = location.state?.signupSuccess

  const [form, setForm] = useState({
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    form: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isDisabled = useMemo(() => isSubmitting || !form.email || !form.password, [isSubmitting, form.email, form.password])

  const handleChange = (field) => (event) => {
    const value = event.target.value
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: '', form: '' }))
  }

  const validate = () => {
    const nextErrors = { email: '', password: '', form: '' }

    if (!form.email) {
      nextErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = 'Enter a valid email address'
    }

    if (!form.password) {
      nextErrors.password = 'Password is required'
    }

    setErrors(nextErrors)
    return !nextErrors.email && !nextErrors.password
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    setErrors({ email: '', password: '', form: '' })

    try {
      const signInResponse = await technicianSignIn({
        email: form.email,
        password: form.password,
      })

      dispatch(
        setAuthTokens({
          accessToken: signInResponse?.accessToken || null,
          refreshToken: signInResponse?.refreshToken || null,
        }),
      )

      const profileResponse = await getTechnicianProfile(signInResponse?.accessToken)
      const role = profileResponse?.profile?.user?.role || ''

      if (role !== 'technician') {
        throw new ApiError('This login page is only for technician accounts.', 403)
      }

      dispatch(setAuthUser(profileResponse?.profile || null))
      navigate('/dashboard')
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors((prev) => ({ ...prev, form: error.message }))
      } else {
        setErrors((prev) => ({ ...prev, form: 'Unable to sign in. Please try again.' }))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
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
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-300">Technician Login</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight">Sign in to continue</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Access job assignments, submit offers, and manage your technician operations.
            </p>

            {signupSuccessMessage && (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-300">
                {signupSuccessMessage}
              </div>
            )}

            <form className="mt-5 grid gap-4" onSubmit={handleSubmit} noValidate>
              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-medium">Email</label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange('email')}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
                {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="password" className="mb-1 block text-sm font-medium">Password</label>
                <input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange('password')}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800"
                  placeholder="Enter password"
                  autoComplete="current-password"
                />
                {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
              </div>

              {errors.form && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
                  {errors.form}
                </div>
              )}

              <button
                type="submit"
                disabled={isDisabled}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-4 text-sm">
              <Link to="/auth/technician/signup" className="text-emerald-600 hover:text-emerald-500 dark:text-emerald-300">Create technician account</Link>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-semibold">Production Flow Notes</h2>
            <ol className="mt-3 list-inside list-decimal space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <li>Frontend calls <span className="font-semibold">POST /tech/auth/signin</span>.</li>
              <li>Backend validates technician role and sets auth cookies.</li>
              <li>Frontend verifies via <span className="font-semibold">GET /tech/profile</span>.</li>
              <li>If role is technician, app redirects to dashboard.</li>
            </ol>
          </section>
        </main>
      </div>
    </div>
  )
}

export default TechnicianSignInPage
