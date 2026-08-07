import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../components/AdminLayout';
import { UserPlus, Loader2, ArrowLeft } from 'lucide-react';

export const AdminCreateUserPage: React.FC = () => {
  const navigate = useNavigate();
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'superadmin' | 'admin'>('admin');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');

  // Get active admin user profile from localStorage
  const activeUser = JSON.parse(localStorage.getItem('admin_user') || '{}');
  const activeRole = activeUser.role || '';

  useEffect(() => {
    // Permission guard: Only Developer and Super Admin can manage/create accounts
    if (activeRole !== 'developer' && activeRole !== 'superadmin') {
      navigate('/admin/dashboard');
    }
  }, [activeRole]);

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
    } catch (err: any) {
      setCreateError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <AdminLayout>
      <div className="card" style={{ maxWidth: '580px', margin: '0 auto' }}>
        <div className="admin-card-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <UserPlus size={20} /> Create New Admin
          </h2>
          <button
            onClick={() => navigate('/admin/users')}
            className="btn"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              background: 'rgba(255, 255, 255, 0.05)', 
              color: 'var(--text-color, #fff)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              cursor: 'pointer',
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              fontSize: '0.875rem'
            }}
          >
            <ArrowLeft size={16} /> Back to Users
          </button>
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

          <button type="submit" disabled={isCreating} className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            {isCreating ? (
              <>
                <Loader2 className="spinner-icon" size={16} /> Creating...
              </>
            ) : (
              'Create Admin'
            )}
          </button>
        </form>
      </div>
    </AdminLayout>
  );
};
