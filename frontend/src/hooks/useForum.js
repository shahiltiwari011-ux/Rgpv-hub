import { useState, useCallback } from 'react'
import * as api from '../services/api'
import logger from '../utils/logger'

const MOCK_FORUM_POSTS = [
  {
    id: 'mock-1',
    title: 'How to score 8.5+ CGPA in RGPV Diploma?',
    content: 'I am in 3rd sem Computer Science and looking for a strategy to boost my CGPA. Any tips from seniors?',
    branch: 'Computer Science',
    semester: 3,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    profiles: { name: 'EliteLearner' }
  },
  {
    id: 'mock-2',
    title: 'Resources for Strength of Materials (ME)?',
    content: 'Can anyone provide good lecture notes or PYQ solutions for SOM? The official ones are too complex.',
    branch: 'Mechanical',
    semester: 4,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    profiles: { name: 'MechWarrior' }
  },
  {
    id: 'mock-3',
    title: 'PROJECTX Academic Results feature is amazing!',
    content: 'Just checked my marks and it works even when the main RGPV site is crashing. Kudos to the devs.',
    branch: 'Electronics',
    semester: 5,
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    profiles: { name: 'ProjectX_Fan' }
  }
]

const MOCK_COMMENTS = {
  'mock-1': [
    {
      id: 'c1',
      content: 'Focus on PYQs from 2021-2023. Most theory questions repeat. Also, maintain your practical files properly.',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      profiles: { name: 'Sagar_CS' }
    },
    {
      id: 'c2',
      content: 'Try to use the notes from the Resource section here. They are highly optimized for RGPV pattern.',
      created_at: new Date(Date.now() - 43200000).toISOString(),
      profiles: { name: 'Admin_User' }
    }
  ]
}

export function useForum() {
  const [posts, setPosts] = useState([])
  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState(null)
  const [isMock, setIsMock] = useState(false)

  const loadPosts = useCallback(async (filters = {}) => {
    setIsPending(true)
    setError(null)
    try {
      const { data } = await api.getForumPosts(filters)
      setPosts(data)
      setIsMock(false)
    } catch (err) {
      logger.warn('Forum posts fetch failed, falling back to mock data', { error: err.message })
      setPosts(MOCK_FORUM_POSTS.filter(p => {
        const branchMatch = !filters.branch || filters.branch === 'All' || p.branch === filters.branch
        const semMatch = !filters.semester || filters.semester === 'All' || p.semester === parseInt(filters.semester)
        return branchMatch && semMatch
      }))
      setIsMock(true)
    } finally {
      setIsPending(false)
    }
  }, [])

  const loadPost = useCallback(async (id) => {
    setIsPending(true)
    setError(null)
    try {
      const data = await api.getForumPost(id)
      setPost(data)
      setIsMock(false)
    } catch (err) {
      const mockPost = MOCK_FORUM_POSTS.find(p => p.id === id)
      if (mockPost) {
        setPost(mockPost)
        setIsMock(true)
      } else {
        setError('Post not found in offline mode')
      }
    } finally {
      setIsPending(false)
    }
  }, [])

  const loadComments = useCallback(async (postId) => {
    try {
      const data = await api.getForumComments(postId)
      setComments(data)
    } catch (err) {
      setComments(MOCK_COMMENTS[postId] || [])
    }
  }, [])

  return {
    posts,
    post,
    comments,
    isPending,
    error,
    isMock,
    loadPosts,
    loadPost,
    loadComments
  }
}
