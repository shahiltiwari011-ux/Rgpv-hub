import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useMemo } from 'react';
import { getResources, deleteResource } from '../services/api';
import { LoadingSpinner, EmptyState } from '../components/States';
import { RESOURCE_TYPES } from '../utils/constants';
import SEO from '../components/SEO';
import OfflineBanner from '../components/OfflineBanner';
import { MOCK_RESOURCES } from '../data/mockResources';
import { motion, AnimatePresence } from 'framer-motion';

export default function Admin () {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('notes');
  const [items, setItems] = useState([]);
  const [isPending, setIsPending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMock, setIsMock] = useState(false);

  useEffect(() => { fetchItems(); }, [activeTab]);

  async function fetchItems () {
    setIsPending(true);
    try {
      const result = await getResources({ type: activeTab, limit: 100 });
      setItems(result.data);
      setIsMock(false);
    } catch (err) {
      console.warn('Admin fetch failed, using mock data');
      setItems(MOCK_RESOURCES.filter(r => r.type === activeTab));
      setIsMock(true);
    } finally {
      setIsPending(false);
    }
  }

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const s = searchTerm.toLowerCase().trim();
    return items.filter(item => 
      item.title?.toLowerCase().includes(s) || 
      item.subject?.toLowerCase().includes(s) ||
      item.branch?.toLowerCase().includes(s)
    );
  }, [items, searchTerm]);

  async function handleDelete (id) {
    if (!window.confirm('Are you sure you want to delete this resource?')) return;
    try {
      await deleteResource(id);
      fetchItems();
      // Using toast would be better but keeping consistency with existing alert if toast not imported
      window.alert('Resource deleted successfully.');
    } catch (err) {
      window.alert('Delete failed: ' + err.message);
    }
  }

  if (authLoading) return <LoadingSpinner text='Verifying access…' />;
  if (!user || !isAdmin) return <Navigate to='/' replace />;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 }
  };

  return (
    <div className="admin-dashboard-container">
      <SEO
        title='Admin Dashboard'
        description='Manage study hub resources safely via the secure Admin Panel.'
        urlPath='/admin'
      />
      
      <div className="ambient-background"></div>
      <OfflineBanner isMock={isMock} onRetry={fetchItems} />

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="page-hero-premium admin-hero"
      >
        <div className="hero-icon-blob">🛡️</div>
        <h1 className="page-hero-title">Admin <span>Control</span></h1>
        <p className="page-hero-sub">Infrastructure Control & Resource Management</p>
      </motion.div>

      <section className="admin-content">
        <div className="admin-toolbar">
          <div className="toolbar-left">
             <div className="premium-tab-group">
               {RESOURCE_TYPES.map((t) => (
                 <button 
                  key={t} 
                  className={`premium-tab ${activeTab === t ? 'active' : ''}`} 
                  onClick={() => setActiveTab(t)}
                 >
                    {activeTab === t && (
                      <motion.div layoutId="admin-tab-bg" className="tab-active-bg" />
                    )}
                    <span className="tab-text">{t.charAt(0).toUpperCase() + t.slice(1)}</span>
                 </button>
               ))}
             </div>
             <div className="search-input-wrapper">
                <span className="search-icon">🔍</span>
                <input 
                  type="text"
                  placeholder="Filter resources..."
                  className="premium-input"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
             </div>
          </div>
          
          <div className="toolbar-right">
            <Link to='/admin/analytics' className="btn-secondary-premium">
              📊 Stats
            </Link>
            <Link to='/admin/upload' className="btn-primary-premium">
              ➕ New Resource
            </Link>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isPending ? (
            <motion.div 
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <LoadingSpinner text={`Fetching ${activeTab}…`} />
            </motion.div>
          ) : items.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <EmptyState
                icon='📦'
                title='No resources found'
                message={`You haven't uploaded any ${activeTab} yet.`}
              />
            </motion.div>
          ) : (
            <motion.div 
              key="list"
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="admin-list-container"
            >
              <div className="list-header">
                <span>RESOURCE INFO</span>
                <span>BRANCH / SEM</span>
                <span>CREATED ON</span>
                <span className="text-right">ACTIONS</span>
              </div>
              
              {filteredItems.map((item) => (
                <motion.div
                  key={item.id}
                  variants={itemVariants}
                  className="admin-row-card glass-panel"
                >
                  <div className="row-main">
                    <div className="row-icon-box">
                      {activeTab === 'notes' ? '📝' : activeTab === 'pyq' ? '📄' : '📋'}
                    </div>
                    <div className="row-text">
                      <strong className="row-title">{item.title}</strong>
                      <span className="row-subtitle">{item.subject || 'Generic Subject'}</span>
                    </div>
                  </div>

                  <div className="row-meta">
                    <span className="meta-branch">{item.branch}</span>
                    <span className="meta-sem">Sem {item.semester}</span>
                  </div>

                  <div className="row-date">
                    {new Date(item.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>

                  <div className="row-actions">
                    <a href={item.file_url} target='_blank' rel='noreferrer' className="action-btn-view">
                      View
                    </a>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={isMock}
                      className="action-btn-delete"
                    >
                      Delete
                    </button>
                  </div>
                </motion.div>
              ))}
              
              {filteredItems.length === 0 && (
                 <div className="no-matches">
                   <span className="no-matches-icon">🔍</span>
                   <p>No matches for "{searchTerm}"</p>
                 </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <style>{`
        .admin-dashboard-container { min-height: 100vh; background: var(--bg-primary); padding-bottom: 6rem; position: relative; overflow-x: hidden; }
        .ambient-background { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.05) 0%, transparent 40%); pointer-events: none; }
        
        .admin-hero { padding: 6rem 1rem 4rem; }
        .admin-hero span { color: var(--accent-blue); }
        
        .admin-content { max-width: 1200px; margin: 0 auto; padding: 0 1.5rem; position: relative; z-index: 10; }
        
        .admin-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 3rem; gap: 2rem; flex-wrap: wrap; }
        .toolbar-left { display: flex; gap: 1.5rem; flex-wrap: wrap; align-items: center; }
        
        .premium-tab-group { display: flex; background: var(--bg-card); padding: 0.4rem; border-radius: 1.25rem; border: 1px solid var(--border); backdrop-filter: blur(10px); }
        .premium-tab { position: relative; padding: 0.7rem 1.5rem; border: none; background: transparent; color: var(--text-muted); font-weight: 700; cursor: pointer; border-radius: 0.9rem; transition: 0.3s; }
        .premium-tab.active { color: #fff; }
        .tab-active-bg { position: absolute; inset: 0; background: var(--accent-blue); border-radius: 0.9rem; z-index: 0; }
        .tab-text { position: relative; z-index: 1; }

        .search-input-wrapper { position: relative; min-width: 280px; }
        .search-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); opacity: 0.4; }
        .premium-input { width: 100%; background: var(--bg-card); border: 1px solid var(--border); border-radius: 1rem; padding: 0.8rem 1rem 0.8rem 2.8rem; color: var(--text-primary); font-weight: 600; outline: none; transition: 0.3s; }
        .premium-input:focus { border-color: var(--accent-blue); box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }

        .toolbar-right { display: flex; gap: 1rem; }
        .btn-primary-premium, .btn-secondary-premium { padding: 0.9rem 1.5rem; border-radius: 1rem; font-weight: 800; text-decoration: none; transition: 0.3s; font-size: 0.9rem; }
        .btn-primary-premium { background: var(--accent-blue); color: #fff; box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3); }
        .btn-primary-premium:hover { transform: translateY(-3px); box-shadow: 0 15px 30px rgba(59, 130, 246, 0.4); }
        .btn-secondary-premium { background: var(--bg-card); border: 1px solid var(--border); color: var(--text-primary); }
        .btn-secondary-premium:hover { background: var(--bg-secondary); border-color: var(--text-muted); }

        .admin-list-container { display: flex; flex-direction: column; gap: 1rem; }
        .list-header { display: grid; grid-template-columns: 3fr 1.5fr 1fr 180px; gap: 1.5rem; padding: 0 1.5rem; font-size: 0.7rem; font-weight: 900; color: var(--text-muted); letter-spacing: 2px; }
        @media (max-width: 900px) { .list-header { display: none; } }

        .admin-row-card { display: grid; grid-template-columns: 3fr 1.5fr 1fr 180px; gap: 1.5rem; align-items: center; padding: 1.25rem 1.5rem; transition: 0.3s; }
        .admin-row-card:hover { border-color: var(--accent-blue); transform: scale(1.005); }

        .row-main { display: flex; align-items: center; gap: 1.25rem; }
        .row-icon-box { width: 45px; height: 45px; background: rgba(59, 130, 246, 0.1); border-radius: 0.9rem; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; flex-shrink: 0; }
        .row-text { overflow: hidden; display: flex; flex-direction: column; gap: 0.2rem; }
        .row-title { font-size: 1rem; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-family: 'Syne', sans-serif; }
        .row-subtitle { font-size: 0.75rem; color: var(--accent-blue); font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }

        .row-meta { display: flex; flex-direction: column; gap: 0.25rem; }
        .meta-branch { font-size: 0.85rem; font-weight: 700; color: var(--text-secondary); }
        .meta-sem { font-size: 0.75rem; color: var(--text-muted); font-weight: 600; }

        .row-date { font-size: 0.8rem; color: var(--text-muted); font-weight: 600; }

        .row-actions { display: flex; gap: 0.75rem; justify-content: flex-end; }
        .action-btn-view, .action-btn-delete { padding: 0.6rem 1rem; border-radius: 0.75rem; font-size: 0.75rem; font-weight: 800; cursor: pointer; transition: 0.3s; text-decoration: none; border: none; }
        .action-btn-view { background: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border); }
        .action-btn-view:hover { background: var(--bg-primary); border-color: var(--text-muted); }
        .action-btn-delete { background: rgba(239, 68, 68, 0.1); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.2); }
        .action-btn-delete:hover:not(:disabled) { background: #ef4444; color: #fff; border-color: #ef4444; }
        .action-btn-delete:disabled { opacity: 0.3; cursor: not-allowed; }

        @media (max-width: 900px) {
          .admin-row-card { grid-template-columns: 1fr; gap: 1rem; padding: 1.5rem; }
          .row-actions { justify-content: flex-start; margin-top: 0.5rem; }
          .row-meta, .row-date { flex-direction: row; gap: 1rem; align-items: center; }
        }

        .no-matches { text-align: center; padding: 5rem 2rem; }
        .no-matches-icon { font-size: 3rem; opacity: 0.2; display: block; margin-bottom: 1rem; }
        .no-matches p { color: var(--text-muted); font-weight: 600; font-size: 1.1rem; }
      `}</style>
    </div>
  );
}
