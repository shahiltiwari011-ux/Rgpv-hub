import { useState, useEffect } from 'react'
import { supabase, isSupabaseReady } from '../services/supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function HelpfulVote ({ resourceId }) {
  const { user } = useAuth()
  const [score, setScore] = useState(0)
  const [userVote, setUserVote] = useState(0) // 1, -1, or 0

  useEffect(() => {
    if (!isSupabaseReady()) return

    // Fetch aggregate score
    supabase
      .from('helpful_votes')
      .select('vote')
      .eq('resource_id', resourceId)
      .then(({ data }) => {
        if (data) setScore(data.reduce((sum, v) => sum + v.vote, 0))
      })

    // Fetch user's vote
    if (user) {
      supabase
        .from('helpful_votes')
        .select('vote')
        .eq('resource_id', resourceId)
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) setUserVote(data.vote)
        })
    }
  }, [resourceId, user])

  const handleVote = async (vote, e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) return
    if (!isSupabaseReady()) return

    const prevVote = userVote
    const newVote = prevVote === vote ? 0 : vote

    // Optimistic update
    setUserVote(newVote)
    setScore(s => s - prevVote + newVote)

    try {
      if (newVote === 0) {
        await supabase
          .from('helpful_votes')
          .delete()
          .eq('resource_id', resourceId)
          .eq('user_id', user.id)
      } else {
        await supabase
          .from('helpful_votes')
          .upsert({
            user_id: user.id,
            resource_id: resourceId,
            vote: newVote
          }, { onConflict: 'user_id,resource_id' })
      }

      // Update resource helpful_score
      await supabase
        .from('resources')
        .update({ helpful_score: score - prevVote + newVote })
        .eq('id', resourceId)
    } catch {
      setUserVote(prevVote)
      setScore(s => s + prevVote - newVote)
    }
  }

  return (
    <div className='helpful-vote'>
      <button
        className={`vote-btn up ${userVote === 1 ? 'active' : ''}`}
        onClick={(e) => handleVote(1, e)}
        title='Helpful'
      >
        👍
      </button>
      <span className={`vote-score ${score > 0 ? 'positive' : score < 0 ? 'negative' : ''}`}>
        {score}
      </span>
      <button
        className={`vote-btn down ${userVote === -1 ? 'active' : ''}`}
        onClick={(e) => handleVote(-1, e)}
        title='Not helpful'
      >
        👎
      </button>
    </div>
  )
}
