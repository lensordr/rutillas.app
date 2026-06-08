import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import useStore from '../store/useStore'
import { IconPlus, IconEdit, IconTrash, IconCheck, IconX, IconUsers, IconShield, IconCalendar, IconSettings, IconLogout } from '../components/Icons'
import { useToast } from '../components/Toast'
import { api } from '../api'
import { useT } from '../i18n/useT'

const toLocal = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

// ─── Event Form Modal ─────────────────────────────────────────────────────────
function EventFormModal({ event, onClose }) {
  const toast = useToast()
  const t = useT()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: event?.title || '',
    description: event?.description || '',
    date: toLocal(event?.date) || '',
    end_date: toLocal(event?.end_date) || '',
    city: event?.city || '',
    location_detail: event?.location_detail || '',
    route_url: event?.route_url || '',
    max_participants: event?.max_participants || 25,
  })
  const [errors, setErrors] = useState({})
  const set = (f, v) => { setForm(p => ({...p, [f]: v})); setErrors(p => ({...p, [f]: ''})) }

  const validate = () => {
    const e = {}
    if (!form.title.trim()) e.title = t('validation.required')
    if (!form.date) e.date = t('validation.required')
    if (!form.end_date) e.end_date = t('validation.required')
    if (!form.city.trim()) e.city = t('validation.required')
    if (form.date && form.end_date && new Date(form.end_date) <= new Date(form.date)) e.end_date = t('validation.endDateAfterStart')
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    const data = { ...form, date: new Date(form.date).toISOString(), end_date: new Date(form.end_date).toISOString(), max_participants: Number(form.max_participants) }
    const result = event ? await useStore.getState().updateRoute(event.id, data) : await useStore.getState().createRoute(data)
    setSaving(false)
    if (result?.error) { toast(result.error, 'error'); return }
    toast(event ? t('admin.routeUpdated') : t('admin.routeCreated'), 'success')
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <h2 className="modal-title">{event ? t('routes.edit.title') : t('admin.newRoute')}</h2>
        <form onSubmit={handleSubmit} className="stack">
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
          <div className="form-group">
            <label className="form-label">{t('routes.create.city')}</label>
            <input className="form-input" value={form.city} onChange={e => set('city', e.target.value)} placeholder={t('routes.create.cityPlaceholder')} />
            {errors.city && <span className="form-error">{errors.city}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">{t('routes.create.locationDetail')}</label>
            <input className="form-input" value={form.location_detail} onChange={e => set('location_detail', e.target.value)} placeholder={t('routes.create.locationDetailPlaceholder')} />
          </div>
          <div className="form-group">
            <label className="form-label">{t('routes.create.googleMaps')}</label>
            <input className="form-input" type="url" value={form.route_url} onChange={e => set('route_url', e.target.value)} placeholder={t('routes.create.googleMapsPlaceholder')} />
          </div>
          <div className="form-group">
            <label className="form-label">{t('routes.create.maxRiders')}</label>
            <input className="form-input" type="number" min="1" max="500" value={form.max_participants} onChange={e => set('max_participants', e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>{t('common.cancel')}</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={saving}>
              {saving ? <span className="spinner" /> : event ? t('routes.edit.save') : t('routes.create.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Participants Modal ───────────────────────────────────────────────────────
function ParticipantsModal({ route, onClose }) {
  const participants = useStore((s) => s.participants[route.id] || [])
  const toast = useToast()
  const t = useT()

  useEffect(() => { useStore.getState().fetchParticipants(route.id) }, [route.id])

  const EXP = { beginner: 'Principiante', medio: 'Medio', advanced: 'Avanzado' }
  const pending = participants.filter(p => p.status === 'pending')
  const approved = participants.filter(p => p.status === 'approved')
  const rejected = participants.filter(p => p.status === 'rejected')

  const handleAction = async (partId, status) => {
    const result = await useStore.getState().updateParticipant(route.id, partId, status)
    if (result?.error) toast(result.error, 'error')
    else toast(status === 'approved' ? t('admin.participants.accepted') : t('admin.participants.rejected2'), status === 'approved' ? 'success' : 'error')
  }

  const Card = ({ p, actions }) => (
    <div style={{ background: 'var(--bg-3)', borderRadius: 'var(--radius)', padding: 12, marginBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: actions ? 10 : 0 }}>
        <div className="avatar avatar-sm">{(p.user?.first_name || p.user?.username || '?')[0].toUpperCase()}</div>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 600, fontSize: 14 }}>{p.user?.first_name} {p.user?.last_name}</p>
          <p style={{ fontSize: 12, color: 'var(--text-3)' }}>{p.user?.email}</p>
        </div>
        <span className={`badge badge-${p.status}`}>{p.status === 'pending' ? t('admin.participants.statusPending') : p.status === 'approved' ? t('admin.participants.statusApproved') : t('admin.participants.statusRejected')}</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: actions ? 10 : 0 }}>
        {p.user?.moto_model && <span style={{ fontSize: 11, background: 'var(--accent-dim)', borderRadius: 4, padding: '2px 7px', color: 'var(--accent)', fontWeight: 700 }}>🏍️ {p.user.moto_model}</span>}
        {p.user?.experience && <span style={{ fontSize: 11, background: 'var(--bg-4)', borderRadius: 4, padding: '2px 7px', color: 'var(--text-2)' }}>{EXP[p.user.experience]}</span>}
        {p.user?.needs_food && <span style={{ fontSize: 11, background: 'var(--bg-4)', borderRadius: 4, padding: '2px 7px', color: 'var(--text-2)' }}>🍽️ Comida</span>}
        {p.user?.is_subscribed && <span style={{ fontSize: 11, background: 'var(--accent-dim)', borderRadius: 4, padding: '2px 7px', color: 'var(--accent)' }}>⭐ Suscriptor</span>}
        {p.user?.location && <span style={{ fontSize: 11, background: 'var(--bg-4)', borderRadius: 4, padding: '2px 7px', color: 'var(--text-2)' }}>📍 {p.user.location}</span>}
      </div>
      {actions && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-sm" style={{ flex: 1, background: 'var(--green-dim)', color: 'var(--green)', border: '1px solid rgba(34,197,94,0.3)' }} onClick={() => handleAction(p.id, 'approved')}>
            <IconCheck size={14} /> {t('admin.participants.accept')}
          </button>
          <button className="btn btn-danger btn-sm" style={{ flex: 1 }} onClick={() => handleAction(p.id, 'rejected')}>
            <IconX size={14} /> {t('admin.participants.reject')}
          </button>
        </div>
      )}
    </div>
  )

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <h2 className="modal-title">{t('admin.participants.title', { title: route.title })}</h2>
        {pending.length > 0 && <><p className="section-title" style={{ marginBottom: 8 }}>{t('admin.participants.pending', { count: pending.length })}</p>{pending.map(p => <Card key={p.id} p={p} actions />)}</>}
        {approved.length > 0 && <><p className="section-title" style={{ marginBottom: 8, marginTop: 12 }}>{t('admin.participants.approved', { count: approved.length })}</p>{approved.map(p => <Card key={p.id} p={p} actions={false} />)}</>}
        {rejected.length > 0 && <><p className="section-title" style={{ marginBottom: 8, marginTop: 12 }}>{t('admin.participants.rejected', { count: rejected.length })}</p>{rejected.map(p => <Card key={p.id} p={p} actions={false} />)}</>}
        {participants.length === 0 && <div className="empty-state" style={{ padding: '24px 0' }}><IconUsers size={36} /><p className="empty-state-title">{t('admin.noRequests')}</p></div>}
        <button className="btn btn-ghost btn-full mt-8" onClick={onClose}>{t('admin.close')}</button>
      </div>
    </div>
  )
}

