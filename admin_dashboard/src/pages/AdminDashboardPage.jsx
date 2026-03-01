import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { getDashboard, adminLogout } from '../lib/api'
import { clearAuth } from '../store/authSlice'

const card = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900'
const badge = (color) => `inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${color}`

function AdminDashboardPage({ theme, onToggleTheme }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { getDashboard().then(setData).catch(() => null).finally(() => setLoading(false)) }, [])

  const handleLogout = async () => {
    await adminLogout().catch(() => null)
    dispatch(clearAuth())
    navigate('/admin/login')
  }

  const s = data || {}

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* header */}
        <header className={card}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-xl font-semibold">Admin Dashboard</h1>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={onToggleTheme} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">{theme === 'dark' ? '☀ Light' : '☾ Dark'}</button>
              <button type="button" onClick={handleLogout} className="rounded-xl bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-500">Logout</button>
            </div>
          </div>
        </header>

        {loading && <p className="mt-6 text-center text-sm text-slate-500">Loading dashboard…</p>}

        {!loading && (
          <>
            {/* top stats */}
            <section className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ['Total Users', s.users?.total, 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', `Active ${s.users?.active ?? 0}`],
                ['Technicians', s.technicians?.total, 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200', `Verified ${s.technicians?.verified ?? 0} · Online ${s.technicians?.online ?? 0}`],
                ['Vendors', s.vendors?.total, 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200', ''],
                ['Active Warehouses', s.warehouses?.active, 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200', ''],
              ].map(([label, val, c, sub]) => (
                <article key={label} className={card}>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
                  <p className="mt-1 text-2xl font-bold">{val ?? '--'}</p>
                  {sub && <span className={badge(c)}>{sub}</span>}
                </article>
              ))}
            </section>

            {/* request breakdown */}
            {s.requests && (
              <section className={'mt-5 ' + card}>
                <h2 className="text-base font-semibold">Service Requests</h2>
                <div className="mt-3 flex flex-wrap gap-3">
                  {Object.entries(s.requests).map(([k, v]) => (
                    <span key={k} className={badge('bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300')}>{k.replace(/_/g, ' ')}: {v}</span>
                  ))}
                </div>
              </section>
            )}

            {/* job + order + invoice rows */}
            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              {s.jobs && (
                <div className={card}>
                  <h3 className="text-sm font-semibold">Jobs</h3>
                  <div className="mt-2 space-y-1 text-sm">
                    {Object.entries(s.jobs).map(([k, v]) => <p key={k}>{k.replace(/_/g, ' ')}: <strong>{v}</strong></p>)}
                  </div>
                </div>
              )}
              {s.orders && (
                <div className={card}>
                  <h3 className="text-sm font-semibold">Orders</h3>
                  <div className="mt-2 space-y-1 text-sm">
                    {Object.entries(s.orders).map(([k, v]) => <p key={k}>{k}: <strong>{v}</strong></p>)}
                  </div>
                </div>
              )}
              {s.invoices && (
                <div className={card}>
                  <h3 className="text-sm font-semibold">Invoices</h3>
                  <div className="mt-2 space-y-1 text-sm">
                    {Object.entries(s.invoices).map(([k, v]) => <p key={k}>{k}: <strong>{v}</strong></p>)}
                  </div>
                </div>
              )}
            </div>

            {/* recent requests */}
            {s.recentRequests?.length > 0 && (
              <section className={'mt-5 ' + card}>
                <h2 className="text-base font-semibold">Recent Requests</h2>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead><tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="pb-2 pr-4">User</th><th className="pb-2 pr-4">Type</th><th className="pb-2 pr-4">Status</th><th className="pb-2">Created</th>
                    </tr></thead>
                    <tbody>
                      {s.recentRequests.map((r) => (
                        <tr key={r.request_id} className="border-b border-slate-100 dark:border-slate-800">
                          <td className="py-2 pr-4">{r.user?.full_name || '--'}</td>
                          <td className="py-2 pr-4">{r.issue_type?.replace(/_/g, ' ')}</td>
                          <td className="py-2 pr-4"><span className={badge('bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300')}>{r.status}</span></td>
                          <td className="py-2">{new Date(r.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* quick links */}
            <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ['/admin/users', 'Users', 'Manage all platform users'],
                ['/admin/technicians', 'Technicians', 'Verify & manage technicians'],
                ['/admin/vendors', 'Vendors', 'Manage vendor accounts'],
                ['/admin/warehouses', 'Warehouses', 'View all warehouses'],
                ['/admin/requests', 'Service Requests', 'Track & manage requests'],
                ['/admin/jobs', 'Jobs', 'Monitor technician jobs'],
                ['/admin/orders', 'Orders', 'Manage part orders'],
                ['/admin/invoices', 'Invoices', 'Service invoices'],
                ['/admin/analytics', 'Analytics', 'Revenue & performance'],
                ['/admin/audit-logs', 'Audit Logs', 'Track admin actions'],
              ].map(([to, label, desc]) => (
                <Link key={to} to={to} className={card + ' block hover:ring-2 hover:ring-emerald-500'}>
                  <p className="font-semibold">{label}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{desc}</p>
                </Link>
              ))}
            </section>
          </>
        )}
      </div>
    </div>
  )
}

export default AdminDashboardPage
