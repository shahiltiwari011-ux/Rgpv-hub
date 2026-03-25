import { useState, useEffect } from 'react'
import { supabase, isSupabaseReady } from '../services/supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function CollectionModal ({ resourceId, onClose, onSaved }) {
  const { user } = useAuth()
  const [collections, setCollections] = useState([])
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user && isSupabaseReady()) fetchCollections()
  }, [user])

  async function fetchCollections () {
    const { data } = await supabase
      .from('bookmark_collections')
      .select('*')
      .eq('user_id', user.id)
    setCollections(data || [])
    setLoading(false)
  }

  async function handleCreate (e) {
    e.preventDefault()
    if (!newName.trim() || saving) return
    setSaving(true)
    const { data, error } = await supabase
      .from('bookmark_collections')
      .insert({ user_id: user.id, name: newName.trim() })
      .select()
      .single()
    if (!error && data) {
      setCollections([...collections, data])
      setNewName('')
    }
    setSaving(false)
  }

  async function handleSelect (collectionId) {
    setSaving(true)
    await supabase
      .from('bookmarks')
      .update({ collection_id: collectionId })
      .eq('user_id', user.id)
      .eq('resource_id', resourceId)
    setSaving(false)
    onSaved(collectionId)
    onClose()
  }

  return (
    <div className='modal-overlay' onClick={onClose}>
      <div className='modal-content' onClick={e => e.stopPropagation()}>
        <h3>Save to Collection</h3>
        <p>Organize your resources into folders</p>

        <form onSubmit={handleCreate} className='collection-create'>
          <input
            type='text'
            placeholder='New collection name...'
            value={newName}
            onChange={e => setNewName(e.target.value)}
          />
          <button type='submit' disabled={saving}>Create</button>
        </form>

        <div className='collection-list'>
          {loading
            ? <p>Loading folders...</p>
            : collections.map(c => (
              <button key={c.id} className='collection-item' onClick={() => handleSelect(c.id)}>
                <span>📁 {c.name}</span>
              </button>
            ))}
          <button className='collection-item' onClick={() => handleSelect(null)}>
            <span>📂 Default (No Folder)</span>
          </button>
        </div>

        <button className='btn-secondary modal-close' onClick={onClose}>Cancel</button>
      </div>
    </div>
  )
}
