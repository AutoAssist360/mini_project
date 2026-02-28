import { Link, useSearchParams } from 'react-router-dom'

function RoleSelectionPage() {
  const [searchParams] = useSearchParams()
  const intent = searchParams.get('intent') || 'login'
  const preselectedRole = searchParams.get('role') || ''

  const userAppBaseUrl = import.meta.env.VITE_USER_APP_URL || 'http://localhost:5174'
  const technicianAppBaseUrl = import.meta.env.VITE_TECHNICIAN_APP_URL || 'http://localhost:5175'
  const vendorAppBaseUrl = import.meta.env.VITE_VENDOR_APP_URL || 'http://localhost:5176'
  const adminAppBaseUrl = import.meta.env.VITE_ADMIN_APP_URL || 'http://localhost:5177'

  const roleCards = [
    {
      key: 'customer',
      label: 'Customer',
      desc: 'Raise breakdown requests and track live job progress.',
      primaryRoute: `${userAppBaseUrl}/auth/user/signin`,
      secondaryRoute: `${userAppBaseUrl}/auth/user/signup`,
      primaryLabel: intent === 'help' ? 'Continue as Customer' : 'Login',
      secondaryLabel: 'Register',
    },
    {
      key: 'technician',
      label: 'Technician',
      desc: 'Go online, submit offers, and complete service jobs.',
      primaryRoute: `${technicianAppBaseUrl}/auth/technician/signin`,
      secondaryRoute: `${technicianAppBaseUrl}/auth/technician/signup`,
      primaryLabel: 'Login',
      secondaryLabel: 'Join Now',
    },
    {
      key: 'vendor',
      label: 'Vendor',
      desc: 'Manage warehouses, inventory, and order fulfillment.',
      primaryRoute: `${vendorAppBaseUrl}/auth/vendor/signin`,
      secondaryRoute: `${vendorAppBaseUrl}/auth/vendor/signup`,
      primaryLabel: 'Login',
      secondaryLabel: 'Register',
    },
    {
      key: 'admin',
      label: 'Admin',
      desc: 'Private operations dashboard for platform control.',
      primaryRoute: `${adminAppBaseUrl}/admin/login`,
      secondaryRoute: '',
      primaryLabel: 'Admin Login',
      secondaryLabel: '',
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-300">Quick Auto Assist</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Select Your Role</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 sm:text-base">
            Entry intent: <span className="font-semibold">{intent === 'help' ? 'Get Help' : 'Login'}</span>. Choose a role to continue.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="rounded-full border border-slate-200 px-3 py-1 dark:border-slate-700">Customer flow</span>
            <span className="rounded-full border border-slate-200 px-3 py-1 dark:border-slate-700">Technician flow</span>
            <span className="rounded-full border border-slate-200 px-3 py-1 dark:border-slate-700">Vendor flow</span>
            <span className="rounded-full border border-slate-200 px-3 py-1 dark:border-slate-700">Admin private access</span>
          </div>
        </header>

        <section className="mt-5 grid gap-4 md:grid-cols-2">
          {roleCards.map((role) => {
            const isActive = preselectedRole === role.key
            return (
              <article
                key={role.key}
                className={`rounded-2xl border bg-white p-5 shadow-sm dark:bg-slate-900 ${
                  isActive
                    ? 'border-emerald-400 ring-2 ring-emerald-200 dark:border-emerald-500 dark:ring-emerald-900/40'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-semibold">{role.label}</h2>
                  {isActive && (
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                      Recommended
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{role.desc}</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <a
                    href={role.primaryRoute}
                    className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                  >
                    {role.primaryLabel}
                  </a>
                  {role.secondaryRoute && (
                    <a
                      href={role.secondaryRoute}
                      className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                    >
                      {role.secondaryLabel}
                    </a>
                  )}
                </div>
              </article>
            )
          })}
        </section>

        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            Back to Landing
          </Link>
        </div>
      </div>
    </div>
  )
}

export default RoleSelectionPage
