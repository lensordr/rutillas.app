import useStore from '../store/useStore'
import { IconMapPin, IconUsers } from './Icons'

const EXPERIENCE_LABELS = {
  beginner: '🟢 Principiante',
  medio: '🟡 Medio',
  advanced: '🔴 Avanzado',
}

const MOTO_TYPE_LABELS = {
  naked: 'Naked',
  sport: 'Sport / Supersport',
  adventure: 'Adventure / Trail',
  touring: 'Touring',
  scrambler: 'Scrambler / Café Racer',
  custom: 'Custom / Cruiser',
  enduro: 'Enduro / Off-road',
  other: 'Otra',
}

export default function UserCard({ user }) {
  const currentUser = useStore((s) => s.currentUser)
  const followUser = useStore((s) => s.followUser)
  const unfollowUser = useStore((s) => s.unfollowUser)

  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Rider'
  const motoLabel = MOTO_TYPE_LABELS[user.moto_type] || user.moto_type
  const experienceLabel = EXPERIENCE_LABELS[user.experience]
  const isSelf = currentUser?.id === user.id

  const handleFollow = async (e) => {
    e.stopPropagation()
    if (user.is_followed) {
      await unfollowUser(user.id)
    } else {
      await followUser(user.id)
    }
  }

  return (
    <div style={{
      background: 'var(--bg-2)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: 16,
      boxShadow: 'var(--shadow-sm)',
    }}>
      {/* Name + moto */}
      <div style={{ marginBottom: 10 }}>
        <h3 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 18,
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: '0.02em',
          color: 'var(--text)',
          margin: 0,
        }}>
          {fullName}
        </h3>
        {user.moto_model && (
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>
            🏍️ {user.moto_model}{motoLabel ? ` · ${motoLabel}` : ''}
          </p>
        )}
      </div>

      {/* Experience badge */}
      {experienceLabel && (
        <span style={{
          display: 'inline-block',
          fontSize: 11,
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          background: 'var(--bg-3)',
          border: '1px solid var(--border)',
          borderRadius: 100,
          padding: '3px 10px',
          marginBottom: 10,
        }}>
          {experienceLabel}
        </span>
      )}

      {/* Location */}
      {user.location && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--text-2)', marginBottom: 6 }}>
          <IconMapPin size={12} />
          <span>{user.location}</span>
        </div>
      )}

      {/* Instagram */}
      {user.insta_handle && (
        <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 10 }}>
          <a
            href={`https://instagram.com/${user.insta_handle.replace('@', '')}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--accent)', textDecoration: 'none' }}
            onClick={(e) => e.stopPropagation()}
          >
            📸 @{user.insta_handle.replace('@', '')}
          </a>
        </div>
      )}

      {/* Footer: counts + follow button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-3)' }}>
          <span><strong style={{ color: 'var(--text)' }}>{user.followers_count || 0}</strong> seguidores</span>
          <span><strong style={{ color: 'var(--text)' }}>{user.following_count || 0}</strong> siguiendo</span>
        </div>
        {!isSelf && (
          <button
            onClick={handleFollow}
            className={user.is_followed ? 'btn btn-ghost btn-sm' : 'btn btn-primary btn-sm'}
            style={{ fontSize: 11, padding: '5px 12px' }}
          >
            {user.is_followed ? 'Siguiendo' : 'Seguir'}
          </button>
        )}
      </div>
    </div>
  )
}
