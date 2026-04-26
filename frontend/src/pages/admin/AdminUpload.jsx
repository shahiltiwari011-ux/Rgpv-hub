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
      toast.error(`File size exceeds 10MB limit.`);
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
    try {
      const timestamp = Date.now();
      const sanitizedTitle = form.title.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 50);
      const filePath = `${user.id}/${form.branch}/${form.semester}/${form.type}/${timestamp}_${sanitizedTitle}.pdf`;

      const fileUrl = await uploadFile('study-materials', filePath, file);
      await createResource({
        ...form,
        title: sanitizeInput(form.title),
        description: sanitizeInput(form.description),
        semester: parseInt(form.semester),
        subject: sanitizeInput(form.subject),
        file_url: fileUrl,
        created_by: user.id
      });

      toast.success('Resource published!');
      setForm({ title: '', description: '', type: 'notes', branch: '', semester: '', subject: '' });
      setFile(null);
      setFileKey(Date.now());
      setTimeout(() => navigate('/admin'), 1500);
    } catch (err) {
      toast.error(err.message || 'Upload failed.');
    } finally {
      setIsUploading(false);
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
              {isUploading ? <div className='spinner' /> : 'DEPLOY CONTENT'}
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
        .publish-view { max-width: 1100px; }
        .view-header { margin-bottom: 3rem; }
        .view-title { font-family: 'Syne', sans-serif; font-size: 2.5rem; font-weight: 800; margin: 0; }
        .view-title span { color: var(--accent-blue); }
        .view-subtitle { color: var(--text-muted); margin-top: 0.5rem; font-weight: 500; }

        .publish-layout { display: grid; grid-template-columns: 1fr 300px; gap: 2rem; align-items: start; }
        @media (max-width: 900px) { .publish-layout { grid-template-columns: 1fr; } }

        .publish-form-col .admin-form { padding: 2.5rem; }
        .form-grid { display: flex; flex-direction: column; gap: 1.5rem; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        
        .input-group-premium label { font-size: 0.7rem; font-weight: 900; color: var(--text-muted); margin-bottom: 0.8rem; display: block; text-transform: uppercase; letter-spacing: 2px; }
        .field-inner input { width: 100%; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 1rem; padding: 1rem 1.25rem; color: var(--text-primary); font-weight: 700; outline: none; }
        .field-inner input:focus { border-color: var(--accent-blue); }

        .drop-zone { border: 2px dashed var(--border); border-radius: 1rem; padding: 3rem 2rem; text-align: center; position: relative; transition: 0.3s; }
        .drop-zone:hover { border-color: var(--accent-blue); background: rgba(59, 130, 246, 0.05); }
        .drop-zone input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
        .drop-icon { font-size: 2rem; display: block; margin-bottom: 1rem; }
        .drop-text { font-weight: 700; color: var(--text-secondary); }

        .deploy-btn { 
          width: 100%; height: 56px; margin-top: 1rem; background: var(--accent-blue); color: #fff; 
          border: none; border-radius: 1rem; font-weight: 900; font-size: 1rem; cursor: pointer;
          box-shadow: 0 10px 20px rgba(59, 130, 246, 0.2); transition: 0.3s;
        }
        .deploy-btn:hover { transform: translateY(-3px); box-shadow: 0 15px 30px rgba(59, 130, 246, 0.3); }

        .publish-info-col { display: flex; flex-direction: column; gap: 1.5rem; }
        .info-card { padding: 1.5rem; }
        .info-card h3 { font-size: 0.9rem; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 1rem; color: var(--text-primary); }
        .info-card ul { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 0.75rem; }
        .info-card li { font-size: 0.85rem; color: var(--text-secondary); line-height: 1.4; }
        .info-card li strong { color: var(--text-primary); }

        .status-item { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; font-size: 0.85rem; font-weight: 700; color: var(--text-secondary); }
        .dot { width: 8px; height: 8px; border-radius: 50%; }
        .dot.success { background: var(--accent-green); box-shadow: 0 0 10px var(--accent-green); }
        .dot.warning { background: var(--accent-orange); box-shadow: 0 0 10px var(--accent-orange); }

        .spinner { width: 24px; height: 24px; border: 3px solid rgba(255,255,255,0.2); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
