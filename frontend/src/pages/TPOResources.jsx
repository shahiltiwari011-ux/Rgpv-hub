import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import SEO from '../components/SEO';
import { LoadingSpinner } from '../components/States';

const CATEGORIES = ['Resume Templates', 'Interview Prep', 'Aptitude Material', 'HR Questions', 'GD Topics', 'Company Guides', 'Other'];

const MOCK_RESOURCES = [
  {
    id: 'res-1',
    title: 'Complete Aptitude Preparation Guide',
    description: 'Comprehensive guide covering quantitative aptitude, logical reasoning, and verbal ability for placement exams.',
    category: 'Aptitude Material',
    file_url: '#',
    created_at: new Date().toISOString()
  },
  {
    id: 'res-2',
    title: 'Resume Template — Engineering Freshers 2026',
    description: 'ATS-friendly, single-page resume template tailored for diploma and engineering graduates.',
    category: 'Resume Templates',
    file_url: '#',
    created_at: new Date().toISOString()
  },
  {
    id: 'res-3',
    title: 'Top 50 HR Interview Questions & Answers',
    description: 'Most commonly asked HR interview questions with model answers, tips, and dos/don\'ts for campus placements.',
    category: 'HR Questions',
    file_url: '#',
    created_at: new Date().toISOString()
  }
];

