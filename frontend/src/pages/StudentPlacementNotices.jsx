import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
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

export default function StudentPlacementNotices() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

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
        const local = localStorage.getItem('tpo_notices_data');
        setNotices(local ? JSON.parse(local) : MOCK_NOTICES);
      } else {
        setNotices(data);
      }
    } catch (err) {
      console.warn('Error fetching notices:', err);
      const local = localStorage.getItem('tpo_notices_data');
      setNotices(local ? JSON.parse(local) : MOCK_NOTICES);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="projectx-tpo-crud">
      <SEO title="Placement Notices | PROJECTX" />
      <div className="home-mesh-bg"></div>
      
      <div className="crud-container">
        <header className="crud-header">
          <motion.h2 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ fontFamily: 'Syne, sans-serif', fontSize: '2.5rem' }}>
            Placement Notices
          </motion.h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Official announcements and updates from the Training & Placement Cell.</p>
        </header>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="notices-list">
            {notices.map((n) => (
              <motion.div 
                key={n.id} 
                className="notice-card glass"
                style={{ padding: '1.5rem', borderRadius: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border)', marginBottom: '1.25rem' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.25rem' }}>📢 {n.title}</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {n.published_at ? new Date(n.published_at).toLocaleDateString() : 'Recent'}
                  </span>
                </div>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.75rem', lineHeight: '1.6' }}>{n.content}</p>
                {n.expires_at && (
                  <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#f59e0b' }}>
                    ⏳ Valid until: {new Date(n.expires_at).toLocaleDateString()}
                  </div>
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
