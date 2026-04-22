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
<<<<<<< HEAD
  { to: '/result', icon: '📊', label: 'Results' },
=======
>>>>>>> ad11b44fc234b13ed695f73fce199db7d659a2e2
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
<<<<<<< HEAD
        <span className='logo-icon' style={{ fontSize: '1.1rem', background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', flexShrink: 0 }}>🔷</span>
        <span className='logo-text' style={{ fontWeight: 800, letterSpacing: '-0.02em' }}>StudyHub<span style={{ color: 'var(--accent-blue)' }}>.</span></span>
      </Link>

      <ul className={`nav-links ${mobileOpen ? 'open' : ''}`}>
        {mobileOpen && (
          <button className='mobile-close-btn mobile-only' onClick={() => setMobileOpen(false)} aria-label='Close menu'>
            ✖
          </button>
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
=======
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
        {NAV_LINKS.map((link) => (
          <li key={link.to}>
            <Link
              to={link.to}
              className={pathname === link.to ? 'active' : ''}
              onClick={() => setMobileOpen(false)}
            >
              {link.icon} <span>{link.label}</span>
            </Link>
          </li>
        ))}

        {!user && (
          <li className='mobile-only mobile-nav-action'>
            <Link
              to='/dashboard?mode=signup'
              className='nav-register-btn'
              onClick={() => setMobileOpen(false)}
            >
              Register
            </Link>
          </li>
        )}

        {user && (
          <>
            <li className='mobile-only'>
              <Link
                to='/dashboard'
                className={pathname === '/dashboard' ? 'active' : ''}
                onClick={() => setMobileOpen(false)}
              >
>>>>>>> ad11b44fc234b13ed695f73fce199db7d659a2e2
                📊 <span>Dashboard</span>
              </Link>
            </li>
            {isAdmin && (
              <li className='mobile-only'>
<<<<<<< HEAD
                <Link to='/admin' className={pathname === '/admin' ? 'active' : ''} onClick={() => setMobileOpen(false)}>
=======
                <Link
                  to='/admin'
                  className={pathname === '/admin' ? 'active' : ''}
                  onClick={() => setMobileOpen(false)}
                >
>>>>>>> ad11b44fc234b13ed695f73fce199db7d659a2e2
                  ⚙️ <span>Admin Panel</span>
                </Link>
              </li>
            )}
            <li className='mobile-only'>
<<<<<<< HEAD
              <Link to={`/profile/${user.id}`} className={pathname.startsWith('/profile') ? 'active' : ''} onClick={() => setMobileOpen(false)}>
                👤 <span>My Profile</span>
              </Link>
            </li>
          </>
        )}
        {/* Primary and secondary links separated by logic */}
        <li className='mobile-only'>
          {!user
            ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                <Link to='/dashboard?mode=login' className='nav-toggle-btn' onClick={() => setMobileOpen(false)}>
                  🔑 Sign In Account
                </Link>
                <Link to='/dashboard?mode=signup' className='nav-toggle-btn' style={{ color: 'var(--accent-blue)' }} onClick={() => setMobileOpen(false)}>
                  ✨ Create New Account
                </Link>
              </div>
              )
            : (
              <button className='nav-logout-btn' onClick={() => { logout(); setMobileOpen(false) }}>
                🚪 Logout / Sign Out
              </button>
              )}
        </li>
=======
              <Link
                to={`/profile/${user.id}`}
                className={pathname.startsWith('/profile') ? 'active' : ''}
                onClick={() => setMobileOpen(false)}
              >
                👤 <span>My Profile</span>
              </Link>
            </li>
            <li className='mobile-only mobile-nav-action'>
              <button
                className='nav-logout-btn'
                onClick={() => {
                  logout()
                  setMobileOpen(false)
                }}
              >
                🚪 Logout / Sign Out
              </button>
            </li>
          </>
        )}
>>>>>>> ad11b44fc234b13ed695f73fce199db7d659a2e2
      </ul>

      <div className='nav-right'>
        <div className='nav-gamification'>
          <StreakBadge />
<<<<<<< HEAD

=======
>>>>>>> ad11b44fc234b13ed695f73fce199db7d659a2e2
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

<<<<<<< HEAD
        {!user
          ? (
            <div className='desktop-only' style={{ display: 'flex', gap: '0.6rem' }}>
              <Link to='/dashboard?mode=login' className='btn-secondary nav-auth-btn'>Sign In</Link>
              <Link to='/dashboard?mode=signup' className='btn-primary nav-auth-btn'>Sign Up</Link>
            </div>
            )
          : (
            <button className='btn-secondary nav-auth-btn desktop-only' onClick={logout}>Sign Out</button>
            )}

        <button type='button' className={`hamburger ${mobileOpen ? 'active' : ''}`} onClick={() => setMobileOpen(!mobileOpen)} aria-label='Toggle menu'>
=======
        {user
          ? (
            <button className='btn-secondary nav-auth-btn desktop-only' onClick={logout}>Sign Out</button>
            )
          : (
            <Link to='/dashboard?mode=signup' className='btn-primary nav-auth-btn desktop-only'>Register</Link>
            )}

        <button type='button' className={`hamburger ${mobileOpen ? 'active' : ''}`} onClick={() => setMobileOpen(!mobileOpen)} aria-label='Toggle menu' aria-expanded={mobileOpen}>
>>>>>>> ad11b44fc234b13ed695f73fce199db7d659a2e2
          <span /><span /><span />
        </button>
      </div>
    </nav>
  )
}
