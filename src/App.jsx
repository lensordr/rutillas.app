import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, Component } from 'react'
import useStore from './store/useStore'
import BottomNav from './components/BottomNav'
import { ToastProvider } from './components/Toast'

import AuthPage from './pages/AuthPage'
import LandingPage from './pages/LandingPage'
import HomePage from './pages/HomePage'
import EventsPage from './pages/EventsPage'
import EventDetailPage, { ChatPage } from './pages/EventDetailPage'
import { ForgotPasswordPage, ResetPasswordPage, ConfirmEmailPage } from './pages/ForgotPasswordPage'
import NotificationsPage from './pages/NotificationsPage'
import ProfilePage from './pages/ProfilePage'
import AdminPage from './pages/AdminPage'
import UserListPage from './pages/UserListPage'

// Error boundary to catch React crashes
class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(e) { return { error: e.message } }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, textAlign: 'center', fontFamily: 'sans-serif' }}>
          <h2 style={{ color: '#e8320a', marginBottom: 12 }}>Error</h2>
          <p style={{ color: '#555', fontSize: 14, marginBottom: 20 }}>{this.state.error}</p>
          <button
            onClick={() => {
              localStorage.clear()
              sessionStorage.clear()
              // Force fetch new bundle — clears HTTP cache too
              window.location.href = '/?nocache=' + Date.now()
            }}
            style={{ marginTop: 4, padding: '10px 20px', background: '#e8320a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>
            Limpiar caché y recargar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

function ProtectedRoute({ children }) {
  const currentUser = useStore((s) => s.currentUser)
  if (!currentUser) return <Navigate to="/auth" replace />
  return children
}

function AdminRoute({ children }) {
  const currentUser = useStore((s) => s.currentUser)
  if (!currentUser) return <Navigate to="/auth" replace />
  if (!currentUser.is_staff) return <Navigate to="/events" replace />
  return children
}

function AppLayout({ children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      {children}
      <BottomNav />
    </div>
  )
}

// Global notification poller — runs as long as user is logged in
function NotificationPoller() {
  const currentUserId = useStore((s) => s.currentUser?.id)

  useEffect(() => {
    if (!currentUserId) return
    // Fetch immediately on mount/login
    useStore.getState().fetchNotifications()
    useStore.getState().refreshUser()
    // Poll every 8 seconds
    const interval = setInterval(() => {
      useStore.getState().fetchNotifications()
    }, 8000)
    return () => clearInterval(interval)
  }, [currentUserId]) // only re-run when user changes

  return null
}

export default function App() {
  const currentUser = useStore((s) => s.currentUser)

  // Detect language from browser on first load (before login/registration)
  useEffect(() => {
    const store = useStore.getState()
    // Only auto-detect if user is not logged in (logged-in users get locale from profile)
    if (!store.currentUser) {
      const browserLang = navigator.language || navigator.userLanguage || 'es'
      const isSpanish = browserLang.startsWith('es')
      store.setLocale(isSpanish ? 'es' : 'en')
    }
  }, [])

  return (
    <ErrorBoundary>
    <BrowserRouter basename="/" future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ToastProvider />
      <NotificationPoller />
      <Routes>
        {/* Public landing */}
        <Route path="/" element={currentUser ? <Navigate to="/events" replace /> : <LandingPage />} />

        {/* Auth */}
        <Route path="/auth" element={currentUser ? <Navigate to="/events" replace /> : <AuthPage />} />
        <Route path="/auth/forgot" element={<ForgotPasswordPage />} />
        <Route path="/auth/reset/:token" element={<ResetPasswordPage />} />
        <Route path="/auth/confirm/:token" element={<ConfirmEmailPage />} />

        {/* Protected routes */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <AppLayout>
                <HomePage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/events"
          element={
            <ProtectedRoute>
              <AppLayout>
                <EventsPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/events/:id"
          element={
            <ProtectedRoute>
              <AppLayout>
                <EventDetailPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/events/:id/chat"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <AppLayout>
                <UserListPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <AppLayout>
                <NotificationsPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <AppLayout>
                <ProfilePage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AppLayout>
                <AdminPage />
              </AppLayout>
            </AdminRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to={currentUser ? '/events' : '/'} replace />} />
      </Routes>
    </BrowserRouter>
    </ErrorBoundary>
  )
}
