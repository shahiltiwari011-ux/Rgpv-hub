/**
 * MobileHome — Native-app-style dashboard for the Home tab.
 * Replaces the website hero/landing page feel with a compact, content-first UI.
 */
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStats } from '../hooks/useStats';
import { useTrending } from '../hooks/useTrending';
import { useState } from 'react';
import AuthModal from '../components/AuthModal';

const QUICK_ACTIONS = [
  { icon: '📝', label: 'Notes', desc: 'Lecture notes', to: '/notes', color: 'blue' },
  { icon: '📄', label: 'PYQ', desc: 'Past papers', to: '/pyq', color: 'purple' },
  { icon: '📋', label: 'Syllabus', desc: 'Course syllabus', to: '/syllabus', color: 'green' },
  { icon: '📊', label: 'Result', desc: 'Academic result', to: '/result', color: 'orange' },
  { icon: '🚀', label: 'Placements', desc: 'Placement portal', to: '/placement', color: 'pink' },
  { icon: '🎓', label: 'Academic', desc: 'Student profile', to: '/teacher/academic-profile', color: 'cyan' }
];

const BRANCHES = [
  { name: 'Computer Science', icon: '🖥️', param: 'Computer Science' },
  { name: 'Mechanical', icon: '⚙️', param: 'Mechanical' },
  { name: 'Electrical', icon: '⚡', param: 'Electrical' },
  { name: 'Civil', icon: '🏗️', param: 'Civil' },
  { name: 'Electronics', icon: '📡', param: 'Electronics' }
];

export default function MobileHome() {
  const { user, profile, role } = useAuth();
  const { stats } = useStats();
  const { trending, recentlyAdded, loading: trendingLoading } = useTrending();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const s = stats || { total_notes: 0, total_pyq: 0, total_syllabus: 0 };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getUserName = () => {
    if (profile?.name) return profile.name;
    if (user?.email) return user.email.split('@')[0];
    return 'Student';
  };

  const getTypeIcon = (type) => {
    if (type === 'notes') return '📝';
    if (type === 'pyq') return '📄';
    if (type === 'syllabus') return '📋';
    return '📁';
  };

  return (
    <div className="m-home">
      {/* Welcome Section */}
      <div className="m-welcome">
        <p className="m-welcome-greeting">{getGreeting()} 👋</p>
        <h1 className="m-welcome-name">
          {user ? `Welcome, ${getUserName()}` : 'Welcome to CollegeOne'}
        </h1>
      </div>

      {/* Login prompt if not authenticated */}
      {!user && (
        <div className="m-login-card" style={{ marginBottom: '24px' }}>
          <h2>Sign In to CollegeOne</h2>
          <p>Access your academic resources and track your progress</p>
          <button className="m-login-btn" onClick={() => setIsAuthOpen(true)}>
            Sign In
          </button>
        </div>
      )}

      {/* Quick Actions */}
      <h2 className="m-section-title">Quick Actions</h2>
      <div className="m-quick-actions">
        {QUICK_ACTIONS.map((action) => (
          <Link key={action.to} to={action.to} className="m-action-card">
            <div className={`m-action-icon ${action.color}`}>{action.icon}</div>
            <span className="m-action-label">{action.label}</span>
            <span className="m-action-desc">{action.desc}</span>
          </Link>
        ))}
      </div>

      {/* Stats Overview */}
      <h2 className="m-section-title">Platform Stats</h2>
      <div className="m-stats-row">
        <div className="m-stat-card">
          <span className="m-stat-value">{s.total_notes || '—'}</span>
          <span className="m-stat-label">Notes</span>
        </div>
        <div className="m-stat-card">
          <span className="m-stat-value">{s.total_pyq || '—'}</span>
          <span className="m-stat-label">PYQ</span>
        </div>
        <div className="m-stat-card">
          <span className="m-stat-value">{s.total_syllabus || '—'}</span>
          <span className="m-stat-label">Syllabus</span>
        </div>
      </div>

      {/* Trending Resources */}
      {trending.length > 0 && (
        <>
          <h2 className="m-section-title">🔥 Trending</h2>
          <div className="m-scroll-row">
            {trending.map((item) => (
              <Link 
                key={item.id} 
                to={`/${item.type === 'pyq' ? 'pyq' : item.type}?branch=${encodeURIComponent(item.branch || '')}`} 
                className="m-resource-chip"
              >
                <span className="m-chip-icon">{getTypeIcon(item.type)}</span>
                <span className="m-chip-title">{item.title}</span>
                <span className="m-chip-meta">{item.branch} • Sem {item.semester}</span>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Recently Added */}
      {recentlyAdded.length > 0 && (
        <>
          <h2 className="m-section-title">🆕 Recently Added</h2>
          <div className="m-scroll-row">
            {recentlyAdded.map((item) => (
              <Link 
                key={item.id} 
                to={`/${item.type === 'pyq' ? 'pyq' : item.type}?branch=${encodeURIComponent(item.branch || '')}`} 
                className="m-resource-chip"
              >
                <span className="m-chip-icon">{getTypeIcon(item.type)}</span>
                <span className="m-chip-title">{item.title}</span>
                <span className="m-chip-meta">{item.branch} • Sem {item.semester}</span>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Skeleton while loading */}
      {trendingLoading && !trending.length && (
        <div>
          <div className="m-skeleton m-skeleton-card"></div>
          <div className="m-skeleton m-skeleton-card"></div>
          <div className="m-skeleton m-skeleton-card"></div>
        </div>
      )}

      {/* Browse by Branch */}
      <h2 className="m-section-title">Browse by Branch</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '28px' }}>
        {BRANCHES.map((b) => (
          <Link 
            key={b.param} 
            to={`/notes?branch=${encodeURIComponent(b.param)}`} 
            className="m-resource-item"
          >
            <div className="m-resource-icon" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
              {b.icon}
            </div>
            <div className="m-resource-info">
              <div className="m-resource-title">{b.name}</div>
              <div className="m-resource-sub">Browse resources →</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Role-specific shortcuts */}
      {user && role && role !== 'student' && (
        <>
          <h2 className="m-section-title">Your Dashboard</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '28px' }}>
            {role === 'admin' && (
              <Link to="/admin" className="m-resource-item">
                <div className="m-resource-icon" style={{ background: 'rgba(244,63,94,0.1)' }}>🛡️</div>
                <div className="m-resource-info">
                  <div className="m-resource-title">Admin Panel</div>
                  <div className="m-resource-sub">Manage platform</div>
                </div>
              </Link>
            )}
            {(role === 'faculty' || role === 'admin') && (
              <Link to="/teacher" className="m-resource-item">
                <div className="m-resource-icon" style={{ background: 'rgba(139,92,246,0.1)' }}>👨‍🏫</div>
                <div className="m-resource-info">
                  <div className="m-resource-title">Faculty Dashboard</div>
                  <div className="m-resource-sub">Upload & manage</div>
                </div>
              </Link>
            )}
            {(role === 'tpo' || role === 'admin') && (
              <Link to="/tpo" className="m-resource-item">
                <div className="m-resource-icon" style={{ background: 'rgba(16,185,129,0.1)' }}>💼</div>
                <div className="m-resource-info">
                  <div className="m-resource-title">TPO Dashboard</div>
                  <div className="m-resource-sub">Placement management</div>
                </div>
              </Link>
            )}
          </div>
        </>
      )}

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
}
