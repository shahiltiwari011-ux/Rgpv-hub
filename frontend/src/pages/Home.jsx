import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStats } from '../hooks/useStats';
import { useTrending } from '../hooks/useTrending';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';
import TrendingSection from '../components/TrendingSection';
import OfflineBanner from '../components/OfflineBanner';

const BRANCHES = [
  { name: 'Computer Science', icon: '🖥️', param: 'Computer Science', color: '#3b82f6' },
  { name: 'Mechanical', icon: '⚙️', param: 'Mechanical', color: '#ef4444' },
  { name: 'Electrical', icon: '⚡', param: 'Electrical', color: '#f59e0b' },
  { name: 'Civil', icon: '🏗️', param: 'Civil', color: '#10b981' },
  { name: 'Electronics', icon: '📡', param: 'Electronics', color: '#8b5cf6' }
];

export default function Home() {
  const { stats, isMock: statsMock } = useStats();
  const { trending, recentlyAdded, loading: trendingLoading, isMock: trendingMock } = useTrending();
  const { user } = useAuth();
  const s = stats || { total_notes: 0, total_pyq: 0, total_syllabus: 0 };
  const isMock = statsMock || trendingMock;

  return (
    <div className="projectx-home">
      <SEO title="PROJECTX | Elite Academic Portal" description="Access premium notes, pyq, and real-time results for RGPV Diploma." urlPath="/" />

      <OfflineBanner isMock={isMock} onRetry={() => window.location.reload()} />

      <div className="home-mesh-bg"></div>

      {/* Hero Section */}
      <section className="hero-elite">
        <div className="hero-container">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="hero-badge"
          >
            <span>ELITE ACADEMIC ECOSYSTEM</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="hero-main-title"
          >
            PROJECT<span>X</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="hero-lead"
          >
            Empowering RGPV students with high-fidelity resources, 
            <br />automated results, and an advanced learning interface.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="hero-actions"
          >
            <Link to="/notes" className="btn-glow-blue">BROWSE ARCHIVE</Link>
            <Link to="/result" className="btn-glass">ACADEMIC RESULT</Link>
          </motion.div>

        </div>
      </section>

      {/* Global Metrics */}
      <section className="global-metrics">
        <div className="metrics-grid">
          {[
            { label: 'Academic Branches', value: '5+', icon: '🏛️' },
            { label: 'Active Semesters', value: '06', icon: '📅' },
            { label: 'Subject Archives', value: s.total_notes, icon: '📂' },
            { label: 'PYQ Repository', value: s.total_pyq, icon: '📄' }
          ].map((m, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -5 }}
              className="metric-card"
            >
              <div className="metric-icon">{m.icon}</div>
              <div className="metric-info">
                <span className="m-val">{m.value}</span>
                <span className="m-lab">{m.label}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <div className="sections-container">
        
        <div className="content-matrix">
          <TrendingSection title="TRENDING ASSETS" icon="🔥" items={trending} sectionId="trending" loading={trendingLoading} />
          <TrendingSection title="FRESH RELEASES" icon="🆕" items={recentlyAdded} sectionId="recent" loading={trendingLoading} />
        </div>

        {/* Feature Matrix */}
        <section className="feature-matrix">
          <div className="section-head">
            <h2 className="glitch-title" data-text="CORE CAPABILITIES">CORE CAPABILITIES</h2>
          </div>
          <div className="matrix-grid">
            <Link to="/notes" className="matrix-item glass">
              <div className="m-icon blue">📝</div>
              <h3>SMART NOTES</h3>
              <p>Curated, searchable, and optimized for rapid exam preparation.</p>
              <div className="m-tag">{s.total_notes} PDFs Available</div>
            </Link>
            <Link to="/pyq" className="matrix-item glass">
              <div className="m-icon purple">📄</div>
              <h3>PYQ ENGINE</h3>
              <p>Historical question patterns analyzed for future success.</p>
              <div className="m-tag">2021 - 2024 Archive</div>
            </Link>
            <Link to="/result" className="matrix-item glass">
              <div className="m-icon gold">📊</div>
              <h3>ACADEMIC RESULT</h3>
              <p>Real-time academic performance tracking with 1-tap retrieval.</p>
              <div className="m-tag">Portal Sync Active</div>
            </Link>
          </div>
        </section>

        {/* Branch Navigation */}
        <section className="branch-navigator">
          <div className="section-head">
            <h2>SELECT DISCIPLINE</h2>
          </div>
          <div className="branch-grid">
            {BRANCHES.map((b, i) => (
              <Link key={i} to={`/notes?branch=${b.param}`} className="branch-tile">
                <div className="tile-bg" style={{ background: b.color }}></div>
                <div className="tile-content">
                  <div className="tile-icon">{b.icon}</div>
                  <h3>{b.name}</h3>
                  <span>ENTER ARCHIVE</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <style>{`
        .projectx-home { min-height: 100vh; background: var(--bg-primary); color: var(--text-primary); position: relative; overflow-x: hidden; font-family: 'Space Grotesk', sans-serif; transition: background-color 0.3s ease, color 0.3s ease; }
        .home-mesh-bg { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: radial-gradient(circle at 10% 10%, rgba(var(--accent-blue-rgb, 59, 130, 246), 0.1) 0%, transparent 40%), radial-gradient(circle at 90% 90%, rgba(var(--accent-purple-rgb, 139, 92, 246), 0.08) 0%, transparent 40%); pointer-events: none; z-index: 0; }

        .hero-elite { 
          min-height: calc(100vh - 120px);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: clamp(4rem, 15vw, 8rem) var(--container-px) 4rem; 
          text-align: center; 
          position: relative; 
          z-index: 10; 
        }
        .hero-container { 
          width: 100%;
          max-width: 1200px; 
          margin: 0 auto; 
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .hero-badge { display: inline-block; padding: 0.5rem 1.5rem; background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 2rem; margin-bottom: 1.5rem; }
        .hero-badge span { font-size: clamp(0.6rem, 2.5vw, 0.75rem); font-weight: 900; letter-spacing: 3px; color: var(--accent-blue); }
        .hero-main-title { 
          font-family: 'Syne', sans-serif; 
          font-size: clamp(2rem, 10.5vw, 8rem); 
          font-weight: 800; 
          line-height: 1; 
          margin: 0; 
          letter-spacing: -0.04em;
          display: block;
          text-align: center;
          width: 100%;
          color: var(--text-primary);
        }
        .hero-main-title span { color: var(--accent-blue); text-shadow: 0 0 80px rgba(59, 130, 246, 0.4); }
        .hero-lead { font-size: clamp(0.9rem, 4.5vw, 1.2rem); color: var(--text-secondary); margin: 1.5rem 0 2.5rem; line-height: 1.5; font-weight: 500; max-width: 700px; padding: 0 1rem; }
        .hero-actions { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; width: 100%; padding: 0 1rem; }

        .btn-glow-blue { padding: 1.1rem 2rem; background: var(--accent-blue); color: #fff; text-decoration: none; border-radius: 1.25rem; font-weight: 900; font-size: 0.95rem; transition: 0.3s; box-shadow: 0 10px 30px rgba(59, 130, 246, 0.3); white-space: nowrap; flex: 1; min-width: 200px; max-width: 280px; text-align: center; }
        .btn-glow-blue:hover { transform: translateY(-5px); box-shadow: 0 20px 50px rgba(59, 130, 246, 0.4); }
        .btn-glass { padding: 1.1rem 2rem; background: var(--bg-card); color: var(--text-primary); text-decoration: none; border-radius: 1.25rem; font-weight: 900; font-size: 0.95rem; border: 1px solid var(--border); backdrop-filter: blur(10px); transition: 0.3s; white-space: nowrap; flex: 1; min-width: 200px; max-width: 280px; text-align: center; }
        .btn-glass:hover { background: rgba(var(--bg-glass-rgb), 0.2); transform: translateY(-5px); border-color: var(--accent-blue); }

        .global-metrics { max-width: 1200px; margin: 0 auto; padding: 0 var(--container-px); position: relative; z-index: 10; }
        .metrics-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; background: var(--bg-card); border: 1px solid var(--border); border-radius: 2rem; padding: 1.5rem; backdrop-filter: blur(20px); }
        @media (min-width: 768px) { .metrics-grid { grid-template-columns: repeat(4, 1fr); padding: 2rem; gap: 1.5rem; } }
        .metric-card { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; padding: 0.5rem; text-align: center; }
        @media (min-width: 768px) { .metric-card { flex-direction: row; text-align: left; padding: 1rem; } }
        .metric-icon { font-size: 1.75rem; }
        .metric-info { display: flex; flex-direction: column; }
        .m-val { font-size: clamp(1.4rem, 5vw, 1.8rem); font-weight: 900; color: var(--text-primary); line-height: 1.1; }
        .m-lab { font-size: 0.65rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; }

        .sections-container { max-width: 1200px; margin: 4rem auto; padding: 0 var(--container-px); position: relative; z-index: 10; }
        @media (min-width: 768px) { .sections-container { margin: 6rem auto; } }
        .content-matrix { display: flex; flex-direction: column; gap: 3rem; }
        @media (min-width: 768px) { .content-matrix { gap: 4rem; } }

        .feature-matrix { margin: 5rem 0; }
        @media (min-width: 768px) { .feature-matrix { margin: 8rem 0; } }
        .section-head { text-align: center; margin-bottom: 3rem; }
        .section-head h2 { font-family: 'Syne', sans-serif; font-size: clamp(1.75rem, 6vw, 2.5rem); font-weight: 800; letter-spacing: -1px; color: var(--text-primary); }
        .matrix-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; }
        .matrix-item { padding: 2rem; text-decoration: none; color: var(--text-primary); border-radius: 2rem; transition: 0.4s; position: relative; overflow: hidden; }
        @media (min-width: 768px) { .matrix-item { padding: 3rem 2.5rem; } }
        .matrix-item.glass { background: var(--bg-card); border: 1px solid var(--border); backdrop-filter: blur(10px); }
        .matrix-item:hover { transform: translateY(-10px); background: rgba(var(--bg-glass-rgb), 0.1); border-color: var(--accent-blue); }
        .m-icon { font-size: 2rem; margin-bottom: 1.5rem; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; border-radius: 1.25rem; }
        @media (min-width: 768px) { .m-icon { font-size: 2.5rem; margin-bottom: 2rem; width: 70px; height: 70px; } }
        .m-icon.blue { background: rgba(59, 130, 246, 0.1); }
        .m-icon.purple { background: rgba(139, 92, 246, 0.1); }
        .m-icon.gold { background: rgba(245, 158, 11, 0.1); }
        .matrix-item h3 { font-size: 1.35rem; font-weight: 800; margin: 0 0 1rem; letter-spacing: -0.5px; }
        .matrix-item p { color: var(--text-secondary); line-height: 1.6; margin-bottom: 1.5rem; font-weight: 500; font-size: 0.95rem; }
        .m-tag { display: inline-block; padding: 0.4rem 1rem; background: var(--bg-secondary); border-radius: 2rem; font-size: 0.75rem; font-weight: 800; color: var(--text-muted); border: 1px solid var(--border); }

        .branch-navigator { margin: 5rem 0; }
        @media (min-width: 768px) { .branch-navigator { margin: 8rem 0; } }
        .branch-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
        @media (min-width: 768px) { .branch-grid { grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); } }
        .branch-tile { position: relative; height: 140px; border-radius: 1.5rem; overflow: hidden; text-decoration: none; display: flex; align-items: center; justify-content: center; transition: 0.3s; border: 1px solid var(--border); }
        @media (min-width: 768px) { .branch-tile { height: 160px; } }
        .tile-bg { position: absolute; inset: 0; opacity: 0.1; transition: 0.4s; }
        .branch-tile:hover .tile-bg { opacity: 0.25; transform: scale(1.1); }
        .tile-content { position: relative; z-index: 2; text-align: center; padding: 0.5rem; }
        .tile-icon { font-size: 1.75rem; margin-bottom: 0.5rem; }
        .tile-content h3 { font-size: 0.9rem; font-weight: 800; color: var(--text-primary); margin: 0 0 0.25rem; text-transform: uppercase; }
        .tile-content span { font-size: 0.6rem; font-weight: 900; color: var(--text-muted); letter-spacing: 1px; }
        .branch-tile:hover .tile-content h3 { color: var(--accent-blue); }
      `}</style>

    </div>
  );
}
