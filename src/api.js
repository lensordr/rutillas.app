// ─── RUTILLAS API client ──────────────────────────────────────────────────────
const BASE = 'https://rutasenmoto-9b54b67b1a59.herokuapp.com/api'

function getToken() {
  return localStorage.getItem('rutillas_token')
}

async function request(method, path, body = null, auth = true) {
  const headers = { 'Content-Type': 'application/json' }
  if (auth) {
    const token = getToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  })
  const data = res.status === 204 ? null : await res.json()
  if (!res.ok) throw { status: res.status, data }
  return data
}

export const api = {
  // Auth
  register: (data) => request('POST', '/auth/register/', data, false),
  login: (data) => request('POST', '/auth/login/', data, false),
  me: () => request('GET', '/auth/me/'),
  updateMe: (data) => request('PATCH', '/auth/me/', data),

  // Routes
  getRoutes: (city) => request('GET', `/routes/${city ? `?city=${city}` : ''}`),
  getRoute: (id) => request('GET', `/routes/${id}/`),
  createRoute: (data) => request('POST', '/routes/', data),
  updateRoute: (id, data) => request('PATCH', `/routes/${id}/`, data),
  deleteRoute: (id) => request('DELETE', `/routes/${id}/`),
  joinRoute: (id) => request('POST', `/routes/${id}/join/`),

  // Participants
  getParticipants: (routeId) => request('GET', `/routes/${routeId}/participants/`),
  updateParticipant: (routeId, partId, status) =>
    request('PATCH', `/routes/${routeId}/participants/${partId}/`, { status }),

  // Messages
  getMessages: (routeId) => request('GET', `/routes/${routeId}/messages/`),
  sendMessage: (routeId, text) => request('POST', `/routes/${routeId}/messages/`, { text }),

  // Notifications
  getNotifications: () => request('GET', '/notifications/'),
  markRead: (id) => request('PATCH', `/notifications/${id}/read/`),
  markAllRead: () => request('POST', '/notifications/read-all/'),

  // Payment
  getPaymentLink: () => request('GET', '/payments/link/'),
  getHealth: () => request('GET', '/health/', null, false),
  // Promo codes
  getPromoCodes: () => request('GET', '/admin/promo-codes/'),
  createPromoCode: (data) => request('POST', '/admin/promo-codes/', data),
  updatePromoCode: (id, data) => request('PATCH', `/admin/promo-codes/${id}/`, data),
  deletePromoCode: (id) => request('DELETE', `/admin/promo-codes/${id}/`),
  validatePromo: (code) => request('POST', '/promo/validate/', { code }, false),

  // Email
  confirmEmail: (token) => request('GET', `/auth/confirm/${token}/`, null, false),
  resendConfirmation: (email) => request('POST', '/auth/resend-confirmation/', { email }, false),
  forgotPassword: (email) => request('POST', '/auth/forgot-password/', { email }, false),
  resetPassword: (token, password) => request('POST', '/auth/reset-password/', { token, password }, false),

  // Users
  getUsers: (city, country) => {
    const params = []
    if (city) params.push(`city=${city}`)
    if (country) params.push(`country=${country}`)
    return request('GET', `/users/${params.length ? `?${params.join('&')}` : ''}`)
  },

  // Follow
  followUser: (userId) => request('POST', `/follow/${userId}/`),
  unfollowUser: (userId) => request('DELETE', `/unfollow/${userId}/`),

  // Route invitation
  inviteToRoute: (routeId, userId) => request('POST', `/routes/${routeId}/invite/`, { user_id: userId }),

  // Delete notification
  deleteNotification: (id) => request('DELETE', `/notifications/${id}/`),

  // Admin
  getAdminUsers: () => request('GET', '/admin/users/'),
  updateUser: (id, data) => request('PATCH', `/admin/users/${id}/`, data),
  deleteUser: (id) => request('DELETE', `/admin/users/${id}/`),
}

export function setToken(token) {
  localStorage.setItem('rutillas_token', token)
}

export function clearToken() {
  localStorage.removeItem('rutillas_token')
}
