import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../components/AdminLayout';
import { Trash2, UserPlus, Loader2 } from 'lucide-react';

interface AdminUser {
  id: number;
  username: string;
  role: 'developer' | 'superadmin' | 'admin';
  created_at: string;
}

export const AdminUsersPage: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Form states
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'superadmin' | 'admin'>('admin');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');

  // Get active admin user profile from localStorage
  const activeUser = JSON.parse(localStorage.getItem('admin_user') || '{}');
  const activeRole = activeUser.role || '';
  const activeUsername = activeUser.username || '';

  const fetchUsers = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('admin_token');

    if (!token) {
      navigate('/admin/login');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('admin_token');
          navigate('/admin/login');
          return;
        }
        throw new Error('Failed to load administrator accounts registry.');
      }

      const data = await response.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Permission guard
    if (activeRole !== 'developer' && activeRole !== 'superadmin') {
      navigate('/admin/dashboard');
      return;
    }
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreateSuccess('');
    setIsCreating(true);

    const token = localStorage.getItem('admin_token');

    try {
      const response = await fetch('http://localhost:5000/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
          role: newRole
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user.');
      }

      setCreateSuccess(`Account for "${newUsername}" created successfully.`);
      setNewUsername('');
      setNewPassword('');
      setNewRole('admin');
      
      // Refresh list
      fetchUsers();
    } catch (err: any) {
      setCreateError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteUser = async (id: number, username: string) => {
    // Double check confirmation
    const confirmDelete = window.confirm(`Are you sure you want to delete administrator account: "${username}"?`);
    if (!confirmDelete) return;

    const token = localStorage.getItem('admin_token');

    try {
      const response = await fetch(`http://localhost:5000/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete user.');
      }

      alert(`Admin account "${username}" deleted successfully.`);
      
      // Refresh list
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <AdminLayout>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }} className="admin-users-split">
        {/* Left Card: Create Account */}
        <div className="card" style={{ maxWidth: '480px' }}>
          <div className="admin-card-header">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserPlus size={20} /> Create New Admin
            </h2>
          </div>

          {createError && <div className="alert alert-danger">{createError}</div>}
          {createSuccess && <div className="alert alert-success">{createSuccess}</div>}

          <form onSubmit={handleCreateUser}>
            <div className="form-group">
              <label htmlFor="admin-username">Username</label>
              <input
                type="text"
                id="admin-username"
                required
                className="form-control"
                placeholder="e.g. akhya"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="admin-password">Password</label>
              <input
                type="password"
                id="admin-password"
                required
                className="form-control"
                placeholder="e.g. password@123"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="admin-role">User Role</label>
              <select
                id="admin-role"
                required
                className="form-control"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as any)}
              >
                <option value="admin">Admin (Can approve/reject applications)</option>
                {activeRole === 'developer' && (
                  <option value="superadmin">Super Admin (Can manage Admin accounts)</option>
                )}
              </select>
            </div>

            <button type="submit" disabled={isCreating} className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              {isCreating ? (
                <>
                  <Loader2 className="spinner-icon" size={16} /> Creating...
                </>
              ) : (
                'Scaffold Account'
              )}
            </button>
          </form>
        </div>

        {/* Right Card: Administrators List */}
        <div className="card">
          <div className="admin-card-header">
            <h2>Authorized Administrators</h2>
          </div>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              Loading administrators list...
            </div>
          ) : error ? (
            <div className="alert alert-danger">{error}</div>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Role Privilege</th>
                    <th>Created At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => {
                    const isSelf = user.username === activeUsername;
                    const isDev = user.role === 'developer';
                    const isSuper = user.role === 'superadmin';
                    
                    // Delete permission checks
                    let canDelete = false;
                    if (activeRole === 'developer') {
                      canDelete = !isSelf && !isDev; // Developer can delete superadmin and admin
                    } else if (activeRole === 'superadmin') {
                      canDelete = !isSelf && !isDev && !isSuper; // Superadmin can only delete standard admins
                    }

                    return (
                      <tr key={user.id}>
                        <td>
                          <strong>{user.username}</strong> {isSelf && <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>(You)</span>}
                        </td>
                        <td>
                          <span className={`role-badge role-${user.role}`}>{user.role}</span>
                        </td>
                        <td>
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td>
                          {canDelete ? (
                            <button
                              onClick={() => handleDeleteUser(user.id, user.username)}
                              className="btn-action reject"
                              title="Delete Account"
                            >
                              <Trash2 size={14} />
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Restricted
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};
