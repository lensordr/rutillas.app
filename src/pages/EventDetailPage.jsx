import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import useStore from '../store/useStore'
import { api } from '../api'
import {
  IconBack, IconMapPin, IconClock, IconUsers, IconLink,
  IconChat, IconSend, IconEdit, IconTrash
} from '../components/Icons'
import { useToast } from '../components/Toast'
import InviteUsersModal from '../components/InviteUsersModal'

const STATUS_LABELS = { upcoming: 'Próximo', active: 'En curso', full: 'Completo', ended: 'Finalizado' }

// ─── Add to Calendar ──────────────────────────────────────────────────────────
function addToCalendar(route) {
  const fmt = (d) => new Date(d).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const location = [route.city, route.location_detail].filter(Boolean).join(' — ')
  const description = route.description || `Ruta organizada en RUTILLAS\\nMás info: https://rutillas.com`

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//RUTILLAS//ES',
    'BEGIN:VEVENT',
    `UID:rutillas-route-${route.id}@rutillas.com`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(route.date)}`,
    `DTEND:${fmt(route.end_date)}`,
    `SUMMARY:🏍️ ${route.title}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `rutillas-${route.title.replace(/\s+/g, '-').toLowerCase()}.ics`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Photos Tab ───────────────────────────────────────────────────────────────
function PhotosTab({ route }) {
  return (
    <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 12 }}>
      <div style={{ fontSize: 48 }}>📸</div>
      <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        Próximamente
      </p>
      <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6, maxWidth: 280 }}>
        Pronto podrás compartir fotos de tus rutas directamente en la app.
      </p>
      <div style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', borderRadius: 'var(--radius-lg)', padding: '10px 20px', marginTop: 8 }}>
        <p style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 700 }}>🚀 Coming soon</p>
      </div>
    </div>
  )
}

