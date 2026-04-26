import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchProxyResult, getBackendHealth } from '../services/api';
import CustomSelector from '../components/CustomSelector';

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
    const [isDownloading, setIsDownloading] = useState(false);

    const semesterOptions = [1,2,3,4,5,6].map(s => ({ value: s.toString(), label: `Semester ${s}` }));

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

    const handleDownload = async () => {
        setIsDownloading(true);
        try {
            const { default: html2pdf } = await import('html2pdf.js');
            const element = document.querySelector('.transcript-container');
            if (!element) throw new Error("Result container not found");
            
            element.classList.add('export-mode');
            
            const opt = {
                margin:       [10, 10, 10, 10],
                filename:     `ProjectX_Result_${result.enroll}_Sem_${result.semester || semester}.pdf`,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { 
                    scale: 3, 
                    useCORS: true, 
                    backgroundColor: '#03040a',
                    logging: false,
                    scrollY: 0,
                    windowWidth: 1200,
                    letterRendering: true
                },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true }
            };

            await html2pdf().set(opt).from(element).save();
            element.classList.remove('export-mode');
        } catch (err) {
            console.error("PDF Export Error:", err);
            const element = document.querySelector('.transcript-container');
            if (element) element.classList.remove('export-mode');
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="portal-container">
            <div className="ambient-background"></div>
            
            <div className="content-wrapper">
                <motion.header 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="portal-top"
                >
                    <div className="branding">
                        <h1 className="portal-logo">PROJECT<span>X</span></h1>
                        <p className="portal-tagline">OFFICIAL ACADEMIC PORTAL V2.0</p>
                    </div>
                </motion.header>

                <section className="search-engine-wrap">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
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
                                    <CustomSelector 
                                        label="Academic Semester"
                                        value={semester}
                                        onChange={(val) => setSemester(val)}
                                        options={semesterOptions}
                                        disabled={serverStatus === 'offline'}
                                    />
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
                                                placeholder="Code"
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
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="error-card"
                            >
                                <span className="warning-icon">!</span> {error}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </section>

                <AnimatePresence>
                    {result && (
                        <motion.section 
                            id="result-portal-view"
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 50 }}
                            className="result-dashboard official-style"
                        >
                            {(loading || isDownloading) && (
                                <div className="scanning-overlay">
                                    <div className="scan-line"></div>
                                    <p>{isDownloading ? 'GENERATING DIGITAL PDF...' : 'REFRESHING TRANSCRIPT...'}</p>
                                </div>
                            )}

                            <div className="glass-panel transcript-container">
                                <div className="transcript-watermark">PROJECTX OFFICIAL TRANSCRIPT</div>
                                <div className="pdf-header-premium">
                                    <div className="pdf-logo">PROJECT<span>X</span></div>
                                    <div className="pdf-title-group">
                                        <div className="pdf-title">OFFICIAL DIGITAL TRANSCRIPT</div>
                                        <div className="pdf-subtitle">RAJIV GANDHI PROUDYOGIKI VISHWAVIDYALAYA, BHOPAL</div>
                                    </div>
                                    <div className="pdf-timestamp">Generated: {new Date().toLocaleDateString()}</div>
                                </div>

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

                                <div className="transcript-section">
                                    <div className="table-responsive">
                                        <table className="summary-table">
                                            <thead>
                                                <tr>
                                                    <th>Result Des.</th>
                                                    <th>SGPA</th>
                                                    <th>CGPA</th>
                                                    <th>Reval Date</th>
                                                    <th>Division</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td className={result.summary.resultDes.toLowerCase()}>{result.summary.resultDes}</td>
                                                    <td className="highlight-val">{result.summary.sgpa || '---'}</td>
                                                    <td className="highlight-val">{result.summary.cgpa || '---'}</td>
                                                    <td>{result.summary.revalDate || '---'}</td>
                                                    <td>{result.summary.division || '---'}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="transcript-footer">
                                    <p>© {new Date().getFullYear()} ProjectX Verified Digital Transcript</p>
                                    <button onClick={handleDownload} className="download-button" data-html2canvas-ignore="true">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4" />
                                            <polyline points="7 10 12 15 17 10" />
                                            <line x1="12" y1="15" x2="12" y2="3" />
                                        </svg>
                                        <span>DOWNLOAD RESULT</span>
                                    </button>
                                </div>
                            </div>
                        </motion.section>
                    )}
                </AnimatePresence>
            </div>

            <style>{`
                .portal-container { min-height: 100vh; background: var(--bg-primary); color: var(--text-primary); padding: 8rem 1rem 6rem; font-family: 'Space Grotesk', sans-serif; position: relative; overflow-x: hidden; transition: 0.3s ease; }
                .ambient-background { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 40%), radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.08) 0%, transparent 40%); pointer-events: none; }
                .content-wrapper { max-width: 1100px; margin: 0 auto; position: relative; z-index: 10; }

                .portal-top { display: flex; flex-direction: column; align-items: center; margin-bottom: 4rem; text-align: center; }
                .portal-logo { font-family: 'Syne', sans-serif; font-size: clamp(2.5rem, 10vw, 5.5rem); font-weight: 800; letter-spacing: -3px; margin: 0; color: var(--text-primary); line-height: 1; }
                .portal-logo span { color: var(--accent-blue); text-shadow: 0 0 60px rgba(59, 130, 246, 0.4); }
                .portal-tagline { font-size: 0.75rem; font-weight: 900; letter-spacing: 5px; color: var(--text-muted); margin-top: 1rem; text-transform: uppercase; }

                .glass-panel { background: var(--bg-card); border: 1px solid var(--border); border-radius: 2.5rem; backdrop-filter: blur(25px); box-shadow: var(--shadow-lg); transition: border-color 0.3s; }
                .glass-panel:hover { border-color: var(--border-hover); }
                
                .search-panel { padding: clamp(2rem, 5vw, 4rem); margin-bottom: 3rem; }
                .search-grid { display: grid; grid-template-columns: 1.2fr 1fr 220px; gap: 2rem; align-items: flex-end; }
                @media (max-width: 900px) { .search-grid { grid-template-columns: 1fr; gap: 1.5rem; } }

                .input-group-premium label { font-size: 0.7rem; font-weight: 900; color: var(--text-muted); margin-bottom: 1rem; display: block; text-transform: uppercase; letter-spacing: 2px; }
                .field-inner { position: relative; }
                .field-inner input { width: 100%; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 1.25rem; padding: 1.1rem 1.5rem; color: var(--text-primary); font-weight: 700; font-size: 1.1rem; outline: none; transition: 0.3s; position: relative; z-index: 2; }
                .field-inner input:focus { border-color: var(--accent-blue); background: var(--bg-primary); }
                .field-glow { position: absolute; inset: -2px; background: var(--accent-blue); opacity: 0; filter: blur(15px); transition: 0.3s; z-index: 1; border-radius: 1.4rem; }
                .field-inner input:focus + .field-glow { opacity: 0.15; }

                .action-button { height: 60px; background: var(--accent-blue); border: none; border-radius: 1.25rem; color: #fff; font-weight: 900; font-size: 1rem; cursor: pointer; transition: 0.3s; box-shadow: 0 10px 30px rgba(59, 130, 246, 0.3); letter-spacing: 1px; }
                .action-button:hover:not(:disabled) { transform: translateY(-3px) scale(1.02); box-shadow: 0 20px 40px rgba(59, 130, 246, 0.4); background: #2563eb; }
                .action-button:disabled { opacity: 0.4; cursor: not-allowed; transform: none !important; }

                .captcha-wrapper { margin-top: 3rem; border-top: 1px solid var(--border); padding-top: 2rem; }
                .captcha-content { display: flex; align-items: center; justify-content: center; gap: 2rem; flex-wrap: wrap; }
                .image-box { display: flex; align-items: center; gap: 1rem; background: #fff; padding: 0.75rem; border-radius: 1.25rem; box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
                .image-box img { height: 45px; border-radius: 0.5rem; }
                .refresh-btn { background: #f3f4f6; border: none; font-size: 1.5rem; cursor: pointer; color: #1f2937; padding: 0.5rem; border-radius: 0.75rem; transition: 0.3s; display: flex; align-items: center; justify-content: center; }
                .refresh-btn:hover { transform: rotate(180deg); background: #e5e7eb; }
                
                .input-box { display: flex; gap: 0.75rem; }
                .input-box input { width: 140px; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 1.25rem; padding: 1.1rem; color: var(--text-primary); font-weight: 800; text-align: center; font-size: 1.2rem; transition: 0.3s; }
                .input-box input:focus { border-color: var(--accent-blue); }
                .verify-btn { background: var(--text-primary); color: var(--bg-primary); border: none; border-radius: 1.25rem; padding: 0 2rem; font-weight: 900; cursor: pointer; transition: 0.3s; }
                .verify-btn:hover { transform: scale(1.05); filter: brightness(1.2); }

                .error-card { background: rgba(244, 63, 94, 0.1); border: 1px solid rgba(244, 63, 94, 0.2); color: #fb7185; padding: 1.5rem; border-radius: 1.5rem; margin-top: 2rem; text-align: center; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 1rem; }
                .warning-icon { width: 28px; height: 28px; background: #f43f5e; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1rem; }

                /* Official Transcript Style */
                .transcript-container { padding: clamp(1.5rem, 6vw, 4rem); margin-top: 2rem; position: relative; }
                .transcript-section { margin-bottom: 3rem; }
                .section-header-pill { background: rgba(59, 130, 246, 0.1); color: var(--accent-blue); padding: 0.6rem 2rem; border-radius: 2rem; font-size: 0.85rem; font-weight: 900; width: fit-content; margin: 0 auto 2rem; letter-spacing: 3px; text-transform: uppercase; border: 1px solid rgba(59, 130, 246, 0.2); }
                
                .table-responsive { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; border-radius: 1.5rem; }
                table { width: 100%; border-collapse: separate; border-spacing: 0; }
                th, td { padding: 1.25rem 1.5rem; border: 1px solid var(--border); text-align: left; }
                th { background: rgba(var(--bg-glass-rgb), 0.05); color: var(--text-muted); font-weight: 800; text-transform: uppercase; font-size: 0.7rem; letter-spacing: 2px; }
                
                .identity-table { border-radius: 1.5rem; overflow: hidden; border: 1px solid var(--border); }
                .identity-table td:first-child { width: 30%; color: var(--text-muted); font-weight: 800; background: rgba(var(--bg-glass-rgb), 0.02); text-transform: uppercase; font-size: 0.75rem; letter-spacing: 1px; }
                .identity-table strong { color: var(--text-primary); font-size: 1.15rem; font-family: 'Syne', sans-serif; }
                
                .subjects-table { border-radius: 1.5rem; overflow: hidden; }
                .subjects-table thead th { background: rgba(59, 130, 246, 0.1); color: var(--text-primary); text-align: center; border-color: rgba(59, 130, 246, 0.2); }
                .subjects-table td { text-align: center; font-weight: 600; }
                .subjects-table td:first-child { text-align: left; font-weight: 800; color: var(--text-secondary); }
                
                .summary-table td { text-align: center; font-size: 1.3rem; font-weight: 900; }
                .summary-table .highlight-val { color: var(--accent-blue); font-size: 2.2rem; text-shadow: 0 0 30px rgba(59, 130, 246, 0.3); }
                
                .transcript-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 3rem; border-top: 1px solid var(--border); margin-top: 2rem; }
                .transcript-footer p { color: var(--text-muted); font-size: 0.85rem; font-weight: 700; }
                
                .download-button { background: var(--text-primary); color: var(--bg-primary); border: none; padding: 1.1rem 2.5rem; border-radius: 1.5rem; font-weight: 900; cursor: pointer; transition: 0.3s; display: flex; align-items: center; gap: 1rem; text-transform: uppercase; letter-spacing: 2px; font-size: 0.9rem; }
                .download-button:hover { background: var(--accent-blue); color: #fff; transform: translateY(-4px); box-shadow: 0 15px 40px rgba(59, 130, 246, 0.4); }

                .status-badge { padding: 0.4rem 1.2rem; background: rgba(16, 185, 129, 0.1); color: #10b981; border-radius: 2rem; font-size: 0.8rem; font-weight: 900; border: 1px solid rgba(16, 185, 129, 0.2); }

                .scanning-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(15px); z-index: 100; display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 2.5rem; }
                .scan-line { width: 100%; height: 3px; background: var(--accent-blue); position: absolute; top: 0; animation: scan 2.5s linear infinite; box-shadow: 0 0 30px var(--accent-blue); }
                @keyframes scan { 0% { top: 0; } 100% { top: 100%; } }
                .scanning-overlay p { font-weight: 900; letter-spacing: 6px; font-size: 0.9rem; color: var(--accent-blue); margin-top: 2rem; animation: pulse 1.5s infinite; text-transform: uppercase; }

                .spinner { width: 28px; height: 28px; border: 4px solid rgba(255,255,255,0.1); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }

                @media (max-width: 768px) {
                    .portal-container { padding-top: 6rem; }
                    .search-panel { border-radius: 2rem; padding: 2rem 1.5rem; }
                    .transcript-container { padding: 2rem 1rem; border-radius: 2rem; }
                    th, td { padding: 1rem; font-size: 0.85rem; }
                    .identity-table strong { font-size: 1rem; }
                    .summary-table td { font-size: 1.1rem; }
                    .summary-table .highlight-val { font-size: 1.6rem; }
                    .transcript-footer { flex-direction: column; gap: 2rem; text-align: center; }
                    .download-button { width: 100%; justify-content: center; }
                }

                /* PDF Export Optimizations */
                .transcript-container.export-mode {
                    background: #03040a !important;
                    color: #ffffff !important;
                    padding: 15mm !important;
                    width: 210mm !important;
                    margin: 0 !important;
                    border-radius: 0 !important;
                    border: none !important;
                    box-shadow: none !important;
                    min-height: 297mm !important;
                    display: flex !important;
                    flex-direction: column !important;
                    position: relative !important;
                }

                .export-mode .transcript-watermark { display: block; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 6rem; opacity: 0.03; font-weight: 900; width: 100%; text-align: center; pointer-events: none; }
                .export-mode .pdf-header-premium { border-bottom: 2px solid rgba(59, 130, 246, 0.3); padding-bottom: 2rem; margin-bottom: 2rem; }
                .export-mode .glass-panel { background: transparent !important; border: none !important; backdrop-filter: none !important; }
                .export-mode .download-button { display: none !important; }
                
                .transcript-watermark { display: none; }
                .pdf-header-premium { display: flex; justify-content: space-between; align-items: center; margin-bottom: 3rem; position: relative; }
                .pdf-title-group { text-align: center; flex: 1; }
                .pdf-timestamp { font-size: 0.6rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; }
                
                .subjects-table tr:nth-child(even) { background: rgba(255,255,255,0.02); }
                .subjects-table tr:hover { background: rgba(59, 130, 246, 0.05); }
                
                .summary-table { background: rgba(59, 130, 246, 0.05); border-radius: 1.5rem; overflow: hidden; border: 1px solid rgba(59, 130, 246, 0.1); }
                .summary-table th { background: rgba(59, 130, 246, 0.1); }

            `}</style>
        </div>
    );
};

export default Result;
