import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import { AdminLayout } from '../components/AdminLayout';
import { Plus, Trash2, Layers, AlertCircle, Check } from 'lucide-react';
import { AdminPagination } from '../components/AdminPagination';

interface Branch {
  id: number;
  name: string;
  created_at: string;
}

export const AdminBranchesPage: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [newBranchName, setNewBranchName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Pagination State (Prev / 1 2 3 ... / Next)
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  // Dialog configurations for deletion confirm
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; branchId: number; branchName: string }>({
    isOpen: false,
    branchId: 0,
    branchName: ''
  });

  const fetchBranches = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/branches`);
      if (response.ok) {
        const data = await response.json();
        setBranches(data);
      } else {
        throw new Error('Failed to load branches.');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();

    const handleSync = (e: Event) => {
      const eventType = (e as CustomEvent).detail;
      if (eventType === 'REFRESH_BRANCHES') {
        fetchBranches();
      }
    };

    window.addEventListener('app-sync', handleSync);
    return () => window.removeEventListener('app-sync', handleSync);
  }, []);

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim()) return;

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    const token = localStorage.getItem('admin_token');

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/branches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newBranchName.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create branch.');
      }

      setSuccessMsg(`Branch "${newBranchName.trim()}" added successfully.`);
      setNewBranchName('');
      fetchBranches();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBranch = async () => {
    const { branchId, branchName } = deleteConfirm;
    if (!branchId) return;

    setErrorMsg('');
    setSuccessMsg('');
    const token = localStorage.getItem('admin_token');

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/branches/${branchId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete branch.');
      }

      setSuccessMsg(`Branch "${branchName}" deleted successfully.`);
      setDeleteConfirm({ isOpen: false, branchId: 0, branchName: '' });
      fetchBranches();
    } catch (err: any) {
      setErrorMsg(err.message);
      setDeleteConfirm({ isOpen: false, branchId: 0, branchName: '' });
    }
  };

  return (
    <AdminLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Alerts */}
        {errorMsg && (
          <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '0.75rem 1rem', borderRadius: '0.5rem' }}>
            <Check size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="branches-grid-layout">
          
          {/* Add branch form panel */}
          <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={18} style={{ color: 'var(--primary)' }} />
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>Add Department</h3>
            </div>
            
            <form onSubmit={handleAddBranch} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label htmlFor="branchName" style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  Branch / Department Name
                </label>
                <input
                  type="text"
                  id="branchName"
                  required
                  placeholder="e.g. Chemical Engineering"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  style={{ width: '100%', marginTop: '0.375rem' }}
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={isSubmitting}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <Plus size={16} />
                <span>{isSubmitting ? 'Adding...' : 'Add Department'}</span>
              </button>
            </form>
          </div>

          {/* List of active branches table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>Active Branches & Departments</h3>
              <span className="badge" style={{ margin: 0 }}>{branches.length} Total</span>
            </div>

            <div className="admin-table-container branches-table">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Branch / Department Name</th>
                    <th>Created On</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                        Loading departments database registry...
                      </td>
                    </tr>
                  ) : branches.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                        No branches found in database. Add a branch on the left.
                      </td>
                    </tr>
                  ) : (
                    branches.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((b) => (
                      <tr key={b.id}>
                        <td>
                          <strong>{b.name}</strong>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                            {new Date(b.created_at).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button 
                            onClick={() => setDeleteConfirm({ isOpen: true, branchId: b.id, branchName: b.name })} 
                            className="btn-action reject" 
                            title="Delete Department"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Pagination Controls */}
              <AdminPagination
                currentPage={currentPage}
                totalPages={Math.ceil(branches.length / PAGE_SIZE)}
                totalRecords={branches.length}
                pageSize={PAGE_SIZE}
                onPageChange={(p) => setCurrentPage(p)}
                itemName="branches"
              />
            </div>
          </div>

        </div>

      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.3)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1100,
          padding: '1.5rem'
        }}>
          <div className="card" style={{
            width: '100%',
            maxWidth: '400px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            padding: '1.5rem',
            borderRadius: '0.75rem',
            border: '1px solid var(--border)',
            background: '#fff',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#fee2e2',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Trash2 size={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-main)' }}>
                Delete Department?
              </h3>
            </div>

            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, textAlign: 'left' }}>
              Are you sure you want to delete <strong>{deleteConfirm.branchName}</strong>? This action cannot be undone.
            </p>

            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.5rem',
              marginTop: '0.5rem'
            }}>
              <button
                onClick={() => setDeleteConfirm({ isOpen: false, branchId: 0, branchName: '' })}
                className="btn"
                style={{
                  padding: '0.5rem 1.25rem',
                  fontSize: '0.875rem',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  background: 'rgba(0,0,0,0.05)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-main)'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteBranch}
                className="btn"
                style={{
                  padding: '0.5rem 1.25rem',
                  fontSize: '0.875rem',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  backgroundColor: '#ef4444',
                  color: '#fff',
                  border: 'none'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
