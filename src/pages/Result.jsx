import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchProxyResult, getBackendHealth } from '../services/api';

const Result = () => {
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
                setTimeout(() => {
                    const el = document.getElementById('result-portal-view');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                }, 100);
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
                setError('Proxy Connection Lost. The portal is currently unreachable.'); 
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

    return (
        <div className="portal-container">
            <div className="ambient-background"></div>
            
            <div className="content-wrapper">
                {/* Header Section */}
                <motion.header 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="portal-top"
                >
                    <div className="branding">
                        <h1 className="portal-logo">PROJECT<span>X</span></h1>
                        <div className={`status-badge ${serverStatus}`}>
                            <span className="indicator"></span>
                            {serverStatus === 'online' ? 'PROXY ACTIVE' : 'PROXY OFFLINE'}
                        </div>
                    </div>
                </motion.header>

                {/* Search Engine */}
                <section className="search-engine-wrap">
                    <motion.div 
                        layout
                        className="glass-panel search-panel"
                    >
                        <form onSubmit={checkResult} className="portal-form">
                            <div className="search-grid">
                                <div className="input-group-premium">
                                    <label>Enrollment Number</label>
                                    <div className="field-inner">
                                        <input 
                                            type="text" 
                                            value={enrollment}
                                            onChange={(e) => setEnrollment(e.target.value.toUpperCase())}
                                            placeholder="0101CS221001"
                                            disabled={serverStatus === 'offline'}
                                        />
                                        <div className="field-glow"></div>
                                    </div>
                                </div>

                                <div className="input-group-premium">
                                    <label>Academic Semester</label>
                                    <div className="field-inner">
                                        <select value={semester} onChange={(e) => setSemester(e.target.value)} disabled={serverStatus === 'offline'}>
                                            {[1,2,3,4,5,6,7,8].map(s => (
                                                <option key={s} value={s}>Semester {s}</option>
                                            ))}
                                        </select>
                                        <div className="field-glow"></div>
                                    </div>
                                </div>

                                <button type="submit" disabled={loading || serverStatus === 'offline'} className="action-button">
                                    {loading && !captchaImg ? <div className="spinner"></div> : 'CHECK RESULT'}
                                </button>
                            </div>
                        </form>

                        <AnimatePresence>
                            {captchaImg && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="captcha-wrapper"
                                >
                                    <div className="captcha-content">
                                        <div className="image-box">
                                            <img src={captchaImg} alt="captcha" />
                                            <button onClick={() => checkResult()} className="refresh-btn">↻</button>
                                        </div>
                                        <div className="input-box">
                                            <input 
                                                type="text" 
                                                value={captcha}
                                                onChange={(e) => setCaptcha(e.target.value)}
                                                placeholder="Enter Code"
                                                autoFocus
                                            />
                                            <button onClick={() => checkResult(null, captcha)} className="verify-btn">VERIFY</button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    <AnimatePresence>
                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="error-card"
                            >
                                <span className="warning-icon">!</span> {error}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </section>

                {/* Result Dashboard (Official Marksheet Style) */}
                <AnimatePresence>
                    {result && (
                        <motion.section 
                            id="result-portal-view"
                            initial={{ opacity: 0, y: 100 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="result-dashboard official-style"
                        >
                            {loading && (
                                <div className="scanning-overlay">
                                    <div className="scan-line"></div>
                                    <p>REFRESHING TRANSCRIPT...</p>
                                </div>
                            )}

                            <div className="glass-panel transcript-container">
                                {/* Header / Identity */}
                                <div className="transcript-section">
                                    <table className="identity-table">
                                        <tbody>
                                            <tr><td>Name</td><td><strong>{result.name}</strong></td></tr>
                                            <tr><td>Roll No</td><td><strong>{result.enroll}</strong></td></tr>
                                            <tr><td>Branch</td><td><strong>{result.branch}</strong></td></tr>
                                            <tr><td>Course</td><td><strong>DIPLOMA (3 YEAR)</strong></td></tr>
                                            <tr><td>Semester</td><td><strong>{result.semester || semester}</strong></td></tr>
                                            <tr><td>Status</td><td><span className="status-badge">{result.status}</span></td></tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* Subjects Table */}
                                <div className="transcript-section">
                                    <div className="section-header-pill">Grading System</div>
                                    <div className="table-responsive">
                                        <table className="subjects-table">
                                            <thead>
                                                <tr>
                                                    <th>Paper</th>
                                                    <th>Total Credit</th>
                                                    <th>Earned Credit</th>
                                                    <th>Grade</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {result.subjects.map((s, i) => (
                                                    <tr key={i}>
                                                        <td>{s.code}</td>
                                                        <td>{s.tCredit}</td>
                                                        <td>{s.eCredit}</td>
                                                        <td style={{ color: getGradeColor(s.grade), fontWeight: 900 }}>{s.grade}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Summary Table */}
                                <div className="transcript-section">
                                    <table className="summary-table">
                                        <thead>
                                            <tr>
                                                <th>Result Des.</th>
                                                <th>SGPA</th>
                                                <th>CGPA</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td className={result.summary.resultDes.toLowerCase()}>{result.summary.resultDes}</td>
                                                <td className="highlight-val">{result.summary.sgpa || '---'}</td>
                                                <td>{result.summary.cgpa || '---'}</td>
                                            </tr>
                                        </tbody>
                                    </table>

                                    <table className="summary-table secondary" style={{ marginTop: '-1px' }}>
                                        <thead>
                                            <tr>
                                                <th>Revaluation Date</th>
                                                <th>Division</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td>{result.summary.revalDate || '---'}</td>
                                                <td>{result.summary.division || '---'}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                <div className="transcript-footer">
                                    <p>© {new Date().getFullYear()} ProjectX Verified Digital Transcript</p>
                                    <button onClick={() => window.print()} className="print-button">
                                        <span>🖨️ EXPORT PDF</span>
                                    </button>
                                </div>
                            </div>
                        </motion.section>
                    )}
                </AnimatePresence>
            </div>

            <style jsx>{`
                .portal-container { min-height: 100vh; background: #03040a; color: #fff; padding: 8rem 1rem 6rem; font-family: 'Space Grotesk', sans-serif; position: relative; overflow-x: hidden; }
                .ambient-background { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.15) 0%, transparent 40%), radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 40%); pointer-events: none; }
                .content-wrapper { max-width: 1100px; margin: 0 auto; position: relative; z-index: 10; }

                .portal-top { display: flex; justify-content: center; margin-bottom: 4rem; }
                .portal-logo { font-family: 'Syne', sans-serif; font-size: 4rem; font-weight: 800; letter-spacing: -4px; margin: 0; position: relative; }
                .portal-logo span { color: #3b82f6; text-shadow: 0 0 50px rgba(59, 130, 246, 0.5); }
                .status-badge { display: flex; align-items: center; gap: 0.6rem; font-size: 0.7rem; font-weight: 900; color: #555; background: rgba(255,255,255,0.03); padding: 0.4rem 1.2rem; border-radius: 2rem; border: 1px solid rgba(255,255,255,0.05); margin-top: 1rem; width: fit-content; margin-inline: auto; letter-spacing: 1px; }
                .status-badge.online { color: #10b981; border-color: rgba(16, 185, 129, 0.2); }
                .status-badge .indicator { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
                .online .indicator { box-shadow: 0 0 10px #10b981; animation: pulse 2s infinite; }
                @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.4); opacity: 0.5; } 100% { transform: scale(1); opacity: 1; } }

                .glass-panel { background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 2.5rem; backdrop-filter: blur(25px); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
                
                .search-panel { padding: 3rem; margin-bottom: 3rem; position: relative; overflow: hidden; }
                .search-grid { display: grid; grid-template-columns: 1.2fr 1fr 200px; gap: 1.5rem; align-items: flex-end; }
                @media (max-width: 850px) { .search-grid { grid-template-columns: 1fr; } }

                .input-group-premium label { font-size: 0.75rem; font-weight: 800; color: #64748b; margin-bottom: 0.75rem; display: block; text-transform: uppercase; letter-spacing: 1px; }
                .field-inner { position: relative; }
                .field-inner input, .field-inner select { width: 100%; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); border-radius: 1.25rem; padding: 1.2rem 1.5rem; color: #fff; font-weight: 700; font-size: 1.1rem; outline: none; transition: all 0.3s; position: relative; z-index: 2; }
                .field-inner input:focus { border-color: #3b82f6; }
                .field-glow { position: absolute; inset: 0; background: #3b82f6; opacity: 0; filter: blur(20px); transition: 0.3s; z-index: 1; border-radius: 1.25rem; }
                .field-inner input:focus + .field-glow { opacity: 0.1; }

                .action-button { height: 64px; background: linear-gradient(135deg, #3b82f6, #6366f1); border: none; border-radius: 1.25rem; color: #fff; font-weight: 900; font-size: 1rem; cursor: pointer; transition: 0.3s; box-shadow: 0 10px 20px rgba(59, 130, 246, 0.3); }
                .action-button:hover:not(:disabled) { transform: translateY(-3px); box-shadow: 0 20px 40px rgba(59, 130, 246, 0.4); }
                .action-button:disabled { opacity: 0.5; cursor: not-allowed; }

                .captcha-wrapper { margin-top: 2rem; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 2rem; }
                .captcha-content { display: flex; align-items: center; justify-content: center; gap: 2rem; flex-wrap: wrap; }
                .image-box { display: flex; align-items: center; gap: 1rem; background: #fff; padding: 0.5rem; border-radius: 1rem; }
                .image-box img { height: 45px; border-radius: 0.4rem; }
                .refresh-btn { background: #eee; border: none; font-size: 1.5rem; cursor: pointer; color: #000; transition: 0.3s; }
                .refresh-btn:hover { transform: rotate(90deg); }
                .input-box { display: flex; gap: 0.5rem; }
                .input-box input { width: 150px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 1rem; padding: 1.1rem; color: #fff; font-weight: 800; text-align: center; font-size: 1.2rem; }
                .verify-btn { background: #fff; color: #000; border: none; border-radius: 1rem; padding: 0 2rem; font-weight: 900; cursor: pointer; }

                .error-card { background: rgba(244, 63, 94, 0.1); border: 1px solid rgba(244, 63, 94, 0.2); color: #fb7185; padding: 1.25rem 2rem; border-radius: 1.5rem; margin-top: 2rem; text-align: center; font-weight: 700; font-size: 0.95rem; }
                .warning-icon { display: inline-flex; width: 24px; height: 24px; background: #f43f5e; color: #fff; border-radius: 50%; align-items: center; justify-content: center; font-size: 0.8rem; margin-right: 0.75rem; }

                /* Official Transcript Style */
                .transcript-container { padding: 3rem; margin-top: 2rem; position: relative; }
                .transcript-section { margin-bottom: 2.5rem; }
                .section-header-pill { background: rgba(59, 130, 246, 0.1); color: #3b82f6; padding: 0.5rem 1.5rem; border-radius: 2rem; font-size: 0.8rem; font-weight: 900; width: fit-content; margin: 0 auto 1.5rem; letter-spacing: 2px; text-transform: uppercase; border: 1px solid rgba(59, 130, 246, 0.2); }
                
                table { width: 100%; border-collapse: collapse; font-size: 0.95rem; }
                th, td { padding: 1rem 1.5rem; border: 1px solid rgba(255,255,255,0.05); text-align: left; }
                th { background: rgba(255,255,255,0.02); color: #64748b; font-weight: 800; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 1px; }
                
                .identity-table td:first-child { width: 25%; color: #64748b; font-weight: 700; background: rgba(255,255,255,0.01); }
                .identity-table strong { color: #fff; font-size: 1.1rem; }
                
                .subjects-table thead th { background: rgba(59, 130, 246, 0.1); color: #fff; text-align: center; border-color: rgba(59, 130, 246, 0.2); }
                .subjects-table td { text-align: center; }
                .subjects-table td:first-child { text-align: left; font-weight: 700; color: #94a3b8; }
                
                .summary-table th { text-align: center; }
                .summary-table td { text-align: center; font-size: 1.2rem; font-weight: 800; }
                .summary-table td.pass { color: #10b981; }
                .summary-table td.fail { color: #f43f5e; }
                .summary-table .highlight-val { color: #3b82f6; font-size: 1.8rem; }
                
                .transcript-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 2rem; border-top: 1px solid rgba(255,255,255,0.05); margin-top: 1rem; }
                .transcript-footer p { color: #475569; font-size: 0.8rem; font-weight: 700; }
                
                .print-button { background: #fff; color: #000; border: none; padding: 1rem 2rem; border-radius: 1.25rem; font-weight: 900; cursor: pointer; transition: 0.3s; display: flex; align-items: center; gap: 0.5rem; }
                .print-button:hover { background: #3b82f6; color: #fff; transform: translateY(-2px); box-shadow: 0 10px 20px rgba(59, 130, 246, 0.3); }

                @media (max-width: 768px) {
                    .transcript-container { padding: 1.5rem; }
                    th, td { padding: 0.75rem; font-size: 0.8rem; }
                    .identity-table td:first-child { width: 40%; }
                    .summary-table td { font-size: 1rem; }
                    .summary-table .highlight-val { font-size: 1.4rem; }
                    .transcript-footer { flex-direction: column; gap: 1.5rem; text-align: center; }
                }

                .scanning-overlay { position: absolute; inset: 0; background: rgba(3, 4, 10, 0.8); backdrop-filter: blur(10px); z-index: 100; display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 2.5rem; overflow: hidden; }
                .scan-line { width: 100%; height: 2px; background: linear-gradient(90deg, transparent, #3b82f6, transparent); position: absolute; top: 0; animation: scan 2s linear infinite; box-shadow: 0 0 20px #3b82f6; }
                @keyframes scan { 0% { top: 0; } 100% { top: 100%; } }
                .scanning-overlay p { font-weight: 900; letter-spacing: 4px; font-size: 0.8rem; color: #3b82f6; margin-top: 1rem; animation: pulse 1s infinite; }

                .spinner { width: 24px; height: 24px; border: 3px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }

                @media print {
                    body { background: #fff !important; }
                    .portal-container { padding: 0; background: #fff !important; }
                    .content-wrapper { max-width: 100%; }
                    .transcript-container { border: none !important; box-shadow: none !important; background: #fff !important; padding: 0 !important; color: #000 !important; }
                    table, th, td { border-color: #000 !important; color: #000 !important; }
                    .subjects-table thead th { background: #f0f0f0 !important; color: #000 !important; }
                    .section-header-pill { border: 1px solid #000 !important; color: #000 !important; }
                    .print-button, .portal-top, .search-engine-wrap, .ambient-background { display: none !important; }
                    .identity-table strong, .summary-table .highlight-val { color: #000 !important; }
                }
            `}</style>
        </div>
    );
};

export default Result;
