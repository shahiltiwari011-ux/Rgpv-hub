/**
 * MobileResult — Dedicated mobile result screen.
 * Reuses the exact same backend API (fetchProxyResult, getBackendHealth) but
 * renders in a clean, card-based mobile layout instead of the desktop hero.
 */
import { useState, useEffect } from 'react';
import { fetchProxyResult, getBackendHealth } from '../services/api';

const SEMESTERS = [1, 2, 3, 4, 5, 6];

export default function MobileResult() {
  const [enrollment, setEnrollment] = useState('');
  const [semester, setSemester] = useState('3');
  const [captcha, setCaptcha] = useState('');
  const [captchaImg, setCaptchaImg] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [serverStatus, setServerStatus] = useState('checking');

  useEffect(() => {
    const checkHealth = async () => {
      const data = await getBackendHealth();
      setServerStatus(data.status === 'online' ? 'online' : 'offline');
    };
    checkHealth();
  }, []);

  const checkResult = async (e, submittedCaptcha = '') => {
    if (e) e.preventDefault();
    const enrollTrim = enrollment.trim();
    if (!enrollTrim) return;

    setLoading(true);
    setError(null);

    if (!submittedCaptcha) {
      setResult(null);
      setSessionId(null);
      setCaptchaImg(null);
    }

    try {
      const data = await fetchProxyResult(enrollTrim, semester, submittedCaptcha, sessionId);

      if (data.success) {
        setResult(data.data);
        setCaptchaImg(null);
        setCaptcha('');
        setSessionId(null);
      } else if (data.type === 'captcha_required') {
        setCaptchaImg(data.captchaImg);
        setSessionId(data.sessionId);
      } else {
        handleError(data.type);
      }
    } catch (err) {
      handleError('network');
    } finally {
      setLoading(false);
    }
  };

  const handleError = (type) => {
    switch (type) {
      case 'captcha': setError('Invalid Captcha. Please try again.'); break;
      case 'not_found': setError('No records found for this enrollment/semester.'); break;
      case 'network':
        setError('Connection Lost. The portal is currently unreachable.');
        setServerStatus('offline');
        break;
      default: setError('RGPV Portal is busy. Retrying in a moment...');
    }
    if (type === 'captcha') { setCaptcha(''); setCaptchaImg(null); setSessionId(null); }
  };

  const getGradeColor = (grade) => {
    const g = grade.toUpperCase();
    if (g.includes('A+')) return '#00ffcc';
    if (g.includes('A')) return '#10b981';
    if (g.includes('B+')) return '#3b82f6';
    if (g.includes('B')) return '#6366f1';
    if (g.includes('C')) return '#f59e0b';
    return '#f43f5e';
  };

  const resetForm = () => {
    setResult(null);
    setError(null);
    setCaptcha('');
    setCaptchaImg(null);
    setSessionId(null);
  };

  return (
    <div className="m-result">
      {/* Header */}
      <div className="m-result-header">
        <h1>Academic Result</h1>
        <p>RGPV Diploma Result Portal</p>
      </div>

      {/* Server Status */}
      <div style={{ textAlign: 'center' }}>
        <div className={`m-server-status ${serverStatus}`}>
          <span className="m-status-dot"></span>
          {serverStatus === 'online' ? 'Server Online' : serverStatus === 'offline' ? 'Server Offline' : 'Checking...'}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="m-result-error">
          {error}
          <br />
          <button className="m-result-retry" onClick={resetForm}>Try Again</button>
        </div>
      )}

      {/* Search Form */}
      {!result && (
        <form onSubmit={checkResult} className="m-result-form">
          <div className="m-field">
            <label>Enrollment Number</label>
            <input
              type="text"
              value={enrollment}
              onChange={(e) => setEnrollment(e.target.value.toUpperCase())}
              placeholder="0101CS221001"
              disabled={serverStatus === 'offline'}
            />
          </div>

          <div className="m-field">
            <label>Semester</label>
            <div className="m-sem-filter">
              {SEMESTERS.map(s => (
                <button
                  key={s}
                  type="button"
                  className={`m-sem-pill ${semester === s.toString() ? 'active' : ''}`}
                  onClick={() => setSemester(s.toString())}
                >
                  Sem {s}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || serverStatus === 'offline' || !enrollment.trim()}
            className="m-result-btn"
          >
            {loading && !captchaImg ? <div className="m-spinner"></div> : 'Check Result'}
          </button>

          {/* Captcha Section */}
          {captchaImg && (
            <div className="m-captcha-section">
              <img src={captchaImg} alt="captcha" />
              <div className="m-captcha-row">
                <input
                  type="text"
                  value={captcha}
                  onChange={(e) => setCaptcha(e.target.value)}
                  placeholder="Enter code"
                  autoFocus
                />
                <button type="button" onClick={() => checkResult(null, captcha)}>
                  Verify
                </button>
              </div>
              <button
                type="button"
                onClick={() => checkResult()}
                style={{
                  marginTop: '8px', width: '100%', padding: '8px',
                  background: 'transparent', border: '1px solid var(--border)',
                  borderRadius: '8px', color: 'var(--text-muted)',
                  fontSize: '12px', fontWeight: '700', cursor: 'pointer'
                }}
              >
                ↻ Refresh Captcha
              </button>
            </div>
          )}
        </form>
      )}

      {/* Result Display */}
      {result && (
        <div>
          {/* Student Info Card */}
          <div className="m-result-card">
            <div className="m-result-card-title">Student Information</div>
            <div className="m-identity-row">
              <span className="m-identity-label">Name</span>
              <span className="m-identity-value">{result.name}</span>
            </div>
            <div className="m-identity-row">
              <span className="m-identity-label">Roll No</span>
              <span className="m-identity-value">{result.enroll}</span>
            </div>
            <div className="m-identity-row">
              <span className="m-identity-label">Branch</span>
              <span className="m-identity-value">{result.branch}</span>
            </div>
            <div className="m-identity-row">
              <span className="m-identity-label">Semester</span>
              <span className="m-identity-value">{result.semester || semester}</span>
            </div>
            <div className="m-identity-row">
              <span className="m-identity-label">Status</span>
              <span className="m-status-badge">{result.status}</span>
            </div>
          </div>

          {/* GPA Summary */}
          {result.summary && (
            <div className="m-result-card">
              <div className="m-result-card-title">Performance</div>
              <div className="m-gpa-grid">
                <div className="m-gpa-item">
                  <div className="m-gpa-value">{result.summary.sgpa || '—'}</div>
                  <div className="m-gpa-label">SGPA</div>
                </div>
                <div className="m-gpa-item">
                  <div className="m-gpa-value">{result.summary.cgpa || '—'}</div>
                  <div className="m-gpa-label">CGPA</div>
                </div>
              </div>
              <div style={{ marginTop: '12px' }}>
                <div className="m-identity-row">
                  <span className="m-identity-label">Result</span>
                  <span className="m-identity-value">{result.summary.resultDes}</span>
                </div>
                {result.summary.division && (
                  <div className="m-identity-row">
                    <span className="m-identity-label">Division</span>
                    <span className="m-identity-value">{result.summary.division}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Subject Cards */}
          <div className="m-result-card">
            <div className="m-result-card-title">Subject Grades</div>
            {result.subjects && result.subjects.map((s, i) => (
              <div key={i} className="m-subject-item">
                <div className="m-subject-info">
                  <div className="m-subject-code">{s.code}</div>
                  <div className="m-subject-credits">
                    Credits: {s.tCredit} total / {s.eCredit} earned
                  </div>
                </div>
                <div className="m-subject-grade" style={{ color: getGradeColor(s.grade) }}>
                  {s.grade}
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <button className="m-result-btn" onClick={resetForm} style={{ marginBottom: '12px', background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
            Check Another Result
          </button>
        </div>
      )}
    </div>
  );
}
