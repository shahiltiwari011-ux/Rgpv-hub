import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../hooks/useDarkMode';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
const NAV_LINKS = [
  { to: '/', icon: '🏠', label: 'Home' },
  { to: '/notes', icon: '📝', label: 'Notes' },
  { to: '/pyq', icon: '📄', label: 'PYQ' },
  { to: '/syllabus', icon: '📋', label: 'Syllabus' },
  { to: '/result', icon: '📊', label: 'Results' }
];

export default function Navbar() {
  const { pathname } = useLocation();
  const { user, isAdmin, logout, isConnected } = useAuth();
  const { dark, toggle } = useDarkMode();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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
            <div className="icon-inner">X</div>
          </div>
          <span className="brand-text">PROJECT<span>X</span></span>
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

          {isAdmin && (
            <div className="user-group">
              <Link to="/admin" className="avatar-link">
                <div className="avatar-mini">A</div>
              </Link>
              <button onClick={logout} className="logout-btn desktop-only">LOGOUT</button>
            </div>
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
            {isAdmin && (
              <div className="mobile-footer">
                <button onClick={() => { logout(); setMobileOpen(false); }} className="mobile-logout">SIGN OUT</button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .projectx-nav { position: fixed; top: 0; left: 0; width: 100%; z-index: 1000; transition: 0.4s cubic-bezier(0.4, 0, 0.2, 1); padding: 1.5rem 0; }
        .projectx-nav.scrolled { background: rgba(var(--bg-glass-rgb), 0.8); backdrop-filter: blur(20px); padding: 1rem 0; border-bottom: 1px solid var(--border); }
        
        .nav-container { max-width: 1300px; margin: 0 auto; padding: 0 var(--container-px); display: flex; align-items: center; justify-content: space-between; }

        .nav-brand { display: flex; align-items: center; gap: 0.75rem; text-decoration: none; }
        .brand-icon { width: 32px; height: 32px; background: var(--accent-blue); border-radius: 8px; display: flex; align-items: center; justify-content: center; transform: rotate(10deg); transition: 0.3s; }
        .nav-brand:hover .brand-icon { transform: rotate(0deg) scale(1.1); }
        .icon-inner { font-weight: 900; color: #fff; font-size: 1.1rem; }
        .brand-text { font-family: 'Syne', sans-serif; font-size: clamp(1rem, 5vw, 1.4rem); font-weight: 800; color: var(--text-primary); letter-spacing: -1px; white-space: nowrap; }
        .brand-text span { color: var(--accent-blue); }

        .nav-links-desktop { display: flex; align-items: center; gap: 0.25rem; background: rgba(var(--bg-glass-rgb), 0.05); padding: 0.4rem; border-radius: 1.25rem; border: 1px solid var(--border); }
        @media (max-width: 1080px) { .nav-links-desktop { display: none; } }
        
        .nav-link { text-decoration: none; padding: 0.5rem 0.8rem; border-radius: 1rem; color: var(--text-muted); font-size: 0.85rem; font-weight: 700; display: flex; align-items: center; gap: 0.4rem; transition: 0.3s; position: relative; white-space: nowrap; }
        .nav-link:hover { color: var(--text-primary); background: rgba(var(--bg-glass-rgb), 0.05); }
        .nav-link.active { color: var(--accent-blue); }
        .active-glow { position: absolute; inset: 0; background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 1rem; z-index: -1; }

        @media (max-width: 1280px) {
          .nav-link .link-label { display: none; }
          .nav-link { padding: 0.5rem; justify-content: center; border-radius: 50%; width: 40px; height: 40px; }
          .active-glow { border-radius: 50%; }
        }

        .nav-actions { display: flex; align-items: center; gap: clamp(0.4rem, 2vw, 0.75rem); flex-shrink: 0; }
        .theme-toggle { background: var(--bg-card); border: 1px solid var(--border); width: 36px; height: 36px; border-radius: 12px; cursor: pointer; font-size: 1rem; display: flex; align-items: center; justify-content: center; transition: 0.3s; color: var(--text-primary); }
        @media (min-width: 768px) { .theme-toggle { width: 40px; height: 40px; font-size: 1.1rem; } }
        .theme-toggle:hover { background: rgba(var(--bg-glass-rgb), 0.1); border-color: var(--accent-blue); }

        .avatar-mini { width: 32px; height: 32px; background: var(--gradient-notes); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; color: #fff; font-size: 0.8rem; border: 2px solid var(--border); }
        @media (min-width: 768px) { .avatar-mini { width: 36px; height: 36px; font-size: 0.9rem; } }
        .logout-btn { background: none; border: 1px solid var(--border); color: var(--text-muted); padding: 0.5rem 1rem; border-radius: 0.75rem; font-weight: 800; font-size: 0.7rem; cursor: pointer; transition: 0.3s; }
        .logout-btn:hover { color: #f43f5e; border-color: #f43f5e40; background: #f43f5e10; }
        
        .btn-sign { text-decoration: none; background: var(--text-primary); color: var(--bg-primary); padding: 0.5rem 1rem; border-radius: 0.8rem; font-weight: 900; font-size: 0.75rem; transition: 0.3s; white-space: nowrap; }
        @media (min-width: 768px) { .btn-sign { padding: 0.6rem 1.2rem; font-size: 0.8rem; } }
        .btn-sign:hover { background: var(--accent-blue); color: #fff; box-shadow: 0 10px 20px rgba(59, 130, 246, 0.3); }

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

        .mobile-toggle { width: 36px; height: 36px; display: none; flex-direction: column; justify-content: center; align-items: center; gap: 4px; background: none; border: none; cursor: pointer; }
        @media (max-width: 1080px) { .mobile-toggle { display: flex; } }
        .mobile-toggle span { width: 18px; height: 2px; background: var(--text-primary); border-radius: 2px; transition: 0.3s; }
        .mobile-toggle.open span:nth-child(1) { transform: translateY(6px) rotate(45deg); }
        .mobile-toggle.open span:nth-child(2) { opacity: 0; }
        .mobile-toggle.open span:nth-child(3) { transform: translateY(-6px) rotate(-45deg); }

        .mobile-menu { position: fixed; top: calc(var(--nav-height) + 10px); left: 1rem; right: 1rem; background: var(--bg-card); backdrop-filter: blur(30px); border: 1px solid var(--border); border-radius: 2rem; padding: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem; z-index: 999; max-height: calc(100vh - var(--nav-height) - 40px); overflow-y: auto; }
        .mobile-link { display: flex; align-items: center; gap: 1rem; padding: 1.2rem; border-radius: 1.2rem; text-decoration: none; color: var(--text-muted); font-weight: 700; transition: 0.3s; }
        .mobile-link.active { background: rgba(59, 130, 246, 0.1); color: var(--accent-blue); }
        .mobile-footer { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border); }
        .mobile-logout, .mobile-login { width: 100%; padding: 1rem; border-radius: 1rem; border: none; font-weight: 900; font-size: 1rem; cursor: pointer; text-align: center; text-decoration: none; display: block; }
        .mobile-logout { background: rgba(244, 63, 94, 0.1); color: #f43f5e; }
        .mobile-login { background: var(--text-primary); color: var(--bg-primary); }

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
