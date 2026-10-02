import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { motion } from 'framer-motion';
import SEO from '../components/SEO';
import { LoadingSpinner } from '../components/States';

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

export default function StudentPlacementResources() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

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
        const local = localStorage.getItem('tpo_resources_data');
        setResources(local ? JSON.parse(local) : MOCK_RESOURCES);
      } else {
        setResources(data);
      }
    } catch (err) {
      console.warn('Error fetching resources:', err);
      const local = localStorage.getItem('tpo_resources_data');
      setResources(local ? JSON.parse(local) : MOCK_RESOURCES);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="projectx-tpo-crud">
      <SEO title="Placement Resources | CollegeOne" />
      <div className="home-mesh-bg"></div>
      
      <div className="crud-container">
        <header className="crud-header">
          <motion.h2 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ fontFamily: 'Syne, sans-serif', fontSize: '2.5rem' }}>
            Placement Resources & Prep Material
          </motion.h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Guides, resume templates, and preparation materials provided by the TPO cell.</p>
        </header>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="resources-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {resources.map((r) => (
              <motion.div 
                key={r.id} 
                className="resource-card glass"
                style={{ padding: '1.5rem', borderRadius: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
              >
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-blue)', padding: '0.25rem 0.6rem', borderRadius: '1rem' }}>
                    {r.category || 'General'}
                  </span>
                  <h3 style={{ marginTop: '0.75rem', marginBottom: '0.5rem', color: 'var(--text-primary)', fontSize: '1.15rem' }}>{r.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>{r.description}</p>
                </div>
                {r.file_url && r.file_url !== '#' && (
                  <a 
                    href={r.file_url} 
                    target="_blank" 
                    rel="noreferrer"
                    style={{ marginTop: '1rem', display: 'inline-block', textAlign: 'center', padding: '0.5rem 1rem', background: 'var(--accent-blue)', color: '#fff', borderRadius: '0.5rem', textDecoration: 'none', fontWeight: '600', fontSize: '0.85rem' }}
                  >
                    Download Resource 📥
                  </a>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .projectx-tpo-crud { min-height: 100vh; background: var(--bg-primary); padding: clamp(5.5rem, 8vw, 7.5rem) var(--container-px) 5rem; position: relative; }
        .crud-container { max-width: 1000px; margin: 0 auto; position: relative; z-index: 10; }
        .crud-header { margin-bottom: 2.5rem; text-align: center; }
      `}</style>
    </div>
  );
}
