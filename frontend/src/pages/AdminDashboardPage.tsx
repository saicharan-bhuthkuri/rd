import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { AdminLayout } from '../components/AdminLayout';
import { Download, Check, X, Layers, Calendar, Mail, Loader2 } from 'lucide-react';

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
  offer_sent?: number;
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
  certificate_sent?: number;
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
      const response = await fetch(`${API_BASE_URL}/api/admin/applications`, {
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

    const handleSync = (e: Event) => {
      const eventType = (e as CustomEvent).detail;
      if (eventType === 'REFRESH_APPLICATIONS') {
        fetchApplications();
      }
    };

    window.addEventListener('app-sync', handleSync);
    return () => window.removeEventListener('app-sync', handleSync);
  }, []);

  const [isSendingBulk, setIsSendingBulk] = useState(false);

  // Certificate Type Modal States
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [selectedCertType, setSelectedCertType] = useState<'participation' | 'appreciation'>('participation');
  const [certTypeText, setCertTypeText] = useState('participated');

  // Terminal Console Modal States
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [consoleProgress, setConsoleProgress] = useState(0);
  const [consoleStatus, setConsoleStatus] = useState<'idle' | 'running' | 'completed' | 'failed'>('idle');
  const [consoleTitle, setConsoleTitle] = useState('');

  // Custom Alert / Confirm Dialog Modal States
  const [dialogConfig, setDialogConfig] = useState<{
    isOpen: boolean;
    type: 'alert' | 'confirm';
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    type: 'alert',
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const showCustomAlert = (title: string, message: string) => {
    setDialogConfig({
      isOpen: true,
      type: 'alert',
      title,
      message,
      onConfirm: () => {}
    });
  };

  const showCustomConfirm = (title: string, message: string, onConfirm: () => void) => {
    setDialogConfig({
      isOpen: true,
      type: 'confirm',
      title,
      message,
      onConfirm
    });
  };

  const consoleBottomRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isConsoleOpen && consoleBottomRef.current) {
      consoleBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [consoleLogs, isConsoleOpen]);

  const executeBulkSendOffers = async () => {
    // Reset console states
    setConsoleLogs([]);
    setConsoleProgress(0);
    setConsoleStatus('running');
    setConsoleTitle("Bulk Dispatch: Offer Letters");
    setIsConsoleOpen(true);
    setIsSendingBulk(true);

    const token = localStorage.getItem('admin_token');

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/bulk-send/offers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to establish stream connection.');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Readable stream not supported.');
      }

      const decoder = new TextDecoder();
      let partialChunk = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = (partialChunk + chunk).split('\n\n');
        partialChunk = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.error) {
                setConsoleLogs(prev => [...prev, `[ERROR] ${data.error}`]);
                setConsoleStatus('failed');
              } else {
                if (data.message) {
                  setConsoleLogs(prev => [...prev, data.message]);
                }
                if (data.progress !== undefined) {
                  setConsoleProgress(data.progress);
                }
                if (data.isDone) {
                  setConsoleStatus('completed');
                }
              }
            } catch (e) {
              console.error("JSON parse error on SSE line:", line, e);
            }
          }
        }
      }

      fetchApplications();
    } catch (err: any) {
      setConsoleLogs(prev => [...prev, `[ERROR] ${err.message}`]);
      setConsoleStatus('failed');
    } finally {
      setIsSendingBulk(false);
    }
  };

  const handleBulkSendOffers = () => {
    showCustomConfirm(
      "Send Offer Letters",
      "Are you sure you want to generate and email offer letters to all APPROVED student coordinators who haven't received them yet?",
      executeBulkSendOffers
    );
  };

  const executeBulkSendCertificates = async (certType: 'participation' | 'appreciation', typeText: string) => {
    // Reset console states
    setConsoleLogs([]);
    setConsoleProgress(0);
    setConsoleStatus('running');
    setConsoleTitle(`Bulk Dispatch: ${eventFilter}`);
    setIsConsoleOpen(true);
    setIsSendingBulk(true);

    const token = localStorage.getItem('admin_token');

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/bulk-send/certificates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          eventTitle: eventFilter,
          certificateType: certType,
          certificateTypeText: typeText
        })
      });

      if (!response.ok) {
        throw new Error('Failed to establish stream connection.');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Readable stream not supported.');
      }

      const decoder = new TextDecoder();
      let partialChunk = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = (partialChunk + chunk).split('\n\n');
        partialChunk = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.error) {
                setConsoleLogs(prev => [...prev, `[ERROR] ${data.error}`]);
                setConsoleStatus('failed');
              } else {
                if (data.message) {
                  setConsoleLogs(prev => [...prev, data.message]);
                }
                if (data.progress !== undefined) {
                  setConsoleProgress(data.progress);
                }
                if (data.isDone) {
                  setConsoleStatus('completed');
                }
              }
            } catch (e) {
              console.error("JSON parse error on SSE line:", line, e);
            }
          }
        }
      }

      fetchApplications();
    } catch (err: any) {
      setConsoleLogs(prev => [...prev, `[ERROR] ${err.message}`]);
      setConsoleStatus('failed');
    } finally {
      setIsSendingBulk(false);
    }
  };

  const handleBulkSendCertificates = () => {
    if (eventFilter === 'all') {
      showCustomAlert(
        "Event Selection Required",
        "Please select a specific event from the event filter dropdown next to the search bar before sending certificates."
      );
      return;
    }

    setSelectedCertType('participation');
    setCertTypeText('participated');
    setIsCertModalOpen(true);
  };

  // Update status action
  const handleUpdateStatus = async (type: 'club' | 'event', id: number, status: 'approved' | 'rejected') => {
    const token = localStorage.getItem('admin_token');
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/applications/status`, {
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
    if (activeTab === 'club') {
      const approved = clubApps.filter(a => a.status === 'approved');
      const sent = approved.filter(a => a.offer_sent === 1).length;
      const unsent = approved.filter(a => a.offer_sent === 0 || a.offer_sent === null).length;
      return {
        total: clubApps.length,
        pending: clubApps.filter(a => a.status === 'pending').length,
        approved: approved.length,
        rejected: clubApps.filter(a => a.status === 'rejected').length,
        sent,
        unsent,
        sentLabel: "Offers Sent",
        unsentLabel: "Offers Pending"
      };
    } else {
      // Event registrations (filtered by active eventFilter)
      const targetRegs = eventFilter === 'all' 
        ? eventRegs 
        : eventRegs.filter(r => r.event_name === eventFilter);

      const approved = targetRegs.filter(r => r.status === 'approved');
      const sent = approved.filter(r => r.certificate_sent === 1).length;
      const unsent = approved.filter(r => r.certificate_sent === 0 || r.certificate_sent === null).length;
      return {
        total: targetRegs.length,
        pending: targetRegs.filter(r => r.status === 'pending').length,
        approved: approved.length,
        rejected: targetRegs.filter(r => r.status === 'rejected').length,
        sent,
        unsent,
        sentLabel: "Certificates Sent",
        unsentLabel: "Certificates Pending"
      };
    }
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

        <div className="admin-stat-card">
          <div className="admin-stat-info">
            <span>{stats.sentLabel}</span>
            <h2 style={{ color: '#10b981' }}>{stats.sent}</h2>
          </div>
          <div className="admin-stat-icon" style={{ backgroundColor: '#ecfdf5', color: '#10b981' }}>
            <Mail size={22} />
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-info">
            <span>{stats.unsentLabel}</span>
            <h2 style={{ color: '#f59e0b' }}>{stats.unsent}</h2>
          </div>
          <div className="admin-stat-icon" style={{ backgroundColor: '#fffbeb', color: '#f59e0b' }}>
            <Mail size={22} />
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

        <div className="admin-dashboard-actions" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {activeTab === 'club' ? (
            <button 
              onClick={handleBulkSendOffers} 
              disabled={isSendingBulk}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', padding: '0.575rem 1rem', borderRadius: '0.375rem', cursor: 'pointer' }}
            >
              {isSendingBulk ? (
                <>
                  <Loader2 className="spinner-icon" size={16} /> Processing Dispatch...
                </>
              ) : (
                <>
                  <Mail size={16} /> Bulk Send Offer Letters
                </>
              )}
            </button>
          ) : (
            <button 
              onClick={handleBulkSendCertificates} 
              disabled={isSendingBulk}
              className="btn btn-primary"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                fontSize: '0.875rem', 
                padding: '0.575rem 1rem', 
                borderRadius: '0.375rem', 
                cursor: 'pointer'
              }}
            >
              {isSendingBulk ? (
                <>
                  <Loader2 className="spinner-icon" size={16} /> Processing Dispatch...
                </>
              ) : (
                <>
                  <Mail size={16} /> Bulk Send Certificates
                </>
              )}
            </button>
          )}

          <button onClick={handleExportCSV} className="admin-btn-export" style={{ height: '38px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Download size={16} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Submissions Grid Table */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading student submissions directory...
        </div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : (
        <div className="admin-table-container applications-table">
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

      {/* Light-themed Terminal Modal */}
      {isConsoleOpen && (
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
          zIndex: 1000,
          padding: '1.5rem'
        }}>
          <div className="card" style={{
            width: '100%',
            maxWidth: '640px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            padding: 0,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '85vh',
            border: '1px solid var(--border)'
          }}>
            {/* Terminal Header Chrome */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem 1.25rem',
              background: '#f1f5f9',
              borderBottom: '1px solid var(--border)'
            }}>
              <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444', display: 'inline-block' }}></span>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#eab308', display: 'inline-block' }}></span>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block' }}></span>
              </div>
              
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)', fontFamily: 'monospace' }}>
                {consoleTitle}
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="live-indicator" style={{ margin: 0, fontSize: '0.75rem', padding: '0.125rem 0.5rem' }}>
                  <span className={consoleStatus === 'running' ? "pulse" : ""} style={{ backgroundColor: consoleStatus === 'completed' ? '#22c55e' : consoleStatus === 'failed' ? '#ef4444' : '#64748b' }}></span>
                  <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>{consoleStatus}</span>
                </span>
              </div>
            </div>

            {/* Terminal Console Logs */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              background: '#f8fafc',
              padding: '1.25rem',
              fontFamily: 'Consolas, Monaco, "Courier New", Courier, monospace',
              fontSize: '0.875rem',
              lineHeight: 1.6,
              color: '#334155',
              maxHeight: '360px',
              minHeight: '220px',
              textAlign: 'left'
            }}>
              {consoleLogs.length === 0 && (
                <div style={{ color: '#94a3b8' }}>Establishing dispatch pipeline connection...</div>
              )}
              {consoleLogs.map((log, index) => {
                const isError = log.startsWith('[ERROR]');
                const isNameOrEmail = log.startsWith('Name:') || log.startsWith('Email:');
                const isSuccess = log.includes('successfully') || log.includes('completed');
                
                let textColor = '#334155';
                if (isError) textColor = '#ef4444';
                else if (isNameOrEmail) textColor = '#0284c7';
                else if (isSuccess) textColor = '#16a34a';

                return (
                  <div key={index} style={{ color: textColor, paddingBottom: '2px' }}>
                    {log}
                  </div>
                );
              })}
              <div ref={consoleBottomRef} />
            </div>

            {/* Progress Bar Container */}
            <div style={{ padding: '1.25rem', borderTop: '1px solid var(--border)', background: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 500 }}>
                <span>Transmission Progress</span>
                <span>{consoleProgress}%</span>
              </div>
              <div style={{
                width: '100%',
                height: '8px',
                borderRadius: '9999px',
                backgroundColor: '#e2e8f0',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${consoleProgress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                  borderRadius: '9999px',
                  transition: 'width 0.4s ease-out'
                }} />
              </div>
            </div>

            {/* Action Bar Footer */}
            <div style={{
              padding: '0.875rem 1.25rem',
              backgroundColor: '#f8fafc',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.5rem'
            }}>
              <button
                onClick={() => {
                  setIsConsoleOpen(false);
                  setConsoleLogs([]);
                  setConsoleProgress(0);
                  setConsoleStatus('idle');
                }}
                disabled={consoleStatus === 'running'}
                className="btn btn-primary"
                style={{
                  padding: '0.5rem 1.25rem',
                  fontSize: '0.875rem',
                  borderRadius: '0.375rem',
                  cursor: consoleStatus === 'running' ? 'not-allowed' : 'pointer',
                  opacity: consoleStatus === 'running' ? 0.6 : 1
                }}
              >
                Close Monitor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Configuration Modal */}
      {isCertModalOpen && (
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
            maxWidth: '440px',
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
                backgroundColor: '#e0f2fe',
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Mail size={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-main)' }}>
                Configure Certificates
              </h3>
            </div>

            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Choose the template type and customise the text placeholder for approved attendees of <strong>"{eventFilter}"</strong>.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Certificate Template Type
                </label>
                <select
                  value={selectedCertType}
                  onChange={(e) => {
                    const val = e.target.value as 'participation' | 'appreciation';
                    setSelectedCertType(val);
                    setCertTypeText('participated');
                  }}
                  className="input"
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    borderRadius: '0.375rem',
                    border: '1px solid var(--border)',
                    background: '#fff',
                    color: 'var(--text-main)'
                  }}
                >
                  <option value="participation">Participation</option>
                  <option value="appreciation">Appreciation</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Certificate Type Placeholder Text ({"{{CERTIFICATE TYPE}}"})
                </label>
                <input
                  type="text"
                  value={certTypeText}
                  onChange={(e) => setCertTypeText(e.target.value)}
                  placeholder="e.g. participated, coordinated, won First Place"
                  className="input"
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    borderRadius: '0.375rem',
                    border: '1px solid var(--border)',
                    background: '#fff',
                    color: 'var(--text-main)'
                  }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  This replaces the <code>{"{{CERTIFICATE TYPE}}"}</code> placeholder in the template.
                </span>
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.5rem',
              marginTop: '0.5rem'
            }}>
              <button
                onClick={() => setIsCertModalOpen(false)}
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
                onClick={() => {
                  setIsCertModalOpen(false);
                  executeBulkSendCertificates(selectedCertType, certTypeText);
                }}
                className="btn btn-primary"
                style={{
                  padding: '0.5rem 1.25rem',
                  fontSize: '0.875rem',
                  borderRadius: '0.375rem',
                  cursor: 'pointer'
                }}
              >
                Send Certificates
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Alert/Confirm Modal Dialog */}
      {dialogConfig.isOpen && (
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
            maxWidth: '440px',
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
                backgroundColor: dialogConfig.type === 'confirm' ? '#e0f2fe' : '#fef3c7',
                color: dialogConfig.type === 'confirm' ? '#0284c7' : '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Mail size={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-main)' }}>
                {dialogConfig.title}
              </h3>
            </div>

            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, textAlign: 'left' }}>
              {dialogConfig.message}
            </p>

            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.5rem',
              marginTop: '0.5rem'
            }}>
              {dialogConfig.type === 'confirm' && (
                <button
                  onClick={() => setDialogConfig(prev => ({ ...prev, isOpen: false }))}
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
              )}
              <button
                onClick={() => {
                  setDialogConfig(prev => ({ ...prev, isOpen: false }));
                  if (dialogConfig.type === 'confirm') {
                    dialogConfig.onConfirm();
                  }
                }}
                className="btn btn-primary"
                style={{
                  padding: '0.5rem 1.25rem',
                  fontSize: '0.875rem',
                  borderRadius: '0.375rem',
                  cursor: 'pointer'
                }}
              >
                {dialogConfig.type === 'confirm' ? 'Confirm' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
