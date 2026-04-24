import { useParams } from 'react-router-dom'
import { useProfile } from '../hooks/useProfile'
import { useAuth } from '../context/AuthContext'
import { LoadingSpinner, ErrorState, EmptyState } from '../components/States'
import SEO from '../components/SEO'

export default function Profile () {
  const { id } = useParams()

  // Sanitize malformed UUIDs (e.g., spaces instead of hyphens)
  const sanitizedId = id ? id.replace(/\s+/g, '-') : null

  const { profile, loading, error } = useProfile(sanitizedId)
  const { user: currentUser } = useAuth()

  if (loading) return <LoadingSpinner text='Loading user profile...' />
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />
  if (!profile) return <EmptyState icon='🔍' title='User not found' message='This profile does not exist or has been deleted.' />

  // Use sanitizedId for ownership comparison to ensure consistency
  const isOwnProfile = currentUser?.id === sanitizedId

  return (
    <>
      <SEO
        title={`${profile.name}'s Profile`}
        description={`View ${profile.name}'s profile on PROJECTX.`}
        urlPath={`/profile/${sanitizedId}`}
      />
      <div className='page-hero' style={{ paddingBottom: '2rem' }}>
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
        }}>
          {(profile.name || profile.email || 'U').charAt(0).toUpperCase()}
        </div>
        <h1 className='page-hero-title'>{profile.name || profile.email.split('@')[0]}</h1>
        <p className='page-hero-sub'>Member since {new Date(profile.created_at).toLocaleDateString()}</p>
        {isOwnProfile && (
          <span style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--accent-blue)', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, marginTop: '1rem', display: 'inline-block' }}>It's You!</span>
        )}
      </div>

      <section style={{ maxWidth: 600, margin: '0 auto 6rem', padding: '0 1.5rem' }}>
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '24px',
          padding: '2rem',
          backdropFilter: 'blur(10px)',
          textAlign: 'center'
        }}>
          <h3 style={{ fontFamily: 'Syne, sans-serif', marginBottom: '1rem', fontWeight: 700 }}>About Student</h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            This student is part of the ProjectX academic community.
          </p>
        </div>
      </section>
    </>
  )
}
