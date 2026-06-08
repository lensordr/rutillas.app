import { useEffect, useState, useRef } from 'react'
import useStore from '../store/useStore'
import { IconUsers } from '../components/Icons'
import UserCard from '../components/UserCard'
import { useT } from '../i18n/useT'

export default function UserListPage() {
  const users = useStore((s) => s.users)
  const usersLoading = useStore((s) => s.usersLoading)
  const [citySearch, setCitySearch] = useState('')
  const [showCityFilter, setShowCityFilter] = useState(false)
  const debounceRef = useRef(null)
  const t = useT()

  // Fetch on mount
  useEffect(() => {
    useStore.getState().fetchUsers()
  }, [])

  // Debounced city search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      useStore.getState().fetchUsers(citySearch || null)
    }, 300)
    return () => clearTimeout(debounceRef.current)
  }, [citySearch])

  return (
    <div style={{ flex: 1, paddingBottom: 'calc(var(--nav-height) + var(--safe-bottom))' }}>
      {/* Sticky header */}
      <div style={{
        padding: '12px 16px 0',
        position: 'sticky',
        top: 0,
        background: 'rgba(245,245,245,0.95)',
        backdropFilter: 'blur(20px)',
        zIndex: 10,
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconUsers size={20} />
            <h1 style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 24,
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}>
              {t('users.title')}
            </h1>
            {citySearch && (
              <span style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--accent)',
                background: 'var(--accent-dim)',
                borderRadius: 100,
                padding: '2px 10px',
              }}>
                📍 {citySearch} <span style={{ cursor: 'pointer' }} onClick={() => setCitySearch('')}>×</span>
              </span>
            )}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowCityFilter(true)}>
            🗺️ {t('users.city')}
          </button>
        </div>
        <div style={{ paddingBottom: 10 }} />
      </div>

      {/* Content */}
      <div style={{ padding: 16, maxWidth: 720, margin: '0 auto' }}>
        {usersLoading && users.length === 0 && (
          <div className="empty-state"><span className="spinner" /></div>
        )}

        {!usersLoading && users.length === 0 && (
          <div className="empty-state">
            <IconUsers size={48} />
            <p className="empty-state-title">{t('users.empty')}</p>
            {citySearch && (
              <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>
                {t('users.emptyCity')}
              </p>
            )}
          </div>
        )}

        {users.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 12,
          }}>
            {users.map((user) => (
              <UserCard key={user.id} user={user} />
            ))}
          </div>
        )}
      </div>

      {/* City filter modal */}
      {showCityFilter && (
        <div className="modal-overlay" onClick={() => setShowCityFilter(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
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
                <button
                  onClick={() => setCitySearch('')}
                  style={{
                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 18,
                  }}
                >
                  ×
                </button>
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
