import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import { IconLogout, IconShield, IconMapPin, IconCalendar, IconSettings, IconEdit } from '../components/Icons'
import { useToast } from '../components/Toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { sanitizeText, sanitizeEmail, sanitizeInstagram, validatePassword } from '../security'

const EXPERIENCE_LABELS = { beginner: 'Principiante', medio: 'Medio', advanced: 'Avanzado' }
const EXPERIENCE_COLORS = { beginner: 'var(--green)', medio: 'var(--yellow)', advanced: 'var(--accent)' }
const MOTO_TYPE_LABELS = {
  naked: 'Naked', sport: 'Sport / Supersport', adventure: 'Adventure / Trail',
  touring: 'Touring', scrambler: 'Scrambler / Café Racer', custom: 'Custom / Cruiser',
  enduro: 'Enduro / Off-road', other: 'Otra',
}
const MOTO_TYPE_OPTIONS = [
  { value: 'naked', label: 'Naked' }, { value: 'sport', label: 'Sport / Supersport' },
  { value: 'adventure', label: 'Adventure / Trail' }, { value: 'touring', label: 'Touring' },
  { value: 'scrambler', label: 'Scrambler / Café Racer' }, { value: 'custom', label: 'Custom / Cruiser' },
  { value: 'enduro', label: 'Enduro / Off-road' }, { value: 'other', label: 'Otra' },
]
const EXPERIENCE_OPTIONS = [
  { value: 'beginner', label: '🟢 Principiante — menos de 2 años' },
  { value: 'medio', label: '🟡 Medio — 2 a 5 años' },
  { value: 'advanced', label: '🔴 Avanzado — más de 5 años' },
]
const HEARD_FROM_LABELS = { instagram: 'Instagram', tiktok: 'TikTok', friends: 'Amigos', other: 'Otro' }

