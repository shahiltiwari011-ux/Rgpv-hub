import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import SEO from '../components/SEO';
import { LoadingSpinner } from '../components/States';

const MOCK_PACKAGES = [
  { id: 'pkg-1', year: '2025', highest: '45 LPA', average: '8.5 LPA', total_offers: 450, top_recruiters: 'Amazon, TCS, Infosys' },
  { id: 'pkg-2', year: '2024', highest: '42 LPA', average: '7.8 LPA', total_offers: 410, top_recruiters: 'Microsoft, Wipro, Cognizant' },
  { id: 'pkg-3', year: '2023', highest: '35 LPA', average: '6.5 LPA', total_offers: 380, top_recruiters: 'TCS, Accenture, IBM' }
];

export default function TPOPackages() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    year: '',
    highest: '',
    average: '',
    total_offers: '',
    top_recruiters: ''
  });

  useEffect(() => {
    fetchPackages();
  }, []);

  async function fetchPackages() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('placement_packages')
        .select('*')
        .order('year', { ascending: false });

      if (error || !data || data.length === 0) {
        if (error) console.warn('Supabase packages fetch warning:', error);
        const local = localStorage.getItem('tpo_packages_data');
        setPackages(local ? JSON.parse(local) : MOCK_PACKAGES);
      } else {
        setPackages(data);
      }
    } catch (err) {
      console.warn('Error fetching packages:', err);
      const local = localStorage.getItem('tpo_packages_data');
      setPackages(local ? JSON.parse(local) : MOCK_PACKAGES);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const newPkg = {
      ...formData,
      id: 'pkg-' + Date.now(),
      total_offers: parseInt(formData.total_offers) || 0,
      created_at: new Date().toISOString()
    };

    const { error } = await supabase.from('placement_packages').insert([
      { ...formData, total_offers: parseInt(formData.total_offers) || 0 }
    ]);

    if (error) {
      console.warn('DB package insert error, saving locally:', error);
      const updated = [newPkg, ...packages];
      setPackages(updated);
      localStorage.setItem('tpo_packages_data', JSON.stringify(updated));
      toast.success('Package record added (Demo Mode)');
    } else {
      toast.success('Placement package stats updated');
      fetchPackages();
    }
    setShowForm(false);
    setFormData({ year: '', highest: '', average: '', total_offers: '', top_recruiters: '' });
  }

  async function handleDelete(id) {
    const { error } = await supabase.from('placement_packages').delete().eq('id', id);
    if (error) {
      console.warn('Delete error, removing locally:', error);
      const updated = packages.filter(p => p.id !== id);
      setPackages(updated);
      localStorage.setItem('tpo_packages_data', JSON.stringify(updated));
      toast.success('Package record deleted (Demo Mode)');
    } else {
      toast.success('Package record removed');
      fetchPackages();
    }
  }

  return (
    <div className="projectx-tpo-crud">
      <SEO title="Update Packages | TPO Portal" />
      <div className="home-mesh-bg"></div>
      
      <div className="crud-container">
        <header className="crud-header">
          <h2>Placement Package Statistics</h2>
          <button className="btn-glow-blue" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Add Batch Stats'}
          </button>
        </header>

        {showForm && (
          <motion.form initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit} className="glass-form">
            <div className="form-group">
              <label>Batch Year</label>
              <input required value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} placeholder="E.g., 2026" />
            </div>
            <div className="form-group">
              <label>Highest Package</label>
              <input required value={formData.highest} onChange={e => setFormData({...formData, highest: e.target.value})} placeholder="E.g., 48 LPA" />
            </div>
            <div className="form-group">
              <label>Average Package</label>
              <input required value={formData.average} onChange={e => setFormData({...formData, average: e.target.value})} placeholder="E.g., 9.2 LPA" />
            </div>
            <div className="form-group">
              <label>Total Offers</label>
              <input type="number" required value={formData.total_offers} onChange={e => setFormData({...formData, total_offers: e.target.value})} placeholder="E.g., 480" />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Top Recruiters</label>
              <input required value={formData.top_recruiters} onChange={e => setFormData({...formData, top_recruiters: e.target.value})} placeholder="E.g., Amazon, Microsoft, TCS, Wipro" />
            </div>
            <button type="submit" className="btn-glow-blue" style={{ gridColumn: '1 / -1' }}>Save Package Stats</button>
          </motion.form>
        )}

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="package-list">
            {packages.map(p => (
              <motion.div key={p.id} className="package-card glass" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="pkg-header">
                  <h3>Batch {p.year}</h3>
                  <button className="btn-delete-sm" onClick={() => handleDelete(p.id)}>🗑️</button>
                </div>
                <div className="pkg-metrics">
                  <div>
                    <span className="pkg-lbl">Highest</span>
                    <span className="pkg-val text-green">{p.highest}</span>
                  </div>
                  <div>
                    <span className="pkg-lbl">Average</span>
                    <span className="pkg-val text-blue">{p.average}</span>
                  </div>
                  <div>
                    <span className="pkg-lbl">Offers</span>
                    <span className="pkg-val">{p.total_offers}+</span>
                  </div>
                </div>
                <p className="pkg-recruiters"><strong>Top Recruiters:</strong> {p.top_recruiters}</p>
              </motion.div>
            ))}
            {packages.length === 0 && <p className="empty-state">No package statistics added yet.</p>}
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
        .form-group input { padding: 0.8rem; background: rgba(0,0,0,0.2); border: 1px solid var(--border); border-radius: 0.75rem; color: var(--text-primary); outline: none; transition: 0.3s; font-size: 0.95rem; }
        .form-group input:focus { border-color: var(--accent-blue); box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }

        .package-list { display: flex; flex-direction: column; gap: 1.5rem; }
        .package-card { padding: 2rem; border-radius: 1.5rem; border: 1px solid var(--border); background: var(--bg-card); }
        .pkg-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .pkg-header h3 { font-family: 'Syne', sans-serif; font-size: 1.5rem; margin: 0; }
        .pkg-metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-bottom: 1.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .pkg-lbl { font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase; display: block; margin-bottom: 0.25rem; }
        .pkg-val { font-size: 1.75rem; font-weight: 800; font-family: 'Syne', sans-serif; }
        .text-green { color: #10b981; }
        .text-blue { color: #3b82f6; }
        .pkg-recruiters { margin: 0; color: var(--text-secondary); font-size: 0.95rem; }
        .btn-delete-sm { background: rgba(244, 63, 94, 0.1); color: #f43f5e; border: 1px solid rgba(244, 63, 94, 0.15); width: 36px; height: 36px; border-radius: 10px; cursor: pointer; font-size: 1rem; display: flex; align-items: center; justify-content: center; transition: 0.3s; }
        .btn-delete-sm:hover { background: rgba(244, 63, 94, 0.2); border-color: #f43f5e; }
        
        .empty-state { text-align: center; padding: 4rem; color: var(--text-muted); font-size: 1.1rem; border: 1px dashed var(--border); border-radius: 1rem; }
      `}</style>
    </div>
  );
}
