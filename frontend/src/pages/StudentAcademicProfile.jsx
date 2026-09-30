import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import SEO from '../components/SEO';
import { useAuth } from '../context/AuthContext';
import { getStudentAcademicProfile } from '../services/academicProfileService';

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI'];

function GradeColor({ grade }) {
  const g = (grade || '').toUpperCase().trim();
  let color = '#94a3b8';
  if (g === 'A+' || g === 'O') color = '#00ffcc';
  else if (g === 'A') color = '#10b981';
  else if (g === 'B+') color = '#3b82f6';
  else if (g === 'B') color = '#6366f1';
  else if (g === 'C') color = '#f59e0b';
  else if (g === 'F' || g === 'AB' || g === 'FAIL') color = '#f43f5e';
  return <span style={{ color, fontWeight: 900 }}>{grade || 'N/A'}</span>;
}

function SGPABar({ sgpa }) {
  const pct = sgpa ? Math.min((sgpa / 10) * 100, 100) : 0;
  const color = sgpa >= 8 ? '#10b981' : sgpa >= 6 ? '#3b82f6' : '#f43f5e';
  return (
    <div className="apx-bar-track">
      <div className="apx-bar-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

export default function StudentAcademicProfile() {
  const { role, isAdmin } = useAuth();
  const canSearch = role === 'teacher' || role === 'tpo' || isAdmin;

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 6 });
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [expandedSems, setExpandedSems] = useState({});

  const handleSearch = useCallback(async (e) => {
    e?.preventDefault();
    const trimmed = query.trim().toUpperCase();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setProfile(null);
    setProgress({ current: 0, total: 6 });

    try {
      const result = await getStudentAcademicProfile(trimmed, (sem, total) => {
        setProgress({ current: sem, total });
      });

      if (!result.found) {
        setError('No student found with this enrollment number. Please check and try again.');
      } else if (result.noResults) {
        setProfile(result);
        setError(null);
      } else {
        setProfile(result);
        setError(null);
      }
    } catch (err) {
      if (err.message.includes('Invalid enrollment')) {
        setError('Invalid enrollment number format. Example: 0101CS221001');
      } else if (err.message.includes('Database')) {
        setError('Database connection error. Please try again.');
      } else {
        setError('Unable to fetch academic data. The RGPV portal may be temporarily unavailable.');
      }
    } finally {
      setLoading(false);
    }
  }, [query]);

  const toggleSemester = (sem) => {
    setExpandedSems(prev => ({ ...prev, [sem]: !prev[sem] }));
  };

  if (!canSearch) {
    return (
      <div className="apx-wrap">
        <div className="apx-access-denied">
          <div className="apx-denied-icon">🔒</div>
          <h2>Access Restricted</h2>
          <p>The Academic Profile search is available to Teachers, TPO, and Administrators only.</p>
          <Link to="/" className="apx-btn-primary">Return Home</Link>
        </div>
        <ProfileStyles />
      </div>
    );
  }

  const { student, academicSummary, semesterResults = [], backlogDetails = [] } = profile || {};

  return (
    <div className="apx-wrap">
      <SEO title="Student Academic Profile | ProjectX" description="Search and view student academic records" urlPath="/teacher/academic-profile" />
      <div className="apx-mesh" />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="apx-header">
        <Link to="/teacher" className="apx-back">← Back to Faculty Dashboard</Link>
        <div className="apx-header-title">
          <h1>Student Academic Profile</h1>
          <p>Search by enrollment number to view complete academic history from RGPV records</p>
        </div>
      </motion.div>

      {/* Search Box */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="apx-search-card">
        <form onSubmit={handleSearch} className="apx-search-form">
          <div className="apx-search-label">Enrollment Number</div>
          <div className="apx-search-row">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value.toUpperCase())}
              placeholder="e.g. 0101CS221001"
              className="apx-input"
              disabled={loading}
              maxLength={20}
              autoFocus
            />
            <button type="submit" className="apx-btn-search" disabled={loading || !query.trim()}>
              {loading ? <span className="apx-spinner" /> : 'SEARCH'}
            </button>
          </div>
          {loading && (
            <div className="apx-progress">
              <div className="apx-progress-bar" style={{ width: `${(progress.current / progress.total) * 100}%` }} />
              <span>Checking semester {progress.current} of {progress.total}...</span>
            </div>
          )}
        </form>
      </motion.div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="apx-error">
            ⚠️ {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {profile?.found && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="apx-results">

            {/* Student Info Card */}
            <div className="apx-card apx-student-card">
              <div className="apx-card-pill">👤 Student Information</div>
              <div className="apx-student-grid">
                <div className="apx-info-item"><span>Name</span><strong>{student?.name || '—'}</strong></div>
                <div className="apx-info-item"><span>Enrollment No.</span><strong>{student?.rollNumber || '—'}</strong></div>
                <div className="apx-info-item"><span>Branch</span><strong>{student?.branch || '—'}</strong></div>
                <div className="apx-info-item"><span>College</span><strong>{student?.college || 'RGPV'}</strong></div>
                <div className="apx-info-item"><span>Current Semester</span><strong>Semester {student?.currentSemester || '—'}</strong></div>
                <div className="apx-info-item"><span>Data Source</span><strong>{student?._fromCache ? '📦 RGPV Cache' : '✅ Profile + RGPV'}</strong></div>
              </div>
              {student?._lastResultAt && (
                <div className="apx-last-updated">Last result fetched: {new Date(student._lastResultAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
              )}
            </div>

            {/* No results yet */}
            {profile.noResults && (
              <div className="apx-card apx-empty-state">
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                <h3>No Academic Results Found</h3>
                <p>Student profile found, but no semester result data is available yet.<br />
                The student may not have checked their results through ProjectX, or RGPV portal data is not yet available for this enrollment number.</p>
              </div>
            )}

            {/* Academic Summary */}
            {academicSummary && (
              <div className="apx-card">
                <div className="apx-card-pill">📊 Academic Overview</div>
                <div className="apx-summary-grid">
                  <div className="apx-stat-card">
                    <div className="apx-stat-label">CGPA</div>
                    <div className="apx-stat-value" style={{ color: '#3b82f6' }}>
                      {academicSummary.currentCGPA?.toFixed(2) ?? '—'}
                    </div>
                    <div className="apx-stat-sub">Cumulative</div>
                  </div>
                  <div className="apx-stat-card">
                    <div className="apx-stat-label">SGPA</div>
                    <div className="apx-stat-value" style={{ color: '#10b981' }}>
                      {academicSummary.currentSGPA?.toFixed(2) ?? '—'}
                    </div>
                    <div className="apx-stat-sub">Latest Semester</div>
                  </div>
                  <div className="apx-stat-card">
                    <div className="apx-stat-label">Active Backlogs</div>
                    <div className="apx-stat-value" style={{ color: academicSummary.activeBacklogs > 0 ? '#f43f5e' : '#10b981' }}>
                      {academicSummary.activeBacklogs}
                    </div>
                    <div className="apx-stat-sub">Current</div>
                  </div>
                  <div className="apx-stat-card">
                    <div className="apx-stat-label">Semesters</div>
                    <div className="apx-stat-value" style={{ color: '#f59e0b' }}>
                      {academicSummary.semestersCompleted}
                    </div>
                    <div className="apx-stat-sub">Completed</div>
                  </div>
                </div>
                <div className="apx-status-row">
                  <span className={`apx-status-badge ${academicSummary.activeBacklogs === 0 ? 'good' : 'risk'}`}>
                    {academicSummary.activeBacklogs === 0 ? '✅ Good Standing' : `⚠️ ${academicSummary.activeBacklogs} Active Backlog(s)`}
                  </span>
                  {academicSummary.clearedBacklogs > 0 && (
                    <span className="apx-status-badge cleared">🏆 {academicSummary.clearedBacklogs} Backlog(s) Cleared</span>
                  )}
                </div>
              </div>
            )}

            {/* Semester Performance */}
            {semesterResults.length > 0 && (
              <div className="apx-card">
                <div className="apx-card-pill">📈 Semester Performance</div>
                <div className="apx-table-wrap">
                  <table className="apx-table">
                    <thead>
                      <tr>
                        <th>Semester</th>
                        <th>SGPA</th>
                        <th>CGPA</th>
                        <th>Backlogs</th>
                        <th>Status</th>
                        <th>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {semesterResults.map(r => (
                        <>
                          <tr key={r.semester} className="apx-sem-row">
                            <td><strong>Semester {ROMAN[r.semester] || r.semester}</strong></td>
                            <td>
                              <div>{r.sgpa?.toFixed(2) ?? '—'}</div>
                              <SGPABar sgpa={r.sgpa} />
                            </td>
                            <td className="apx-highlight">{r.cgpa?.toFixed(2) ?? '—'}</td>
                            <td>
                              <span className={r.backlogs > 0 ? 'apx-backlog-badge active' : 'apx-backlog-badge none'}>
                                {r.backlogs}
                              </span>
                            </td>
                            <td>
                              <span className={`apx-pass-badge ${r.isPass ? 'pass' : 'fail'}`}>
                                {r.resultDescription || (r.isPass ? 'PASS' : 'FAIL')}
                              </span>
                            </td>
                            <td>
                              {r.subjects.length > 0 && (
                                <button className="apx-expand-btn" onClick={() => toggleSemester(r.semester)}>
                                  {expandedSems[r.semester] ? '▲ Hide' : '▼ Subjects'}
                                </button>
                              )}
                            </td>
                          </tr>
                          {expandedSems[r.semester] && r.subjects.length > 0 && (
                            <tr key={`${r.semester}-subjects`} className="apx-subjects-row">
                              <td colSpan={6}>
                                <div className="apx-subjects-wrap">
                                  <table className="apx-subjects-table">
                                    <thead>
                                      <tr>
                                        <th>Paper Code</th>
                                        <th>Total Credit</th>
                                        <th>Earned Credit</th>
                                        <th>Grade</th>
                                        <th>Status</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {r.subjects.map((s, i) => (
                                        <tr key={i} className={s.isBacklog ? 'apx-subject-backlog' : ''}>
                                          <td>{s.code}</td>
                                          <td>{s.totalCredit}</td>
                                          <td>{s.earnedCredit}</td>
                                          <td><GradeColor grade={s.grade} /></td>
                                          <td>
                                            <span className={`apx-mini-badge ${s.isBacklog ? 'fail' : 'pass'}`}>
                                              {s.isBacklog ? 'BACKLOG' : 'PASS'}
                                            </span>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* SGPA Graph */}
                <div className="apx-graph-section">
                  <div className="apx-card-pill" style={{ marginBottom: '1.5rem' }}>📉 SGPA Progression</div>
                  <div className="apx-graph">
                    {semesterResults.map(r => (
                      <div key={r.semester} className="apx-graph-col">
                        <div className="apx-graph-val">{r.sgpa?.toFixed(2) ?? '—'}</div>
                        <div
                          className="apx-graph-bar"
                          style={{
                            height: r.sgpa ? `${(r.sgpa / 10) * 120}px` : '4px',
                            background: r.sgpa >= 8 ? 'rgba(16,185,129,0.8)' : r.sgpa >= 6 ? 'rgba(59,130,246,0.8)' : 'rgba(244,63,94,0.8)',
                          }}
                        />
                        <div className="apx-graph-label">Sem {ROMAN[r.semester] || r.semester}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Backlog Details */}
            {backlogDetails.length > 0 && (
              <div className="apx-card">
                <div className="apx-card-pill">⚠️ Backlog Details</div>
                <div className="apx-table-wrap">
                  <table className="apx-table">
                    <thead>
                      <tr>
                        <th>Paper Code</th>
                        <th>First Appeared</th>
                        <th>Status</th>
                        <th>Cleared In</th>
                      </tr>
                    </thead>
                    <tbody>
                      {backlogDetails.map((b, i) => (
                        <tr key={i}>
                          <td><strong>{b.code}</strong></td>
                          <td>Semester {ROMAN[b.firstBacklogSemester] || b.firstBacklogSemester}</td>
                          <td>
                            <span className={`apx-pass-badge ${b.status === 'cleared' ? 'pass' : 'fail'}`}>
                              {b.status === 'cleared' ? '✅ CLEARED' : '🔴 ACTIVE'}
                            </span>
                          </td>
                          <td>{b.clearedInSemester ? `Semester ${ROMAN[b.clearedInSemester] || b.clearedInSemester}` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </motion.div>
        )}
      </AnimatePresence>

      <ProfileStyles />
    </div>
  );
}

function ProfileStyles() {
  return (
    <style>{`
      .apx-wrap { min-height: 100vh; background: var(--bg-primary); color: var(--text-primary); font-family: 'Space Grotesk', sans-serif; position: relative; overflow-x: hidden; }
      .apx-mesh { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.07) 0%, transparent 40%), radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.05) 0%, transparent 40%); pointer-events: none; z-index: 0; }
      
      .apx-header { max-width: 900px; margin: 0 auto; padding: clamp(6rem, 11vw, 9.5rem) var(--container-px) 2rem; position: relative; z-index: 10; }
      .apx-back { display: inline-flex; align-items: center; gap: 0.5rem; color: var(--accent-blue); text-decoration: none; font-weight: 800; font-size: 0.85rem; margin-bottom: 1.5rem; transition: 0.2s; }
      .apx-back:hover { gap: 0.75rem; }
      .apx-header-title h1 { font-family: 'Syne', sans-serif; font-size: clamp(1.8rem, 6vw, 3rem); font-weight: 800; margin: 0; }
      .apx-header-title p { color: var(--text-secondary); margin: 0.5rem 0 0; font-size: 0.95rem; }
      
      .apx-search-card { max-width: 900px; margin: 0 auto 1.5rem; padding: 0 var(--container-px); position: relative; z-index: 10; }
      .apx-search-form { background: var(--bg-card); border: 1px solid var(--border); border-radius: 2rem; padding: 2rem; }
      .apx-search-label { font-size: 0.7rem; font-weight: 900; letter-spacing: 2px; color: var(--text-muted); text-transform: uppercase; margin-bottom: 1rem; }
      .apx-search-row { display: flex; gap: 1rem; }
      .apx-input { flex: 1; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 1rem; padding: 1rem 1.5rem; color: var(--text-primary); font-weight: 700; font-size: 1.05rem; font-family: 'Space Grotesk', sans-serif; outline: none; transition: 0.3s; letter-spacing: 1px; }
      .apx-input:focus { border-color: var(--accent-blue); background: var(--bg-primary); }
      .apx-btn-search { background: var(--accent-blue); color: #fff; border: none; border-radius: 1rem; padding: 1rem 2rem; font-weight: 900; font-size: 0.9rem; cursor: pointer; transition: 0.3s; min-width: 110px; display: flex; align-items: center; justify-content: center; letter-spacing: 1px; }
      .apx-btn-search:hover:not(:disabled) { background: #2563eb; transform: translateY(-2px); box-shadow: 0 8px 20px rgba(59,130,246,0.4); }
      .apx-btn-search:disabled { opacity: 0.5; cursor: not-allowed; }
      .apx-spinner { width: 20px; height: 20px; border: 3px solid rgba(255,255,255,0.2); border-top-color: #fff; border-radius: 50%; animation: apx-spin 0.7s linear infinite; }
      @keyframes apx-spin { to { transform: rotate(360deg); } }
      .apx-progress { margin-top: 1.25rem; }
      .apx-progress-bar { height: 3px; background: var(--accent-blue); border-radius: 2px; transition: width 0.4s; margin-bottom: 0.5rem; box-shadow: 0 0 10px rgba(59,130,246,0.5); }
      .apx-progress span { font-size: 0.75rem; color: var(--text-muted); font-weight: 700; }
      @media (max-width: 640px) { .apx-search-row { flex-direction: column; } .apx-btn-search { width: 100%; } }

      .apx-error { max-width: 900px; margin: 0 auto 1.5rem; padding: 0 var(--container-px); position: relative; z-index: 10; }
      .apx-error { background: rgba(244,63,94,0.1); border: 1px solid rgba(244,63,94,0.25); border-radius: 1.5rem; padding: 1.25rem 1.75rem; color: #fb7185; font-weight: 700; max-width: 860px; }
      
      .apx-results { max-width: 900px; margin: 0 auto; padding: 0 var(--container-px) 6rem; position: relative; z-index: 10; display: flex; flex-direction: column; gap: 1.5rem; }
      
      .apx-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 2rem; padding: clamp(1.5rem, 4vw, 2.5rem); }
      .apx-card-pill { display: inline-block; padding: 0.5rem 1.5rem; background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.2); border-radius: 2rem; font-size: 0.75rem; font-weight: 900; letter-spacing: 2px; color: var(--accent-blue); text-transform: uppercase; margin-bottom: 1.75rem; }
      
      .apx-student-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
      @media (max-width: 640px) { .apx-student-grid { grid-template-columns: 1fr; } }
      .apx-info-item { background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 1rem; padding: 1rem 1.25rem; }
      .apx-info-item span { display: block; font-size: 0.7rem; font-weight: 900; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.4rem; }
      .apx-info-item strong { font-size: 1rem; font-weight: 800; color: var(--text-primary); }
      .apx-last-updated { margin-top: 1.25rem; font-size: 0.75rem; color: var(--text-muted); font-weight: 700; }

      .apx-summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
      @media (max-width: 640px) { .apx-summary-grid { grid-template-columns: repeat(2, 1fr); } }
      .apx-stat-card { background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 1.5rem; padding: 1.5rem 1rem; text-align: center; }
      .apx-stat-label { font-size: 0.65rem; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; color: var(--text-muted); margin-bottom: 0.5rem; }
      .apx-stat-value { font-size: 2.2rem; font-weight: 900; font-family: 'Syne', sans-serif; margin-bottom: 0.25rem; }
      .apx-stat-sub { font-size: 0.7rem; color: var(--text-muted); font-weight: 700; }
      .apx-status-row { display: flex; gap: 0.75rem; flex-wrap: wrap; }
      .apx-status-badge { padding: 0.5rem 1.25rem; border-radius: 2rem; font-size: 0.8rem; font-weight: 800; }
      .apx-status-badge.good { background: rgba(16,185,129,0.1); color: #10b981; border: 1px solid rgba(16,185,129,0.25); }
      .apx-status-badge.risk { background: rgba(244,63,94,0.1); color: #f43f5e; border: 1px solid rgba(244,63,94,0.25); }
      .apx-status-badge.cleared { background: rgba(245,158,11,0.1); color: var(--accent-gold); border: 1px solid rgba(245,158,11,0.25); }

      .apx-table-wrap { width: 100%; overflow-x: auto; border-radius: 1.5rem; }
      .apx-table { width: 100%; border-collapse: separate; border-spacing: 0; }
      .apx-table th { background: rgba(59,130,246,0.08); color: var(--text-muted); font-size: 0.7rem; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px; padding: 1rem 1.25rem; border-bottom: 1px solid var(--border); text-align: left; white-space: nowrap; }
      .apx-table td { padding: 1rem 1.25rem; border-bottom: 1px solid var(--border); font-weight: 600; vertical-align: middle; }
      .apx-table tr:last-child td { border-bottom: none; }
      .apx-table tr:hover td { background: rgba(255,255,255,0.02); }
      .apx-highlight { color: var(--accent-blue); font-weight: 800; }
      .apx-sem-row td { font-size: 0.95rem; }
      .apx-subjects-row td { padding: 0; background: rgba(0,0,0,0.15); }
      .apx-subjects-wrap { padding: 1.25rem; }
      .apx-subjects-table { width: 100%; border-collapse: collapse; }
      .apx-subjects-table th { font-size: 0.65rem; letter-spacing: 1px; text-transform: uppercase; font-weight: 900; color: var(--text-muted); padding: 0.75rem 1rem; text-align: left; }
      .apx-subjects-table td { padding: 0.75rem 1rem; font-size: 0.88rem; border-top: 1px solid var(--border); }
      .apx-subject-backlog td { background: rgba(244,63,94,0.05); }
      .apx-expand-btn { background: none; border: 1px solid var(--border); color: var(--text-muted); padding: 0.35rem 0.85rem; border-radius: 0.75rem; font-size: 0.75rem; font-weight: 800; cursor: pointer; transition: 0.2s; white-space: nowrap; }
      .apx-expand-btn:hover { border-color: var(--accent-blue); color: var(--accent-blue); }
      .apx-pass-badge { padding: 0.3rem 0.9rem; border-radius: 2rem; font-size: 0.7rem; font-weight: 900; }
      .apx-pass-badge.pass { background: rgba(16,185,129,0.1); color: #10b981; }
      .apx-pass-badge.fail { background: rgba(244,63,94,0.1); color: #f43f5e; }
      .apx-backlog-badge { padding: 0.25rem 0.75rem; border-radius: 2rem; font-size: 0.8rem; font-weight: 900; }
      .apx-backlog-badge.active { background: rgba(244,63,94,0.1); color: #f43f5e; }
      .apx-backlog-badge.none { background: rgba(16,185,129,0.1); color: #10b981; }
      .apx-mini-badge { padding: 0.2rem 0.6rem; border-radius: 1rem; font-size: 0.65rem; font-weight: 900; }
      .apx-mini-badge.pass { background: rgba(16,185,129,0.1); color: #10b981; }
      .apx-mini-badge.fail { background: rgba(244,63,94,0.15); color: #f43f5e; }

      .apx-bar-track { height: 4px; background: var(--border); border-radius: 2px; margin-top: 0.4rem; overflow: hidden; }
      .apx-bar-fill { height: 100%; border-radius: 2px; transition: width 0.8s ease; }

      .apx-graph-section { margin-top: 2.5rem; padding-top: 2rem; border-top: 1px solid var(--border); }
      .apx-graph { display: flex; align-items: flex-end; gap: 1.5rem; min-height: 160px; padding: 1rem 0.5rem; overflow-x: auto; }
      .apx-graph-col { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; flex-shrink: 0; min-width: 60px; }
      .apx-graph-val { font-size: 0.8rem; font-weight: 900; color: var(--text-primary); }
      .apx-graph-bar { width: 36px; border-radius: 6px 6px 0 0; transition: height 0.8s ease; min-height: 4px; box-shadow: 0 -4px 12px rgba(59,130,246,0.3); }
      .apx-graph-label { font-size: 0.7rem; font-weight: 800; color: var(--text-muted); text-align: center; }

      .apx-empty-state { text-align: center; padding: 3rem; }
      .apx-empty-state h3 { font-size: 1.3rem; font-weight: 800; margin: 0 0 1rem; }
      .apx-empty-state p { color: var(--text-secondary); line-height: 1.7; }
      
      .apx-access-denied { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 80vh; text-align: center; padding: 2rem; }
      .apx-denied-icon { font-size: 4rem; margin-bottom: 1rem; }
      .apx-access-denied h2 { font-size: 2rem; font-weight: 800; margin: 0 0 1rem; }
      .apx-access-denied p { color: var(--text-secondary); max-width: 400px; margin: 0 0 2rem; line-height: 1.7; }
      .apx-btn-primary { background: var(--accent-blue); color: #fff; text-decoration: none; padding: 0.85rem 2rem; border-radius: 1rem; font-weight: 800; transition: 0.3s; }
      .apx-btn-primary:hover { background: #2563eb; transform: translateY(-2px); }
    `}</style>
  );
}
