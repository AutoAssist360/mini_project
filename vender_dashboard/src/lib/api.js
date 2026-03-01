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

/* ------------------------------------------------------------------ */
/*  Core request — cookie-only auth (no Bearer headers)                */
/* ------------------------------------------------------------------ */
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

    // Auto-refresh on expired access token (retry once)
    if (response.status === 401 && !_retried) {
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

/* ------------------------------------------------------------------ */
/*  Token refresh (shared promise prevents concurrent refresh calls)   */
/* ------------------------------------------------------------------ */
let refreshPromise = null

export async function refreshSession() {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    for (const baseUrl of API_BASE_CANDIDATES) {
      try {
        const res = await fetch(`${baseUrl}/vendor/auth/refresh`, {
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

/* ------------------------------------------------------------------ */
/*  Auth                                                               */
/* ------------------------------------------------------------------ */
export async function vendorSignIn(payload) {
  return apiRequest('/vendor/auth/signin', { method: 'POST', body: JSON.stringify(payload) })
}

export async function vendorSignUp(payload) {
  return apiRequest('/vendor/auth/signup', { method: 'POST', body: JSON.stringify(payload) })
}

export async function vendorLogout() {
  return apiRequest('/vendor/auth/logout', { method: 'POST' })
}

/* ------------------------------------------------------------------ */
/*  Warehouses                                                         */
/* ------------------------------------------------------------------ */
export async function getWarehouses(page = 1, limit = 20, isActive) {
  let qs = `?page=${page}&limit=${limit}`
  if (isActive !== undefined) qs += `&is_active=${isActive}`
  return apiRequest(`/vendor/warehouses${qs}`)
}

export async function getWarehouseById(warehouseId) {
  return apiRequest(`/vendor/warehouses/${warehouseId}`)
}

export async function createWarehouse(payload) {
  return apiRequest('/vendor/warehouses', { method: 'POST', body: JSON.stringify(payload) })
}

export async function updateWarehouse(warehouseId, payload) {
  return apiRequest(`/vendor/warehouses/${warehouseId}`, { method: 'PUT', body: JSON.stringify(payload) })
}

export async function deleteWarehouse(warehouseId) {
  return apiRequest(`/vendor/warehouses/${warehouseId}`, { method: 'DELETE' })
}

/* ------------------------------------------------------------------ */
/*  Inventory                                                          */
/* ------------------------------------------------------------------ */
export async function getInventory(warehouseId, page = 1, limit = 20, lowStock) {
  let qs = `?page=${page}&limit=${limit}`
  if (lowStock) qs += '&low_stock=true'
  return apiRequest(`/vendor/warehouses/${warehouseId}/inventory${qs}`)
}

export async function addInventory(warehouseId, payload) {
  return apiRequest(`/vendor/warehouses/${warehouseId}/inventory`, { method: 'POST', body: JSON.stringify(payload) })
}

export async function updateInventory(inventoryId, payload) {
  return apiRequest(`/vendor/inventory/${inventoryId}`, { method: 'PUT', body: JSON.stringify(payload) })
}

export async function deleteInventory(inventoryId) {
  return apiRequest(`/vendor/inventory/${inventoryId}`, { method: 'DELETE' })
}

export async function bulkUpsertInventory(warehouseId, items) {
  return apiRequest(`/vendor/warehouses/${warehouseId}/inventory/bulk`, { method: 'POST', body: JSON.stringify({ items }) })
}

/* ------------------------------------------------------------------ */
/*  Reservations                                                       */
/* ------------------------------------------------------------------ */
export async function getReservations(warehouseId, page = 1, limit = 20, status) {
  let qs = `?page=${page}&limit=${limit}`
  if (status) qs += `&status=${status}`
  return apiRequest(`/vendor/warehouses/${warehouseId}/reservations${qs}`)
}

export async function getReservationById(reservationId) {
  return apiRequest(`/vendor/reservations/${reservationId}`)
}

/* ------------------------------------------------------------------ */
/*  Orders                                                             */
/* ------------------------------------------------------------------ */
export async function getOrders(page = 1, limit = 20, filters = {}) {
  let qs = `?page=${page}&limit=${limit}`
  if (filters.order_status) qs += `&order_status=${filters.order_status}`
  if (filters.payment_status) qs += `&payment_status=${filters.payment_status}`
  if (filters.from) qs += `&from=${filters.from}`
  if (filters.to) qs += `&to=${filters.to}`
  return apiRequest(`/vendor/orders${qs}`)
}

export async function getOrderById(orderId) {
  return apiRequest(`/vendor/orders/${orderId}`)
}

export async function confirmOrder(orderId) {
  return apiRequest(`/vendor/orders/${orderId}/confirm`, { method: 'PATCH' })
}

export async function cancelOrder(orderId) {
  return apiRequest(`/vendor/orders/${orderId}/cancel`, { method: 'PATCH' })
}

export async function returnOrder(orderId, reason) {
  return apiRequest(`/vendor/orders/${orderId}/return`, { method: 'POST', body: JSON.stringify({ reason }) })
}

/* ------------------------------------------------------------------ */
/*  Fulfillment                                                        */
/* ------------------------------------------------------------------ */
export async function getOrderFulfillments(orderId) {
  return apiRequest(`/vendor/orders/${orderId}/fulfillment`)
}

export async function updateFulfillmentStatus(fulfillmentId, payload) {
  return apiRequest(`/vendor/fulfillment/${fulfillmentId}/status`, { method: 'PATCH', body: JSON.stringify(payload) })
}

/* ------------------------------------------------------------------ */
/*  Analytics                                                          */
/* ------------------------------------------------------------------ */
export async function getRevenueAnalytics(from, to) {
  let qs = ''
  if (from || to) {
    const parts = []
    if (from) parts.push(`from=${from}`)
    if (to) parts.push(`to=${to}`)
    qs = `?${parts.join('&')}`
  }
  return apiRequest(`/vendor/analytics/revenue${qs}`)
}

export async function getOrderAnalytics(from, to) {
  let qs = ''
  if (from || to) {
    const parts = []
    if (from) parts.push(`from=${from}`)
    if (to) parts.push(`to=${to}`)
    qs = `?${parts.join('&')}`
  }
  return apiRequest(`/vendor/analytics/orders${qs}`)
}

export async function getInventoryAnalytics() {
  return apiRequest('/vendor/analytics/inventory')
}

export async function getLowStockItems(warehouseId, page = 1, limit = 20, threshold) {
  let qs = `?page=${page}&limit=${limit}`
  if (threshold) qs += `&threshold=${threshold}`
  return apiRequest(`/vendor/analytics/warehouses/${warehouseId}/low-stock${qs}`)
}
