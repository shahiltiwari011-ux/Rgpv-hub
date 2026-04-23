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

                {/* Result Dashboard */}
                <AnimatePresence>
                    {result && (
                        <motion.section 
                            id="result-portal-view"
                            initial={{ opacity: 0, y: 100 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="result-dashboard"
                        >
                            <div className="dashboard-grid">
                                {loading && (
                                    <div className="scanning-overlay">
                                        <div className="scan-line"></div>
                                        <p>SYNCHRONIZING ACADEMIC DATA...</p>
                                    </div>
                                )}
                                {/* Left Column: Identity & Performance */}
                                <div className="dashboard-side">
                                    <div className="glass-panel profile-card">
                                        <div className="profile-header">
                                            <div className="user-avatar">{result.name[0]}</div>
                                            <div className="user-info">
                                                <h2>{result.name}</h2>
                                                <p>{result.enroll}</p>
                                            </div>
                                        </div>
                                        <div className="profile-details">
                                            <div className="detail-row">
                                                <span>Branch</span>
                                                <strong>{result.branch}</strong>
                                            </div>
                                            <div className="detail-row">
                                                <span>Semester</span>
                                                <strong>{semester}</strong>
                                            </div>
                                            <div className="detail-row">
                                                <span>Type</span>
                                                <strong className="status-tag">{result.status}</strong>
                                            </div>
                                        </div>
                                        <div className={`status-banner ${result.summary.resultDes.toLowerCase()}`}>
                                            {result.summary.resultDes}
                                        </div>
                                    </div>

                                    <div className="glass-panel stats-card">
                                        <div className="stat-item">
                                            <div className="stat-label">SGPA</div>
                                            <div className="stat-value">{result.summary.sgpa}</div>
                                            <div className="stat-progress-bg">
                                                <div className="stat-progress-fill blue" style={{ width: `${(parseFloat(result.summary.sgpa) || 0) * 10}%` }}></div>
                                            </div>
                                        </div>
                                        <div className="stat-item">
                                            <div className="stat-label">CGPA</div>
                                            <div className="stat-value">{result.summary.cgpa || '---'}</div>
                                            <div className="stat-progress-bg">
                                                <div className="stat-progress-fill purple" style={{ width: `${(parseFloat(result.summary.cgpa) || 0) * 10}%` }}></div>
                                            </div>
                                        </div>
                                        <div className="stat-footer">
                                            <span>Division: <strong>{result.summary.division || 'TBD'}</strong></span>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Subjects */}
                                <div className="dashboard-main">
                                    <div className="glass-panel subjects-panel">
                                        <div className="panel-header">
                                            <h3>Academic Subjects</h3>
                                            <div className="subject-count">{result.subjects.length} Total</div>
                                        </div>
                                        <div className="subject-scroll-area">
                                            <div className="subject-grid">
                                                {result.subjects.map((s, i) => (
                                                    <motion.div 
                                                        key={i}
                                                        initial={{ opacity: 0, x: 20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: i * 0.05 }}
                                                        className="subject-card"
                                                    >
                                                        <div className="subject-top">
                                                            <span className="code">{s.code}</span>
                                                            <div className="grade-disk" style={{ color: getGradeColor(s.grade), background: `${getGradeColor(s.grade)}15`, borderColor: `${getGradeColor(s.grade)}30` }}>
                                                                {s.grade}
                                                            </div>
                                                        </div>
                                                        <div className="subject-bottom">
                                                            <div className="credit-info">
                                                                <span className="earned">{s.eCredit}</span>
                                                                <span className="total">/ {s.tCredit} CR</span>
                                                            </div>
                                                            <div className="credit-bar">
                                                                <div className="fill" style={{ background: getGradeColor(s.grade), width: `${(parseFloat(s.eCredit)/parseFloat(s.tCredit)) * 100}%` }}></div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="panel-footer">
                                            <p>© {new Date().getFullYear()} ProjectX Verified Transcript</p>
                                            <button onClick={() => window.print()} className="print-button">
                                                <span>🖨️ Export PDF</span>
                                            </button>
                                        </div>
                                    </div>
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

                /* Dashboard Layout */
                .dashboard-grid { display: grid; grid-template-columns: 360px 1fr; gap: 2rem; align-items: start; }
                @media (max-width: 968px) { .dashboard-grid { grid-template-columns: 1fr; } }

                .profile-card { padding: 2.5rem; }
                .profile-header { display: flex; align-items: center; gap: 1.5rem; margin-bottom: 2.5rem; }
                .user-avatar { width: 70px; height: 70px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); border-radius: 1.5rem; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 900; color: #fff; box-shadow: 0 10px 25px rgba(59, 130, 246, 0.4); }
                .user-info h2 { font-size: 1.4rem; font-weight: 800; margin: 0; text-transform: uppercase; line-height: 1.1; }
                .user-info p { font-size: 0.85rem; color: #64748b; margin-top: 0.4rem; font-weight: 700; letter-spacing: 1px; }

                .profile-details { margin-bottom: 2rem; }
                .detail-row { display: flex; justify-content: space-between; padding: 1rem 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
                .detail-row span { font-size: 0.75rem; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; }
                .detail-row strong { font-size: 0.95rem; font-weight: 700; color: #cbd5e1; }
                .status-tag { background: #3b82f615; color: #3b82f6; padding: 0.25rem 0.75rem; border-radius: 0.5rem; font-size: 0.75rem; }

                .status-banner { width: 100%; padding: 1.25rem; border-radius: 1.25rem; text-align: center; font-size: 1.5rem; font-weight: 900; letter-spacing: 2px; }
                .status-banner.pass { background: #10b98120; color: #10b981; border: 1px solid #10b98140; }
                .status-banner.fail { background: #f43f5e20; color: #f43f5e; border: 1px solid #f43f5e40; }

                .stats-card { margin-top: 1.5rem; padding: 2rem; }
                .stat-item { margin-bottom: 1.5rem; }
                .stat-label { font-size: 0.75rem; font-weight: 800; color: #475569; margin-bottom: 0.5rem; }
                .stat-value { font-size: 2.8rem; font-weight: 900; line-height: 1; margin-bottom: 1rem; }
                .stat-progress-bg { height: 8px; background: rgba(255,255,255,0.05); border-radius: 4px; overflow: hidden; }
                .stat-progress-fill { height: 100%; border-radius: 4px; transition: 1s ease-out; }
                .stat-progress-fill.blue { background: #3b82f6; }
                .stat-progress-fill.purple { background: #8b5cf6; }
                .stat-footer { margin-top: 1.5rem; font-size: 0.85rem; color: #475569; font-weight: 700; }
                .stat-footer strong { color: #cbd5e1; }

                .subjects-panel { padding: 0; display: flex; flex-direction: column; height: 100%; }
                .panel-header { padding: 2.5rem; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center; }
                .panel-header h3 { font-size: 1.1rem; font-weight: 800; margin: 0; letter-spacing: 1px; color: #94a3b8; }
                .subject-count { background: #3b82f615; color: #3b82f6; padding: 0.4rem 1rem; border-radius: 2rem; font-size: 0.75rem; font-weight: 900; }
                
                .subject-scroll-area { padding: 2.5rem; max-height: 700px; overflow-y: auto; }
                .subject-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1.25rem; }
                .subject-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.04); border-radius: 1.5rem; padding: 1.5rem; transition: 0.3s; }
                .subject-card:hover { transform: translateY(-5px); background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.1); }
                
                .subject-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
                .subject-top .code { font-size: 0.8rem; font-weight: 800; color: #475569; }
                .grade-disk { width: 45px; height: 45px; border-radius: 1rem; border: 1px solid transparent; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; font-weight: 900; }
                
                .subject-bottom .credit-info { font-size: 0.75rem; font-weight: 800; color: #475569; margin-bottom: 0.6rem; }
                .credit-info .earned { color: #fff; font-size: 1.1rem; font-weight: 900; }
                .credit-bar { height: 4px; background: rgba(255,255,255,0.05); border-radius: 2px; overflow: hidden; }
                .credit-bar .fill { height: 100%; border-radius: 2px; }

                .panel-footer { padding: 2.5rem; border-top: 1px solid rgba(255,255,255,0.05); background: rgba(0,0,0,0.1); display: flex; justify-content: space-between; align-items: center; border-radius: 0 0 2.5rem 2.5rem; }
                .panel-footer p { font-size: 0.8rem; color: #475569; font-weight: 700; margin: 0; }
                .print-button { background: #fff; color: #000; border: none; padding: 0.8rem 1.5rem; border-radius: 1rem; font-weight: 900; cursor: pointer; transition: 0.3s; }
                .print-button:hover { transform: scale(1.05); background: #3b82f6; color: #fff; }

                .scanning-overlay { position: absolute; inset: 0; background: rgba(3, 4, 10, 0.8); backdrop-filter: blur(10px); z-index: 100; display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 2.5rem; overflow: hidden; }
                .scan-line { width: 100%; height: 2px; background: linear-gradient(90deg, transparent, #3b82f6, transparent); position: absolute; top: 0; animation: scan 2s linear infinite; box-shadow: 0 0 20px #3b82f6; }
                @keyframes scan { 0% { top: 0; } 100% { top: 100%; } }
                .scanning-overlay p { font-weight: 900; letter-spacing: 4px; font-size: 0.8rem; color: #3b82f6; margin-top: 1rem; animation: pulse 1s infinite; }

                .spinner { width: 24px; height: 24px; border: 3px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }

                @media print {
                    .portal-container * { visibility: hidden; }
                    .result-dashboard, .result-dashboard * { visibility: visible; }
                    .result-dashboard { position: absolute; left: 0; top: 0; width: 100%; background: #fff !important; color: #000 !important; }
                    .glass-panel, .subject-card { background: #fff !important; border: 1px solid #ddd !important; box-shadow: none !important; color: #000 !important; }
                    .portal-top, .search-engine-wrap, .print-button, .ambient-background { display: none !important; }
                    .user-info h2, .subject-top .code, .credit-info .earned { color: #000 !important; }
                }
            `}</style>
        </div>
    );
};

export default Result;
