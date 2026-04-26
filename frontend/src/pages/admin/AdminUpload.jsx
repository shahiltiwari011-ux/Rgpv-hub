import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { createResource, uploadFile } from '../../services/api';
import { LoadingSpinner } from '../../components/States';
import { BRANCHES, SEMESTERS, RESOURCE_TYPES, MAX_FILE_SIZE } from '../../utils/constants';
import SEO from '../../components/SEO';
import logger from '../../utils/logger';
import { toast } from 'react-hot-toast';
import OfflineBanner from '../../components/OfflineBanner';
import { checkSupabaseConnection } from '../../services/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import CustomSelector from '../../components/CustomSelector';

// PDF magic bytes: %PDF (hex: 25 50 44 46)
async function validatePdfMagicBytes (file) {
  return new Promise((resolve) => {
    const reader = new window.FileReader();
    reader.onload = (e) => {
      const arr = new Uint8Array(e.target.result).subarray(0, 5);
      const header = String.fromCharCode(...arr);
      resolve(header.startsWith('%PDF'));
    };
    reader.onerror = () => resolve(false);
    reader.readAsArrayBuffer(file.slice(0, 5));
  });
}

export default function AdminUpload () {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get('type') || 'notes';

  const [form, setForm] = useState({
    title: '',
    description: '',
    type: initialType,
    branch: '',
    semester: '',
    subject: ''
  });

  const [file, setFile] = useState(null);
  const [fileKey, setFileKey] = useState(Date.now());
  const [isUploading, setIsUploading] = useState(false);
  const [isMock, setIsMock] = useState(false);

  useEffect(() => {
    checkSupabaseConnection().then(connected => setIsMock(!connected));
  }, []);

  if (authLoading) return <LoadingSpinner text='Authenticating...' />;
  if (!user || !isAdmin) return <Navigate to='/' replace />;

  const semesterOptions = SEMESTERS.map(s => ({ value: s.toString(), label: `Semester ${s}` }));
  const branchOptions = BRANCHES.map(b => ({ value: b, label: b }));
  const typeOptions = RESOURCE_TYPES.map(t => ({ value: t, label: t.toUpperCase() }));

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];

    if (!selectedFile) return;

    if (selectedFile.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed.');
      setFile(null);
      setFileKey(Date.now());
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      toast.error(`File size exceeds 10MB limit (Current: ${(selectedFile.size / (1024 * 1024)).toFixed(2)}MB).`);
      setFile(null);
      setFileKey(Date.now());
      return;
    }

    const isValidPdf = await validatePdfMagicBytes(selectedFile);
    if (!isValidPdf) {
      toast.error('File content does not match PDF format.');
      setFile(null);
      setFileKey(Date.now());
      return;
    }

    setFile(selectedFile);
  };

  const sanitizeInput = (str) => {
    return str.trim().replace(/[<>'"]/g, '').slice(0, 200);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isUploading) return;
    if (!file) {
      toast.error('Please select a valid PDF file.');
      return;
    }
    if (!form.semester || !form.branch) {
      toast.error('Please select both Branch and Semester.');
      return;
    }

    setIsUploading(true);

    try {
      const timestamp = Date.now();
      const sanitizedTitle = form.title
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .slice(0, 50);

      const filePath = `${user.id}/${form.branch}/${form.semester}/${form.type}/${timestamp}_${sanitizedTitle}.pdf`;

      const fileUrl = await uploadFile('study-materials', filePath, file);

      await createResource({
        title: sanitizeInput(form.title),
        description: sanitizeInput(form.description),
        type: form.type,
        branch: form.branch,
        semester: parseInt(form.semester),
        subject: sanitizeInput(form.subject),
        file_url: fileUrl,
        created_by: user.id
      });

      toast.success('Resource uploaded successfully!');
      setForm({ title: '', description: '', type: 'notes', branch: '', semester: '', subject: '' });
      setFile(null);
      setFileKey(Date.now());

      setTimeout(() => navigate('/admin'), 2000);
    } catch (err) {
      logger.error('Admin upload failed', { error: err.message, user: user.email });
      toast.error(err.message || 'System error.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="admin-page-container">
      <SEO title='Admin - Upload Resource' description='Admin upload interface.' urlPath='/admin/upload' />
      <div className="ambient-background"></div>
      
      <OfflineBanner isMock={isMock} onRetry={() => {
        setIsMock(false);
        checkSupabaseConnection().then(connected => setIsMock(!connected));
      }} />

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="page-hero-premium"
      >
        <div className="hero-icon-blob">📤</div>
        <h1 className="page-hero-title">Contribute <span>Material</span></h1>
        <p className="page-hero-sub">Adding elite academic resources to the PROJECTX database</p>
        <Link to='/admin' className="back-link">← Back to Dashboard</Link>
      </motion.div>

      <section className="form-container">
        <motion.form
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          onSubmit={handleSubmit} 
          className="glass-panel admin-form"
        >
          <div className="form-grid">
            <div className="form-row">
              <CustomSelector 
                label="Resource Type"
                value={form.type}
                onChange={val => setForm(f => ({ ...f, type: val }))}
                options={typeOptions}
              />
              <CustomSelector 
                label="Academic Branch"
                value={form.branch}
                onChange={val => setForm(f => ({ ...f, branch: val }))}
                options={branchOptions}
              />
            </div>

            <div className="form-row">
              <CustomSelector 
                label="Semester"
                value={form.semester}
                onChange={val => setForm(f => ({ ...f, semester: val }))}
                options={semesterOptions}
              />
              <div className="input-group-premium">
                <label>Subject Name</label>
                <div className="field-inner">
                  <input placeholder='Ex: Data Structures' value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} required />
                  <div className="field-glow"></div>
                </div>
              </div>
            </div>

            <div className="input-group-premium">
              <label>Resource Title</label>
              <div className="field-inner">
                <input placeholder='Ex: Unit 1 Lecture Notes' value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
                <div className="field-glow"></div>
              </div>
            </div>

            <div className="input-group-premium">
              <label>Description</label>
              <div className="field-inner">
                <textarea 
                  placeholder='Brief summary of the PDF content...' 
                  value={form.description} 
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))} 
                  required 
                />
                <div className="field-glow"></div>
              </div>
            </div>

            <div className="file-upload-zone">
              <label className="selector-label">PDF File (Max 10MB)</label>
              <div className={`drop-zone ${file ? 'has-file' : ''}`}>
                <input key={fileKey} type='file' accept='application/pdf' onChange={handleFileChange} required />
                <div className="drop-zone-content">
                  <span className="drop-icon">{file ? '✅' : '📁'}</span>
                  <span className="drop-text">
                    {file ? file.name : 'Click to select or drag PDF file here'}
                  </span>
                  {file && <span className="file-size">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>}
                </div>
              </div>
            </div>
          </div>

          <button type='submit' className="action-button upload-btn" disabled={isUploading || isMock}>
            {isUploading ? <div className='spinner' /> : isMock ? 'Offline Mode Active' : '🚀 UPLOAD TO CLOUD'}
          </button>
        </motion.form>
      </section>

      <style>{`
        .admin-page-container { min-height: 100vh; background: var(--bg-primary); padding-bottom: 6rem; position: relative; overflow-x: hidden; }
        .ambient-background { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.1) 0%, transparent 40%); pointer-events: none; }
        
        .page-hero-premium { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 6rem 1rem 3rem; }
        .hero-icon-blob { width: 70px; height: 70px; background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.2); border-radius: 2rem; display: flex; align-items: center; justify-content: center; font-size: 2rem; margin-bottom: 1.5rem; }
        .page-hero-title { font-family: 'Syne', sans-serif; font-size: clamp(2rem, 8vw, 3.5rem); font-weight: 800; letter-spacing: -2px; margin: 0; }
        .page-hero-title span { color: var(--accent-purple); }
        .page-hero-sub { color: var(--text-muted); margin-top: 1rem; font-weight: 500; }
        
        .back-link { margin-top: 1.5rem; color: var(--text-muted); text-decoration: none; font-weight: 700; font-size: 0.9rem; transition: 0.3s; }
        .back-link:hover { color: var(--text-primary); transform: translateX(-5px); }

        .form-container { max-width: 850px; margin: 0 auto; padding: 0 1.5rem; position: relative; z-index: 10; }
        .admin-form { padding: clamp(2rem, 5vw, 3.5rem); display: flex; flex-direction: column; gap: 2rem; }
        
        .form-grid { display: flex; flex-direction: column; gap: 1.5rem; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        @media (max-width: 600px) { .form-row { grid-template-columns: 1fr; } }

        .input-group-premium label { font-size: 0.7rem; font-weight: 900; color: var(--text-muted); margin-bottom: 0.8rem; display: block; text-transform: uppercase; letter-spacing: 2px; }
        .field-inner { position: relative; }
        .field-inner input, .field-inner textarea { width: 100%; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 1.25rem; padding: 1.1rem 1.5rem; color: var(--text-primary); font-weight: 700; font-size: 1rem; outline: none; transition: 0.3s; position: relative; z-index: 2; font-family: inherit; }
        .field-inner textarea { min-height: 120px; resize: none; line-height: 1.6; }
        .field-inner input:focus, .field-inner textarea:focus { border-color: var(--accent-purple); background: var(--bg-primary); }
        .field-glow { position: absolute; inset: 0; background: var(--accent-purple); opacity: 0; filter: blur(15px); transition: 0.3s; z-index: 1; border-radius: 1.25rem; }
        .field-inner input:focus + .field-glow, .field-inner textarea:focus + .field-glow { opacity: 0.1; }

        .file-upload-zone { display: flex; flex-direction: column; gap: 0.8rem; }
        .drop-zone { position: relative; border: 2px dashed var(--border); border-radius: 1.5rem; padding: 2.5rem; transition: 0.3s; background: rgba(var(--bg-glass-rgb), 0.02); overflow: hidden; }
        .drop-zone:hover { border-color: var(--accent-purple); background: rgba(139, 92, 246, 0.05); }
        .drop-zone.has-file { border-style: solid; border-color: var(--accent-green); background: rgba(16, 185, 129, 0.05); }
        
        .drop-zone input { position: absolute; inset: 0; opacity: 0; cursor: pointer; z-index: 5; }
        .drop-zone-content { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; text-align: center; }
        .drop-icon { font-size: 2.5rem; }
        .drop-text { font-weight: 700; color: var(--text-secondary); }
        .file-size { font-size: 0.8rem; color: var(--accent-green); font-weight: 800; }

        .upload-btn { height: 65px; background: var(--accent-purple) !important; box-shadow: 0 10px 30px rgba(139, 92, 246, 0.3) !important; font-size: 1.1rem !important; margin-top: 1rem; }
        .upload-btn:hover:not(:disabled) { box-shadow: 0 20px 40px rgba(139, 92, 246, 0.4) !important; background: #7c3aed !important; }

        .spinner { width: 24px; height: 24px; border: 3px solid rgba(255,255,255,0.2); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
