import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { motion } from 'framer-motion';
import SEO from '../components/SEO';
import { LoadingSpinner } from '../components/States';

const MOCK_EXPERIENCES = [
  {
    id: 'exp-1',
    student_name: 'Rahul Sharma',
    company: 'Amazon',
    role: 'SDE-1',
    batch: '2025',
    content: 'The interview process consisted of 4 rounds. Round 1 was an online assessment with 2 coding questions (medium-hard DP and Graphs). Round 2 was a technical interview focused on Data Structures. Be strong with your basics and time complexities.',
    tips: ['Practice Leetcode Mediums', 'Communicate your thought process clearly', 'Know your resume inside out']
  },
  {
    id: 'exp-2',
    student_name: 'Priya Patel',
    company: 'TCS Digital',
    role: 'System Engineer',
    batch: '2025',
    content: 'TCS Digital process has an advanced quantitative section and 2 coding questions. The interview was mostly around my final year project and core CS subjects like DBMS, OS, and Networks.',
    tips: ['Brush up SQL queries', 'Prepare project architecture diagrams', 'Strong fundamentals in OOPs']
  }
];

export default function StudentPlacementExperiences() {
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExperiences();
  }, []);

  async function fetchExperiences() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('placement_experiences')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        if (error) console.warn('Supabase experiences fetch warning:', error);
        const local = localStorage.getItem('tpo_experiences_data');
        setExperiences(local ? JSON.parse(local) : MOCK_EXPERIENCES);
      } else {
        setExperiences(data);
      }
    } catch (err) {
      console.warn('Error fetching experiences:', err);
      const local = localStorage.getItem('tpo_experiences_data');
      setExperiences(local ? JSON.parse(local) : MOCK_EXPERIENCES);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="projectx-tpo-crud">
      <SEO title="Interview Experiences | PROJECTX" />
      <div className="home-mesh-bg"></div>
      
      <div className="crud-container">
        <header className="crud-header">
          <motion.h2 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ fontFamily: 'Syne, sans-serif', fontSize: '2.5rem' }}>
            Interview Experiences
          </motion.h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Read firsthand interview and placement experiences from your seniors.</p>
        </header>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="experiences-list">
            {experiences.map((exp, i) => (
              <motion.div 
                key={exp.id} 
                className="experience-card glass"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="exp-header">
                  <div className="exp-avatar">{(exp.student_name || exp.studentName)?.charAt(0) || 'S'}</div>
                  <div className="exp-meta">
                    <h3>{exp.student_name || exp.studentName}</h3>
                    <p className="exp-role">{exp.role} @ {exp.company}</p>
                  </div>
                  <div className="exp-batch">Batch {exp.batch}</div>
                </div>
                
                <div className="exp-content">
                  <p>{exp.content}</p>
                </div>
                
                {exp.tips && exp.tips.length > 0 && (
                  <div className="exp-tips">
                    <h4>💡 Key Tips:</h4>
                    <ul>
                      {exp.tips.map((tip, idx) => (
                        <li key={idx}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .projectx-tpo-crud { min-height: 100vh; background: var(--bg-primary); color: var(--text-primary); padding: clamp(8rem, 11vw, 9.5rem) var(--container-px) 4rem; position: relative; }
        .crud-container { max-width: 1000px; margin: 0 auto; position: relative; z-index: 10; }
        .crud-header { margin-bottom: 3rem; text-align: center; }
        
        .experiences-list { display: flex; flex-direction: column; gap: 2rem; }
        .experience-card { padding: 2.5rem; border-radius: 1.5rem; border: 1px solid var(--border); background: var(--bg-card); transition: 0.3s; }
        .experience-card:hover { border-color: rgba(139, 92, 246, 0.4); box-shadow: 0 16px 40px rgba(139, 92, 246, 0.08); transform: translateY(-4px); }
        
        .exp-header { display: flex; align-items: center; gap: 1.5rem; margin-bottom: 1.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .exp-avatar { width: 60px; height: 60px; background: linear-gradient(135deg, #8b5cf6, #3b82f6); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: bold; color: white; }
        .exp-meta h3 { margin: 0 0 0.25rem 0; font-size: 1.4rem; font-family: 'Syne', sans-serif; }
        .exp-role { margin: 0; color: var(--text-secondary); font-size: 1rem; }
        .exp-batch { margin-left: auto; padding: 0.5rem 1rem; background: rgba(255,255,255,0.05); border-radius: 2rem; font-size: 0.85rem; font-weight: 600; color: var(--text-muted); }
        
        .exp-content { font-size: 1.05rem; line-height: 1.7; color: var(--text-secondary); margin-bottom: 2rem; }
        
        .exp-tips { padding: 1.5rem; background: rgba(0,0,0,0.2); border-radius: 1rem; border: 1px dashed rgba(255,255,255,0.1); }
        .exp-tips h4 { margin: 0 0 1rem 0; color: var(--accent-gold); font-size: 1.1rem; display: flex; align-items: center; gap: 0.5rem; }
        .exp-tips ul { margin: 0; padding-left: 1.5rem; color: var(--text-secondary); display: flex; flex-direction: column; gap: 0.5rem; }
        .exp-tips li::marker { color: var(--accent-gold); }
        
        @media (max-width: 640px) {
          .exp-header { flex-direction: column; text-align: center; gap: 1rem; }
          .exp-batch { margin: 0; }
        }
      `}</style>
    </div>
  );
}
