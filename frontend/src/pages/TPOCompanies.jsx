import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import SEO from '../components/SEO';
import { LoadingSpinner } from '../components/States';
import { MOCK_COMPANIES } from '../data/mockPlacements';

export default function TPOCompanies() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    location: '',
    website: '',
    description: ''
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  async function fetchCompanies() {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('companies').select('*').order('created_at', { ascending: false });
      if (error || !data || data.length === 0) {
        if (error) console.warn('Supabase companies fetch warning:', error);
        setCompanies(MOCK_COMPANIES);
      } else {
        setCompanies(data);
      }
    } catch (err) {
      console.warn('Error fetching companies:', err);
      setCompanies(MOCK_COMPANIES);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const newComp = { ...formData, id: 'comp-' + Date.now(), created_by: user?.id || 'demo-user', created_at: new Date().toISOString() };
    const { error } = await supabase.from('companies').insert([
      { ...formData, created_by: user?.id }
    ]);
    if (error) {
      console.warn('DB insert error, saving locally:', error);
      setCompanies(prev => [newComp, ...prev]);
      toast.success('Company added (Demo Mode)');
    } else {
      toast.success('Company added successfully');
      fetchCompanies();
    }
    setShowForm(false);
    setFormData({ name: '', industry: '', location: '', website: '', description: '' });
  }

  return (
    <div className="projectx-tpo-crud">
      <SEO title="Manage Companies | TPO Portal" />
      <div className="home-mesh-bg"></div>
      
      <div className="crud-container">
        <header className="crud-header">
          <h2>Manage Companies</h2>
          <button className="btn-glow-blue" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Add Company'}
          </button>
        </header>

        {showForm && (
          <motion.form initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit} className="glass-form">
            <div className="form-group">
              <label>Company Name</label>
              <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="E.g., Google" />
            </div>
            <div className="form-group">
              <label>Industry</label>
              <input required value={formData.industry} onChange={e => setFormData({...formData, industry: e.target.value})} placeholder="E.g., IT / Software" />
            </div>
            <div className="form-group">
              <label>Location</label>
              <input required value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="E.g., Bangalore, India" />
            </div>
            <div className="form-group">
              <label>Website</label>
              <input type="url" value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} placeholder="https://..." />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Description</label>
              <textarea rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Brief company overview..."></textarea>
            </div>
            <button type="submit" className="btn-glow-blue" style={{ gridColumn: '1 / -1' }}>Save Company</button>
          </motion.form>
        )}

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="crud-list">
            {companies.map(c => (
              <div key={c.id} className="crud-card glass">
                <h3>{c.name}</h3>
                <span className="badge">{c.industry}</span>
                <p>{c.location}</p>
                <p className="desc">{c.description?.substring(0, 100)}...</p>
              </div>
            ))}
            {companies.length === 0 && <p className="empty-state">No companies added yet.</p>}
          </div>
        )}
      </div>

      <style>{`
        .projectx-tpo-crud { min-height: 100vh; background: var(--bg-primary); color: var(--text-primary); padding: clamp(8rem, 11vw, 9.5rem) var(--container-px) 4rem; position: relative; }
        .crud-container { max-width: 1000px; margin: 0 auto; position: relative; z-index: 10; }
        .crud-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; }
        .crud-header h2 { font-family: 'Syne', sans-serif; font-size: 2rem; }
        .btn-glow-blue { padding: 0.75rem 1.5rem; background: var(--accent-blue); color: #fff; border: none; border-radius: 1rem; cursor: pointer; font-weight: bold; transition: 0.3s; }
        .glass-form { background: var(--bg-card); border: 1px solid var(--border); padding: 2rem; border-radius: 1.5rem; display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 3rem; backdrop-filter: blur(10px); }
        .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
        .form-group label { font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; }
        .form-group input, .form-group textarea { padding: 0.8rem; background: rgba(0,0,0,0.2); border: 1px solid var(--border); border-radius: 0.5rem; color: var(--text-primary); outline: none; transition: 0.3s; }
        .form-group input:focus, .form-group textarea:focus { border-color: var(--accent-blue); }
        .crud-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
        .crud-card { padding: 1.5rem; border-radius: 1.25rem; border: 1px solid var(--border); }
        .crud-card h3 { margin: 0 0 0.5rem 0; font-size: 1.25rem; }
        .badge { display: inline-block; padding: 0.25rem 0.75rem; background: rgba(59, 130, 246, 0.1); color: var(--accent-blue); border-radius: 2rem; font-size: 0.75rem; font-weight: bold; margin-bottom: 1rem; }
        .desc { color: var(--text-secondary); font-size: 0.9rem; line-height: 1.5; margin-top: 0.5rem; }
        .empty-state { grid-column: 1 / -1; text-align: center; padding: 4rem; color: var(--text-muted); font-size: 1.1rem; border: 1px dashed var(--border); border-radius: 1rem; }
      `}</style>
    </div>
  );
}
