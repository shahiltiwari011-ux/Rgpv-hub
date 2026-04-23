import { useState, useEffect } from 'react'
import { getForumPosts, createForumPost } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { LoadingSpinner, EmptyState, ErrorState } from '../components/States'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import { toast } from 'react-hot-toast'

const BRANCHES = ['All', 'Computer Science', 'Mechanical', 'Electrical', 'Civil', 'Electronics']
const SEMESTERS = ['All', '1', '2', '3', '4', '5', '6']

export default function DiscussionPage () {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({ branch: 'All', semester: 'All' })
  const [showNewPost, setShowNewPost] = useState(false)
  const [newPost, setNewPost] = useState({ title: '', content: '', branch: 'All', semester: 'All' })

  useEffect(() => {
    loadPosts()
  }, [filters])

  const loadPosts = async () => {
    setLoading(true)
    try {
      const { data } = await getForumPosts(filters)
      setPosts(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) return toast.error('Login to post!')
    try {
      await createForumPost({
        ...newPost,
        branch: newPost.branch === 'All' ? null : newPost.branch,
        semester: newPost.semester === 'All' ? null : parseInt(newPost.semester)
      })
      toast.success('Post created! 🚀')
      setShowNewPost(false)
      setNewPost({ title: '', content: '', branch: 'All', semester: 'All' })
      loadPosts()
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <>
      <SEO title="Elite Discussions - PROJECTX" description="Collaborate with top students on PROJECTX. Ask questions, share knowledge, and solve academic challenges." />
      
      <div className='page-hero'>
        <span className='page-hero-icon'>🤝</span>
        <h1 className='page-hero-title'>Community Forum</h1>
        <p className='page-hero-sub'>Collaborate with the PROJECTX elite network</p>
        
        <button 
          className={`btn-primary ${showNewPost ? 'btn-secondary' : ''}`}
          onClick={() => setShowNewPost(!showNewPost)}
          style={{ marginTop: '1.5rem', minWidth: '180px' }}
        >
          {showNewPost ? '✕ Close Form' : '➕ Ask a Question'}
        </button>
      </div>

      <div className='forum-container' style={{ padding: '0 var(--container-px) 5rem' }}>
        {showNewPost && (
          <form onSubmit={handleSubmit} className='forum-form-box' style={{ padding: 'clamp(1.5rem, 5vw, 2rem)' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontFamily: 'Syne, sans-serif' }}>Create New Post</h2>
            <div style={{ marginBottom: '1.25rem' }}>
              <input 
                className='form-input'
                placeholder='Question Title (e.g. How to solve Integration?)'
                value={newPost.title}
                onChange={e => setNewPost({...newPost, title: e.target.value})}
                required
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
              <select className='form-input' value={newPost.branch} onChange={e => setNewPost({...newPost, branch: e.target.value})}>
                {BRANCHES.map(b => <option key={b} value={b}>{b} Branch</option>)}
              </select>
              <select className='form-input' value={newPost.semester} onChange={e => setNewPost({...newPost, semester: e.target.value})}>
                {SEMESTERS.map(s => <option key={s} value={s}>{s === 'All' ? 'All Semesters' : `Sem ${s}`}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <textarea 
                className='form-input forum-textarea'
                placeholder='Describe your problem in detail...'
                value={newPost.content}
                onChange={e => setNewPost({...newPost, content: e.target.value})}
                required
              />
            </div>
            <button type='submit' className='btn-primary' style={{ width: '100%', justifyContent: 'center', height: '3.5rem' }}>🚀 Post Question</button>
          </form>
        )}

        <div style={{ marginBottom: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h4 className='selector-label'>Filter by Branch</h4>
            <div className='tab-group'>
              {BRANCHES.map(b => (
                <button 
                  key={b}
                  className={`tab-btn ${filters.branch === b ? 'active' : ''}`}
                  onClick={() => setFilters({...filters, branch: b})}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className='selector-label'>Semester</h4>
            <div className='tab-group'>
              {SEMESTERS.map(s => (
                <button 
                  key={s}
                  className={`tab-btn sem-btn ${filters.semester === s ? 'active' : ''}`}
                  onClick={() => setFilters({...filters, semester: s})}
                >
                  {s === 'All' ? 'All' : `Sem ${s}`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? <LoadingSpinner /> : error ? <ErrorState message={error} /> : posts.length === 0 ? <EmptyState icon='💬' title='No discussions yet' message='Be the first to ask a question!' /> : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {posts.map(post => (
              <Link to={`/discussion/${post.id}`} key={post.id} className='forum-post-card' style={{ padding: 'clamp(1.25rem, 4vw, 1.75rem)' }}>
                <h3 className='forum-title' style={{ fontSize: 'clamp(1.1rem, 4vw, 1.25rem)' }}>{post.title}</h3>
                <div className='forum-meta'>
                  <div className='forum-author-tag'>
                    <div className='forum-author-avatar'>
                      {(post.profiles?.full_name || post.profiles?.name || 'A').charAt(0).toUpperCase()}
                    </div>
                    <span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {post.profiles?.full_name || post.profiles?.name || 'Anonymous'}
                    </span>
                  </div>
                  <span className="desktop-only">·</span>
                  <span style={{ fontSize: '0.75rem' }}>{new Date(post.created_at).toLocaleDateString()}</span>
                  {post.branch && <span className='forum-badge' style={{ fontSize: '0.7rem' }}>{post.branch}</span>}
                  {post.semester && <span className='forum-badge' style={{ fontSize: '0.7rem' }}>Sem {post.semester}</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
