/* ------------------------------------------------------------------ */
/*  Admin Dashboard — API layer (cookie-only auth)                    */
/* ------------------------------------------------------------------ */

const RAW_API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

function normalizeBaseUrl(url) {
  return (url || 'http://localhost:3000').replace(/\/+$/, '')
}
function getBaseCandidates() {
  const n = normalizeBaseUrl(RAW_API_BASE_URL)
  const c = [n]
  if (n.endsWith('/api')) c.push(n.slice(0, -4))
  else c.push(`${n}/api`)
  return [...new Set(c)]
}
const API_BASE_CANDIDATES = getBaseCandidates()

/* ---------- error class ---------- */
export class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

/* ---------- core request — cookie-only (no Bearer headers) ---------- */
async function apiRequest(path, options = {}) {
  let lastError
  const _retried = options._retried || false
  const { _retried: _, ...fetchOptions } = options

  for (let i = 0; i < API_BASE_CANDIDATES.length; i++) {
    const base = API_BASE_CANDIDATES[i]

    const res = await fetch(`${base}${path}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(fetchOptions.headers || {}),
      },
      ...fetchOptions,
    })

    const json = (res.headers.get('content-type') || '').includes('application/json')
    const data = json ? await res.json() : null

    if (res.ok) return data

    const msg = data?.message || 'Request failed'
    const wrongBase =
      res.status === 404 && /route not found/i.test(msg)

    if (wrongBase) {
      lastError = new ApiError(msg, res.status, data)
      continue
    }

    // Auto-refresh on expired access token (retry once)
    if (res.status === 401 && !_retried) {
      try {
        await refreshSession()
        return apiRequest(path, { ...fetchOptions, _retried: true })
      } catch {
        // refresh failed — fall through to throw original error
      }
    }

    throw new ApiError(msg, res.status, data)
  }
  throw lastError || new ApiError('Request failed', 500, null)
}

/* ---------- Token refresh (shared promise) ---------- */
let refreshPromise = null

export async function refreshSession() {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    for (const base of API_BASE_CANDIDATES) {
      try {
        const res = await fetch(`${base}/admin/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        })
        if (res.ok) return true
      } catch {
        // try next base URL candidate
      }
    }
    throw new Error('Session expired')
  })().finally(() => { refreshPromise = null })

  return refreshPromise
}

/* ================================================================== */
/*  helper: build query string                                        */
/* ================================================================== */
function qs(params = {}) {
  const s = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') s.append(k, v)
  })
  const str = s.toString()
  return str ? `?${str}` : ''
}

