import { motion } from 'framer-motion';
import { BRANCHES, SEMESTERS, RESOURCE_TYPES } from '../utils/constants';

export default function FilterBar({ 
  branch, 
  semester, 
  search = '', 
  type,
  onBranchChange, 
  onSemesterChange, 
  onSearchChange,
  onTypeChange 
}) {
  return (
    <div className="filter-bar-container">
      <div className="filter-grid">
        {/* Search */}
        <div className="filter-item search-box">
          <label className="selector-label">Search Resources</label>
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by subject, title or topic..."
              className="premium-input"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>

        {/* Resource Type */}
        <div className="filter-item">
          <label className="selector-label">Resource Type</label>
          <div className="premium-tab-group scrollable">
            {RESOURCE_TYPES.map((t) => (
              <button
                key={t}
                className={`premium-tab ${type === t ? 'active' : ''}`}
                onClick={() => onTypeChange(t)}
              >
                {type === t && (
                  <motion.div 
                    layoutId="type-bg" 
                    className="tab-active-bg"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="tab-text">{t.charAt(0).toUpperCase() + t.slice(1)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Branch */}
        <div className="filter-item">
          <label className="selector-label">Branch</label>
          <div className="premium-tab-group scrollable">
            <button
              className={`premium-tab ${!branch ? 'active' : ''}`}
              onClick={() => onBranchChange('')}
            >
              {!branch && (
                <motion.div 
                  layoutId="branch-bg" 
                  className="tab-active-bg"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="tab-text">All</span>
            </button>
            {BRANCHES.map((b) => (
              <button
                key={b}
                className={`premium-tab ${branch === b ? 'active' : ''}`}
                onClick={() => onBranchChange(b)}
              >
                {branch === b && (
                  <motion.div 
                    layoutId="branch-bg" 
                    className="tab-active-bg"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="tab-text">{b}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Semester */}
        <div className="filter-item">
          <label className="selector-label">Semester</label>
          <div className="premium-tab-group scrollable">
            <button
              className={`premium-tab ${!semester ? 'active' : ''}`}
              onClick={() => onSemesterChange('')}
            >
              {!semester && (
                <motion.div 
                  layoutId="sem-bg" 
                  className="tab-active-bg"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="tab-text">All</span>
            </button>
            {SEMESTERS.map((s) => (
              <button
                key={s}
                className={`premium-tab ${semester === s ? 'active' : ''}`}
                onClick={() => onSemesterChange(s)}
              >
                {semester === s && (
                  <motion.div 
                    layoutId="sem-bg" 
                    className="tab-active-bg"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="tab-text">Sem {s}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .filter-bar-container { 
          background: var(--bg-card); 
          border: 1px solid var(--border); 
          border-radius: 2rem; 
          padding: 2rem; 
          backdrop-filter: blur(20px);
          margin-bottom: 2.5rem;
          box-shadow: var(--shadow-md);
        }
        
        .filter-grid { 
          display: grid; 
          grid-template-columns: 1.2fr 1fr 1fr 1fr; 
          gap: 2rem; 
        }
        
        @media (max-width: 1100px) {
          .filter-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 650px) {
          .filter-grid { grid-template-columns: 1fr; }
          .filter-bar-container { padding: 1.5rem; }
        }

        .filter-item {
          min-width: 0;
        }

        .selector-label { 
          font-size: 0.7rem; 
          font-weight: 900; 
          color: var(--text-muted); 
          margin-bottom: 1rem; 
          display: block; 
          text-transform: uppercase; 
          letter-spacing: 2px; 
        }

        .search-input-wrapper { position: relative; }
        .search-icon { position: absolute; left: 1.25rem; top: 50%; transform: translateY(-50%); opacity: 0.4; font-size: 1.1rem; }
        
        .premium-input { 
          width: 100%; 
          background: var(--bg-secondary); 
          border: 1px solid var(--border); 
          border-radius: 1.25rem; 
          padding: 1rem 1.25rem 1rem 3.2rem; 
          color: var(--text-primary); 
          font-weight: 600; 
          font-size: 0.95rem; 
          outline: none; 
          transition: 0.3s; 
        }
        .premium-input:focus { border-color: var(--accent-blue); background: var(--bg-primary); }

        .premium-tab-group { 
          display: flex; 
          background: var(--bg-secondary); 
          padding: 0.4rem; 
          border-radius: 1.25rem; 
          border: 1px solid var(--border);
          gap: 0.25rem;
        }
        
        .premium-tab-group.scrollable {
          overflow-x: auto;
          scrollbar-width: none;
        }
        .premium-tab-group.scrollable::-webkit-scrollbar { display: none; }

        .premium-tab { 
          flex: 1; 
          min-width: fit-content;
          position: relative; 
          padding: 0.7rem 1.2rem; 
          border: none; 
          background: transparent; 
          color: var(--text-muted); 
          font-weight: 700; 
          font-size: 0.85rem; 
          cursor: pointer; 
          border-radius: 0.9rem; 
          transition: color 0.3s;
          white-space: nowrap;
        }
        
        .premium-tab.active { color: #fff; }
        .premium-tab:hover:not(.active) { color: var(--text-primary); }
        
        .tab-active-bg { 
          position: absolute; 
          inset: 0; 
          background: var(--accent-blue); 
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3); 
          border-radius: 0.9rem; 
          z-index: 0; 
        }
        
        .tab-text { position: relative; z-index: 1; }
      `}</style>
    </div>
  );
}