// ─── Edit Route Modal ─────────────────────────────────────────────────────────
function EditRouteModal({ route, onClose, onDelete }) {
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const toLocal = (iso) => {
    if (!iso) return ''
    const d = new Date(iso)
    const p = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
  }
  const [form, setForm] = useState({
    title: route.title || '', description: route.description || '',
    city: route.city || '', location_detail: route.location_detail || '',
    date: toLocal(route.date), end_date: toLocal(route.end_date),
    max_participants: route.max_participants || 20, route_url: route.route_url || '',
  })
  const set = (f, v) => setForm(p => ({ ...p, [f]: v }))
  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    const data = { ...form, date: new Date(form.date).toISOString(), end_date: new Date(form.end_date).toISOString(), max_participants: Number(form.max_participants) }
    const result = await useStore.getState().updateRoute(route.id, data)
    setSaving(false)
    if (result?.error) { toast(result.error, 'error'); return }
    toast('Ruta actualizada ✓', 'success')
    onClose()
  }
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <h2 className="modal-title">Editar ruta</h2>
        {confirmDel ? (
          <div className="stack">
            <p style={{ fontSize: 15, color: 'var(--text-2)' }}>¿Eliminar <strong>"{route.title}"</strong>?</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setConfirmDel(false)}>Cancelar</button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={onDelete}><IconTrash size={16} /> Eliminar</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="stack">
            <div className="form-group"><label className="form-label">Título</label><input className="form-input" value={form.title} onChange={e => set('title', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Descripción</label><textarea className="form-textarea" value={form.description} onChange={e => set('description', e.target.value)} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="form-group"><label className="form-label">Ciudad</label><input className="form-input" value={form.city} onChange={e => set('city', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Detalle</label><input className="form-input" value={form.location_detail} onChange={e => set('location_detail', e.target.value)} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="form-group"><label className="form-label">Inicio</label><input className="form-input" type="datetime-local" value={form.date} onChange={e => set('date', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Fin</label><input className="form-input" type="datetime-local" value={form.end_date} onChange={e => set('end_date', e.target.value)} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="form-group"><label className="form-label">Máx. riders</label><input className="form-input" type="number" min="2" max="200" value={form.max_participants} onChange={e => set('max_participants', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Google Maps</label><input className="form-input" type="url" value={form.route_url} onChange={e => set('route_url', e.target.value)} /></div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn btn-danger btn-sm" onClick={() => setConfirmDel(true)}><IconTrash size={14} /></button>
              <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={saving}>{saving ? <span className="spinner" /> : 'Guardar'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

// ─── Chat Page ────────────────────────────────────────────────────────────────
export function ChatPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const routeId = Number(id)

  // Only subscribe to data, never to actions
  const currentUser = useStore((s) => s.currentUser)
  const messages = useStore((s) => s.messages[routeId])  // undefined until loaded — no || []
  const routeTitle = useStore((s) => s.routes.find((r) => r.id === routeId)?.title ?? null)
  const routeStatus = useStore((s) => s.routes.find((r) => r.id === routeId)?.status ?? null)
  const routeEndDate = useStore((s) => s.routes.find((r) => r.id === routeId)?.end_date ?? null)
  const userStatus = useStore((s) => s.routes.find((r) => r.id === routeId)?.user_status ?? null)
  const isCreator = useStore((s) => {
    const r = s.routes.find((r) => r.id === routeId)
    return !!(r && r.creator?.id === s.currentUser?.id)
  })

  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [accessDenied, setAccessDenied] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const bottomRef = useRef(null)
  const pollerRef = useRef(null)
  const toast = useToast()

  const isAdmin = currentUser?.is_staff
  const isApproved = userStatus === 'approved'
  const isRouteActive = routeStatus === 'active' || routeStatus === 'upcoming'

  // Check chat deadline
  const chatOpen = routeEndDate
    ? new Date() < new Date(new Date(routeEndDate).getTime() + 24 * 60 * 60 * 1000)
    : true

  // On mount: load routes if needed, then load messages, then start polling
  useEffect(() => {
    let cancelled = false

    async function init() {
      // Make sure routes are loaded so we can check access
      const state = useStore.getState()
      if (!state.routes.length) {
        await state.fetchRoutes()
      }

      if (cancelled) return

      // Check access using fresh state
      const freshState = useStore.getState()
      const route = freshState.routes.find((r) => r.id === routeId)
      if (route) {
        const admin = freshState.currentUser?.is_staff
        const creator = route.creator?.id === freshState.currentUser?.id
        const approved = route.user_status === 'approved'
        if (!admin && !creator && !approved) {
          setAccessDenied(true)
          return
        }
      }

      // Load messages
      await useStore.getState().fetchMessages(routeId)
      if (cancelled) return
      setLoaded(true)

      // Start polling every 5 seconds
      pollerRef.current = setInterval(() => {
        useStore.getState().fetchMessages(routeId)
      }, 5000)
    }

    init()

    return () => {
      cancelled = true
      if (pollerRef.current) clearInterval(pollerRef.current)
    }
  }, [routeId]) // only depends on routeId — a primitive, never changes reference

  // Scroll to bottom when messages arrive
  const prevLengthRef = useRef(0)
  const msgCount = messages?.length ?? 0
  useEffect(() => {
    if (!bottomRef.current || msgCount === 0) return
    const isFirst = prevLengthRef.current === 0
    prevLengthRef.current = msgCount
    bottomRef.current.scrollIntoView({ behavior: isFirst ? 'instant' : 'smooth' })
  }, [msgCount])

  const handleSend = async () => {
    const trimmed = text.trim()
    if (!trimmed || sending) return
    setSending(true)
    const result = await useStore.getState().sendMessage(routeId, trimmed)
    setSending(false)
    if (result?.error) {
      toast(result.error, 'error')
    } else {
      setText('')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const getName = (msg) => msg.user?.first_name || msg.user?.username || '?'

  if (accessDenied) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center', background: 'var(--bg)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 900, textTransform: 'uppercase', marginBottom: 8 }}>Acceso restringido</p>
        <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 24 }}>Necesitas ser aceptado en la ruta para acceder al chat.</p>
        <button className="btn btn-primary" onClick={() => navigate(`/events/${id}`)}>Ver la ruta</button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--bg)' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'rgba(245,245,245,0.95)', backdropFilter: 'blur(20px)', flexShrink: 0, zIndex: 10 }}>
        <button className="btn btn-ghost btn-icon" onClick={() => navigate(-1)} style={{ minWidth: 44, minHeight: 44 }}>
          <IconBack />
        </button>
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 900, textTransform: 'uppercase' }}>
            {routeTitle || 'Chat'}
          </p>
          <p style={{ fontSize: 11, color: 'var(--text-3)' }}>Chat de la ruta</p>
        </div>
        {isRouteActive && <span className="live-dot" />}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12, WebkitOverflowScrolling: 'touch' }}>
        {!loaded && (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
            <span className="spinner" />
          </div>
        )}
        {loaded && (messages?.length ?? 0) === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 8, color: 'var(--text-3)', paddingTop: 60 }}>
            <IconChat size={40} />
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 700, textTransform: 'uppercase' }}>Sin mensajes aún</p>
            <p style={{ fontSize: 13 }}>Sé el primero en escribir</p>
          </div>
        )}
        {(messages ?? []).map((msg) => {
          const isOwn = msg.user?.id === currentUser?.id
          return (
            <div key={msg.id} className={`chat-bubble${isOwn ? ' own' : ''}`}>
              {!isOwn && (
                <div className="avatar avatar-sm">{getName(msg)[0]?.toUpperCase()}</div>
              )}
              <div>
                {!isOwn && <div className="chat-bubble-name">{getName(msg)}</div>}
                <div className="chat-bubble-content">
                  <p className="chat-bubble-text">{msg.text}</p>
                  <p className="chat-bubble-time">{format(new Date(msg.created_at), 'HH:mm')}</p>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      {!chatOpen ? (
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', background: 'var(--bg-2)', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>El chat de esta ruta está cerrado</p>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8, padding: '10px 16px', paddingBottom: 'calc(10px + var(--safe-bottom))', borderTop: '1px solid var(--border)', background: 'var(--bg-2)', flexShrink: 0, alignItems: 'flex-end' }}>
          <textarea
            className="chat-input"
            placeholder="Escribe un mensaje..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            style={{ flex: 1 }}
          />
          <button
            className="btn btn-primary btn-icon"
            onClick={handleSend}
            disabled={!text.trim() || sending}
          >
            {sending
              ? <span className="spinner" style={{ width: 16, height: 16 }} />
              : <IconSend size={18} />
            }
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main Event Detail Page ───────────────────────────────────────────────────
export default function EventDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const currentUser = useStore((s) => s.currentUser)
  const routes = useStore((s) => s.routes)
  const [tab, setTab] = useState('info')
  const [joining, setJoining] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [freshRoute, setFreshRoute] = useState(null)
  const toast = useToast()

  useEffect(() => {
    const load = async () => {
      try {
        const r = await api.getRoute(parseInt(id))
        setFreshRoute(r)
      } catch (e) {}
    }
    load()
    if (!useStore.getState().routes.length) useStore.getState().fetchRoutes()
  }, [id]) // eslint-disable-line

  const route = freshRoute || routes.find((r) => r.id === parseInt(id) || r.id === id)

  if (!route) {
    return <div style={{ padding: 24, textAlign: 'center' }}><span className="spinner" style={{ margin: '40px auto', display: 'block' }} /></div>
  }

  const userStatus = route.user_status
  const isAdmin = currentUser?.is_staff
  const isSubscribed = currentUser?.is_subscribed || currentUser?.is_free_user || isAdmin
  const isCreator = route.creator?.id === currentUser?.id
  const isApproved = userStatus === 'approved' || isAdmin || isCreator

  if (!isSubscribed && !isCreator) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', paddingBottom: 'calc(var(--nav-height) + var(--safe-bottom))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'rgba(245,245,245,0.95)' }}>
          <button className="btn btn-ghost btn-icon" onClick={() => navigate(-1)}><IconBack /></button>
          <h1 style={{ flex: 1, fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 900, textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{route.title}</h1>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 900, textTransform: 'uppercase', marginBottom: 8 }}>Contenido exclusivo</h2>
          <p style={{ fontSize: 15, color: 'var(--text-2)', marginBottom: 8, lineHeight: 1.6 }}>Suscríbete para ver la ubicación, detalles y unirte al chat.</p>
          <div style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', borderRadius: 'var(--radius-lg)', padding: '12px 20px', marginBottom: 24 }}>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 900, color: 'var(--accent)' }}>3,99€ <span style={{ fontSize: 16, fontWeight: 600 }}>/mes</span></p>
            <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>Acceso completo · Cancela cuando quieras</p>
          </div>
          <a href="https://square.link/u/4AiXGpLe" target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-lg" style={{ textDecoration: 'none', marginBottom: 12, width: '100%', maxWidth: 280 }}>
            🏍️ Suscribirse — 3,99€/mes
          </a>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>Volver</button>
        </div>
      </div>
    )
  }

  const chatDeadline = route.end_date ? new Date(new Date(route.end_date).getTime() + 24 * 60 * 60 * 1000) : null
  const chatOpen = chatDeadline ? new Date() < chatDeadline : true
  const canChat = (isApproved || isCreator) && chatOpen
  const canPhotos = isApproved || isCreator

  const handleJoin = async () => {
    setJoining(true)
    const result = await useStore.getState().joinRoute(route.id)
    setJoining(false)
    if (result?.error === 'subscription_required') {
      toast('Necesitas suscripción para unirte', 'error')
      setTimeout(() => window.open(result.payment_url, '_blank'), 800)
    } else if (result?.error) {
      toast(result.error, 'error')
    } else if (result?.status === 'approved') {
      toast('¡Unido! Ya tienes acceso al chat 🏍️', 'success')
      try { const fresh = await api.getRoute(parseInt(route.id)); setFreshRoute(fresh) } catch (e) {}
    } else {
      toast('Solicitud enviada ✓', 'success')
    }
  }

  const tabs = [
    { key: 'info', label: 'Info' },
    ...(canPhotos ? [{ key: 'photos', label: 'Fotos' }] : []),
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', paddingBottom: 'calc(var(--nav-height) + var(--safe-bottom))' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'rgba(245,245,245,0.95)', backdropFilter: 'blur(20px)', flexShrink: 0 }}>
        <button className="btn btn-ghost btn-icon" onClick={() => navigate(-1)}><IconBack /></button>
        <h1 style={{ flex: 1, fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 900, textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{route.title}</h1>
        {(isCreator || isAdmin) && <button className="btn btn-ghost btn-icon" onClick={() => setShowEdit(true)}><IconEdit size={18} /></button>}
        <span className={`badge badge-${route.status}`}>{route.status === 'active' ? <><span className="live-dot" style={{ width: 6, height: 6 }} /> En curso</> : STATUS_LABELS[route.status]}</span>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg)', padding: '0 16px', flexShrink: 0 }}>
        {tabs.map((t) => (
          <button key={t.key} onClick={() => {
            if (t.key === 'chat') { navigate(`/events/${id}/chat`); return }
            setTab(t.key)
          }} style={{
            padding: '12px 16px', border: 'none', background: 'transparent',
            color: tab === t.key ? 'var(--accent)' : 'var(--text-3)',
            fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 700,
            letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer',
            borderBottom: tab === t.key ? '2px solid var(--accent)' : '2px solid transparent',
            marginBottom: -1,
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content — only info and photos here, chat is its own route */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {tab === 'info' && (
          <div style={{ padding: '16px' }}>
            <div className="event-card-cover-placeholder" style={{ borderRadius: 'var(--radius-lg)', marginBottom: 16 }}>
              <div style={{ position: 'absolute', inset: 0, zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 24px' }}>
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontStyle: 'italic', fontSize: 'clamp(28px, 8vw, 42px)', textTransform: 'uppercase', color: 'var(--accent)', textAlign: 'center', lineHeight: 1.05, opacity: 0.85 }}>{route.title}</span>
              </div>
            </div>
            <div className="stack">
              <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px 16px' }}>
                <div className="stack" style={{ gap: 10 }}>
                  <div className="event-card-info-row" style={{ fontSize: 14 }}><IconClock size={16} /><span>{format(new Date(route.date), "EEEE d 'de' MMMM yyyy · HH:mm", { locale: es })}</span></div>
                  <div className="event-card-info-row" style={{ fontSize: 14 }}><IconMapPin size={16} /><span>{route.city}{route.location_detail ? ` — ${route.location_detail}` : ''}</span></div>
                  <div className="event-card-info-row" style={{ fontSize: 14 }}><IconUsers size={16} /><span>{route.approved_count} / {route.max_participants} riders</span></div>
                  {route.route_url && <div className="event-card-info-row" style={{ fontSize: 14 }}><IconLink size={16} /><a href={route.route_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Ver ruta en Google Maps</a></div>}
                </div>
              </div>
              {route.description && <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px 16px' }}><p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6 }}>{route.description}</p></div>}
              {!isAdmin && (
                <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px 16px' }}>
                  {!userStatus && route.status !== 'ended' && <button className="btn btn-primary btn-full btn-lg" onClick={handleJoin} disabled={joining}>{joining ? <span className="spinner" /> : 'Unirse a la ruta'}</button>}
                  {userStatus === 'pending' && <div style={{ textAlign: 'center' }}><span className="badge badge-pending" style={{ fontSize: 13, padding: '6px 14px' }}>Solicitud pendiente</span></div>}
                  {userStatus === 'approved' && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                      <span className="badge badge-approved" style={{ fontSize: 13, padding: '6px 14px' }}>✓ Aceptado</span>
                      <button className="btn btn-ghost btn-sm" onClick={() => addToCalendar(route)}>
                        📅 Añadir al calendario
                      </button>
                    </div>
                  )}
                  {userStatus === 'rejected' && <div style={{ textAlign: 'center' }}><span className="badge badge-rejected" style={{ fontSize: 13, padding: '6px 14px' }}>Solicitud rechazada</span></div>}
                  {route.status === 'ended' && !userStatus && <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-3)' }}>Esta ruta ha finalizado</p>}
                </div>
              )}
              {canChat && (
                <button className="btn btn-secondary btn-full" onClick={() => navigate(`/events/${id}/chat`)}>
                  <IconChat size={18} /> Abrir chat de la ruta
                </button>
              )}
              {isCreator && route.status !== 'ended' && (
                <button className="btn btn-ghost btn-full" onClick={() => setShowInvite(true)}>
                  👥 Invitar usuarios
                </button>
              )}
              {(isCreator || isAdmin) && route.status !== 'ended' && (
                <button className="btn btn-ghost btn-full" onClick={() => addToCalendar(route)}>
                  📅 Añadir al calendario
                </button>
              )}
            </div>
          </div>
        )}
        {tab === 'photos' && canPhotos && <PhotosTab route={route} />}
      </div>

      {showEdit && <EditRouteModal route={route} onClose={() => setShowEdit(false)} onDelete={() => { navigate('/events'); useStore.getState().deleteRoute(route.id) }} />}
      {showInvite && <InviteUsersModal routeId={route.id} onClose={() => setShowInvite(false)} />}
    </div>
  )
}
