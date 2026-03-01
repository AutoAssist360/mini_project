import { setAuthTokens } from '../store/authSlice'

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
/*  Shared refresh-lock                                                */
/* ------------------------------------------------------------------ */
let refreshPromise = null

async function doRefresh(accessToken) {
  return apiRequestRaw('/vendor/auth/refresh', {
    method: 'POST',
    accessToken,
  })
}

async function apiRequestRaw(path, options = {}) {
  let lastError
  const { accessToken, ...fetchOptions } = options

  for (let index = 0; index < API_BASE_CANDIDATES.length; index += 1) {
    const baseUrl = API_BASE_CANDIDATES[index]
    const hasMoreCandidates = index < API_BASE_CANDIDATES.length - 1

    const response = await fetch(`${baseUrl}${path}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(fetchOptions.headers || {}),
      },
      ...fetchOptions,
    })

    const isJson = (response.headers.get('content-type') || '').includes('application/json')
    const data = isJson ? await response.json() : null

    if (response.ok) {
      return { data, status: response.status }
    }

    const message = data?.message || 'Request failed'
    const isLikelyWrongBase =
      response.status === 404 && /route not found/i.test(message)
    const isLikelyWrongBaseAuth =
      hasMoreCandidates &&
      response.status === 401 &&
      /authentication token missing/i.test(message)

    if (!isLikelyWrongBase && !isLikelyWrongBaseAuth) {
      throw new ApiError(message, response.status, data)
    }

    lastError = new ApiError(message, response.status, {
      ...(data || {}),
      requestUrl: `${baseUrl}${path}`,
    })
  }

  throw lastError || new ApiError('Request failed', 500, null)
}

/* ------------------------------------------------------------------ */
/*  Main request helper — auto token refresh on 401                    */
/* ------------------------------------------------------------------ */
let _getStore = null
export function wireStore(fn) { _getStore = fn }

export async function apiRequest(path, options = {}) {
  const store = _getStore?.()
  const token = options.accessToken || store?.getState()?.auth?.accessToken
  try {
    const { data } = await apiRequestRaw(path, { ...options, accessToken: token })
    return data
  } catch (err) {
    if (
      err instanceof ApiError &&
      err.status === 401 &&
      /expired/i.test(err.message) &&
      store
    ) {
      try {
        if (!refreshPromise) refreshPromise = doRefresh(token)
        const { data: refreshData } = await refreshPromise
        refreshPromise = null

        store.dispatch(setAuthTokens({
          accessToken: refreshData?.accessToken || null,
          refreshToken: refreshData?.refreshToken || null,
        }))

        const newToken = refreshData?.accessToken || token
        const { data: retryData } = await apiRequestRaw(path, { ...options, accessToken: newToken })
        return retryData
      } catch {
        refreshPromise = null
        throw err
      }
    }
    throw err
  }
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
