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
    const [isDownloading, setIsDownloading] = useState(false);

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
            // Dynamically import the heavy PDF library only on-demand
            const { default: html2pdf } = await import('html2pdf.js');
            
            const element = document.querySelector('.transcript-container');
            if (!element) throw new Error("Result container not found");
            
            // Apply high-contrast mode for better PDF visibility
            element.classList.add('export-mode');
            
            const opt = {
                margin:       0,
                filename:     `ProjectX_Result_${result.enroll}_Sem_${result.semester || semester}.pdf`,
                image:        { type: 'jpeg', quality: 1.0 },
                html2canvas:  { 
                    scale: 2, 
                    useCORS: true, 
                    backgroundColor: '#03040a',
                    logging: false,
                    scrollY: 0,
                    windowWidth: 1200
                },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            // Nuclear Option: Explicitly limit to 1 page by deleting extra pages if they exist
            const worker = html2pdf().set(opt).from(element).toPdf().get('pdf').then((pdf) => {
                const totalPages = pdf.internal.getNumberOfPages();
                for (let i = totalPages; i > 1; i--) {
                    pdf.deletePage(i);
                }
            }).save();

            await worker;
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
                {/* Header Section */}
                <motion.header 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="portal-top"
                >
                    <div className="branding">
                        <h1 className="portal-logo">PROJECT<span>X</span></h1>
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
                            {(loading || isDownloading) && (
                                <div className="scanning-overlay">
                                    <div className="scan-line"></div>
                                    <p>{isDownloading ? 'GENERATING DIGITAL PDF...' : 'REFRESHING TRANSCRIPT...'}</p>
                                </div>
                            )}

                            <div className="glass-panel transcript-container">
                                {/* Only visible in PDF */}
                                <div className="pdf-header-premium">
                                    <div className="pdf-logo">PROJECT<span>X</span></div>
                                    <div className="pdf-title">OFFICIAL DIGITAL TRANSCRIPT</div>
                                    <div className="pdf-subtitle">RAJIV GANDHI PROUDYOGIKI VISHWAVIDYALAYA, BHOPAL</div>
                                </div>

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
                .portal-container { min-height: 100vh; background: var(--bg-primary); color: var(--text-primary); padding: 8rem 1rem 6rem; font-family: 'Space Grotesk', sans-serif; position: relative; overflow-x: hidden; transition: background-color 0.3s ease, color 0.3s ease; }
                .ambient-background { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 40%), radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.08) 0%, transparent 40%); pointer-events: none; }
                .content-wrapper { max-width: 1100px; margin: 0 auto; position: relative; z-index: 10; }

                .portal-top { display: flex; flex-direction: column; align-items: center; margin-bottom: clamp(1.5rem, 8vw, 3rem); }
                .portal-logo { font-family: 'Syne', sans-serif; font-size: clamp(2rem, 10vw, 5rem); font-weight: 800; letter-spacing: -2px; margin: 0; position: relative; text-align: center; color: var(--text-primary); line-height: 1; }
                .portal-logo span { color: var(--accent-blue); text-shadow: 0 0 50px rgba(59, 130, 246, 0.5); }

                .glass-panel { background: var(--bg-card); border: 1px solid var(--border); border-radius: 2.5rem; backdrop-filter: blur(25px); box-shadow: var(--shadow-lg); }
                
                .search-panel { padding: clamp(1.5rem, 5vw, 3rem); margin-bottom: 3rem; position: relative; overflow: hidden; }
                .search-grid { display: grid; grid-template-columns: 1.2fr 1fr 200px; gap: 1.5rem; align-items: flex-end; }
                @media (max-width: 850px) { .search-grid { grid-template-columns: 1fr; gap: 1rem; } }

                .input-group-premium label { font-size: 0.75rem; font-weight: 800; color: var(--text-muted); margin-bottom: 0.75rem; display: block; text-transform: uppercase; letter-spacing: 1px; }
                .field-inner { position: relative; }
                .field-inner input, .field-inner select { width: 100%; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 1.25rem; padding: 1.1rem 1.5rem; color: var(--text-primary); font-weight: 700; font-size: 1rem; outline: none; transition: all 0.3s; position: relative; z-index: 2; }
                .field-inner input:focus { border-color: var(--accent-blue); }
                .field-glow { position: absolute; inset: 0; background: var(--accent-blue); opacity: 0; filter: blur(20px); transition: 0.3s; z-index: 1; border-radius: 1.25rem; }
                .field-inner input:focus + .field-glow { opacity: 0.1; }

                .action-button { height: 60px; background: var(--gradient-notes); border: none; border-radius: 1.25rem; color: #fff; font-weight: 900; font-size: 1rem; cursor: pointer; transition: 0.3s; box-shadow: 0 10px 20px rgba(59, 130, 246, 0.3); }
                .action-button:hover:not(:disabled) { transform: translateY(-3px); box-shadow: 0 20px 40px rgba(59, 130, 246, 0.4); }
                .action-button:disabled { opacity: 0.5; cursor: not-allowed; }

                .captcha-wrapper { margin-top: 2rem; border-top: 1px solid var(--border); padding-top: 2rem; }
                .captcha-content { display: flex; align-items: center; justify-content: center; gap: 1.5rem; flex-wrap: wrap; }
                .image-box { display: flex; align-items: center; gap: 1rem; background: #fff; padding: 0.5rem; border-radius: 1rem; }
                .image-box img { height: 40px; border-radius: 0.4rem; }
                .refresh-btn { background: #eee; border: none; font-size: 1.5rem; cursor: pointer; color: #000; transition: 0.3s; }
                .refresh-btn:hover { transform: rotate(90deg); }
                .input-box { display: flex; gap: 0.5rem; }
                .input-box input { width: 130px; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 1rem; padding: 1rem; color: var(--text-primary); font-weight: 800; text-align: center; font-size: 1.1rem; }
                .verify-btn { background: var(--text-primary); color: var(--bg-primary); border: none; border-radius: 1rem; padding: 0 1.5rem; font-weight: 900; cursor: pointer; }

                .error-card { background: rgba(244, 63, 94, 0.1); border: 1px solid rgba(244, 63, 94, 0.2); color: #fb7185; padding: 1.25rem 2rem; border-radius: 1.5rem; margin-top: 2rem; text-align: center; font-weight: 700; font-size: 0.95rem; }
                .warning-icon { display: inline-flex; width: 24px; height: 24px; background: #f43f5e; color: #fff; border-radius: 50%; align-items: center; justify-content: center; font-size: 0.8rem; margin-right: 0.75rem; }

                /* Official Transcript Style */
                .transcript-container { padding: clamp(1.25rem, 5vw, 3rem); margin-top: 2rem; position: relative; }
                .transcript-section { margin-bottom: 2.5rem; }
                .section-header-pill { background: rgba(59, 130, 246, 0.1); color: var(--accent-blue); padding: 0.5rem 1.5rem; border-radius: 2rem; font-size: 0.8rem; font-weight: 900; width: fit-content; margin: 0 auto 1.5rem; letter-spacing: 2px; text-transform: uppercase; border: 1px solid rgba(59, 130, 246, 0.2); }
                
                .table-responsive { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; margin-bottom: 1rem; }
                table { width: 100%; border-collapse: collapse; font-size: 0.95rem; min-width: 500px; }
                .identity-table { min-width: 100%; }
                th, td { padding: 1rem 1.5rem; border: 1px solid var(--border); text-align: left; }
                th { background: rgba(var(--bg-glass-rgb), 0.05); color: var(--text-muted); font-weight: 800; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 1px; }
                
                .identity-table td:first-child { width: 25%; color: var(--text-muted); font-weight: 700; background: rgba(var(--bg-glass-rgb), 0.02); }
                .identity-table strong { color: var(--text-primary); font-size: 1.1rem; }
                
                .subjects-table thead th { background: rgba(59, 130, 246, 0.1); color: var(--text-primary); text-align: center; border-color: rgba(59, 130, 246, 0.2); }
                .subjects-table td { text-align: center; }
                .subjects-table td:first-child { text-align: left; font-weight: 700; color: var(--text-secondary); }
                
                .summary-table th { text-align: center; }
                .summary-table td { text-align: center; font-size: 1.2rem; font-weight: 800; }
                .summary-table td.pass { color: var(--accent-green); }
                .summary-table td.fail { color: #f43f5e; }
                .summary-table .highlight-val { color: var(--accent-blue); font-size: clamp(1.4rem, 5vw, 1.8rem); }
                
                .transcript-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 2rem; border-top: 1px solid var(--border); margin-top: 1rem; }
                .transcript-footer p { color: var(--text-muted); font-size: 0.8rem; font-weight: 700; }
                
                .download-button { background: var(--text-primary); color: var(--bg-primary); border: none; padding: 1rem 2rem; border-radius: 1.25rem; font-weight: 900; cursor: pointer; transition: 0.3s; display: flex; align-items: center; gap: 0.75rem; text-transform: uppercase; letter-spacing: 1px; }
                .download-button:hover { background: var(--accent-blue); color: #fff; transform: translateY(-2px); box-shadow: 0 10px 30px rgba(59, 130, 246, 0.4); }
                .download-button:hover svg { transform: translateY(2px); }

                /* Export High-Contrast Mode - Premium certificate style */
                .pdf-header-premium { display: none; }
                .transcript-container.export-mode { 
                    background: #03040a !important; 
                    border: 15px solid #111827 !important;
                    padding: 40px !important;
                    margin: 0 !important;
                    border-radius: 0 !important;
                    color: #fff !important;
                    width: 210mm !important;
                    height: 296mm !important; /* Slightly less than A4 to prevent spillover */
                    display: flex !important;
                    flex-direction: column !important;
                    justify-content: space-between !important;
                    position: relative;
                    box-sizing: border-box !important;
                    overflow: hidden !important;
                }
                .export-mode::before {
                    content: 'PROJECTX';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%) rotate(-45deg);
                    font-size: 8rem;
                    font-weight: 900;
                    color: rgba(255,255,255,0.03);
                    pointer-events: none;
                    z-index: 0;
                }
                .export-mode .pdf-header-premium { display: flex !important; flex-direction: column; align-items: center; margin-bottom: 30px; border-bottom: 2px solid rgba(59, 130, 246, 0.2); padding-bottom: 20px; }
                .export-mode .pdf-logo { font-family: 'Syne', sans-serif; font-size: 2.5rem; font-weight: 800; letter-spacing: -2px; }
                .export-mode .pdf-logo span { color: #3b82f6; }
                .export-mode .pdf-title { font-size: 0.9rem; font-weight: 900; letter-spacing: 4px; color: #60a5fa; margin-top: 5px; }
                .export-mode .pdf-subtitle { font-size: 0.7rem; font-weight: 700; color: #94a3b8; margin-top: 5px; opacity: 0.8; }

                .export-mode .transcript-section { margin-bottom: 25px !important; position: relative; z-index: 1; }
                .export-mode .identity-table td { padding: 8px 12px !important; font-size: 0.9rem !important; }
                .export-mode .identity-table strong { color: #fff !important; font-size: 1.1rem !important; }
                .export-mode .subjects-table th, .export-mode .subjects-table td { padding: 10px 15px !important; font-size: 0.9rem !important; }
                .export-mode .section-header-pill { padding: 5px 15px !important; font-size: 0.75rem !important; margin-bottom: 12px !important; background: #3b82f6 !important; }
                .export-mode .summary-table th, .export-mode .summary-table td { padding: 12px !important; font-size: 1rem !important; }
                .export-mode .summary-table .highlight-val { font-size: 1.4rem !important; color: #60a5fa !important; font-weight: 900 !important; }
                .export-mode .transcript-footer { padding-top: 20px !important; margin-top: auto !important; border-top: 1px solid rgba(59, 130, 246, 0.2) !important; }
                .export-mode .transcript-footer p { font-size: 0.8rem !important; color: #94a3b8 !important; }
                .export-mode .download-button { display: none !important; }
                .export-mode .subjects-table thead th { background: #111827 !important; color: #3b82f6 !important; border-bottom: 2px solid #3b82f6 !important; }
                .export-mode th, .export-mode td { border-color: #1f2937 !important; }

                @media (max-width: 768px) {
                    .portal-container { padding-top: 6rem; padding-left: 0.75rem; padding-right: 0.75rem; }
                    .portal-top { margin-bottom: 1.5rem; }
                    .portal-logo { font-size: clamp(2rem, 10.5vw, 3rem); letter-spacing: -1px; width: 100%; }
                    .search-panel { border-radius: 1.5rem; }
                    .glass-panel { border-radius: 1.5rem; }
                    .transcript-container { padding: 1rem 0.75rem; border-radius: 1.5rem; }
                    table { min-width: unset; width: 100%; }
                    .subjects-table { min-width: 360px; }
                    .summary-table { min-width: unset; }
                    th, td { padding: 0.65rem 0.75rem; font-size: 0.78rem; }
                    .identity-table td:first-child { width: 35%; font-size: 0.78rem; }
                    .identity-table strong { font-size: 0.95rem; }
                    .summary-table td { font-size: 1rem; }
                    .summary-table .highlight-val { font-size: 1.2rem; }
                    .transcript-footer { flex-direction: column; gap: 1rem; text-align: center; }
                    .transcript-footer p { font-size: 0.7rem; }
                    .download-button { width: 100%; justify-content: center; padding: 0.85rem 1.25rem; font-size: 0.85rem; }
                    .image-box img { height: 35px; }
                    .input-box input { width: 110px; padding: 0.8rem; font-size: 1rem; }
                    .section-header-pill { font-size: 0.7rem; padding: 0.4rem 1rem; }
                }

                @media (max-width: 400px) {
                    th, td { padding: 0.5rem 0.5rem; font-size: 0.72rem; }
                    .subjects-table { min-width: 300px; }
                    .identity-table strong { font-size: 0.85rem; }
                }

                .scanning-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(10px); z-index: 100; display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 2.5rem; overflow: hidden; }
                .scan-line { width: 100%; height: 2px; background: linear-gradient(90deg, transparent, var(--accent-blue), transparent); position: absolute; top: 0; animation: scan 2s linear infinite; box-shadow: 0 0 20px var(--accent-blue); }
                @keyframes scan { 0% { top: 0; } 100% { top: 100%; } }
                .scanning-overlay p { font-weight: 900; letter-spacing: 4px; font-size: 0.8rem; color: var(--accent-blue); margin-top: 1rem; animation: pulse 1s infinite; }

                .spinner { width: 24px; height: 24px; border: 3px solid rgba(var(--bg-glass-rgb), 0.3); border-top-color: var(--accent-blue); border-radius: 50%; animation: spin 0.8s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }

                @media print {
                    @page { margin: 1cm; }
                    body { background: #fff !important; color: #000 !important; }
                    .portal-container { padding: 0; background: #fff !important; }
                    .content-wrapper { max-width: 100%; }
                    .transcript-container { border: none !important; box-shadow: none !important; background: #fff !important; padding: 0 !important; color: #000 !important; }
                    table, th, td { border-color: #000 !important; color: #000 !important; }
                    .subjects-table thead th { background: #f0f0f0 !important; color: #000 !important; }
                    .section-header-pill { border: 1px solid #000 !important; color: #000 !important; }
                    .download-button, .portal-top, .search-engine-wrap, .ambient-background, .projectx-nav, .projectx-footer { display: none !important; }
                    .identity-table strong, .summary-table .highlight-val { color: #000 !important; }
                }
            `}</style>

        </div>
    );
};

export default Result;
