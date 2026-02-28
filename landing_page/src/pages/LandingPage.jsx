import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

function LandingPage({ theme, onToggleTheme }) {
  const navigate = useNavigate()

  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false)
  const [requestSubmitted, setRequestSubmitted] = useState(false)
  const [quickRequest, setQuickRequest] = useState({
    fullName: '',
    phone: '',
    issueType: 'mechanical_failure',
    needsTowing: false,
    locationHint: '',
  })

  const openRolePage = (intent, role) => {
    const params = new URLSearchParams({ intent })
    if (role) params.set('role', role)
    navigate(`/auth/role?${params.toString()}`)
  }

  const openEmergencyModal = () => {
    setRequestSubmitted(false)
    setIsEmergencyModalOpen(true)
  }

  const handleQuickRequestSubmit = (event) => {
    event.preventDefault()
    setRequestSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-4 sm:px-6 lg:px-8">
        <header className="sticky top-4 z-20 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/85">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <Link to="/" className="inline-flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/15 text-base font-black text-emerald-600 dark:text-emerald-300">
                A
              </span>
              <span className="text-lg font-semibold tracking-tight sm:text-xl">Quick Auto Assist</span>
            </Link>

            <nav className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:w-auto" aria-label="Primary">
              <button
                type="button"
                onClick={() => openRolePage('help')}
                className="rounded-xl bg-emerald-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500"
              >
                Get Help Now
              </button>
              <button
                type="button"
                onClick={() => openRolePage('login', 'technician')}
                className="rounded-xl border border-slate-300 px-3 py-2 text-center text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                Join as Technician
              </button>
              <button
                type="button"
                onClick={() => openRolePage('login', 'vendor')}
                className="rounded-xl border border-slate-300 px-3 py-2 text-center text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                Vendor Portal
              </button>
              <button
                type="button"
                onClick={() => openRolePage('login')}
                className="rounded-xl border border-slate-300 px-3 py-2 text-center text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                Login
              </button>
            </nav>

            <button
              type="button"
              onClick={onToggleTheme}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
        </header>

        <main className="mt-6 grid gap-4 lg:grid-cols-12">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-7 lg:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-300">
              24/7 Roadside Assistance
            </p>
            <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              Instant vehicle help anywhere
            </h1>
            <p className="mt-4 max-w-2xl text-base text-slate-600 dark:text-slate-300 sm:text-lg">
              Raise a breakdown request, connect with technicians, track job progress, and complete payment in one
              streamlined flow.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => openRolePage('help')}
                className="rounded-xl bg-emerald-600 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-emerald-500"
              >
                Request Help
              </button>
              <button
                type="button"
                onClick={() => openRolePage('login')}
                className="rounded-xl border border-slate-300 px-5 py-3 text-center text-sm font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                Continue to Login
              </button>
            </div>
          </section>

          <section id="how-it-works" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-5 lg:p-8">
            <h2 className="text-lg font-semibold">How It Works</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Simple 4-step rescue flow from request to completion.</p>

            <div className="relative mt-5">
              <div className="absolute left-4 top-4 h-[calc(100%-2rem)] w-px bg-slate-200 dark:bg-slate-700 lg:left-0 lg:top-4 lg:h-px lg:w-full" />

              <ol className="relative grid gap-3 lg:grid-cols-4 lg:gap-2">
                <li className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">1</span>
                  <p className="mt-2 text-sm font-semibold">Choose Role</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">Customer, Technician, Vendor, Admin</p>
                </li>
                <li className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">2</span>
                  <p className="mt-2 text-sm font-semibold">Sign In</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">Login or register based on role</p>
                </li>
                <li className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">3</span>
                  <p className="mt-2 text-sm font-semibold">Request & Match</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">Issue created and technician assigned</p>
                </li>
                <li className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">4</span>
                  <p className="mt-2 text-sm font-semibold">Track & Close</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">Live status, invoice, payment, review</p>
                </li>
              </ol>
            </div>
          </section>
        </main>

        <section className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Service options">
          <button
            type="button"
            onClick={() => openRolePage('help')}
            className="rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
          >
            <p className="text-2xl">📱</p>
            <h3 className="mt-2 text-lg font-semibold">Request Help</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Submit issue details and current location.</p>
          </button>

          <button
            type="button"
            onClick={() => openRolePage('login', 'technician')}
            className="rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
          >
            <p className="text-2xl">🔧</p>
            <h3 className="mt-2 text-lg font-semibold">Connect to a Tech</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Receive offers and chat during repair process.</p>
          </button>

          <button
            type="button"
            onClick={openEmergencyModal}
            className="rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 sm:col-span-2 lg:col-span-1"
          >
            <p className="text-2xl">🚚</p>
            <h3 className="mt-2 text-lg font-semibold">Get Rescued</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Track technician ETA, towing, and completion.</p>
          </button>
        </section>

        <section id="about" className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-xl font-semibold">About Quick Auto Assist</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
            Quick Auto Assist is a role-based vehicle support platform where customers can raise breakdown requests,
            technicians can submit offers and complete jobs, vendors can fulfill parts orders, and admins can monitor
            the full service lifecycle with analytics and audit visibility.
          </p>
        </section>

        <section id="contact" className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-xl font-semibold">Contact</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
              <p className="text-sm font-medium">Support Email</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">support@quickautoassist.com</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
              <p className="text-sm font-medium">Helpline</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">+91 90000 00000</p>
            </div>
          </div>
        </section>

        <footer className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-slate-200 pt-5 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
          <a href="#about" className="hover:text-slate-900 dark:hover:text-white">About</a>
          <a href="#how-it-works" className="hover:text-slate-900 dark:hover:text-white">How it works</a>
          <a href="#contact" className="hover:text-slate-900 dark:hover:text-white">Contact</a>
          <button
            type="button"
            onClick={() => openRolePage('login', 'admin')}
            className="font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-300"
          >
            Admin Access
          </button>
        </footer>
      </div>

      {isEmergencyModalOpen && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-slate-950/60 px-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Emergency Quick Request</h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Minimal form for guest rescue flow before full auth integration.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEmergencyModalOpen(false)}
                className="rounded-lg border border-slate-300 px-3 py-1 text-sm dark:border-slate-700"
              >
                Close
              </button>
            </div>

            <form className="mt-4 grid gap-3" onSubmit={handleQuickRequestSubmit}>
              <input
                required
                value={quickRequest.fullName}
                onChange={(event) => setQuickRequest((prev) => ({ ...prev, fullName: event.target.value }))}
                placeholder="Full name"
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800"
              />
              <input
                required
                value={quickRequest.phone}
                onChange={(event) => setQuickRequest((prev) => ({ ...prev, phone: event.target.value }))}
                placeholder="Phone number"
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800"
              />
              <select
                value={quickRequest.issueType}
                onChange={(event) => setQuickRequest((prev) => ({ ...prev, issueType: event.target.value }))}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="mechanical_failure">Mechanical failure</option>
                <option value="electrical_issue">Electrical issue</option>
                <option value="tire_related">Tire related</option>
                <option value="battery_issue">Battery issue</option>
              </select>
              <input
                value={quickRequest.locationHint}
                onChange={(event) => setQuickRequest((prev) => ({ ...prev, locationHint: event.target.value }))}
                placeholder="Current location / nearby landmark"
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800"
              />
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={quickRequest.needsTowing}
                  onChange={(event) => setQuickRequest((prev) => ({ ...prev, needsTowing: event.target.checked }))}
                />
                Needs towing support
              </label>

              <button
                type="submit"
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
              >
                Submit Quick Request
              </button>
            </form>

            {requestSubmitted && (
              <div className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200">
                Quick request captured on landing UI. Next step: wire this form to emergency backend endpoint.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default LandingPage
