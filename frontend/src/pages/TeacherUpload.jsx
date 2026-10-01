import { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import SEO from '../components/SEO';

export default function TeacherUpload() {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    branch: '',
    semester: '',
    file: null
  });

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, file: e.target.files[0] });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.file) {
      toast.error('Please select a file to upload');
      return;
    }

    setUploading(true);
    const fileExt = formData.file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `teacher-materials/${user.id}/${fileName}`;

    try {
      // 1. Upload file to Supabase Storage ('study-materials' bucket)
      const { error: uploadError } = await supabase.storage
        .from('study-materials')
        .upload(filePath, formData.file);

      if (uploadError) throw uploadError;

      // 2. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('study-materials')
        .getPublicUrl(filePath);

      // 3. Insert record into notes table
      const { error: dbError } = await supabase.from('notes').insert([
        {
          title: formData.title,
          subject: formData.subject,
          branch: formData.branch,
          semester: formData.semester,
          file_url: publicUrl,
          icon: '📚' // Default icon for teacher uploads
          // Note: In a complete implementation, you'd add created_by to notes
        }
      ]);

      if (dbError) throw dbError;

      toast.success('Material uploaded successfully!');
      setFormData({ title: '', subject: '', branch: '', semester: '', file: null });
      
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to upload material');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="projectx-teacher-upload">
      <SEO title="Upload Material | Teacher Portal" />
      <div className="home-mesh-bg"></div>
      
      <div className="upload-container">
        <header className="upload-header">
          <h2>Upload Academic Material</h2>
          <p>Publish notes, assignments, or question papers directly to students.</p>
        </header>

        <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit} className="glass-form">
          <div className="form-group">
            <label>Title</label>
            <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="E.g., Complete OOP Notes Unit 1" />
          </div>
          
          <div className="form-group">
            <label>Subject</label>
            <input required value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} placeholder="E.g., Computer Science (CS-302)" />
          </div>

          <div className="form-group">
            <label>Branch</label>
            <select required value={formData.branch} onChange={e => setFormData({...formData, branch: e.target.value})}>
              <option value="">Select Branch</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Mechanical">Mechanical</option>
              <option value="Civil">Civil</option>
              <option value="Electrical">Electrical</option>
              <option value="Electronics">Electronics</option>
            </select>
          </div>

          <div className="form-group">
            <label>Semester</label>
            <select required value={formData.semester} onChange={e => setFormData({...formData, semester: e.target.value})}>
              <option value="">Select Semester</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label>Upload File (PDF)</label>
            <div className="file-drop-zone">
              <input type="file" required accept=".pdf" onChange={handleFileChange} />
              {formData.file ? (
                <p>Selected: {formData.file.name}</p>
              ) : (
                <p>Click or drag a PDF file here</p>
              )}
            </div>
          </div>

          <button type="submit" className="btn-glow-blue" style={{ gridColumn: '1 / -1' }} disabled={uploading}>
            {uploading ? 'Uploading...' : 'Publish Material'}
          </button>
        </motion.form>
      </div>

      <style>{`
        .projectx-teacher-upload { min-height: 100vh; background: var(--bg-primary); color: var(--text-primary); padding: clamp(8rem, 11vw, 9.5rem) var(--container-px) 4rem; position: relative; }
        .upload-container { max-width: 800px; margin: 0 auto; position: relative; z-index: 10; }
        .upload-header { margin-bottom: 3rem; text-align: center; }
        .upload-header h2 { font-family: 'Syne', sans-serif; font-size: 2.5rem; margin-bottom: 0.5rem; }
        .upload-header p { color: var(--text-secondary); }
        .glass-form { background: var(--bg-card); border: 1px solid var(--border); padding: 3rem; border-radius: 1.5rem; display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; backdrop-filter: blur(10px); }
        @media (max-width: 768px) { .glass-form { grid-template-columns: 1fr; padding: 1.5rem; } }
        .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
        .form-group label { font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; }
        .form-group input, .form-group select { padding: 0.8rem; background: rgba(0,0,0,0.2); border: 1px solid var(--border); border-radius: 0.5rem; color: var(--text-primary); outline: none; transition: 0.3s; }
        .form-group input:focus, .form-group select:focus { border-color: var(--accent-blue); }
        .file-drop-zone { border: 2px dashed var(--border); border-radius: 1rem; padding: 2rem; text-align: center; position: relative; transition: 0.3s; cursor: pointer; background: rgba(0,0,0,0.1); }
        .file-drop-zone:hover { border-color: var(--accent-blue); background: rgba(59,130,246,0.05); }
        .file-drop-zone input[type="file"] { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%; }
        .file-drop-zone p { margin: 0; color: var(--text-secondary); font-weight: 500; }
        .btn-glow-blue { padding: 1rem; background: var(--accent-blue); color: #fff; border: none; border-radius: 1rem; cursor: pointer; font-weight: bold; transition: 0.3s; font-size: 1.1rem; }
        .btn-glow-blue:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </div>
  );
}
