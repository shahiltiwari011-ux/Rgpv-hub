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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isMock, setIsMock] = useState(false);

  useEffect(() => {
    checkSupabaseConnection().then(connected => setIsMock(!connected));
  }, []);

  if (authLoading) return <LoadingSpinner text='Authenticating...' />;
  if (!user || !isAdmin) return <Navigate to='/' replace />;

  // Filter out any accidentally hardcoded semesters 7 or 8 (strictly 1-6)
  const semesterOptions = [
    { value: '', label: 'Select Semester' },
    ...SEMESTERS.filter(s => s <= 6).map(s => ({ value: s.toString(), label: `Semester ${s}` }))
  ];
  const branchOptions = [
    { value: '', label: 'Select Branch' },
    ...BRANCHES.map(b => ({ value: b, label: b }))
  ];
  const typeOptions = [
    { value: '', label: 'Select Type' },
    ...RESOURCE_TYPES.map(t => ({ value: t, label: t.toUpperCase() }))
  ];

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
      const limitMB = MAX_FILE_SIZE / 1024 / 1024;
      toast.error(`File size exceeds ${limitMB}MB limit.`);
      setFile(null);
      setFileKey(Date.now());
      return;
    }

    const isValidPdf = await validatePdfMagicBytes(selectedFile);
    if (!isValidPdf) {
      toast.error('Invalid PDF format detected.');
      setFile(null);
      setFileKey(Date.now());
      return;
    }

    setFile(selectedFile);
  };

  const sanitizeInput = (str) => str.trim().replace(/[<>'"]/g, '').slice(0, 200);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isUploading) return;
    if (!file) return toast.error('Select a PDF file.');
    if (!form.semester || !form.branch) return toast.error('Select Branch and Semester.');

    setIsUploading(true);
    const toastId = toast.loading('Publishing resource...');
    
    try {
      const timestamp = Date.now();
      const sanitizedTitle = form.title.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 50);
      // Sanitize branch for path
      const sanitizedBranch = form.branch.replace(/\s+/g, '_');
      const filePath = `${user.id}/${sanitizedBranch}/${form.semester}/${form.type}/${timestamp}_${sanitizedTitle}.pdf`;

      logger.info('Starting file upload', { path: filePath, size: file.size });
      const fileUrl = await uploadFile('study-materials', filePath, file, (progress) => {
        setUploadProgress(progress);
      });
      
      logger.info('File uploaded successfully, creating database entry', { fileUrl });
      
      // Calculate file size in MB
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
      
      // Extract year from title if present (e.g. "2023", "2024")
      const yearMatch = form.title.match(/\b(20\d{2})\b/);
      const extractedYear = yearMatch ? yearMatch[1] : null;

      // Map icons
      const iconMap = {
        notes: '📝',
        pyq: '📄',
        syllabus: '📋'
      };

      await createResource({
        ...form,
        title: sanitizeInput(form.title),
        description: sanitizeInput(form.description),
        semester: parseInt(form.semester),
        subject: sanitizeInput(form.subject),
        file_url: fileUrl,
        file_size: fileSizeMB,
        icon: iconMap[form.type] || '📄',
        year: extractedYear,
        created_by: user.id
      });

      toast.success('Resource published!', { id: toastId });
      setForm({ title: '', description: '', type: 'notes', branch: '', semester: '', subject: '' });
      setFile(null);
      setFileKey(Date.now());
      setUploadProgress(0);
      setTimeout(() => navigate('/admin'), 1500);
    } catch (err) {
      logger.error('Resource publication failed', { error: err.message, form });
      toast.error(err.message || 'Upload failed.', { id: toastId });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="publish-view">
      <SEO title='Admin - Publish Asset' />
      
      <div className="view-header">
        <h1 className="view-title">Publish <span>Resource</span></h1>
        <p className="view-subtitle">Deploy Notes, Syllabus, or PYQs to the production database.</p>
      </div>

      <div className="publish-layout">
        <div className="publish-form-col">
          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit} 
            className="glass-panel admin-form"
          >
            <div className="form-grid">
              <div className="input-group-premium">
                <label>Asset Title</label>
                <div className="field-inner">
                  <input placeholder='e.g. OS Previous Year 2023' value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
                  <div className="field-glow"></div>
                </div>
              </div>

              <div className="form-row">
                <CustomSelector 
                  label="Content Type"
                  value={form.type}
                  onChange={val => setForm(f => ({ ...f, type: val }))}
                  options={typeOptions}
                />
                <CustomSelector 
                  label="Branch / Department"
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
                  <label>Subject</label>
                  <div className="field-inner">
                    <input placeholder='Subject name...' value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} required />
                    <div className="field-glow"></div>
                  </div>
                </div>
              </div>

              <div className="file-upload-zone">
                <label className="selector-label">PDF Document</label>
                <div className={`drop-zone ${file ? 'has-file' : ''}`}>
                  <input key={fileKey} type='file' accept='application/pdf' onChange={handleFileChange} required />
                  <div className="drop-zone-content">
                    <span className="drop-icon">{file ? '✅' : '☁️'}</span>
                    <span className="drop-text">
                      {file ? file.name : 'Click or Drag PDF file to upload'}
                    </span>
                    {file && <span className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</span>}
                  </div>
                </div>
              </div>
            </div>

            <button type='submit' className="deploy-btn" disabled={isUploading || isMock}>
              {isUploading ? (
                <div className='upload-progress-btn'>
                  <div className='spinner' />
                  <span>{uploadProgress > 0 ? `PUBLISHING... ${uploadProgress}%` : 'PREPARING...'}</span>
                </div>
              ) : 'DEPLOY CONTENT'}
            </button>
          </motion.form>
        </div>

        <aside className="publish-info-col">
          <div className="info-card glass-panel">
            <h3>Instructions</h3>
            <ul>
              <li><strong>PYQ:</strong> Use year in title (e.g. 2024).</li>
              <li><strong>Syllabus:</strong> Upload latest schemes only.</li>
              <li><strong>Notes:</strong> Mention author if possible.</li>
            </ul>
          </div>
          
          <div className="info-card glass-panel status">
            <h3>System Status</h3>
            <div className="status-item">
              <span className={`dot ${isMock ? 'warning' : 'success'}`}></span>
              <span>{isMock ? 'Offline Mode' : 'Cloud Connected'}</span>
            </div>
            <div className="status-item">
              <span className="dot success"></span>
              <span>RGPV Proxy Live</span>
            </div>
          </div>
        </aside>
      </div>

      <style>{`
        .publish-view { max-width: 1100px; margin: 0 auto; }
        .view-header { margin-bottom: 2.5rem; }
        .view-title { font-family: 'Syne', sans-serif; font-size: clamp(1.8rem, 5vw, 2.5rem); font-weight: 800; margin: 0; }
        .view-title span { color: var(--accent-blue); }
        .view-subtitle { color: var(--text-muted); margin-top: 0.5rem; font-weight: 500; font-size: 0.9rem; }

        .publish-layout { display: grid; grid-template-columns: 1fr 300px; gap: 2rem; align-items: start; }

        .publish-form-col .admin-form { padding: clamp(1.5rem, 4vw, 2.5rem); border-radius: 2rem; }
        .form-grid { display: flex; flex-direction: column; gap: 1.5rem; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        
        .input-group-premium label { font-size: 0.65rem; font-weight: 900; color: var(--text-muted); margin-bottom: 0.8rem; display: block; text-transform: uppercase; letter-spacing: 2px; }
        .field-inner input { width: 100%; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 1rem; padding: 1rem 1.25rem; color: var(--text-primary); font-weight: 700; outline: none; transition: 0.3s; font-size: 0.95rem; }
        .field-inner input:focus { border-color: var(--accent-blue); background: var(--bg-primary); }

        .drop-zone { border: 2px dashed var(--border); border-radius: 1.5rem; padding: clamp(2rem, 8vw, 3.5rem) 1.5rem; text-align: center; position: relative; transition: 0.3s; background: rgba(var(--bg-glass-rgb), 0.02); }
        .drop-zone:hover, .drop-zone.has-file { border-color: var(--accent-blue); background: rgba(59, 130, 246, 0.05); }
        .drop-zone input { position: absolute; inset: 0; opacity: 0; cursor: pointer; z-index: 10; }
        .drop-icon { font-size: 2.2rem; display: block; margin-bottom: 1rem; }
        .drop-text { font-weight: 700; color: var(--text-secondary); font-size: 0.9rem; display: block; }
        .file-size { font-size: 0.7rem; color: var(--accent-blue); font-weight: 800; margin-top: 0.5rem; display: block; }

        .deploy-btn { 
          width: 100%; height: 60px; margin-top: 1rem; background: var(--accent-blue); color: #fff; 
          border: none; border-radius: 1.25rem; font-weight: 900; font-size: 1rem; cursor: pointer;
          box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3); transition: 0.3s; letter-spacing: 1px;
        }
        .deploy-btn:hover { transform: translateY(-3px); box-shadow: 0 15px 35px rgba(59, 130, 246, 0.4); filter: brightness(1.1); }
        .deploy-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        .publish-info-col { display: flex; flex-direction: column; gap: 1.5rem; }
        .info-card { padding: 1.5rem; border-radius: 1.5rem; }
        .info-card h3 { font-size: 0.8rem; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 1.25rem; color: var(--text-primary); }
        .info-card ul { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 0.75rem; }
        .info-card li { font-size: 0.8rem; color: var(--text-secondary); line-height: 1.5; padding-left: 1.25rem; position: relative; }
        .info-card li::before { content: '→'; position: absolute; left: 0; color: var(--accent-blue); font-weight: 900; }
        .info-card li strong { color: var(--text-primary); }

        .status-item { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); }
        .dot { width: 8px; height: 8px; border-radius: 50%; }
        .dot.success { background: var(--accent-green); box-shadow: 0 0 10px var(--accent-green); }
        .dot.warning { background: var(--accent-orange); box-shadow: 0 0 10px var(--accent-orange); }

        .spinner { width: 24px; height: 24px; border: 3px solid rgba(255,255,255,0.2); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; }
        .upload-progress-btn { display: flex; align-items: center; justify-content: center; gap: 1rem; }
        .upload-progress-btn span { font-size: 0.8rem; letter-spacing: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 960px) {
          .publish-layout { grid-template-columns: 1fr; width: 100%; }
          .publish-info-col { flex-direction: row; }
          .info-card { flex: 1; }
        }

        @media (max-width: 800px) {
          .form-row { grid-template-columns: 1fr; gap: 1rem; }
        }

        @media (max-width: 640px) {
          .publish-info-col { flex-direction: column; }
          .publish-form-col .admin-form { padding: 1.25rem; }
          .view-header { margin-bottom: 1.5rem; }
        }
      `}</style>
    </div>
  );
}
