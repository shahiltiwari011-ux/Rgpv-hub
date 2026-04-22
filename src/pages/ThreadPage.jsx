import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getForumPost, getForumComments, addForumComment } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { LoadingSpinner, ErrorState } from '../components/States'
import SEO from '../components/SEO'
import { toast } from 'react-hot-toast'

export default function ThreadPage () {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadThread()
  }, [id])

  const loadThread = async () => {
    try {
      setLoading(true)
      const [postData, commentsData] = await Promise.all([
        getForumPost(id),
        getForumComments(id)
      ])
      setPost(postData)
      setComments(commentsData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async (e) => {
    e.preventDefault()
    if (!user) return toast.error('Login to reply!')
    if (!newComment.trim()) return
    
    setSubmitting(true)
    try {
      await addForumComment(id, newComment)
      setNewComment('')
      toast.success('Reply added! 💬')
      loadThread()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <LoadingSpinner text='Loading discussion…' />
  if (error) return <ErrorState message={error} onRetry={loadThread} />
  if (!post) return <ErrorState message='Post not found' />

  return (
    <>
      <SEO title={post.title} description={post.content.substring(0, 160)} />
      
      <div className='forum-container' style={{ paddingTop: '2rem' }}>
        <button 
          onClick={() => navigate('/discussions')}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
        >
          ← Back to Forum
        </button>

        <div className='thread-header-card'>
          <div className='forum-meta' style={{ marginBottom: '1.25rem' }}>
            {post.branch && <span className='forum-badge'>{post.branch}</span>}
            {post.semester && <span className='forum-badge'>Sem {post.semester}</span>}
            <div className='forum-author-tag'>
              <div className='forum-author-avatar'>
                {(post.profiles?.full_name || post.profiles?.name || 'A').charAt(0).toUpperCase()}
              </div>
              <span>{post.profiles?.full_name || post.profiles?.name || 'Anonymous'}</span>
            </div>
            <span>·</span>
            <span>{new Date(post.created_at).toLocaleDateString()}</span>
          </div>
          <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.25rem)', marginBottom: '1.5rem', fontFamily: 'Syne, sans-serif', fontWeight: 800, lineHeight: 1.2 }}>{post.title}</h1>
          <div className='thread-content-text'>{post.content}</div>
        </div>

        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontFamily: 'Syne, sans-serif', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span>Replies</span>
          <span className='forum-badge' style={{ borderRadius: '20px', padding: '0.1rem 0.75rem' }}>{comments.length}</span>
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '3rem' }}>
          {comments.map(c => (
            <div key={c.id} className='comment-card'>
              <div className='forum-meta' style={{ marginBottom: '0.75rem' }}>
                <div className='forum-author-tag'>
                  <div className='forum-author-avatar' style={{ width: 22, height: 22, fontSize: '0.65rem' }}>
                    {(c.profiles?.full_name || c.profiles?.name || 'A').charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontSize: '0.85rem' }}>{c.profiles?.full_name || c.profiles?.name || 'Anonymous'}</span>
                </div>
                <span>·</span>
                <span style={{ fontSize: '0.8rem' }}>{new Date(c.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>{c.content}</p>
            </div>
          ))}
          {comments.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', background: 'rgba(255,255,255,0.02)', borderRadius: 20, border: '1px dashed var(--border)' }}>
              <p style={{ color: 'var(--text-muted)' }}>No replies yet. Be the first to answer! ✨</p>
            </div>
          )}
        </div>

        <div className='comment-input-sticky'>
          <form onSubmit={handleSubmitComment} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div className='forum-author-avatar desktop-only'>
               {user ? (user.email?.charAt(0).toUpperCase() || 'U') : '?'}
            </div>
            <input 
              className='form-input' 
              placeholder={user ? 'Type your helpful reply...' : 'Login to reply...'}
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              disabled={submitting || !user}
              style={{ borderRadius: '14px' }}
            />
            <button type='submit' className='btn-primary' disabled={submitting || !newComment.trim() || !user} style={{ borderRadius: '14px', whiteSpace: 'nowrap' }}>
              {submitting ? '...' : '🚀 Reply'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