// ─── Edit Profile Modal ───────────────────────────────────────────────────────
function EditProfileModal({ onClose }) {
  const currentUser = useStore((s) => s.currentUser)
  const toast = useToast()

  const [form, setForm] = useState({
    first_name: currentUser?.first_name || '',
    last_name: currentUser?.last_name || '',
    email: currentUser?.email || '',
    location: currentUser?.location || '',
    moto_type: currentUser?.moto_type || '',
    moto_model: currentUser?.moto_model || '',
    experience: currentUser?.experience || '',
    insta_handle: currentUser?.insta_handle || '',
    newPassword: '',
    currentPassword: '', // Required for email/password changes
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const emailChanged = form.email.trim().toLowerCase() !== (currentUser?.email || '').toLowerCase()

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.first_name.trim()) errs.first_name = 'Nombre requerido'
    if (!form.email.trim()) errs.email = 'Email requerido'
    if (form.newPassword && form.newPassword.length < 6) errs.newPassword = 'Mínimo 6 caracteres'
    
    // Require current password for email or password changes
    if ((emailChanged || form.newPassword) && !form.currentPassword) {
      errs.currentPassword = 'Contraseña actual requerida para cambiar email o contraseña'
    }

    // Validate new password strength
    if (form.newPassword) {
      const pwCheck = validatePassword(form.newPassword)
      if (!pwCheck.valid) errs.newPassword = pwCheck.message
    }

    if (Object.keys(errs).length) { setErrors(errs); return }

    setSaving(true)
    const updates = {
      first_name: sanitizeText(form.first_name.trim(), 50),
      last_name: sanitizeText(form.last_name.trim(), 50),
      email: sanitizeEmail(form.email.trim()),
      location: sanitizeText(form.location.trim(), 100),
      moto_type: form.moto_type,
      moto_model: sanitizeText(form.moto_model.trim(), 100),
      experience: form.experience,
      insta_handle: sanitizeInstagram(form.insta_handle),
    }
    if (form.newPassword) updates.password = form.newPassword
    if (emailChanged || form.newPassword) updates.current_password = form.currentPassword

    const result = await useStore.getState().updateCurrentUser(updates)
    setSaving(false)
    if (result?.error) {
      toast(result.error, 'error')
    } else {
      toast('Perfil actualizado ✓', 'success')
      onClose()
    }
  }

  const isAdmin = currentUser?.is_staff

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div className="avatar avatar-lg" style={{ fontSize: 24 }}>
            {(form.first_name || '?')[0]?.toUpperCase()}
          </div>
          <div>
            <h2 className="modal-title" style={{ marginBottom: 2 }}>Editar perfil</h2>
            {isAdmin && <span className="badge badge-approved"><IconShield size={10} /> Admin</span>}
          </div>
        </div>

        <form onSubmit={handleSave} className="stack">

          {/* ── Personal info ── */}
          <p className="section-title" style={{ marginBottom: 4 }}>Información personal</p>

          <div className="form-group">
            <label className="form-label">Nombre</label>
            <input className="form-input" type="text" value={form.first_name}
              onChange={(e) => set('first_name', e.target.value)} placeholder="Tu nombre" />
            {errors.first_name && <span className="form-error">{errors.first_name}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Apellido</label>
            <input className="form-input" type="text" value={form.last_name}
              onChange={(e) => set('last_name', e.target.value)} placeholder="Tu apellido" />
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={form.email}
              onChange={(e) => set('email', e.target.value)} placeholder="tu@email.com" />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          {!isAdmin && (
            <div className="form-group">
              <label className="form-label">Ciudad / Ubicación</label>
              <input className="form-input" type="text" value={form.location}
                onChange={(e) => set('location', e.target.value)} placeholder="Madrid, Barcelona..." />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Instagram (opcional)</label>
            <input className="form-input" type="text" value={form.insta_handle}
              onChange={(e) => set('insta_handle', e.target.value)} placeholder="@tuusuario" />
          </div>

          {/* ── Moto info (non-admin only) ── */}
          {!isAdmin && (
            <>
              <div style={{ height: 1, background: 'var(--border)' }} />
              <p className="section-title" style={{ marginBottom: 4 }}>Tu moto</p>

              <div className="form-group">
                <label className="form-label">Tipo de moto</label>
                <select className="form-select" value={form.moto_type}
                  onChange={(e) => set('moto_type', e.target.value)}>
                  <option value="">Selecciona el tipo...</option>
                  {MOTO_TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Marca y modelo</label>
                <input className="form-input" type="text" value={form.moto_model}
                  onChange={(e) => set('moto_model', e.target.value)} placeholder="Yamaha MT-07..." />
              </div>

              <div className="form-group">
                <label className="form-label">Nivel de experiencia</label>
                <select className="form-select" value={form.experience}
                  onChange={(e) => set('experience', e.target.value)}>
                  <option value="">Selecciona tu nivel...</option>
                  {EXPERIENCE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

            </>
          )}

          {/* ── Password ── */}
          <div style={{ height: 1, background: 'var(--border)' }} />
          <p className="section-title" style={{ marginBottom: 4 }}>Cambiar contraseña</p>

          {/* Current password — required for email/password changes */}
          {(emailChanged || form.newPassword) && (
            <div className="form-group">
              <label className="form-label">Contraseña actual <span style={{ color: 'var(--accent)', fontWeight: 700 }}>*</span></label>
              <input className="form-input" type="password" value={form.currentPassword}
                onChange={(e) => set('currentPassword', e.target.value)} placeholder="Tu contraseña actual" />
              {errors.currentPassword && <span className="form-error">{errors.currentPassword}</span>}
              <span className="form-hint" style={{ color: 'var(--accent)' }}>
                Requerida para cambiar {emailChanged && form.newPassword ? 'email y contraseña' : emailChanged ? 'email' : 'contraseña'}
              </span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Nueva contraseña</label>
            <input className="form-input" type="password" value={form.newPassword}
              onChange={(e) => set('newPassword', e.target.value)} placeholder="Dejar vacío para no cambiar" />
            {errors.newPassword && <span className="form-error">{errors.newPassword}</span>}
          </div>

          {/* ── Actions ── */}
          <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={saving}>
              {saving ? <span className="spinner" /> : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ value, label, accent }) {
  return (
    <div style={{
      flex: 1,
      background: 'var(--bg-2)',
      border: `1px solid ${accent ? 'rgba(232,50,10,0.2)' : 'var(--border)'}`,
      borderRadius: 'var(--radius-lg)',
      padding: '16px 12px',
      textAlign: 'center',
      boxShadow: accent ? '0 4px 16px rgba(232,50,10,0.08)' : 'var(--shadow-sm)',
    }}>
      <p style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontWeight: 900, fontSize: 36, lineHeight: 1,
        color: accent ? 'var(--accent)' : 'var(--text)', marginBottom: 4,
      }}>
        {value}
      </p>
      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
        {label}
      </p>
    </div>
  )
}

function InfoRow({ label, value, highlight }) {
  if (!value) return null
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '12px 0', borderBottom: '1px solid var(--border)',
    }}>
      <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {label}
      </span>
      <span style={{ fontSize: 14, color: highlight ? 'var(--accent)' : 'var(--text)', fontWeight: highlight ? 700 : 500, textAlign: 'right', maxWidth: '60%' }}>
        {value}
      </span>
    </div>
  )
}

// ─── Instagram pill ───────────────────────────────────────────────────────────
function InstagramPill({ handle }) {
  if (!handle) return null
  const clean = handle.startsWith('@') ? handle : `@${handle}`
  const url = `https://instagram.com/${handle.replace('@', '')}`
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      textDecoration: 'none',
      background: 'linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
      borderRadius: 100, padding: '5px 12px',
      boxShadow: '0 2px 12px rgba(220,39,67,0.3)',
    }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
      <span style={{ fontSize: 13, fontWeight: 700, color: 'white', letterSpacing: '0.02em' }}>{clean}</span>
    </a>
  )
}

