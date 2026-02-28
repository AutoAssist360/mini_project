const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  const isJson = (response.headers.get('content-type') || '').includes('application/json')
  const data = isJson ? await response.json() : null

  if (!response.ok) {
    throw new ApiError(data?.message || 'Request failed', response.status, data)
  }

  return data
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
  return apiRequest('/profile/me', {
    method: 'GET',
  })
}

export async function userLogout() {
  return apiRequest('/auth/logout', {
    method: 'POST',
  })
}
