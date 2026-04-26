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
      {/* Mobile Top Header */}
      <header className="mobile-admin-header">
        <div className="brand-logo">X</div>
        <span className="main-brand">PROJECTX CONSOLE</span>
      </header>

      {/* Sidebar (Desktop) */}
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
              {pathname === item.to && <motion.div layoutId="nav-pill-desktop" className="nav-pill-bg" />}
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

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-bottom-nav">
        {menuItems.map((item) => (
          <Link 
            key={item.to} 
            to={item.to} 
            className={`mobile-nav-item ${pathname === item.to ? 'active' : ''}`}
          >
            <span className="mobile-nav-icon">{item.icon}</span>
            <span className="mobile-nav-label">{item.label.split(' ')[0]}</span>
            {pathname === item.to && <motion.div layoutId="nav-pill-mobile" className="mobile-nav-pill" />}
          </Link>
        ))}
        <button onClick={handleLogout} className="mobile-nav-item logout">
          <span className="mobile-nav-icon">🚪</span>
          <span className="mobile-nav-label">Exit</span>
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="console-main">
        <div className="console-scroll-container">
          <Outlet />
        </div>
      </main>

      <style>{`
        .admin-console-layout { display: flex; height: 100vh; background: var(--bg-primary); overflow: hidden; }
        
        .mobile-admin-header { display: none; }
        .mobile-bottom-nav { display: none; }

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
          .console-sidebar { width: 85px; padding: 2rem 1rem; align-items: center; }
          .brand-titles, .nav-label, .terminate-btn .label { display: none; }
          .nav-item { justify-content: center; padding: 1.25rem; }
          .sidebar-brand { margin-bottom: 3rem; }
        }

        @media (max-width: 768px) {
          .admin-console-layout { flex-direction: column; }
          .console-sidebar { display: none; }
          
          .mobile-admin-header { 
            display: flex; align-items: center; gap: 1rem; padding: 1rem 1.5rem; 
            background: var(--bg-card); border-bottom: 1px solid var(--border); 
            backdrop-filter: blur(10px); position: sticky; top: 0; z-index: 100;
          }
          .mobile-admin-header .brand-logo { width: 32px; height: 32px; font-size: 1.1rem; }
          .mobile-admin-header .main-brand { font-size: 0.9rem; letter-spacing: 0; }

          .console-main { padding-bottom: 80px; }
          .console-scroll-container { padding: 1.5rem; }

          .mobile-bottom-nav { 
            display: flex; position: fixed; bottom: 0; left: 0; right: 0; 
            background: var(--bg-card); border-top: 1px solid var(--border); 
            backdrop-filter: blur(20px); padding: 0.75rem 1rem; z-index: 200;
            justify-content: space-around;
          }
          .mobile-nav-item { 
            display: flex; flex-direction: column; align-items: center; gap: 0.25rem; 
            text-decoration: none; color: var(--text-muted); font-size: 0.65rem; 
            font-weight: 800; text-transform: uppercase; letter-spacing: 1px;
            position: relative; padding: 0.5rem; flex: 1;
          }
          .mobile-nav-item.active { color: var(--accent-blue); }
          .mobile-nav-icon { font-size: 1.2rem; }
          .mobile-nav-pill { 
            position: absolute; top: -0.75rem; left: 50%; transform: translateX(-50%); 
            width: 40px; height: 3px; background: var(--accent-blue); border-radius: 0 0 4px 4px; 
          }
          .mobile-nav-item.logout { color: #f43f5e; border: none; background: transparent; }
        }
      `}</style>
    </div>
  );
}
