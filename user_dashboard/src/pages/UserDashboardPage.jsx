import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { clearAuth } from '../store/authSlice'
import { userLogout } from '../lib/api'

const NAV_CARDS = [
  { title: 'Raise New Issue', icon: '🔧', desc: 'Create a service request for your registered vehicle.', path: '/requests/new', primary: true },
  { title: 'My Requests', icon: '📋', desc: 'Track request status, view offers, and manage service requests.', path: '/requests' },
  { title: 'My Jobs', icon: '⚙️', desc: 'View active and completed jobs, technician details, and invoices.', path: '/jobs' },
  { title: 'My Orders', icon: '📦', desc: 'Check parts order status and payment details.', path: '/orders' },
  { title: 'My Reviews', icon: '⭐', desc: 'See reviews you\u2019ve left for completed jobs.', path: '/reviews' },
  { title: 'My Vehicles', icon: '🚗', desc: 'Add, edit, and manage your registered vehicles.', path: '/vehicles' },
  { title: 'My Profile', icon: '👤', desc: 'View account info and update your name or phone.', path: '/profile' },
]

function UserDashboardPage({ theme, onToggleTheme }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const auth = useSelector((state) => state.auth)

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
            <h1 className="text-xl font-semibold">Quick Auto Assist</h1>
            <div className="flex gap-2">
              <button type="button" onClick={onToggleTheme} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</button>
              <button type="button" onClick={handleLogout} className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500">Logout</button>
            </div>
          </div>
        </header>

        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold">Welcome back{auth.user?.full_name ? `, ${auth.user.full_name}` : ''}!</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{auth.user?.email || 'Signed in'} — Manage your vehicles, raise issues, track jobs, and pay invoices all in one place.</p>
        </section>

        <section className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {NAV_CARDS.map((card) => (
            <article key={card.path} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-700">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{card.icon}</span>
                <div className="min-w-0">
                  <h3 className="font-semibold">{card.title}</h3>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{card.desc}</p>
                </div>
              </div>
              <button type="button" onClick={() => navigate(card.path)} className={`mt-4 rounded-xl px-3 py-2 text-sm font-medium transition ${card.primary ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'border border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800'}`}>
                {card.primary ? 'New Request' : `Open ${card.title.replace('My ', '')}`}
              </button>
            </article>
          ))}
        </section>
      </div>
    </div>
  )
}

export default UserDashboardPage
