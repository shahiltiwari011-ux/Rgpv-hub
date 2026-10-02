import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { motion } from 'framer-motion';
import SEO from '../components/SEO';
import { LoadingSpinner } from '../components/States';

const MOCK_PACKAGES = [
  { id: 'pkg-1', year: '2025', highest: '45 LPA', average: '8.5 LPA', total_offers: 450, top_recruiters: 'Amazon, TCS, Infosys' },
  { id: 'pkg-2', year: '2024', highest: '42 LPA', average: '7.8 LPA', total_offers: 410, top_recruiters: 'Microsoft, Wipro, Cognizant' },
  { id: 'pkg-3', year: '2023', highest: '35 LPA', average: '6.5 LPA', total_offers: 380, top_recruiters: 'TCS, Accenture, IBM' }
];

export default function StudentPlacementPackages() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="projectx-tpo-crud">
      <SEO title="Placement Packages | CollegeOne" />
      <div className="home-mesh-bg"></div>
      
      <div className="crud-container">
        <header className="crud-header">
          <motion.h2 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ fontFamily: 'Syne, sans-serif', fontSize: '2.5rem' }}>
            Placement Statistics & Packages
          </motion.h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Historical data of campus placements and highest packages offered.</p>
        </header>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="stats-grid">
            {packages.map((stat, i) => (
              <motion.div 
                key={stat.id || stat.year} 
                className="stat-card glass"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="stat-year">Batch {stat.year}</div>
                <div className="stat-metrics">
                  <div className="metric">
                    <span className="metric-label">Highest Package</span>
                    <span className="metric-value text-green">{stat.highest}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Average Package</span>
                    <span className="metric-value text-blue">{stat.average}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Total Offers</span>
                    <span className="metric-value">{stat.total_offers || stat.totalOffers}+</span>
                  </div>
                </div>
                <div className="stat-recruiters">
                  <strong>Top Recruiters:</strong> {stat.top_recruiters || stat.topRecruiters}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .projectx-tpo-crud { min-height: 100vh; background: var(--bg-primary); color: var(--text-primary); padding: clamp(8rem, 11vw, 9.5rem) var(--container-px) 4rem; position: relative; }
        .crud-container { max-width: 1000px; margin: 0 auto; position: relative; z-index: 10; }
        .crud-header { margin-bottom: 3rem; text-align: center; }
        
        .stats-grid { display: flex; flex-direction: column; gap: 2rem; }
        .stat-card { padding: 2.5rem; border-radius: 1.5rem; border: 1px solid var(--border); background: var(--bg-card); transition: 0.3s; }
        .stat-card:hover { border-color: rgba(59, 130, 246, 0.4); box-shadow: 0 16px 40px rgba(59, 130, 246, 0.08); transform: translateY(-4px); }
        
        .stat-year { font-size: 2rem; font-weight: 800; font-family: 'Syne', sans-serif; color: var(--text-primary); margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); }
        
        .stat-metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 2rem; margin-bottom: 2rem; }
        .metric { display: flex; flex-direction: column; gap: 0.5rem; }
        .metric-label { font-size: 0.9rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }
        .metric-value { font-size: 2.5rem; font-weight: 800; font-family: 'Syne', sans-serif; }
        .text-green { color: #10b981; }
        .text-blue { color: #3b82f6; }
        
        .stat-recruiters { padding-top: 1.5rem; border-top: 1px dashed rgba(255,255,255,0.1); color: var(--text-secondary); font-size: 1rem; }
        .stat-recruiters strong { color: var(--text-primary); }
      `}</style>
    </div>
  );
}
