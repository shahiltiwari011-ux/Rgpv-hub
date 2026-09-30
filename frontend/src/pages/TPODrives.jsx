import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import SEO from '../components/SEO';
import { LoadingSpinner } from '../components/States';
import { MOCK_COMPANIES, MOCK_DRIVES } from '../data/mockPlacements';

export default function TPODrives() {
  const { user } = useAuth();
  const [drives, setDrives] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    company_id: '',
    title: '',
    drive_date: '',
    registration_deadline: '',
    package: '',
    eligibility_percentage: '',
    location: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [drivesRes, compRes] = await Promise.all([
        supabase.from('placement_drives').select('*, companies(name, logo_url)').order('created_at', { ascending: false }),
        supabase.from('companies').select('id, name')
      ]);
      
      const drivesData = drivesRes.data && drivesRes.data.length > 0 ? drivesRes.data : MOCK_DRIVES;
      const compData = compRes.data && compRes.data.length > 0 ? compRes.data : MOCK_COMPANIES;
      
      if (drivesRes.error) console.warn('Supabase drives fetch warning:', drivesRes.error);
      if (compRes.error) console.warn('Supabase companies fetch warning:', compRes.error);

      setDrives(drivesData);
      setCompanies(compData);
    } catch (err) {
      console.warn('Error fetching drives/companies:', err);
      setDrives(MOCK_DRIVES);
      setCompanies(MOCK_COMPANIES);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const selectedComp = companies.find(c => c.id === formData.company_id);
    const newDrive = {
      ...formData,
      id: 'drive-' + Date.now(),
      created_by: user?.id || 'demo-user',
      created_at: new Date().toISOString(),
      companies: {
        name: selectedComp?.name || 'Recruiting Partner',
        logo_url: selectedComp?.logo_url || ''
      }
    };

    const { error } = await supabase.from('placement_drives').insert([
      { ...formData, created_by: user?.id }
    ]);

    if (error) {
      console.warn('DB drive insert error, saving locally:', error);
      setDrives(prev => [newDrive, ...prev]);
      toast.success('Placement Drive scheduled (Demo Mode)');
    } else {
      toast.success('Placement Drive scheduled');
      fetchData();
    }
    setShowForm(false);
    setFormData({ company_id: '', title: '', drive_date: '', registration_deadline: '', package: '', eligibility_percentage: '', location: '' });
  }

  return (
    <div className="projectx-tpo-crud">
      <SEO title="Manage Drives | TPO Portal" />
      <div className="home-mesh-bg"></div>
      
      <div className="crud-container">
        <header className="crud-header">
          <h2>Placement Drives</h2>
          <button className="btn-glow-blue" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Schedule Drive'}
          </button>
        </header>

        {showForm && (
          <motion.form initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit} className="glass-form">
            <div className="form-group">
              <label>Company</label>
              <select required value={formData.company_id} onChange={e => setFormData({...formData, company_id: e.target.value})}>
                <option value="">Select Company</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Drive Title</label>
              <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="E.g., SDE 1 Recruitment 2024" />
            </div>
            <div className="form-group">
              <label>Drive Date</label>
              <input type="date" required value={formData.drive_date} onChange={e => setFormData({...formData, drive_date: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Registration Deadline</label>
              <input type="date" required value={formData.registration_deadline} onChange={e => setFormData({...formData, registration_deadline: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Package (LPA)</label>
              <input required value={formData.package} onChange={e => setFormData({...formData, package: e.target.value})} placeholder="E.g., 10 LPA" />
            </div>
            <div className="form-group">
              <label>Eligibility % (CGPA)</label>
              <input type="number" step="0.1" required value={formData.eligibility_percentage} onChange={e => setFormData({...formData, eligibility_percentage: e.target.value})} placeholder="E.g., 7.5" />
            </div>
            <button type="submit" className="btn-glow-blue" style={{ gridColumn: '1 / -1' }}>Save Drive</button>
          </motion.form>
        )}

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="crud-list">
            {drives.map(d => (
              <div key={d.id} className="crud-card glass">
                <h3>{d.title}</h3>
                <span className="badge">{d.companies?.name}</span>
                <p><strong>Package:</strong> {d.package}</p>
                <p><strong>Date:</strong> {new Date(d.drive_date).toLocaleDateString()}</p>
                <p><strong>Deadline:</strong> {new Date(d.registration_deadline).toLocaleDateString()}</p>
              </div>
            ))}
            {drives.length === 0 && <p className="empty-state">No placement drives scheduled.</p>}
          </div>
        )}
      </div>
      <style>{`
        /* Reusing crud styles */
        .projectx-tpo-crud { min-height: 100vh; background: var(--bg-primary); color: var(--text-primary); padding: clamp(8rem, 11vw, 9.5rem) var(--container-px) 4rem; position: relative; }
        .crud-container { max-width: 1000px; margin: 0 auto; position: relative; z-index: 10; }
        .crud-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; }
        .crud-header h2 { font-family: 'Syne', sans-serif; font-size: 2rem; }
        .btn-glow-blue { padding: 0.75rem 1.5rem; background: var(--accent-blue); color: #fff; border: none; border-radius: 1rem; cursor: pointer; font-weight: bold; transition: 0.3s; }
        .glass-form { background: var(--bg-card); border: 1px solid var(--border); padding: 2rem; border-radius: 1.5rem; display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 3rem; backdrop-filter: blur(10px); }
        .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
        .form-group label { font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; }
        .form-group input, .form-group select { padding: 0.8rem; background: rgba(0,0,0,0.2); border: 1px solid var(--border); border-radius: 0.5rem; color: var(--text-primary); outline: none; transition: 0.3s; }
        .form-group input:focus, .form-group select:focus { border-color: var(--accent-blue); }
        .crud-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
        .crud-card { padding: 1.5rem; border-radius: 1.25rem; border: 1px solid var(--border); }
        .crud-card h3 { margin: 0 0 0.5rem 0; font-size: 1.25rem; }
        .badge { display: inline-block; padding: 0.25rem 0.75rem; background: rgba(139, 92, 246, 0.1); color: #8b5cf6; border-radius: 2rem; font-size: 0.75rem; font-weight: bold; margin-bottom: 1rem; }
        .empty-state { grid-column: 1 / -1; text-align: center; padding: 4rem; color: var(--text-muted); font-size: 1.1rem; border: 1px dashed var(--border); border-radius: 1rem; }
      `}</style>
    </div>
  );
}
