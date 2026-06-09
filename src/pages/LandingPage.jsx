import { useNavigate } from 'react-router-dom'
import BlakerLogo from '../components/BlakerLogo'
import { useT } from '../i18n/useT'

export default function LandingPage() {
  const navigate = useNavigate()
  const t = useT()

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', position: 'relative', overflow: 'hidden' }}>

      {/* Background glow */}
      <div style={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: '140%', height: '60%', background: 'radial-gradient(ellipse, rgba(232,50,10,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', position: 'relative', zIndex: 2 }}>
        <BlakerLogo size={28} />
        <button
          className="btn btn-primary btn-sm"
          onClick={() => navigate('/auth')}
        >
          {t('landing.login')}
        </button>
      </header>

      {/* Hero */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center', position: 'relative', zIndex: 1 }}>

        <BlakerLogo size={52} showTagline center />

        <h1 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 'clamp(32px, 8vw, 56px)',
          fontWeight: 900,
          fontStyle: 'italic',
          textTransform: 'uppercase',
          letterSpacing: '-0.01em',
          lineHeight: 1.05,
          marginTop: 32,
          maxWidth: 500,
        }}>
          {t('landing.heroTitle')}<br />
          <span style={{ color: 'var(--accent)' }}>{t('landing.heroHighlight')}</span>
        </h1>

        <p style={{ fontSize: 16, color: 'var(--text-2)', lineHeight: 1.6, marginTop: 16, maxWidth: 400 }}>
          {t('landing.heroDesc')}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 32, width: '100%', maxWidth: 320 }}>
          <button
            className="btn btn-primary btn-lg btn-full"
            onClick={() => navigate('/auth')}
          >
            🏍️ {t('landing.joinFree')}
          </button>
          <button
            className="btn btn-ghost btn-full"
            onClick={() => navigate('/auth')}
          >
            {t('landing.haveAccount')}
          </button>
        </div>

        {/* Features */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginTop: 48, width: '100%', maxWidth: 400 }}>
          {[
            { icon: '🏍️', title: t('landing.feature1Title'), desc: t('landing.feature1Desc') },
            { icon: '💬', title: t('landing.feature2Title'), desc: t('landing.feature2Desc') },
            { icon: '📍', title: t('landing.feature3Title'), desc: t('landing.feature3Desc') },
            { icon: '📸', title: t('landing.feature4Title'), desc: t('landing.feature4Desc') },
          ].map((f) => (
            <div key={f.title} style={{
              background: 'var(--bg-2)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px 16px',
              textAlign: 'left',
              boxShadow: 'var(--shadow-sm)',
            }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{f.icon}</div>
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15, fontWeight: 900, textTransform: 'uppercase', marginBottom: 4 }}>
                {f.title}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.4 }}>{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Social proof */}
        <div style={{ marginTop: 48, padding: '24px 20px', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: 400, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ height: 4, background: 'linear-gradient(90deg, var(--accent), var(--accent-2))', borderRadius: 2, marginBottom: 16 }} />
          <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 900, textTransform: 'uppercase', marginBottom: 8 }}>
            {t('landing.communityTitle')}
          </p>
          <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6 }}>
            {t('landing.communityDesc')}
          </p>
          <div style={{ display: 'flex', gap: 16, marginTop: 16, justifyContent: 'center' }}>
            {[
              { value: '🏍️', label: t('landing.stat1') },
              { value: '📍', label: t('landing.stat2') },
              { value: '👥', label: t('landing.stat3') },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 24 }}>{s.value}</p>
                <p style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 4 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing teaser */}
        <div style={{ marginTop: 32, textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 8 }}>{t('landing.pricingFrom')}</p>
          <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 36, fontWeight: 900, color: 'var(--accent)' }}>
            {t('routes.create.price')}<span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-2)' }}>{t('routes.create.priceUnit')}</span>
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>{t('landing.pricingHint')}</p>
        </div>

        {/* Final CTA */}
        <div style={{ marginTop: 40, width: '100%', maxWidth: 320 }}>
          <button
            className="btn btn-primary btn-lg btn-full"
            onClick={() => navigate('/auth')}
          >
            {t('landing.startNow')}
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ padding: '24px 20px', textAlign: 'center', borderTop: '1px solid var(--border)', position: 'relative', zIndex: 1 }}>
        <p style={{ fontSize: 12, color: 'var(--text-3)' }}>
          {t('landing.footer')}
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
          <a href="mailto:rutillasmoto@outlook.com" style={{ color: 'var(--accent)', textDecoration: 'none' }}>rutillasmoto@outlook.com</a>
        </p>
      </footer>
    </div>
  )
}
