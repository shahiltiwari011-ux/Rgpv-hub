import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { LoadingSpinner } from '../components/States'
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

  if (authLoading) return <LoadingSpinner text='Checking authentication...' />

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
      <SEO title='Dashboard' description='Manage your bookmarks and view your study progress.' urlPath='/dashboard' noIndex />

      <div className='page-hero'>
        <h1 className='page-hero-title'>{user ? 'Dashboard' : 'Account Access'}</h1>
        <p className='page-hero-sub'>
          {user
            ? `Welcome back, ${user.email}`
            : 'Sign in or create an account from the same place.'}
        </p>
      </div>

      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 2rem 4rem' }}>
        {user ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Welcome to your dashboard</h2>
            <p style={{ color: 'var(--text-muted)' }}>We are building new features for you. Stay tuned for personalized learning analytics.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 24, padding: '2.5rem', maxWidth: 420, width: '100%', margin: '0 auto', backdropFilter: 'blur(10px)', boxShadow: 'var(--shadow-md)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', padding: '0.35rem', marginBottom: '1.25rem', background: 'rgba(99, 120, 255, 0.08)', border: '1px solid var(--border)', borderRadius: 999 }}>
                <button
                  type='button'
                  onClick={() => { setIsSignUp(false); setAuthError(''); setAuthSuccess('') }}
                  style={{
                    border: 'none',
                    borderRadius: 999,
                    padding: '0.8rem 1rem',
                    fontWeight: 700,
                    fontFamily: 'inherit',
                    background: isSignUp ? 'transparent' : 'linear-gradient(135deg, var(--accent-blue), var(--accent-cyan))',
                    color: isSignUp ? 'var(--text-secondary)' : '#fff',
                    boxShadow: isSignUp ? 'none' : '0 8px 24px rgba(59, 130, 246, 0.25)'
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
                    padding: '0.8rem 1rem',
                    fontWeight: 700,
                    fontFamily: 'inherit',
                    background: isSignUp ? 'linear-gradient(135deg, var(--accent-blue), var(--accent-cyan))' : 'transparent',
                    color: isSignUp ? '#fff' : 'var(--text-secondary)',
                    boxShadow: isSignUp ? '0 8px 24px rgba(59, 130, 246, 0.25)' : 'none'
                  }}
                >
                  Sign Up
                </button>
              </div>

              <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.4rem' }}>{isSignUp ? 'Create your account' : 'Welcome back'}</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>{isSignUp ? 'Use your email and password to get started.' : 'Use your email and password to continue.'}</p>

              {authError && <div style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '0.75rem', borderRadius: 8, marginBottom: '1rem', fontSize: '0.85rem' }}>{authError}</div>}
              {authSuccess && <div style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '0.75rem', borderRadius: 8, marginBottom: '1rem', fontSize: '0.85rem' }}>{authSuccess}</div>}

              <form onSubmit={handleAuth}>
                <div style={{ marginBottom: '0.75rem', width: '100%' }}>
                  <input
                    type='email'
                    placeholder='Email'
                    value={authForm.email}
                    onChange={(e) => setAuthForm((p) => ({ ...p, email: e.target.value }))}
                    required
                    className='form-input'
                  />
                </div>
                <div style={{ marginBottom: '1.25rem', width: '100%' }}>
                  <input
                    type='password'
                    placeholder='Password'
                    value={authForm.password}
                    onChange={(e) => setAuthForm((p) => ({ ...p, password: e.target.value }))}
                    required
                    className='form-input'
                  />
                </div>
                <button type='submit' className='btn-primary' disabled={isActionLoading} style={{ width: '100%', justifyContent: 'center' }}>
                  {isActionLoading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
                </button>
              </form>

              <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
                <p style={{ color: 'var(--text-muted)' }}>
                  {isSignUp ? 'Already have an account?' : "Need a new account?"}
                  <button
                    onClick={() => { setIsSignUp(!isSignUp); setAuthError(''); setAuthSuccess('') }}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', fontWeight: 600, cursor: 'pointer', marginLeft: '0.5rem' }}
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
