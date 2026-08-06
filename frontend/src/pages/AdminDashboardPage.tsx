import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AdminLayout } from '../components/AdminLayout';
import { Download, Check, X, Layers, Calendar } from 'lucide-react';

interface ClubApplication {
  id: number;
  full_name: string;
  pin_number: string;
  email: string;
  mobile: string;
  branch: string;
  year_of_study: string;
  section?: string;
  interests: string;
  skills: string;
  reason_to_join: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

interface EventRegistration {
  id: number;
  full_name: string;
  pin_number: string;
  email: string;
  mobile: string;
  branch: string;
  year_of_study: string;
  section?: string;
  event_name: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = location.pathname.includes('/events') ? 'event' : 'club';
  const [clubApps, setClubApps] = useState<ClubApplication[]>([]);
  const [eventRegs, setEventRegs] = useState<EventRegistration[]>([]);
  
  // Filtering & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [eventFilter, setEventFilter] = useState('all');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch all applications
  const fetchApplications = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('admin_token');

    if (!token) {
      navigate('/admin/login');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/admin/applications', {
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
        throw new Error('Failed to retrieve student records.');
      }

      const data = await response.json();
      setClubApps(data.clubApplications || []);
      setEventRegs(data.eventRegistrations || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  // Update status action
  const handleUpdateStatus = async (type: 'club' | 'event', id: number, status: 'approved' | 'rejected') => {
    const token = localStorage.getItem('admin_token');
    try {
      const response = await fetch('http://localhost:5000/api/admin/applications/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type, id, status }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update application status.');
      }

      // Re-fetch to update states
      fetchApplications();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Get distinct branches for filter dropdown
  const getBranches = () => {
    const branches = new Set<string>();
    clubApps.forEach(app => branches.add(app.branch.toUpperCase()));
    eventRegs.forEach(reg => branches.add(reg.branch.toUpperCase()));
    return Array.from(branches);
  };

  // Get distinct events for filter dropdown
  const getEvents = () => {
    const events = new Set<string>();
    eventRegs.forEach(reg => events.add(reg.event_name));
    return Array.from(events);
  };

  // Apply filters
  const filteredClubApps = clubApps.filter(app => {
    const matchesSearch = app.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          app.pin_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          app.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    const matchesBranch = branchFilter === 'all' || app.branch.toUpperCase() === branchFilter.toUpperCase();
    return matchesSearch && matchesStatus && matchesBranch;
  });

  const filteredEventRegs = eventRegs.filter(reg => {
    const matchesSearch = reg.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          reg.pin_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          reg.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || reg.status === statusFilter;
    const matchesBranch = branchFilter === 'all' || reg.branch.toUpperCase() === branchFilter.toUpperCase();
    const matchesEvent = eventFilter === 'all' || reg.event_name === eventFilter;
    return matchesSearch && matchesStatus && matchesBranch && matchesEvent;
  });

  // Calculate quick metrics
  const getStats = () => {
    const all = [...clubApps, ...eventRegs];
    return {
      total: all.length,
      pending: all.filter(a => a.status === 'pending').length,
      approved: all.filter(a => a.status === 'approved').length,
      rejected: all.filter(a => a.status === 'rejected').length
    };
  };

  const stats = getStats();

  // CSV Export Utility
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: string[][] = [];
    let filename = '';

    if (activeTab === 'club') {
      filename = 'RD_Club_Membership_Applications.csv';
      headers = ['ID', 'Full Name', 'PIN Number', 'Email', 'Mobile', 'Branch', 'Year of Study', 'Section', 'Areas of Interest', 'Skills', 'Reason to Join', 'Status', 'Applied At'];
      rows = filteredClubApps.map(app => [
        app.id.toString(),
        app.full_name,
        app.pin_number,
        app.email,
        app.mobile,
        app.branch,
        app.year_of_study,
        app.section || 'N/A',
        app.interests,
        app.skills,
        app.reason_to_join.replace(/\n/g, ' '),
        app.status,
        new Date(app.created_at).toLocaleString()
      ]);
    } else {
      filename = 'RD_Club_Event_Registrations.csv';
      headers = ['ID', 'Full Name', 'PIN Number', 'Email', 'Mobile', 'Branch', 'Year of Study', 'Section', 'Event Name', 'Notes', 'Status', 'Registered At'];
      rows = filteredEventRegs.map(reg => [
        reg.id.toString(),
        reg.full_name,
        reg.pin_number,
        reg.email,
        reg.mobile,
        reg.branch,
        reg.year_of_study,
        reg.section || 'N/A',
        reg.event_name,
        (reg.notes || '').replace(/\n/g, ' '),
        reg.status,
        new Date(reg.created_at).toLocaleString()
      ]);
    }

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${val.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AdminLayout>
      {/* Stats Cards */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-info">
            <span>Total Submissions</span>
            <h2>{stats.total}</h2>
          </div>
          <div className="admin-stat-icon total">
            <Layers size={22} />
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-info">
            <span>Pending Audits</span>
            <h2>{stats.pending}</h2>
          </div>
          <div className="admin-stat-icon pending">
            <Calendar size={22} />
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-info">
            <span>Approved Seats</span>
            <h2>{stats.approved}</h2>
          </div>
          <div className="admin-stat-icon approved">
            <Check size={22} />
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-info">
            <span>Rejected Applications</span>
            <h2>{stats.rejected}</h2>
          </div>
          <div className="admin-stat-icon rejected">
            <X size={22} />
          </div>
        </div>
      </div>


      {/* Filters & Actions Control Row */}
      <div className="table-controls">
        <div className="search-filter-box">
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search student, email, or PIN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select
            className="admin-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            className="admin-filter-select"
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
          >
            <option value="all">All Branches</option>
            {getBranches().map((br, idx) => (
              <option key={idx} value={br}>{br}</option>
            ))}
          </select>

          {activeTab === 'event' && (
            <select
              className="admin-filter-select"
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
            >
              <option value="all">All Events</option>
              {getEvents().map((evt, idx) => (
                <option key={idx} value={evt}>{evt}</option>
              ))}
            </select>
          )}
        </div>

        <button onClick={handleExportCSV} className="admin-btn-export">
          <Download size={16} />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Submissions Grid Table */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading student submissions directory...
        </div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              {activeTab === 'club' ? (
                <tr>
                  <th>Student Info</th>
                  <th>Academic Profile</th>
                  <th>Interests & Skills</th>
                  <th>Statement / Reason</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              ) : (
                <tr>
                  <th>Student Info</th>
                  <th>Academic Profile</th>
                  <th>Target Event</th>
                  <th>Special Notes</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              )}
            </thead>
            <tbody>
              {activeTab === 'club' ? (
                filteredClubApps.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                      No club applications match the filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredClubApps.map(app => (
                    <tr key={app.id}>
                      <td>
                        <strong>{app.full_name}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                          PIN: {app.pin_number} | {app.email}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Phone: {app.mobile}
                        </div>
                      </td>
                      <td>
                        {app.branch} ({app.year_of_study})
                        {app.section && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sec: {app.section}</div>}
                      </td>
                      <td>
                        <span style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600 }}>Interests:</span>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{app.interests}</span>
                        <span style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginTop: '0.25rem' }}>Skills:</span>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{app.skills}</span>
                      </td>
                      <td style={{ maxWidth: '300px', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        <div style={{ maxHeight: '60px', overflowY: 'auto' }}>{app.reason_to_join}</div>
                      </td>
                      <td>
                        <span className={`status-pill status-${app.status}`}>{app.status}</span>
                      </td>
                      <td>
                        <div className="actions-cell">
                          {app.status === 'pending' && (
                            <>
                              <button onClick={() => handleUpdateStatus('club', app.id, 'approved')} className="btn-action approve" title="Approve Application">
                                <Check size={14} />
                              </button>
                              <button onClick={() => handleUpdateStatus('club', app.id, 'rejected')} className="btn-action reject" title="Reject Application">
                                <X size={14} />
                              </button>
                            </>
                          )}
                          {app.status !== 'pending' && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Checked
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )
              ) : (
                filteredEventRegs.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                      No event registrations match the filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredEventRegs.map(reg => (
                    <tr key={reg.id}>
                      <td>
                        <strong>{reg.full_name}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                          PIN: {reg.pin_number} | {reg.email}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Phone: {reg.mobile}
                        </div>
                      </td>
                      <td>
                        {reg.branch} ({reg.year_of_study})
                        {reg.section && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sec: {reg.section}</div>}
                      </td>
                      <td>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary)' }}>
                          {reg.event_name}
                        </span>
                      </td>
                      <td style={{ maxWidth: '250px', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        <div style={{ maxHeight: '60px', overflowY: 'auto' }}>{reg.notes || 'No notes provided'}</div>
                      </td>
                      <td>
                        <span className={`status-pill status-${reg.status}`}>{reg.status}</span>
                      </td>
                      <td>
                        <div className="actions-cell">
                          {reg.status === 'pending' && (
                            <>
                              <button onClick={() => handleUpdateStatus('event', reg.id, 'approved')} className="btn-action approve" title="Approve Registration">
                                <Check size={14} />
                              </button>
                              <button onClick={() => handleUpdateStatus('event', reg.id, 'rejected')} className="btn-action reject" title="Reject Registration">
                                <X size={14} />
                              </button>
                            </>
                          )}
                          {reg.status !== 'pending' && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Checked
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
};
