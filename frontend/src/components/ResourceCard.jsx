import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { submitRating, trackDownload, getProxiedPdfUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

const TYPE_META = {
  notes: { btnClass: 'notes-btn', icon: '📝', label: 'Notes', color: 'var(--accent-blue)' },
  pyq: { btnClass: 'pyq-btn', icon: '📄', label: 'PYQ', color: 'var(--accent-green)' },
  syllabus: { btnClass: 'syllabus-btn', icon: '📋', label: 'Syllabus', color: 'var(--accent-purple)' }
};

function ResourceCard ({
  item,
  type,
  ratingInfo = { average: 0, count: 0 },
  userRating = null,
  onRatingSubmitted
}) {
  const meta = TYPE_META[type] || TYPE_META.notes;
  const { user } = useAuth();
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  
  const resourceUrl = typeof item.file_url === 'string' ? getProxiedPdfUrl(item.file_url.trim()) : '';
  const hasDownload = Boolean(resourceUrl && resourceUrl !== '#');

  const openResource = (url) => {
    try {
      const resolved = new URL(url).toString();
      const popup = window.open(resolved, '_blank', 'noopener,noreferrer');
      if (!popup) {
        window.location.assign(resolved);
      }
    } catch {
      toast.error('This file link is invalid.');
    }
  };

  const handleRate = async (value) => {
    if (!user) {
      toast.error('Login to rate first.');
      return;
    }

    if (isSubmittingRating) return;

    setIsSubmittingRating(true);
    try {
      await submitRating(item.id, value);
      if (typeof onRatingSubmitted === 'function') {
        await onRatingSubmitted();
      }
      toast.success('Rating submitted.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const handleDownload = () => {
    if (!hasDownload) return;
    trackDownload(item.id).catch(() => {});
    openResource(resourceUrl);
  };

  const handlePreview = () => {
    if (!hasDownload) return;
    openResource(resourceUrl);
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      className="resource-card premium-card"
    >
      <div className="card-glass-overlay"></div>
      
      <div className="resource-type-badge" style={{ background: meta.color }}>
        {meta.icon} {meta.label}
      </div>

      <div className="resource-icon-wrapper">
        <div className="resource-icon-bg" style={{ background: meta.color, opacity: 0.1 }}></div>
        <div className="resource-icon">{item.icon || meta.icon}</div>
      </div>

      <div className="resource-title">{item.title || item.subject || 'Untitled'}</div>
      
      <div className="resource-meta-row">
        <span className="meta-tag">{item.branch}</span>
        <span className="meta-sep">•</span>
        <span className="meta-tag">Sem {item.semester}</span>
        {item.year && <><span className="meta-sep">•</span><span className="meta-tag">{item.year}</span></>}
      </div>

      <div className="card-stats">
        {item.file_size && <div className="stat-item"><span>Size:</span> <strong>{item.file_size}</strong></div>}
        {item.download_count !== undefined && <div className="stat-item"><span>Downloads:</span> <strong>{item.download_count}</strong></div>}
      </div>

      {item.topics && item.topics.length > 0 && (
        <div className="resource-topics">
          {item.topics.slice(0, 3).map((topic, idx) => (
            <span key={idx} className="topic-pill">{topic}</span>
          ))}
          {item.topics.length > 3 && <span className="topic-pill-more">+{item.topics.length - 3} more</span>}
        </div>
      )}

      <div className="card-footer">
        {hasDownload ? (
          <div className="card-actions-grid">
            <button
              type="button"
              onClick={handlePreview}
              className="btn-preview-premium"
            >
              👁 Preview
            </button>
            <button
              type="button"
              className={`btn-download-premium ${meta.btnClass}`}
              onClick={handleDownload}
            >
              <span className="dl-icon">⬇</span> Download
            </button>
          </div>
        ) : (
          <div className="coming-soon-badge">Coming Soon</div>
        )}
      </div>

      <style>{`
        .premium-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 1.75rem;
          padding: 1.75rem;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          transition: border-color 0.3s, box-shadow 0.3s;
          backdrop-filter: blur(10px);
        }
        .premium-card:hover {
          border-color: var(--accent-blue);
          box-shadow: 0 20px 40px rgba(0,0,0,0.2), 0 0 0 1px rgba(59, 130, 246, 0.2);
        }
        
        .card-glass-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 100%);
          pointer-events: none;
        }

        .resource-type-badge {
          position: absolute;
          top: 1rem;
          right: 1rem;
          padding: 0.3rem 0.8rem;
          border-radius: 2rem;
          font-size: 0.65rem;
          font-weight: 900;
          color: #fff;
          text-transform: uppercase;
          letter-spacing: 1px;
          z-index: 2;
        }

        .resource-icon-wrapper {
          width: 60px;
          height: 60px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 1.25rem;
          margin-bottom: 0.5rem;
        }
        .resource-icon-bg { position: absolute; inset: 0; border-radius: inherit; }
        .resource-icon { font-size: 1.75rem; position: relative; z-index: 1; }

        .resource-title {
          font-size: 1.2rem;
          font-weight: 800;
          color: var(--text-primary);
          line-height: 1.3;
          font-family: 'Syne', sans-serif;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 3.1rem;
        }

        .resource-meta-row { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
        .meta-tag { font-size: 0.75rem; font-weight: 700; color: var(--text-muted); }
        .meta-sep { color: var(--border); }

        .card-stats {
          display: flex;
          gap: 1.5rem;
          padding: 0.75rem 0;
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
        }
        .stat-item { font-size: 0.75rem; color: var(--text-muted); }
        .stat-item strong { color: var(--text-secondary); margin-left: 0.25rem; }

        .resource-topics { display: flex; flex-wrap: wrap; gap: 0.4rem; min-height: 1.8rem; }
        .topic-pill {
          background: rgba(var(--bg-glass-rgb), 0.05);
          color: var(--text-secondary);
          padding: 0.25rem 0.6rem;
          border-radius: 0.5rem;
          font-size: 0.7rem;
          font-weight: 600;
          border: 1px solid var(--border);
        }
        .topic-pill-more { font-size: 0.7rem; color: var(--text-muted); font-weight: 600; align-self: center; }

        .card-footer { margin-top: auto; }
        .card-actions-grid { display: grid; grid-template-columns: 1fr 1.2fr; gap: 0.75rem; }
        
        .btn-preview-premium {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          color: var(--text-primary);
          padding: 0.8rem;
          border-radius: 1rem;
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
          transition: 0.3s;
        }
        .btn-preview-premium:hover { background: var(--bg-card); border-color: var(--text-muted); }

        .btn-download-premium {
          background: var(--accent-blue);
          color: #fff;
          border: none;
          padding: 0.8rem;
          border-radius: 1rem;
          font-weight: 800;
          font-size: 0.85rem;
          cursor: pointer;
          transition: 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }
        .btn-download-premium:hover { filter: brightness(1.1); transform: translateY(-2px); box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3); }
        .btn-download-premium.pyq-btn { background: var(--accent-green); }
        .btn-download-premium.syllabus-btn { background: var(--accent-purple); }

        .coming-soon-badge {
          width: 100%;
          text-align: center;
          padding: 0.8rem;
          background: var(--bg-secondary);
          color: var(--text-muted);
          border-radius: 1rem;
          font-weight: 800;
          font-size: 0.85rem;
          border: 1px dashed var(--border);
        }
      `}</style>
    </motion.div>
  );
}

export default memo(ResourceCard);
