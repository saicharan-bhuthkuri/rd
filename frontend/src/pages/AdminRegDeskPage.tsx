import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { AdminLayout } from '../components/AdminLayout';
import { 
  Users, UserPlus, Edit2, KeyRound, Trash2, CheckCircle, XCircle, 
  AlertCircle, Loader2, X, RefreshCw, Eye, EyeOff, Copy, Check, Trophy, Clock
} from 'lucide-react';
import { AdminPagination } from '../components/AdminPagination';

interface RegDeskUser {
  id: number;
  desk_id: string;
  name: string;
  email: string;
  hackathon?: string;
  temp_password?: string;
  temp_password_expires_at?: string;
  is_temporary_password?: number;
  status: 'active' | 'inactive';
  created_at: string;
}

export const AdminRegDeskPage: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<RegDeskUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  // Hackathons list for dropdown
  const [hackathonsList, setHackathonsList] = useState<string[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;

  // Add Member Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newDeskId, setNewDeskId] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showAddPassword, setShowAddPassword] = useState(true);
  const [newHackathon, setNewHackathon] = useState('');
  const [newStatus, setNewStatus] = useState<'active' | 'inactive'>('active');
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Visible table passwords map (for eye toggle in table)
  const [revealedPasswords, setRevealedPasswords] = useState<{ [id: number]: boolean }>({});

  // Edit Member Modal State
  const [editingUser, setEditingUser] = useState<RegDeskUser | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editHackathon, setEditHackathon] = useState('');
  const [editStatus, setEditStatus] = useState<'active' | 'inactive'>('active');
  const [editPassword, setEditPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Reset Password Modal State
  const [resettingUser, setResettingUser] = useState<RegDeskUser | null>(null);
  const [resetPasswordVal, setResetPasswordVal] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(true);
  const [isSubmittingReset, setIsSubmittingReset] = useState(false);

  // Delete Confirm Modal State
  const [deletingUser, setDeletingUser] = useState<RegDeskUser | null>(null);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

  // Generator: Unique Desk ID (e.g. TCEK-REG-DESK-A1G33N)
  const generateDeskId = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `TCEK-REG-DESK-${code}`;
  };

  // Generator: 6-char alphanumeric temporary password (e.g. k9X2m7)
  const generateTempPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghjkmnpqrstuvwxyz';
    let pwd = '';
    for (let i = 0; i < 6; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pwd;
  };

  const copyToClipboard = (text: string, identifier: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(identifier);
    setTimeout(() => setCopiedField(null), 2000);
    showToast('Copied to clipboard!');
  };

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

  const fetchHackathons = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/events`);
      if (res.ok) {
        const evts = await res.json();
        const hacks = evts
          .filter((e: any) => e.category === 'Hackathon' && e.title)
          .map((e: any) => e.title as string);
        const uniqueHacks = Array.from(new Set(hacks)) as string[];
        if (!uniqueHacks.includes('Smart India Hackathon 2026')) {
          uniqueHacks.unshift('Smart India Hackathon 2026');
        }
        setHackathonsList(uniqueHacks);
        if (uniqueHacks.length > 0 && !newHackathon) {
          setNewHackathon(uniqueHacks[0]);
        }
      }
    } catch (e) {
      setHackathonsList(['Smart India Hackathon 2026']);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchHackathons();

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

  const handleOpenAddModal = () => {
    setNewDeskId(generateDeskId());
    setNewPassword(generateTempPassword());
    setShowAddPassword(true);
    setNewName('');
    setNewEmail('');
    setNewHackathon(hackathonsList[0] || 'Smart India Hackathon 2026');
    setNewStatus('active');
    setIsAddModalOpen(true);
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
          password: newPassword.trim(),
          hackathon: newHackathon.trim(),
          status: newStatus
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add Registration Desk member.');
      }

      showToast(`Member ${data.desk_id || newDeskId} created with temporary password (valid for 1 week).`);
      setIsAddModalOpen(false);
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
          hackathon: editHackathon.trim(),
          status: editStatus,
          password: editPassword.trim() ? editPassword.trim() : undefined
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
        body: JSON.stringify({ newPassword: resetPasswordVal.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password.');
      }

      showToast(`Temporary password generated for ${resettingUser.desk_id} (valid for 1 week).`);
      setResettingUser(null);
      setResetPasswordVal('');
      fetchUsers();
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

  // Helper for 1-week expiry status calculation
  const getExpiryStatus = (u: RegDeskUser) => {
    if (!u.is_temporary_password || !u.temp_password_expires_at) {
      return { label: 'Permanent', isExpired: false, isTemp: false };
    }
    const expiresAt = new Date(u.temp_password_expires_at).getTime();
    const now = Date.now();
    const diffMs = expiresAt - now;
    if (diffMs <= 0) {
      return { label: 'Expired (Must Reset)', isExpired: true, isTemp: true };
    }
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return { label: `Valid (${diffDays}d left)`, isExpired: false, isTemp: true, days: diffDays };
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
              Manage Registration Desk personnel, access credentials, and hackathon team assignments.
            </p>
          </div>

          <button
            onClick={handleOpenAddModal}
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
                  <th>Registration Desk ID</th>
                  <th>Team Name</th>
                  <th>Registered Email</th>
                  <th>Hackathon</th>
                  <th>Temporary Password</th>
                  <th>Status & Validity</th>
                  <th>Created Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((u) => {
                  const expiryInfo = getExpiryStatus(u);
                  const isRevealed = !!revealedPasswords[u.id];

                  return (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <strong style={{ color: 'var(--primary)', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                            {u.desk_id}
                          </strong>
                          <button
                            onClick={() => copyToClipboard(u.desk_id, `desk_${u.id}`)}
                            title="Copy Desk ID"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}
                          >
                            {copiedField === `desk_${u.id}` ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                          </button>
                        </div>
                      </td>
                      <td>
                        <strong>{u.name}</strong>
                      </td>
                      <td>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{u.email}</span>
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          <Trophy size={13} color="#f59e0b" /> {u.hackathon || 'Smart India Hackathon 2026'}
                        </span>
                      </td>
                      <td>
                        {u.temp_password ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(2, 132, 199, 0.08)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(2, 132, 199, 0.2)' }}>
                            <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.85rem', color: '#0284c7' }}>
                              {isRevealed ? u.temp_password : '••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => setRevealedPasswords(prev => ({ ...prev, [u.id]: !prev[u.id] }))}
                              title={isRevealed ? 'Hide Password' : 'Show Password'}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px', display: 'flex' }}
                            >
                              {isRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                            </button>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(u.temp_password || '', `pwd_${u.id}`)}
                              title="Copy Password"
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px', display: 'flex' }}
                            >
                              {copiedField === `pwd_${u.id}` ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 600 }}>
                            Permanent (Reset by User)
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          {u.status === 'active' ? (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              backgroundColor: 'rgba(16, 185, 129, 0.1)',
                              color: '#059669',
                              padding: '0.15rem 0.45rem',
                              borderRadius: '4px',
                              fontWeight: 700,
                              fontSize: '0.72rem',
                              width: 'fit-content'
                            }}>
                              <CheckCircle size={11} /> ACTIVE
                            </span>
                          ) : (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              backgroundColor: 'rgba(148, 163, 184, 0.1)',
                              color: '#64748b',
                              padding: '0.15rem 0.45rem',
                              borderRadius: '4px',
                              fontWeight: 700,
                              fontSize: '0.72rem',
                              width: 'fit-content'
                            }}>
                              <XCircle size={11} /> INACTIVE
                            </span>
                          )}

                          {expiryInfo.isTemp && (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              color: expiryInfo.isExpired ? '#ef4444' : '#0284c7'
                            }}>
                              <Clock size={11} /> {expiryInfo.label}
                            </span>
                          )}
                        </div>
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
                              setEditHackathon(u.hackathon || hackathonsList[0] || 'Smart India Hackathon 2026');
                              setEditStatus(u.status);
                              setEditPassword('');
                              setShowEditPassword(false);
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
                              setResetPasswordVal(generateTempPassword());
                              setShowResetPassword(true);
                            }}
                            className="btn-action"
                            title="Reset Temporary Password"
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
                  );
                })}
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
            <div className="custom-modal card" style={{ maxWidth: '520px', width: '100%', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Add Registration Desk Member</h3>
                <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddUser}>
                {/* Registration Desk ID (Auto-generated) */}
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label style={{ margin: 0, fontWeight: 600 }}>Registration Desk ID</label>
                    <button
                      type="button"
                      onClick={() => setNewDeskId(generateDeskId())}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary, #10b981)',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontWeight: 600
                      }}
                      title="Generate new unique Desk ID"
                    >
                      <RefreshCw size={12} /> Auto-Generate
                    </button>
                  </div>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type="text"
                      required
                      className="form-control"
                      placeholder="e.g. TCEK-REG-DESK-A1G33N"
                      value={newDeskId}
                      onChange={(e) => setNewDeskId(e.target.value.toUpperCase())}
                      style={{ fontFamily: 'monospace', fontWeight: 700, paddingRight: '2.5rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(newDeskId, 'modal_desk_id')}
                      title="Copy Desk ID"
                      style={{ position: 'absolute', right: '0.75rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                    >
                      {copiedField === 'modal_desk_id' ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                    </button>
                  </div>
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block', marginTop: '0.25rem' }}>
                    Unique identifier (e.g. TCEK-REG-DESK-A1G33N) used by the team to log in.
                  </small>
                </div>

                {/* Team Name */}
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label style={{ fontWeight: 600 }}>Member / Team Name</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="e.g. Desk Team Alpha"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>

                {/* Registered Email */}
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label style={{ fontWeight: 600 }}>Registered Email</label>
                  <input
                    type="email"
                    required
                    className="form-control"
                    placeholder="coordinator@tcek.ac.in"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.78rem', display: 'block', marginTop: '0.25rem' }}>
                    Used for login recovery and OTP-based password reset.
                  </small>
                </div>

                {/* Password / Generate Temporary Password */}
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label style={{ margin: 0, fontWeight: 600 }}>Password / Temporary Password</label>
                    <button
                      type="button"
                      onClick={() => setNewPassword(generateTempPassword())}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary, #10b981)',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontWeight: 600
                      }}
                      title="Generate 6-character temporary password"
                    >
                      <RefreshCw size={12} /> Generate Temporary Password
                    </button>
                  </div>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type={showAddPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      className="form-control"
                      placeholder="6-char alphanumeric password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      style={{ fontFamily: showAddPassword ? 'monospace' : undefined, fontWeight: 600, paddingRight: '4.5rem' }}
                    />
                    <div style={{ position: 'absolute', right: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(newPassword, 'modal_pwd')}
                        title="Copy Password"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                      >
                        {copiedField === 'modal_pwd' ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddPassword(!showAddPassword)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                      >
                        {showAddPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div style={{
                    marginTop: '0.35rem',
                    padding: '0.4rem 0.65rem',
                    backgroundColor: 'rgba(2, 132, 199, 0.08)',
                    borderRadius: '4px',
                    border: '1px solid rgba(2, 132, 199, 0.2)',
                    fontSize: '0.75rem',
                    color: '#0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}>
                    <Clock size={13} />
                    <span>6-char unique password. <strong>Valid for 1 week</strong> &mdash; user must reset password after expiration.</span>
                  </div>
                </div>

                {/* Hackathon */}
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label style={{ fontWeight: 600 }}>Hackathon</label>
                  <select
                    className="form-control"
                    value={newHackathon}
                    onChange={(e) => setNewHackathon(e.target.value)}
                  >
                    {hackathonsList.map((h, i) => (
                      <option key={i} value={h}>{h}</option>
                    ))}
                    <option value="Smart India Hackathon 2026">Smart India Hackathon 2026</option>
                    <option value="General / All Hackathons">General / All Hackathons</option>
                  </select>
                </div>

                {/* Initial Status */}
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label style={{ fontWeight: 600 }}>Initial Status</label>
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
            <div className="custom-modal card" style={{ maxWidth: '500px', width: '100%', padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Edit Member: {editingUser.desk_id}</h3>
                <button onClick={() => setEditingUser(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleEditUser}>
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label style={{ fontWeight: 600 }}>Member / Team Name</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label style={{ fontWeight: 600 }}>Registered Email</label>
                  <input
                    type="email"
                    required
                    className="form-control"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                  />
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.78rem', display: 'block', marginTop: '0.25rem' }}>
                    Used for login recovery and OTP-based password reset.
                  </small>
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label style={{ fontWeight: 600 }}>Hackathon</label>
                  <select
                    className="form-control"
                    value={editHackathon}
                    onChange={(e) => setEditHackathon(e.target.value)}
                  >
                    {hackathonsList.map((h, i) => (
                      <option key={i} value={h}>{h}</option>
                    ))}
                    <option value="Smart India Hackathon 2026">Smart India Hackathon 2026</option>
                    <option value="General / All Hackathons">General / All Hackathons</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label style={{ fontWeight: 600 }}>Status</label>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label style={{ margin: 0, fontWeight: 600 }}>New Password (Optional)</label>
                    <button
                      type="button"
                      onClick={() => {
                        setEditPassword(generateTempPassword());
                        setShowEditPassword(true);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary, #10b981)',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontWeight: 600
                      }}
                    >
                      <RefreshCw size={12} /> Generate 6-char Temporary
                    </button>
                  </div>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type={showEditPassword ? 'text' : 'password'}
                      minLength={6}
                      className="form-control"
                      placeholder="Leave empty to keep current password"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      style={{ fontFamily: showEditPassword && editPassword ? 'monospace' : undefined, paddingRight: '2.5rem' }}
                    />
                    {editPassword && (
                      <button
                        type="button"
                        onClick={() => setShowEditPassword(!showEditPassword)}
                        style={{ position: 'absolute', right: '0.75rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                      >
                        {showEditPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    )}
                  </div>
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
            <div className="custom-modal card" style={{ maxWidth: '460px', width: '100%', padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Reset Password: {resettingUser.desk_id}</h3>
                <button onClick={() => setResettingUser(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleResetPassword}>
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label style={{ margin: 0, fontWeight: 600 }}>Temporary Password</label>
                    <button
                      type="button"
                      onClick={() => setResetPasswordVal(generateTempPassword())}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary, #10b981)',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontWeight: 600
                      }}
                    >
                      <RefreshCw size={12} /> Generate 6-Char
                    </button>
                  </div>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type={showResetPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      className="form-control"
                      placeholder="At least 6 characters"
                      value={resetPasswordVal}
                      onChange={(e) => setResetPasswordVal(e.target.value)}
                      style={{ fontFamily: showResetPassword ? 'monospace' : undefined, fontWeight: 700, paddingRight: '4.5rem' }}
                    />
                    <div style={{ position: 'absolute', right: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(resetPasswordVal, 'reset_pwd_copy')}
                        title="Copy Password"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                      >
                        {copiedField === 'reset_pwd_copy' ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowResetPassword(!showResetPassword)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                      >
                        {showResetPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div style={{
                    marginTop: '0.35rem',
                    padding: '0.4rem 0.65rem',
                    backgroundColor: 'rgba(2, 132, 199, 0.08)',
                    borderRadius: '4px',
                    border: '1px solid rgba(2, 132, 199, 0.2)',
                    fontSize: '0.75rem',
                    color: '#0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}>
                    <Clock size={13} />
                    <span>Valid for 1 week. Team member must reset password via OTP after expiration.</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button type="button" onClick={() => setResettingUser(null)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmittingReset} className="btn btn-primary">
                    {isSubmittingReset ? 'Updating...' : 'Set Temporary Password'}
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
