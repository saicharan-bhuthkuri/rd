import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { AdminLayout } from '../components/AdminLayout';
import { Users, UserPlus, Edit2, KeyRound, Trash2, CheckCircle, XCircle, AlertCircle, Loader2, X } from 'lucide-react';
import { AdminPagination } from '../components/AdminPagination';

interface RegDeskUser {
  id: number;
  desk_id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export const AdminRegDeskPage: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<RegDeskUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;

  // Add Member Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newDeskId, setNewDeskId] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newStatus, setNewStatus] = useState<'active' | 'inactive'>('active');
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  // Edit Member Modal State
  const [editingUser, setEditingUser] = useState<RegDeskUser | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editStatus, setEditStatus] = useState<'active' | 'inactive'>('active');
  const [editPassword, setEditPassword] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Reset Password Modal State
  const [resettingUser, setResettingUser] = useState<RegDeskUser | null>(null);
  const [resetPasswordVal, setResetPasswordVal] = useState('');
  const [isSubmittingReset, setIsSubmittingReset] = useState(false);

  // Delete Confirm Modal State
  const [deletingUser, setDeletingUser] = useState<RegDeskUser | null>(null);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/reg-desk-users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          navigate('/admin/login');
          return;
        }
        throw new Error('Failed to load Registration Desk team.');
      }

      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();

    const handleSync = (e: Event) => {
      const eventType = (e as CustomEvent).detail;
      if (eventType === 'REFRESH_REG_DESK_USERS') {
        fetchUsers();
      }
    };
    window.addEventListener('app-sync', handleSync);
    return () => window.removeEventListener('app-sync', handleSync);
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  // Add Desk Member Handler
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingAdd(true);
    setError('');

    const token = localStorage.getItem('admin_token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/reg-desk-users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          desk_id: newDeskId.trim(),
          name: newName.trim(),
          email: newEmail.trim(),
          password: newPassword,
          status: newStatus
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add Registration Desk member.');
      }

      showToast(`Member ${newDeskId} created successfully.`);
      setIsAddModalOpen(false);
      setNewDeskId('');
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  // Edit Desk Member Handler
  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSubmittingEdit(true);
    setError('');

    const token = localStorage.getItem('admin_token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/reg-desk-users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editName.trim(),
          email: editEmail.trim(),
          status: editStatus,
          password: editPassword ? editPassword : undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update member.');
      }

      showToast(`Member ${editingUser.desk_id} updated.`);
      setEditingUser(null);
      setEditPassword('');
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Reset Password Handler
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser) return;
    setIsSubmittingReset(true);
    setError('');

    const token = localStorage.getItem('admin_token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/reg-desk-users/${resettingUser.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newPassword: resetPasswordVal })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password.');
      }

      showToast(`Password updated for ${resettingUser.desk_id}.`);
      setResettingUser(null);
      setResetPasswordVal('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmittingReset(false);
    }
  };

  // Delete Member Handler
  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    setIsSubmittingDelete(true);
    setError('');

    const token = localStorage.getItem('admin_token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/reg-desk-users/${deletingUser.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to remove member.');
      }

      showToast(`Member ${deletingUser.desk_id} deleted.`);
      setDeletingUser(null);
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmittingDelete(false);
    }
  };

  // Paginated records
  const totalPages = Math.ceil(users.length / PAGE_SIZE);
  const paginatedUsers = users.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const activeCount = users.filter(u => u.status === 'active').length;
  const inactiveCount = users.length - activeCount;

  return (
    <AdminLayout>
      <div className="admin-content-inner" style={{ padding: '2rem 2.5rem' }}>
        
        {/* Toast Notification */}
        {toast && (
          <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', backgroundColor: '#065f46', color: '#ffffff', padding: '0.75rem 1.25rem', borderRadius: '0.5rem', zIndex: 100, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
            <CheckCircle size={18} /> {toast}
          </div>
        )}

        {/* Page Header */}
        <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>Registration Desk Team</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', fontSize: '0.875rem' }}>
              Manage Registration Desk personnel, access credentials, and team assignments.
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem', fontWeight: 600 }}
          >
            <UserPlus size={18} />
            <span>Add Desk Member</span>
          </button>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total Members</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>{users.length}</div>
          </div>
          <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #10b981' }}>
            <div style={{ fontSize: '0.8rem', color: '#10b981', textTransform: 'uppercase', fontWeight: 700 }}>Active Members</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981', marginTop: '0.25rem' }}>{activeCount}</div>
          </div>
          <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #94a3b8' }}>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Inactive Members</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#94a3b8', marginTop: '0.25rem' }}>{inactiveCount}</div>
          </div>
        </div>

        {/* Data Table */}
        <div className="admin-table-container">
          {isLoading ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Loader2 className="spinner-icon" size={32} style={{ margin: '0 auto 1rem auto', color: 'var(--primary)' }} />
              <p>Loading Registration Desk staff registry...</p>
            </div>
          ) : users.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Users size={40} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
              <h3>No Registration Desk Members Registered</h3>
              <p>Click "Add Desk Member" to create credentials for registration staff.</p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Desk ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <strong style={{ color: 'var(--primary)', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                        {u.desk_id}
                      </strong>
                    </td>
                    <td>
                      <strong>{u.name}</strong>
                    </td>
                    <td>
                      <span style={{ color: 'var(--text-secondary)' }}>{u.email}</span>
                    </td>
                    <td>
                      {u.status === 'active' ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          backgroundColor: 'rgba(16, 185, 129, 0.1)',
                          color: '#059669',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontWeight: 700,
                          fontSize: '0.75rem'
                        }}>
                          <CheckCircle size={12} /> ACTIVE
                        </span>
                      ) : (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          backgroundColor: 'rgba(148, 163, 184, 0.1)',
                          color: '#64748b',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontWeight: 700,
                          fontSize: '0.75rem'
                        }}>
                          <XCircle size={12} /> INACTIVE
                        </span>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {new Date(u.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        {/* Edit Button */}
                        <button
                          onClick={() => {
                            setEditingUser(u);
                            setEditName(u.name);
                            setEditEmail(u.email);
                            setEditStatus(u.status);
                            setEditPassword('');
                          }}
                          className="btn-action edit"
                          title="Edit Details"
                          style={{ padding: '0.35rem 0.6rem' }}
                        >
                          <Edit2 size={14} />
                        </button>

                        {/* Reset Password Button */}
                        <button
                          onClick={() => {
                            setResettingUser(u);
                            setResetPasswordVal('');
                          }}
                          className="btn-action"
                          title="Reset Password"
                          style={{ padding: '0.35rem 0.6rem', color: '#0284c7', borderColor: '#bae6fd', backgroundColor: '#f0f9ff' }}
                        >
                          <KeyRound size={14} />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => setDeletingUser(u)}
                          className="btn-action reject"
                          title="Delete Member"
                          style={{ padding: '0.35rem 0.6rem' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <AdminPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalRecords={users.length}
            pageSize={PAGE_SIZE}
            onPageChange={(page) => setCurrentPage(page)}
            itemName="desk members"
          />
        </div>

        {/* Add Member Modal */}
        {isAddModalOpen && (
          <div className="custom-modal-backdrop" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
            <div className="custom-modal card" style={{ maxWidth: '480px', width: '100%', padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Add Registration Desk Member</h3>
                <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddUser}>
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label>Registration Desk ID</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="e.g. REG-DESK-01 or DESK-TEAM-A"
                    value={newDeskId}
                    onChange={(e) => setNewDeskId(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label>Member / Team Name</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="e.g. Desk Team Alpha"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label>Registered Email</label>
                  <input
                    type="email"
                    required
                    className="form-control"
                    placeholder="coordinator@tcek.ac.in"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label>Password / Temporary Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    className="form-control"
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label>Initial Status</label>
                  <select
                    className="form-control"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as 'active' | 'inactive')}
                  >
                    <option value="active">Active (Access Allowed)</option>
                    <option value="inactive">Inactive (Suspended)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmittingAdd} className="btn btn-primary">
                    {isSubmittingAdd ? 'Creating...' : 'Create Desk Member'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Member Modal */}
        {editingUser && (
          <div className="custom-modal-backdrop" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
            <div className="custom-modal card" style={{ maxWidth: '480px', width: '100%', padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Edit Member: {editingUser.desk_id}</h3>
                <button onClick={() => setEditingUser(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleEditUser}>
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label>Member / Team Name</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label>Registered Email</label>
                  <input
                    type="email"
                    required
                    className="form-control"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label>Status</label>
                  <select
                    className="form-control"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as 'active' | 'inactive')}
                  >
                    <option value="active">Active (Access Allowed)</option>
                    <option value="inactive">Inactive (Suspended)</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label>New Password (leave empty to keep current)</label>
                  <input
                    type="password"
                    minLength={6}
                    className="form-control"
                    placeholder="••••••••"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button type="button" onClick={() => setEditingUser(null)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmittingEdit} className="btn btn-primary">
                    {isSubmittingEdit ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Reset Password Modal */}
        {resettingUser && (
          <div className="custom-modal-backdrop" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
            <div className="custom-modal card" style={{ maxWidth: '440px', width: '100%', padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Reset Password: {resettingUser.desk_id}</h3>
                <button onClick={() => setResettingUser(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleResetPassword}>
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label>Enter New Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    className="form-control"
                    placeholder="At least 6 characters"
                    value={resetPasswordVal}
                    onChange={(e) => setResetPasswordVal(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button type="button" onClick={() => setResettingUser(null)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmittingReset} className="btn btn-primary">
                    {isSubmittingReset ? 'Updating...' : 'Set Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirm Modal */}
        {deletingUser && (
          <div className="custom-modal-backdrop" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
            <div className="custom-modal card" style={{ maxWidth: '420px', width: '100%', padding: '2rem' }}>
              <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1.25rem', color: '#dc2626' }}>Remove Registration Desk Member</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                Are you sure you want to remove <strong>{deletingUser.desk_id}</strong> ({deletingUser.name})? They will no longer be able to log in to mark attendance.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setDeletingUser(null)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="button" disabled={isSubmittingDelete} onClick={handleDeleteUser} className="btn btn-danger">
                  {isSubmittingDelete ? 'Deleting...' : 'Delete Member'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
};
