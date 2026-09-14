import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { 
  Check, 
  X, 
  RotateCcw, 
  Layers, 
  Calendar, 
  Loader2, 
  DoorOpen, 
  Eye, 
  Download, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { AdminLayout } from '../components/AdminLayout';
import { AdminPagination } from '../components/AdminPagination';
import { AdminFilterDropdown } from '../components/AdminFilterDropdown';
import { formatDisplayPhone } from '../utils/phone';

interface Room {
  id: number;
  event_type: 'event' | 'hackathon';
  event_name: string;
  room_name: string;
  room_code: string;
  capacity?: number;
  assigned_desk_id?: string;
  assigned_desk_name?: string;
}

interface HackathonRegistration {
  id: number;
  hackathon_name?: string;
  team_name: string;
  leader_name: string;
  leader_email: string;
  leader_phone: string;
  leader_role?: string;
  leader_branch?: string;
  leader_year?: string;
  leader_institution?: string;
  leader_company?: string;
  leader_job_title?: string;
  pin_number?: string;
  branch?: string;
  year_of_study?: string;
  section?: string;
  project_title?: string;
  project_description?: string;
  problem_statement?: string;
  members?: string;
  status?: string;
  attendance?: 'present' | 'absent' | 'pending';
  attendance_marked_by?: string;
  attendance_marked_at?: string;
  room_code?: string;
  created_at?: string;
}

export const RegDeskDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  // Registrations state
  const [registrations, setRegistrations] = useState<HackathonRegistration[]>([]);
  const [assignedRooms, setAssignedRooms] = useState<Room[]>([]);
  const [distinctHackathons, setDistinctHackathons] = useState<string[]>([]);
  const [managedBranches, setManagedBranches] = useState<string[]>([]);

  // Selected Detail Modal
  const [selectedHackathon, setSelectedHackathon] = useState<HackathonRegistration | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [hackathonFilter, setHackathonFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'present' | 'absent' | 'pending'>('all');
  const [roomFilter, setRoomFilter] = useState('all');

  // Loading & Updating
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingId, setIsUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Pagination (PAGE_SIZE = 20)
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;

  // Auto-scroll table container on page change
  useEffect(() => {
    const tableContainer = document.querySelector('.admin-table-container');
    if (tableContainer) {
      tableContainer.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage]);

  // Auth check & data load on mount
  useEffect(() => {
    const regDeskToken = localStorage.getItem('reg_desk_token');
    const adminToken = localStorage.getItem('admin_token');
    if (!regDeskToken && !adminToken) {
      navigate('/reg-desk/login');
      return;
    }

    loadDashboardData();
  }, [navigate]);

  // Real-time SSE listener
  useEffect(() => {
    const handleSync = (e: Event) => {
      const eventType = (e as CustomEvent).detail;
      if (eventType === 'REFRESH_ATTENDANCE' || eventType === 'REFRESH_APPLICATIONS') {
        loadDashboardData(false);
      }
    };
    window.addEventListener('app-sync', handleSync);
    return () => window.removeEventListener('app-sync', handleSync);
  }, []);

  // Primary Data Loader
  const loadDashboardData = async (showLoadingSpinner = true) => {
    if (showLoadingSpinner) setIsLoading(true);
    setError('');

    const regDeskToken = localStorage.getItem('reg_desk_token');
    const adminToken = localStorage.getItem('admin_token');
    const token = regDeskToken || adminToken;

    try {
      // 1. Fetch participants from reg-desk API
      let participantsData: HackathonRegistration[] = [];
      const res = await fetch(`${API_BASE_URL}/api/reg-desk/participants?type=hackathon&name=all`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const json = await res.json();
        participantsData = json.participants || [];
      } else if (adminToken) {
        // Fallback to admin applications endpoint if accessed by admin
        const adminRes = await fetch(`${API_BASE_URL}/api/admin/applications`, {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        if (adminRes.ok) {
          const adminData = await adminRes.json();
          participantsData = adminData.hackathonRegistrations || [];
        }
      }

      setRegistrations(participantsData);

      // Extract distinct hackathon names
      const hSet = new Set<string>();
      participantsData.forEach(r => {
        if (r.hackathon_name && r.hackathon_name.trim()) {
          hSet.add(r.hackathon_name.trim());
        }
      });
      setDistinctHackathons(Array.from(hSet));

      // 2. Fetch assigned rooms
      try {
        const roomsRes = await fetch(`${API_BASE_URL}/api/reg-desk/assignments`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (roomsRes.ok) {
          const rData = await roomsRes.json();
          setAssignedRooms(rData.assignedRooms || []);
        }
      } catch (e) {}

      // 3. Fetch managed branches
      try {
        const branchRes = await fetch(`${API_BASE_URL}/api/branches`);
        if (branchRes.ok) {
          const bData = await branchRes.json();
          if (Array.isArray(bData)) {
            setManagedBranches(bData.map((b: any) => b.name));
          }
        }
      } catch (e) {}

    } catch (err: any) {
      console.error('Error loading registration desk data:', err);
      setError(err.message || 'Failed to load registrations.');
    } finally {
      if (showLoadingSpinner) setIsLoading(false);
    }
  };

  // Distinct branches (managed branches + participant branches)
  const branchOptions = useMemo(() => {
    const bSet = new Set<string>(managedBranches);
    registrations.forEach(r => {
      const b = r.leader_branch || r.branch;
      if (b && b.trim()) bSet.add(b.trim().toUpperCase());
    });
    return Array.from(bSet).sort();
  }, [managedBranches, registrations]);

  // Update Attendance Action
  const handleMarkAttendance = async (participantId: number, targetAttendance: 'present' | 'absent' | 'pending') => {
    setIsUpdatingId(participantId);
    const token = localStorage.getItem('reg_desk_token') || localStorage.getItem('admin_token');

    // Optimistic UI update
    setRegistrations(prev => prev.map(p => {
      if (p.id === participantId) {
        return { ...p, attendance: targetAttendance };
      }
      return p;
    }));

    if (selectedHackathon && selectedHackathon.id === participantId) {
      setSelectedHackathon(prev => prev ? { ...prev, attendance: targetAttendance } : null);
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/reg-desk/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: 'hackathon',
          id: participantId,
          attendance: targetAttendance
        })
      });

      if (!res.ok) {
        throw new Error('Failed to record attendance on server.');
      }

      setSuccessToast(`Attendance marked as ${targetAttendance.toUpperCase()}`);
      setTimeout(() => setSuccessToast(''), 2200);
    } catch (err: any) {
      setError(err.message || 'Error updating attendance.');
      loadDashboardData(false);
    } finally {
      setIsUpdatingId(null);
    }
  };

  // Filtered registrations
  const filteredRegistrations = useMemo(() => {
    return registrations.filter(r => {
      // 1. Hackathon filter
      if (hackathonFilter !== 'all' && (r.hackathon_name || '').trim() !== hackathonFilter.trim()) {
        return false;
      }

      // 2. Branch filter
      if (branchFilter !== 'all') {
        const studentBranch = (r.leader_branch || r.branch || '').toUpperCase().trim();
        if (studentBranch !== branchFilter.toUpperCase().trim()) {
          return false;
        }
      }

      // 3. Attendance filter
      if (attendanceFilter !== 'all') {
        const att = (r.attendance || 'pending').toLowerCase();
        if (att !== attendanceFilter) {
          return false;
        }
      }

      // 4. Room filter
      if (roomFilter !== 'all') {
        if ((r.room_code || '').toUpperCase().trim() !== roomFilter.toUpperCase().trim()) {
          return false;
        }
      }

      // 5. Search query
      if (searchTerm.trim() !== '') {
        const q = searchTerm.toLowerCase().trim();
        const team = (r.team_name || '').toLowerCase();
        const leader = (r.leader_name || '').toLowerCase();
        const email = (r.leader_email || '').toLowerCase();
        const phone = (r.leader_phone || '').toLowerCase();
        const pin = (r.pin_number || '').toLowerCase();
        const proj = (r.project_title || '').toLowerCase();
        const prob = (r.problem_statement || '').toLowerCase();
        return team.includes(q) || leader.includes(q) || email.includes(q) || phone.includes(q) || pin.includes(q) || proj.includes(q) || prob.includes(q);
      }

      return true;
    });
  }, [registrations, hackathonFilter, branchFilter, attendanceFilter, roomFilter, searchTerm]);

  // Compute live statistics (matches /admin/hackathons)
  const stats = useMemo(() => {
    const total = filteredRegistrations.length;
    let present = 0;
    let absent = 0;
    let pending = 0;

    filteredRegistrations.forEach(r => {
      const att = (r.attendance || 'pending').toLowerCase();
      if (att === 'present') present++;
      else if (att === 'absent') absent++;
      else pending++;
    });

    return { total, present, absent, pending };
  }, [filteredRegistrations]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, hackathonFilter, branchFilter, attendanceFilter, roomFilter]);

  // Paginated records
  const paginatedRegistrations = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredRegistrations.slice(start, start + PAGE_SIZE);
  }, [filteredRegistrations, currentPage, PAGE_SIZE]);

  const totalPages = Math.ceil(filteredRegistrations.length / PAGE_SIZE);

  // CSV Export Utility (same as /admin/hackathons)
  const handleExportCSV = () => {
    const filename = `Hackathon_Registrations_Attendance.csv`;
    const headers = [
      'ID',
      'Hackathon Name',
      'Team Name',
      'Project Title',
      'Leader Name',
      'Leader Email',
      'Leader Phone',
      'Leader Role',
      'Branch',
      'Year',
      'Institution',
      'Room Desk',
      'Attendance',
      'Status',
      'Registered At'
    ];

    const rows = filteredRegistrations.map(reg => [
      reg.id.toString(),
      reg.hackathon_name || 'R&D AlphaQuest Hackathon',
      reg.team_name,
      reg.project_title || 'N/A',
      reg.leader_name,
      reg.leader_email,
      reg.leader_phone,
      reg.leader_role || 'Student',
      reg.leader_branch || reg.branch || 'N/A',
      reg.leader_year || reg.year_of_study || 'N/A',
      reg.leader_institution || 'Trinity College',
      reg.room_code || 'Main Desk',
      (reg.attendance || 'pending').toUpperCase(),
      reg.status || 'approved',
      reg.created_at ? new Date(reg.created_at).toLocaleString() : 'N/A'
    ]);

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
      {/* Toast Notification */}
      {successToast && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          backgroundColor: '#059669',
          color: '#ffffff',
          padding: '0.75rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          zIndex: 9999,
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.875rem',
          fontWeight: 600,
          animation: 'fadeIn 0.2s'
        }}>
          <CheckCircle2 size={18} /> {successToast}
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Stats Cards (Exact same as /admin/hackathons) */}
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
            <span>Approved / Present</span>
            <h2 style={{ color: '#10b981' }}>{stats.present}</h2>
          </div>
          <div className="admin-stat-icon approved">
            <Check size={22} />
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-info">
            <span>Absent</span>
            <h2 style={{ color: '#ef4444' }}>{stats.absent}</h2>
          </div>
          <div className="admin-stat-icon rejected">
            <X size={22} />
          </div>
        </div>
      </div>

      {/* Filters & Actions Row (Exact same as /admin/hackathons) */}
      <div className="table-controls">
        <div className="search-filter-box">
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search team, leader, project..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {/* Hackathons Filter Dropdown */}
          <AdminFilterDropdown
            value={hackathonFilter}
            onChange={setHackathonFilter}
            options={[
              { value: 'all', label: 'All Hackathons' },
              ...distinctHackathons.map(h => ({ value: h, label: h }))
            ]}
            placeholder="All Hackathons"
            minWidth="140px"
            maxWidth="190px"
            menuWidth="240px"
            title="Filter by Hackathon"
          />

          {/* Branch Filter Dropdown */}
          <AdminFilterDropdown
            value={branchFilter}
            onChange={setBranchFilter}
            options={[
              { value: 'all', label: 'All Branches' },
              ...branchOptions.map(b => ({ value: b, label: b }))
            ]}
            placeholder="All Branches"
            minWidth="135px"
            maxWidth="195px"
            menuWidth="240px"
            title="Filter by Branch"
          />

          {/* Attendance Status Filter Dropdown */}
          <AdminFilterDropdown
            value={attendanceFilter}
            onChange={(val) => setAttendanceFilter(val as any)}
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'present', label: 'Present' },
              { value: 'absent', label: 'Absent' },
              { value: 'pending', label: 'Pending' }
            ]}
            placeholder="All Statuses"
            minWidth="130px"
            maxWidth="160px"
            menuWidth="180px"
            title="Filter by Attendance"
          />

          {/* Assigned Room Filter Dropdown */}
          {assignedRooms.length > 0 && (
            <AdminFilterDropdown
              value={roomFilter}
              onChange={setRoomFilter}
              options={[
                { value: 'all', label: 'All Rooms' },
                ...assignedRooms.map(r => ({ value: r.room_code, label: `${r.room_code} - ${r.room_name}` }))
              ]}
              placeholder="All Rooms"
              minWidth="135px"
              maxWidth="185px"
              menuWidth="220px"
              title="Filter by Room"
            />
          )}
        </div>

        {/* Action Buttons: Refresh & Export */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => loadDashboardData(true)}
            className="admin-btn-export"
            title="Refresh List"
          >
            <RotateCcw size={15} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="admin-btn-export"
            title="Export CSV"
          >
            <Download size={15} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Submissions Table Container (Only this area scrolls, exact same as /admin/hackathons) */}
      <div className="admin-table-container hackathons-table">
        {isLoading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Loader2 className="spinner-icon" size={32} style={{ margin: '0 auto 1rem auto', color: 'var(--primary)' }} />
            <p>Loading hackathon registrations directory...</p>
          </div>
        ) : filteredRegistrations.length === 0 ? (
          <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Layers size={40} style={{ margin: '0 auto 1rem auto', opacity: 0.4 }} />
            <h4 style={{ color: 'var(--text-main)', margin: '0 0 0.5rem 0' }}>No hackathon registrations match criteria</h4>
            <p style={{ margin: 0, fontSize: '0.875rem' }}>Try modifying your search query or branch filter.</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '45px' }}>#</th>
                <th>Team & Leader Info</th>
                <th>Academic & Branch Profile</th>
                <th>Members Roster</th>
                <th>Attendance</th>
                <th>Status</th>
                <th style={{ textAlign: 'center', minWidth: '150px' }}>Actions & Attendance</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRegistrations.map((reg, idx) => {
                const rowNum = (currentPage - 1) * PAGE_SIZE + idx + 1;
                const isUpdating = isUpdatingId === reg.id;

                let membersCount = 1;
                try {
                  const parsed = JSON.parse(reg.members || '[]');
                  membersCount = parsed.length + 1;
                } catch (e) {}

                const att = (reg.attendance || 'pending').toLowerCase();
                const badgeStyles: Record<string, { bg: string; color: string; border: string; label: string }> = {
                  present: { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0', label: '✓ Present' },
                  absent: { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca', label: '✕ Absent' },
                  pending: { bg: '#f3f4f6', color: '#4b5563', border: '#e5e7eb', label: '⏳ Pending' }
                };
                const s = badgeStyles[att] || badgeStyles.pending;

                return (
                  <tr key={reg.id}>
                    {/* # */}
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                      {rowNum}
                    </td>

                    {/* Team & Leader Info */}
                    <td>
                      <span style={{
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        color: '#4f46e5',
                        backgroundColor: '#e0e7ff',
                        padding: '0.125rem 0.375rem',
                        borderRadius: '4px',
                        textTransform: 'uppercase',
                        display: 'inline-block',
                        marginBottom: '0.25rem'
                      }}>
                        {reg.hackathon_name || 'R&D AlphaQuest Hackathon'}
                      </span>
                      <div><strong>{reg.team_name}</strong></div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        Leader: {reg.leader_name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {reg.leader_email} | {formatDisplayPhone(reg.leader_phone)}
                      </div>
                    </td>

                    {/* Academic & Branch Profile */}
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)' }}>
                        {reg.leader_role || 'Student'}
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                        {reg.leader_branch ? `Branch: ${reg.leader_branch}` : reg.leader_company ? `Company: ${reg.leader_company}` : 'Trinity College'}
                      </div>
                      {(reg.leader_year || reg.year_of_study) && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                          Year: {reg.leader_year || reg.year_of_study}
                        </div>
                      )}
                      {reg.project_title && (
                        <div style={{ marginTop: '0.35rem', fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>
                          Project: {reg.project_title}
                        </div>
                      )}
                    </td>

                    {/* Members Roster */}
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{membersCount} Member(s)</span>
                        <button 
                          onClick={() => setSelectedHackathon(reg)}
                          className="btn btn-secondary btn-sm"
                          style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', fontSize: '0.75rem', cursor: 'pointer' }}
                        >
                          <Eye size={12} /> View Details
                        </button>
                      </div>
                    </td>

                    {/* Attendance Status */}
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-start' }}>
                        <span style={{
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          color: s.color,
                          backgroundColor: s.bg,
                          border: `1px solid ${s.border}`,
                          padding: '0.15rem 0.45rem',
                          borderRadius: '9999px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          {s.label}
                        </span>
                        {reg.room_code && (
                          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                            <DoorOpen size={11} color="var(--primary)" /> Room: {reg.room_code}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td>
                      <span className={`status-pill status-${reg.status || 'approved'}`}>
                        {reg.status || 'approved'}
                      </span>
                    </td>

                    {/* Actions & Attendance */}
                    <td style={{ textAlign: 'center' }}>
                      <div className="actions-cell" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', justifyContent: 'center' }}>
                        {/* Mark Present */}
                        <button
                          type="button"
                          disabled={isUpdating || att === 'present'}
                          onClick={() => handleMarkAttendance(reg.id, 'present')}
                          className="btn-action approve"
                          title="Mark Present"
                          style={{ opacity: att === 'present' ? 0.35 : 1, cursor: att === 'present' ? 'default' : 'pointer' }}
                        >
                          <Check size={14} />
                        </button>

                        {/* Mark Absent */}
                        <button
                          type="button"
                          disabled={isUpdating || att === 'absent'}
                          onClick={() => handleMarkAttendance(reg.id, 'absent')}
                          className="btn-action reject"
                          title="Mark Absent"
                          style={{ opacity: att === 'absent' ? 0.35 : 1, cursor: att === 'absent' ? 'default' : 'pointer' }}
                        >
                          <X size={14} />
                        </button>

                        {/* Reset Attendance */}
                        <button
                          type="button"
                          disabled={isUpdating || att === 'pending'}
                          onClick={() => handleMarkAttendance(reg.id, 'pending')}
                          className="btn-action"
                          title="Reset Attendance"
                          style={{ opacity: att === 'pending' ? 0.35 : 1, cursor: att === 'pending' ? 'default' : 'pointer', color: '#64748b' }}
                        >
                          <RotateCcw size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Strip (PAGE_SIZE = 20, smooth scroll to top) */}
      <AdminPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalRecords={filteredRegistrations.length}
        pageSize={PAGE_SIZE}
        onPageChange={(page) => setCurrentPage(page)}
        itemName="teams"
      />

      {/* View Details Modal (Exact same layout & styling as /admin/hackathons) */}
      {selectedHackathon && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1.5rem',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '620px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-xl)',
            border: '1px solid var(--border)'
          }}>
            {/* Sticky Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid var(--border)',
              padding: '1.25rem 1.75rem',
              backgroundColor: '#ffffff'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  color: '#4f46e5',
                  backgroundColor: '#e0e7ff',
                  padding: '0.125rem 0.375rem',
                  borderRadius: '4px',
                  alignSelf: 'flex-start',
                  textTransform: 'uppercase'
                }}>
                  {selectedHackathon.hackathon_name || 'R&D AlphaQuest Hackathon'}
                </span>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>
                  Team Details: {selectedHackathon.team_name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedHackathon(null)}
                className="btn btn-secondary btn-sm"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8125rem', cursor: 'pointer', borderRadius: '0.375rem' }}
              >
                Close
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div style={{
              padding: '1.75rem',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              flex: 1
            }}>
              {/* Project Details */}
              {(selectedHackathon.project_title || selectedHackathon.project_description || selectedHackathon.problem_statement) && (
                <div>
                  <h4 style={{
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    color: 'var(--text-main)',
                    marginBottom: '0.75rem',
                    borderBottom: '1px solid var(--border)',
                    paddingBottom: '0.5rem'
                  }}>
                    Project Details
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
                    {selectedHackathon.project_title && (
                      <div><strong>Project Title:</strong> {selectedHackathon.project_title}</div>
                    )}
                    {selectedHackathon.project_description && (
                      <div>
                        <strong>Project Description:</strong>
                        <div style={{
                          padding: '0.75rem',
                          backgroundColor: 'var(--bg-main)',
                          borderRadius: 'var(--radius-md)',
                          whiteSpace: 'pre-wrap',
                          color: 'var(--text-secondary)',
                          fontSize: '0.8125rem',
                          marginTop: '0.25rem',
                          border: '1px solid var(--border)'
                        }}>
                          {selectedHackathon.project_description}
                        </div>
                      </div>
                    )}
                    {selectedHackathon.problem_statement && (
                      <div>
                        <strong>Problem Statement:</strong>
                        <div style={{
                          padding: '0.75rem',
                          backgroundColor: 'var(--bg-main)',
                          borderRadius: 'var(--radius-md)',
                          whiteSpace: 'pre-wrap',
                          color: 'var(--text-secondary)',
                          fontSize: '0.8125rem',
                          marginTop: '0.25rem',
                          border: '1px solid var(--border)'
                        }}>
                          {selectedHackathon.problem_statement}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Team Leader Section */}
              <div>
                <h4 style={{
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  color: 'var(--text-main)',
                  marginBottom: '0.75rem',
                  borderBottom: '1px solid var(--border)',
                  paddingBottom: '0.5rem'
                }}>
                  Team Leader Information
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.875rem' }}>
                  <div><strong>Name:</strong> {selectedHackathon.leader_name}</div>
                  <div><strong>Role:</strong> {selectedHackathon.leader_role || 'Student'}</div>
                  <div><strong>Email:</strong> {selectedHackathon.leader_email}</div>
                  <div><strong>Phone:</strong> {formatDisplayPhone(selectedHackathon.leader_phone)}</div>
                  <div><strong>Branch:</strong> {selectedHackathon.leader_branch || 'N/A'}</div>
                  <div><strong>Year:</strong> {selectedHackathon.leader_year || 'N/A'}</div>
                </div>
              </div>

              {/* Team Members */}
              {selectedHackathon.members && (() => {
                try {
                  const mList = JSON.parse(selectedHackathon.members);
                  if (Array.isArray(mList) && mList.length > 0) {
                    return (
                      <div>
                        <h4 style={{
                          fontSize: '0.9375rem',
                          fontWeight: 600,
                          color: 'var(--text-main)',
                          marginBottom: '0.75rem',
                          borderBottom: '1px solid var(--border)',
                          paddingBottom: '0.5rem'
                        }}>
                          Team Members ({mList.length})
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {mList.map((m: any, i: number) => (
                            <div key={i} style={{
                              padding: '0.6rem 0.85rem',
                              backgroundColor: 'var(--bg-main)',
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid var(--border)',
                              fontSize: '0.8125rem',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}>
                              <div>
                                <strong>{m.name || m.full_name || `Member #${i + 1}`}</strong>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  {m.email} | {m.phone || m.mobile}
                                </div>
                              </div>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                {m.pin || m.branch || ''}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                } catch (e) {}
                return null;
              })()}

              {/* Attendance Quick Action Inside Modal */}
              <div>
                <h4 style={{
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  color: 'var(--text-main)',
                  marginBottom: '0.75rem',
                  borderBottom: '1px solid var(--border)',
                  paddingBottom: '0.5rem'
                }}>
                  Mark Attendance
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => handleMarkAttendance(selectedHackathon.id, 'present')}
                    className="btn btn-primary"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.45rem 1rem',
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      backgroundColor: selectedHackathon.attendance === 'present' ? '#059669' : undefined
                    }}
                  >
                    <Check size={15} /> Mark Present
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMarkAttendance(selectedHackathon.id, 'absent')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.45rem 1rem',
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      border: '1px solid #fecaca',
                      backgroundColor: selectedHackathon.attendance === 'absent' ? '#dc2626' : '#fef2f2',
                      color: selectedHackathon.attendance === 'absent' ? '#ffffff' : '#dc2626'
                    }}
                  >
                    <X size={15} /> Mark Absent
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMarkAttendance(selectedHackathon.id, 'pending')}
                    className="btn btn-secondary"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.45rem 0.85rem',
                      fontSize: '0.8125rem',
                      fontWeight: 600
                    }}
                  >
                    <RotateCcw size={13} /> Reset Pending
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
