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
        html, body { overflow-x: hidden; max-width: 100vw; }
        .admin-console-layout { 
          display: flex; 
          flex-direction: row;
          height: 100vh; 
          height: 100dvh;
          width: 100vw;
          max-width: 100vw;
          background: var(--bg-primary); 
          overflow: hidden; 
          position: relative;
        }
        
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

        .console-main { 
          flex: 1; 
          min-width: 0;
          position: relative; 
          overflow: hidden; 
          background: radial-gradient(circle at 100% 0%, rgba(59, 130, 246, 0.05) 0%, transparent 40%); 
        }
        .console-scroll-container { height: 100%; overflow-y: auto; overflow-x: hidden; padding: 3rem; }

        @media (max-width: 1024px) {
          .console-sidebar { width: 85px; padding: 1.5rem 0.75rem; align-items: center; }
          .brand-titles, .nav-label, .terminate-btn .label { display: none; }
          .nav-item { justify-content: center; padding: 1.25rem; width: 50px; height: 50px; }
          .sidebar-brand { margin-bottom: 2rem; justify-content: center; }
          .sidebar-footer { padding: 1rem 0; }
          .terminate-btn { padding: 1rem; justify-content: center; width: 50px; }
        }

        @media (max-width: 900px) {
          .admin-console-layout { 
            flex-direction: column !important; 
            height: 100vh; 
            height: 100dvh;
            width: 100vw;
          }
          .console-sidebar { display: none !important; width: 0 !important; }
          
          .mobile-admin-header { 
            display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1.25rem; 
            background: var(--bg-card); border-bottom: 1px solid var(--border); 
            backdrop-filter: blur(20px); position: sticky; top: 0; z-index: 100;
            flex-shrink: 0;
          }
          .mobile-admin-header .brand-logo { width: 32px; height: 32px; font-size: 1.1rem; }
          .mobile-admin-header .main-brand { font-size: 0.85rem; font-weight: 800; }

          .console-main { 
            flex: 1; 
            width: 100% !important; 
            max-width: 100vw !important;
            min-width: 0 !important; 
            padding-bottom: 80px; 
            overflow-x: hidden; 
            overflow-y: auto;
          }
          .console-scroll-container { 
            height: auto; 
            overflow-y: visible; 
            padding: 1.25rem; 
            width: 100%; 
            max-width: 100vw; 
            overflow-x: hidden; 
          }

          .mobile-bottom-nav { 
            display: flex; position: fixed; bottom: 0; left: 0; right: 0; 
            background: var(--bg-card); border-top: 1px solid var(--border); 
            backdrop-filter: blur(20px); padding: 0.75rem 0.5rem; z-index: 200;
            justify-content: space-around;
            box-shadow: 0 -10px 20px rgba(0,0,0,0.2);
          }
          .mobile-nav-item { 
            display: flex; flex-direction: column; align-items: center; gap: 0.2rem; 
            text-decoration: none; color: var(--text-muted); font-size: 0.6rem; 
            font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;
            position: relative; padding: 0.5rem; flex: 1; min-width: 0;
          }
          .mobile-nav-item.active { color: var(--accent-blue); }
          .mobile-nav-icon { font-size: 1.2rem; }
          .mobile-nav-pill { 
            position: absolute; top: -0.75rem; left: 50%; transform: translateX(-50%); 
            width: 30px; height: 3px; background: var(--accent-blue); border-radius: 0 0 4px 4px; 
            box-shadow: 0 2px 10px var(--accent-blue);
          }
          .mobile-nav-item.logout { color: #f43f5e; border: none; background: transparent; }
        }
      `}</style>
    </div>
  );
}
