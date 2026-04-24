import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const HINGLISH_JOKES = [
  'Engineering life: Raat bhar padhai, subah sab safai! 🧹📖',
  'HTML seekh kar khud ko developer samajhna... alag hi swag hai! 😎',
  "VIVA ke time external: 'Beta, tell me anything.' Me: 'Dukh, dard, peeda...' 🥲",
  'RGPV exams: 40 pages bhariye, pass ho jaiye! (Conditions apply) 😂📝',
  'Chai + Coding + Last night study = Diploma Engineering! ☕️💻',
  "Internal marks mangna is like asking for 'Udhari'. Milta hi nahi! 💸😭",
  'Why do programmers prefer dark mode? Kyunki light se bugs chamakte hain! 🐜💡',
  'Attendance 75%: Engineering student ka sabse bada mission impossible! 🏃‍♂️💨'
];

export default function Footer() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % HINGLISH_JOKES.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="projectx-footer">
      <div className="footer-mesh"></div>
      <div className="footer-wrap">
        <div className="footer-main">
          <div className="brand-zone">
            <h2 className="footer-logo">PROJECT<span>X</span></h2>
            <p className="footer-tagline">
              The next-generation academic portal for RGPV Diploma students. 
              Engineering success through technology and transparency.
            </p>
            <div className="footer-badges">
              <span className="badge">ELITE</span>
              <span className="badge">VERIFIED</span>
              <span className="badge">OPEN-SOURCE</span>
            </div>
          </div>

          <div className="links-zone">
            <div className="link-group">
              <h4>RESOURCES</h4>
              <ul>
                <li><Link to="/notes">Lecture Notes</Link></li>
                <li><Link to="/pyq">PYQ Archives</Link></li>
                <li><Link to="/syllabus">Syllabus Matrix</Link></li>
                <li><Link to="/result">Result Proxy</Link></li>
              </ul>
            </div>
            <div className="link-group">
              <h4>COMMUNITY</h4>
              <ul>
                <li><Link to="/discussions">Forums</Link></li>
                <li><Link to="/leaderboard">Rankings</Link></li>
                <li><Link to="/dashboard">My Dashboard</Link></li>
              </ul>
            </div>
          </div>

          <div className="humour-zone">
            <h4>ENGINEERING.EXE</h4>
            <div className="joke-card">
              <AnimatePresence mode="wait">
                <motion.p 
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  "{HINGLISH_JOKES[index]}"
                </motion.p>
              </AnimatePresence>
              <div className="joke-progress">
                <div className="progress-bar"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="legal">
            <span>© {new Date().getFullYear()} PROJECTX ECOSYSTEM</span>
            <span className="dot">•</span>
            <span>NOT AFFILIATED WITH RGPV OFFICIAL</span>
          </div>
          <div className="made-by">
            BUILT FOR THE <span>FUTURE</span>
          </div>
        </div>
      </div>

      <style>{`
        .projectx-footer { background: var(--bg-secondary); border-top: 1px solid var(--border); padding: 5rem 1.5rem 2rem; position: relative; overflow: hidden; }
        .footer-mesh { position: absolute; inset: 0; background: radial-gradient(circle at 50% 100%, rgba(59, 130, 246, 0.05) 0%, transparent 50%); pointer-events: none; }
        .footer-wrap { max-width: 1200px; margin: 0 auto; position: relative; z-index: 10; }

        .footer-main { display: grid; grid-template-columns: 1.5fr 1fr 1fr; gap: 4rem; margin-bottom: 5rem; }
        @media (max-width: 968px) { .footer-main { grid-template-columns: 1fr; gap: 3rem; } }

        .footer-logo { font-family: 'Syne', sans-serif; font-size: 2rem; font-weight: 800; letter-spacing: -2px; margin: 0 0 1.5rem; color: var(--text-primary); }
        .footer-logo span { color: var(--accent-blue); }
        .footer-tagline { color: var(--text-muted); line-height: 1.6; font-size: 0.95rem; max-width: 350px; }
        
        .footer-badges { display: flex; gap: 0.75rem; margin-top: 2rem; flex-wrap: wrap; }
        .badge { font-size: 0.6rem; font-weight: 900; color: var(--accent-blue); background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2); padding: 0.3rem 0.8rem; border-radius: 2rem; letter-spacing: 1px; }

        .links-zone { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
        .link-group h4 { font-size: 0.75rem; font-weight: 900; color: var(--text-muted); margin-bottom: 1.5rem; letter-spacing: 2px; }
        .link-group ul { list-style: none; padding: 0; margin: 0; }
        .link-group li { margin-bottom: 0.75rem; }
        .link-group a { text-decoration: none; color: var(--text-secondary); font-size: 0.9rem; font-weight: 600; transition: 0.3s; }
        .link-group a:hover { color: var(--accent-blue); padding-left: 5px; }

        .humour-zone h4 { font-size: 0.75rem; font-weight: 900; color: var(--text-muted); margin-bottom: 1.5rem; letter-spacing: 2px; }
        .joke-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 1.5rem; padding: 2rem; position: relative; overflow: hidden; min-height: 120px; display: flex; align-items: center; justify-content: center; text-align: center; }
        .joke-card p { margin: 0; font-size: 0.9rem; color: var(--text-secondary); font-weight: 500; font-style: italic; line-height: 1.5; }
        .joke-progress { position: absolute; bottom: 0; left: 0; width: 100%; height: 2px; background: var(--border); }
        .progress-bar { height: 100%; background: #3b82f6; animation: progress 8s linear infinite; }
        @keyframes progress { from { width: 0%; } to { width: 100%; } }

        .footer-bottom { border-top: 1px solid var(--border); padding-top: 2rem; display: flex; justify-content: space-between; align-items: center; color: var(--text-muted); font-size: 0.75rem; font-weight: 700; }
        @media (max-width: 600px) { .footer-bottom { flex-direction: column; gap: 1rem; text-align: center; } }
        .footer-dot { margin: 0 0.5rem; }
        .made-by span { color: var(--accent-blue); }
      `}</style>
    </footer>
  );
}