// ─── Main Profile Page ────────────────────────────────────────────────────────
export default function ProfilePage() {
  const navigate = useNavigate()
  const currentUser = useStore((s) => s.currentUser)
  const routes = useStore((s) => s.routes)
  const toast = useToast()
  const [showEdit, setShowEdit] = useState(false)

  useEffect(() => {
    useStore.getState().refreshUser()
    if (!useStore.getState().routes.length) useStore.getState().fetchRoutes()
  }, [])

  // Routes the user is approved for — derived from routes list using user_status
  const myRoutes = routes.filter((r) => r.user_status === 'approved')
    .sort((a, b) => new Date(b.date) - new Date(a.date))
  const completedRoutes = myRoutes.filter((r) => r.status === 'ended').length
  const upcomingRoutes = myRoutes.filter((r) => r.status === 'upcoming' || r.status === 'active').length
  // Use API-provided counts if available
  const totalRoutes = currentUser?.routes_count ?? myRoutes.length

  const handleLogout = () => {
    useStore.getState().logout()
    toast('Hasta pronto 👋', 'success')
    navigate('/auth')
  }

  const name = currentUser?.first_name
    ? `${currentUser.first_name} ${currentUser.last_name || ''}`.trim()
    : currentUser?.username || ''
  const initials = name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div style={{ flex: 1, paddingBottom: 'calc(var(--nav-height) + var(--safe-bottom))' }}>

      {/* ── Hero header ── */}
      <div style={{
        padding: '28px 20px 24px',
        borderBottom: '1px solid var(--border)',
        background: 'linear-gradient(180deg, rgba(232,50,10,0.04) 0%, transparent 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, transparent, var(--accent), transparent)' }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, maxWidth: 480, margin: '0 auto' }}>
          {/* Avatar */}
          <div className="avatar avatar-lg" style={{ fontSize: 26, flexShrink: 0 }}>
            {initials}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Name + badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h2 style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 26, fontWeight: 900, fontStyle: 'italic',
                textTransform: 'uppercase', letterSpacing: '0.02em', lineHeight: 1,
              }}>
                {name}
              </h2>
              {currentUser?.is_staff && (
                <span className="badge badge-approved"><IconShield size={10} /> Admin</span>
              )}
              {currentUser?.experience && !currentUser?.is_staff && (
                <span style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                  color: EXPERIENCE_COLORS[currentUser.experience],
                  background: `${EXPERIENCE_COLORS[currentUser.experience]}18`,
                  border: `1px solid ${EXPERIENCE_COLORS[currentUser.experience]}30`,
                  borderRadius: 100, padding: '3px 9px',
                }}>
                  {EXPERIENCE_LABELS[currentUser.experience]}
                </span>
              )}
            </div>

            <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>{currentUser?.email}</p>

            {currentUser?.location && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 5 }}>
                <IconMapPin size={12} style={{ color: 'var(--text-3)' }} />
                <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{currentUser.location}</span>
              </div>
            )}

            {currentUser?.insta_handle && (
              <div style={{ marginTop: 8 }}>
                <InstagramPill handle={currentUser.insta_handle} />
              </div>
            )}
          </div>

          {/* Edit button */}
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => setShowEdit(true)}
            aria-label="Editar perfil"
            style={{ flexShrink: 0 }}
          >
            <IconEdit size={18} />
          </button>
        </div>
      </div>

      <div style={{ padding: '20px 16px', maxWidth: 480, margin: '0 auto' }}>

        {/* ── Stats (non-admin) ── */}
        {!currentUser?.is_staff && (
          <div style={{ marginBottom: 24 }}>
            <p className="section-title">Mis rutas</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <StatCard value={totalRoutes} label="Rutas totales" accent />
              <StatCard value={currentUser?.completed_routes ?? completedRoutes} label="Completadas" />
              <StatCard value={upcomingRoutes} label="Próximas" />
            </div>
          </div>
        )}

        {/* ── Rider info (non-admin) ── */}
        {!currentUser?.is_staff && (
          <div style={{ marginBottom: 24 }}>
            <p className="section-title">Mi perfil rider</p>
            <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '4px 16px', boxShadow: 'var(--shadow-sm)' }}>
              <InfoRow label="Tipo de moto" value={MOTO_TYPE_LABELS[currentUser?.moto_type]} />
              <InfoRow label="Moto" value={currentUser?.moto_model} highlight />
              <InfoRow label="Ubicación" value={currentUser?.location} />
              <InfoRow label="Nivel" value={EXPERIENCE_LABELS[currentUser?.experience]} />
              <InfoRow label="Suscriptor" value={currentUser?.is_subscribed ? (currentUser?.promo_expires_at ? `⭐ Promo hasta ${new Date(currentUser.promo_expires_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}` : '⭐ Sí') : currentUser?.is_free_user ? '🆓 Usuario gratuito' : 'No'} />
              {currentUser?.insta_handle && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Instagram</span>
                  <InstagramPill handle={currentUser.insta_handle} />
                </div>
              )}
              <InfoRow label="Nos conoció por" value={HEARD_FROM_LABELS[currentUser?.heard_from]} />
            </div>
            {currentUser?.is_subscribed && !currentUser?.is_free_user && (
              <div style={{ marginTop: 12, background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px 16px', boxShadow: 'var(--shadow-sm)' }}>
                <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 10 }}>
                  Para gestionar o cancelar tu suscripción, revisa el email de confirmación de pago de Square.
                </p>
                <a
                  href="https://squareup.com/login"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost btn-full btn-sm"
                  style={{ textDecoration: 'none' }}
                >
                  Gestionar suscripción en Square →
                </a>
              </div>
            )}
          </div>
        )}

        {/* ── Admin instagram ── */}
        {currentUser?.is_staff && currentUser?.insta_handle && (
          <div style={{ marginBottom: 24 }}>
            <p className="section-title">Redes sociales</p>
            <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Instagram</span>
              <InstagramPill handle={currentUser.insta_handle} />
            </div>
          </div>
        )}

        {/* ── Route history ── */}
        {myRoutes.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <p className="section-title">Historial de rutas</p>
            <div className="stack">
              {myRoutes.map((r) => (
                <div key={r.id} onClick={() => navigate(`/events/${r.id}`)} style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', flexShrink: 0, background: r.status === 'ended' ? 'var(--bg-3)' : 'var(--accent-dim)', border: `1px solid ${r.status === 'ended' ? 'var(--border)' : 'var(--accent-border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IconCalendar size={18} style={{ color: r.status === 'ended' ? 'var(--text-3)' : 'var(--accent)' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.title}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <IconMapPin size={11} style={{ color: 'var(--text-3)' }} />
                      <p style={{ fontSize: 12, color: 'var(--text-3)' }}>{r.city}</p>
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>
                      {format(new Date(r.date), "d MMM yyyy", { locale: es })}
                    </p>
                  </div>
                  <span className={`badge badge-${r.status}`}>
                    {r.status === 'active' ? 'En curso' : r.status === 'upcoming' ? 'Próximo' : 'Finalizado'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Logout */}
        <button className="btn btn-danger btn-full" onClick={handleLogout}>
          <IconLogout size={18} /> Cerrar sesión
        </button>
      </div>

      {/* Edit modal */}
      {showEdit && <EditProfileModal onClose={() => setShowEdit(false)} />}
    </div>
  )
}
