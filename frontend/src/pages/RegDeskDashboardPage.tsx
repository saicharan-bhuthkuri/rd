import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  AlertCircle,
  ShieldCheck,
  FolderUp,
  ExternalLink,
  FileText,
  ChevronDown
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

interface EventItem {
  title: string;
  type: 'hackathon' | 'event';
  date?: string;
  location?: string;
}

interface EventDetails {
  eventName: string;
  eventType: string;
  problemTitle: string;
  problemStatement: string;
  description: string;
  date: string;
  time: string;
  location: string;
  speaker?: string;
  roomName?: string;
  roomCode?: string;
  capacity?: number;
  assignedDeskId?: string;
  assignedDeskName?: string;
  totalTeams: number;
  totalSubmissions: number;
}

interface ParticipantRecord {
  id: number;
  hackathon_name?: string;
  event_name?: string;
  team_name?: string;
  leader_name?: string;
  full_name?: string;
  leader_email?: string;
  email?: string;
  leader_phone?: string;
  mobile?: string;
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
  notes?: string;
  status?: string;
  attendance?: 'present' | 'absent' | 'pending';
  attendance_marked_by?: string;
  attendance_marked_at?: string;
  room_code?: string;
  created_at?: string;
}

interface ProjectSubmissionRecord {
  id: number;
  hackathon_registration_id?: number;
  event_name: string;
  team_name: string;
  leader_name: string;
  leader_email: string;
  leader_phone?: string;
  institution?: string;
  members?: string;
  project_title: string;
  project_info?: string;
  problem_statement: string;
  drive_file_id?: string;
  drive_file_url?: string;
  drive_folder_id?: string;
  drive_folder_url?: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  status: string;
  created_at?: string;
}