/* ================================================================== */
/*  1. AUTH                                                           */
/* ================================================================== */
export function adminSignIn(payload) {
  return apiRequest('/admin/auth/signin', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
export function adminLogout() {
  return apiRequest('/admin/auth/logout', { method: 'POST' })
}

/* ================================================================== */
/*  2. DASHBOARD                                                      */
/* ================================================================== */
export function getDashboard() {
  return apiRequest('/admin/dashboard')
}

/* ================================================================== */
/*  3. USERS                                                          */
/* ================================================================== */
export function getUsers(params) {
  return apiRequest(`/admin/users${qs(params)}`)
}
export function getUserById(userId) {
  return apiRequest(`/admin/users/${userId}`)
}
export function blockUser(userId) {
  return apiRequest(`/admin/users/${userId}/block`, { method: 'PATCH' })
}
export function unblockUser(userId) {
  return apiRequest(`/admin/users/${userId}/unblock`, { method: 'PATCH' })
}
export function deleteUser(userId) {
  return apiRequest(`/admin/users/${userId}`, { method: 'DELETE' })
}

/* ================================================================== */
/*  4. TECHNICIANS                                                    */
/* ================================================================== */
export function getTechnicians(params) {
  return apiRequest(`/admin/technicians${qs(params)}`)
}
export function getTechnicianById(techId) {
  return apiRequest(`/admin/technicians/${techId}`)
}
export function verifyTechnician(techId) {
  return apiRequest(`/admin/technicians/${techId}/verify`, { method: 'PATCH' })
}
export function suspendTechnician(techId) {
  return apiRequest(`/admin/technicians/${techId}/suspend`, { method: 'PATCH' })
}
export function unsuspendTechnician(techId) {
  return apiRequest(`/admin/technicians/${techId}/unsuspend`, { method: 'PATCH' })
}
export function getTechnicianJobs(techId, params) {
  return apiRequest(`/admin/technicians/${techId}/jobs${qs(params)}`)
}

/* ================================================================== */
/*  5. VENDORS                                                        */
/* ================================================================== */
export function getVendors(params) {
  return apiRequest(`/admin/vendors${qs(params)}`)
}
export function getVendorById(vendorId) {
  return apiRequest(`/admin/vendors/${vendorId}`)
}
export function suspendVendor(vendorId) {
  return apiRequest(`/admin/vendors/${vendorId}/suspend`, { method: 'PATCH' })
}
export function unsuspendVendor(vendorId) {
  return apiRequest(`/admin/vendors/${vendorId}/unsuspend`, { method: 'PATCH' })
}
export function getVendorWarehouses(vendorId, params) {
  return apiRequest(`/admin/vendors/${vendorId}/warehouses${qs(params)}`)
}

/* ================================================================== */
/*  6. WAREHOUSES                                                     */
/* ================================================================== */
export function getWarehouses(params) {
  return apiRequest(`/admin/warehouses${qs(params)}`)
}
export function getWarehouseById(warehouseId) {
  return apiRequest(`/admin/warehouses/${warehouseId}`)
}
export function getWarehouseInventory(warehouseId, params) {
  return apiRequest(`/admin/warehouses/${warehouseId}/inventory${qs(params)}`)
}

/* ================================================================== */
/*  7. REQUESTS                                                       */
/* ================================================================== */
export function getRequests(params) {
  return apiRequest(`/admin/requests${qs(params)}`)
}
export function getRequestById(requestId) {
  return apiRequest(`/admin/requests/${requestId}`)
}
export function cancelRequest(requestId) {
  return apiRequest(`/admin/requests/${requestId}/cancel`, { method: 'PATCH' })
}
export function forceAssignTechnician(requestId, payload) {
  return apiRequest(`/admin/requests/${requestId}/force-assign`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/* ================================================================== */
/*  8. JOBS                                                           */
/* ================================================================== */
export function getJobs(params) {
  return apiRequest(`/admin/jobs${qs(params)}`)
}
export function getJobById(jobId) {
  return apiRequest(`/admin/jobs/${jobId}`)
}

/* ================================================================== */
/*  9. ORDERS                                                         */
/* ================================================================== */
export function getOrders(params) {
  return apiRequest(`/admin/orders${qs(params)}`)
}
export function getOrderById(orderId) {
  return apiRequest(`/admin/orders/${orderId}`)
}
export function refundOrder(orderId, reason) {
  return apiRequest(`/admin/orders/${orderId}/refund`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
}

/* ================================================================== */
/*  10. INVOICES                                                      */
/* ================================================================== */
export function getInvoices(params) {
  return apiRequest(`/admin/invoices${qs(params)}`)
}
export function getInvoiceById(invoiceId) {
  return apiRequest(`/admin/invoices/${invoiceId}`)
}
export function markInvoicePaid(invoiceId) {
  return apiRequest(`/admin/invoices/${invoiceId}/mark-paid`, { method: 'PATCH' })
}

/* ================================================================== */
/*  11. ANALYTICS                                                     */
/* ================================================================== */
export function getRevenueAnalytics(params) {
  return apiRequest(`/admin/analytics/revenue${qs(params)}`)
}
export function getMatchingAnalytics(params) {
  return apiRequest(`/admin/analytics/matching${qs(params)}`)
}
export function getPerformanceAnalytics(params) {
  return apiRequest(`/admin/analytics/performance${qs(params)}`)
}

/* ================================================================== */
/*  12. AUDIT LOGS                                                    */
/* ================================================================== */
export function getAuditLogs(params) {
  return apiRequest(`/admin/audit-logs${qs(params)}`)
}

export function getAdminDashboard() {
  return apiRequest('/admin/dashboard')
}
