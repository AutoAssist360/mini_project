import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getRevenueAnalytics, getMatchingAnalytics, getPerformanceAnalytics } from '../lib/api'

const card = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900'

function AdminAnalyticsPage() {
  const [range, setRange]   = useState({ from: '', to: '', granularity: 'month' })
  const [revenue, setRev]   = useState(null)
  const [matching, setMatch] = useState(null)
  const [perf, setPerf]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getRevenueAnalytics({ granularity: 'month' }).catch(() => null),
      getMatchingAnalytics({ granularity: 'month' }).catch(() => null),
      getPerformanceAnalytics({ granularity: 'month' }).catch(() => null),
    ]).then(([r, m, p]) => { setRev(r); setMatch(m); setPerf(p) }).finally(() => setLoading(false))
  }, [])

  const handleApply = (e) => {
    e.preventDefault()
    setLoading(true)
    const q = {}
    if (range.from) q.from = range.from
    if (range.to) q.to = range.to
    if (range.granularity) q.granularity = range.granularity
    Promise.all([
      getRevenueAnalytics(q).catch(() => null),
      getMatchingAnalytics(q).catch(() => null),
      getPerformanceAnalytics(q).catch(() => null),
    ]).then(([r, m, p]) => { setRev(r); setMatch(m); setPerf(p) }).finally(() => setLoading(false))
  }

  const stat = (label, value) => (
    <div key={label} className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold">{value ?? '--'}</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Link to="/admin/dashboard" className="text-sm text-emerald-600 hover:underline dark:text-emerald-400">← Dashboard</Link>
        <h1 className="mt-2 text-xl font-bold">Analytics</h1>

        {/* date filter */}
        <form onSubmit={handleApply} className={card + ' mt-4 flex flex-wrap gap-3 items-end'}>
          <div>
            <label className="block text-xs font-medium mb-1">From</label>
            <input type="date" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">To</label>
            <input type="date" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Granularity</label>
            <select value={range.granularity} onChange={(e) => setRange({ ...range, granularity: e.target.value })} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900">
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
            </select>
          </div>
          <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-500">Apply</button>
        </form>

        {loading && <p className="mt-6 text-center text-slate-500">Loading analytics…</p>}

        {/* revenue */}
        {revenue && (
          <section className={card + ' mt-5'}>
            <h2 className="text-sm font-semibold mb-3">Revenue</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {stat('Service Revenue', revenue.service_revenue != null ? `₹${revenue.service_revenue}` : '--')}
              {stat('Order Revenue', revenue.order_revenue != null ? `₹${revenue.order_revenue}` : '--')}
              {stat('Total Revenue', revenue.total_revenue != null ? `₹${revenue.total_revenue}` : '--')}
              {stat('Invoices Count', revenue.invoices_count)}
            </div>

            {revenue.breakdown?.length > 0 && (
              <div className="mt-4 overflow-x-auto">
                <h3 className="text-xs font-semibold mb-2">Revenue Breakdown</h3>
                <table className="w-full text-left text-sm">
                  <thead><tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="pb-2 pr-3">Period</th><th className="pb-2 pr-3">Service ₹</th><th className="pb-2 pr-3">Order ₹</th><th className="pb-2">Total ₹</th>
                  </tr></thead>
                  <tbody>
                    {revenue.breakdown.map((b, i) => (
                      <tr key={i} className="border-b border-slate-100 dark:border-slate-800">
                        <td className="py-1 pr-3">{b.period}</td>
                        <td className="py-1 pr-3">{b.service_revenue}</td>
                        <td className="py-1 pr-3">{b.order_revenue}</td>
                        <td className="py-1">{b.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* matching */}
        {matching && (
          <section className={card + ' mt-5'}>
            <h2 className="text-sm font-semibold mb-3">Request Matching</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {stat('Total Requests', matching.total_requests)}
              {stat('Completion Rate', matching.completion_rate != null ? `${matching.completion_rate}%` : '--')}
              {stat('Cancellation Rate', matching.cancellation_rate != null ? `${matching.cancellation_rate}%` : '--')}
              {stat('Avg Offers/Request', matching.avg_offers_per_request)}
            </div>

            {matching.by_issue_type?.length > 0 && (
              <div className="mt-4 overflow-x-auto">
                <h3 className="text-xs font-semibold mb-2">By Issue Type</h3>
                <table className="w-full text-left text-sm">
                  <thead><tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="pb-2 pr-3">Issue Type</th><th className="pb-2 pr-3">Count</th><th className="pb-2 pr-3">Completed</th><th className="pb-2">Cancelled</th>
                  </tr></thead>
                  <tbody>
                    {matching.by_issue_type.map((b, i) => (
                      <tr key={i} className="border-b border-slate-100 dark:border-slate-800">
                        <td className="py-1 pr-3 capitalize">{b.issue_type?.replace(/_/g, ' ')}</td>
                        <td className="py-1 pr-3">{b.count}</td>
                        <td className="py-1 pr-3">{b.completed}</td>
                        <td className="py-1">{b.cancelled}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* performance */}
        {perf && (
          <section className={card + ' mt-5'}>
            <h2 className="text-sm font-semibold mb-3">Technician Performance</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {stat('Total Jobs', perf.total_jobs)}
              {stat('Completion Rate', perf.completion_rate != null ? `${perf.completion_rate}%` : '--')}
              {stat('Avg Duration', perf.avg_duration_hours != null ? `${perf.avg_duration_hours}h` : '--')}
              {stat('Avg Rating', perf.avg_rating)}
            </div>

            {perf.top_technicians?.length > 0 && (
              <div className="mt-4 overflow-x-auto">
                <h3 className="text-xs font-semibold mb-2">Top 10 Technicians</h3>
                <table className="w-full text-left text-sm">
                  <thead><tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="pb-2 pr-3">#</th><th className="pb-2 pr-3">Name</th><th className="pb-2 pr-3">Jobs</th><th className="pb-2 pr-3">Completed</th><th className="pb-2 pr-3">Avg Rating</th><th className="pb-2">Revenue ₹</th>
                  </tr></thead>
                  <tbody>
                    {perf.top_technicians.map((t, i) => (
                      <tr key={i} className="border-b border-slate-100 dark:border-slate-800">
                        <td className="py-1 pr-3">{i + 1}</td>
                        <td className="py-1 pr-3">{t.name || t.full_name || '--'}</td>
                        <td className="py-1 pr-3">{t.total_jobs}</td>
                        <td className="py-1 pr-3">{t.completed_jobs}</td>
                        <td className="py-1 pr-3">{t.avg_rating ?? '--'}</td>
                        <td className="py-1">{t.revenue ?? '--'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}

export default AdminAnalyticsPage
