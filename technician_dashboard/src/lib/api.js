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
        const res = await fetch(`${baseUrl}/tech/auth/refresh`, {
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
/*  AUTH                                                               */
/* ================================================================== */

export async function technicianSignIn(payload) {
  return apiRequest('/tech/auth/signin', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function technicianSignUp(payload) {
  return apiRequest('/tech/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function technicianLogout() {
  return apiRequest('/tech/auth/logout', {
    method: 'POST',
  })
}

/* ================================================================== */
/*  PROFILE                                                            */
/* ================================================================== */

export async function getTechnicianProfile() {
  return apiRequest('/tech/profile', { method: 'GET' })
}

export async function updateTechnicianProfile(payload) {
  return apiRequest('/tech/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function addCertification(payload) {
  return apiRequest('/tech/profile/certifications', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function deleteCertification(certId) {
  return apiRequest(`/tech/profile/certifications/${certId}`, {
    method: 'DELETE',
  })
}

/* ================================================================== */
/*  AVAILABILITY                                                       */
/* ================================================================== */

export async function updateAvailability(isOnline) {
  return apiRequest('/tech/availability', {
    method: 'PATCH',
    body: JSON.stringify({ is_online: isOnline }),
  })
}

/* ================================================================== */
/*  OFFERS                                                             */
/* ================================================================== */

export async function getOffers(page = 1, limit = 20) {
  return apiRequest(`/tech/offers?page=${page}&limit=${limit}`, { method: 'GET' })
}

export async function getOfferById(offerId) {
  return apiRequest(`/tech/offers/${offerId}`, { method: 'GET' })
}

export async function createOffer(payload) {
  return apiRequest('/tech/offers', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/* ================================================================== */
/*  PENDING OFFERS (pool for technician to browse)                     */
/* ================================================================== */

export async function getPendingOffers(page = 1, limit = 20) {
  return apiRequest(`/tech/offers/pending?page=${page}&limit=${limit}`, { method: 'GET' })
}

/* ================================================================== */
/*  ASSIGNMENTS                                                        */
/* ================================================================== */

export async function getPendingAssignments() {
  return apiRequest('/tech/assignments/pending', { method: 'GET' })
}

export async function acceptAssignment(jobId) {
  return apiRequest(`/tech/assignments/${jobId}/accept`, { method: 'POST' })
}

export async function rejectAssignment(jobId) {
  return apiRequest(`/tech/assignments/${jobId}/reject`, { method: 'POST' })
}

/* ================================================================== */
/*  JOBS                                                               */
/* ================================================================== */

export async function getJobs(page = 1, limit = 20, status = '') {
  let url = `/tech/jobs?page=${page}&limit=${limit}`
  if (status) url += `&status=${status}`
  return apiRequest(url, { method: 'GET' })
}

export async function getJobById(jobId) {
  return apiRequest(`/tech/jobs/${jobId}`, { method: 'GET' })
}

export async function updateJobStatus(jobId, status) {
  return apiRequest(`/tech/jobs/${jobId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export async function suggestParts(jobId, parts) {
  return apiRequest(`/tech/jobs/${jobId}/suggest-parts`, {
    method: 'POST',
    body: JSON.stringify({ parts }),
  })
}

export async function completeJob(jobId) {
  return apiRequest(`/tech/jobs/${jobId}/complete`, { method: 'POST' })
}

export async function createInvoice(jobId, payload) {
  return apiRequest(`/tech/jobs/${jobId}/invoice`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/* ================================================================== */
/*  EARNINGS                                                           */
/* ================================================================== */

export async function getEarnings() {
  return apiRequest('/tech/earnings', { method: 'GET' })
}

/* ================================================================== */
/*  LOCATION                                                           */
/* ================================================================== */

export async function updateLocation(latitude, longitude) {
  return apiRequest('/tech/location', {
    method: 'POST',
    body: JSON.stringify({ latitude, longitude }),
  })
}

/* ================================================================== */
/*  MESSAGES                                                           */
/* ================================================================== */

export async function getRequestMessages(requestId, page = 1, limit = 50) {
  return apiRequest(`/tech/requests/${requestId}/messages?page=${page}&limit=${limit}`, { method: 'GET' })
}

export async function sendRequestMessage(requestId, receiverId, message) {
  return apiRequest(`/tech/requests/${requestId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ receiver_id: receiverId, message }),
  })
}
