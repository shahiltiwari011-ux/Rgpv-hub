/**
 * MobileProfile — Profile & settings screen for native app.
 * Shows user info, academic details, theme toggle, and logout.
 */
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../hooks/useDarkMode';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import AuthModal from '../components/AuthModal';

export default function MobileProfile() {
  const { user, profile, role, logout } = useAuth();
  const { dark, toggle } = useDarkMode();
  const navigate = useNavigate();
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getUserInitial = () => {
    if (profile?.name) return profile.name.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return '?';
  };

  const getRoleLabel = (r) => {
    if (r === 'admin') return 'Administrator';
    if (r === 'faculty') return 'Faculty';
    if (r === 'tpo') return 'TPO';
    return 'Student';
  };

  // Not logged in
  if (!user) {
    return (
      <div className="m-profile">
        <div className="m-login-card" style={{ marginTop: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>👤</div>
          <h2>Sign in to CollegeOne</h2>
          <p>Access your profile, track results, and manage your academic journey</p>
          <button className="m-login-btn" onClick={() => setIsAuthOpen(true)}>
            Sign In
          </button>
        </div>

        {/* Settings (available even without login) */}
        <div className="m-profile-section" style={{ marginTop: '24px' }}>
          <div className="m-profile-section-title">Settings</div>
          <div className="m-profile-row" onClick={toggle}>
            <span className="m-profile-row-icon">{dark ? '☀️' : '🌙'}</span>
            <div className="m-profile-row-content">
              <div className="m-profile-row-label">Appearance</div>
              <div className="m-profile-row-value">{dark ? 'Dark Mode' : 'Light Mode'}</div>
            </div>
            <span className="m-profile-row-arrow">›</span>
          </div>
        </div>

        <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '12px', fontWeight: '600' }}>
          CollegeOne v2.0
        </div>

        <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      </div>
    );
  }

  return (
    <div className="m-profile">
      {/* Profile Header */}
      <div className="m-profile-header">
        <div className="m-profile-avatar">{getUserInitial()}</div>
        <h2 className="m-profile-name">
          {profile?.name || user.email.split('@')[0]}
        </h2>
        <p className="m-profile-email">{user.email}</p>
        <span className="m-profile-role">{getRoleLabel(role)}</span>
      </div>

      {/* Account Section */}
      <div className="m-profile-section">
        <div className="m-profile-section-title">Account</div>

        <Link to={`/profile/${user.id}`} className="m-profile-row">
          <span className="m-profile-row-icon">👤</span>
          <div className="m-profile-row-content">
            <div className="m-profile-row-label">View Profile</div>
            <div className="m-profile-row-value">Public profile page</div>
          </div>
          <span className="m-profile-row-arrow">›</span>
        </Link>

        {profile?.enrollment_no && (
          <div className="m-profile-row">
            <span className="m-profile-row-icon">🎫</span>
            <div className="m-profile-row-content">
              <div className="m-profile-row-label">Enrollment</div>
              <div className="m-profile-row-value">{profile.enrollment_no}</div>
            </div>
          </div>
        )}

        {profile?.branch && (
          <div className="m-profile-row">
            <span className="m-profile-row-icon">🏛️</span>
            <div className="m-profile-row-content">
              <div className="m-profile-row-label">Branch</div>
              <div className="m-profile-row-value">{profile.branch}</div>
            </div>
          </div>
        )}

        {profile?.semester && (
          <div className="m-profile-row">
            <span className="m-profile-row-icon">📅</span>
            <div className="m-profile-row-content">
              <div className="m-profile-row-label">Semester</div>
              <div className="m-profile-row-value">Semester {profile.semester}</div>
            </div>
          </div>
        )}

        {profile?.xp !== undefined && (
          <div className="m-profile-row">
            <span className="m-profile-row-icon">⭐</span>
            <div className="m-profile-row-content">
              <div className="m-profile-row-label">XP Points</div>
              <div className="m-profile-row-value">{profile.xp || 0} XP</div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="m-profile-section">
        <div className="m-profile-section-title">Quick Links</div>

        <Link to="/result" className="m-profile-row">
          <span className="m-profile-row-icon">📊</span>
          <div className="m-profile-row-content">
            <div className="m-profile-row-label">Academic Result</div>
            <div className="m-profile-row-value">Check your semester results</div>
          </div>
          <span className="m-profile-row-arrow">›</span>
        </Link>

        <Link to="/placement" className="m-profile-row">
          <span className="m-profile-row-icon">🚀</span>
          <div className="m-profile-row-content">
            <div className="m-profile-row-label">Placement Portal</div>
            <div className="m-profile-row-value">Browse opportunities</div>
          </div>
          <span className="m-profile-row-arrow">›</span>
        </Link>

        {(role === 'faculty' || role === 'admin') && (
          <Link to="/teacher" className="m-profile-row">
            <span className="m-profile-row-icon">👨‍🏫</span>
            <div className="m-profile-row-content">
              <div className="m-profile-row-label">Faculty Dashboard</div>
            </div>
            <span className="m-profile-row-arrow">›</span>
          </Link>
        )}

        {(role === 'tpo' || role === 'admin') && (
          <Link to="/tpo" className="m-profile-row">
            <span className="m-profile-row-icon">💼</span>
            <div className="m-profile-row-content">
              <div className="m-profile-row-label">TPO Dashboard</div>
            </div>
            <span className="m-profile-row-arrow">›</span>
          </Link>
        )}

        {role === 'admin' && (
          <Link to="/admin" className="m-profile-row">
            <span className="m-profile-row-icon">🛡️</span>
            <div className="m-profile-row-content">
              <div className="m-profile-row-label">Admin Panel</div>
            </div>
            <span className="m-profile-row-arrow">›</span>
          </Link>
        )}
      </div>

      {/* Settings */}
      <div className="m-profile-section">
        <div className="m-profile-section-title">Settings</div>

        <div className="m-profile-row" onClick={toggle}>
          <span className="m-profile-row-icon">{dark ? '☀️' : '🌙'}</span>
          <div className="m-profile-row-content">
            <div className="m-profile-row-label">Appearance</div>
            <div className="m-profile-row-value">{dark ? 'Dark Mode' : 'Light Mode'}</div>
          </div>
          <span className="m-profile-row-arrow">›</span>
        </div>
      </div>

      {/* Logout */}
      <button className="m-logout-btn" onClick={handleLogout}>
        Sign Out
      </button>

      {/* Version */}
      <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '12px', fontWeight: '600' }}>
        CollegeOne v2.0
      </div>
    </div>
  );
}
