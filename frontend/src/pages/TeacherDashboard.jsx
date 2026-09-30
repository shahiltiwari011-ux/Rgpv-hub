import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SEO from '../components/SEO';
import { useAuth } from '../context/AuthContext';

const CARDS = [
  { to: '/teacher/upload', icon: '📤', color: 'blue', title: 'UPLOAD MATERIAL', desc: 'Publish new notes, PDFs, or assignments.' },
  { to: '/teacher/materials', icon: '📂', color: 'purple', title: 'MY MATERIALS', desc: 'View, edit, or delete resources you have published.' }
];

export default function TeacherDashboard() {
  const { user, profile } = useAuth();
  
  return (
    <div className="px-placement">
      <SEO title="Teacher Portal | PROJECTX" description="Educator Resource Management Portal" urlPath="/teacher" />
      <div className="px-pl-mesh"></div>

      <section className="px-pl-hero">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="px-pl-badge">
          <span>EDUCATOR DASHBOARD</span>
        </motion.div>
        
        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="px-pl-title">
          FACULTY<span>X</span>
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="px-pl-lead">
          Welcome back, Prof. {profile?.name || 'Teacher'}. Manage your academic materials and uploads.
        </motion.p>
      </section>

      <section className="px-pl-grid-section">
        <div className="px-pl-grid">
          {CARDS.map((c, i) => (
            <Link key={i} to={c.to} className="px-pl-card">
              <div className={`px-pl-icon ${c.color}`}>{c.icon}</div>
              <h3>{c.title}</h3>
              <p>{c.desc}</p>
              <span className="px-pl-arrow">→</span>
            </Link>
          ))}
        </div>
      </section>
      
      <style>{`
        .px-placement { min-height: 100vh; background: var(--bg-primary); color: var(--text-primary); position: relative; overflow-x: hidden; font-family: 'Space Grotesk', sans-serif; }
        .px-pl-mesh { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.08) 0%, transparent 40%), radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.06) 0%, transparent 40%); pointer-events: none; z-index: 0; }
        .px-pl-hero { display: flex; flex-direction: column; align-items: center; text-align: center; padding: clamp(6rem, 12vw, 10rem) var(--container-px) 3rem; position: relative; z-index: 10; }
        .px-pl-badge { display: inline-block; padding: 0.5rem 1.5rem; background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 2rem; margin-bottom: 1.5rem; }
        .px-pl-badge span { font-size: 0.7rem; font-weight: 900; letter-spacing: 3px; color: var(--accent-blue); }
        .px-pl-title { font-family: 'Syne', sans-serif; font-size: clamp(2.5rem, 10vw, 6rem); font-weight: 800; line-height: 1; margin: 0; letter-spacing: -0.04em; color: var(--text-primary); }
        .px-pl-title span { color: var(--accent-blue); text-shadow: 0 0 80px rgba(59, 130, 246, 0.4); }
        .px-pl-lead { font-size: clamp(0.9rem, 3vw, 1.15rem); color: var(--text-secondary); margin: 1.5rem 0 0; line-height: 1.6; font-weight: 500; max-width: 550px; }
        .px-pl-grid-section { max-width: 1100px; margin: 0 auto; padding: 2rem var(--container-px) 6rem; position: relative; z-index: 10; }
        .px-pl-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.25rem; }
        @media (max-width: 640px) { .px-pl-grid { grid-template-columns: 1fr; } }
        .px-pl-card { position: relative; padding: 2rem; text-decoration: none; color: var(--text-primary); border-radius: 1.5rem; background: var(--bg-card); border: 1px solid var(--border); backdrop-filter: blur(10px); transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1); overflow: hidden; display: flex; flex-direction: column; gap: 0.75rem; }
        .px-pl-card:hover { transform: translateY(-8px); border-color: var(--accent-blue); box-shadow: 0 20px 40px rgba(59, 130, 246, 0.12); }
        .px-pl-card h3 { font-size: 1.15rem; font-weight: 800; margin: 0; }
        .px-pl-card p { color: var(--text-secondary); line-height: 1.6; margin: 0; font-size: 0.9rem; font-weight: 500; flex: 1; }
        .px-pl-arrow { color: var(--accent-blue); font-size: 1.25rem; font-weight: 800; opacity: 0; transform: translateX(-8px); transition: all 0.3s; }
        .px-pl-card:hover .px-pl-arrow { opacity: 1; transform: translateX(0); }
        .px-pl-icon { width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; border-radius: 1rem; font-size: 1.6rem; margin-bottom: 0.5rem; }
        .px-pl-icon.blue { background: rgba(59, 130, 246, 0.1); }
        .px-pl-icon.purple { background: rgba(139, 92, 246, 0.1); }
        .px-pl-icon.gold { background: rgba(245, 158, 11, 0.1); }
      `}</style>
    </div>
  );
}
