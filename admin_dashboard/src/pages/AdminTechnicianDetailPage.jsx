import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getTechnicianById, verifyTechnician, suspendTechnician, unsuspendTechnician, getTechnicianJobs } from '../lib/api'

const card = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900'
const btn  = 'rounded-lg px-3 py-1.5 text-xs font-semibold'
const badge = (c) => `inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${c}`

function AdminTechnicianDetailPage() {
  const { techId } = useParams()
  const [tech, setTech]     = useState(null)
  const [jobs, setJobs]     = useState([])
  const [jobPag, setJobPag] = useState({})
  const [jobPage, setJobPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy]     = useState(false)

  const load = useCallback(() => {
    getTechnicianById(techId).then((r) => setTech(r.technician || r)).catch(() => null).finally(() => setLoading(false))
  }, [techId])
  useEffect(() => { load() }, [load])

  const loadJobs = useCallback(() => {
    getTechnicianJobs(techId, { page: jobPage, limit: 10 }).then((r) => { setJobs(r.jobs || []); setJobPag(r.pagination || {}) }).catch(() => null)
  }, [techId, jobPage])
  useEffect(() => { loadJobs() }, [loadJobs])

  const act = async (fn) => { setBusy(true); try { await fn(techId); load() } catch { /* */ } setBusy(false) }

  if (loading) return <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center"><p className="text-slate-500">Loading…</p></div>
  if (!tech) return <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center"><p className="text-slate-500">Technician not found</p></div>

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <Link to="/admin/technicians" className="text-sm text-emerald-600 hover:underline dark:text-emerald-400">← Back to Technicians</Link>

        {/* header */}
        <div className={card + ' mt-4'}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold">{tech.user?.full_name || 'Technician'}</h1>
              <p className="text-sm text-slate-500">{tech.user?.email} · {tech.user?.phone_number || '--'}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className={badge('bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 capitalize')}>{tech.technician_type}</span>
                {tech.is_verified ? <span className={badge('bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200')}>Verified</span> : <span className={badge('bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200')}>Unverified</span>}
                {tech.is_online ? <span className={badge('bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200')}>Online</span> : <span className={badge('bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400')}>Offline</span>}
              </div>
            </div>
            <div className="flex gap-2">
              {!tech.is_verified && <button disabled={busy} onClick={() => act(verifyTechnician)} className={btn + ' bg-emerald-600 text-white hover:bg-emerald-500'}>Verify</button>}
              {tech.user?.is_active
                ? <button disabled={busy} onClick={() => act(suspendTechnician)} className={btn + ' bg-amber-600 text-white hover:bg-amber-500'}>Suspend</button>
                : <button disabled={busy} onClick={() => act(unsuspendTechnician)} className={btn + ' bg-blue-600 text-white hover:bg-blue-500'}>Unsuspend</button>
              }
            </div>
          </div>
        </div>

        {/* profile info */}
        <div className={'mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3'}>
          {[
            ['Business', tech.business_name || '--'],
            ['Location', tech.location],
            ['Radius', `${tech.service_radius} km`],
            ['Rating', `${tech.rating ?? '--'} (${tech.total_reviews} reviews)`],
            ['Lat / Lng', `${tech.latitude}, ${tech.longitude}`],
            ['Offers / Jobs', `${tech._count?.offers ?? '--'} / ${tech._count?.jobs ?? '--'}`],
          ].map(([l, v]) => (
            <div key={l} className={card}>
              <p className="text-xs text-slate-500 dark:text-slate-400">{l}</p>
              <p className="mt-1 text-sm font-semibold">{v}</p>
            </div>
          ))}
        </div>

        {/* certifications */}
        {tech.certifications?.length > 0 && (
          <section className={card + ' mt-4'}>
            <h2 className="text-base font-semibold">Certifications</h2>
            <div className="mt-3 space-y-2 text-sm">
              {tech.certifications.map((c) => (
                <div key={c.certification_id} className="flex flex-wrap gap-4 border-b border-slate-100 pb-2 dark:border-slate-800">
                  <span className="font-medium">{c.certification}</span>
                  <span className="text-slate-500">by {c.issued_by}</span>
                  <span className="text-slate-400">{new Date(c.issue_date).toLocaleDateString()}{c.expiry_date ? ` → ${new Date(c.expiry_date).toLocaleDateString()}` : ''}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* car supports */}
        {tech.carSupports?.length > 0 && (
          <section className={card + ' mt-4'}>
            <h2 className="text-base font-semibold">Car Supports</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {tech.carSupports.map((cs) => (
                <span key={cs.support_id} className={badge('bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300')}>{cs.company?.company_name || 'Company'}{cs.variant ? ` / ${cs.variant.variant_name}` : ''}</span>
              ))}
            </div>
          </section>
        )}

        {/* part skills */}
        {tech.partSkills?.length > 0 && (
          <section className={card + ' mt-4'}>
            <h2 className="text-base font-semibold">Part Skills</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {tech.partSkills.map((ps) => (
                <span key={ps.skill_id} className={badge('bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300')}>{ps.part?.part_name || `Part #${ps.part_id}`}</span>
              ))}
            </div>
          </section>
        )}

        {/* resources */}
        {tech.resources?.length > 0 && (
          <section className={card + ' mt-4'}>
            <h2 className="text-base font-semibold">Resources / Equipment</h2>
            <ul className="mt-2 list-inside list-disc text-sm">
              {tech.resources.map((r) => <li key={r.resource_id}>{r.resource_type}: {r.description}</li>)}
            </ul>
          </section>
        )}

        {/* jobs */}
        <section className={card + ' mt-4'}>
          <h2 className="text-base font-semibold">Jobs</h2>
          {jobs.length === 0 && <p className="mt-2 text-sm text-slate-500">No jobs yet</p>}
          {jobs.length > 0 && (
            <>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead><tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="pb-2 pr-3">Job ID</th><th className="pb-2 pr-3">Issue</th><th className="pb-2 pr-3">Status</th><th className="pb-2">Started</th>
                  </tr></thead>
                  <tbody>
                    {jobs.map((j) => (
                      <tr key={j.job_id} className="border-b border-slate-100 dark:border-slate-800">
                        <td className="py-2 pr-3"><Link to={`/admin/jobs/${j.job_id}`} className="text-emerald-600 hover:underline dark:text-emerald-400">{j.job_id.slice(0, 8)}</Link></td>
                        <td className="py-2 pr-3">{j.request?.issue_type?.replace(/_/g, ' ') || '--'}</td>
                        <td className="py-2 pr-3"><span className={badge('bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300')}>{j.status}</span></td>
                        <td className="py-2">{j.started_at ? new Date(j.started_at).toLocaleDateString() : '--'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span>Page {jobPag.page || 1} / {jobPag.totalPages || 1}</span>
                <div className="flex gap-2">
                  <button disabled={jobPage <= 1} onClick={() => setJobPage((p) => p - 1)} className={btn + ' border border-slate-300 dark:border-slate-700'}>Prev</button>
                  <button disabled={jobPage >= (jobPag.totalPages || 1)} onClick={() => setJobPage((p) => p + 1)} className={btn + ' border border-slate-300 dark:border-slate-700'}>Next</button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}

export default AdminTechnicianDetailPage
