import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SEO from '../components/SEO';

const CARDS = [
  { to: '/placement/drives', icon: '🚀', color: 'blue', title: 'UPCOMING DRIVES', desc: 'Explore and apply to the latest campus placement drives.' },
  { to: '/placement/companies', icon: '🏢', color: 'purple', title: 'COMPANIES', desc: 'View profiles of companies hiring from our campus.' },
  { to: '/placement/notices', icon: '📢', color: 'gold', title: 'NOTICES', desc: 'Important announcements from the Training and Placement Cell.' },
  { to: '/placement/resources', icon: '📚', color: 'blue', title: 'RESOURCES & PYQ', desc: 'Interview questions, resume templates, and preparation material.' },
  { to: '/placement/packages', icon: '💰', color: 'green', title: 'PLACEMENT PACKAGES', desc: 'View highest, average packages and placement statistics.' },
  { to: '/placement/experiences', icon: '✍️', color: 'purple', title: 'EXPERIENCES', desc: 'Read interview and placement experiences of seniors.' }
];

export default function PlacementDashboard() {
  return (
    <div className="px-placement">
      <SEO title="Placements | CollegeOne" description="Access premium placement resources and drives." urlPath="/placement" />
      <div className="px-pl-mesh"></div>

      <section className="px-pl-hero">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="px-pl-badge">
          <span>PLACEMENT ECOSYSTEM</span>
        </motion.div>
        
        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="px-pl-title">
          CAREER<span>X</span>
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="px-pl-lead">
          Discover upcoming drives, placement notices, and interview resources.
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

        .px-pl-hero { display: flex; flex-direction: column; align-items: center; text-align: center; padding: clamp(5.5rem, 8vw, 7.5rem) var(--container-px) 1.5rem; position: relative; z-index: 10; }
        .px-pl-badge { display: inline-block; padding: 0.4rem 1.25rem; background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 2rem; margin-bottom: 1.25rem; }
        .px-pl-badge span { font-size: 0.7rem; font-weight: 900; letter-spacing: 2.5px; color: var(--accent-blue); }
        .px-pl-title { font-family: 'Syne', sans-serif; font-size: clamp(2.2rem, 6vw, 4.5rem); font-weight: 800; line-height: 1.05; margin: 0; letter-spacing: -0.04em; color: var(--text-primary); }
        .px-pl-title span { color: var(--accent-blue); text-shadow: 0 0 60px rgba(59, 130, 246, 0.35); }
        .px-pl-lead { font-size: clamp(0.9rem, 2.5vw, 1.1rem); color: var(--text-secondary); margin: 1rem 0 0; line-height: 1.6; font-weight: 500; max-width: 540px; }

        .px-pl-grid-section { max-width: 1100px; margin: 0 auto; padding: 1.5rem var(--container-px) 5rem; position: relative; z-index: 10; }
        .px-pl-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; }
        @media (max-width: 640px) { .px-pl-grid { grid-template-columns: 1fr; } }

        .px-pl-card { position: relative; padding: 2.25rem 2rem; text-decoration: none; color: var(--text-primary); border-radius: 1.5rem; background: var(--bg-card); border: 1px solid var(--border); backdrop-filter: blur(10px); transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1); overflow: hidden; display: flex; flex-direction: column; gap: 0.75rem; }
        .px-pl-card:hover { transform: translateY(-6px); border-color: var(--accent-blue); box-shadow: 0 20px 40px rgba(59, 130, 246, 0.12); }
        .px-pl-card h3 { font-size: 1.2rem; font-weight: 800; margin: 0; letter-spacing: -0.3px; }
        .px-pl-card p { color: var(--text-secondary); line-height: 1.6; margin: 0; font-size: 0.9rem; font-weight: 500; flex: 1; }
        .px-pl-arrow { color: var(--accent-blue); font-size: 1.25rem; font-weight: 800; opacity: 0; transform: translateX(-8px); transition: all 0.3s; }
        .px-pl-card:hover .px-pl-arrow { opacity: 1; transform: translateX(0); }

        .px-pl-icon { width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; border-radius: 1rem; font-size: 1.6rem; margin-bottom: 0.5rem; flex-shrink: 0; }
        .px-pl-icon.blue { background: rgba(59, 130, 246, 0.1); }
        .px-pl-icon.purple { background: rgba(139, 92, 246, 0.1); }
        .px-pl-icon.gold { background: rgba(245, 158, 11, 0.1); }
      `}</style>
    </div>
  );
}
