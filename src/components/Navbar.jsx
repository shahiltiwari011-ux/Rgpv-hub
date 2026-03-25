import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useDarkMode } from '../hooks/useDarkMode'
import { useState } from 'react'
import StreakBadge from './StreakBadge'

const NAV_LINKS = [
  { to: '/', icon: '🏠', label: 'Home' },
  { to: '/notes', icon: '📝', label: 'Notes' },
  { to: '/pyq', icon: '📄', label: 'PYQ' },
  { to: '/syllabus', icon: '📋', label: 'Syllabus' },
  { to: '/discussions', icon: '💬', label: 'Forum' },
  { to: '/leaderboard', icon: '🏆', label: 'Ranking' }
]

export default function Navbar () {
  const { pathname } = useLocation()
  const { user, isAdmin, logout } = useAuth()
  const { dark, toggle } = useDarkMode()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className='navbar' role='navigation' aria-label='Main navigation'>
      <Link to='/' className='nav-logo'>
        <span
          className='logo-icon'
          style={{
            fontSize: '1.1rem',
            background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            flexShrink: 0
          }}
        >
          🔷
        </span>
        <span className='logo-text' style={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
          StudyHub<span style={{ color: 'var(--accent-blue)' }}>.</span>
        </span>
      </Link>

      <ul className={`nav-links ${mobileOpen ? 'open' : ''}`}>
        {mobileOpen && (
          <>
            <button className='mobile-close-btn mobile-only' onClick={() => setMobileOpen(false)} aria-label='Close menu'>
              ✕
            </button>
            <li className='mobile-nav-header mobile-only'>
              <span className='mobile-nav-kicker'>Navigation</span>
              <span className='mobile-nav-title'>Browse StudyHub</span>
            </li>
          </>
        )}

        {NAV_LINKS.map((l) => (
          <li key={l.to}>
            <Link to={l.to} className={pathname === l.to ? 'active' : ''} onClick={() => setMobileOpen(false)}>
              {l.icon} <span>{l.label}</span>
            </Link>
          </li>
        ))}

        {user && (
          <>
            <li className='mobile-only'>
              <Link to='/dashboard' className={pathname === '/dashboard' ? 'active' : ''} onClick={() => setMobileOpen(false)}>
                📊 <span>Dashboard</span>
              </Link>
            </li>
            {isAdmin && (
              <li className='mobile-only'>
                <Link to='/admin' className={pathname === '/admin' ? 'active' : ''} onClick={() => setMobileOpen(false)}>
                  ⚙️ <span>Admin Panel</span>
                </Link>
              </li>
            )}
            <li className='mobile-only'>
              <Link to={`/profile/${user.id}`} className={pathname.startsWith('/profile') ? 'active' : ''} onClick={() => setMobileOpen(false)}>
                👤 <span>My Profile</span>
              </Link>
            </li>
          </>
        )}

        <li className='mobile-only mobile-nav-action'>
          {!user
            ? (
              <Link to='/dashboard?mode=signup' className='nav-toggle-btn nav-register-btn' onClick={() => setMobileOpen(false)}>
                Register
              </Link>
              )
            : (
              <button className='nav-logout-btn' onClick={() => { logout(); setMobileOpen(false) }}>
                🚪 Logout / Sign Out
              </button>
              )}
        </li>
      </ul>

      <div className='nav-right'>
        <div className='nav-gamification'>
          <StreakBadge />
        </div>

        {user && (
          <div className='nav-user-group desktop-only'>
            <Link to='/dashboard' title='Dashboard' className={`nav-icon-link ${pathname === '/dashboard' ? 'active' : ''}`}>📊</Link>
            {isAdmin && <Link to='/admin' title='Admin Panel' className={`nav-icon-link ${pathname === '/admin' ? 'active' : ''}`}>⚙️</Link>}
            <Link to={`/profile/${user.id}`} title='My Profile' className={`nav-icon-link ${pathname.startsWith('/profile') ? 'active' : ''}`}>👤</Link>
          </div>
        )}

        <button type='button' className={`dark-toggle ${dark ? 'active' : ''}`} onClick={toggle} role='switch' aria-checked={dark} aria-label='Toggle dark mode'>
          <div className='dark-toggle-knob'>{dark ? '🌙' : '☀️'}</div>
        </button>

        {!user
          ? (
            <div className='nav-auth-actions desktop-only'>
              <Link to='/dashboard?mode=signup' className='btn-primary nav-auth-btn'>Register</Link>
            </div>
            )
          : (
            <button className='btn-secondary nav-auth-btn desktop-only' onClick={logout}>Sign Out</button>
            )}

        <button type='button' className={`hamburger ${mobileOpen ? 'active' : ''}`} onClick={() => setMobileOpen(!mobileOpen)} aria-label='Toggle menu' aria-expanded={mobileOpen}>
          <span /><span /><span />
        </button>
      </div>
    </nav>
  )
}
