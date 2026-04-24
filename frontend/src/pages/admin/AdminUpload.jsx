import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { createResource, uploadFile } from '../../services/api'
import { LoadingSpinner } from '../../components/States'
import { BRANCHES, SEMESTERS, RESOURCE_TYPES, MAX_FILE_SIZE } from '../../utils/constants'
import SEO from '../../components/SEO'
import logger from '../../utils/logger'
import { toast } from 'react-hot-toast'

// PDF magic bytes: %PDF (hex: 25 50 44 46)
async function validatePdfMagicBytes (file) {
  return new Promise((resolve) => {
    const reader = new window.FileReader()
    reader.onload = (e) => {
      const arr = new Uint8Array(e.target.result).subarray(0, 5)
      const header = String.fromCharCode(...arr)
      resolve(header.startsWith('%PDF'))
    }
    reader.onerror = () => resolve(false)
    reader.readAsArrayBuffer(file.slice(0, 5))
  })
}

export default function AdminUpload () {
  const { user, isAdmin, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialType = searchParams.get('type') || 'notes'

  const [form, setForm] = useState({
    title: '',
    description: '',
    type: initialType,
    branch: '',
    semester: '',
    subject: ''
  })

  const [file, setFile] = useState(null)
  const [fileKey, setFileKey] = useState(Date.now())
  const [isUploading, setIsUploading] = useState(false)

  if (authLoading) return <LoadingSpinner text='Authenticating...' />
  if (!user || !isAdmin) return <Navigate to='/' replace />

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0]

    if (!selectedFile) return

    // 1. MIME type check
    if (selectedFile.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed.')
      setFile(null)
      setFileKey(Date.now())
      return
    }

    // 2. Size check
    if (selectedFile.size > MAX_FILE_SIZE) {
      toast.error(`File size exceeds 10MB limit (Current: ${(selectedFile.size / (1024 * 1024)).toFixed(2)}MB).`)
      setFile(null)
      setFileKey(Date.now())
      return
    }

    // 3. Magic bytes validation (prevents renamed non-PDF files)
    const isValidPdf = await validatePdfMagicBytes(selectedFile)
    if (!isValidPdf) {
      toast.error('File content does not match PDF format. The file may be corrupted or renamed.')
      setFile(null)
      setFileKey(Date.now())
      return
    }

    setFile(selectedFile)
  }

  const sanitizeInput = (str) => {
    return str.trim().replace(/[<>'"]/g, '').slice(0, 200)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isUploading) return
    if (!file) {
      toast.error('Please select a valid PDF file.')
      return
    }

    setIsUploading(true)

    try {
      // Collision-proof file naming
      const timestamp = Date.now()
      const sanitizedTitle = form.title
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .slice(0, 50)

      const filePath = `${user.id}/${form.branch}/${form.semester}/${form.type}/${timestamp}_${sanitizedTitle}.pdf`

      const fileUrl = await uploadFile('study-materials', filePath, file)

      await createResource({
        title: sanitizeInput(form.title),
        description: sanitizeInput(form.description),
        type: form.type,
        branch: form.branch,
        semester: parseInt(form.semester),
        subject: sanitizeInput(form.subject),
        file_url: fileUrl,
        created_by: user.id
      })

      toast.success('Resource uploaded successfully!')
      setForm({ title: '', description: '', type: 'notes', branch: '', semester: '', subject: '' })
      setFile(null)
      setFileKey(Date.now())

      setTimeout(() => navigate('/admin'), 2000)
    } catch (err) {
      logger.error('Admin upload failed', { error: err.message, user: user.email })
      if (err.message.includes('already exists')) {
        toast.error('Resource already exists in database or storage.')
      } else if (err.message.includes('Upload failed')) {
        toast.error('Storage upload failed. Please try again.')
      } else if (err.message.includes('Too many requests')) {
        toast.error('Upload rate limit hit. Please wait before trying again.')
      } else {
        toast.error(err.message || 'System error. Contact administrator.')
      }
    } finally {
      setIsUploading(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '0.85rem 1.25rem',
    borderRadius: '12px',
    border: '1px solid var(--border)',
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontFamily: 'inherit',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'all 0.2s ease'
  }

  return (
    <>
      <SEO title='Admin - Upload Resource' description='Admin upload interface.' urlPath='/admin/upload' />

      <div className='page-hero'>
        <span className='page-hero-icon'>🛡️</span>
        <h1 className='page-hero-title'>Upload Resource</h1>
        <p className='page-hero-sub'>Upload study materials for students</p>
      </div>

      <section style={{ maxWidth: 800, margin: '0 auto 6rem', padding: '0 1.5rem' }}>
        <form
          onSubmit={handleSubmit} style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '24px',
            padding: '2.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            boxShadow: 'var(--shadow-lg)'
          }}
        >

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block' }}>Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={inputStyle} required>
                {RESOURCE_TYPES.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block' }}>Branch</label>
              <select value={form.branch} onChange={e => setForm(f => ({ ...f, branch: e.target.value }))} style={inputStyle} required>
                <option value=''>Select...</option>
                {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block' }}>Semester</label>
              <select value={form.semester} onChange={e => setForm(f => ({ ...f, semester: e.target.value }))} style={inputStyle} required>
                <option value=''>Select...</option>
                {SEMESTERS.map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block' }}>Subject</label>
              <input placeholder='Subject name...' value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} style={inputStyle} required />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block' }}>Resource Title</label>
            <input placeholder='Ex: Unit 1 Data Structures' value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={inputStyle} required />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block' }}>Description</label>
            <textarea placeholder='Brief summary of the PDF content...' value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ ...inputStyle, minHeight: '100px', resize: 'none' }} required />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block' }}>PDF File (Max 10MB)</label>
            <input key={fileKey} type='file' accept='application/pdf' onChange={handleFileChange} style={{ ...inputStyle, padding: '0.6rem' }} required />
            {file && <p style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', marginTop: '0.5rem' }}>📎 {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</p>}
          </div>

          <button type='submit' className='btn-primary' disabled={isUploading} style={{ width: '100%', justifyContent: 'center', height: '52px', marginTop: '1rem' }}>
            {isUploading ? <><div className='spinner' style={{ width: '20px', height: '20px' }} /> Uploading...</> : '🚀 Upload Resource'}
          </button>
        </form>
      </section>
    </>
  )
}
