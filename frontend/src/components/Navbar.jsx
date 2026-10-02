import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../hooks/useDarkMode';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AuthModal from './AuthModal';

const NAV_LINKS = [
  { to: '/', icon: '🏠', label: 'Home' },
  { to: '/notes', icon: '📝', label: 'Notes' },
  { to: '/pyq', icon: '📄', label: 'PYQ' },
  { to: '/syllabus', icon: '📋', label: 'Syllabus' },
  { to: '/result', icon: '📊', label: 'Results' },
  { to: '/placement', icon: '🚀', label: 'Placements' }
];

export default function Navbar() {
  const { pathname } = useLocation();
  const { user, isAdmin, role, logout, isConnected } = useAuth();
  const { dark, toggle } = useDarkMode();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`projectx-nav ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">
        {/* Logo */}
        <Link to="/" className="nav-brand" onClick={() => setMobileOpen(false)}>
          <div className="brand-icon">
            <div className="icon-inner">C</div>
          </div>
          <span className="brand-text">COLLEGE<span>ONE</span></span>
        </Link>

        {/* Desktop Links */}
        <div className="nav-links-desktop">
          {NAV_LINKS.map((link) => (
            <Link 
              key={link.to} 
              to={link.to} 
              className={`nav-link ${pathname === link.to ? 'active' : ''}`}
            >
              <span className="link-icon">{link.icon}</span>
              <span className="link-label">{link.label}</span>
              {pathname === link.to && <motion.div layoutId="nav-glow" className="active-glow" />}
            </Link>
          ))}
        </div>

        {/* Right Actions */}
        <div className="nav-actions">

          {/* Connectivity Indicator */}
          <div className={`connectivity-status ${isConnected ? 'online' : 'offline'}`} title={isConnected ? 'Cloud Sync Active' : 'Offline Mode (Local Cache)'}>
            <span className="status-dot"></span>
            <span className="status-label desktop-only">{isConnected ? 'LIVE' : 'OFFLINE'}</span>
          </div>

          <button onClick={toggle} className="theme-toggle">
            {dark ? '🌙' : '☀️'}
          </button>

          {user || isAdmin ? (
            <div className="user-group desktop-only">
              {(role === 'tpo' || isAdmin) && (
                <Link to="/tpo" className="role-btn tpo-btn" title="TPO Portal">
                  <span className="role-icon">💼</span>
                  <span className="role-label">TPO PORTAL</span>
                </Link>
              )}
              {(role === 'faculty' || role === 'teacher' || isAdmin) && (
                <Link to="/teacher" className="role-btn faculty-btn" title="Faculty Dashboard">
                  <span className="role-icon">👨‍🏫</span>
                  <span className="role-label">FACULTY</span>
                </Link>
              )}
              {isAdmin && (
                <Link to="/admin" className="avatar-link" title="Admin Panel">
                  <div className="avatar-mini">A</div>
                </Link>
              )}
              <button onClick={logout} className="logout-btn desktop-only" title="Sign Out">
                <span className="logout-icon">⏻</span>
                <span className="logout-label">LOGOUT</span>
              </button>
            </div>
          ) : (
            <button onClick={() => setIsAuthOpen(true)} className="login-btn desktop-only" title="Sign In / Register">
              <span className="login-icon">🔑</span>
              <span className="login-label">LOGIN</span>
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <button 
            className={`mobile-toggle ${mobileOpen ? 'open' : ''}`} 
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mobile-menu"
          >
            {NAV_LINKS.map((link) => (
              <Link 
                key={link.to} 
                to={link.to} 
                className={`mobile-link ${pathname === link.to ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <span className="icon">{link.icon}</span>
                <span className="label">{link.label}</span>
              </Link>
            ))}

            <div className="mobile-actions-row">
              <div className={`connectivity-status ${isConnected ? 'online' : 'offline'}`}>
                <span className="status-dot"></span>
                <span className="status-label">{isConnected ? 'LIVE' : 'OFFLINE'}</span>
              </div>
              <button onClick={toggle} className="theme-toggle-mobile">
                {dark ? '🌙 Dark' : '☀️ Light'}
              </button>
            </div>
            {/* Role-specific navigation links for mobile */}
            {(user || isAdmin) && (
              <div className="mobile-role-section">
                {(role === 'tpo' || isAdmin) && (
                  <Link to="/tpo" className="mobile-role-link tpo" onClick={() => setMobileOpen(false)}>
                    <span>💼</span> TPO Portal
                  </Link>
                )}
                {(role === 'faculty' || role === 'teacher' || isAdmin) && (
                  <Link to="/teacher" className="mobile-role-link teacher" onClick={() => setMobileOpen(false)}>
                    <span>👨‍🏫</span> Faculty Dashboard
                  </Link>
                )}
                {isAdmin && (
                  <Link to="/admin" className="mobile-role-link admin" onClick={() => setMobileOpen(false)}>
                    <span>🛡️</span> Admin Panel
                  </Link>
                )}
                {user && !isAdmin && role !== 'tpo' && role !== 'faculty' && role !== 'teacher' && (
                  <div className="mobile-user-badge">
                    <span>🎓</span> Signed in as <strong>{user?.email?.split('@')[0]}</strong>
                  </div>
                )}
              </div>
            )}

            <div className="mobile-footer">
              {user || isAdmin ? (
                <button onClick={() => { logout(); setMobileOpen(false); }} className="mobile-logout">SIGN OUT</button>
              ) : (
                <button onClick={() => { setIsAuthOpen(true); setMobileOpen(false); }} className="mobile-login">🔑 SIGN IN / REGISTER</button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

      <style>{`
        .projectx-nav { position: fixed; top: 0; left: 0; width: 100%; z-index: 1000; transition: 0.4s cubic-bezier(0.4, 0, 0.2, 1); padding: 1rem 0; }
        .projectx-nav.scrolled { background: rgba(var(--bg-glass-rgb), 0.85); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); padding: 0.75rem 0; border-bottom: 1px solid var(--border); box-shadow: 0 10px 30px rgba(0,0,0,0.15); }
        
        .nav-container { max-width: 1440px; width: 100%; margin: 0 auto; padding: 0 clamp(0.75rem, 2vw, 1.5rem); display: flex; align-items: center; justify-content: space-between; box-sizing: border-box; }

        .nav-brand { display: flex; align-items: center; gap: 0.6rem; text-decoration: none; flex-shrink: 0; }
        .brand-icon { width: 32px; height: 32px; background: var(--accent-blue); border-radius: 8px; display: flex; align-items: center; justify-content: center; transform: rotate(8deg); transition: 0.3s; flex-shrink: 0; }
        .nav-brand:hover .brand-icon { transform: rotate(0deg) scale(1.08); }
        .icon-inner { font-weight: 900; color: #fff; font-size: 1.05rem; }
        .brand-text { font-family: 'Syne', sans-serif; font-size: clamp(1rem, 2.5vw, 1.25rem); font-weight: 800; color: var(--text-primary); letter-spacing: -0.5px; white-space: nowrap; }
        .brand-text span { color: var(--accent-blue); }

        .nav-links-desktop { display: flex; align-items: center; gap: 0.2rem; background: rgba(var(--bg-glass-rgb), 0.05); padding: 0.3rem 0.4rem; border-radius: 1.25rem; border: 1px solid var(--border); flex-shrink: 1; }
        @media (max-width: 1080px) { .nav-links-desktop { display: none; } }
        
        .nav-link { text-decoration: none; padding: 0.4rem 0.65rem; border-radius: 0.85rem; color: var(--text-muted); font-size: 0.8rem; font-weight: 700; display: flex; align-items: center; gap: 0.35rem; transition: 0.25s; position: relative; white-space: nowrap; }
        .nav-link:hover { color: var(--text-primary); background: rgba(var(--bg-glass-rgb), 0.06); }
        .nav-link.active { color: var(--accent-blue); }
        .active-glow { position: absolute; inset: 0; background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 0.85rem; z-index: -1; }

        @media (max-width: 1240px) {
          .nav-link .link-label { display: none; }
          .nav-link { padding: 0.4rem; justify-content: center; border-radius: 50%; width: 36px; height: 36px; }
          .active-glow { border-radius: 50%; }
        }

        /* Laptop/mid-width breakpoint: collapse text labels on role & logout buttons */
        @media (min-width: 1081px) and (max-width: 1480px) {
          .role-label { display: none; }
          .logout-label { display: none; }
          .login-label { display: none; }
          .role-btn { padding: 0 !important; width: 34px !important; height: 32px !important; justify-content: center; border-radius: 0.65rem !important; }
          .logout-btn { padding: 0 !important; width: 34px !important; height: 32px !important; justify-content: center; border-radius: 0.65rem !important; font-size: 0.85rem; }
          .login-btn { padding: 0 !important; width: 34px !important; height: 32px !important; justify-content: center; }
          .nav-actions { gap: 0.35rem !important; }
        }

        .nav-actions { display: flex !important; flex-direction: row !important; align-items: center !important; gap: clamp(0.35rem, 1vw, 0.6rem); flex-shrink: 0; flex-wrap: nowrap !important; }
        .user-group { display: flex !important; flex-direction: row !important; align-items: center !important; gap: 0.4rem; flex-wrap: nowrap !important; white-space: nowrap !important; }
        .avatar-link { display: flex; align-items: center; text-decoration: none; flex-shrink: 0; }
        .theme-toggle { background: var(--bg-card); border: 1px solid var(--border); width: 34px; height: 34px; border-radius: 10px; cursor: pointer; font-size: 0.95rem; display: flex; align-items: center; justify-content: center; transition: 0.25s; color: var(--text-primary); flex-shrink: 0; }
        .theme-toggle:hover { background: rgba(var(--bg-glass-rgb), 0.1); border-color: var(--accent-blue); }

        .avatar-mini { width: 32px; height: 32px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; color: #fff; font-size: 0.8rem; border: 2px solid rgba(59,130,246,0.4); flex-shrink: 0; }
        .logout-btn { background: none; border: 1px solid var(--border); color: var(--text-muted); padding: 0 0.75rem; height: 32px; border-radius: 0.65rem; font-weight: 800; font-size: 0.68rem; cursor: pointer; transition: 0.25s; display: inline-flex; align-items: center; gap: 0.3rem; white-space: nowrap; flex-shrink: 0; }
        .logout-btn:hover { color: #f43f5e; border-color: rgba(244,63,94,0.4); background: rgba(244,63,94,0.08); }
        
        .role-btn { background: var(--bg-secondary); border: 1px solid var(--border); color: var(--text-primary); padding: 0 0.75rem; height: 32px; border-radius: 0.65rem; font-weight: 800; font-size: 0.68rem; cursor: pointer; transition: 0.25s; text-decoration: none; display: inline-flex; align-items: center; gap: 0.3rem; white-space: nowrap; flex-shrink: 0; }
        .role-btn:hover { color: var(--accent-blue); border-color: var(--accent-blue); background: rgba(59, 130, 246, 0.1); }
        
        .login-btn { background: var(--accent-blue); color: #fff; border: 1px solid rgba(59, 130, 246, 0.4); padding: 0 0.75rem; height: 32px; border-radius: 0.65rem; font-weight: 800; font-size: 0.72rem; cursor: pointer; transition: 0.25s; display: inline-flex; align-items: center; gap: 0.35rem; white-space: nowrap; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25); flex-shrink: 0; }
        .login-btn:hover { background: #2563eb; transform: translateY(-1px); box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4); }
        .login-icon { font-size: 0.8rem; }
        
        @media (max-width: 768px) {
          .projectx-nav { padding: 0.75rem 0; }
          .projectx-nav.scrolled { padding: 0.5rem 0; }
          .nav-container { padding: 0 0.75rem; width: 100%; box-sizing: border-box; }
          .brand-text { font-size: 1.15rem; }
          .nav-actions { gap: 0.5rem; }
          .theme-toggle { width: 34px; height: 34px; font-size: 0.95rem; border-radius: 10px; }
          .mobile-toggle { width: 34px; height: 34px; }
          .user-group { display: none !important; }
        }

        .nav-actions .streak-wrap, 
        .nav-actions .connectivity-status, 
        .nav-actions .theme-toggle { display: flex; }
        
        .mobile-actions-row { 
          display: flex; 
          flex-wrap: wrap; 
          gap: 0.75rem; 
          padding: 1rem 0; 
          margin-top: 1rem; 
          border-top: 1px solid var(--border); 
          align-items: center;
        }
        
        .theme-toggle-mobile { 
          background: var(--bg-card); 
          border: 1px solid var(--border); 
          color: var(--text-primary); 
          padding: 0.6rem 1.2rem; 
          border-radius: 12px; 
          font-weight: 700; 
          font-size: 0.85rem; 
          cursor: pointer; 
          transition: 0.3s;
        }
        .theme-toggle-mobile:hover { background: rgba(var(--bg-glass-rgb), 0.1); }

        .mobile-toggle { width: 36px; height: 36px; display: none; flex-direction: column; justify-content: center; align-items: center; gap: 4px; background: none; border: none; cursor: pointer; flex-shrink: 0; }
        @media (max-width: 1080px) { .mobile-toggle { display: flex; } }
        .mobile-toggle span { width: 18px; height: 2px; background: var(--text-primary); border-radius: 2px; transition: 0.3s; }
        .mobile-toggle.open span:nth-child(1) { transform: translateY(6px) rotate(45deg); }
        .mobile-toggle.open span:nth-child(2) { opacity: 0; }
        .mobile-toggle.open span:nth-child(3) { transform: translateY(-6px) rotate(-45deg); }

        .mobile-menu { position: fixed; top: 60px; left: 0.75rem; right: 0.75rem; background: var(--bg-card); backdrop-filter: blur(30px); border: 1px solid var(--border); border-radius: 1.5rem; padding: 1.25rem; display: flex; flex-direction: column; gap: 0.4rem; z-index: 1001; max-height: calc(100vh - 80px); overflow-y: auto; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
        .mobile-link { display: flex; align-items: center; gap: 0.85rem; padding: 1rem 1.1rem; border-radius: 1rem; text-decoration: none; color: var(--text-muted); font-weight: 700; font-size: 0.95rem; transition: 0.3s; }
        .mobile-link.active { background: rgba(59, 130, 246, 0.12); color: var(--accent-blue); border: 1px solid rgba(59, 130, 246, 0.2); }
        .mobile-footer { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border); }

        /* Hide desktop-only elements on mobile */
        @media (max-width: 1080px) { .desktop-only { display: none !important; } }
        .mobile-logout, .mobile-login { width: 100%; padding: 0.9rem; border-radius: 1rem; border: none; font-weight: 900; font-size: 0.95rem; cursor: pointer; text-align: center; text-decoration: none; display: block; }
        .mobile-logout { background: rgba(244, 63, 94, 0.1); color: #f43f5e; border: 1px solid rgba(244, 63, 94, 0.2); }
        .mobile-login { background: var(--accent-blue); color: #fff; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3); }

        /* Mobile role-specific navigation */
        .mobile-role-section { display: flex; flex-direction: column; gap: 0.5rem; padding: 0.75rem 0; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); margin: 0.4rem 0; }
        .mobile-role-link { display: flex; align-items: center; gap: 0.85rem; padding: 0.9rem 1.1rem; border-radius: 1rem; text-decoration: none; font-weight: 800; font-size: 0.95rem; transition: 0.3s; }
        .mobile-role-link.tpo { background: rgba(59, 130, 246, 0.08); color: var(--accent-blue); border: 1px solid rgba(59, 130, 246, 0.2); }
        .mobile-role-link.tpo:hover { background: rgba(59, 130, 246, 0.15); border-color: var(--accent-blue); }
        .mobile-role-link.teacher { background: rgba(16, 185, 129, 0.08); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); }
        .mobile-role-link.teacher:hover { background: rgba(16, 185, 129, 0.15); border-color: #10b981; }
        .mobile-role-link.admin { background: rgba(245, 158, 11, 0.08); color: var(--accent-gold); border: 1px solid rgba(245, 158, 11, 0.2); }
        .mobile-role-link.admin:hover { background: rgba(245, 158, 11, 0.15); border-color: var(--accent-gold); }
        .mobile-user-badge { display: flex; align-items: center; gap: 0.75rem; padding: 0.85rem 1.2rem; border-radius: 1.2rem; background: rgba(255,255,255,0.03); border: 1px solid var(--border); color: var(--text-muted); font-size: 0.9rem; }
        .mobile-user-badge strong { color: var(--text-primary); }

        /* Connectivity Indicator Styles */
        .connectivity-status { display: flex; align-items: center; gap: 0.5rem; padding: 0.4rem 0.8rem; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 12px; transition: 0.3s; cursor: help; }
        .connectivity-status:hover { background: var(--bg-card); }
        .status-dot { width: 8px; height: 8px; border-radius: 50%; position: relative; }
        .status-dot::after { content: ''; position: absolute; inset: -3px; border-radius: 50%; opacity: 0.4; animation: status-pulse 2s infinite; }
        
        .online .status-dot { background: var(--accent-green); box-shadow: 0 0 10px rgba(16, 185, 129, 0.4); }
        .online .status-dot::after { background: var(--accent-green); }
        .online .status-label { color: var(--accent-green); }

        .offline .status-dot { background: var(--accent-orange); box-shadow: 0 0 10px rgba(245, 158, 11, 0.4); }
        .offline .status-dot::after { background: var(--accent-orange); }
        .offline .status-label { color: var(--accent-orange); }

        .status-label { font-size: 0.65rem; font-weight: 900; letter-spacing: 1px; }

        @keyframes status-pulse {
          0% { transform: scale(1); opacity: 0.4; }
          70% { transform: scale(2.5); opacity: 0; }
          100% { transform: scale(1); opacity: 0; }
        }
      `}</style>

    </nav>
  );
}
