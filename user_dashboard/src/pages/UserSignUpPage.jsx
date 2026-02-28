import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { ApiError, getMyProfile, userSignUp } from '../lib/api'
import { setAuthTokens, setAuthUser } from '../store/authSlice'

function UserSignUpPage({ theme, onToggleTheme }) {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    password: '',
    confirmPassword: '',
    form: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isDisabled = useMemo(() => isSubmitting || !form.full_name || !form.email || !form.phone_number || !form.password || !form.confirmPassword, [isSubmitting, form])

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

    setErrors(nextErrors)
    return !Object.values(nextErrors).some(Boolean)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    setErrors((prev) => ({ ...prev, form: '' }))

    try {
      const signUpResponse = await userSignUp({
        full_name: form.full_name.trim(),
        email: form.email,
        phone_number: form.phone_number,
        password: form.password,
      })

      dispatch(
        setAuthTokens({
          accessToken: signUpResponse?.accessToken || null,
          refreshToken: signUpResponse?.refreshToken || null,
        }),
      )

      const profileResponse = await getMyProfile()
      dispatch(setAuthUser(profileResponse?.user || null))
      navigate('/dashboard')
    } catch (error) {
      if (error instanceof ApiError) setErrors((prev) => ({ ...prev, form: error.message }))
      else setErrors((prev) => ({ ...prev, form: 'Unable to create account. Please try again.' }))
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
            <button type="button" onClick={onToggleTheme} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</button>
          </div>
        </header>

        <main className="mt-5 grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-300">Customer Registration</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight">Create your account</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Signup sends data to backend and persists in Prisma database.</p>

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

              {errors.form && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">{errors.form}</div>}

              <button type="submit" disabled={isDisabled} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60">
                {isSubmitting ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <div className="mt-4 text-sm">
              <Link to="/auth/user/signin" className="text-emerald-600 hover:text-emerald-500 dark:text-emerald-300">Already have an account? Sign in</Link>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-semibold">Backend + Prisma flow</h2>
            <ol className="mt-3 list-inside list-decimal space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <li>POST /auth/signup is called with registration payload.</li>
              <li>Backend validates and writes user record to Prisma DB.</li>
              <li>Backend generates access/refresh token session.</li>
              <li>Frontend stores auth state in Redux.</li>
              <li>Frontend fetches profile and redirects to dashboard.</li>
            </ol>
          </section>
        </main>
      </div>
    </div>
  )
}

export default UserSignUpPage
