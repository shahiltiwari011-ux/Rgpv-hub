import { useAuth } from '../context/AuthContext'
import { LoadingSpinner, EmptyState } from '../components/States'
import SEO from '../components/SEO'

export default function Dashboard () {
  const { user, loading: authLoading } = useAuth()

  if (authLoading) return <LoadingSpinner text='Checking authentication…' />

  return (
    <>
      <SEO title="Dashboard" description="Manage your bookmarks and view your study progress." urlPath="/dashboard" noIndex />
      <div className='page-hero'>
        <span className='page-hero-icon'>{user ? '📊' : '🔐'}</span>
        <h1 className='page-hero-title'>Dashboard</h1>
        <p className='page-hero-sub'>{user ? `Welcome back, ${user.email}` : 'Access your saved resources'}</p>
      </div>

      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 var(--container-px) 4rem' }}>
        {user ? (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: 'clamp(2rem, 8vw, 4rem) clamp(1rem, 5vw, 2rem)',
            textAlign: 'center',
            backdropFilter: 'blur(16px)',
            boxShadow: 'var(--shadow-xl)',
            marginTop: '2rem'
          }}>
            <div style={{
              fontSize: 'clamp(3rem, 10vw, 4rem)',
              marginBottom: '1.5rem',
              animation: 'bounce 2s infinite'
            }}>🚀</div>
            <h2 style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: 'clamp(1.75rem, 6vw, 2.5rem)',
              fontWeight: 800,
              marginBottom: '1rem',
              background: 'linear-gradient(135deg, #fff, rgba(255,255,255,0.7))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>Welcome to ProjectX!</h2>
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: 'clamp(0.95rem, 3vw, 1.1rem)',
              maxWidth: '600px',
              margin: '0 auto',
              lineHeight: 1.6
            }}>
              Your elite academic command center is being prepared. Soon you'll be able to track your grades, set study goals, and manage your academic library with real-time analytics.
            </p>
            <div style={{
              marginTop: '3rem',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '1rem'
            }}>
              <div className="status-pill" style={{
                background: 'rgba(99, 120, 255, 0.1)',
                padding: '0.5rem 1rem',
                borderRadius: 99,
                fontSize: '0.8rem',
                border: '1px solid rgba(99, 120, 255, 0.2)',
                color: 'var(--accent-blue)'
              }}>Account Active</div>
              <div className="status-pill" style={{
                background: 'rgba(34, 197, 94, 0.1)',
                padding: '0.5rem 1rem',
                borderRadius: 99,
                fontSize: '0.8rem',
                border: '1px solid rgba(34, 197, 94, 0.2)',
                color: '#22c55e'
              }}>Synchronized</div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginTop: '2rem' }}>
            <EmptyState
              icon='🔐'
              title='Access Restricted'
              message='Authentication is currently disabled for this portal.'
            />
          </div>
        )}
      </section>
    </>
  )
}

