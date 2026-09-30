import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabaseClient';
import { motion } from 'framer-motion';
import SEO from '../components/SEO';
import { LoadingSpinner } from '../components/States';
import { MOCK_DRIVES } from '../data/mockPlacements';

export default function StudentPlacementDrives() {
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDrives();
  }, []);

  async function fetchDrives() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('placement_drives')
        .select('*, companies(name, logo_url)')
        .order('drive_date', { ascending: true });
        
      if (error || !data || data.length === 0) {
        if (error) console.warn('Supabase placement drives fetch warning:', error);
        setDrives(MOCK_DRIVES);
      } else {
        setDrives(data);
      }
    } catch (err) {
      console.warn('Error loading drives:', err);
      setDrives(MOCK_DRIVES);
    } finally {
      setLoading(false);
    }
  }

  const filteredDrives = useMemo(() => {
    if (!searchTerm) return drives;
    const s = searchTerm.toLowerCase();
    return drives.filter(d => 
      d.title?.toLowerCase().includes(s) || 
      d.companies?.name?.toLowerCase().includes(s) ||
      d.package?.toLowerCase().includes(s)
    );
  }, [drives, searchTerm]);

  return (
    <div className="student-portal-view">
      <SEO title="Upcoming Drives | Placement Portal" />
      <div className="home-mesh-bg"></div>
      
      <div className="portal-container">
        <header className="portal-header">
          <h2>Upcoming Placement Drives</h2>
          <p>Discover and prepare for upcoming campus recruitment opportunities.</p>
        </header>

        <div className="search-bar">
          <input 
            type="text" 
            placeholder="Search by company, role, or package..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="premium-search"
          />
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="drives-grid">
            {filteredDrives.map(d => (
              <motion.div key={d.id} className="drive-card glass" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="drive-header">
                  <div className="company-logo-placeholder">🏢</div>
                  <div>
                    <h3 className="drive-title">{d.title}</h3>
                    <span className="company-name">{d.companies?.name}</span>
                  </div>
                </div>
                
                <div className="drive-details">
                  <div className="detail-item">
                    <span className="icon">💰</span> 
                    <strong>{d.package}</strong>
                  </div>
                  <div className="detail-item">
                    <span className="icon">🎓</span>
                    <span>Min CGPA: <strong>{d.eligibility_percentage}</strong></span>
                  </div>
                  <div className="detail-item">
                    <span className="icon">📅</span>
                    <span>Drive: <strong>{new Date(d.drive_date).toLocaleDateString()}</strong></span>
                  </div>
                  <div className="detail-item">
                    <span className="icon">⏳</span>
                    <span className="urgent">Deadline: <strong>{new Date(d.registration_deadline).toLocaleDateString()}</strong></span>
                  </div>
                </div>
                
                <div className="drive-actions">
                  <button className="btn-glow-blue full-width">View Details</button>
                </div>
              </motion.div>
            ))}
            {filteredDrives.length === 0 && (
              <div className="empty-state">No drives match your search criteria.</div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .student-portal-view { min-height: 100vh; background: var(--bg-primary); color: var(--text-primary); padding: clamp(8rem, 11vw, 9.5rem) var(--container-px) 4rem; position: relative; }
        .portal-container { max-width: 1200px; margin: 0 auto; position: relative; z-index: 10; }
        .portal-header { text-align: center; margin-bottom: 2rem; }
        .portal-header h2 { font-family: 'Syne', sans-serif; font-size: 2.2rem; font-weight: 800; margin-bottom: 0.4rem; }
        .portal-header p { color: var(--text-secondary); font-size: 0.95rem; }
        
        .search-bar { max-width: 550px; margin: 0 auto 2.25rem auto; }
        .premium-search { width: 100%; padding: 0.85rem 1.4rem; border-radius: 2rem; background: var(--bg-card); border: 1px solid var(--border); color: var(--text-primary); font-size: 0.95rem; outline: none; transition: 0.3s; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
        .premium-search:focus { border-color: var(--accent-blue); box-shadow: 0 10px 40px rgba(59,130,246,0.15); }
        
        .drives-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem; }
        .drive-card { border-radius: 1.5rem; padding: 1.75rem; border: 1px solid var(--border); background: var(--bg-card); display: flex; flex-direction: column; gap: 1.25rem; transition: 0.3s; }
        .drive-card:hover { transform: translateY(-5px); border-color: var(--accent-blue); }
        
        .drive-header { display: flex; align-items: center; gap: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 1rem; }
        .company-logo-placeholder { width: 50px; height: 50px; background: rgba(59,130,246,0.1); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
        .drive-title { font-size: 1.2rem; font-weight: 800; margin: 0 0 0.25rem 0; line-height: 1.2; }
        .company-name { color: var(--accent-blue); font-weight: 700; font-size: 0.85rem; text-transform: uppercase; }
        
        .drive-details { display: flex; flex-direction: column; gap: 0.8rem; }
        .detail-item { display: flex; align-items: center; gap: 0.75rem; font-size: 0.9rem; color: var(--text-secondary); }
        .detail-item strong { color: var(--text-primary); }
        .urgent { color: #f59e0b; }
        
        .full-width { width: 100%; text-align: center; padding: 0.8rem; border-radius: 1rem; font-weight: 800; background: rgba(59,130,246,0.1); color: var(--accent-blue); border: 1px solid rgba(59,130,246,0.2); cursor: pointer; transition: 0.3s; }
        .full-width:hover { background: var(--accent-blue); color: #fff; }
        
        .empty-state { grid-column: 1 / -1; text-align: center; padding: 4rem; background: var(--bg-card); border-radius: 1.5rem; border: 1px dashed var(--border); color: var(--text-muted); }
      `}</style>
    </div>
  );
}
