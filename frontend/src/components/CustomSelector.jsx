import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';

export default function CustomSelector({ value, onChange, options, label, disabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  return (
    <div className={`custom-selector-container ${disabled ? 'disabled' : ''}`} ref={containerRef}>
      {label && <label className="selector-label">{label}</label>}
      <div className="selector-wrapper">
        <button 
          type="button"
          className={`selector-trigger ${isOpen ? 'active' : ''}`}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
        >
          <span className="selected-value">{selectedOption.label}</span>
          <motion.span 
            className="chevron"
            animate={{ rotate: isOpen ? 180 : 0 }}
          >
            ▼
          </motion.span>
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div 
              className="selector-options"
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`option-item ${value === option.value ? 'selected' : ''}`}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                >
                  <span className="option-label">{option.label}</span>
                  {value === option.value && (
                    <motion.div 
                      layoutId="option-active-glow"
                      className="option-active-glow"
                    />
                  )}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        .custom-selector-container { width: 100%; position: relative; }
        .custom-selector-container.disabled { opacity: 0.5; cursor: not-allowed; }
        
        .selector-label { font-size: 0.75rem; font-weight: 800; color: var(--text-muted); margin-bottom: 0.75rem; display: block; text-transform: uppercase; letter-spacing: 1px; }
        
        .selector-wrapper { position: relative; width: 100%; z-index: 50; }
        
        .selector-trigger { 
          width: 100%; 
          background: var(--bg-secondary); 
          border: 1px solid var(--border); 
          border-radius: 1.25rem; 
          padding: 1.1rem 1.5rem; 
          color: var(--text-primary); 
          font-weight: 700; 
          font-size: 1rem; 
          display: flex; 
          align-items: center; 
          justify-content: space-between; 
          cursor: pointer; 
          transition: 0.3s;
          box-shadow: var(--shadow-sm);
        }
        
        .selector-trigger:hover:not(:disabled) { border-color: var(--accent-blue); background: rgba(var(--bg-glass-rgb), 0.1); }
        .selector-trigger.active { border-color: var(--accent-blue); box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
        
        .chevron { font-size: 0.7rem; opacity: 0.5; }
        
        .selector-options { 
          position: absolute; 
          top: calc(100% + 0.5rem); 
          left: 0; 
          right: 0; 
          background: var(--bg-card); 
          border: 1px solid var(--border); 
          border-radius: 1.5rem; 
          padding: 0.5rem; 
          backdrop-filter: blur(25px); 
          box-shadow: var(--shadow-lg); 
          z-index: 100;
          max-height: 300px;
          overflow-y: auto;
        }
        
        .option-item { 
          width: 100%; 
          padding: 0.8rem 1rem; 
          border: none; 
          background: transparent; 
          color: var(--text-secondary); 
          font-weight: 600; 
          font-size: 0.95rem; 
          text-align: left; 
          cursor: pointer; 
          border-radius: 0.85rem; 
          transition: 0.2s; 
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .option-item:hover { background: rgba(var(--bg-glass-rgb), 0.05); color: var(--text-primary); }
        .option-item.selected { color: var(--accent-blue); }
        
        .option-active-glow { 
          position: absolute; 
          inset: 0; 
          background: rgba(59, 130, 246, 0.1); 
          border: 1px solid rgba(59, 130, 246, 0.2); 
          border-radius: 0.85rem; 
          z-index: -1; 
        }

        /* Scrollbar styling */
        .selector-options::-webkit-scrollbar { width: 4px; }
        .selector-options::-webkit-scrollbar-track { background: transparent; }
        .selector-options::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }
      `}</style>
    </div>
  );
}
