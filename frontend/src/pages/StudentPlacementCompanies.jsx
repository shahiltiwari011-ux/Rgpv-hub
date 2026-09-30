import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabaseClient';
import { motion } from 'framer-motion';
import SEO from '../components/SEO';
import { LoadingSpinner } from '../components/States';
import { MOCK_COMPANIES } from '../data/mockPlacements';

export default function StudentPlacementCompanies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCompanies();
  }, []);

  async function fetchCompanies() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name', { ascending: true });
        
      if (error || !data || data.length === 0) {
        if (error) console.warn('Supabase companies fetch warning:', error);
        setCompanies(MOCK_COMPANIES);
      } else {
        setCompanies(data);
      }
    } catch (err) {
      console.warn('Error loading companies:', err);
      setCompanies(MOCK_COMPANIES);
    } finally {
      setLoading(false);
    }
  }

  const filteredCompanies = useMemo(() => {
    if (!searchTerm) return companies;
    const s = searchTerm.toLowerCase();
    return companies.filter(c => 
      c.name?.toLowerCase().includes(s) || 
      c.industry?.toLowerCase().includes(s) ||
      c.location?.toLowerCase().includes(s)
    );
  }, [companies, searchTerm]);

  return (
    <div className="student-portal-view">
      <SEO title="Companies | Placement Portal" />
      <div className="home-mesh-bg"></div>
      
      <div className="portal-container">
        <header className="portal-header">
          <h2>Recruiting Companies</h2>
          <p>Explore organizations that hire from our campus.</p>
        </header>

        <div className="search-bar">
          <input 
            type="text" 
            placeholder="Search by name, industry, or location..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="premium-search"
          />
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="companies-grid">
            {filteredCompanies.map(c => (
              <motion.div key={c.id} className="company-card glass" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="company-logo-large">🏢</div>
                <h3 className="company-title">{c.name}</h3>
                <span className="industry-badge">{c.industry}</span>
                
                <p className="company-desc">{c.description?.substring(0, 120)}...</p>
                
                <div className="company-footer">
                  <span className="location">📍 {c.location}</span>
                  {c.website && (
                    <a href={c.website} target="_blank" rel="noopener noreferrer" className="website-link">Visit Site</a>
                  )}
                </div>
              </motion.div>
            ))}
            {filteredCompanies.length === 0 && (
              <div className="empty-state">No companies match your search criteria.</div>
            )}
          </div>
        )}
      </div>

      <style>{`
        /* Inherit portal base styles */
        .student-portal-view { min-height: 100vh; background: var(--bg-primary); color: var(--text-primary); padding: clamp(8rem, 11vw, 9.5rem) var(--container-px) 4rem; position: relative; }
        .portal-container { max-width: 1200px; margin: 0 auto; position: relative; z-index: 10; }
        .portal-header { text-align: center; margin-bottom: 2rem; }
        .portal-header h2 { font-family: 'Syne', sans-serif; font-size: 2.2rem; font-weight: 800; margin-bottom: 0.4rem; }
        .portal-header p { color: var(--text-secondary); font-size: 0.95rem; }
        
        .search-bar { max-width: 550px; margin: 0 auto 2.25rem auto; }
        .premium-search { width: 100%; padding: 0.85rem 1.4rem; border-radius: 2rem; background: var(--bg-card); border: 1px solid var(--border); color: var(--text-primary); font-size: 0.95rem; outline: none; transition: 0.3s; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
        .premium-search:focus { border-color: var(--accent-blue); box-shadow: 0 10px 40px rgba(59,130,246,0.15); }

        .companies-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
        .company-card { border-radius: 1.5rem; padding: 1.75rem; border: 1px solid var(--border); background: var(--bg-card); display: flex; flex-direction: column; align-items: center; text-align: center; gap: 0.85rem; transition: 0.3s; }
        .company-card:hover { transform: translateY(-5px); border-color: rgba(139, 92, 246, 0.5); box-shadow: 0 20px 40px rgba(139, 92, 246, 0.1); }
        
        .company-logo-large { width: 70px; height: 70px; background: rgba(139, 92, 246, 0.1); border-radius: 20px; display: flex; align-items: center; justify-content: center; font-size: 2rem; margin-bottom: 0.5rem; }
        .company-title { font-size: 1.4rem; font-weight: 800; margin: 0; }
        .industry-badge { display: inline-block; padding: 0.3rem 1rem; background: rgba(139, 92, 246, 0.1); color: #8b5cf6; border-radius: 2rem; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; }
        
        .company-desc { color: var(--text-secondary); font-size: 0.9rem; line-height: 1.6; margin: 0.5rem 0 1.5rem 0; flex: 1; }
        
        .company-footer { width: 100%; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 1.5rem; font-size: 0.85rem; }
        .location { color: var(--text-muted); font-weight: 600; }
        .website-link { color: var(--accent-blue); font-weight: 800; text-decoration: none; }
        .website-link:hover { text-decoration: underline; }
        
        .empty-state { grid-column: 1 / -1; text-align: center; padding: 4rem; background: var(--bg-card); border-radius: 1.5rem; border: 1px dashed var(--border); color: var(--text-muted); }
      `}</style>
    </div>
  );
}
