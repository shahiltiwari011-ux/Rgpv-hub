import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

export default function AdminLayout() {
  const { pathname } = useLocation();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { to: '/admin/upload', icon: '📤', label: 'Upload Asset' },
    { to: '/admin', icon: '🗄️', label: 'Manage Database' },
    { to: '/admin/analytics', icon: '📊', label: 'Analytics' }
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="admin-console-layout">
      {/* Sidebar */}
      <aside className="console-sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo">X</div>
          <div className="brand-titles">
            <span className="main-brand">PROJECTX</span>
            <span className="sub-brand">RESOURCE CONSOLE</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link 
              key={item.to} 
              to={item.to} 
              className={`nav-item ${pathname === item.to ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {pathname === item.to && <motion.div layoutId="nav-pill" className="nav-pill-bg" />}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="terminate-btn">
            <span className="icon">🚪</span>
            <span className="label">Terminate Session</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="console-main">
        <div className="console-scroll-container">
          <Outlet />
        </div>
      </main>

      <style>{`
        .admin-console-layout { display: flex; height: 100vh; background: var(--bg-primary); overflow: hidden; }
        
        .console-sidebar { 
          width: 280px; 
          background: var(--bg-card); 
          border-right: 1px solid var(--border); 
          display: flex; 
          flex-direction: column; 
          padding: 2rem 1.5rem;
          z-index: 100;
          backdrop-filter: blur(20px);
        }

        .sidebar-brand { display: flex; align-items: center; gap: 1rem; margin-bottom: 4rem; }
        .brand-logo { 
          width: 40px; height: 40px; background: var(--accent-blue); 
          border-radius: 12px; display: flex; align-items: center; justify-content: center; 
          color: #fff; font-weight: 900; font-size: 1.4rem; transform: rotate(10deg);
        }
        .brand-titles { display: flex; flex-direction: column; }
        .main-brand { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 1.1rem; letter-spacing: -1px; color: var(--text-primary); }
        .sub-brand { font-size: 0.65rem; font-weight: 700; color: var(--text-muted); letter-spacing: 1px; }

        .sidebar-nav { display: flex; flex-direction: column; gap: 0.5rem; flex: 1; }
        .nav-item { 
          position: relative; padding: 1rem 1.25rem; border-radius: 1rem; 
          display: flex; align-items: center; gap: 1rem; text-decoration: none; 
          color: var(--text-muted); font-weight: 700; transition: 0.3s;
        }
        .nav-item:hover { color: var(--text-primary); background: rgba(255,255,255,0.02); }
        .nav-item.active { color: #fff; }
        .nav-pill-bg { position: absolute; inset: 0; background: var(--accent-blue); border-radius: 1rem; z-index: 0; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3); }
        .nav-icon, .nav-label { position: relative; z-index: 1; }
        .nav-icon { font-size: 1.2rem; }

        .sidebar-footer { margin-top: 2rem; padding-top: 2rem; border-top: 1px solid var(--border); }
        .terminate-btn { 
          width: 100%; display: flex; align-items: center; gap: 1rem; padding: 1rem; 
          background: rgba(244, 63, 94, 0.05); color: #f43f5e; border: 1px solid rgba(244, 63, 94, 0.1); 
          border-radius: 1rem; cursor: pointer; font-weight: 800; transition: 0.3s;
        }
        .terminate-btn:hover { background: #f43f5e; color: #fff; transform: translateY(-2px); }

        .console-main { flex: 1; position: relative; overflow: hidden; background: radial-gradient(circle at 100% 0%, rgba(59, 130, 246, 0.05) 0%, transparent 40%); }
        .console-scroll-container { height: 100%; overflow-y: auto; padding: 3rem; }

        @media (max-width: 1024px) {
          .console-sidebar { width: 80px; padding: 2rem 1rem; align-items: center; }
          .brand-titles, .nav-label, .terminate-btn .label { display: none; }
          .nav-item { justify-content: center; padding: 1rem; }
          .sidebar-brand { margin-bottom: 3rem; }
        }
      `}</style>
    </div>
  );
}
