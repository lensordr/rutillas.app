import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import useStore from '../store/useStore'
import { IconMapPin, IconClock, IconUsers, IconCalendar, IconPlus, IconBack } from '../components/Icons'
import { useToast } from '../components/Toast'
import { useT } from '../i18n/useT'

// ─── Create Route Modal ───────────────────────────────────────────────────────
function CreateRouteModal({ onClose }) {
  const currentUser = useStore((s) => s.currentUser)
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [form, setForm] = useState({
    title: '', description: '', city: '', location_detail: '',
    date: '', end_date: '', max_participants: 20, route_url: '',
  })
  const t = useT()

  const isSubscribed = currentUser?.is_subscribed || currentUser?.is_free_user || currentUser?.is_staff
  const set = (f, v) => { setForm(p => ({ ...p, [f]: v })); setErrors(p => ({ ...p, [f]: '' })) }

  const validate = () => {
    const e = {}
    if (!form.title.trim()) e.title = t('validation.required')
    if (!form.city.trim()) e.city = t('validation.required')
    if (!form.date) e.date = t('validation.required')
    if (!form.end_date) e.end_date = t('validation.required')
    if (form.date && form.end_date && new Date(form.end_date) <= new Date(form.date)) e.end_date = t('validation.endDateAfterStart')
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    const data = {
      ...form,
      date: new Date(form.date).toISOString(),
      end_date: new Date(form.end_date).toISOString(),
      max_participants: Number(form.max_participants),
    }
    const result = await useStore.getState().createRoute(data)
    setSaving(false)
    if (result?.error) { setErrors({ general: result.error }); return }
    await useStore.getState().fetchRoutes()
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <h2 className="modal-title">{t('routes.create.title')}</h2>
        {!isSubscribed ? (
          <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 900, textTransform: 'uppercase', marginBottom: 8 }}>{t('routes.create.subscriptionRequired')}</p>
            <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 20, lineHeight: 1.5 }}>
              {t('routes.create.subscriptionDesc')}
            </p>
            <div style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', borderRadius: 'var(--radius-lg)', padding: '10px 16px', marginBottom: 20 }}>
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 900, color: 'var(--accent)' }}>{t('routes.create.price')} <span style={{ fontSize: 14, fontWeight: 600 }}>{t('routes.create.priceUnit')}</span></p>
              <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>{t('routes.create.priceDesc')}</p>
            </div>
            <a href="https://square.link/u/4AiXGpLe" target="_blank" rel="noopener noreferrer"
              className="btn btn-primary btn-full btn-lg" style={{ textDecoration: 'none', marginBottom: 10 }}>
              {t('routes.create.subscribeBtn')}
            </a>
            <button className="btn btn-ghost btn-full" onClick={onClose}>{t('routes.create.cancel')}</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="stack">
          {errors.general && (
            <div style={{ background: 'var(--red-dim)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: 13, color: 'var(--red)' }}>
              {errors.general}
            </div>
          )}
          <div className="form-group">
            <label className="form-label">{t('routes.create.titleLabel')}</label>
            <input className="form-input" value={form.title} onChange={e => set('title', e.target.value)} placeholder={t('routes.create.titlePlaceholder')} />
            {errors.title && <span className="form-error">{errors.title}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">{t('routes.create.description')}</label>
            <textarea className="form-textarea" value={form.description} onChange={e => set('description', e.target.value)} placeholder={t('routes.create.descriptionPlaceholder')} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="form-group">
              <label className="form-label">{t('routes.create.city')}</label>
              <input className="form-input" value={form.city} onChange={e => set('city', e.target.value)} placeholder={t('routes.create.cityPlaceholder')} />
              {errors.city && <span className="form-error">{errors.city}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">{t('routes.create.locationDetail')}</label>
              <input className="form-input" value={form.location_detail} onChange={e => set('location_detail', e.target.value)} placeholder={t('routes.create.locationDetailPlaceholder')} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="form-group">
              <label className="form-label">{t('routes.create.startDate')}</label>
              <input className="form-input" type="datetime-local" value={form.date} onChange={e => set('date', e.target.value)} />
              {errors.date && <span className="form-error">{errors.date}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">{t('routes.create.endDate')}</label>
              <input className="form-input" type="datetime-local" value={form.end_date} onChange={e => set('end_date', e.target.value)} />
              {errors.end_date && <span className="form-error">{errors.end_date}</span>}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="form-group">
              <label className="form-label">{t('routes.create.maxRiders')}</label>
              <input className="form-input" type="number" min="2" max="200" value={form.max_participants} onChange={e => set('max_participants', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('routes.create.googleMaps')}</label>
              <input className="form-input" type="url" value={form.route_url} onChange={e => set('route_url', e.target.value)} placeholder={t('routes.create.googleMapsPlaceholder')} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>{t('routes.create.cancel')}</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={saving}>
              {saving ? <span className="spinner" /> : t('routes.create.submit')}
            </button>
          </div>
          </form>
        )}
      </div>
    </div>
  )
}

function EventRow({ event, onClick }) {
  const currentUser = useStore((s) => s.currentUser)
  const isSubscribed = currentUser?.is_subscribed || currentUser?.is_free_user || currentUser?.is_staff
  const t = useT()

  return (
    <div className="event-card" onClick={onClick} role="button" tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}>
      <div className="event-card-cover-placeholder" style={{ height: 140 }}>
        <div style={{ position: 'absolute', inset: 0, zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 20px' }}>
          <span style={{
            fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontStyle: 'italic',
            fontSize: 'clamp(22px, 6vw, 32px)', textTransform: 'uppercase', letterSpacing: '0.02em',
            color: 'var(--accent)', textAlign: 'center', lineHeight: 1.05, opacity: 0.85,
          }}>
            {event.title}
          </span>
        </div>
        {event.status === 'active' && (
          <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 2, display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.95)', borderRadius: 100, padding: '4px 10px', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
            <span className="live-dot" />
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', color: '#16a34a' }}>{t('routes.status.live')}</span>
          </div>
        )}
        <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 2 }}>
          <span className={`badge badge-${event.status}`}>
            {event.status === 'active' ? t('routes.status.active') : event.status === 'upcoming' ? t('routes.status.upcoming') : event.status === 'full' ? t('routes.status.full') : t('routes.status.ended')}
          </span>
        </div>
        {/* Lock for non-subscribers */}
        {!isSubscribed && (
          <div style={{ position: 'absolute', bottom: 10, right: 10, zIndex: 2, background: 'rgba(0,0,0,0.6)', borderRadius: 100, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 12 }}>🔒</span>
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: '0.06em' }}>SUSCRIPCIÓN</span>
          </div>
        )}
      </div>
      <div className="event-card-body">
        <h3 className="event-card-title" style={{ fontSize: 20 }}>{event.title}</h3>
        {isSubscribed ? (
          <div className="event-card-info">
            <div className="event-card-info-row">
              <IconClock size={13} />
              {format(new Date(event.date), "d MMM yyyy · HH:mm", { locale: es })}
            </div>
            <div className="event-card-info-row">
              <IconMapPin size={13} />
              {event.city}
            </div>
          </div>
        ) : (
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>
            {t('routes.subscribe')}
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
          {isSubscribed ? (
            <div className="event-card-riders">
              <IconUsers size={12} />
              {t('routes.riders', { count: event.approved_count, max: event.max_participants })}
            </div>
          ) : (
            <div className="event-card-riders">
              <IconUsers size={12} />
              {t('routes.ridersMax', { max: event.max_participants })}
            </div>
          )}
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: isSubscribed ? 'var(--accent)' : 'var(--text-3)' }}>
            {isSubscribed ? t('routes.view') : t('routes.viewLocked')}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function EventsPage() {
  const navigate = useNavigate()
  const currentUser = useStore((s) => s.currentUser)
  const routes = useStore((s) => s.routes)
  const routesLoading = useStore((s) => s.routesLoading)
  const [filter, setFilter] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [citySearch, setCitySearch] = useState('')
  const [showCityFilter, setShowCityFilter] = useState(false)
  const t = useT()

  useEffect(() => {
    useStore.getState().fetchRoutes(citySearch || null)
  }, [citySearch]) // fetchRoutes is stable via getState(), only re-run when city changes

  // Get unique cities from loaded routes
  const availableCities = [...new Set(routes.map(r => r.city).filter(Boolean))].sort()

  const filtered = routes.filter((e) => {
    if (filter === 'mine') return e.creator?.id === currentUser?.id
    if (filter === 'joined') return e.user_status === 'approved' || e.user_status === 'pending'
    if (filter === 'all') return true
    if (filter === 'upcoming') return e.status === 'upcoming' || e.status === 'full'
    return e.status === filter
  })

  const filters = [
    { key: 'all', label: t('routes.filterAll') },
    { key: 'active', label: t('routes.filterActive') },
    { key: 'upcoming', label: t('routes.filterUpcoming') },
    { key: 'ended', label: t('routes.filterEnded') },
    { key: 'mine', label: t('routes.filterMine') },
    { key: 'joined', label: t('routes.filterJoined') },
  ]

  return (
    <div style={{ flex: 1, paddingBottom: 'calc(var(--nav-height) + var(--safe-bottom))' }}>
      <div style={{ padding: '12px 16px 0', position: 'sticky', top: 0, background: 'rgba(245,245,245,0.95)', backdropFilter: 'blur(20px)', zIndex: 10, borderBottom: '1px solid var(--border)' }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconCalendar size={20} />
            <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 24, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {t('routes.title')}
            </h1>
            {citySearch && (
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-dim)', borderRadius: 100, padding: '2px 10px' }}>
                📍 {citySearch} <span style={{ cursor: 'pointer' }} onClick={() => setCitySearch('')}>×</span>
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowCityFilter(true)}>
              🗺️ {t('routes.city')}
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
              <IconPlus size={15} /> {t('routes.new')}
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 10, scrollbarWidth: 'none' }}>
          {filters.map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              padding: '6px 12px', borderRadius: 100, border: '1px solid', flexShrink: 0,
              borderColor: filter === f.key ? 'var(--accent)' : 'var(--border)',
              background: filter === f.key ? 'var(--accent-dim)' : 'transparent',
              color: filter === f.key ? 'var(--accent)' : 'var(--text-2)',
              fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, fontWeight: 700,
              letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap',
            }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px', maxWidth: 480, margin: '0 auto' }}>
        {routesLoading && filtered.length === 0 && <div className="empty-state"><span className="spinner" /></div>}
        {!routesLoading && filtered.length === 0 && (
          <div className="empty-state">
            <IconCalendar size={48} />
            <p className="empty-state-title">
              {filter === 'mine' ? t('routes.emptyMine') : filter === 'joined' ? t('routes.emptyJoined') : t('routes.empty')}
            </p>
            {filter === 'mine' && (
              <button className="btn btn-primary btn-sm mt-8" onClick={() => setShowCreate(true)}>
                <IconPlus size={14} /> {t('routes.createFirst')}
              </button>
            )}
          </div>
        )}
        {filtered.length > 0 && (
          <div className="stack">
            {filtered.map((e) => (
              <EventRow key={e.id} event={e} onClick={() => navigate(`/events/${e.id}`)} />
            ))}
          </div>
        )}
      </div>

      {showCreate && <CreateRouteModal onClose={() => setShowCreate(false)} />}

      {/* City filter modal */}
      {showCityFilter && (
        <div className="modal-overlay" onClick={() => setShowCityFilter(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <h2 className="modal-title">{t('routes.cityFilter.title')}</h2>

            {/* Search input */}
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <input
                className="form-input"
                type="text"
                placeholder={t('routes.cityFilter.search')}
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                style={{ borderRadius: 100 }}
                autoFocus
              />
              {citySearch && (
                <button onClick={() => setCitySearch('')} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 18 }}>×</button>
              )}
            </div>

            {/* Popular cities */}
            <p className="section-title" style={{ marginBottom: 8 }}>{t('routes.cityFilter.popular')}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {['Barcelona', 'Madrid', 'Valencia', 'Sevilla', 'Málaga', 'Bilbao', 'Zaragoza', 'Girona', 'Tarragona', 'Lleida', 'Murcia', 'Alicante'].map((city) => (
                <button key={city} onClick={() => { setCitySearch(city); setShowCityFilter(false) }} style={{
                  padding: '7px 14px', borderRadius: 100, border: '1px solid',
                  borderColor: citySearch === city ? 'var(--accent)' : 'var(--border)',
                  background: citySearch === city ? 'var(--accent-dim)' : 'var(--bg-3)',
                  color: citySearch === city ? 'var(--accent)' : 'var(--text)',
                  fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 700,
                  cursor: 'pointer',
                }}>
                  {city}
                </button>
              ))}
            </div>

            {/* Cities from actual routes */}
            {availableCities.length > 0 && (
              <>
                <p className="section-title" style={{ marginBottom: 8 }}>{t('routes.cityFilter.active')}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                  {availableCities.map((city) => (
                    <button key={city} onClick={() => { setCitySearch(city); setShowCityFilter(false) }} style={{
                      padding: '7px 14px', borderRadius: 100, border: '1px solid var(--accent-border)',
                      background: 'var(--accent-dim)', color: 'var(--accent)',
                      fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    }}>
                      🏍️ {city}
                    </button>
                  ))}
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              {citySearch && (
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => { setCitySearch(''); setShowCityFilter(false) }}>
                  {t('routes.cityFilter.remove')}
                </button>
              )}
              <button className="btn btn-primary" style={{ flex: 2 }} onClick={() => setShowCityFilter(false)}>
                {t('routes.cityFilter.apply')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
