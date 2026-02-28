const RAW_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

function normalizeBaseUrl(url) {
  return (url || 'http://localhost:3000').replace(/\/+$/, '')
}

function getBaseCandidates() {
  const normalized = normalizeBaseUrl(RAW_API_BASE_URL)
  const candidates = [normalized]

  if (normalized.endsWith('/api')) {
    candidates.push(normalized.slice(0, -4))
  } else {
    candidates.push(`${normalized}/api`)
  }

  return [...new Set(candidates)]
}

const API_BASE_CANDIDATES = getBaseCandidates()

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

export async function apiRequest(path, options = {}) {
  let lastError
  const _retried = options._retried || false
  const { _retried: _, ...fetchOptions } = options

  for (let index = 0; index < API_BASE_CANDIDATES.length; index += 1) {
    const baseUrl = API_BASE_CANDIDATES[index]
    const response = await fetch(`${baseUrl}${path}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(fetchOptions.headers || {}),
      },
      ...fetchOptions,
    })

    const isJson = (response.headers.get('content-type') || '').includes('application/json')
    const data = isJson ? await response.json() : null

    if (response.ok) {
      return data
    }

    const message = data?.message || 'Request failed'
    const isLikelyWrongBase =
      response.status === 404 && /route not found/i.test(message)

    if (isLikelyWrongBase) {
      lastError = new ApiError(message, response.status, {
        ...(data || {}),
        requestUrl: `${baseUrl}${path}`,
      })
      continue
    }

    // Auto-refresh on expired access token (retry the request once)
    if (response.status === 401 && data?.code === 'TOKEN_EXPIRED' && !_retried) {
      try {
        await refreshSession()
        return apiRequest(path, { ...fetchOptions, _retried: true })
      } catch {
        // refresh failed — fall through to throw original error
      }
    }

    throw new ApiError(message, response.status, data)
  }

  throw lastError || new ApiError('Request failed', 500, null)
}

// ─── Token refresh (shared promise prevents concurrent refresh calls) ──
let refreshPromise = null

export async function refreshSession() {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    for (const baseUrl of API_BASE_CANDIDATES) {
      try {
        const res = await fetch(`${baseUrl}/auth/refresh`, {
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

export async function userSignIn(payload) {
  return apiRequest('/auth/signin', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function userSignUp(payload) {
  return apiRequest('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function getMyProfile() {
  return apiRequest('/profile', {
    method: 'GET',
  })
}

export async function userLogout() {
  return apiRequest('/auth/logout', {
    method: 'POST',
  })
}

export async function updateMyProfile(payload) {
  return apiRequest('/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function getVehicleVariants({ query = '', limit = 50 } = {}) {
  const params = new URLSearchParams({
    limit: String(limit),
  })

  if (query?.trim()) {
    params.set('q', query.trim())
  }

  return apiRequest(`/vehicles/variants?${params.toString()}`, {
    method: 'GET',
  })
}

export async function getMyVehicles() {
  return apiRequest('/vehicles', {
    method: 'GET',
  })
}

export async function addVehicle(payload) {
  return apiRequest('/vehicles', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateVehicle(vehicleId, payload) {
  return apiRequest(`/vehicles/${vehicleId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function deleteVehicle(vehicleId) {
  return apiRequest(`/vehicles/${vehicleId}`, {
    method: 'DELETE',
  })
}

export async function createServiceRequest(payload) {
  return apiRequest('/requests', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function getServiceRequests({ page = 1, limit = 10, status } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  })

  if (status) {
    params.set('status', status)
  }

  return apiRequest(`/requests?${params.toString()}`, {
    method: 'GET',
  })
}

export async function getServiceRequestById(requestId) {
  return apiRequest(`/requests/${requestId}`, {
    method: 'GET',
  })
}

export async function cancelServiceRequest(requestId) {
  return apiRequest(`/requests/${requestId}/cancel`, {
    method: 'PATCH',
  })
}

export async function getRequestOffers(requestId) {
  return apiRequest(`/requests/${requestId}/offers`, {
    method: 'GET',
  })
}

export async function acceptOffer(offerId) {
  return apiRequest(`/offers/${offerId}/accept`, {
    method: 'PATCH',
  })
}

export async function rejectOffer(offerId) {
  return apiRequest(`/offers/${offerId}/reject`, {
    method: 'PATCH',
  })
}

export async function getOrders({ page = 1, limit = 10, status } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  })

  if (status) {
    params.set('status', status)
  }

  return apiRequest(`/orders?${params.toString()}`, {
    method: 'GET',
  })
}

export async function getOrderById(orderId) {
  return apiRequest(`/orders/${orderId}`, {
    method: 'GET',
  })
}

export async function payOrder(orderId, payload) {
  return apiRequest(`/orders/${orderId}/pay`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function getOrderFulfillment(orderId) {
  return apiRequest(`/orders/${orderId}/fulfillment`, {
    method: 'GET',
  })
}

export async function getInvoiceById(invoiceId) {
  return apiRequest(`/invoices/${invoiceId}`, {
    method: 'GET',
  })
}

export async function payInvoice(invoiceId, payload) {
  return apiRequest(`/invoices/${invoiceId}/pay`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

// ─── Jobs ─────────────────────────────────────────────────────
export async function getJobs({ page = 1, limit = 10 } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  return apiRequest(`/jobs?${params.toString()}`, { method: 'GET' })
}

export async function getJobById(jobId) {
  return apiRequest(`/jobs/${jobId}`, { method: 'GET' })
}

// ─── Reviews ──────────────────────────────────────────────────
export async function getReviews({ page = 1, limit = 10 } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  return apiRequest(`/reviews?${params.toString()}`, { method: 'GET' })
}

export async function createReview(payload) {
  return apiRequest('/reviews', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

// ─── Messages ─────────────────────────────────────────────────
export async function getRequestMessages(requestId, { page = 1, limit = 50 } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  return apiRequest(`/requests/${requestId}/messages?${params.toString()}`, { method: 'GET' })
}

export async function sendRequestMessage(requestId, payload) {
  return apiRequest(`/requests/${requestId}/messages`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
