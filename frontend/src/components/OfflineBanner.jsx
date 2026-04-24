import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function OfflineBanner({ isMock, onRetry }) {
  if (!isMock) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        className="offline-banner-elite"
      >
        <div className="banner-content">
          <div className="status-indicator">
            <span className="dot pulse-red"></span>
            <span className="label">OFFLINE MODE</span>
          </div>
          <div className="separator"></div>
          <p className="message">
            Cloud database unreachable. Showing elite local fallback data.
          </p>
          <button onClick={onRetry} className="retry-action">
            <span className="icon">🔄</span>
            RECONNECT
          </button>
        </div>

        <style jsx>{`
          .offline-banner-elite {
            position: sticky;
            top: 0;
            left: 0;
            width: 100%;
            z-index: 1001;
            background: rgba(239, 68, 68, 0.1);
            backdrop-filter: blur(12px);
            border-bottom: 1px solid rgba(239, 68, 68, 0.2);
            padding: 0.6rem 1rem;
            display: flex;
            justify-content: center;
          }

          .banner-content {
            display: flex;
            align-items: center;
            gap: 1rem;
            max-width: 1300px;
            width: 100%;
            margin: 0 auto;
          }

          .status-indicator {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            background: rgba(239, 68, 68, 0.2);
            padding: 0.25rem 0.6rem;
            border-radius: 6px;
            border: 1px solid rgba(239, 68, 68, 0.3);
          }

          .dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #ef4444;
          }

          .pulse-red {
            animation: pulse-red 2s infinite;
          }

          @keyframes pulse-red {
            0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
            70% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
            100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
          }

          .label {
            font-size: 0.65rem;
            font-weight: 900;
            color: #fca5a5;
            letter-spacing: 0.5px;
          }

          .separator {
            width: 1px;
            height: 14px;
            background: rgba(255, 255, 255, 0.1);
          }

          .message {
            font-size: 0.8rem;
            color: #fecaca;
            margin: 0;
            font-weight: 500;
            flex: 1;
          }

          .retry-action {
            background: #fff;
            color: #000;
            border: none;
            padding: 0.35rem 0.75rem;
            border-radius: 6px;
            font-size: 0.7rem;
            font-weight: 800;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.4rem;
            transition: 0.2s;
          }

          .retry-action:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(255, 255, 255, 0.2);
          }

          .retry-action .icon {
            font-size: 0.8rem;
          }

          @media (max-width: 640px) {
            .message { display: none; }
            .banner-content { justify-content: space-between; }
            .separator { display: none; }
          }
        `}</style>
      </motion.div>
    </AnimatePresence>
  );
}
