import { useState, useEffect } from 'react'
import { api } from '../api'
import useStore from '../store/useStore'
import { IconMapPin } from './Icons'
import { useT } from '../i18n/useT'

export default function InviteUsersModal({ routeId, onClose }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [invitedMap, setInvitedMap] = useState({}) // { userId: 'success' | 'error' | 'loading' }
  const [errorMap, setErrorMap] = useState({})     // { userId: errorMessage }

  const currentUser = useStore((s) => s.currentUser)
  const t = useT()

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async (city) => {
    setLoading(true)
    try {
      const data = await api.getUsers(city)
      const list = data.results || data
      // Exclude current user
      setUsers(list.filter((u) => u.id !== currentUser?.id))
    } catch (e) {
      setUsers([])
    }
    setLoading(false)
  }

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers(search || undefined)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const handleInvite = async (userId) => {
    setInvitedMap((m) => ({ ...m, [userId]: 'loading' }))
    setErrorMap((m) => ({ ...m, [userId]: null }))

    const result = await useStore.getState().inviteToRoute(routeId, userId)

    if (result?.ok) {
      setInvitedMap((m) => ({ ...m, [userId]: 'success' }))
    } else {
      setInvitedMap((m) => ({ ...m, [userId]: 'error' }))
      setErrorMap((m) => ({ ...m, [userId]: result?.error || 'Error al invitar' }))
    }
  }

  const fullName = (user) => [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Rider'

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-handle" />
        <h2 className="modal-title">{t('routes.detail.inviteUsers')}</h2>

        {/* Search input */}
        <div style={{ padding: '0 0 12px' }}>
          <input
            className="form-input"
            type="text"
            placeholder={t('routes.cityFilter.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        {/* User list */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
              <span className="spinner" />
            </div>
          )}

          {!loading && users.length === 0 && (
            <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-3)', padding: 24 }}>
              {t('users.empty')}
            </p>
          )}

          {!loading && users.map((user) => {
            const status = invitedMap[user.id]
            const error = errorMap[user.id]

            return (
              <div key={user.id} style={{
                background: 'var(--bg-2)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}>
                {/* User info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: 16,
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em',
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {fullName(user)}
                  </p>
                  {user.moto_model && (
                    <p style={{ fontSize: 12, color: 'var(--text-2)', margin: '2px 0 0' }}>
                      🏍️ {user.moto_model}
                    </p>
                  )}
                  {user.location && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                      <IconMapPin size={11} />
                      <span>{user.location}</span>
                    </div>
                  )}
                </div>

                {/* Invite button */}
                <div style={{ flexShrink: 0 }}>
                  {status === 'success' ? (
                    <span style={{ fontSize: 12, color: 'var(--success, #22c55e)', fontWeight: 700 }}>
                      Invitado ✓
                    </span>
                  ) : status === 'loading' ? (
                    <span className="spinner" style={{ width: 18, height: 18 }} />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: 11, padding: '5px 12px' }}
                        onClick={() => handleInvite(user.id)}
                      >
                        Invitar
                      </button>
                      {status === 'error' && error && (
                        <span style={{ fontSize: 10, color: 'var(--danger, #ef4444)' }}>{error}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Close button */}
        <div style={{ paddingTop: 12 }}>
          <button className="btn btn-ghost btn-full" onClick={onClose}>{t('common.close')}</button>
        </div>
      </div>
    </div>
  )
}
