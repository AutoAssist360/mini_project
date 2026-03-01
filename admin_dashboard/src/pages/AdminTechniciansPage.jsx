import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getTechnicians, verifyTechnician, suspendTechnician, unsuspendTechnician } from '../lib/api'

const card = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900'
const btn  = 'rounded-lg px-3 py-1.5 text-xs font-semibold'
const badge = (c) => `inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${c}`

function AdminTechniciansPage() {
  const [techs, setTechs]         = useState([])
  const [pagination, setPagination] = useState({})
  const [page, setPage]           = useState(1)
  const [search, setSearch]       = useState('')
  const [verified, setVerified]   = useState('')
  const [online, setOnline]       = useState('')
  const [techType, setTechType]   = useState('')
  const [loading, setLoading]     = useState(true)
  const [busy, setBusy]           = useState(null)

  const load = useCallback(() => {
    getTechnicians({ page, limit: 15, search: search || undefined, is_verified: verified || undefined, is_online: online || undefined, technician_type: techType || undefined })
      .then((r) => { setTechs(r.technicians || []); setPagination(r.pagination || {}) })
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [page, search, verified, online, techType])

  useEffect(() => { load() }, [load])

  const act = async (fn, id) => { setBusy(id); try { await fn(id); load() } catch { /* */ } setBusy(null) }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Technicians</h1>
          <Link to="/admin/dashboard" className="text-sm text-emerald-600 hover:underline dark:text-emerald-400">← Dashboard</Link>
        </div>

        <div className={'mt-4 flex flex-wrap gap-3 ' + card}>
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Search…" className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800" />
          <select value={verified} onChange={(e) => { setVerified(e.target.value); setPage(1) }} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800">
            <option value="">All verification</option>
            <option value="true">Verified</option>
            <option value="false">Unverified</option>
          </select>
          <select value={online} onChange={(e) => { setOnline(e.target.value); setPage(1) }} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800">
            <option value="">All status</option>
            <option value="true">Online</option>
            <option value="false">Offline</option>
          </select>
          <select value={techType} onChange={(e) => { setTechType(e.target.value); setPage(1) }} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800">
            <option value="">All types</option>
            <option value="individual">Individual</option>
            <option value="garage">Garage</option>
          </select>
        </div>

        {loading && <p className="mt-6 text-center text-sm text-slate-500">Loading…</p>}

        {!loading && (
          <>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead><tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="pb-2 pr-3">Name</th><th className="pb-2 pr-3">Business</th><th className="pb-2 pr-3">Type</th><th className="pb-2 pr-3">Rating</th><th className="pb-2 pr-3">Verified</th><th className="pb-2 pr-3">Online</th><th className="pb-2 pr-3">Active</th><th className="pb-2">Actions</th>
                </tr></thead>
                <tbody>
                  {techs.map((t) => (
                    <tr key={t.technician_id} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="py-2 pr-3"><Link to={`/admin/technicians/${t.technician_id}`} className="text-emerald-600 hover:underline dark:text-emerald-400">{t.user?.full_name || '--'}</Link></td>
                      <td className="py-2 pr-3">{t.business_name || '--'}</td>
                      <td className="py-2 pr-3 capitalize">{t.technician_type}</td>
                      <td className="py-2 pr-3">{t.rating ?? '--'} ({t.total_reviews})</td>
                      <td className="py-2 pr-3">{t.is_verified ? <span className={badge('bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200')}>Yes</span> : <span className={badge('bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400')}>No</span>}</td>
                      <td className="py-2 pr-3">{t.is_online ? <span className={badge('bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200')}>Online</span> : 'Offline'}</td>
                      <td className="py-2 pr-3">{t.user?.is_active ? 'Yes' : <span className="text-red-500">No</span>}</td>
                      <td className="flex gap-1 py-2">
                        {!t.is_verified && <button disabled={busy === t.technician_id} onClick={() => act(verifyTechnician, t.technician_id)} className={btn + ' bg-emerald-600 text-white hover:bg-emerald-500'}>Verify</button>}
                        {t.user?.is_active
                          ? <button disabled={busy === t.technician_id} onClick={() => act(suspendTechnician, t.technician_id)} className={btn + ' bg-amber-600 text-white hover:bg-amber-500'}>Suspend</button>
                          : <button disabled={busy === t.technician_id} onClick={() => act(unsuspendTechnician, t.technician_id)} className={btn + ' bg-blue-600 text-white hover:bg-blue-500'}>Unsuspend</button>
                        }
                      </td>
                    </tr>
                  ))}
                  {techs.length === 0 && <tr><td colSpan={8} className="py-6 text-center text-slate-500">No technicians found</td></tr>}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm">
              <span>Page {pagination.page || 1} of {pagination.totalPages || 1}</span>
              <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className={btn + ' border border-slate-300 dark:border-slate-700'}>Prev</button>
                <button disabled={page >= (pagination.totalPages || 1)} onClick={() => setPage((p) => p + 1)} className={btn + ' border border-slate-300 dark:border-slate-700'}>Next</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default AdminTechniciansPage