export default function TPOResources() {
  const { user } = useAuth();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    file_url: ''
  });

  useEffect(() => {
    fetchResources();
  }, []);

  async function fetchResources() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('placement_resources')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        if (error) console.warn('Supabase resources fetch warning:', error);
        setResources(MOCK_RESOURCES);
      } else {
        setResources(data);
      }
    } catch (err) {
      console.warn('Error fetching resources:', err);
      setResources(MOCK_RESOURCES);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const newRes = {
      ...formData,
      id: 'res-' + Date.now(),
      created_by: user?.id || 'demo-user',
      created_at: new Date().toISOString()
    };

    const { error } = await supabase.from('placement_resources').insert([
      { ...formData, created_by: user?.id }
    ]);

    if (error) {
      console.warn('DB resource insert error, saving locally:', error);
      setResources(prev => [newRes, ...prev]);
      toast.success('Resource added (Demo Mode)');
    } else {
      toast.success('Resource published successfully');
      fetchResources();
    }
    setShowForm(false);
    setFormData({ title: '', description: '', category: '', file_url: '' });
  }

  async function handleDelete(id) {
    const { error } = await supabase.from('placement_resources').delete().eq('id', id);
    if (error) {
      console.warn('Delete error, removing locally:', error);
      setResources(prev => prev.filter(r => r.id !== id));
      toast.success('Resource removed (Demo Mode)');
    } else {
      toast.success('Resource deleted');
      fetchResources();
    }
  }

  const categoryIcon = (cat) => {
    const icons = {
      'Resume Templates': '📄',
      'Interview Prep': '🎯',
      'Aptitude Material': '🧮',
      'HR Questions': '💬',
      'GD Topics': '🗣️',
      'Company Guides': '🏢',
      'Other': '📚'
    };
    return icons[cat] || '📚';
  };

  return (
    <div className="projectx-tpo-crud">
      <SEO title="Manage Resources | TPO Portal" />
      <div className="home-mesh-bg"></div>
      
      <div className="crud-container">
        <header className="crud-header">
          <h2>Placement Resources</h2>
          <button className="btn-glow-blue" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Add Resource'}
          </button>
        </header>

        {showForm && (
          <motion.form initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit} className="glass-form">
            <div className="form-group">
              <label>Resource Title</label>
              <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="E.g., Aptitude Prep Guide" />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                <option value="">Select category...</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Description</label>
              <textarea rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Brief description of the resource..."></textarea>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>File URL / Link</label>
              <input type="url" value={formData.file_url} onChange={e => setFormData({...formData, file_url: e.target.value})} placeholder="https://drive.google.com/..." />
            </div>
            <button type="submit" className="btn-glow-blue" style={{ gridColumn: '1 / -1' }}>Publish Resource</button>
          </motion.form>
        )}

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="resource-grid">
            {resources.map(r => (
              <motion.div key={r.id} className="resource-card glass" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="resource-icon">{categoryIcon(r.category)}</div>
                <span className="resource-cat-badge">{r.category || 'General'}</span>
                <h3>{r.title}</h3>
                <p className="resource-desc">{r.description?.substring(0, 120)}{r.description?.length > 120 ? '...' : ''}</p>
                <div className="resource-footer">
                  {r.file_url && r.file_url !== '#' && (
                    <a href={r.file_url} target="_blank" rel="noopener noreferrer" className="btn-download">📥 Download</a>
                  )}
                  <button className="btn-delete-sm" onClick={() => handleDelete(r.id)}>🗑️</button>
                </div>
              </motion.div>
            ))}
            {resources.length === 0 && <p className="empty-state">No placement resources uploaded yet.</p>}
          </div>
        )}
      </div>

      <style>{`
        .projectx-tpo-crud { min-height: 100vh; background: var(--bg-primary); color: var(--text-primary); padding: clamp(8rem, 11vw, 9.5rem) var(--container-px) 4rem; position: relative; }
        .crud-container { max-width: 1000px; margin: 0 auto; position: relative; z-index: 10; }
        .crud-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; }
        .crud-header h2 { font-family: 'Syne', sans-serif; font-size: 2rem; }
        .btn-glow-blue { padding: 0.75rem 1.5rem; background: var(--accent-blue); color: #fff; border: none; border-radius: 1rem; cursor: pointer; font-weight: bold; transition: 0.3s; }
        .btn-glow-blue:hover { background: #2563eb; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3); }

        .glass-form { background: var(--bg-card); border: 1px solid var(--border); padding: 2rem; border-radius: 1.5rem; display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 3rem; backdrop-filter: blur(10px); }
        @media (max-width: 640px) { .glass-form { grid-template-columns: 1fr; } }
        .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
        .form-group label { font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }
        .form-group input, .form-group textarea, .form-group select { padding: 0.8rem; background: rgba(0,0,0,0.2); border: 1px solid var(--border); border-radius: 0.75rem; color: var(--text-primary); outline: none; transition: 0.3s; font-size: 0.95rem; }
        .form-group input:focus, .form-group textarea:focus, .form-group select:focus { border-color: var(--accent-blue); box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
        .form-group select { appearance: none; cursor: pointer; }

        .resource-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
        .resource-card { padding: 1.75rem; border-radius: 1.5rem; border: 1px solid var(--border); background: var(--bg-card); display: flex; flex-direction: column; gap: 0.75rem; transition: 0.3s; }
        .resource-card:hover { transform: translateY(-4px); border-color: rgba(59, 130, 246, 0.4); box-shadow: 0 16px 40px rgba(59, 130, 246, 0.08); }
        
        .resource-icon { width: 50px; height: 50px; background: rgba(59, 130, 246, 0.1); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
        .resource-cat-badge { display: inline-block; width: fit-content; padding: 0.25rem 0.85rem; background: rgba(139, 92, 246, 0.1); color: #8b5cf6; border-radius: 2rem; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
        .resource-card h3 { font-size: 1.15rem; font-weight: 700; margin: 0; line-height: 1.3; }
        .resource-desc { color: var(--text-secondary); font-size: 0.9rem; line-height: 1.6; margin: 0; flex: 1; }
        
        .resource-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.04); margin-top: auto; }
        .btn-download { padding: 0.5rem 1rem; background: rgba(59, 130, 246, 0.1); color: var(--accent-blue); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 0.75rem; font-weight: 700; font-size: 0.8rem; text-decoration: none; transition: 0.3s; }
        .btn-download:hover { background: rgba(59, 130, 246, 0.2); border-color: var(--accent-blue); }
        .btn-delete-sm { background: rgba(244, 63, 94, 0.1); color: #f43f5e; border: 1px solid rgba(244, 63, 94, 0.15); width: 36px; height: 36px; border-radius: 10px; cursor: pointer; font-size: 1rem; display: flex; align-items: center; justify-content: center; transition: 0.3s; }
        .btn-delete-sm:hover { background: rgba(244, 63, 94, 0.2); border-color: #f43f5e; }
        
        .empty-state { grid-column: 1 / -1; text-align: center; padding: 4rem; color: var(--text-muted); font-size: 1.1rem; border: 1px dashed var(--border); border-radius: 1rem; }
      `}</style>
    </div>
  );
}
