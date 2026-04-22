import { useParams } from 'react-router-dom'
import { useProfile } from '../hooks/useProfile'
import { useAuth } from '../context/AuthContext'
import { LoadingSpinner, ErrorState, EmptyState } from '../components/States'
import SEO from '../components/SEO'
import StreakBadge from '../components/StreakBadge'

export default function Profile () {
  const { id } = useParams()

  // Sanitize malformed UUIDs (e.g. if spaces were pasted into the URL instead of hyphens)
  const sanitizedId = id ? id.replace(/\s+/g, '-') : null

  const { profile, badges, loading, error } = useProfile(sanitizedId)
  const { user: currentUser } = useAuth()

  if (loading) return <LoadingSpinner text='Loading user profile...' />
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />
  if (!profile) return <EmptyState icon='🔍' title='User not found' message='This profile does not exist or has been deleted.' />

  const isOwnProfile = currentUser?.id === id

  const stats = [
    { label: 'Total XP', value: profile.xp.toLocaleString(), icon: '⭐' },
    { label: 'Level', value: profile.level, icon: '📈' },
    { label: 'Daily Streak', value: `${profile.streak_days} Days`, icon: '🔥' }
  ]

  return (
    <>
      <SEO 
        title={`${profile.name}'s Profile`} 
        description={`View ${profile.name}'s level, XP, and badges on RGPV Study Hub.`}
        urlPath={`/profile/${sanitizedId}`}
      /><div className='page-hero' style={{ paddingBottom: '2rem' }}>
        <div style={{
          width: '100px',
          height: '100px',
          borderRadius: '30px',
          background: 'var(--bg-card)',
          border: '2px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2.5rem',
          margin: '0 auto 1.5rem',
          boxShadow: 'var(--shadow-md)'
        }}
        >
          {((profile.name) || (profile.email) || 'U').charAt(0).toUpperCase()}
        </div>
        <h1 className='page-hero-title'>{profile.name || profile.email.split('@')[0]}</h1>
        <p className='page-hero-sub'>Member since {new Date(profile.created_at).toLocaleDateString()}</p>
        {isOwnProfile && <span style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--accent-blue)', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, marginTop: '1rem', display: 'inline-block' }}>It's You!</span>}
      </div>

      <section style={{ maxWidth: 1000, margin: '0 auto 6rem', padding: '0 1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>

          {/* Stats Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '24px',
              padding: '2rem',
              backdropFilter: 'blur(10px)'
            }}
            >
              <h3 style={{ fontFamily: 'Syne, sans-serif', marginBottom: '1.5rem', fontWeight: 700 }}>📊 Statistics</h3>
              <div style={{ display: 'grid', gap: '1.25rem' }}>
                {stats.map((stat) => (
                  <div key={stat.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)' }}>
                      <span style={{ fontSize: '1.25rem' }}>{stat.icon}</span>
                      <span>{stat.label}</span>
                    </div>
                    <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{stat.value}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '2.5rem' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Level {profile.level} Progress</span>
                  <span>{profile.xp % 100}%</span>
                </p>
                <div style={{ height: '12px', background: 'var(--bg-primary)', borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{ width: `${profile.xp % 100}%`, height: '100%', background: 'var(--gradient-notes)', borderRadius: '10px' }} />
                </div>
              </div>
            </div>

            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '24px',
              padding: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)'
            }}
            >
              <StreakBadge streak={profile.streak_days} />
            </div>
          </div>

          {/* Badges Column */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '24px',
            padding: '2rem',
            backdropFilter: 'blur(10px)'
          }}
          >
            <h3 style={{ fontFamily: 'Syne, sans-serif', marginBottom: '1.5rem', fontWeight: 700 }}>🏆 Badge Collection</h3>
            {badges.length === 0
              ? (
                <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🥈</div>
                  <p>No special badges yet. Keep learning to earn them!</p>
                </div>
                )
              : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '1rem' }}>
                  {badges.map((badge) => (
                    <div
                      key={badge.badge_name} style={{
                        padding: '1.25rem',
                        borderRadius: '20px',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border)',
                        textAlign: 'center',
                        transition: 'transform 0.2s ease'
                      }} className='badge-item'
                    >
                      <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🏅</div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', lineHeight: 1.2 }}>{badge.badge_name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>{new Date(badge.awarded_at).toLocaleDateString()}</div>
                    </div>
                  ))}
                </div>
                )}
          </div>

        </div>
      </section>
    </>
  )
}
