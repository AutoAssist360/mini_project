import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getUserById, blockUser, unblockUser, deleteUser } from '../lib/api'

const card = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900'
const btn  = 'rounded-lg px-3 py-1.5 text-xs font-semibold'

function AdminUserDetailPage() {
  const { userId } = useParams()
  const [user, setUser]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy]     = useState(false)

  const load = useCallback(() => {
    getUserById(userId).then((r) => setUser(r.user || r)).catch(() => null).finally(() => setLoading(false))
  }, [userId])
  useEffect(() => { load() }, [load])

  const act = async (fn) => { setBusy(true); try { await fn(userId); load() } catch { /* */ } setBusy(false) }

  if (loading) return <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center"><p className="text-slate-500">Loading…</p></div>
  if (!user) return <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center"><p className="text-slate-500">User not found</p></div>

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <Link to="/admin/users" className="text-sm text-emerald-600 hover:underline dark:text-emerald-400">← Back to Users</Link>

        <div className={card + ' mt-4'}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold">{user.full_name}</h1>
              <p className="text-sm text-slate-500">{user.email} · {user.phone_number || 'No phone'}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-slate-100 px-2 py-0.5 capitalize dark:bg-slate-800">{user.role}</span>
                <span className={`rounded-full px-2 py-0.5 ${user.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>{user.is_active ? 'Active' : 'Blocked'}</span>
                {user.deleted_at && <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-800 dark:bg-red-900 dark:text-red-200">Deleted {new Date(user.deleted_at).toLocaleDateString()}</span>}
              </div>
            </div>

            {user.role !== 'admin' && (
              <div className="flex gap-2">
                {user.is_active
                  ? <button disabled={busy} onClick={() => act(blockUser)} className={btn + ' bg-amber-600 text-white hover:bg-amber-500'}>Block</button>
                  : <button disabled={busy} onClick={() => act(unblockUser)} className={btn + ' bg-emerald-600 text-white hover:bg-emerald-500'}>Unblock</button>
                }
                <button disabled={busy} onClick={() => { if (confirm('Permanently delete?')) act(deleteUser) }} className={btn + ' bg-red-600 text-white hover:bg-red-500'}>Delete</button>
              </div>
            )}
          </div>
        </div>

        {/* counts */}
        {user._count && (
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            {Object.entries(user._count).map(([k, v]) => (
              <div key={k} className={card}>
                <p className="text-xs text-slate-500 capitalize dark:text-slate-400">{k.replace(/([A-Z])/g, ' $1')}</p>
                <p className="mt-1 text-lg font-bold">{v}</p>
              </div>
            ))}
          </div>
        )}

        {/* vehicles */}
        {user.vehicles?.length > 0 && (
          <section className={card + ' mt-4'}>
            <h2 className="text-base font-semibold">Vehicles</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead><tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="pb-2 pr-3">Reg Number</th><th className="pb-2 pr-3">VIN</th><th className="pb-2">Variant</th>
                </tr></thead>
                <tbody>
                  {user.vehicles.map((v) => (
                    <tr key={v.vehicle_id} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="py-2 pr-3">{v.registration_number}</td>
                      <td className="py-2 pr-3">{v.vin_number}</td>
                      <td className="py-2">{v.variant?.variant_name || '--'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* technician profile (if technician) */}
        {user.technicianProfile && (
          <section className={card + ' mt-4'}>
            <h2 className="text-base font-semibold">Technician Profile</h2>
            <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <p><strong>Business:</strong> {user.technicianProfile.business_name || '--'}</p>
              <p><strong>Type:</strong> {user.technicianProfile.technician_type}</p>
              <p><strong>Location:</strong> {user.technicianProfile.location}</p>
              <p><strong>Radius:</strong> {user.technicianProfile.service_radius} km</p>
              <p><strong>Rating:</strong> {user.technicianProfile.rating || '--'} ({user.technicianProfile.total_reviews} reviews)</p>
              <p><strong>Verified:</strong> {user.technicianProfile.is_verified ? 'Yes' : 'No'}</p>
            </div>
            <Link to={`/admin/technicians/${user.technicianProfile.technician_id}`} className="mt-3 inline-block text-sm text-emerald-600 hover:underline dark:text-emerald-400">View full technician profile →</Link>
          </section>
        )}

        <p className="mt-4 text-xs text-slate-400">Joined: {new Date(user.created_at).toLocaleString()}</p>
      </div>
    </div>
  )
}

export default AdminUserDetailPage
