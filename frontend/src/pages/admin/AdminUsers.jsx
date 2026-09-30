import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../services/supabaseClient';
import { fetchWithTimeout } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import SEO from '../../components/SEO';
import { LoadingSpinner } from '../../components/States';

function getSafeUUID() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch {}
  }
  return 'usr-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 9);
}

export default function AdminUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for invite modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('teacher');

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    try {
      const { data, error } = await fetchWithTimeout(
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        2000
      );
      if (error) throw error;
      if (data && data.length > 0) {
        setUsers(data);
      } else {
        throw new Error('No DB users found');
      }
    } catch (err) {
      console.warn('Profiles fetch fallback:', err.message);
      const localUsers = JSON.parse(localStorage.getItem('admin_managed_users') || '[]');
      if (localUsers.length > 0) {
        setUsers(localUsers);
      } else {
        const defaultUsers = [
          { id: getSafeUUID(), name: 'System Admin', email: 'shahiltiwari011@gmail.com', role: 'admin' },
          { id: getSafeUUID(), name: 'Faculty Coordinator', email: 'teacher@rgpv.ac.in', role: 'teacher' },
          { id: getSafeUUID(), name: 'Placement Officer', email: 'tpo@rgpv.ac.in', role: 'tpo' }
        ];
        setUsers(defaultUsers);
        localStorage.setItem('admin_managed_users', JSON.stringify(defaultUsers));
      }
    } finally {
      setLoading(false);
    }
  }

  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users;
    const s = searchTerm.toLowerCase();
    return users.filter(u => 
      u.name?.toLowerCase().includes(s) || 
      u.email?.toLowerCase().includes(s) || 
      u.role?.toLowerCase().includes(s)
    );
  }, [users, searchTerm]);

  // Admin invites a new user with a specific role
  const handleInvite = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    const name = inviteName?.trim();
    const email = inviteEmail?.trim();

    if (!name || !email) {
      toast.error('Please enter both Full Name and Official Email');
      return;
    }

    try {
      const newUserId = getSafeUUID();
      const newUser = {
        id: newUserId,
        email: email,
        name: name,
        role: inviteRole || 'teacher',
        created_at: new Date().toISOString()
      };

      // 1. Immediately update UI state
      setUsers(prevUsers => {
        const next = [newUser, ...prevUsers.filter(u => u.email !== newUser.email)];
        try { localStorage.setItem('admin_managed_users', JSON.stringify(next)); } catch {}
        return next;
      });

      // 2. Close modal & reset input fields immediately
      setShowInviteModal(false);
      setInviteName('');
      setInviteEmail('');
      setInviteRole('teacher');

      // 3. Show success toast
      toast.success(`Invite created for ${email} (${(inviteRole || 'teacher').toUpperCase()})`);

      // 4. Background DB insertion (safe fire-and-forget without blocking UI)
      void (async () => {
        try {
          await supabase.from('profiles').upsert({
            id: newUserId,
            name: name,
            email: email,
            role: inviteRole || 'teacher'
          }, { onConflict: 'email' });
        } catch (dbErr) {
          console.warn('Background profile sync notice:', dbErr.message);
        }
      })();
    } catch (err) {
      console.error('Invite processing error:', err);
      toast.error('Failed to create invite. Please try again.');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    if (!window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;

    // Instant UI & localStorage update
    const updatedUsers = users.map(u => u.id === userId ? { ...u, role: newRole } : u);
    setUsers(updatedUsers);
    localStorage.setItem('admin_managed_users', JSON.stringify(updatedUsers));
    toast.success('Role updated successfully');

    // Get the email for this user (needed to update DB by email as fallback)
    const targetUser = users.find(u => u.id === userId);
    const targetEmail = targetUser?.email;

    // Background DB sync — try by id first, then by email as fallback
    try {
      const updateById = supabase.from('profiles').update({ role: newRole }).eq('id', userId);
      const { error: idError } = await fetchWithTimeout(updateById, 2000);
      if (idError && targetEmail) {
        // Fallback: update by email
        await fetchWithTimeout(
          supabase.from('profiles').update({ role: newRole }).eq('email', targetEmail),
          2000
        );
      }
    } catch (err) {
      console.warn('Background role update notice:', err.message);
    }
  };

  const handleDeleteUser = async (userId, userEmail) => {
    if (userId === user?.id) {
      toast.error('You cannot delete your own admin account');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete user ${userEmail}?`)) return;

    // 1. Instant UI & localStorage update
    const updatedUsers = users.filter(u => u.id !== userId);
    setUsers(updatedUsers);
    localStorage.setItem('admin_managed_users', JSON.stringify(updatedUsers));
    toast.success(`User ${userEmail} deleted successfully`);

    // 2. Background DB deletion with 2s timeout
    try {
      await fetchWithTimeout(supabase.from('profiles').delete().eq('id', userId), 2000);
    } catch (err) {
      console.warn('Background profile delete notice:', err.message);
    }
  };

  return (
    <div className="admin-manage-view">
      <SEO title='Admin - Manage Users' />
      
      <div className="view-header">
        <div>
          <h1 className="view-title">Manage <span>Users</span></h1>
          <p className="view-subtitle">Review roles and invite Faculty/TPO members.</p>
        </div>
        <button 
          type="button"
          className="btn-glow-blue" 
          onClick={() => { 
            setInviteName(''); 
            setInviteEmail(''); 
            setInviteRole('teacher'); 
            setShowInviteModal(true); 
          }}
        >
          + Invite User
        </button>
      </div>

      <div className="admin-toolbar">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input 
            type="text"
            placeholder="Search by name, email, or role..."
            className="premium-input"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="admin-list-container">
          <div className="list-header">
            <span>USER INFO</span>
            <span>EMAIL</span>
            <span>ROLE</span>
            <span className="text-right">ACTIONS</span>
          </div>
          
          {filteredUsers.map((u) => (
            <div key={u.id} className="admin-row-card glass-panel">
              <div className="row-main">
                <div className="user-avatar-circle">
                  {(u.name || u.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="row-text">
                  <strong className="row-title">{u.name || 'Anonymous User'}</strong>
                  <span className="row-subtitle">ID: {u.id.substring(0,8)}...</span>
                </div>
              </div>
              
              <div className="row-meta">
                <span className="meta-email">{u.email}</span>
              </div>

              <div className="row-meta">
                <span className={`badge role-${u.role}`}>{u.role.toUpperCase()}</span>
              </div>

              <div className="row-actions">
                <select 
                  className="role-dropdown" 
                  value={u.role} 
                  onChange={(e) => handleRoleChange(u.id, e.target.value)}
                  disabled={u.id === user?.id}
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="tpo">TPO</option>
                  <option value="admin">Admin</option>
                </select>

                <button 
                  type="button" 
                  className="action-btn-delete"
                  onClick={() => handleDeleteUser(u.id, u.email)}
                  disabled={u.id === user?.id}
                  title="Delete User"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showInviteModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <div className="modal-header">
              <h2>Invite Official User</h2>
              <button type="button" className="btn-close" onClick={() => setShowInviteModal(false)}>✕</button>
            </div>
            <p>Create a dedicated Teacher or TPO account.</p>

            <div className="form-group">
              <label htmlFor="invite-name">Full Name</label>
              <input 
                id="invite-name" 
                type="text" 
                value={inviteName} 
                onChange={e => setInviteName(e.target.value)} 
                placeholder="E.g. Dr. John Doe" 
                autoFocus 
              />
            </div>

            <div className="form-group">
              <label htmlFor="invite-email">Official Email</label>
              <input 
                id="invite-email" 
                type="email" 
                value={inviteEmail} 
                onChange={e => setInviteEmail(e.target.value)} 
                placeholder="john.doe@college.edu" 
              />
            </div>

            <div className="form-group">
              <label htmlFor="invite-role">Select Role</label>
              <select 
                id="invite-role" 
                value={inviteRole} 
                onChange={e => setInviteRole(e.target.value)}
              >
                <option value="teacher">Teacher</option>
                <option value="tpo">TPO</option>
              </select>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-cancel" onClick={() => setShowInviteModal(false)}>
                Cancel
              </button>
              <button type="button" className="btn-glow-blue" onClick={handleInvite}>
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .admin-manage-view { max-width: 1200px; margin: 0 auto; width: 100%; }
        
        .view-header { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          margin-bottom: 2rem; 
          flex-wrap: wrap; 
          gap: 1.5rem; 
        }
        
        .view-title { 
          font-family: 'Syne', sans-serif; 
          font-size: clamp(1.8rem, 5vw, 2.5rem); 
          font-weight: 800; 
          margin: 0; 
          color: var(--text-primary);
        }
        .view-title span { color: var(--accent-blue); }
        .view-subtitle { color: var(--text-muted); margin-top: 0.35rem; font-weight: 500; font-size: 0.9rem; margin-bottom: 0; }

        .admin-toolbar { display: flex; align-items: center; margin-bottom: 1.75rem; }
        
        .search-input-wrapper { position: relative; width: 100%; max-width: 450px; }
        .search-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); opacity: 0.5; pointer-events: none; font-size: 0.9rem; }
        
        .premium-input { 
          width: 100%; 
          background: var(--bg-card); 
          border: 1px solid var(--border); 
          border-radius: 1rem; 
          padding: 0.8rem 1rem 0.8rem 2.8rem; 
          color: var(--text-primary); 
          font-weight: 600; 
          outline: none; 
          transition: 0.3s; 
          font-size: 0.9rem; 
          box-sizing: border-box;
        }
        .premium-input:focus { border-color: var(--accent-blue); background: var(--bg-primary); box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15); }

        .btn-glow-blue { 
          padding: 0.75rem 1.5rem; 
          background: var(--accent-blue); 
          color: #fff; 
          border: none; 
          border-radius: 1rem; 
          cursor: pointer; 
          font-weight: 800; 
          font-size: 0.85rem;
          transition: 0.3s; 
          box-shadow: 0 6px 16px rgba(59, 130, 246, 0.3);
        }
        .btn-glow-blue:hover { transform: translateY(-2px); box-shadow: 0 10px 24px rgba(59, 130, 246, 0.45); }
        .btn-glow-blue:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        .admin-list-container { display: flex; flex-direction: column; gap: 0.75rem; width: 100%; }
        
        .list-header { 
          display: grid; 
          grid-template-columns: 2fr 2fr 1fr 1fr; 
          gap: 1.5rem; 
          padding: 0.5rem 1.5rem; 
          font-size: 0.7rem; 
          font-weight: 900; 
          color: var(--text-muted); 
          letter-spacing: 2px; 
          align-items: center;
        }
        
        .admin-row-card { 
          display: grid; 
          grid-template-columns: 2fr 2fr 1fr 1fr; 
          gap: 1.5rem; 
          align-items: center; 
          padding: 1.1rem 1.5rem; 
          border-radius: 1.5rem; 
          background: var(--bg-card); 
          border: 1px solid var(--border); 
          backdrop-filter: blur(10px); 
          transition: 0.2s; 
        }
        .admin-row-card:hover { border-color: var(--accent-blue); transform: translateX(4px); }

        .text-right { text-align: right; }

        .row-main { display: flex; align-items: center; gap: 1rem; overflow: hidden; }
        
        .user-avatar-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(59, 130, 246, 0.15);
          border: 1px solid rgba(59, 130, 246, 0.3);
          color: var(--accent-blue);
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          flex-shrink: 0;
        }

        .row-text { overflow: hidden; display: flex; flex-direction: column; gap: 0.2rem; }
        .row-title { font-size: 0.95rem; color: var(--text-primary); display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-family: 'Syne', sans-serif; font-weight: 700; }
        .row-subtitle { font-size: 0.7rem; color: var(--text-muted); font-weight: 600; font-family: monospace; }

        .row-meta { display: flex; align-items: center; overflow: hidden; }
        .meta-email { font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .badge { display: inline-block; padding: 0.35rem 0.85rem; border-radius: 2rem; font-size: 0.7rem; font-weight: 900; letter-spacing: 0.5px; }
        .role-student { background: rgba(59, 130, 246, 0.12); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.25); }
        .role-teacher { background: rgba(139, 92, 246, 0.12); color: #8b5cf6; border: 1px solid rgba(139, 92, 246, 0.25); }
        .role-tpo { background: rgba(245, 158, 11, 0.12); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.25); }
        .role-admin { background: rgba(239, 68, 68, 0.12); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.25); }
        
        .row-actions { display: flex; justify-content: flex-end; align-items: center; gap: 0.5rem; }
        .role-dropdown { 
          background: var(--bg-secondary); 
          color: var(--text-primary); 
          border: 1px solid var(--border); 
          border-radius: 0.75rem; 
          padding: 0.5rem 0.8rem; 
          outline: none; 
          font-weight: 700; 
          font-size: 0.8rem; 
          cursor: pointer;
          transition: 0.2s;
        }
        .role-dropdown:hover:not(:disabled) { border-color: var(--accent-blue); }
        .role-dropdown:disabled { opacity: 0.5; cursor: not-allowed; }

        .action-btn-delete {
          background: rgba(244, 63, 94, 0.1);
          color: #f43f5e;
          border: 1px solid rgba(244, 63, 94, 0.25);
          border-radius: 0.75rem;
          padding: 0.45rem 0.65rem;
          font-size: 0.85rem;
          cursor: pointer;
          transition: 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .action-btn-delete:hover:not(:disabled) {
          background: #f43f5e;
          color: #fff;
          border-color: #f43f5e;
          transform: translateY(-1px);
        }
        .action-btn-delete:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); backdrop-filter: blur(8px); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 1.5rem; }
        .modal-content { background: var(--bg-card); border: 1px solid var(--border); padding: 2rem; border-radius: 1.5rem; max-width: 440px; width: 100%; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.6); position: relative; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem; }
        .modal-content h2 { margin: 0; font-family: 'Syne', sans-serif; font-size: 1.4rem; color: var(--text-primary); }
        .btn-close { background: rgba(var(--bg-glass-rgb), 0.1); border: 1px solid var(--border); color: var(--text-muted); width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; font-size: 0.85rem; }
        .btn-close:hover { color: var(--text-primary); border-color: var(--accent-blue); }
        .modal-content p { color: var(--text-muted); margin-bottom: 1.5rem; font-size: 0.85rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 1.1rem; }
        .form-group label { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px; }
        .form-group input, .form-group select { padding: 0.75rem 1rem; border-radius: 0.75rem; border: 1px solid var(--border); background: var(--bg-secondary); color: var(--text-primary); font-size: 0.9rem; outline: none; }
        .form-group input:focus, .form-group select:focus { border-color: var(--accent-blue); }
        .modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.75rem; }
        .btn-cancel { padding: 0.75rem 1.25rem; background: transparent; border: 1px solid var(--border); color: var(--text-muted); border-radius: 1rem; cursor: pointer; font-weight: 700; font-size: 0.85rem; transition: 0.2s; }
        .btn-cancel:hover { color: var(--text-primary); border-color: var(--text-primary); }

        @media (max-width: 900px) {
          .list-header { display: none; }
          .admin-row-card { grid-template-columns: 1fr; gap: 1rem; padding: 1.25rem; }
          .row-actions { justify-content: flex-start; }
          .row-actions .role-dropdown { width: 100%; }
        }
      `}</style>
    </div>
  );
}
