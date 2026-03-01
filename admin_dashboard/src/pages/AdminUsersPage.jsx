import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getUsers, blockUser, unblockUser, deleteUser } from '../lib/api'

const card = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900'
const btn  = 'rounded-lg px-3 py-1.5 text-xs font-semibold'

function AdminUsersPage() {
  const [users, setUsers]         = useState([])
  const [pagination, setPagination] = useState({})
  const [page, setPage]           = useState(1)
  const [search, setSearch]       = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [activeFilter, setActiveFilter] = useState('')
  const [loading, setLoading]     = useState(true)
  const [busy, setBusy]           = useState(null)

  const load = useCallback(() => {
    getUsers({ page, limit: 15, search: search || undefined, role: roleFilter || undefined, is_active: activeFilter || undefined })
      .then((r) => { setUsers(r.users || []); setPagination(r.pagination || {}) })
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [page, search, roleFilter, activeFilter])

  useEffect(() => { load() }, [load])

  const act = async (fn, userId) => {
    setBusy(userId)
    try { await fn(userId); load() } catch { /* */ }
    setBusy(null)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Users</h1>
          <Link to="/admin/dashboard" className="text-sm text-emerald-600 hover:underline dark:text-emerald-400">← Dashboard</Link>
        </div>

        {/* filters */}
        <div className={'mt-4 flex flex-wrap gap-3 ' + card}>
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Search name / email…" className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800" />
          <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800">
            <option value="">All roles</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
            <option value="technician">Technician</option>
            <option value="vendor">Vendor</option>
          </select>
          <select value={activeFilter} onChange={(e) => { setActiveFilter(e.target.value); setPage(1) }} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800">
            <option value="">Active + Blocked</option>
            <option value="true">Active only</option>
            <option value="false">Blocked only</option>
          </select>
        </div>

        {loading && <p className="mt-6 text-center text-sm text-slate-500">Loading…</p>}

        {!loading && (
          <>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead><tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="pb-2 pr-3">Name</th><th className="pb-2 pr-3">Email</th><th className="pb-2 pr-3">Phone</th><th className="pb-2 pr-3">Role</th><th className="pb-2 pr-3">Active</th><th className="pb-2 pr-3">Joined</th><th className="pb-2">Actions</th>
                </tr></thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.user_id} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="py-2 pr-3"><Link to={`/admin/users/${u.user_id}`} className="text-emerald-600 hover:underline dark:text-emerald-400">{u.full_name}</Link></td>
                      <td className="py-2 pr-3">{u.email}</td>
                      <td className="py-2 pr-3">{u.phone_number || '--'}</td>
                      <td className="py-2 pr-3 capitalize">{u.role}</td>
                      <td className="py-2 pr-3">{u.is_active ? <span className="text-green-600">Yes</span> : <span className="text-red-500">No</span>}</td>
                      <td className="py-2 pr-3">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="flex gap-1 py-2">
                        {u.role !== 'admin' && (
                          <>
                            {u.is_active
                              ? <button disabled={busy === u.user_id} onClick={() => act(blockUser, u.user_id)} className={btn + ' bg-amber-600 text-white hover:bg-amber-500'}>Block</button>
                              : <button disabled={busy === u.user_id} onClick={() => act(unblockUser, u.user_id)} className={btn + ' bg-emerald-600 text-white hover:bg-emerald-500'}>Unblock</button>
                            }
                            <button disabled={busy === u.user_id} onClick={() => { if (confirm('Delete this user?')) act(deleteUser, u.user_id) }} className={btn + ' bg-red-600 text-white hover:bg-red-500'}>Delete</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && <tr><td colSpan={7} className="py-6 text-center text-slate-500">No users found</td></tr>}
                </tbody>
              </table>
            </div>

            {/* pagination */}
            <div className="mt-4 flex items-center justify-between text-sm">
              <span>Page {pagination.page || 1} of {pagination.totalPages || 1} ({pagination.total || 0} total)</span>
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

export default AdminUsersPage