export const RegDeskDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  // Authentication & Desk User Identity
  const [deskUserInfo, setDeskUserInfo] = useState<{ deskId: string; name: string; role: string } | null>(null);

  // Dialog & Verification State
  const [showSelectionDialog, setShowSelectionDialog] = useState<boolean>(true);
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [dialogError, setDialogError] = useState<string>('');

  // Selected values in dialog
  const [selectedEventKey, setSelectedEventKey] = useState<string>('');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');

  // Custom styled dropdown states for dialog
  const [isEventDropdownOpen, setIsEventDropdownOpen] = useState(false);
  const [isRoomDropdownOpen, setIsRoomDropdownOpen] = useState(false);
  const eventDropdownRef = useRef<HTMLDivElement>(null);
  const roomDropdownRef = useRef<HTMLDivElement>(null);

  // Confirmed active room and active event
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [activeEvent, setActiveEvent] = useState<EventItem | null>(null);
  const [eventDetails, setEventDetails] = useState<EventDetails | null>(null);

  // Active Dashboard Mode: 'hackathon' (Registrations & Attendance Desk)
  const activeSubTab: 'hackathon' | 'submission' = 'hackathon';

  // Available metadata
  const [allRooms, setAllRooms] = useState<Room[]>([]);
  const [eventsList, setEventsList] = useState<EventItem[]>([]);
  const [managedBranches, setManagedBranches] = useState<string[]>([]);

  const selectedEvent = useMemo(() => {
    if (!selectedEventKey) return null;
    const colonIdx = selectedEventKey.indexOf(':');
    if (colonIdx === -1) return null;
    const type = selectedEventKey.slice(0, colonIdx);
    const title = selectedEventKey.slice(colonIdx + 1);
    return eventsList.find(e => e.type === type && e.title === title) || null;
  }, [selectedEventKey, eventsList]);

  const selectedRoomObj = useMemo(() => {
    if (!selectedRoomId) return null;
    return allRooms.find(r => String(r.id) === String(selectedRoomId)) || null;
  }, [selectedRoomId, allRooms]);

  const hackathonsList = useMemo(() => eventsList.filter(e => e.type === 'hackathon'), [eventsList]);
  const generalEventsList = useMemo(() => eventsList.filter(e => e.type === 'event'), [eventsList]);

  // Click-outside and escape listener to close custom dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (eventDropdownRef.current && !eventDropdownRef.current.contains(e.target as Node)) {
        setIsEventDropdownOpen(false);
      }
      if (roomDropdownRef.current && !roomDropdownRef.current.contains(e.target as Node)) {
        setIsRoomDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsEventDropdownOpen(false);
        setIsRoomDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Registrations & Submissions State
  const [hackathonRegistrations, setHackathonRegistrations] = useState<ParticipantRecord[]>([]);
  const [projectSubmissions, setProjectSubmissions] = useState<ProjectSubmissionRecord[]>([]);

  // Modals
  const [selectedParticipant, setSelectedParticipant] = useState<ParticipantRecord | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<ProjectSubmissionRecord | null>(null);

  // Table Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'present' | 'absent' | 'pending'>('all');
  const [submissionStatusFilter, setSubmissionStatusFilter] = useState('all');

  // Loading & Updating
  const [isLoading, setIsLoading] = useState(false);
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

  // Initial mount: check auth and load room & event lists
  useEffect(() => {
    const regDeskToken = localStorage.getItem('reg_desk_token');
    const adminToken = localStorage.getItem('admin_token');
    if (!regDeskToken && !adminToken) {
      navigate('/reg-desk/login');
      return;
    }

    // Determine current user
    const regUser = JSON.parse(localStorage.getItem('reg_desk_user') || '{}');
    const admUser = JSON.parse(localStorage.getItem('admin_user') || '{}');
    if (regUser.deskId) {
      setDeskUserInfo({ deskId: regUser.deskId, name: regUser.name || regUser.deskId, role: 'reg_desk' });
    } else if (admUser.username) {
      setDeskUserInfo({ deskId: admUser.username, name: admUser.username, role: admUser.role || 'admin' });
    }

    fetchInitialAssignments();
  }, [navigate]);

  // Real-time SSE listener for updates
  useEffect(() => {
    const handleSync = (e: Event) => {
      const eventType = (e as CustomEvent).detail;
      if (eventType === 'REFRESH_ATTENDANCE' || eventType === 'REFRESH_APPLICATIONS' || eventType === 'REFRESH_SUBMISSIONS') {
        if (activeEvent) {
          loadAllEventData(activeEvent.type, activeEvent.title, false);
        }
      }
    };
    window.addEventListener('app-sync', handleSync);
    return () => window.removeEventListener('app-sync', handleSync);
  }, [activeEvent]);

  // Fetch all rooms and events for selection dialog
  const fetchInitialAssignments = async () => {
    const regDeskToken = localStorage.getItem('reg_desk_token');
    const adminToken = localStorage.getItem('admin_token');
    const token = regDeskToken || adminToken;

    try {
      const res = await fetch(`${API_BASE_URL}/api/reg-desk/assignments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        
        // Rooms
        const fetchedRooms: Room[] = data.allRooms || data.assignedRooms || [];
        setAllRooms(fetchedRooms);

        if (data.deskUser) {
          setDeskUserInfo({
            deskId: data.deskUser.deskId,
            name: data.deskUser.name,
            role: data.deskUser.role
          });
        }

        // Build list of all events (clean, without emojis)
        const items: EventItem[] = [];
        if (Array.isArray(data.hackathons)) {
          data.hackathons.forEach((h: any) => {
            if (h.title && !items.some(i => i.title === h.title && i.type === 'hackathon')) {
              items.push({ title: h.title, type: 'hackathon' });
            }
          });
        }
        if (Array.isArray(data.events)) {
          data.events.forEach((e: any) => {
            if (e.title && !items.some(i => i.title === e.title && i.type === 'event')) {
              items.push({ title: e.title, type: 'event', date: e.date, location: e.location });
            }
          });
        }
        setEventsList(items);

        // Pre-select first item if available
        if (items.length > 0 && !selectedEventKey) {
          setSelectedEventKey(`${items[0].type}:${items[0].title}`);
        }
        if (fetchedRooms.length > 0 && !selectedRoomId) {
          const deskId = data.deskUser?.deskId || '';
          const myRoom = fetchedRooms.find(r => (r.assigned_desk_id || '').toLowerCase() === deskId.toLowerCase());
          if (myRoom) {
            setSelectedRoomId(String(myRoom.id));
          } else {
            setSelectedRoomId(String(fetchedRooms[0].id));
          }
        }
      }

      // Fetch branches for filter
      const branchRes = await fetch(`${API_BASE_URL}/api/branches`);
      if (branchRes.ok) {
        const bData = await branchRes.json();
        if (Array.isArray(bData)) {
          setManagedBranches(bData.map((b: any) => b.name));
        }
      }
    } catch (err: any) {
      console.error('Failed to load assignments metadata:', err);
    }
  };

  // Cross-check & Verify Room Authorization
  const handleVerifyAndConfirm = async () => {
    if (!selectedEventKey) {
      setDialogError('Please select an active Event or Hackathon.');
      return;
    }
    if (!selectedRoomId) {
      setDialogError('Please select a designated Room / Venue.');
      return;
    }

    const [eventType, ...rest] = selectedEventKey.split(':');
    const eventTitle = rest.join(':');

    const chosenRoom = allRooms.find(r => String(r.id) === String(selectedRoomId));
    if (!chosenRoom) {
      setDialogError('Selected room was not found in the directory.');
      return;
    }

    setIsVerifying(true);
    setDialogError('');

    const token = localStorage.getItem('reg_desk_token') || localStorage.getItem('admin_token');

    try {
      // Cross-check against verify-room endpoint
      const res = await fetch(`${API_BASE_URL}/api/reg-desk/verify-room`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          roomId: chosenRoom.id,
          roomCode: chosenRoom.room_code
        })
      });

      const data = await res.json();

      // If unauthorized, block access and display error
      if (!res.ok || !data.authorized) {
        const errMsg = data.error || `Access Denied: You are not authorized to operate Room "${chosenRoom.room_name}" (${chosenRoom.room_code}).`;
        setDialogError(errMsg);
        setIsVerifying(false);
        return; // BLOCK ACCESS
      }

      // Authorization passed!
      setActiveRoom(chosenRoom);
      setActiveEvent({ title: eventTitle, type: eventType as 'hackathon' | 'event' });
      setIsConfirmed(true);
      setShowSelectionDialog(false);
      setDialogError('');

      // Load both Hackathon Registrations and Project Submissions for the selected event
      await loadAllEventData(eventType as 'hackathon' | 'event', eventTitle, true);

    } catch (err: any) {
      console.error('Verification request error:', err);
      setDialogError(err.message || 'Error communicating with authorization server.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Load both Hackathon Registrations and Project Submissions + Event Details
  const loadAllEventData = async (type: 'hackathon' | 'event', eventTitle: string, showSpinner = true) => {
    if (showSpinner) setIsLoading(true);
    setError('');

    const token = localStorage.getItem('reg_desk_token') || localStorage.getItem('admin_token');

    try {
      // 1. Fetch Registrations & Event Details
      const regRes = await fetch(`${API_BASE_URL}/api/reg-desk/participants?type=${type}&name=${encodeURIComponent(eventTitle)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (regRes.ok) {
        const regData = await regRes.json();
        setHackathonRegistrations(regData.participants || []);
        if (regData.eventDetails) {
          setEventDetails(regData.eventDetails);
        }
      }

      // 2. Fetch Project Submissions
      const subRes = await fetch(`${API_BASE_URL}/api/reg-desk/participants?type=submission&name=${encodeURIComponent(eventTitle)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (subRes.ok) {
        const subData = await subRes.json();
        setProjectSubmissions(subData.participants || []);
      }

      setCurrentPage(1);
    } catch (err: any) {
      console.error('Error loading event data:', err);
      setError(err.message || 'Failed to load event data.');
    } finally {
      if (showSpinner) setIsLoading(false);
    }
  };

  // Distinct branches for filter dropdown
  const branchOptions = useMemo(() => {
    const bSet = new Set<string>(managedBranches);
    hackathonRegistrations.forEach(r => {
      const b = r.leader_branch || r.branch;
      if (b && b.trim()) bSet.add(b.trim().toUpperCase());
    });
    projectSubmissions.forEach(s => {
      const b = s.institution;
      if (b && b.trim()) bSet.add(b.trim().toUpperCase());
    });
    return Array.from(bSet).sort();
  }, [managedBranches, hackathonRegistrations, projectSubmissions]);

  // Update Attendance Action
  const handleMarkAttendance = async (participantId: number, targetAttendance: 'present' | 'absent' | 'pending') => {
    if (!activeEvent) return;
    setIsUpdatingId(participantId);
    const token = localStorage.getItem('reg_desk_token') || localStorage.getItem('admin_token');

    // Optimistic UI update
    setHackathonRegistrations(prev => prev.map(p => {
      if (p.id === participantId) {
        return { ...p, attendance: targetAttendance };
      }
      return p;
    }));

    if (selectedParticipant && selectedParticipant.id === participantId) {
      setSelectedParticipant(prev => prev ? { ...prev, attendance: targetAttendance } : null);
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
      if (activeEvent) {
        loadAllEventData(activeEvent.type, activeEvent.title, false);
      }
    } finally {
      setIsUpdatingId(null);
    }
  };

  // Filtered Hackathon Registrations
  const filteredRegistrations = useMemo(() => {
    return hackathonRegistrations.filter(r => {
      // 1. Branch filter
      if (branchFilter !== 'all') {
        const studentBranch = (r.leader_branch || r.branch || '').toUpperCase().trim();
        if (studentBranch !== branchFilter.toUpperCase().trim()) {
          return false;
        }
      }

      // 2. Attendance filter
      if (attendanceFilter !== 'all') {
        const att = (r.attendance || 'pending').toLowerCase();
        if (att !== attendanceFilter) {
          return false;
        }
      }

      // 3. Search query
      if (searchTerm.trim() !== '') {
        const q = searchTerm.toLowerCase().trim();
        const team = (r.team_name || '').toLowerCase();
        const leader = (r.leader_name || r.full_name || '').toLowerCase();
        const email = (r.leader_email || r.email || '').toLowerCase();
        const phone = (r.leader_phone || r.mobile || '').toLowerCase();
        const pin = (r.pin_number || '').toLowerCase();
        const proj = (r.project_title || '').toLowerCase();
        const prob = (r.problem_statement || '').toLowerCase();
        return team.includes(q) || leader.includes(q) || email.includes(q) || phone.includes(q) || pin.includes(q) || proj.includes(q) || prob.includes(q);
      }

      return true;
    });
  }, [hackathonRegistrations, branchFilter, attendanceFilter, searchTerm]);

  // Filtered Project Submissions
  const filteredSubmissions = useMemo(() => {
    return projectSubmissions.filter(s => {
      // 1. Status filter
      if (submissionStatusFilter !== 'all') {
        const st = (s.status || 'submitted').toLowerCase();
        if (st !== submissionStatusFilter.toLowerCase()) {
          return false;
        }
      }

      // 2. Branch / Institution filter
      if (branchFilter !== 'all') {
        const inst = (s.institution || '').toUpperCase().trim();
        if (inst !== branchFilter.toUpperCase().trim()) {
          return false;
        }
      }

      // 3. Search query
      if (searchTerm.trim() !== '') {
        const q = searchTerm.toLowerCase().trim();
        const team = (s.team_name || '').toLowerCase();
        const leader = (s.leader_name || '').toLowerCase();
        const email = (s.leader_email || '').toLowerCase();
        const phone = (s.leader_phone || '').toLowerCase();
        const proj = (s.project_title || '').toLowerCase();
        const prob = (s.problem_statement || '').toLowerCase();
        const file = (s.file_name || '').toLowerCase();
        return team.includes(q) || leader.includes(q) || email.includes(q) || phone.includes(q) || proj.includes(q) || prob.includes(q) || file.includes(q);
      }

      return true;
    });
  }, [projectSubmissions, submissionStatusFilter, branchFilter, searchTerm]);

  // Live Statistics for Registrations
  const regStats = useMemo(() => {
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

  // Live Statistics for Submissions
  const subStats = useMemo(() => {
    const total = filteredSubmissions.length;
    let submitted = 0;
    let approved = 0;
    let rejected = 0;

    filteredSubmissions.forEach(s => {
      const st = (s.status || 'submitted').toLowerCase();
      if (st === 'approved') approved++;
      else if (st === 'rejected') rejected++;
      else submitted++;
    });

    return { total, submitted, approved, rejected };
  }, [filteredSubmissions]);

  // Reset pagination on filter or tab change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeSubTab, searchTerm, branchFilter, attendanceFilter, submissionStatusFilter]);

  // Paginated records
  const paginatedRegistrations = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredRegistrations.slice(start, start + PAGE_SIZE);
  }, [filteredRegistrations, currentPage, PAGE_SIZE]);

  const paginatedSubmissions = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredSubmissions.slice(start, start + PAGE_SIZE);
  }, [filteredSubmissions, currentPage, PAGE_SIZE]);

  const currentTotal = activeSubTab === 'hackathon' ? filteredRegistrations.length : filteredSubmissions.length;
  const totalPages = Math.ceil(currentTotal / PAGE_SIZE);

  // CSV Export Utility
  const handleExportCSV = () => {
    const eventName = activeEvent ? activeEvent.title : 'Event';
    
    if (activeSubTab === 'hackathon') {
      const filename = `${eventName.replace(/[^a-zA-Z0-9]/g, '_')}_Hackathon_Registrations.csv`;
      const headers = [
        'ID',
        'Hackathon Name',
        'Team Name',
        'Project Title',
        'Problem Statement',
        'Leader Name',
        'Leader Email',
        'Leader Phone',
        'Leader Role',
        'Branch',
        'Year',
        'Attendance',
        'Marked By',
        'Status',
        'Registered At'
      ];

      const rows = filteredRegistrations.map(reg => [
        reg.id.toString(),
        activeEvent?.title || reg.hackathon_name || 'Hackathon',
        reg.team_name || 'N/A',
        reg.project_title || 'N/A',
        reg.problem_statement || 'N/A',
        reg.leader_name || 'N/A',
        reg.leader_email || 'N/A',
        reg.leader_phone || 'N/A',
        reg.leader_role || 'Student',
        reg.leader_branch || reg.branch || 'N/A',
        reg.leader_year || reg.year_of_study || 'N/A',
        (reg.attendance || 'pending').toUpperCase(),
        reg.attendance_marked_by || 'N/A',
        reg.status || 'approved',
        reg.created_at ? new Date(reg.created_at).toLocaleString() : 'N/A'
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(val => `"${val.replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
    } else {
      const filename = `${eventName.replace(/[^a-zA-Z0-9]/g, '_')}_Project_Submissions.csv`;
      const headers = [
        'ID',
        'Event Name',
        'Team Name',
        'Leader Name',
        'Leader Email',
        'Leader Phone',
        'Institution',
        'Project Title',
        'Problem Statement',
        'Drive Link',
        'File Name',
        'Status',
        'Submitted At'
      ];

      const rows = filteredSubmissions.map(sub => [
        sub.id.toString(),
        sub.event_name || activeEvent?.title || 'Event',
        sub.team_name,
        sub.leader_name,
        sub.leader_email,
        sub.leader_phone || 'N/A',
        sub.institution || 'N/A',
        sub.project_title,
        sub.problem_statement || 'N/A',
        sub.drive_file_url || 'N/A',
        sub.file_name || 'N/A',
        (sub.status || 'submitted').toUpperCase(),
        sub.created_at ? new Date(sub.created_at).toLocaleString() : 'N/A'
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(val => `"${val.replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
    }
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

      {/* Prominent Active Event Details Overview */}
      {isConfirmed && activeRoom && activeEvent && (
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '1rem 1.25rem',
          marginBottom: '1.25rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
            {/* Event Badge & Name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: '#e0e7ff',
                color: '#4f46e5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Calendar size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Active Event
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>{eventDetails?.eventName || activeEvent.title}</span>
                  <span style={{
                    fontSize: '0.6875rem',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '12px',
                    backgroundColor: '#e0e7ff',
                    color: '#4338ca',
                    fontWeight: 700,
                    textTransform: 'uppercase'
                  }}>
                    {eventDetails?.eventType || activeEvent.type}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ width: '1px', height: '36px', backgroundColor: '#e2e8f0' }} />

            {/* Room Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: '#ecfdf5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <DoorOpen size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Designated Room / Venue
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>{activeRoom.room_name}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', backgroundColor: '#f1f5f9', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                    Code: {activeRoom.room_code}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ width: '1px', height: '36px', backgroundColor: '#e2e8f0' }} />

            {/* Authorized Desk Pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 8px #10b981' }} />
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Authorized Desk
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {deskUserInfo?.deskId || 'REG-DESK'} {activeRoom.assigned_desk_name ? `• ${activeRoom.assigned_desk_name}` : ''}
                </div>
              </div>
            </div>
          </div>

          {/* Switch Room / Event Button */}
          <button
            type="button"
            onClick={() => setShowSelectionDialog(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.5rem 0.95rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: '#f8fafc',
              color: 'var(--text-main)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Change Room or Event"
          >
            <RotateCcw size={14} />
            <span>Switch Room / Event</span>
          </button>
        </div>
      )}

      {/* Main Content Area */}
      {!isConfirmed ? (
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '4rem 2rem',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            backgroundColor: '#e0f2fe',
            color: '#0284c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <DoorOpen size={32} />
          </div>
          <div>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Room & Event Authorization Required
            </h3>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: '440px' }}>
              Please select your designated room and active event in the dialog to cross-check authorization and load participant records.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowSelectionDialog(true)}
            style={{
              marginTop: '0.5rem',
              padding: '0.65rem 1.25rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'var(--primary)',
              color: '#ffffff',
              fontSize: '0.875rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Open Room & Event Dialog
          </button>
        </div>
      ) : (
        <>
          {/* Stats Cards Row */}
          {activeSubTab === 'hackathon' ? (
            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <div className="admin-stat-info">
                  <span>Total Submissions</span>
                  <h2>{regStats.total}</h2>
                </div>
                <div className="admin-stat-icon total">
                  <Layers size={22} />
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-info">
                  <span>Pending Audits</span>
                  <h2>{regStats.pending}</h2>
                </div>
                <div className="admin-stat-icon pending">
                  <Calendar size={22} />
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-info">
                  <span>Approved / Present</span>
                  <h2 style={{ color: '#10b981' }}>{regStats.present}</h2>
                </div>
                <div className="admin-stat-icon approved">
                  <Check size={22} />
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-info">
                  <span>Absent</span>
                  <h2 style={{ color: '#ef4444' }}>{regStats.absent}</h2>
                </div>
                <div className="admin-stat-icon rejected">
                  <X size={22} />
                </div>
              </div>
            </div>
          ) : (
            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <div className="admin-stat-info">
                  <span>Total Submissions</span>
                  <h2>{subStats.total}</h2>
                </div>
                <div className="admin-stat-icon total">
                  <FolderUp size={22} />
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-info">
                  <span>Submitted / Pending</span>
                  <h2>{subStats.submitted}</h2>
                </div>
                <div className="admin-stat-icon pending">
                  <Calendar size={22} />
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-info">
                  <span>Approved Submissions</span>
                  <h2 style={{ color: '#10b981' }}>{subStats.approved}</h2>
                </div>
                <div className="admin-stat-icon approved">
                  <Check size={22} />
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-info">
                  <span>Revision / Rejected</span>
                  <h2 style={{ color: '#ef4444' }}>{subStats.rejected}</h2>
                </div>
                <div className="admin-stat-icon rejected">
                  <X size={22} />
                </div>
              </div>
            </div>
          )}

          {/* Filters & Actions Row */}
          <div className="table-controls">
            <div className="search-filter-box">
              <input
                type="text"
                className="admin-search-input"
                placeholder={activeSubTab === 'hackathon' ? "Search team, leader, pin, email..." : "Search project, title, file, team..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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

              {/* Status Filter Dropdown */}
              {activeSubTab === 'hackathon' ? (
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
              ) : (
                <AdminFilterDropdown
                  value={submissionStatusFilter}
                  onChange={setSubmissionStatusFilter}
                  options={[
                    { value: 'all', label: 'All Submissions' },
                    { value: 'submitted', label: 'Submitted' },
                    { value: 'approved', label: 'Approved' },
                    { value: 'pending', label: 'Pending' }
                  ]}
                  placeholder="All Submissions"
                  minWidth="140px"
                  maxWidth="175px"
                  menuWidth="190px"
                  title="Filter by Submission Status"
                />
              )}
            </div>

            {/* Action Buttons: Refresh & Export */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => {
                  if (activeEvent) {
                    loadAllEventData(activeEvent.type, activeEvent.title, true);
                  }
                }}
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

          {/* Table Container */}
          <div className="admin-table-container hackathons-table">
            {isLoading ? (
              <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Loader2 className="spinner-icon" size={32} style={{ margin: '0 auto 1rem auto', color: 'var(--primary)' }} />
                <p>Loading directory...</p>
              </div>
            ) : activeSubTab === 'hackathon' ? (
              /* Hackathon Registrations Table */
              filteredRegistrations.length === 0 ? (
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
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>{rowNum}</td>
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
                              {activeEvent?.title || reg.hackathon_name || 'Hackathon'}
                            </span>
                            <div><strong>{reg.team_name}</strong></div>
                            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                              Leader: {reg.leader_name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {reg.leader_email} | {formatDisplayPhone(reg.leader_phone)}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)' }}>
                              {reg.leader_role || 'Student'}
                            </div>
                            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                              {reg.leader_branch ? `Branch: ${reg.leader_branch}` : reg.branch ? `Branch: ${reg.branch}` : 'Trinity College'}
                            </div>
                            {(reg.leader_year || reg.year_of_study) && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                                Year: {reg.leader_year || reg.year_of_study} {reg.section ? `(Sec ${reg.section})` : ''}
                              </div>
                            )}
                          </td>
                          <td>
                            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)' }}>
                              {membersCount} Member(s)
                            </div>
                            <button
                              type="button"
                              onClick={() => setSelectedParticipant(reg)}
                              style={{
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                marginTop: '0.25rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                color: 'var(--primary)',
                                cursor: 'pointer'
                              }}
                            >
                              <Eye size={12} />
                              <span>View Details</span>
                            </button>
                          </td>
                          <td>
                            <span style={{
                              display: 'inline-block',
                              padding: '0.25rem 0.6rem',
                              borderRadius: '12px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              backgroundColor: s.bg,
                              color: s.color,
                              border: `1px solid ${s.border}`
                            }}>
                              {s.label}
                            </span>
                            {reg.attendance_marked_by && (
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                By: {reg.attendance_marked_by}
                              </div>
                            )}
                          </td>
                          <td>
                            <span style={{
                              display: 'inline-block',
                              padding: '0.25rem 0.55rem',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              backgroundColor: '#fffbeb',
                              color: '#b45309',
                              border: '1px solid #fef3c7',
                              textTransform: 'uppercase'
                            }}>
                              • {reg.status || 'APPROVED'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                              <button
                                type="button"
                                onClick={() => handleMarkAttendance(reg.id, 'present')}
                                disabled={isUpdating || att === 'present'}
                                style={{
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '6px',
                                  border: '1px solid #10b981',
                                  backgroundColor: att === 'present' ? '#10b981' : '#ffffff',
                                  color: att === 'present' ? '#ffffff' : '#10b981',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: isUpdating || att === 'present' ? 'default' : 'pointer',
                                  opacity: isUpdating ? 0.6 : 1
                                }}
                                title="Mark Present"
                              >
                                <Check size={14} />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleMarkAttendance(reg.id, 'absent')}
                                disabled={isUpdating || att === 'absent'}
                                style={{
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '6px',
                                  border: '1px solid #ef4444',
                                  backgroundColor: att === 'absent' ? '#ef4444' : '#ffffff',
                                  color: att === 'absent' ? '#ffffff' : '#ef4444',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: isUpdating || att === 'absent' ? 'default' : 'pointer',
                                  opacity: isUpdating ? 0.6 : 1
                                }}
                                title="Mark Absent"
                              >
                                <X size={14} />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleMarkAttendance(reg.id, 'pending')}
                                disabled={isUpdating || att === 'pending'}
                                style={{
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '6px',
                                  border: '1px solid #94a3b8',
                                  backgroundColor: att === 'pending' ? '#e2e8f0' : '#ffffff',
                                  color: '#64748b',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: isUpdating || att === 'pending' ? 'default' : 'pointer',
                                  opacity: isUpdating ? 0.6 : 1
                                }}
                                title="Reset Attendance"
                              >
                                <RotateCcw size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )
            ) : (
              /* Project Submissions Table */
              filteredSubmissions.length === 0 ? (
                <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <FolderUp size={40} style={{ margin: '0 auto 1rem auto', opacity: 0.4 }} />
                  <h4 style={{ color: 'var(--text-main)', margin: '0 0 0.5rem 0' }}>No project submissions found for this event</h4>
                  <p style={{ margin: 0, fontSize: '0.875rem' }}>Submissions uploaded for this event will appear here automatically.</p>
                </div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: '45px' }}>#</th>
                      <th>Submission ID / Event</th>
                      <th>Team & Leader Profile</th>
                      <th>Project Title & Problem Statement</th>
                      <th>File & Attachments</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'center', minWidth: '130px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedSubmissions.map((sub, idx) => {
                      const rowNum = (currentPage - 1) * PAGE_SIZE + idx + 1;
                      const refNum = `TCEK/SUB/${String(sub.id).padStart(4, '0')}`;

                      return (
                        <tr key={sub.id}>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>{rowNum}</td>
                          <td>
                            <span style={{
                              fontSize: '0.6875rem',
                              fontWeight: 700,
                              color: '#0891b2',
                              backgroundColor: '#cffafe',
                              padding: '0.125rem 0.375rem',
                              borderRadius: '4px',
                              fontFamily: 'monospace',
                              display: 'inline-block',
                              marginBottom: '0.25rem'
                            }}>
                              {refNum}
                            </span>
                            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--primary)' }}>
                              {sub.event_name}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                              {sub.created_at ? new Date(sub.created_at).toLocaleDateString() : ''}
                            </div>
                          </td>
                          <td>
                            <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{sub.team_name}</strong>
                            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                              Leader: {sub.leader_name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {sub.leader_email} | {formatDisplayPhone(sub.leader_phone)}
                            </div>
                            {sub.institution && (
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                                Inst: {sub.institution}
                              </div>
                            )}
                          </td>
                          <td style={{ maxWidth: '300px' }}>
                            <strong style={{ display: 'block', fontSize: '0.875rem', color: 'var(--primary)', marginBottom: '0.25rem' }}>
                              {sub.project_title}
                            </strong>
                            <div style={{ maxHeight: '50px', overflowY: 'auto', fontSize: '0.775rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                              {sub.problem_statement}
                            </div>
                            <button
                              type="button"
                              onClick={() => setSelectedSubmission(sub)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                padding: '0.2rem 0.5rem',
                                fontSize: '0.72rem',
                                marginTop: '0.35rem',
                                backgroundColor: '#f1f5f9',
                                border: '1px solid #e2e8f0',
                                borderRadius: '4px',
                                color: 'var(--text-main)',
                                cursor: 'pointer',
                                fontWeight: 600
                              }}
                            >
                              <FileText size={11} /> View Full Submission
                            </button>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', alignItems: 'flex-start' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <FolderUp size={13} color="#4f46e5" />
                                {sub.file_name || 'Project File'}
                              </span>
                              {sub.drive_file_url ? (
                                <a
                                  href={sub.drive_file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    fontSize: '0.72rem',
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: '4px',
                                    backgroundColor: 'var(--primary)',
                                    color: '#ffffff',
                                    textDecoration: 'none',
                                    fontWeight: 600
                                  }}
                                >
                                  <ExternalLink size={11} /> Open Drive
                                </a>
                              ) : (
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Registered Abstract</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <span style={{
                              display: 'inline-block',
                              padding: '0.25rem 0.55rem',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              backgroundColor: '#ecfdf5',
                              color: '#047857',
                              border: '1px solid #a7f3d0',
                              textTransform: 'uppercase'
                            }}>
                              • {sub.status || 'SUBMITTED'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => setSelectedSubmission(sub)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                padding: '0.35rem 0.75rem',
                                borderRadius: '6px',
                                border: '1px solid var(--border-color)',
                                backgroundColor: '#ffffff',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                color: 'var(--primary)',
                                cursor: 'pointer'
                              }}
                            >
                              <Eye size={13} />
                              <span>Details</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )
            )}
          </div>

          {/* Sticky Bottom Pagination */}
          <div className="admin-bottom-bar">
            <AdminPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(p) => setCurrentPage(p)}
              totalRecords={currentTotal}
              pageSize={PAGE_SIZE}
              itemName={activeSubTab === 'hackathon' ? 'registrations' : 'submissions'}
            />
          </div>
        </>
      )}

      {/* Mandatory Room & Event Selection Dialog Box */}
      {showSelectionDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '1.25rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '560px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--border-color)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            animation: 'modalSlideIn 0.25s ease-out'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.5rem 1.75rem 1.25rem',
              borderBottom: '1px solid #f1f5f9',
              background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: '#e0f2fe',
                  color: '#0284c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <DoorOpen size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Desk Check-In & Room Assignment
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    Select your designated room and active event to begin attendance verification
                  </p>
                </div>
              </div>

              {/* Desk Identification Pill */}
              <div style={{
                marginTop: '0.75rem',
                padding: '0.5rem 0.85rem',
                borderRadius: '8px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.8125rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Signed in Desk:</span>
                  <strong style={{ color: 'var(--primary)', fontWeight: 700 }}>
                    {deskUserInfo?.deskId || 'REG-DESK'}
                  </strong>
                  {deskUserInfo?.name && (
                    <span style={{ color: 'var(--text-muted)' }}>({deskUserInfo.name})</span>
                  )}
                </div>
                <span style={{
                  fontSize: '0.7rem',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '12px',
                  backgroundColor: deskUserInfo?.role === 'reg_desk' ? '#ecfdf5' : '#e0e7ff',
                  color: deskUserInfo?.role === 'reg_desk' ? '#047857' : '#4338ca',
                  fontWeight: 700,
                  textTransform: 'uppercase'
                }}>
                  {deskUserInfo?.role === 'reg_desk' ? 'Reg Desk Staff' : 'Admin'}
                </span>
              </div>
            </div>

            {/* Modal Form Body */}
            <div style={{ padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Access Error Banner if Verification Fails */}
              {dialogError && (
                <div style={{
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '10px',
                  padding: '0.875rem 1rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  fontSize: '0.845rem',
                  color: '#991b1b'
                }}>
                  <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px', color: '#dc2626' }} />
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: '2px' }}>Access Blocked: Authorization Failed</div>
                    <div>{dialogError}</div>
                  </div>
                </div>
              )}

              {/* 1. Select Event Field (Custom CSS Dropdown) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                  1. Select Event / Hackathon <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div ref={eventDropdownRef} style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEventDropdownOpen(!isEventDropdownOpen);
                      setIsRoomDropdownOpen(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: isEventDropdownOpen ? '1.5px solid #059669' : '1.5px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      fontSize: '0.875rem',
                      color: selectedEvent ? 'var(--text-main)' : '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      boxShadow: isEventDropdownOpen ? '0 0 0 3px rgba(5, 150, 105, 0.12)' : '0 1px 2px rgba(0, 0, 0, 0.04)',
                      transition: 'all 0.15s ease',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', overflow: 'hidden' }}>
                      <Calendar size={16} color={selectedEvent ? '#059669' : '#94a3b8'} style={{ flexShrink: 0 }} />
                      <span style={{ fontWeight: selectedEvent ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {selectedEvent ? selectedEvent.title : '-- Choose Active Event or Hackathon --'}
                      </span>
                      {selectedEvent && (
                        <span style={{
                          fontSize: '0.6875rem',
                          padding: '0.1rem 0.45rem',
                          borderRadius: '10px',
                          backgroundColor: selectedEvent.type === 'hackathon' ? '#e0e7ff' : '#ecfdf5',
                          color: selectedEvent.type === 'hackathon' ? '#4338ca' : '#047857',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          flexShrink: 0
                        }}>
                          {selectedEvent.type}
                        </span>
                      )}
                    </div>
                    <ChevronDown
                      size={16}
                      color="#64748b"
                      style={{
                        transition: 'transform 0.2s ease',
                        transform: isEventDropdownOpen ? 'rotate(180deg)' : 'none',
                        flexShrink: 0,
                        marginLeft: '0.5rem'
                      }}
                    />
                  </button>

                  {/* Custom CSS Dropdown Menu */}
                  {isEventDropdownOpen && (
                    <div style={{
                      position: 'absolute',
                      top: 'calc(100% + 6px)',
                      left: 0,
                      right: 0,
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
                      maxHeight: '260px',
                      overflowY: 'auto',
                      zIndex: 50,
                      padding: '0.35rem'
                    }}>
                      {/* Hackathons Group */}
                      {hackathonsList.length > 0 && (
                        <div>
                          <div style={{
                            fontSize: '0.6875rem',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            color: '#64748b',
                            padding: '0.45rem 0.75rem 0.25rem 0.75rem'
                          }}>
                            Hackathons
                          </div>
                          {hackathonsList.map(e => {
                            const isSelected = selectedEventKey === `hackathon:${e.title}`;
                            return (
                              <div
                                key={`hackathon:${e.title}`}
                                onClick={() => {
                                  setSelectedEventKey(`hackathon:${e.title}`);
                                  setIsEventDropdownOpen(false);
                                  setDialogError('');
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '0.6rem 0.75rem',
                                  borderRadius: '8px',
                                  backgroundColor: isSelected ? '#ecfdf5' : 'transparent',
                                  color: isSelected ? '#047857' : 'var(--text-main)',
                                  fontWeight: isSelected ? 600 : 500,
                                  fontSize: '0.845rem',
                                  cursor: 'pointer',
                                  transition: 'background-color 0.12s ease'
                                }}
                                onMouseEnter={(e) => {
                                  if (!isSelected) e.currentTarget.style.backgroundColor = '#f8fafc';
                                }}
                                onMouseLeave={(e) => {
                                  if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                              >
                                <span>{e.title}</span>
                                {isSelected && <Check size={16} color="#059669" />}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* General Events Group */}
                      {generalEventsList.length > 0 && (
                        <div style={{ marginTop: '0.35rem', paddingTop: '0.35rem', borderTop: '1px solid #f1f5f9' }}>
                          <div style={{
                            fontSize: '0.6875rem',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            color: '#64748b',
                            padding: '0.45rem 0.75rem 0.25rem 0.75rem'
                          }}>
                            General Events
                          </div>
                          {generalEventsList.map(e => {
                            const isSelected = selectedEventKey === `event:${e.title}`;
                            return (
                              <div
                                key={`event:${e.title}`}
                                onClick={() => {
                                  setSelectedEventKey(`event:${e.title}`);
                                  setIsEventDropdownOpen(false);
                                  setDialogError('');
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '0.6rem 0.75rem',
                                  borderRadius: '8px',
                                  backgroundColor: isSelected ? '#ecfdf5' : 'transparent',
                                  color: isSelected ? '#047857' : 'var(--text-main)',
                                  fontWeight: isSelected ? 600 : 500,
                                  fontSize: '0.845rem',
                                  cursor: 'pointer',
                                  transition: 'background-color 0.12s ease'
                                }}
                                onMouseEnter={(e) => {
                                  if (!isSelected) e.currentTarget.style.backgroundColor = '#f8fafc';
                                }}
                                onMouseLeave={(e) => {
                                  if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                              >
                                <span>{e.title} {e.date ? `(${e.date})` : ''}</span>
                                {isSelected && <Check size={16} color="#059669" />}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Select Room Field (Custom CSS Dropdown) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                  2. Select Designated Room <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div ref={roomDropdownRef} style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsRoomDropdownOpen(!isRoomDropdownOpen);
                      setIsEventDropdownOpen(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: isRoomDropdownOpen ? '1.5px solid #059669' : '1.5px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      fontSize: '0.875rem',
                      color: selectedRoomObj ? 'var(--text-main)' : '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      boxShadow: isRoomDropdownOpen ? '0 0 0 3px rgba(5, 150, 105, 0.12)' : '0 1px 2px rgba(0, 0, 0, 0.04)',
                      transition: 'all 0.15s ease',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', overflow: 'hidden' }}>
                      <DoorOpen size={16} color={selectedRoomObj ? '#059669' : '#94a3b8'} style={{ flexShrink: 0 }} />
                      <span style={{ fontWeight: selectedRoomObj ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {selectedRoomObj ? `${selectedRoomObj.room_name} (${selectedRoomObj.room_code})` : '-- Choose Room / Venue --'}
                      </span>
                      {selectedRoomObj && (
                        <span style={{
                          fontSize: '0.6875rem',
                          padding: '0.1rem 0.45rem',
                          borderRadius: '10px',
                          backgroundColor: '#f1f5f9',
                          color: 'var(--text-secondary)',
                          fontWeight: 600,
                          flexShrink: 0
                        }}>
                          {selectedRoomObj.assigned_desk_id ? `Desk: ${selectedRoomObj.assigned_desk_id}` : 'Unassigned'}
                        </span>
                      )}
                    </div>
                    <ChevronDown
                      size={16}
                      color="#64748b"
                      style={{
                        transition: 'transform 0.2s ease',
                        transform: isRoomDropdownOpen ? 'rotate(180deg)' : 'none',
                        flexShrink: 0,
                        marginLeft: '0.5rem'
                      }}
                    />
                  </button>

                  {/* Custom CSS Dropdown Menu */}
                  {isRoomDropdownOpen && (
                    <div style={{
                      position: 'absolute',
                      top: 'calc(100% + 6px)',
                      left: 0,
                      right: 0,
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
                      maxHeight: '260px',
                      overflowY: 'auto',
                      zIndex: 50,
                      padding: '0.35rem'
                    }}>
                      {allRooms.map(r => {
                        const isSelected = selectedRoomId === String(r.id);
                        const isAssignedToCurrent = (r.assigned_desk_id || '').toLowerCase() === (deskUserInfo?.deskId || '').toLowerCase();

                        return (
                          <div
                            key={r.id}
                            onClick={() => {
                              setSelectedRoomId(String(r.id));
                              setIsRoomDropdownOpen(false);
                              setDialogError('');
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '0.65rem 0.75rem',
                              borderRadius: '8px',
                              backgroundColor: isSelected ? '#ecfdf5' : 'transparent',
                              color: isSelected ? '#047857' : 'var(--text-main)',
                              cursor: 'pointer',
                              transition: 'background-color 0.12s ease',
                              gap: '0.5rem'
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) e.currentTarget.style.backgroundColor = '#f8fafc';
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: isSelected ? 700 : 600, fontSize: '0.845rem' }}>
                                {r.room_name} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({r.room_code})</span>
                              </div>
                              <div style={{ fontSize: '0.72rem', color: isAssignedToCurrent ? '#059669' : 'var(--text-muted)', marginTop: '0.15rem' }}>
                                {isAssignedToCurrent ? 'Assigned to your desk' : (r.assigned_desk_name ? `Assigned: ${r.assigned_desk_name}` : (r.assigned_desk_id ? `Assigned: ${r.assigned_desk_id}` : 'Unassigned'))}
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
                              {isAssignedToCurrent && (
                                <span style={{
                                  fontSize: '0.6875rem',
                                  fontWeight: 700,
                                  color: '#059669',
                                  backgroundColor: '#d1fae5',
                                  padding: '0.15rem 0.45rem',
                                  borderRadius: '10px'
                                }}>
                                  Your Desk
                                </span>
                              )}
                              {isSelected && <Check size={16} color="#059669" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'block' }}>
                  The system will cross-check your login against this room assignment before granting access.
                </span>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div style={{
              padding: '1rem 1.75rem',
              backgroundColor: '#f8fafc',
              borderTop: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isConfirmed ? 'space-between' : 'flex-end',
              gap: '0.75rem'
            }}>
              {isConfirmed && (
                <button
                  type="button"
                  onClick={() => setShowSelectionDialog(false)}
                  style={{
                    padding: '0.65rem 1.15rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: '#ffffff',
                    color: 'var(--text-secondary)',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                onClick={handleVerifyAndConfirm}
                disabled={!selectedEventKey || !selectedRoomId || isVerifying}
                style={{
                  padding: '0.65rem 1.5rem',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: (!selectedEventKey || !selectedRoomId || isVerifying) ? '#cbd5e1' : 'var(--primary)',
                  color: '#ffffff',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  cursor: (!selectedEventKey || !selectedRoomId || isVerifying) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                {isVerifying ? (
                  <>
                    <Loader2 size={16} className="spinner-icon" />
                    <span>Verifying Room Access...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    <span>Confirm & Open Desk</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* On-demand Team Details Modal (Hackathon Registrations) */}
      {selectedParticipant && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1.5rem'
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
                  {activeEvent?.title || selectedParticipant.hackathon_name || 'Event'}
                </span>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>
                  Team Details: {selectedParticipant.team_name || selectedParticipant.full_name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedParticipant(null)}
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
              {(selectedParticipant.project_title || selectedParticipant.project_description || selectedParticipant.problem_statement) && (
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
                    {selectedParticipant.project_title && (
                      <div><strong>Project Title:</strong> {selectedParticipant.project_title}</div>
                    )}
                    {selectedParticipant.problem_statement && (
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
                          {selectedParticipant.problem_statement}
                        </div>
                      </div>
                    )}
                    {selectedParticipant.project_description && (
                      <div>
                        <strong>Project Description / Abstract:</strong>
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
                          {selectedParticipant.project_description}
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
                  <div><strong>Name:</strong> {selectedParticipant.leader_name || selectedParticipant.full_name}</div>
                  <div><strong>Role:</strong> {selectedParticipant.leader_role || 'Student'}</div>
                  <div><strong>Email:</strong> {selectedParticipant.leader_email || selectedParticipant.email}</div>
                  <div><strong>Phone:</strong> {formatDisplayPhone(selectedParticipant.leader_phone || selectedParticipant.mobile)}</div>
                  <div><strong>Branch:</strong> {selectedParticipant.leader_branch || selectedParticipant.branch || 'N/A'}</div>
                  <div><strong>Year:</strong> {selectedParticipant.leader_year || selectedParticipant.year_of_study || 'N/A'}</div>
                </div>
              </div>

              {/* Team Members */}
              {selectedParticipant.members && (() => {
                try {
                  const mList = JSON.parse(selectedParticipant.members);
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
            </div>

            {/* Modal Footer */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              borderTop: '1px solid var(--border)',
              padding: '1rem 1.75rem',
              backgroundColor: '#ffffff'
            }}>
              <button
                onClick={() => setSelectedParticipant(null)}
                className="btn btn-primary btn-sm"
                style={{ padding: '0.5rem 1.25rem', fontSize: '0.8125rem', cursor: 'pointer', borderRadius: '0.375rem' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* On-demand Full Project Submission Modal */}
      {selectedSubmission && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1.5rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '660px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-xl)',
            border: '1px solid var(--border)'
          }}>
            {/* Header */}
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
                  color: '#0891b2',
                  backgroundColor: '#cffafe',
                  padding: '0.125rem 0.375rem',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  alignSelf: 'flex-start'
                }}>
                  TCEK/SUB/{String(selectedSubmission.id).padStart(4, '0')}
                </span>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>
                  {selectedSubmission.project_title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="btn btn-secondary btn-sm"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8125rem', cursor: 'pointer', borderRadius: '0.375rem' }}
              >
                Close
              </button>
            </div>

            {/* Scrollable Content */}
            <div style={{
              padding: '1.75rem',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              flex: 1
            }}>
              {/* Problem Statement */}
              <div>
                <h4 style={{
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  color: 'var(--text-main)',
                  marginBottom: '0.75rem',
                  borderBottom: '1px solid var(--border)',
                  paddingBottom: '0.5rem'
                }}>
                  Full Problem Statement
                </h4>
                <div style={{
                  padding: '0.85rem',
                  backgroundColor: 'var(--bg-main)',
                  borderRadius: 'var(--radius-md)',
                  whiteSpace: 'pre-wrap',
                  color: 'var(--text-main)',
                  fontSize: '0.845rem',
                  lineHeight: 1.55,
                  border: '1px solid var(--border)'
                }}>
                  {selectedSubmission.problem_statement}
                </div>
              </div>

              {/* Project Info / Solution Description */}
              {selectedSubmission.project_info && (
                <div>
                  <h4 style={{
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    color: 'var(--text-main)',
                    marginBottom: '0.75rem',
                    borderBottom: '1px solid var(--border)',
                    paddingBottom: '0.5rem'
                  }}>
                    Project Solution & Implementation Info
                  </h4>
                  <div style={{
                    padding: '0.85rem',
                    backgroundColor: 'var(--bg-main)',
                    borderRadius: 'var(--radius-md)',
                    whiteSpace: 'pre-wrap',
                    color: 'var(--text-secondary)',
                    fontSize: '0.8125rem',
                    border: '1px solid var(--border)'
                  }}>
                    {selectedSubmission.project_info}
                  </div>
                </div>
              )}

              {/* Submission Files & Drive Links */}
              <div>
                <h4 style={{
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  color: 'var(--text-main)',
                  marginBottom: '0.75rem',
                  borderBottom: '1px solid var(--border)',
                  paddingBottom: '0.5rem'
                }}>
                  Attachments & Files
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  {selectedSubmission.drive_file_url ? (
                    <a
                      href={selectedSubmission.drive_file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary btn-sm"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontSize: '0.8125rem',
                        padding: '0.5rem 1rem',
                        textDecoration: 'none',
                        borderRadius: '6px'
                      }}
                    >
                      <ExternalLink size={14} /> Open Project in Google Drive
                    </a>
                  ) : (
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      No direct Google Drive link uploaded
                    </span>
                  )}

                  {selectedSubmission.file_name && (
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <FolderUp size={14} /> {selectedSubmission.file_name}
                      {selectedSubmission.file_size ? ` (${(selectedSubmission.file_size / (1024 * 1024)).toFixed(2)} MB)` : ''}
                    </span>
                  )}
                </div>
              </div>

              {/* Team Profile */}
              <div>
                <h4 style={{
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  color: 'var(--text-main)',
                  marginBottom: '0.75rem',
                  borderBottom: '1px solid var(--border)',
                  paddingBottom: '0.5rem'
                }}>
                  Team Information
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.875rem' }}>
                  <div><strong>Team Name:</strong> {selectedSubmission.team_name}</div>
                  <div><strong>Leader Name:</strong> {selectedSubmission.leader_name}</div>
                  <div><strong>Leader Email:</strong> {selectedSubmission.leader_email}</div>
                  <div><strong>Leader Phone:</strong> {formatDisplayPhone(selectedSubmission.leader_phone)}</div>
                  {selectedSubmission.institution && (
                    <div style={{ gridColumn: 'span 2' }}>
                      <strong>Institution:</strong> {selectedSubmission.institution}
                    </div>
                  )}
                </div>
              </div>

              {/* Members List */}
              {selectedSubmission.members && (() => {
                try {
                  const mList = JSON.parse(selectedSubmission.members);
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
            </div>

            {/* Footer */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              borderTop: '1px solid var(--border)',
              padding: '1rem 1.75rem',
              backgroundColor: '#ffffff'
            }}>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="btn btn-primary btn-sm"
                style={{ padding: '0.5rem 1.25rem', fontSize: '0.8125rem', cursor: 'pointer', borderRadius: '0.375rem' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
