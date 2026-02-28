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

  for (const baseUrl of API_BASE_CANDIDATES) {
    const response = await fetch(`${baseUrl}${path}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    })

    const isJson = (response.headers.get('content-type') || '').includes('application/json')
    const data = isJson ? await response.json() : null

    if (response.ok) {
      return data
    }

    const message = data?.message || 'Request failed'
    const isLikelyWrongBase =
      response.status === 404 && /route not found/i.test(message)

    if (!isLikelyWrongBase) {
      throw new ApiError(message, response.status, data)
    }

    lastError = new ApiError(message, response.status, {
      ...(data || {}),
      requestUrl: `${baseUrl}${path}`,
    })
  }

  throw lastError || new ApiError('Request failed', 500, null)
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
