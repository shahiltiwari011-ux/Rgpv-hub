import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { LoadingSpinner, EmptyState } from '../components/States'
import SEO from '../components/SEO'

export default function Dashboard () {
  const { user, loading: authLoading, login, signup } = useAuth()
  const [isSignUp, setIsSignUp] = useState(false)
  const [authForm, setAuthForm] = useState({ email: '', password: '' })
  const [authError, setAuthError] = useState('')
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [authSuccess, setAuthSuccess] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('mode') === 'signup') {
      setIsSignUp(true)
    } else if (params.get('mode') === 'login') {
      setIsSignUp(false)
    }
  }, [])

  if (authLoading) return <LoadingSpinner text='Checking authentication…' />

  const handleAuth = async (e) => {
    e.preventDefault()
    setIsActionLoading(true)
    setAuthError('')
    setAuthSuccess('')

    try {
      if (isSignUp) {
        await signup(authForm.email, authForm.password)
        setAuthSuccess('Registration successful! Please sign in.')
        setIsSignUp(false)
      } else {
        await login(authForm.email, authForm.password)
      }
    } catch (err) {
      setAuthError(err.message)
    } finally {
      setIsActionLoading(false)
    }
  }

  return (
    <>
      <SEO title="Dashboard" description="Manage your bookmarks and view your study progress." urlPath="/dashboard" noIndex />
      <div className='page-hero'>
        <span className='page-hero-icon'>{user ? '📊' : (isSignUp ? '📝' : '🔐')}</span>
        <h1 className='page-hero-title'>{user ? 'Dashboard' : (isSignUp ? 'Sign Up' : 'Sign In')}</h1>
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
              title={isSignUp ? 'Join PROJECTX' : 'Secure Entry'}
              message={isSignUp ? 'Create your elite academic profile to synchronize your library.' : 'Enter your credentials to access your personalized command center.'}
            />
            
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 28,
              padding: 'clamp(1.5rem, 5vw, 3rem)',
              maxWidth: 440,
              width: '100%',
              margin: '0 auto',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.4rem',
                padding: '0.4rem',
                marginBottom: '2rem',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: 999
              }}>
                <button
                  type='button'
                  onClick={() => { setIsSignUp(false); setAuthError(''); setAuthSuccess('') }}
                  style={{
                    border: 'none',
                    borderRadius: 999,
                    padding: '0.75rem 0.5rem',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    fontFamily: 'inherit',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    background: isSignUp ? 'transparent' : 'linear-gradient(135deg, var(--accent-blue), var(--accent-cyan))',
                    color: isSignUp ? 'var(--text-secondary)' : '#fff',
                    boxShadow: isSignUp ? 'none' : '0 10px 20px rgba(59, 130, 246, 0.3)'
                  }}
                >
                  Sign In
                </button>
                <button
                  type='button'
                  onClick={() => { setIsSignUp(true); setAuthError(''); setAuthSuccess('') }}
                  style={{
                    border: 'none',
                    borderRadius: 999,
                    padding: '0.75rem 0.5rem',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    fontFamily: 'inherit',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    background: isSignUp ? 'linear-gradient(135deg, var(--accent-blue), var(--accent-cyan))' : 'transparent',
                    color: isSignUp ? '#fff' : 'var(--text-secondary)',
                    boxShadow: isSignUp ? '0 10px 20px rgba(59, 130, 246, 0.3)' : 'none'
                  }}
                >
                  Sign Up
                </button>
              </div>

              <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(1.5rem, 5vw, 1.75rem)', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
                {isSignUp ? 'Elite Registration' : 'Welcome Back'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.95rem' }}>
                {isSignUp ? 'Join the next generation of academic excellence.' : 'Resume your journey with ProjectX.'}
              </p>

              {authError && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#f87171',
                  padding: '1rem',
                  borderRadius: 16,
                  marginBottom: '1.5rem',
                  fontSize: '0.85rem',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <span>⚠️</span> {authError}
                </div>
              )}
              {authSuccess && (
                <div style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  color: '#34d399',
                  padding: '1rem',
                  borderRadius: 16,
                  marginBottom: '1.5rem',
                  fontSize: '0.85rem',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <span>✅</span> {authSuccess}
                </div>
              )}

              <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type='email' placeholder='Email Address' value={authForm.email}
                    onChange={(e) => setAuthForm((p) => ({ ...p, email: e.target.value }))}
                    required className='form-input'
                    style={{
                      width: '100%',
                      padding: '1rem 1.25rem',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 16,
                      color: '#fff',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type='password' placeholder='Password' value={authForm.password}
                    onChange={(e) => setAuthForm((p) => ({ ...p, password: e.target.value }))}
                    required className='form-input'
                    style={{
                      width: '100%',
                      padding: '1rem 1.25rem',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 16,
                      color: '#fff',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                <button
                  type='submit'
                  className='btn-primary'
                  disabled={isActionLoading}
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    padding: '1.1rem',
                    borderRadius: 16,
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    marginTop: '0.5rem'
                  }}
                >
                  {isActionLoading ? 'Authenticating...' : (isSignUp ? 'Create Profile' : 'Access Dashboard')}
                </button>
              </form>

              <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.95rem' }}>
                <p style={{ color: 'var(--text-muted)' }}>
                  {isSignUp ? 'Already have a profile?' : "New to ProjectX?"}
                  <button
                    onClick={() => { setIsSignUp(!isSignUp); setAuthError(''); setAuthSuccess('') }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent-blue)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      marginLeft: '0.4rem',
                      padding: '0.2rem 0.5rem',
                      borderRadius: 6,
                      transition: 'all 0.2s'
                    }}
                  >
                    {isSignUp ? 'Sign In' : 'Sign Up'}
                  </button>
                </p>
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  )
}