// ─── Settings Modal ───────────────────────────────────────────────────────────
function SettingsModal({ onClose }) {
  const currentUser = useStore((s) => s.currentUser)
  const navigate = useNavigate()
  const toast = useToast()
  const t = useT()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    first_name: currentUser?.first_name || '',
    email: currentUser?.email || '',
    insta_handle: currentUser?.insta_handle || '',
    password: '',
  })
  const set = (f, v) => setForm(p => ({...p, [f]: v}))

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    const data = { first_name: form.first_name, email: form.email, insta_handle: form.insta_handle }
    if (form.password) data.password = form.password
    const result = await useStore.getState().updateCurrentUser(data)
    setSaving(false)
    if (result?.error) { toast(result.error, 'error'); return }
    toast(t('admin.settings.saved'), 'success')
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div className="avatar avatar-lg" style={{ fontSize: 24 }}>{(form.first_name || 'A')[0].toUpperCase()}</div>
          <div>
            <h2 className="modal-title" style={{ marginBottom: 4 }}>{t('admin.settings.title')}</h2>
            <span className="badge badge-approved"><IconShield size={10} /> Admin</span>
          </div>
        </div>
        <form onSubmit={handleSave} className="stack">
          <div className="form-group">
            <label className="form-label">{t('admin.settings.name')}</label>
            <input className="form-input" value={form.first_name} onChange={e => set('first_name', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">{t('admin.settings.email')}</label>
            <input className="form-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">{t('admin.settings.instagram')}</label>
            <input className="form-input" value={form.insta_handle} onChange={e => set('insta_handle', e.target.value)} placeholder="@tuusuario" />
          </div>
          <div className="form-group">
            <label className="form-label">{t('admin.settings.newPassword')}</label>
            <input className="form-input" type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder={t('admin.settings.newPasswordPlaceholder')} />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={saving}>
            {saving ? <span className="spinner" /> : t('admin.settings.save')}
          </button>
          <button type="button" className="btn btn-danger btn-full" onClick={() => { useStore.getState().logout(); navigate('/auth') }}>
            <IconLogout size={16} /> {t('admin.settings.logout')}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Edit User Modal ──────────────────────────────────────────────────────────
function EditUserModal({ user, onClose, onSaved }) {
  const toast = useToast()
  const t = useT()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    subscription_type: user.is_subscribed ? 'subscribed' : user.is_free_user ? 'free' : 'none',
    promo_expires_at: user.promo_expires_at ? user.promo_expires_at.slice(0, 10) : '',
  })

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)

    const data = {
      is_subscribed: form.subscription_type === 'subscribed',
      is_free_user: form.subscription_type === 'free',
      promo_expires_at: form.subscription_type === 'subscribed' && form.promo_expires_at
        ? new Date(form.promo_expires_at + 'T23:59:59').toISOString()
        : null,
    }

    try {
      await api.updateUser(user.id, data)
      toast(t('admin.editUser.updated'), 'success')
      await useStore.getState().fetchAdminUsers()
      onSaved()
    } catch (err) {
      toast(err.data?.error || t('error.update'), 'error')
    }
    setSaving(false)
  }

  const name = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username

  const SUB_OPTIONS = [
    { value: 'none', label: t('admin.editUser.none'), desc: t('admin.editUser.noneDesc') },
    { value: 'free', label: t('admin.editUser.free'), desc: t('admin.editUser.freeDesc') },
    { value: 'subscribed', label: t('admin.editUser.subscribed'), desc: t('admin.editUser.subscribedDesc') },
  ]

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />

        {/* User header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div className="avatar avatar-lg" style={{ fontSize: 22 }}>
            {name[0]?.toUpperCase() || '?'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 900, textTransform: 'uppercase' }}>
              {name}
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.email}
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="stack">
          <p className="section-title" style={{ marginBottom: 4 }}>{t('admin.editUser.title')}</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {SUB_OPTIONS.map((opt) => (
              <label key={opt.value} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: form.subscription_type === opt.value ? 'var(--accent-dim)' : 'var(--bg-3)',
                border: `1.5px solid ${form.subscription_type === opt.value ? 'var(--accent-border)' : 'var(--border)'}`,
                borderRadius: 'var(--radius)', padding: '12px 14px', cursor: 'pointer',
                transition: 'all 0.15s',
              }}>
                <input
                  type="radio"
                  name="subscription_type"
                  value={opt.value}
                  checked={form.subscription_type === opt.value}
                  onChange={() => setForm((p) => ({ ...p, subscription_type: opt.value }))}
                  style={{ accentColor: 'var(--accent)', width: 16, height: 16, flexShrink: 0 }}
                />
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: form.subscription_type === opt.value ? 'var(--accent)' : 'var(--text)' }}>
                    {opt.label}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1 }}>{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>

          {/* Promo expiry — only shown for subscribed */}
          {form.subscription_type === 'subscribed' && (
            <div className="form-group">
              <label className="form-label">{t('admin.editUser.accessUntil')} <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>({t('admin.editUser.accessUntilHint')})</span></label>
              <input
                className="form-input"
                type="date"
                value={form.promo_expires_at}
                onChange={(e) => setForm((p) => ({ ...p, promo_expires_at: e.target.value }))}
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>{t('common.cancel')}</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={saving}>
              {saving ? <span className="spinner" /> : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Promo Codes Tab ──────────────────────────────────────────────────────────
function PromoCodesTab() {
  const toast = useToast()
  const t = useT()
  const [codes, setCodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editCode, setEditCode] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const load = async () => {
    setLoading(true)
    try { setCodes(await api.getPromoCodes()) } catch (e) { toast('Error al cargar códigos', 'error') }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id) => {
    const result = await api.deletePromoCode(id).then(() => ({ ok: true })).catch((e) => ({ error: e.data?.error || 'Error' }))
    setConfirmDelete(null)
    if (result.error) toast(result.error, 'error')
    else { toast(t('admin.promos.deleted'), 'success'); load() }
  }

  return (
    <div>
      <button className="btn btn-primary btn-full" style={{ marginBottom: 16 }} onClick={() => { setEditCode(null); setShowForm(true) }}>
        <IconPlus size={16} /> {t('admin.promos.create')}
      </button>

      {loading && <div className="empty-state"><span className="spinner" /></div>}

      {!loading && codes.length === 0 && (
        <div className="empty-state">
          <p className="empty-state-title">{t('admin.promos.empty')}</p>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>{t('admin.promos.emptyHint')}</p>
        </div>
      )}

      <div className="stack">
        {codes.map((code) => {
          const typeBadge = code.promo_type === 'free_account'
            ? { bg: 'var(--green-dim)', color: 'var(--green)', text: '🆓 Free' }
            : code.promo_type === 'discount'
            ? { bg: 'var(--yellow-dim)', color: 'var(--yellow)', text: `💰 ${t('admin.promos.discountBadge', { pct: code.discount_percentage || 0 })}` }
            : { bg: 'var(--accent-dim)', color: 'var(--accent)', text: `📅 ${code.days_free} days` }

          return (
            <div key={code.id} style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 900, letterSpacing: '0.08em', color: 'var(--accent)' }}>
                      {code.code}
                    </span>
                    <span style={{ fontSize: 11, background: typeBadge.bg, color: typeBadge.color, borderRadius: 4, padding: '2px 7px', fontWeight: 700 }}>
                      {typeBadge.text}
                    </span>
                  </div>
                  <span className={`badge ${code.is_active ? 'badge-approved' : 'badge-ended'}`}>
                    {code.is_active ? t('admin.promos.active') : t('admin.promos.inactive')}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-2)' }}>
                  {code.uses_count !== undefined ? `${code.uses_count}` : '0'}/{code.max_uses || '∞'}
                  {code.max_uses ? ` · ${t('admin.promos.maxUses', { max: code.max_uses })}` : ` · ${t('admin.promos.unlimited')}`}
                </p>
                {code.expires_at && (
                  <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                    {t('admin.promos.expires', { date: format(new Date(code.expires_at), "d MMM yyyy", { locale: es }) })}
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', borderTop: '1px solid var(--border)' }}>
                <button className="btn btn-ghost btn-sm" style={{ flex: 1, borderRadius: 0, borderRight: '1px solid var(--border)' }}
                  onClick={() => { setEditCode(code); setShowForm(true) }}>
                  <IconEdit size={14} /> {t('admin.promos.edit')}
                </button>
                <button className="btn btn-ghost btn-sm" style={{ flex: 1, borderRadius: 0, color: 'var(--red)' }}
                  onClick={() => setConfirmDelete(code)}>
                  <IconTrash size={14} /> {t('admin.promos.delete')}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {showForm && (
        <PromoFormModal
          code={editCode}
          onClose={() => { setShowForm(false); setEditCode(null) }}
          onSaved={() => { setShowForm(false); setEditCode(null); load() }}
        />
      )}

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle" />
            <h2 className="modal-title" style={{ fontSize: 20 }}>{t('admin.promos.deleteTitle')}</h2>
            <p style={{ fontSize: 15, color: 'var(--text-2)', marginBottom: 24 }}>
              {t('admin.promos.deleteDesc', { code: confirmDelete.code })}
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setConfirmDelete(null)}>{t('common.cancel')}</button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => handleDelete(confirmDelete.id)}>
                <IconTrash size={16} /> {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Promo Form Modal ─────────────────────────────────────────────────────────
function PromoFormModal({ code, onClose, onSaved }) {
  const toast = useToast()
  const t = useT()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    code: code?.code || '',
    promo_type: code?.promo_type || 'free_days',
    days_free: code?.days_free || 30,
    discount_percentage: code?.discount_percentage || 0,
    payment_url: code?.payment_url || '',
    max_uses: code?.max_uses || '',
    expires_at: code?.expires_at ? code.expires_at.slice(0, 10) : '',
    is_active: code?.is_active ?? true,
  })
  const [errors, setErrors] = useState({})
  const set = (f, v) => { setForm((p) => ({ ...p, [f]: v })); setErrors((p) => ({ ...p, [f]: '' })) }

  const validate = () => {
    const e = {}
    if (!form.code.trim()) e.code = t('validation.required')
    if (form.promo_type === 'free_days') {
      if (!form.days_free || Number(form.days_free) < 1) e.days_free = t('validation.minOneDay')
    }
    if (form.promo_type === 'discount') {
      const pct = Number(form.discount_percentage)
      if (!pct || pct < 1 || pct > 99) e.discount_percentage = '1-99'
      if (!form.payment_url.trim()) e.payment_url = t('validation.required')
    }
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    const data = {
      code: form.code.trim().toUpperCase(),
      promo_type: form.promo_type,
      days_free: form.promo_type === 'free_days' ? Number(form.days_free) : 0,
      discount_percentage: form.promo_type === 'discount' ? Number(form.discount_percentage) : 0,
      payment_url: form.promo_type === 'discount' ? form.payment_url.trim() : '',
      max_uses: form.max_uses ? Number(form.max_uses) : null,
      expires_at: form.expires_at || null,
      is_active: form.is_active,
    }
    try {
      if (code) await api.updatePromoCode(code.id, data)
      else await api.createPromoCode(data)
      toast(code ? t('admin.promos.form.updated') : t('admin.promos.form.created'), 'success')
      onSaved()
    } catch (err) {
      toast(err.data?.error || 'Error al guardar', 'error')
    }
    setSaving(false)
  }

  const PROMO_TYPES = [
    { value: 'free_account', label: t('admin.promos.typeFreeAccount') },
    { value: 'discount', label: t('admin.promos.typeDiscount') },
    { value: 'free_days', label: t('admin.promos.typeFreeDays') },
  ]

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <h2 className="modal-title">{code ? t('admin.promos.form.titleEdit') : t('admin.promos.form.title')}</h2>
        <form onSubmit={handleSubmit} className="stack">
          <div className="form-group">
            <label className="form-label">{t('admin.promos.form.code')}</label>
            <input className="form-input" value={form.code} onChange={(e) => set('code', e.target.value.toUpperCase())}
              placeholder={t('admin.promos.form.codePlaceholder')} style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }} />
            {errors.code && <span className="form-error">{errors.code}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">{t('admin.promos.form.type')}</label>
            <select className="form-input" value={form.promo_type} onChange={(e) => set('promo_type', e.target.value)}>
              {PROMO_TYPES.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          {form.promo_type === 'free_days' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="form-group">
                <label className="form-label">{t('admin.promos.form.daysFree')}</label>
                <input className="form-input" type="number" min="1" max="365" value={form.days_free}
                  onChange={(e) => set('days_free', e.target.value)} />
                {errors.days_free && <span className="form-error">{errors.days_free}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">{t('admin.promos.form.maxUses')}</label>
                <input className="form-input" type="number" min="1" value={form.max_uses}
                  onChange={(e) => set('max_uses', e.target.value)} placeholder={t('admin.promos.form.maxUsesPlaceholder')} />
              </div>
            </div>
          )}
          {form.promo_type === 'discount' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="form-group">
                  <label className="form-label">{t('admin.promos.form.discountPercentage')}</label>
                  <input className="form-input" type="number" min="1" max="99" value={form.discount_percentage}
                    onChange={(e) => set('discount_percentage', e.target.value)} />
                  {errors.discount_percentage && <span className="form-error">{errors.discount_percentage}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">{t('admin.promos.form.maxUses')}</label>
                  <input className="form-input" type="number" min="1" value={form.max_uses}
                    onChange={(e) => set('max_uses', e.target.value)} placeholder={t('admin.promos.form.maxUsesPlaceholder')} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{t('admin.promos.form.paymentUrl')}</label>
                <input className="form-input" type="url" value={form.payment_url}
                  onChange={(e) => set('payment_url', e.target.value)} placeholder={t('admin.promos.form.paymentUrlPlaceholder')} />
                {errors.payment_url && <span className="form-error">{errors.payment_url}</span>}
              </div>
            </>
          )}
          {form.promo_type === 'free_account' && (
            <div className="form-group">
              <label className="form-label">{t('admin.promos.form.maxUses')}</label>
              <input className="form-input" type="number" min="1" value={form.max_uses}
                onChange={(e) => set('max_uses', e.target.value)} placeholder={t('admin.promos.form.maxUsesPlaceholder')} />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">{t('admin.promos.form.expiresAt')}</label>
            <input className="form-input" type="date" value={form.expires_at}
              onChange={(e) => set('expires_at', e.target.value)} />
          </div>
          <div style={{ background: 'var(--bg-3)', borderRadius: 'var(--radius)', padding: '4px 14px' }}>
            <div className="toggle-row">
              <span className="toggle-label">{t('admin.promos.form.isActive')}</span>
              <label className="toggle">
                <input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} />
                <span className="toggle-slider" />
              </label>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>{t('admin.promos.form.cancel')}</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={saving}>
              {saving ? <span className="spinner" /> : code ? t('admin.promos.form.save') : t('admin.promos.form.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const navigate = useNavigate()
  const currentUser = useStore((s) => s.currentUser)
  const routes = useStore((s) => s.routes)
  const adminUsers = useStore((s) => s.adminUsers)
  const participants = useStore((s) => s.participants)
  const toast = useToast()
  const t = useT()
  const [freeStats, setFreeStats] = useState(null)

  const [showForm, setShowForm] = useState(false)
  const [editRoute, setEditRoute] = useState(null)
  const [showParticipants, setShowParticipants] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [tab, setTab] = useState('routes')
  const [editUser, setEditUser] = useState(null)
  const [confirmDeleteUser, setConfirmDeleteUser] = useState(null)

  useEffect(() => {
    useStore.getState().fetchRoutes()
    useStore.getState().fetchAdminUsers()
    api.getHealth().then(setFreeStats).catch(() => {})
  }, [])

  if (!currentUser?.is_staff) {
    return <div style={{ padding: 24, textAlign: 'center' }}><p style={{ color: 'var(--text-3)' }}>{t('error.restricted')}</p></div>
  }

  const totalPending = Object.values(participants).flat().filter(p => p.status === 'pending').length

  const handleDelete = async () => {
    const result = await useStore.getState().deleteRoute(confirmDelete.id)
    setConfirmDelete(null)
    if (result?.error) toast(result.error, 'error')
    else toast(t('admin.routeDeleted'), 'success')
  }

  const handleDeleteUser = async () => {
    try {
      await api.deleteUser(confirmDeleteUser.id)
      toast(t('admin.userDeleted'), 'success')
      useStore.getState().fetchAdminUsers()
      setConfirmDeleteUser(null)
    } catch (err) {
      toast(err.data?.error || t('error.delete'), 'error')
      setConfirmDeleteUser(null)
    }
  }

  const EXP = { beginner: 'Principiante', medio: 'Medio', advanced: 'Avanzado' }
  const MOTO = { naked: 'Naked', sport: 'Sport', adventure: 'Adventure', touring: 'Touring', scrambler: 'Scrambler', custom: 'Custom', enduro: 'Enduro', other: 'Otra' }

  return (
    <div style={{ flex: 1, paddingBottom: 'calc(var(--nav-height) + var(--safe-bottom))' }}>
      {/* Header */}
      <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', background: 'linear-gradient(180deg, var(--bg-3) 0%, var(--bg) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <IconShield size={22} style={{ color: 'var(--accent)' }} />
            <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 26, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t('admin.title')}</h1>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setShowSettings(true)}><IconSettings size={18} /></button>
            <button className="btn btn-primary btn-sm" onClick={() => { setEditRoute(null); setShowForm(true) }}><IconPlus size={16} /> {t('admin.newRoute')}</button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          {[
            { label: t('admin.stats.routes'), value: routes.length },
            { label: t('admin.stats.riders'), value: adminUsers.length },
            { label: t('admin.stats.pending'), value: totalPending, accent: totalPending > 0 },
            { label: t('admin.stats.freeSlots'), value: freeStats ? `${freeStats.free_spots_left}/50` : '…', accent: false },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, background: 'var(--bg-3)', border: `1px solid ${s.accent ? 'var(--accent-border)' : 'var(--border)'}`, borderRadius: 'var(--radius)', padding: 10, textAlign: 'center' }}>
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 900, color: s.accent ? 'var(--accent)' : 'var(--text)' }}>{s.value}</p>
              <p style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 16px' }}>
        {[{ key: 'routes', label: t('admin.tabs.routes') }, { key: 'users', label: `${t('admin.tabs.users')} (${adminUsers.length})` }, { key: 'promos', label: t('admin.tabs.promos') }].map(tabItem => (
          <button key={tabItem.key} onClick={() => setTab(tabItem.key)} style={{ padding: '12px 16px', border: 'none', background: 'transparent', color: tab === tabItem.key ? 'var(--accent)' : 'var(--text-3)', fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', borderBottom: tab === tabItem.key ? '2px solid var(--accent)' : '2px solid transparent', marginBottom: -1 }}>
            {tabItem.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '16px', maxWidth: 480, margin: '0 auto' }}>
        {/* Routes tab */}
        {tab === 'routes' && (
          <div className="stack">
            {routes.length === 0 && <div className="empty-state"><IconCalendar size={40} /><p className="empty-state-title">{t('admin.noRoutes')}</p></div>}
            {routes.map(route => {
              const routeParts = participants[route.id] || []
              const pending = routeParts.filter(p => p.status === 'pending').length
              const approved = routeParts.filter(p => p.status === 'approved').length
              return (
                <div key={route.id} style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                  <div style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span className={`badge badge-${route.status}`}>{route.status === 'active' ? t('routes.status.active') : route.status === 'upcoming' ? t('routes.status.upcoming') : route.status === 'full' ? t('routes.status.full') : t('routes.status.ended')}</span>
                      {pending > 0 && <span className="badge badge-pending">{t('admin.pending', { count: pending })}</span>}
                    </div>
                    <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 900, textTransform: 'uppercase' }}>{route.title}</h3>
                    <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>{format(new Date(route.date), "d MMM yyyy · HH:mm", { locale: es })} · {route.city}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{t('admin.ridersAccepted', { count: route.approved_count, max: route.max_participants })}</p>
                  </div>
                  <div style={{ display: 'flex', borderTop: '1px solid var(--border)' }}>
                    <button className="btn btn-ghost btn-sm" style={{ flex: 1, borderRadius: 0, borderRight: '1px solid var(--border)' }} onClick={() => setShowParticipants(route)}><IconUsers size={14} /> {t('admin.riders')}</button>
                    <button className="btn btn-ghost btn-sm" style={{ flex: 1, borderRadius: 0, borderRight: '1px solid var(--border)' }} onClick={() => navigate(`/events/${route.id}`)}>{t('admin.view')}</button>
                    <button className="btn btn-ghost btn-sm" style={{ flex: 1, borderRadius: 0, borderRight: '1px solid var(--border)' }} onClick={() => { setEditRoute(route); setShowForm(true) }}><IconEdit size={14} /></button>
                    <button className="btn btn-ghost btn-sm" style={{ flex: 1, borderRadius: 0, color: 'var(--red)' }} onClick={() => setConfirmDelete(route)}><IconTrash size={14} /></button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Users tab */}
        {tab === 'users' && (
          <div className="stack">
            {adminUsers.length === 0 && <div className="empty-state"><IconUsers size={40} /><p className="empty-state-title">{t('admin.noRiders')}</p></div>}
            {adminUsers.map(user => (
              <div key={user.id} style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div className="avatar">{(user.first_name || user.username || '?')[0].toUpperCase()}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user.first_name} {user.last_name}
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</p>
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text-3)', flexShrink: 0 }}>{user.routes_count} ruta{user.routes_count !== 1 ? 's' : ''}</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {user.moto_type && <span style={{ fontSize: 11, background: 'var(--bg-4)', borderRadius: 4, padding: '2px 7px', color: 'var(--text-2)' }}>🏍️ {MOTO[user.moto_type] || user.moto_type}</span>}
                    {user.moto_model && <span style={{ fontSize: 11, background: 'var(--accent-dim)', borderRadius: 4, padding: '2px 7px', color: 'var(--accent)', fontWeight: 700 }}>{user.moto_model}</span>}
                    {user.location && <span style={{ fontSize: 11, background: 'var(--bg-4)', borderRadius: 4, padding: '2px 7px', color: 'var(--text-2)' }}>📍 {user.location}</span>}
                    {user.experience && <span style={{ fontSize: 11, background: 'var(--bg-4)', borderRadius: 4, padding: '2px 7px', color: 'var(--text-2)' }}>{EXP[user.experience]}</span>}
                    {user.is_subscribed && <span style={{ fontSize: 11, background: 'var(--accent-dim)', borderRadius: 4, padding: '2px 7px', color: 'var(--accent)' }}>⭐ Suscriptor</span>}
                    {user.is_free_user && <span style={{ fontSize: 11, background: 'var(--green-dim)', borderRadius: 4, padding: '2px 7px', color: 'var(--green)' }}>🆓 Free</span>}
                    {!user.is_subscribed && !user.is_free_user && <span style={{ fontSize: 11, background: 'var(--bg-4)', borderRadius: 4, padding: '2px 7px', color: 'var(--text-3)' }}>🚫 Sin acceso</span>}
                    {user.insta_handle && <span style={{ fontSize: 11, background: 'var(--bg-4)', borderRadius: 4, padding: '2px 7px', color: 'var(--text-2)' }}>📸 {user.insta_handle}</span>}
                    {user.promo_expires_at && <span style={{ fontSize: 11, background: 'var(--yellow-dim)', borderRadius: 4, padding: '2px 7px', color: 'var(--yellow)' }}>⏳ hasta {new Date(user.promo_expires_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', borderTop: '1px solid var(--border)' }}>
                  <button className="btn btn-ghost btn-sm" style={{ flex: 1, borderRadius: 0, borderRight: '1px solid var(--border)' }}
                    onClick={() => setEditUser(user)}>
                    <IconEdit size={14} /> {t('admin.subscription')}
                  </button>
                  <button className="btn btn-ghost btn-sm" style={{ flex: 1, borderRadius: 0, color: 'var(--red)' }}
                    onClick={() => setConfirmDeleteUser(user)}>
                    <IconTrash size={14} /> {t('common.delete')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Promo codes tab */}
        {tab === 'promos' && (
          <PromoCodesTab />
        )}
      </div>

      {showForm && <EventFormModal event={editRoute} onClose={() => { setShowForm(false); setEditRoute(null) }} />}
      {showParticipants && <ParticipantsModal route={showParticipants} onClose={() => setShowParticipants(null)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {editUser && (
        <EditUserModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSaved={() => setEditUser(null)}
        />
      )}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <h2 className="modal-title" style={{ fontSize: 20 }}>{t('admin.deleteRoute')}</h2>
            <p style={{ fontSize: 15, color: 'var(--text-2)', marginBottom: 24 }}>{t('admin.deleteRouteDesc', { title: confirmDelete.title })}</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setConfirmDelete(null)}>{t('common.cancel')}</button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleDelete}><IconTrash size={16} /> {t('common.delete')}</button>
            </div>
          </div>
        </div>
      )}
      {confirmDeleteUser && (
        <div className="modal-overlay" onClick={() => setConfirmDeleteUser(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <h2 className="modal-title" style={{ fontSize: 20 }}>{t('admin.deleteUser')}</h2>
            <p style={{ fontSize: 15, color: 'var(--text-2)', marginBottom: 8 }}>
              {t('admin.deleteUserDesc', { name: `${confirmDeleteUser.first_name} ${confirmDeleteUser.last_name}` })}
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 24 }}>
              {confirmDeleteUser.email} · {confirmDeleteUser.routes_count} ruta{confirmDeleteUser.routes_count !== 1 ? 's' : ''}
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setConfirmDeleteUser(null)}>{t('common.cancel')}</button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleDeleteUser}><IconTrash size={16} /> {t('common.delete')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
