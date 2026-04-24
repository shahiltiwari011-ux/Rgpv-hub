import { useState, useEffect } from 'react'
import { supabase, isSupabaseReady } from '../services/supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function Comments ({ resourceId }) {
  const { user, isAdmin } = useAuth()
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isSupabaseReady()) return
    fetchComments()
  }, [resourceId])

  async function fetchComments () {
    try {
      const { data } = await supabase
        .from('comments')
        .select('*, profiles(email, role)')
        .eq('resource_id', resourceId)
        .order('created_at', { ascending: false })
      setComments(data || [])
    } catch { /* silent */ } finally { setLoading(false) }
  }

  async function handleSubmit (e) {
    e.preventDefault()
    if (!user || !newComment.trim() || submitting) return

    setSubmitting(true)
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          user_id: user.id,
          resource_id: resourceId,
          content: newComment.trim()
        })
        .select('*, profiles(email, role)')
        .single()

      if (!error && data) {
        setComments([data, ...comments])
        setNewComment('')
      }
    } catch { /* silent */ } finally { setSubmitting(false) }
  }

  async function handleDelete (id) {
    try {
      const { error } = await supabase.from('comments').delete().eq('id', id)
      if (!error) setComments(comments.filter(c => c.id !== id))
    } catch { /* silent */ }
  }

  return (
    <div className='comments-section'>
      <h4 className='comments-title'>Comments ({comments.length})</h4>

      {user
        ? (
          <form onSubmit={handleSubmit} className='comment-form'>
            <textarea
              placeholder='Write a helpful comment...'
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              maxLength={500}
              required
            />
            <button type='submit' className='btn-primary comment-submit' disabled={submitting}>
              {submitting ? 'Posting...' : 'Post Comment'}
            </button>
          </form>
          )
        : (
          <p className='login-prompt'>Please login to join the discussion. 💬</p>
          )}

      <div className='comments-list'>
        {loading
          ? (
            <div className='comment-loading'>Loading comments...</div>
            )
          : comments.length > 0
            ? (
                comments.map(c => (
                  <div key={c.id} className='comment-item'>
                    <div className='comment-header'>
                      <span className='comment-author'>
                        {c.profiles?.email?.split('@')[0] || 'User'}
                        {c.profiles?.role === 'admin' && <span className='admin-badge'>Admin</span>}
                      </span>
                      <span className='comment-date'>{new Date(c.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className='comment-content'>{c.content}</p>
                    {(user?.id === c.user_id || isAdmin) && (
                      <button className='comment-delete' onClick={() => handleDelete(c.id)}>Delete</button>
                    )}
                  </div>
                ))
              )
            : (
              <p className='no-comments'>No comments yet. Be the first to help others! 🚀</p>
              )}
      </div>
    </div>
  )
}
