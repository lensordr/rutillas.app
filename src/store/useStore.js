import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api, setToken, clearToken } from '../api'
import { checkRateLimit, RATE_LIMITS } from '../security/rateLimiter'

const useStore = create(
  persist(
    (set, get) => ({
      // ── Auth ──────────────────────────────────────────────────────────────
      currentUser: null,
      token: null,

      login: async (email, password, captchaToken) => {
        try {
          const data = await api.login({ username: email, email, password, captcha_token: captchaToken })
          setToken(data.access)
          set({ currentUser: data.user, token: data.access })
          return { user: data.user }
        } catch (e) {
          return { error: e.data?.error || 'Email o contraseña incorrectos' }
        }
      },

      logout: () => {
        clearToken()
        set({ currentUser: null, token: null })
      },

      register: async (data) => {
        try {
          const response = await api.register({
            username: data.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') + Date.now().toString().slice(-4),
            email: data.email,
            password: data.password,
            first_name: data.name.split(' ')[0] || data.name,
            last_name: data.name.split(' ').slice(1).join(' ') || '',
            moto_type: data.motoType || '',
            moto_model: data.motoModel || '',
            experience: data.experience || '',
            location: data.location || '',
            latitude: data.latitude || null,
            longitude: data.longitude || null,
            insta_handle: data.instaHandle || '',
            needs_food: data.needsFood || false,
            heard_from: data.heardFrom || '',
            promo_code: data.promoCode || '',
            captcha_token: data.captchaToken || '',
          })
          return { ok: true, payment_url: response?.payment_url || null }
        } catch (e) {
          const errs = e.data || {}
          const msg = errs.email?.[0] || errs.username?.[0] || errs.error || 'Error al registrarse'
          return { error: msg }
        }
      },

      refreshUser: async () => {
        try {
          const user = await api.me()
          set({ currentUser: user })
        } catch (e) {
          clearToken()
          set({ currentUser: null, token: null })
        }
      },

      updateCurrentUser: async (data) => {
        try {
          const user = await api.updateMe(data)
          set({ currentUser: user })
          return { ok: true }
        } catch (e) {
          return { error: e.data?.error || 'Error al actualizar' }
        }
      },

      // ── Routes ────────────────────────────────────────────────────────────
      routes: [],
      routesLoading: false,

      fetchRoutes: async (city) => {
        set({ routesLoading: true })
        try {
          const routes = await api.getRoutes(city)
          set({ routes, routesLoading: false })
        } catch (e) {
          set({ routesLoading: false })
        }
      },

      createRoute: async (data) => {
        // Rate limit route creation
        const rateCheck = checkRateLimit('createRoute', RATE_LIMITS.createRoute)
        if (!rateCheck.allowed) {
          return { error: 'Demasiadas rutas creadas. Espera unos minutos.' }
        }
        try {
          const route = await api.createRoute(data)
          set((s) => ({ routes: [...s.routes, route] }))
          return { route }
        } catch (e) {
          return { error: e.data?.error || 'Error al crear la ruta' }
        }
      },

      updateRoute: async (id, data) => {
        try {
          const route = await api.updateRoute(id, data)
          set((s) => ({ routes: s.routes.map((r) => r.id === id ? route : r) }))
          return { route }
        } catch (e) {
          return { error: e.data?.error || 'Error al actualizar' }
        }
      },

      deleteRoute: async (id) => {
        try {
          await api.deleteRoute(id)
          set((s) => ({ routes: s.routes.filter((r) => r.id !== id) }))
          return { ok: true }
        } catch (e) {
          return { error: e.data?.error || 'Error al eliminar' }
        }
      },

      joinRoute: async (id) => {
        // Rate limit join requests
        const rateCheck = checkRateLimit('joinRoute', RATE_LIMITS.joinRoute)
        if (!rateCheck.allowed) {
          return { error: 'Demasiadas solicitudes. Espera un momento.' }
        }
        try {
          const res = await api.joinRoute(id)
          // Refresh route to get updated user_status
          const route = await api.getRoute(id)
          set((s) => ({ routes: s.routes.map((r) => r.id === id ? route : r) }))
          // Refresh notifications immediately
          const notifs = await api.getNotifications()
          set({ notifications: notifs })
          return { ok: true, status: res.status }
        } catch (e) {
          if (e.status === 402) {
            return { error: 'subscription_required', payment_url: e.data?.payment_url }
          }
          return { error: e.data?.error || 'Error al solicitar' }
        }
      },

      // ── Participants ──────────────────────────────────────────────────────
      participants: {},  // { routeId: [...] }

      fetchParticipants: async (routeId) => {
        try {
          const list = await api.getParticipants(routeId)
          set((s) => ({ participants: { ...s.participants, [routeId]: list } }))
        } catch (e) {}
      },

      updateParticipant: async (routeId, partId, status) => {
        try {
          await api.updateParticipant(routeId, partId, status)
          await get().fetchParticipants(routeId)
          return { ok: true }
        } catch (e) {
          return { error: e.data?.error || 'Error' }
        }
      },

      // ── Messages ──────────────────────────────────────────────────────────
      messages: {},  // { routeId: [...] }

      fetchMessages: async (routeId) => {
        try {
          const list = await api.getMessages(routeId)
          set((s) => ({ messages: { ...s.messages, [routeId]: list } }))
        } catch (e) {
          // Only set empty array if not already set — avoids creating new [] reference
          set((s) => {
            if (s.messages[routeId] !== undefined) return s
            return { messages: { ...s.messages, [routeId]: [] } }
          })
        }
      },

      sendMessage: async (routeId, text) => {
        // Rate limit messages
        const rateCheck = checkRateLimit('sendMessage', RATE_LIMITS.sendMessage)
        if (!rateCheck.allowed) {
          return { error: 'Demasiados mensajes. Espera un momento.' }
        }
        try {
          const msg = await api.sendMessage(routeId, text)
          set((s) => ({
            messages: {
              ...s.messages,
              [routeId]: [...(s.messages[routeId] ?? []), msg],
            },
          }))
          return { ok: true }
        } catch (e) {
          return { error: e.data?.error || 'Error al enviar' }
        }
      },

      // ── Notifications ─────────────────────────────────────────────────────
      notifications: [],

      fetchNotifications: async () => {
        try {
          const list = await api.getNotifications()
          set({ notifications: list })
        } catch (e) {}
      },

      markNotificationRead: async (id) => {
        try {
          await api.markRead(id)
          set((s) => ({
            notifications: s.notifications.map((n) => n.id === id ? { ...n, read: true } : n),
          }))
        } catch (e) {}
      },

      markAllNotificationsRead: async () => {
        try {
          await api.markAllRead()
          set((s) => ({
            notifications: s.notifications.map((n) => ({ ...n, read: true })),
          }))
        } catch (e) {}
      },

      getUnreadCount: () => {
        return get().notifications.filter((n) => !n.read).length
      },

      // ── Admin users ───────────────────────────────────────────────────────
      adminUsers: [],

      fetchAdminUsers: async () => {
        try {
          const users = await api.getUsers()
          set({ adminUsers: users })
        } catch (e) {}
      },
    }),
    {
      name: 'rutillas-storage',
      version: 1,
      partialize: (state) => ({
        currentUser: state.currentUser,
        token: state.token,
      }),
    }
  )
)

export default useStore
