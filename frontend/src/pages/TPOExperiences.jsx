import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
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

export default function TPOExperiences() {
  const { user } = useAuth();
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    student_name: '',
    company: '',
    role: '',
    batch: '',
    content: '',
    tips: ''
  });

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

  async function handleSubmit(e) {
    e.preventDefault();
    const tipsArray = formData.tips.split('\n').filter(t => t.trim() !== '');
    const newExp = {
      id: 'exp-' + Date.now(),
      student_name: formData.student_name,
      company: formData.company,
      role: formData.role,
      batch: formData.batch,
      content: formData.content,
      tips: tipsArray,
      created_by: user?.id || 'demo-user',
      created_at: new Date().toISOString()
    };

    const { error } = await supabase.from('placement_experiences').insert([
      {
        student_name: formData.student_name,
        company: formData.company,
        role: formData.role,
        batch: formData.batch,
        content: formData.content,
        tips: tipsArray,
        created_by: user?.id
      }
    ]);

    if (error) {
      console.warn('DB experience insert error, saving locally:', error);
      const updated = [newExp, ...experiences];
      setExperiences(updated);
      localStorage.setItem('tpo_experiences_data', JSON.stringify(updated));
      toast.success('Interview experience published (Demo Mode)');
    } else {
      toast.success('Interview experience published');
      fetchExperiences();
    }
    setShowForm(false);
    setFormData({ student_name: '', company: '', role: '', batch: '', content: '', tips: '' });
  }

  async function handleDelete(id) {
    const { error } = await supabase.from('placement_experiences').delete().eq('id', id);
    if (error) {
      console.warn('Delete error, removing locally:', error);
      const updated = experiences.filter(e => e.id !== id);
      setExperiences(updated);
      localStorage.setItem('tpo_experiences_data', JSON.stringify(updated));
      toast.success('Experience deleted (Demo Mode)');
    } else {
      toast.success('Experience deleted');
      fetchExperiences();
    }
  }

  return (
    <div className="projectx-tpo-crud">
      <SEO title="Manage Experiences | TPO Portal" />
      <div className="home-mesh-bg"></div>
      
      <div className="crud-container">
        <header className="crud-header">
          <h2>Interview Experiences</h2>
          <button className="btn-glow-blue" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Add Experience'}
          </button>
        </header>

        {showForm && (
          <motion.form initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit} className="glass-form">
            <div className="form-group">
              <label>Student Name</label>
              <input required value={formData.student_name} onChange={e => setFormData({...formData, student_name: e.target.value})} placeholder="E.g., Rahul Sharma" />
            </div>
            <div className="form-group">
              <label>Company</label>
              <input required value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} placeholder="E.g., Amazon" />
            </div>
            <div className="form-group">
              <label>Job Role</label>
              <input required value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} placeholder="E.g., SDE-1" />
            </div>
            <div className="form-group">
              <label>Batch Year</label>
              <input required value={formData.batch} onChange={e => setFormData({...formData, batch: e.target.value})} placeholder="E.g., 2025" />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Interview Details / Experience Story</label>
              <textarea required rows={5} value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} placeholder="Describe interview rounds, questions asked, difficulty level..."></textarea>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Preparation Tips (1 per line)</label>
              <textarea rows={3} value={formData.tips} onChange={e => setFormData({...formData, tips: e.target.value})} placeholder="Practice Leetcode Mediums&#10;Focus on DBMS & OS&#10;Prepare final year project well"></textarea>
            </div>
            <button type="submit" className="btn-glow-blue" style={{ gridColumn: '1 / -1' }}>Publish Experience</button>
          </motion.form>
        )}

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="experience-list">
            {experiences.map(exp => (
              <motion.div key={exp.id} className="experience-card glass" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="exp-header">
                  <div className="exp-avatar">{exp.student_name?.charAt(0) || 'S'}</div>
                  <div className="exp-meta">
                    <h3>{exp.student_name}</h3>
                    <p className="exp-role">{exp.role} @ {exp.company}</p>
                  </div>
                  <div className="exp-right">
                    <span className="exp-batch">Batch {exp.batch}</span>
                    <button className="btn-delete-sm" onClick={() => handleDelete(exp.id)}>🗑️</button>
                  </div>
                </div>
                
                <p className="exp-content">{exp.content}</p>

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
            {experiences.length === 0 && <p className="empty-state">No interview experiences published yet.</p>}
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

        .experience-list { display: flex; flex-direction: column; gap: 1.5rem; }
        .experience-card { padding: 2rem; border-radius: 1.5rem; border: 1px solid var(--border); background: var(--bg-card); }
        .exp-header { display: flex; align-items: center; gap: 1.25rem; margin-bottom: 1.25rem; }
        .exp-avatar { width: 50px; height: 50px; background: linear-gradient(135deg, #8b5cf6, #3b82f6); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; font-weight: bold; color: white; flex-shrink: 0; }
        .exp-meta h3 { margin: 0 0 0.25rem 0; font-size: 1.25rem; font-family: 'Syne', sans-serif; }
        .exp-role { margin: 0; color: var(--text-secondary); font-size: 0.9rem; }
        .exp-right { margin-left: auto; display: flex; align-items: center; gap: 1rem; }
        .exp-batch { padding: 0.35rem 0.85rem; background: rgba(255,255,255,0.05); border-radius: 2rem; font-size: 0.8rem; font-weight: 600; color: var(--text-muted); }
        
        .exp-content { font-size: 0.95rem; line-height: 1.7; color: var(--text-secondary); margin-bottom: 1.25rem; }
        .exp-tips { padding: 1.25rem; background: rgba(0,0,0,0.2); border-radius: 0.85rem; border: 1px dashed rgba(255,255,255,0.1); }
        .exp-tips h4 { margin: 0 0 0.75rem 0; color: var(--accent-gold); font-size: 0.95rem; }
        .exp-tips ul { margin: 0; padding-left: 1.25rem; color: var(--text-secondary); display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.9rem; }
        
        .btn-delete-sm { background: rgba(244, 63, 94, 0.1); color: #f43f5e; border: 1px solid rgba(244, 63, 94, 0.15); width: 36px; height: 36px; border-radius: 10px; cursor: pointer; font-size: 1rem; display: flex; align-items: center; justify-content: center; transition: 0.3s; }
        .btn-delete-sm:hover { background: rgba(244, 63, 94, 0.2); border-color: #f43f5e; }
        
        .empty-state { text-align: center; padding: 4rem; color: var(--text-muted); font-size: 1.1rem; border: 1px dashed var(--border); border-radius: 1rem; }
      `}</style>
    </div>
  );
}
