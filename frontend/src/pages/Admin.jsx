import { useState, useEffect, useMemo } from 'react';
import { getResources, deleteResource } from '../services/api';
import { LoadingSpinner, EmptyState } from '../components/States';
import { RESOURCE_TYPES } from '../utils/constants';
import SEO from '../components/SEO';
import { MOCK_RESOURCES } from '../data/mockResources';
import { motion, AnimatePresence } from 'framer-motion';

export default function Admin () {
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
    if (!window.confirm('Delete this resource?')) return;
    try {
      await deleteResource(id);
      fetchItems();
    } catch (err) {
      alert('Delete failed');
    }
  }

  return (
    <div className="admin-manage-view">
      <SEO title='Admin - Manage Resources' />
      
      <div className="view-header">
        <h1 className="view-title">Manage <span>Database</span></h1>
        <p className="view-subtitle">Review, update, or remove assets from the production repository.</p>
      </div>

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
                  <span className="tab-text">{t.toUpperCase()}</span>
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
      </div>

      <AnimatePresence mode="wait">
        {isPending ? (
          <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <LoadingSpinner text={`Fetching ${activeTab}…`} />
          </motion.div>
        ) : items.length === 0 ? (
          <EmptyState icon='📦' title='No resources' message={`Empty ${activeTab} archive.`} />
        ) : (
          <motion.div 
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="admin-list-container"
          >
            <div className="list-header">
              <span>RESOURCE INFO</span>
              <span>BRANCH / SEM</span>
              <span className="text-right">ACTIONS</span>
            </div>
            
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
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

                <div className="row-actions">
                  <a href={item.file_url} target='_blank' rel='noreferrer' className="action-btn-view">
                    View
                  </a>
                  <button onClick={() => handleDelete(item.id)} disabled={isMock} className="action-btn-delete">
                    Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .admin-manage-view { max-width: 1200px; }
        .view-header { margin-bottom: 3rem; }
        .view-title { font-family: 'Syne', sans-serif; font-size: 2.5rem; font-weight: 800; margin: 0; }
        .view-title span { color: var(--accent-blue); }
        .view-subtitle { color: var(--text-muted); margin-top: 0.5rem; font-weight: 500; }

        .admin-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; gap: 2rem; }
        .toolbar-left { display: flex; gap: 1.5rem; align-items: center; flex-wrap: wrap; }
        
        .premium-tab-group { display: flex; background: var(--bg-card); padding: 0.3rem; border-radius: 1rem; border: 1px solid var(--border); }
        .premium-tab { position: relative; padding: 0.6rem 1.25rem; border: none; background: transparent; color: var(--text-muted); font-weight: 800; font-size: 0.75rem; cursor: pointer; border-radius: 0.75rem; transition: 0.3s; }
        .premium-tab.active { color: #fff; }
        .tab-active-bg { position: absolute; inset: 0; background: var(--accent-blue); border-radius: 0.75rem; z-index: 0; }
        .tab-text { position: relative; z-index: 1; }

        .search-input-wrapper { position: relative; min-width: 300px; }
        .search-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); opacity: 0.4; }
        .premium-input { width: 100%; background: var(--bg-card); border: 1px solid var(--border); border-radius: 1rem; padding: 0.75rem 1rem 0.75rem 2.8rem; color: var(--text-primary); font-weight: 600; outline: none; }
        .premium-input:focus { border-color: var(--accent-blue); }

        .admin-list-container { display: flex; flex-direction: column; gap: 0.75rem; }
        .list-header { display: grid; grid-template-columns: 3fr 1.5fr 150px; gap: 1.5rem; padding: 0 1.5rem; font-size: 0.7rem; font-weight: 900; color: var(--text-muted); letter-spacing: 2px; }
        
        .admin-row-card { display: grid; grid-template-columns: 3fr 1.5fr 150px; gap: 1.5rem; align-items: center; padding: 1.1rem 1.5rem; transition: 0.2s; }
        .admin-row-card:hover { border-color: var(--accent-blue); background: rgba(255,255,255,0.02); }

        .row-main { display: flex; align-items: center; gap: 1rem; }
        .row-icon-box { width: 40px; height: 40px; background: rgba(59, 130, 246, 0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; }
        .row-text { overflow: hidden; }
        .row-title { font-size: 0.95rem; color: var(--text-primary); display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-family: 'Syne', sans-serif; }
        .row-subtitle { font-size: 0.7rem; color: var(--accent-blue); font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }

        .row-meta { display: flex; flex-direction: column; }
        .meta-branch { font-size: 0.85rem; font-weight: 700; color: var(--text-secondary); }
        .meta-sem { font-size: 0.75rem; color: var(--text-muted); font-weight: 600; }

        .row-actions { display: flex; gap: 0.5rem; justify-content: flex-end; }
        .action-btn-view, .action-btn-delete { padding: 0.5rem 0.8rem; border-radius: 0.6rem; font-size: 0.7rem; font-weight: 800; cursor: pointer; transition: 0.2s; text-decoration: none; border: 1px solid var(--border); }
        .action-btn-view { background: var(--bg-secondary); color: var(--text-primary); }
        .action-btn-delete { background: rgba(239, 68, 68, 0.1); color: #f87171; border-color: rgba(239, 68, 68, 0.1); }
        .action-btn-delete:hover:not(:disabled) { background: #ef4444; color: #fff; }

        @media (max-width: 800px) {
          .admin-row-card { grid-template-columns: 1fr; gap: 1rem; padding: 1.25rem; }
          .row-actions { justify-content: flex-start; }
          .list-header { display: none; }
        }
      `}</style>
    </div>
  );
}
