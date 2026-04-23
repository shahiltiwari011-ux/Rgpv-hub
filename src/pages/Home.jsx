import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStats } from '../hooks/useStats';
import { useTrending } from '../hooks/useTrending';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';
import TrendingSection from '../components/TrendingSection';
import ContinueLearning from '../components/ContinueLearning';
import XPBar from '../components/XPBar';

const BRANCHES = [
  { name: 'Computer Science', icon: '🖥️', param: 'Computer+Science', color: '#3b82f6' },
  { name: 'Mechanical', icon: '⚙️', param: 'Mechanical', color: '#ef4444' },
  { name: 'Electrical', icon: '⚡', param: 'Electrical', color: '#f59e0b' },
  { name: 'Civil', icon: '🏗️', param: 'Civil', color: '#10b981' },
  { name: 'Electronics', icon: '📡', param: 'Electronics', color: '#8b5cf6' }
];

export default function Home() {
  const { stats } = useStats();
  const { trending, recentlyAdded, loading: trendingLoading } = useTrending();
  const { user } = useAuth();
  const s = stats || { total_notes: 0, total_pyq: 0, total_syllabus: 0 };

  return (
    <div className="projectx-home">
      <SEO title="PROJECTX | Elite Academic Portal" description="Access premium notes, pyq, and real-time results for RGPV Diploma." urlPath="/" />

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
            <Link to="/result" className="btn-glass">RESULT PROXY</Link>
          </motion.div>

          {user && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="user-pulse-wrap"
            >
              <XPBar />
            </motion.div>
          )}
        </div>
      </section>

      {/* Global Metrics */}
      <section className="global-metrics">
        <div className="metrics-grid">
          {[
            { label: 'Academic Branches', value: '5+', icon: '🏛️' },
            { label: 'Active Semesters', value: '08', icon: '📅' },
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
        <ContinueLearning />
        
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
              <h3>RESULT PROXY</h3>
              <p>Real-time academic performance tracking with 1-tap retrieval.</p>
              <div className="m-tag">Live Proxy Active</div>
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

      <style jsx>{`
        .projectx-home { min-height: 100vh; background: #02040a; color: #fff; position: relative; overflow-x: hidden; font-family: 'Space Grotesk', sans-serif; }
        .home-mesh-bg { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: radial-gradient(circle at 10% 10%, rgba(59, 130, 246, 0.1) 0%, transparent 40%), radial-gradient(circle at 90% 90%, rgba(139, 92, 246, 0.08) 0%, transparent 40%); pointer-events: none; z-index: 0; }

        .hero-elite { 
          min-height: calc(100vh - 120px);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 2rem 1.5rem; 
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
        .hero-badge { display: inline-block; padding: 0.5rem 1.5rem; background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 2rem; margin-bottom: 2rem; }
        .hero-badge span { font-size: 0.75rem; font-weight: 900; letter-spacing: 3px; color: #3b82f6; }
        .hero-main-title { 
          font-family: 'Syne', sans-serif; 
          font-size: clamp(4rem, 15vw, 10rem); 
          font-weight: 800; 
          line-height: 0.85; 
          margin: 0; 
          letter-spacing: -0.05em;
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
        }
        .hero-main-title span { color: #3b82f6; text-shadow: 0 0 80px rgba(59, 130, 246, 0.4); }
        .hero-lead { font-size: clamp(1rem, 3vw, 1.4rem); color: #94a3b8; margin: 2rem 0 3rem; line-height: 1.6; font-weight: 500; max-width: 700px; }
        .hero-actions { display: flex; gap: 1.5rem; justify-content: center; flex-wrap: wrap; width: 100%; }

        .btn-glow-blue { padding: 1.2rem 2.5rem; background: #3b82f6; color: #fff; text-decoration: none; border-radius: 1.25rem; font-weight: 900; font-size: 1rem; transition: 0.3s; box-shadow: 0 10px 30px rgba(59, 130, 246, 0.3); white-space: nowrap; }
        .btn-glow-blue:hover { transform: translateY(-5px); box-shadow: 0 20px 50px rgba(59, 130, 246, 0.4); }
        .btn-glass { padding: 1.2rem 2.5rem; background: rgba(255,255,255,0.05); color: #fff; text-decoration: none; border-radius: 1.25rem; font-weight: 900; font-size: 1rem; border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(10px); transition: 0.3s; white-space: nowrap; }
        .btn-glass:hover { background: rgba(255,255,255,0.1); transform: translateY(-5px); }

        .global-metrics { max-width: 1200px; margin: 0 auto; padding: 0 1.5rem; position: relative; z-index: 10; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; background: rgba(13, 17, 23, 0.6); border: 1px solid rgba(255,255,255,0.05); border-radius: 2.5rem; padding: 2rem; backdrop-filter: blur(20px); }
        .metric-card { display: flex; align-items: center; gap: 1.25rem; padding: 1rem; }
        .metric-icon { font-size: 2rem; filter: grayscale(1) brightness(2); }
        .metric-info { display: flex; flex-direction: column; }
        .m-val { font-size: 1.8rem; font-weight: 900; color: #fff; line-height: 1.1; }
        .m-lab { font-size: 0.75rem; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 1px; }

        .sections-container { max-width: 1200px; margin: 6rem auto; padding: 0 1.5rem; position: relative; z-index: 10; }
        .content-matrix { display: flex; flex-direction: column; gap: 4rem; }

        .feature-matrix { margin: 8rem 0; }
        .section-head { text-align: center; margin-bottom: 4rem; }
        .section-head h2 { font-family: 'Syne', sans-serif; font-size: 2.5rem; font-weight: 800; letter-spacing: -1px; }
        .matrix-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; }
        .matrix-item { padding: 3rem 2.5rem; text-decoration: none; color: #fff; border-radius: 2.5rem; transition: 0.4s; position: relative; overflow: hidden; }
        .matrix-item.glass { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); }
        .matrix-item:hover { transform: translateY(-10px); background: rgba(255,255,255,0.04); border-color: rgba(59, 130, 246, 0.3); }
        .m-icon { font-size: 2.5rem; margin-bottom: 2rem; width: 70px; height: 70px; display: flex; align-items: center; justify-content: center; border-radius: 1.5rem; }
        .m-icon.blue { background: rgba(59, 130, 246, 0.1); }
        .m-icon.purple { background: rgba(139, 92, 246, 0.1); }
        .m-icon.gold { background: rgba(245, 158, 11, 0.1); }
        .matrix-item h3 { font-size: 1.5rem; font-weight: 800; margin: 0 0 1rem; letter-spacing: -0.5px; }
        .matrix-item p { color: #64748b; line-height: 1.6; margin-bottom: 2rem; font-weight: 500; }
        .m-tag { display: inline-block; padding: 0.4rem 1rem; background: rgba(255,255,255,0.05); border-radius: 2rem; font-size: 0.75rem; font-weight: 800; color: #94a3b8; }

        .branch-navigator { margin: 8rem 0; }
        .branch-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; }
        .branch-tile { position: relative; height: 160px; border-radius: 1.5rem; overflow: hidden; text-decoration: none; display: flex; align-items: center; justify-content: center; transition: 0.3s; }
        .tile-bg { position: absolute; inset: 0; opacity: 0.1; transition: 0.4s; }
        .branch-tile:hover .tile-bg { opacity: 0.2; transform: scale(1.1); }
        .tile-content { position: relative; z-index: 2; text-align: center; }
        .tile-icon { font-size: 2rem; margin-bottom: 0.5rem; }
        .tile-content h3 { font-size: 1rem; font-weight: 800; color: #fff; margin: 0 0 0.25rem; text-transform: uppercase; }
        .tile-content span { font-size: 0.65rem; font-weight: 900; color: #475569; letter-spacing: 1px; }
        .branch-tile:hover .tile-content h3 { color: #3b82f6; }

        @media (max-width: 768px) {
            .hero-elite { padding-top: 10rem; }
            .hero-main-title { letter-spacing: -2px; }
            .hero-actions { flex-direction: column; }
            .btn-glow-blue, .btn-glass { width: 100%; text-align: center; }
            .metrics-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
    </div>
  );
}
