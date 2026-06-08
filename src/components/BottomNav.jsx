import { NavLink } from 'react-router-dom'
import { IconCalendar, IconBell, IconUser, IconUsers, IconShield } from './Icons'
import useStore from '../store/useStore'
import { useT } from '../i18n/useT'

const IconMail = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
)

export default function BottomNav() {
  const currentUser = useStore((s) => s.currentUser)
  const notifications = useStore((s) => s.notifications)
  const unread = currentUser ? notifications.filter((n) => !n.read).length : 0
  const t = useT()

  return (
    <nav className="bottom-nav" role="navigation" aria-label="Main navigation">
      <div className="nav-items">

        <NavLink to="/events" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          {({ isActive }) => (
            <>
              {isActive && <span className="nav-active-dot" />}
              <IconCalendar />
              {t('nav.routes')}
            </>
          )}
        </NavLink>

        <NavLink to="/users" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          {({ isActive }) => (
            <>
              {isActive && <span className="nav-active-dot" />}
              <IconUsers />
              {t('nav.riders')}
            </>
          )}
        </NavLink>

        <NavLink to="/notifications" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          {({ isActive }) => (
            <>
              {isActive && <span className="nav-active-dot" />}
              <IconBell />
              {unread > 0 && (
                <span className="nav-badge" aria-label={`${unread} notificaciones`}>
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
              {t('nav.notifications')}
            </>
          )}
        </NavLink>

        <NavLink to="/profile" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          {({ isActive }) => (
            <>
              {isActive && <span className="nav-active-dot" />}
              <IconUser />
              {t('nav.profile')}
            </>
          )}
        </NavLink>

        {currentUser?.is_staff && (
          <NavLink to="/admin" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            {({ isActive }) => (
              <>
                {isActive && <span className="nav-active-dot" />}
                <IconShield />
                {t('nav.admin')}
              </>
            )}
          </NavLink>
        )}

        <NavLink to="/home" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} end>
          {({ isActive }) => (
            <>
              {isActive && <span className="nav-active-dot" />}
              <IconMail />
              {t('nav.contact')}
            </>
          )}
        </NavLink>

      </div>
    </nav>
  )
}
