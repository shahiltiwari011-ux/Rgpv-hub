import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import SEO from '../components/SEO';
import { LoadingSpinner } from '../components/States';

const MOCK_NOTICES = [
  {
    id: 'notice-1',
    title: 'TCS NQT Registration Open — Batch 2026',
    content: 'All eligible students are required to register for TCS NQT before the deadline. Carry your updated resume and ID proof.',
    published_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString()
  },
  {
    id: 'notice-2',
    title: 'Pre-Placement Talk: Infosys — 20th Oct 2026',
    content: 'Infosys will conduct a pre-placement talk on 20th October at 10:00 AM in the seminar hall. Attendance is mandatory for all registered students.',
    published_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString()
  },
  {
    id: 'notice-3',
    title: 'Resume Submission Deadline Extended',
    content: 'The deadline for submitting your updated resume to the TPO office has been extended to 25th October 2026. Submit in PDF format only.',
    published_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString()
  }
];

export default function TPONotices() {
  const { user } = useAuth();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    expires_at: ''
  });

  useEffect(() => {
    fetchNotices();
  }, []);

  async function fetchNotices() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('placement_notices')
        .select('*')
        .order('published_at', { ascending: false });

      if (error || !data || data.length === 0) {
        if (error) console.warn('Supabase notices fetch warning:', error);
        setNotices(MOCK_NOTICES);
      } else {
        setNotices(data);
      }
    } catch (err) {
      console.warn('Error fetching notices:', err);
      setNotices(MOCK_NOTICES);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const newNotice = {
      ...formData,
      id: 'notice-' + Date.now(),
      published_by: user?.id || 'demo-user',
      published_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    const { error } = await supabase.from('placement_notices').insert([
      { ...formData, published_by: user?.id }
    ]);

    if (error) {
      console.warn('DB notice insert error, saving locally:', error);
      setNotices(prev => [newNotice, ...prev]);
      toast.success('Notice published (Demo Mode)');
    } else {
      toast.success('Notice published successfully');
      fetchNotices();
    }
    setShowForm(false);
    setFormData({ title: '', content: '', expires_at: '' });
  }

  async function handleDelete(id) {
    const { error } = await supabase.from('placement_notices').delete().eq('id', id);
    if (error) {
      console.warn('Delete error, removing locally:', error);
      setNotices(prev => prev.filter(n => n.id !== id));
      toast.success('Notice removed (Demo Mode)');
    } else {
      toast.success('Notice deleted');
      fetchNotices();
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  return (
    <div className="projectx-tpo-crud">
      <SEO title="Publish Notices | TPO Portal" />
      <div className="home-mesh-bg"></div>
      
      <div className="crud-container">
        <header className="crud-header">
          <h2>Placement Notices</h2>
          <button className="btn-glow-blue" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ New Notice'}
          </button>
        </header>

        {showForm && (
          <motion.form initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit} className="glass-form notice-form">
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Notice Title</label>
              <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="E.g., TCS NQT Registration Open" />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Content / Description</label>
              <textarea required rows={5} value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} placeholder="Full notice content..."></textarea>
            </div>
            <div className="form-group">
              <label>Expires On (Optional)</label>
              <input type="date" value={formData.expires_at} onChange={e => setFormData({...formData, expires_at: e.target.value})} />
            </div>
            <button type="submit" className="btn-glow-blue" style={{ gridColumn: '1 / -1' }}>Publish Notice</button>
          </motion.form>
        )}

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="notice-list">
            {notices.map(n => (
              <motion.div key={n.id} className="notice-card glass" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="notice-card-header">
                  <div className="notice-icon">📢</div>
                  <div className="notice-meta">
                    <h3>{n.title}</h3>
                    <div className="notice-dates">
                      <span>📅 Published: {formatDate(n.published_at)}</span>
                      {n.expires_at && <span>⏳ Expires: {formatDate(n.expires_at)}</span>}
                    </div>
                  </div>
                </div>
                <p className="notice-content">{n.content}</p>
                <div className="notice-actions">
                  <button className="btn-delete" onClick={() => handleDelete(n.id)}>Delete</button>
                </div>
              </motion.div>
            ))}
            {notices.length === 0 && <p className="empty-state">No notices published yet.</p>}
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
        .form-group input, .form-group textarea { padding: 0.8rem; background: rgba(0,0,0,0.2); border: 1px solid var(--border); border-radius: 0.75rem; color: var(--text-primary); outline: none; transition: 0.3s; font-size: 0.95rem; }
        .form-group input:focus, .form-group textarea:focus { border-color: var(--accent-blue); box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }

        .notice-list { display: flex; flex-direction: column; gap: 1.5rem; }
        .notice-card { padding: 2rem; border-radius: 1.5rem; border: 1px solid var(--border); background: var(--bg-card); transition: 0.3s; }
        .notice-card:hover { border-color: rgba(245, 158, 11, 0.4); box-shadow: 0 12px 32px rgba(245, 158, 11, 0.08); }
        
        .notice-card-header { display: flex; gap: 1.25rem; align-items: flex-start; margin-bottom: 1rem; }
        .notice-icon { width: 48px; height: 48px; background: rgba(245, 158, 11, 0.1); border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; flex-shrink: 0; }
        .notice-meta h3 { font-size: 1.2rem; font-weight: 700; margin: 0 0 0.5rem 0; line-height: 1.3; }
        .notice-dates { display: flex; gap: 1.5rem; flex-wrap: wrap; }
        .notice-dates span { font-size: 0.8rem; color: var(--text-muted); font-weight: 600; }
        
        .notice-content { color: var(--text-secondary); font-size: 0.95rem; line-height: 1.7; margin: 0; padding-top: 0.5rem; border-top: 1px solid rgba(255,255,255,0.04); }
        
        .notice-actions { display: flex; justify-content: flex-end; margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.04); }
        .btn-delete { background: rgba(244, 63, 94, 0.1); color: #f43f5e; border: 1px solid rgba(244, 63, 94, 0.2); padding: 0.5rem 1.25rem; border-radius: 0.75rem; font-weight: 700; font-size: 0.8rem; cursor: pointer; transition: 0.3s; }
        .btn-delete:hover { background: rgba(244, 63, 94, 0.2); border-color: #f43f5e; }
        
        .empty-state { text-align: center; padding: 4rem; color: var(--text-muted); font-size: 1.1rem; border: 1px dashed var(--border); border-radius: 1rem; }
      `}</style>
    </div>
  );
}
