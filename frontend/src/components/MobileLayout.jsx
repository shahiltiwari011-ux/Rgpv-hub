/**
 * MobileLayout — App shell for native Android (Capacitor).
 * Renders a compact header + bottom navigation instead of the website Navbar/Footer.
 */
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../hooks/useDarkMode';
import { useState, useEffect, useCallback } from 'react';
import AuthModal from './AuthModal';

const BOTTOM_TABS = [
  { path: '/', icon: '🏠', label: 'Home' },
  { path: '/resources', icon: '📚', label: 'Resources' },
  { path: '/result', icon: '📊', label: 'Result' },
  { path: '/app-profile', icon: '👤', label: 'Profile' }
];

export default function MobileLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { dark, toggle } = useDarkMode();
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Android hardware back button handling
  useEffect(() => {
    let cleanup = null;
    (async () => {
      try {
        const { App } = await import('@capacitor/app');
        const listener = await App.addListener('backButton', ({ canGoBack }) => {
          if (canGoBack) {
            navigate(-1);
          } else {
            App.exitApp();
          }
        });
        cleanup = listener;
      } catch {
        // @capacitor/app not available (web mode)
      }
    })();
    return () => {
      if (cleanup && cleanup.remove) cleanup.remove();
    };
  }, [navigate]);

  // Determine active tab
  const getActiveTab = useCallback(() => {
    if (pathname === '/') return '/';
    if (pathname === '/result') return '/result';
    if (pathname === '/app-profile') return '/app-profile';
    if (['/notes', '/pyq', '/syllabus', '/resources'].includes(pathname)) return '/resources';
    return '';
  }, [pathname]);

  return (
    <div className="mobile-app">
      {/* App Header */}
      <header className="app-header">
        <Link to="/" className="app-header-brand">
          <div className="app-header-logo">C</div>
          <span className="app-header-name">College<span>One</span></span>
        </Link>
        <div className="app-header-actions">
          <button className="app-header-btn" onClick={toggle} aria-label="Toggle theme">
            {dark ? '☀️' : '🌙'}
          </button>
          {!user && (
            <button className="app-header-btn" onClick={() => setIsAuthOpen(true)} aria-label="Sign in">
              🔑
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="app-content">
        <Outlet />
      </div>

      {/* Bottom Navigation */}
      <nav className="app-bottom-nav">
        {BOTTOM_TABS.map(tab => (
          <Link
            key={tab.path}
            to={tab.path}
            className={`bottom-nav-item ${getActiveTab() === tab.path ? 'active' : ''}`}
          >
            <span className="nav-icon">{tab.icon}</span>
            <span>{tab.label}</span>
          </Link>
        ))}
      </nav>

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
}
