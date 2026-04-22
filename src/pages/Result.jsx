import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Result = () => {
    const [enrollment, setEnrollment] = useState('');
    const [semester, setSemester] = useState('3');
    const [captcha, setCaptcha] = useState('');
    const [captchaImg, setCaptchaImg] = useState(null);
    const [sessionId, setSessionId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

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
            const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const response = await fetch(`${apiBase}/api/result`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    enroll: enrollTrim, 
                    sem: semester,
                    captcha: submittedCaptcha,
                    sessionId: sessionId
                })
            });

            const data = await response.json();
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
            case 'captcha': setError('Invalid Captcha. Try again.'); break;
            case 'not_found': setError('Result not found. Check details.'); break;
            default: setError('Connection Error. Try later.');
        }
        if (type === 'captcha') { setCaptcha(''); setCaptchaImg(null); setSessionId(null); }
    };

    const getGradeColor = (grade) => {
        const g = grade.toUpperCase();
        if (g.includes('A')) return '#10b981';
        if (g.includes('B')) return '#3b82f6';
        if (g.includes('C')) return '#f59e0b';
        return '#ef4444';
    };

    return (
        <div className="marksheet-app">
            <div className="bg-glow"></div>
            
            <div className="container">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hero">
                    <h1 className="title">PROJECT<span>X</span></h1>
                    <p className="subtitle">Official RGPV Diploma Marksheet Proxy</p>
                </motion.div>

                <div className="search-box card">
                    <form onSubmit={checkResult} className="search-form">
                        <div className="input-group">
                            <label>ENROLLMENT NO.</label>
                            <input 
                                type="text" 
                                value={enrollment}
                                onChange={(e) => setEnrollment(e.target.value.toUpperCase())}
                                placeholder="e.g. 24047C04054"
                            />
                        </div>
                        <div className="input-group">
                            <label>SEMESTER</label>
                            <select value={semester} onChange={(e) => setSemester(e.target.value)}>
                                {[1,2,3,4,5,6,7,8].map(s => (
                                    <option key={s} value={s}>Semester {s}</option>
                                ))}
                            </select>
                        </div>
                        <button type="submit" disabled={loading} className="btn-fetch">
                            {loading && !captchaImg ? 'CONNECTING...' : 'GET MARKSHEET'}
                        </button>
                    </form>

                    <AnimatePresence>
                        {captchaImg && (
                            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="captcha-section">
                                <div className="captcha-wrap">
                                    <div className="img-box">
                                        <img src={captchaImg} alt="captcha" />
                                        <button onClick={() => checkResult()} className="refresh">⟳</button>
                                    </div>
                                    <div className="input-box">
                                        <input 
                                            type="text" 
                                            value={captcha}
                                            onChange={(e) => setCaptcha(e.target.value)}
                                            placeholder="Code"
                                            autoFocus
                                        />
                                        <button onClick={() => checkResult(null, captcha)} disabled={loading}>VERIFY</button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <AnimatePresence>
                    {error && <motion.div className="error-msg">{error}</motion.div>}

                    {result && (
                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="marksheet-display">
                            <div className="digital-marksheet card">
                                <div className="ms-header">
                                    <div className="ms-brand">RGPV DIPLOMA</div>
                                    <div className="ms-title">STATEMENT OF GRADES</div>
                                </div>

                                <div className="ms-student-info">
                                    <div className="info-row">
                                        <div className="info-cell"><span>NAME</span><strong>{result.name}</strong></div>
                                        <div className="info-cell"><span>ROLL NO</span><strong>{result.enroll}</strong></div>
                                    </div>
                                    <div className="info-row">
                                        <div className="info-cell"><span>BRANCH</span><strong>{result.branch}</strong></div>
                                        <div className="info-cell"><span>STATUS</span><strong>{result.status}</strong></div>
                                    </div>
                                </div>

                                <div className="ms-table-wrap">
                                    <div className="table-heading">Grading System</div>
                                    <table className="marks-table">
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
                                                    <td style={{ color: getGradeColor(s.grade) }}>{s.grade}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="ms-summary-table">
                                    <div className="summary-row header">
                                        <div>Result Des.</div>
                                        <div>SGPA</div>
                                        <div>CGPA</div>
                                    </div>
                                    <div className="summary-row values">
                                        <div className={result.summary.resultDes === 'PASS' ? 'pass' : 'fail'}>
                                            {result.summary.resultDes}
                                        </div>
                                        <div>{result.summary.sgpa}</div>
                                        <div>{result.summary.cgpa || '---'}</div>
                                    </div>
                                    <div className="summary-row header">
                                        <div>Revaluation Date</div>
                                        <div>Division</div>
                                    </div>
                                    <div className="summary-row values">
                                        <div>{result.summary.revalDate}</div>
                                        <div>{result.summary.division || '---'}</div>
                                    </div>
                                </div>

                                <div className="ms-footer">
                                    <p><strong>Data Source:</strong> Rajiv Gandhi Proudyogiki Vishwavidyalaya Polytechnic Wing, Bhopal</p>
                                    <p className="disclaimer"><strong>Disclaimer:</strong> The data belongs to RGPV Polytechnic Wing, Bhopal. This is a computer generated proxy marksheet for quick reference.</p>
                                    <button onClick={() => window.print()} className="print-btn">Print Marksheet</button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <style jsx>{`
                .marksheet-app { min-height: 100vh; background: #080808; color: #fff; padding: 4rem 1rem; position: relative; font-family: 'Inter', sans-serif; }
                .bg-glow { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: radial-gradient(circle at 50% 0%, rgba(59, 130, 246, 0.08) 0%, transparent 70%); pointer-events: none; }
                .container { max-width: 800px; margin: 0 auto; position: relative; z-index: 10; }
                
                .hero { text-align: center; margin-bottom: 3rem; }
                .title { font-family: 'Syne', sans-serif; font-size: 3rem; font-weight: 900; letter-spacing: -2px; }
                .title span { color: #3b82f6; }
                .subtitle { color: #666; font-weight: 600; margin-top: 0.5rem; }

                .card { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 1.5rem; backdrop-filter: blur(20px); }
                .search-box { padding: 2rem; margin-bottom: 2rem; }
                
                .search-form { display: grid; grid-template-columns: 1fr 1fr 180px; gap: 1rem; align-items: flex-end; }
                @media (max-width: 650px) { .search-form { grid-template-columns: 1fr; } }
                
                .input-group label { font-size: 0.65rem; font-weight: 800; color: #444; letter-spacing: 1px; display: block; margin-bottom: 0.5rem; }
                .input-group input, .input-group select { width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 0.8rem; padding: 0.8rem; color: #fff; font-weight: 700; outline: none; }
                .btn-fetch { height: 48px; background: #3b82f6; border: none; border-radius: 0.8rem; color: #fff; font-weight: 900; cursor: pointer; transition: 0.2s; }
                .btn-fetch:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(59, 130, 246, 0.3); }

                .captcha-section { margin-top: 2rem; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 2rem; }
                .captcha-wrap { display: flex; flex-direction: column; gap: 1.5rem; align-items: center; }
                .img-box { display: flex; align-items: center; gap: 1rem; background: #fff; padding: 0.5rem; border-radius: 1rem; }
                .img-box img { height: 40px; }
                .refresh { background: #eee; border: none; font-size: 1.2rem; cursor: pointer; padding: 0.5rem; border-radius: 0.5rem; color: #000; }
                .input-box { display: flex; gap: 0.5rem; width: 100%; max-width: 300px; }
                .input-box input { flex: 1; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 0.8rem; padding: 0.8rem; color: #fff; font-weight: 800; text-align: center; }
                .input-box button { background: #fff; color: #000; border: none; border-radius: 0.8rem; padding: 0 1.5rem; font-weight: 900; cursor: pointer; }

                .digital-marksheet { background: #fff; color: #000; padding: 0; overflow: hidden; border-radius: 1rem; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
                .ms-header { background: #000; color: #fff; padding: 1.5rem; text-align: center; }
                .ms-brand { font-weight: 900; letter-spacing: 2px; font-size: 0.8rem; opacity: 0.7; }
                .ms-title { font-size: 1.2rem; font-weight: 900; margin-top: 0.2rem; }

                .ms-student-info { padding: 1.5rem; border-bottom: 1px solid #eee; display: flex; flex-direction: column; gap: 1rem; }
                .info-row { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
                .info-cell span { display: block; font-size: 0.65rem; font-weight: 800; color: #888; }
                .info-cell strong { font-size: 0.95rem; font-weight: 900; }

                .ms-table-wrap { padding: 1.5rem; }
                .table-heading { color: #e91e63; font-weight: 900; text-align: center; margin-bottom: 1rem; font-size: 1.1rem; }
                .marks-table { width: 100%; border-collapse: collapse; }
                .marks-table th { background: #455a64; color: #fff; padding: 0.8rem; font-size: 0.75rem; text-align: left; }
                .marks-table td { padding: 0.8rem; border: 1px solid #eee; font-weight: 700; font-size: 0.9rem; }

                .ms-summary-table { margin: 1.5rem; border: 1px solid #eee; }
                .summary-row { display: grid; grid-template-columns: 1.5fr 1fr 1fr; border-bottom: 1px solid #eee; }
                .summary-row.header { background: #f8f9fa; font-size: 0.7rem; font-weight: 800; color: #555; }
                .summary-row.header div, .summary-row.values div { padding: 0.8rem; border-right: 1px solid #eee; }
                .summary-row.values { font-weight: 900; font-size: 1.1rem; }
                .summary-row.values div.pass { color: #2e7d32; }
                .summary-row.values div.fail { color: #c62828; }

                .ms-footer { padding: 1.5rem; background: #f8f9fa; font-size: 0.75rem; text-align: center; }
                .disclaimer { color: #666; margin-top: 0.5rem; line-height: 1.4; }
                .print-btn { margin-top: 1.5rem; padding: 0.6rem 1.5rem; background: #000; color: #fff; border: none; border-radius: 0.5rem; font-weight: 800; cursor: pointer; }

                .error-msg { text-align: center; color: #ff4d4d; background: rgba(255,0,0,0.1); padding: 1rem; border-radius: 1rem; margin-top: 1rem; font-weight: 800; }

                @media print {
                    .marksheet-app * { visibility: hidden; }
                    .digital-marksheet, .digital-marksheet * { visibility: visible; }
                    .digital-marksheet { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none; border: none; }
                    .print-btn { display: none; }
                }
            `}</style>
        </div>
    );
};

export default Result;
