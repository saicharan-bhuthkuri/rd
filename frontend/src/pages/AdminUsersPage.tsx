import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { AdminLayout } from '../components/AdminLayout';
import { Trash2, UserPlus } from 'lucide-react';

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

  // Custom styled confirmation modal state
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; userId: number; username: string }>({
    isOpen: false,
    userId: 0,
    username: ''
  });

  // Get active admin user profile from localStorage
  const activeUser = JSON.parse(localStorage.getItem('admin_user') || '{}');
  const activeRole = activeUser.role || '';
  const activeUsername = activeUser.username || '';

  const fetchUsers = async () => {
    setIsLoading(prev => prev ? prev : true);
    const token = localStorage.getItem('admin_token');

    if (!token) {
      navigate('/admin/login');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
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
        throw new Error('Failed to load administrators registry.');
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
    setTimeout(() => {
      fetchUsers();
    }, 0);

    const handleSync = (e: Event) => {
      const eventType = (e as CustomEvent).detail;
      if (eventType === 'REFRESH_ADMINS') {
        fetchUsers();
      }
    };

    window.addEventListener('app-sync', handleSync);
    return () => window.removeEventListener('app-sync', handleSync);
  }, []);

  const handleDeleteUser = async (id: number) => {
    const token = localStorage.getItem('admin_token');

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete user.');
      }

      // Refresh list
      fetchUsers();
      // Notify other tabs
      const syncEvent = new CustomEvent('app-sync', { detail: 'REFRESH_ADMINS' });
      window.dispatchEvent(syncEvent);
      setDeleteConfirm({ isOpen: false, userId: 0, username: '' });
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <AdminLayout>
      <div className="card" style={{ width: '100%' }}>
        <div className="admin-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <h2>Authorized Administrators</h2>
          <button 
            onClick={() => navigate('/admin/users/create')} 
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <UserPlus size={16} /> Create New Admin
          </button>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            Loading administrators list...
          </div>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : (
          <div className="admin-table-container users-table">
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
                            onClick={() => setDeleteConfirm({ isOpen: true, userId: user.id, username: user.username })}
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

      {/* Delete Confirmation Modal */}
      {deleteConfirm.isOpen && (
        <div className="custom-modal-overlay">
          <div className="custom-modal-card">
            <div className="custom-modal-header">
              <div className="custom-modal-icon-container custom-modal-icon-error">
                <Trash2 size={20} />
              </div>
              <h3 className="custom-modal-title">Delete Administrator</h3>
            </div>
            <p className="custom-modal-body">
              Are you sure you want to delete administrator account: <strong>"{deleteConfirm.username}"</strong>? This action cannot be undone.
            </p>
            <div className="custom-modal-footer">
              <button
                onClick={() => setDeleteConfirm({ isOpen: false, userId: 0, username: '' })}
                className="custom-modal-btn-cancel"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const id = deleteConfirm.userId;
                  await handleDeleteUser(id);
                }}
                className="btn btn-primary"
                style={{
                  backgroundColor: '#ef4444',
                  borderColor: '#ef4444',
                  color: '#fff',
                  padding: '0.5rem 1.25rem',
                  fontSize: '0.875rem',
                  borderRadius: '0.375rem',
                  cursor: 'pointer'
                }}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
