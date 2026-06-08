import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import useStore from '../store/useStore'
import { IconBell, IconCheck, IconTrash } from '../components/Icons'
import { useT } from '../i18n/useT'

function NotifIcon({ type }) {
  const icons = { join_request: '🏍️', approved: '✅', rejected: '❌', new_message: '💬' }
  return <span style={{ fontSize: 20 }}>{icons[type] || '🔔'}</span>
}

export default function NotificationsPage() {
  const navigate = useNavigate()
  const notifications = useStore((s) => s.notifications)
  const t = useT()

  const hasUnread = notifications.some((n) => !n.read)

  useEffect(() => {
    useStore.getState().fetchNotifications()
    const interval = setInterval(() => useStore.getState().fetchNotifications(), 15000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => useStore.getState().markAllNotificationsRead(), 1500)
    return () => clearTimeout(timer)
  }, [])

  const handleClick = (notif) => {
    useStore.getState().markNotificationRead(notif.id)
    if (notif.route_id) navigate(`/events/${notif.route_id}`)
  }

  return (
    <div style={{ flex: 1, paddingBottom: 'calc(var(--nav-height) + var(--safe-bottom))' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <IconBell size={22} />
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 26, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {t('notifications.title')}
          </h1>
        </div>
        {hasUnread && (
          <button className="btn btn-ghost btn-sm" onClick={() => useStore.getState().markAllNotificationsRead()}>
            <IconCheck size={14} /> {t('notifications.markAllRead')}
          </button>
        )}
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        {notifications.length === 0 ? (
          <div className="empty-state">
            <IconBell size={48} />
            <p className="empty-state-title">{t('notifications.empty')}</p>
            <p style={{ fontSize: 13, color: 'var(--text-3)' }}>{t('notifications.emptyHint')}</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div key={notif.id} onClick={() => handleClick(notif)} style={{
              display: 'flex', gap: 12, padding: '14px 16px',
              borderBottom: '1px solid var(--border)',
              cursor: notif.route_id ? 'pointer' : 'default',
              background: notif.read ? 'transparent' : 'rgba(232,50,10,0.04)',
              transition: 'background 0.15s',
            }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <NotifIcon type={notif.type} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, lineHeight: 1.4, color: notif.read ? 'var(--text-2)' : 'var(--text)' }}>
                  {notif.message}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>
                  {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: es })}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                {!notif.read && (
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} />
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); useStore.getState().deleteNotification(notif.id) }}
                  style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: 'var(--text-3)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: notif.read ? 0.7 : 0.4, transition: 'opacity 0.15s, color 0.15s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = 'var(--accent)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = notif.read ? '0.7' : '0.4'; e.currentTarget.style.color = 'var(--text-3)' }}
                  title={t('notifications.delete')}
                  aria-label={t('notifications.delete')}
                >
                  <IconTrash size={15} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
