import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import BlakerLogo from '../components/BlakerLogo'
import { useToast } from '../components/Toast'
import { api } from '../api'
import { Turnstile, useHoneypot, checkRateLimit, resetRateLimit, formatRetryAfter, RATE_LIMITS, validatePassword } from '../security'

const MOTO_TYPE_OPTIONS = [
  { value: 'naked', label: 'Naked' },
  { value: 'sport', label: 'Sport / Supersport' },
  { value: 'adventure', label: 'Adventure / Trail' },
  { value: 'touring', label: 'Touring' },
  { value: 'scrambler', label: 'Scrambler / Café Racer' },
  { value: 'custom', label: 'Custom / Cruiser' },
  { value: 'enduro', label: 'Enduro / Off-road' },
  { value: 'other', label: 'Otra' },
]

const EXPERIENCE_OPTIONS = [
  { value: 'beginner', label: '🟢 Principiante — menos de 2 años' },
  { value: 'medio', label: '🟡 Medio — 2 a 5 años' },
  { value: 'advanced', label: '🔴 Avanzado — más de 5 años' },
]

const HEARD_FROM_OPTIONS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'friends', label: 'Amigos' },
  { value: 'other', label: 'Otro' },
]

// ─── Email Confirm Screen ─────────────────────────────────────────────────────
function EmailConfirmScreen({ email, paymentUrl, onDone }) {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSend = async () => {
    setLoading(true)
    setError('')
    try {
      await api.resendConfirmation(email)
      setSent(true)
    } catch (e) {
      if (e.status === 429) {
        setError('Demasiados intentos. Espera un momento.')
      } else {
        setError('Error al enviar. Inténtalo de nuevo.')
      }
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', background: 'var(--bg)', textAlign: 'center' }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>{sent ? '📬' : '✉️'}</div>
      <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 900, textTransform: 'uppercase', marginBottom: 8 }}>
        {sent ? 'Email enviado' : 'Confirma tu cuenta'}
      </h2>
      <p style={{ fontSize: 15, color: 'var(--text-2)', marginBottom: 8, lineHeight: 1.6, maxWidth: 380 }}>
        {sent
          ? <>Hemos enviado el enlace de confirmación a <strong style={{ color: 'var(--text)' }}>{email}</strong></>
          : <>Tu cuenta está lista. Pulsa el botón para recibir el enlace de confirmación en <strong style={{ color: 'var(--text)' }}>{email}</strong></>
        }
      </p>
      {sent && (
        <p style={{ fontSize: 15, color: 'var(--text-2)', marginBottom: 24, lineHeight: 1.6, maxWidth: 380 }}>
          Haz clic en el enlace para <strong>activar tu cuenta</strong> antes de iniciar sesión.
        </p>
      )}
      {!sent && (
        <p style={{ fontSize: 14, color: 'var(--text-3)', marginBottom: 24, lineHeight: 1.6, maxWidth: 380 }}>
          No te enviaremos nada sin que lo pidas.
        </p>
      )}

      {error && (
        <div style={{ background: 'var(--red-dim)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: 13, color: 'var(--red)', marginBottom: 16, maxWidth: 320, width: '100%' }}>
          {error}
        </div>
      )}

      {!sent ? (
        <button
          className="btn btn-primary btn-lg btn-full"
          style={{ maxWidth: 320, marginBottom: 12 }}
          onClick={handleSend}
          disabled={loading}
        >
          {loading ? <span className="spinner" /> : '📧 Enviar email de confirmación'}
        </button>
      ) : (
        <div style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', borderRadius: 'var(--radius-lg)', padding: '16px 20px', marginBottom: 24, maxWidth: 380, width: '100%' }}>
          <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>
            ⚠️ <strong style={{ color: 'var(--accent)' }}>Importante:</strong> Si no ves el email, revisa tu carpeta de <strong>spam o correo no deseado</strong>.
          </p>
        </div>
      )}

      {paymentUrl && (
        <div style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', borderRadius: 'var(--radius-lg)', padding: '20px', marginBottom: 16, maxWidth: 380, width: '100%' }}>
          <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 900, textTransform: 'uppercase', marginBottom: 6 }}>
            🎉 ¡Tienes un descuento!
          </p>
          <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 14, lineHeight: 1.5 }}>
            Tu código incluye un descuento especial. Activa tu suscripción con precio reducido:
          </p>
          <a
            href={paymentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-full"
            style={{ textDecoration: 'none' }}
          >
            🏍️ Suscribirse con descuento
          </a>
        </div>
      )}

      <button
        className="btn btn-ghost btn-full"
        style={{ maxWidth: 320, marginBottom: 16 }}
        onClick={onDone}
      >
        Ir a iniciar sesión
      </button>

      <p style={{ fontSize: 13, color: 'var(--text-3)', maxWidth: 320 }}>
        ¿Problemas? Escríbenos a{' '}
        <a href="mailto:rutillasmoto@outlook.com" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
          rutillasmoto@outlook.com
        </a>
      </p>
    </div>
  )
}

