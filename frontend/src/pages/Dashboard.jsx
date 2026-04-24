import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { LoadingSpinner, EmptyState } from '../components/States'
import SEO from '../components/SEO'

export default function Dashboard () {
  const { user, loading: authLoading, login, signup, isConnected } = useAuth()
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
      console.error('Auth Error:', err)
      const msg = err.message || ''
      
      if (msg.includes('OFFLINE_PROFILE_NOT_FOUND') || msg.includes('Profile not found locally')) {
        setAuthError('No offline profile found for this email. Since you are currently offline, you need to create a local session first.')
      } else if (msg.toLowerCase().includes('fetch') || msg.toLowerCase().includes('timeout') || msg.toLowerCase().includes('abort')) {
        setAuthError('Connection failed. Your Supabase project may be paused or starting up. Please check your database status and try again in 30 seconds.')
      } else if (msg.includes('rate limit')) {
        setAuthError('Too many attempts. Please wait a few minutes.')
      } else {
        setAuthError(msg)
      }
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
              title='Access Restricted'
              message='Authentication is currently disabled for this portal.'
            />
          </div>
        )}
      </section>
    </>
  )
}
