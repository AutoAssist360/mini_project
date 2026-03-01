/* ------------------------------------------------------------------ */
/*  Admin Dashboard — API layer                                       */
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

/* ---------- store wiring (avoids circular imports) ---------- */
let _getStore = () => null
export function wireStore(fn) { _getStore = fn }

/* ---------- error class ---------- */
export class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

/* ---------- low-level request (base-url fallback) ---------- */
async function apiRequestRaw(path, options = {}) {
  let lastError
  const { headers: extra, ...rest } = options
  const store  = _getStore()
  const token  = store?.getState()?.auth?.accessToken

  for (let i = 0; i < API_BASE_CANDIDATES.length; i++) {
    const base = API_BASE_CANDIDATES[i]
    const more = i < API_BASE_CANDIDATES.length - 1

    const res = await fetch(`${base}${path}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...extra,
      },
      ...rest,
    })

    const json = (res.headers.get('content-type') || '').includes('application/json')
    const data = json ? await res.json() : null

    if (res.ok) return data

    const msg = data?.message || 'Request failed'
    const wrongBase =
      (res.status === 404 && /route not found/i.test(msg)) ||
      (more && res.status === 401 && /authentication token missing/i.test(msg))

    if (!wrongBase) throw new ApiError(msg, res.status, data)
    lastError = new ApiError(msg, res.status, data)
  }
  throw lastError || new ApiError('Request failed', 500, null)
}

/* ---------- auto-refresh wrapper ---------- */
let refreshPromise = null

async function apiRequest(path, options = {}) {
  try {
    return await apiRequestRaw(path, options)
  } catch (err) {
    if (err.status !== 401) throw err

    const store = _getStore()
    if (!store) throw err

    if (!refreshPromise) {
      refreshPromise = apiRequestRaw('/admin/auth/refresh', { method: 'POST' })
        .then((r) => {
          store.dispatch({ type: 'auth/setAuthTokens', payload: { accessToken: r.accessToken } })
          return r
        })
        .catch((e) => {
          store.dispatch({ type: 'auth/clearAuth' })
          throw e
        })
        .finally(() => { refreshPromise = null })
    }

    await refreshPromise
    return apiRequestRaw(path, options)
  }
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
  return apiRequestRaw('/admin/auth/signin', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
export function adminLogout() {
  return apiRequest('/admin/auth/logout', { method: 'POST' })
}
export function adminRefresh() {
  return apiRequestRaw('/admin/auth/refresh', { method: 'POST' })
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

export async function getAdminDashboard(accessToken) {
  return apiRequest('/admin/dashboard', {
    method: 'GET',
    accessToken,
  })
}