// ─── Step dots ────────────────────────────────────────────────────────────────
// Step indicator
function StepDots({ current, total }) {
  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 24 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          width: i === current - 1 ? 20 : 6,
          height: 6,
          borderRadius: 3,
          background: i === current - 1 ? 'var(--accent)' : 'var(--border-2)',
          transition: 'all 0.3s ease',
        }} />
      ))}
    </div>
  )
}

export default function AuthPage() {
  const [mode, setMode] = useState('login')
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstall, setShowInstall] = useState(false)
  const [showEmailConfirm, setShowEmailConfirm] = useState(false)
  const [promoPaymentUrl, setPromoPaymentUrl] = useState(null)
  const [captchaToken, setCaptchaToken] = useState(null)
  const navigate = useNavigate()
  const login = useStore((s) => s.login)
  const register = useStore((s) => s.register)
  const toast = useToast()
  const { HoneypotFields, validateHoneypot, resetTimer } = useHoneypot()

  useEffect(() => {
    // Capture PWA install prompt
    const handler = (e) => { e.preventDefault(); setDeferredPrompt(e) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    // Step 2 — moto
    motoType: '',
    motoModel: '',
    location: '',
    experience: '',
    // Step 3 — preferences
    instaHandle: '',
    heardFrom: '',
    promoCode: '',
    latitude: null,
    longitude: null,
    locationDenied: false,
  })

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const validateStep1 = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Nombre requerido'
    if (!form.email.trim()) e.email = 'Email requerido'
    if (!form.password || form.password.length < 6) e.password = 'Mínimo 6 caracteres'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const validateStep2 = () => {
    const e = {}
    if (!form.motoType) e.motoType = 'Selecciona el tipo de moto'
    if (!form.motoModel.trim()) e.motoModel = 'Indica tu moto'
    if (!form.latitude) e.location = 'Activa tu ubicación para continuar'
    if (!form.experience) e.experience = 'Selecciona tu nivel'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const validateStep3 = () => {
    const e = {}
    if (!form.heardFrom) e.heardFrom = 'Selecciona una opción'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.email.trim()) errs.email = 'Email requerido'
    if (!form.password) errs.password = 'Contraseña requerida'
    if (Object.keys(errs).length) { setErrors(errs); return }

    // Rate limit check
    const rateCheck = checkRateLimit('login', RATE_LIMITS.login)
    if (!rateCheck.allowed) {
      setErrors({ general: `Demasiados intentos. Espera ${formatRetryAfter(rateCheck.retryAfterMs)}.` })
      return
    }

    // CAPTCHA check
    if (!captchaToken) {
      setErrors({ general: 'Completa la verificación de seguridad' })
      return
    }

    setLoading(true)
    const result = await login(form.email, form.password, captchaToken)
    setLoading(false)
    if (result.error) {
      setErrors({ general: result.error })
      setCaptchaToken(null) // Reset CAPTCHA on failure
    } else {
      resetRateLimit('login')
      toast('¡Bienvenido de vuelta!', 'success')
      navigate('/')
    }
  }

  const handleNext = (e) => {
    e.preventDefault()
    if (step === 1 && validateStep1()) setStep(2)
    else if (step === 2 && validateStep2()) setStep(3)
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!validateStep3()) return

    // Honeypot check — silent rejection for bots
    if (!validateHoneypot()) {
      // Fake success to not alert the bot
      setShowInstall(true)
      return
    }

    // Rate limit check
    const rateCheck = checkRateLimit('register', RATE_LIMITS.register)
    if (!rateCheck.allowed) {
      setErrors({ general: `Demasiados intentos. Espera ${formatRetryAfter(rateCheck.retryAfterMs)}.` })
      return
    }

    // CAPTCHA check
    if (!captchaToken) {
      setErrors({ general: 'Completa la verificación de seguridad' })
      return
    }

    // Password strength check
    const pwCheck = validatePassword(form.password)
    if (!pwCheck.valid) {
      setErrors({ general: pwCheck.message })
      setStep(1)
      return
    }

    setLoading(true)
    const result = await register({ ...form, captchaToken })
    setLoading(false)
    if (result.error) {
      setErrors({ general: result.error })
      setStep(1)
      setCaptchaToken(null)
    } else {
      resetRateLimit('register')
      // If promo code has a payment URL (discount), show it
      if (result.payment_url) {
        setPromoPaymentUrl(result.payment_url)
      }
      // Always show install screen first, then email confirm
      setShowInstall(true)
    }
  }

  const stepTitles = ['Tu cuenta', 'Tu moto', 'Preferencias']

  // Email confirmation screen shown after registration
  if (showEmailConfirm) {
    return (
      <EmailConfirmScreen
        email={form.email}
        paymentUrl={promoPaymentUrl}
        onDone={() => { setShowEmailConfirm(false); setMode('login'); setStep(1) }}
      />
    )
  }

  // PWA install screen — shown before email confirm screen
  if (showInstall) {
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const goNext = () => { setShowInstall(false); setShowEmailConfirm(true) }

    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', background: 'var(--bg)', textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>📲</div>
        <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 900, textTransform: 'uppercase', marginBottom: 8 }}>
          Instala RUTILLAS
        </h2>
        <p style={{ fontSize: 15, color: 'var(--text-2)', marginBottom: 28, lineHeight: 1.6, maxWidth: 340 }}>
          Añade la app a tu pantalla de inicio para acceder rápido a tus rutas, chat y notificaciones.
        </p>

        {/* Android — native install button */}
        {deferredPrompt && (
          <button
            className="btn btn-primary btn-lg btn-full"
            style={{ maxWidth: 320, marginBottom: 12 }}
            onClick={async () => {
              deferredPrompt.prompt()
              await deferredPrompt.userChoice
              setDeferredPrompt(null)
              goNext()
            }}
          >
            📲 Instalar en mi móvil
          </button>
        )}

        {/* iPhone — step by step instructions */}
        {(isIOS || !deferredPrompt) && (
          <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px', maxWidth: 340, width: '100%', marginBottom: 16, textAlign: 'left' }}>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 14 }}>
              {isIOS ? '📱 iPhone / iPad' : '📱 Cómo instalar'}
            </p>
            {[
              { n: '1', text: 'Abre esta página en Safari' },
              { n: '2', text: 'Toca el botón Compartir  ⎙  (abajo en iPhone, arriba en iPad)' },
              { n: '3', text: 'Desplázate y toca "Añadir a pantalla de inicio"' },
              { n: '4', text: 'Toca "Añadir" para confirmar' },
            ].map((s) => (
              <div key={s.n} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 13, flexShrink: 0 }}>
                  {s.n}
                </div>
                <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.5, paddingTop: 3 }}>{s.text}</p>
              </div>
            ))}
          </div>
        )}

        <button
          className="btn btn-ghost btn-full"
          style={{ maxWidth: 320 }}
          onClick={goNext}
        >
          Continuar sin instalar →
        </button>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 20px',
      background: 'var(--bg)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute', top: '-20%', left: '50%',
        transform: 'translateX(-50%)', width: '120%', height: '50%',
        background: 'radial-gradient(ellipse, rgba(232,50,10,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Logo — centered */}
      <div style={{ marginBottom: 24, position: 'relative', zIndex: 1 }}>
        <BlakerLogo size={44} showTagline center />
      </div>

      {/* Card */}
      <div style={{
        width: '100%',
        maxWidth: 400,
        background: 'var(--bg-2)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        padding: '28px 24px',
        boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
        position: 'relative',
        zIndex: 1,
      }}>

        {/* Mode tabs */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-3)',
          borderRadius: 100,
          padding: 3,
          marginBottom: 24,
        }}>
          {[['login', 'Entrar'], ['register', 'Registrarse']].map(([m, label]) => (
            <button
              key={m}
              onClick={() => { setMode(m); setStep(1); setErrors({}); setCaptchaToken(null); resetTimer() }}
              style={{
                flex: 1,
                padding: '9px',
                borderRadius: 100,
                border: 'none',
                background: mode === m ? 'var(--bg-2)' : 'transparent',
                color: mode === m ? 'var(--text)' : 'var(--text-3)',
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: mode === m ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── LOGIN ── */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="stack">
            {errors.general && (
              <div style={{ background: 'var(--red-dim)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: 13, color: 'var(--red)' }}>
                {errors.general}
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" placeholder="tu@email.com"
                value={form.email} onChange={(e) => set('email', e.target.value)} autoComplete="email" />
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <input className="form-input" type="password" placeholder="••••••"
                value={form.password} onChange={(e) => set('password', e.target.value)} autoComplete="current-password" />
              {errors.password && <span className="form-error">{errors.password}</span>}
            </div>
            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Entrar'}
            </button>
            <Turnstile onVerify={setCaptchaToken} onExpire={() => setCaptchaToken(null)} />
            <button type="button" className="btn btn-ghost btn-full btn-sm" onClick={() => navigate('/auth/forgot')} style={{ marginTop: -4 }}>
              ¿Olvidaste tu contraseña?
            </button>

          </form>
        )}

        {/* ── REGISTER ── */}
        {mode === 'register' && (
          <>
            {/* Step header */}
            <div style={{ marginBottom: 20 }}>
              <StepDots current={step} total={3} />
              <p style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 18,
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--text)',
                textAlign: 'center',
              }}>
                {stepTitles[step - 1]}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', marginTop: 2 }}>
                Paso {step} de 3
              </p>
            </div>

            {errors.general && (
              <div style={{ background: 'var(--red-dim)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: 13, color: 'var(--red)', marginBottom: 16 }}>
                {errors.general}
              </div>
            )}

            {/* Step 1 — Account */}
            {step === 1 && (
              <form onSubmit={handleNext} className="stack">
                <HoneypotFields />
                <div className="form-group">
                  <label className="form-label">Nombre completo</label>
                  <input className="form-input" type="text" placeholder="Tu nombre"
                    value={form.name} onChange={(e) => set('name', e.target.value)} autoComplete="name" />
                  {errors.name && <span className="form-error">{errors.name}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" placeholder="tu@email.com"
                    value={form.email} onChange={(e) => set('email', e.target.value)} autoComplete="email" />
                  {errors.email && <span className="form-error">{errors.email}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Contraseña</label>
                  <input className="form-input" type="password" placeholder="Mínimo 6 caracteres"
                    value={form.password} onChange={(e) => set('password', e.target.value)} autoComplete="new-password" />
                  {errors.password && <span className="form-error">{errors.password}</span>}
                </div>
                <button type="submit" className="btn btn-primary btn-full btn-lg">
                  Siguiente →
                </button>
              </form>
            )}

            {/* Step 2 — Moto */}
            {step === 2 && (
              <form onSubmit={handleNext} className="stack">
                <div className="form-group">
                  <label className="form-label">Tipo de moto</label>
                  <select className="form-select" value={form.motoType} onChange={(e) => set('motoType', e.target.value)}>
                    <option value="">Selecciona el tipo...</option>
                    {MOTO_TYPE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  {errors.motoType && <span className="form-error">{errors.motoType}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Marca y modelo</label>
                  <input className="form-input" type="text" placeholder="Ej: Yamaha MT-07, Honda CB500F..."
                    value={form.motoModel} onChange={(e) => set('motoModel', e.target.value)} />
                  {errors.motoModel && <span className="form-error">{errors.motoModel}</span>}
                </div>
                {/* Mandatory GPS location */}
                <div className="form-group">
                  <label className="form-label">Tu ubicación <span style={{ color: 'var(--red)', fontWeight: 700 }}>*</span></label>
                  {form.latitude ? (
                    <div style={{ background: 'var(--green-dim)', border: '1px solid rgba(22,163,74,0.25)', borderRadius: 'var(--radius)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 20 }}>✅</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)' }}>Ubicación detectada</p>
                        <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{form.location || 'Coordenadas guardadas'}</p>
                      </div>
                    </div>
                  ) : form.locationDenied ? (
                    <div style={{ background: 'var(--bg-3)', border: '1px solid var(--border-2)', borderRadius: 'var(--radius)', padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 16 }}>⚠️</span>
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--red)' }}>Ubicación requerida</p>
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5, marginBottom: 8 }}>
                        Necesitamos tu ubicación para mostrarte rutas y eventos cerca de ti. Activa el permiso en tu navegador:
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>
                        <strong>iPhone:</strong> Ajustes → Safari → Ubicación → Permitir<br />
                        <strong>Android:</strong> Ajustes del navegador → Permisos → Ubicación
                      </p>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm btn-full"
                        style={{ marginTop: 12 }}
                        onClick={async () => {
                          try {
                            const pos = await new Promise((res, rej) =>
                              navigator.geolocation.getCurrentPosition(res, rej, { timeout: 10000, enableHighAccuracy: true })
                            )
                            set('latitude', pos.coords.latitude)
                            set('longitude', pos.coords.longitude)
                            set('locationDenied', false)
                            // Reverse geocode to get city name
                            try {
                              const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&accept-language=es`)
                              const geo = await resp.json()
                              const city = geo.address?.city || geo.address?.town || geo.address?.village || geo.address?.municipality || ''
                              if (city) set('location', city)
                            } catch {}
                          } catch {
                            set('locationDenied', true)
                          }
                        }}
                      >
                        🔄 Reintentar
                      </button>
                    </div>
                  ) : (
                    <div style={{ background: 'var(--bg-3)', borderRadius: 'var(--radius)', padding: '14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 20 }}>📍</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Activa tu ubicación</p>
                        <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>Obligatorio para ver rutas en tu zona</p>
                      </div>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={async () => {
                          try {
                            const pos = await new Promise((res, rej) =>
                              navigator.geolocation.getCurrentPosition(res, rej, { timeout: 10000, enableHighAccuracy: true })
                            )
                            set('latitude', pos.coords.latitude)
                            set('longitude', pos.coords.longitude)
                            set('locationDenied', false)
                            // Reverse geocode to get city name
                            try {
                              const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&accept-language=es`)
                              const geo = await resp.json()
                              const city = geo.address?.city || geo.address?.town || geo.address?.village || geo.address?.municipality || ''
                              if (city) set('location', city)
                            } catch {}
                          } catch {
                            set('locationDenied', true)
                          }
                        }}
                      >
                        Activar
                      </button>
                    </div>
                  )}
                  {errors.location && <span className="form-error">{errors.location}</span>}
                  <span className="form-hint">Usamos GPS para mostrarte eventos cerca de ti.</span>
                </div>
                <div className="form-group">
                  <label className="form-label">Nivel de experiencia</label>
                  <select className="form-select" value={form.experience} onChange={(e) => set('experience', e.target.value)}>
                    <option value="">Selecciona tu nivel...</option>
                    {EXPERIENCE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  {errors.experience && <span className="form-error">{errors.experience}</span>}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>← Atrás</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Siguiente →</button>
                </div>
              </form>
            )}

            {/* Step 3 — Preferences */}
            {step === 3 && (
              <form onSubmit={handleRegister} className="stack">
                {/* Instagram */}
                <div className="form-group">
                  <label className="form-label">Instagram <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(opcional)</span></label>
                  <input className="form-input" type="text" placeholder="@tuusuario"
                    value={form.instaHandle} onChange={(e) => set('instaHandle', e.target.value)} />
                </div>

                {/* Promo code */}
                <div className="form-group">
                  <label className="form-label">Código promocional <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(opcional)</span></label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="Ej: RUTILLAS100"
                    value={form.promoCode || ''}
                    onChange={(e) => set('promoCode', e.target.value.toUpperCase())}
                    style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}
                  />
                  <span className="form-hint">Acceso gratuito con código válido</span>
                </div>

                {/* Instagram follow CTA */}
                <div style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', borderRadius: 'var(--radius-lg)', padding: '14px 16px', textAlign: 'center' }}>
                  <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 10, lineHeight: 1.5 }}>
                    📸 Síguenos en Instagram para obtener el código de acceso gratuito
                  </p>
                  <a
                    href="https://www.instagram.com/rutillas.app?igsh=OGJnamJnOW83dzRy&utm_source=qr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-sm"
                    style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    📲 Seguir @rutillas.app
                  </a>
                </div>

                <div className="form-group">
                  <label className="form-label">¿Cómo nos conociste?</label>
                  <select className="form-select" value={form.heardFrom} onChange={(e) => set('heardFrom', e.target.value)}>
                    <option value="">Selecciona...</option>
                    {HEARD_FROM_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  {errors.heardFrom && <span className="form-error">{errors.heardFrom}</span>}
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setStep(2)}>← Atrás</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                    {loading ? <span className="spinner" /> : 'Crear cuenta 🏍️'}
                  </button>
                </div>
                <Turnstile onVerify={setCaptchaToken} onExpire={() => setCaptchaToken(null)} />
              </form>
            )}
          </>
        )}
      </div>
    </div>
  )
}
