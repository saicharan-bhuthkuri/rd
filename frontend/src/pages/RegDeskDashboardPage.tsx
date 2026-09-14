import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { 
  ClipboardCheck, 
  LogOut, 
  Check, 
  X, 
  RotateCcw, 
  Search, 
  Users, 
  UserCheck, 
  UserX, 
  DoorOpen, 
  Calendar, 
  ArrowUpDown, 
  Loader2, 
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { AdminPagination } from '../components/AdminPagination';

interface DeskUser {
  id?: number;
  deskId: string;
  name: string;
  email?: string;
  role?: string;
}

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

interface EventOption {
  title: string;
  date?: string;
  location?: string;
}

interface ParticipantRecord {
  id: number;
  full_name?: string;
  team_name?: string;
  leader_name?: string;
  leader_email?: string;
  leader_phone?: string;
  leader_branch?: string;
  leader_year?: string;
  pin_number?: string;
  email?: string;
  mobile?: string;
  branch?: string;
  year_of_study?: string;
  section?: string;
  event_name?: string;
  hackathon_name?: string;
  members?: string;
  project_title?: string;
  attendance?: 'present' | 'absent' | 'pending';
  attendance_marked_by?: string;
  attendance_marked_at?: string;
  room_code?: string;
}

interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
  pending: number;
  branches: { name: string; count: number }[];
}

export const RegDeskDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  // Auth User state
  const [deskUser, setDeskUser] = useState<DeskUser>(() => {
    try {
      const saved = localStorage.getItem('reg_desk_user');
      return saved ? JSON.parse(saved) : { deskId: '', name: '' };
    } catch {
      return { deskId: '', name: '' };
    }
  });

  // Assignments & Event selection states
  const [assignedRooms, setAssignedRooms] = useState<Room[]>([]);
  const [eventsList, setEventsList] = useState<EventOption[]>([]);
  const [hackathonsList, setHackathonsList] = useState<EventOption[]>([]);
  
  const [selectedType, setSelectedType] = useState<'hackathon' | 'event'>('hackathon');
  const [selectedEventName, setSelectedEventName] = useState<string>('');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isEventConfirmed, setIsEventConfirmed] = useState<boolean>(false);
  const [showEventSelectorModal, setShowEventSelectorModal] = useState<boolean>(false);

  // Participant list & stats states
  const [participants, setParticipants] = useState<ParticipantRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats>({
    total: 0,
    present: 0,
    absent: 0,
    pending: 0,
    branches: []
  });

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'present' | 'absent' | 'pending'>('all');
  
  // Loading & Updating
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdatingId, setIsUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;

  // Check auth on mount
  useEffect(() => {
    const token = localStorage.getItem('reg_desk_token');
    if (!token) {
      navigate('/reg-desk/login');
      return;
    }
    fetchAssignments();
  }, []);

  // Fetch desk user's assigned rooms and all events
  const fetchAssignments = async () => {
    const token = localStorage.getItem('reg_desk_token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/reg-desk/assignments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          handleLogout();
          return;
        }
        throw new Error('Failed to load assignments.');
      }
      const data = await res.json();
      setAssignedRooms(data.assignedRooms || []);
      setEventsList(data.events || []);
      setHackathonsList(data.hackathons || []);

      if (data.deskUser) {
        setDeskUser(data.deskUser);
      }

      // Auto-select initial assignment if available
      if (data.assignedRooms && data.assignedRooms.length > 0) {
        const firstRoom = data.assignedRooms[0];
        setSelectedRoom(firstRoom);
        setSelectedType(firstRoom.event_type);
        setSelectedEventName(firstRoom.event_name);
        setIsEventConfirmed(true);
      } else if (data.hackathons && data.hackathons.length > 0) {
        setSelectedType('hackathon');
        setSelectedEventName(data.hackathons[0].title);
        setIsEventConfirmed(true);
      } else if (data.events && data.events.length > 0) {
        setSelectedType('event');
        setSelectedEventName(data.events[0].title);
        setIsEventConfirmed(true);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Fetch participants when selected event changes or is confirmed
  const fetchParticipants = async () => {
    if (!selectedEventName) return;
    setIsLoading(true);
    setError('');

    const token = localStorage.getItem('reg_desk_token');
    try {
      const url = `${API_BASE_URL}/api/reg-desk/participants?type=${selectedType}&name=${encodeURIComponent(selectedEventName)}`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error('Failed to load participants list.');
      }

      const data = await res.json();
      setParticipants(data.participants || []);
      setStats(data.stats || {
        total: 0,
        present: 0,
        absent: 0,
        pending: 0,
        branches: []
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isEventConfirmed && selectedEventName) {
      fetchParticipants();
    }
  }, [isEventConfirmed, selectedType, selectedEventName]);

  // Real-time SSE listener
  useEffect(() => {
    const handleSync = (e: Event) => {
      const eventType = (e as CustomEvent).detail;
      if (eventType === 'REFRESH_ATTENDANCE' && isEventConfirmed && selectedEventName) {
        fetchParticipants();
      }
    };
    window.addEventListener('app-sync', handleSync);
    return () => window.removeEventListener('app-sync', handleSync);
  }, [isEventConfirmed, selectedEventName]);

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('reg_desk_token');
    localStorage.removeItem('reg_desk_user');
    navigate('/reg-desk/login');
  };

  // Update Attendance Action
  const handleMarkAttendance = async (participantId: number, targetAttendance: 'present' | 'absent' | 'pending') => {
    setIsUpdatingId(participantId);
    const token = localStorage.getItem('reg_desk_token');

    // Optimistic UI update
    setParticipants(prev => prev.map(p => {
      if (p.id === participantId) {
        return { ...p, attendance: targetAttendance };
      }
      return p;
    }));

    // Optimistic stats update
    setStats(prev => {
      const prevParticipant = participants.find(p => p.id === participantId);
      const oldAtt = (prevParticipant?.attendance || 'pending').toLowerCase();
      const newAtt = targetAttendance.toLowerCase();

      if (oldAtt === newAtt) return prev;

      let nextPresent = prev.present;
      let nextAbsent = prev.absent;
      let nextPending = prev.pending;

      if (oldAtt === 'present') nextPresent--;
      else if (oldAtt === 'absent') nextAbsent--;
      else nextPending--;

      if (newAtt === 'present') nextPresent++;
      else if (newAtt === 'absent') nextAbsent++;
      else nextPending++;

      return {
        ...prev,
        present: Math.max(0, nextPresent),
        absent: Math.max(0, nextAbsent),
        pending: Math.max(0, nextPending)
      };
    });

    try {
      const res = await fetch(`${API_BASE_URL}/api/reg-desk/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: selectedType,
          id: participantId,
          attendance: targetAttendance
        })
      });

      if (!res.ok) {
        throw new Error('Failed to record attendance on server.');
      }

      await res.json();
      setSuccessToast(`Attendance updated to ${targetAttendance.toUpperCase()}`);
      setTimeout(() => setSuccessToast(''), 2500);
    } catch (err: any) {
      setError(err.message || 'Error updating attendance.');
      // Re-fetch to sync state if network/server failed
      fetchParticipants();
    } finally {
      setIsUpdatingId(null);
    }
  };

  // Filtered participants list
  const filteredParticipants = useMemo(() => {
    return participants.filter(p => {
      // 1. Attendance filter
      const pAtt = (p.attendance || 'pending').toLowerCase();
      if (attendanceFilter !== 'all' && pAtt !== attendanceFilter) {
        return false;
      }

      // 2. Branch filter
      const pBranch = (p.leader_branch || p.branch || '').toUpperCase().trim();
      if (branchFilter !== 'all' && pBranch !== branchFilter.toUpperCase().trim()) {
        return false;
      }

      // 3. Search query
      if (searchTerm.trim() !== '') {
        const q = searchTerm.toLowerCase().trim();
        const team = (p.team_name || '').toLowerCase();
        const leader = (p.leader_name || '').toLowerCase();
        const name = (p.full_name || '').toLowerCase();
        const pin = (p.pin_number || '').toLowerCase();
        const email = (p.leader_email || p.email || '').toLowerCase();
        const phone = (p.leader_phone || p.mobile || '').toLowerCase();
        const proj = (p.project_title || '').toLowerCase();
        return team.includes(q) || leader.includes(q) || name.includes(q) || pin.includes(q) || email.includes(q) || phone.includes(q) || proj.includes(q);
      }

      return true;
    });
  }, [participants, attendanceFilter, branchFilter, searchTerm]);

  // Reset pagination on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, branchFilter, attendanceFilter]);

  // Paginated participants
  const paginatedParticipants = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredParticipants.slice(start, start + PAGE_SIZE);
  }, [filteredParticipants, currentPage, PAGE_SIZE]);

  const totalPages = Math.ceil(filteredParticipants.length / PAGE_SIZE);

  // Distinct branches for dropdown
  const branchOptions = useMemo(() => {
    const set = new Set<string>();
    participants.forEach(p => {
      const b = (p.leader_branch || p.branch || '').trim();
      if (b) set.add(b.toUpperCase());
    });
    return Array.from(set).sort();
  }, [participants]);

  return (
    <div style={{ minHeight: 'calc(100vh / 0.9)', backgroundColor: 'var(--bg-main, #f8fafc)', color: 'var(--text-main, #0f172a)', display: 'flex', flexDirection: 'column' }}>
      {/* Top Professional Sticky Header */}
      <header style={{ backgroundColor: 'var(--bg-card, #ffffff)', borderBottom: '1px solid var(--border, #e2e8f0)', padding: '0.85rem 1.5rem', position: 'sticky', top: 0, zIndex: 40, boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          
          {/* Brand & Desk ID */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '2.5rem', height: '2.5rem', backgroundColor: 'var(--primary)', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', boxShadow: 'var(--shadow-primary)' }}>
              <ClipboardCheck size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>Registration Desk</span>
                <span style={{ fontSize: '0.75rem', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
                  {deskUser.deskId || 'ACTIVE'}
                </span>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Coordinator: <strong style={{ color: 'var(--text-main)' }}>{deskUser.name || 'Desk Team'}</strong>
              </span>
            </div>
          </div>

          {/* Assigned Room & Event Info Banner */}
          {isEventConfirmed && selectedEventName && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: 'var(--bg-subtle, #f1f5f9)', padding: '0.4rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border, #e2e8f0)', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.825rem' }}>
                <Calendar size={15} color="var(--primary)" />
                <span style={{ color: 'var(--text-muted)' }}>Event:</span>
                <strong style={{ color: 'var(--text-main)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selectedEventName}
                </strong>
              </div>

              <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--border)' }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.825rem' }}>
                <DoorOpen size={15} color="var(--primary)" />
                <span style={{ color: 'var(--text-muted)' }}>Room:</span>
                <strong style={{ color: 'var(--text-main)' }}>
                  {selectedRoom ? `${selectedRoom.room_code} - ${selectedRoom.room_name}` : 'Main Desk'}
                </strong>
              </div>

              <button
                onClick={() => setShowEventSelectorModal(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px',
                  backgroundColor: 'var(--primary-light)',
                  transition: 'background-color 0.2s'
                }}
              >
                Switch Event / Room
              </button>
            </div>
          )}

          {/* Right Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: '#fef2f2',
                color: '#ef4444',
                border: '1px solid #fecaca',
                padding: '0.45rem 0.85rem',
                borderRadius: '0.4rem',
                fontSize: '0.825rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <LogOut size={15} /> Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ maxWidth: '1440px', width: '100%', margin: '0 auto', padding: '1.5rem', flex: 1 }}>
        
        {/* Error notification banner */}
        {error && (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '0.85rem 1.25rem', borderRadius: '0.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldAlert size={18} />
              <span>{error}</span>
            </div>
            <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer' }}>
              <X size={16} />
            </button>
          </div>
        )}

        {/* Success Toast */}
        {successToast && (
          <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', backgroundColor: 'var(--primary)', border: '1px solid var(--primary-hover)', color: '#ffffff', padding: '0.75rem 1.25rem', borderRadius: '0.5rem', zIndex: 100, boxShadow: 'var(--shadow-lg)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 600, animation: 'fadeIn 0.2s' }}>
            <Check size={18} /> {successToast}
          </div>
        )}

        {/* If no event is confirmed or event selector modal is open */}
        {(!isEventConfirmed || showEventSelectorModal) && (
          <div style={{
            position: isEventConfirmed ? 'fixed' : 'static',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: isEventConfirmed ? 'rgba(15, 23, 42, 0.5)' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 50, padding: '1.5rem'
          }}>
            <div style={{
              backgroundColor: 'var(--bg-card, #ffffff)',
              border: '1px solid var(--border, #e2e8f0)',
              borderRadius: '1rem',
              maxWidth: '520px',
              width: '100%',
              padding: '2rem',
              boxShadow: 'var(--shadow-xl)',
              color: 'var(--text-main, #0f172a)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Calendar size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>Select Event / Hackathon</h3>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Choose the session you are managing attendance for</p>
                  </div>
                </div>
                {isEventConfirmed && (
                  <button onClick={() => setShowEventSelectorModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <X size={20} />
                  </button>
                )}
              </div>

              {/* Event Type selector toggle */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedType('hackathon');
                    if (hackathonsList.length > 0) setSelectedEventName(hackathonsList[0].title);
                  }}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: '1px solid',
                    borderColor: selectedType === 'hackathon' ? 'var(--primary)' : 'var(--border)',
                    backgroundColor: selectedType === 'hackathon' ? 'var(--primary-light)' : 'var(--bg-main)',
                    color: selectedType === 'hackathon' ? 'var(--primary)' : 'var(--text-secondary)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Sparkles size={16} /> Hackathons ({hackathonsList.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedType('event');
                    if (eventsList.length > 0) setSelectedEventName(eventsList[0].title);
                  }}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: '1px solid',
                    borderColor: selectedType === 'event' ? 'var(--primary)' : 'var(--border)',
                    backgroundColor: selectedType === 'event' ? 'var(--primary-light)' : 'var(--bg-main)',
                    color: selectedType === 'event' ? 'var(--primary)' : 'var(--text-secondary)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Calendar size={16} /> Events / Workshops ({eventsList.length})
                </button>
              </div>

              {/* Event dropdown */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Choose {selectedType === 'hackathon' ? 'Hackathon' : 'Event'} Name
                </label>
                <select
                  value={selectedEventName}
                  onChange={(e) => setSelectedEventName(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--bg-main)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-main)',
                    borderRadius: '0.5rem',
                    padding: '0.75rem 1rem',
                    fontSize: '0.9rem',
                    cursor: 'pointer'
                  }}
                >
                  <option value="" disabled>-- Select an option --</option>
                  {(selectedType === 'hackathon' ? hackathonsList : eventsList).map((opt, idx) => (
                    <option key={idx} value={opt.title}>
                      {opt.title} {opt.date ? `(${opt.date})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Room assignment selection (optional) */}
              <div style={{ marginBottom: '1.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Assigned Room (Optional)
                </label>
                <select
                  value={selectedRoom?.id || ''}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    const matched = assignedRooms.find(r => r.id === id) || null;
                    setSelectedRoom(matched);
                  }}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--bg-main)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-main)',
                    borderRadius: '0.5rem',
                    padding: '0.75rem 1rem',
                    fontSize: '0.9rem',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">General Check-In (All Rooms / Main Desk)</option>
                  {assignedRooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.room_code} - {r.room_name} ({r.event_name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Continue button */}
              <button
                type="button"
                disabled={!selectedEventName}
                onClick={() => {
                  setIsEventConfirmed(true);
                  setShowEventSelectorModal(false);
                }}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '0.8rem',
                  fontWeight: 700,
                  fontSize: '1rem',
                  borderRadius: '0.5rem',
                  cursor: !selectedEventName ? 'not-allowed' : 'pointer',
                  opacity: !selectedEventName ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                Continue to Participant Attendance &rarr;
              </button>
            </div>
          </div>
        )}

        {/* Active Participant Attendance Interface */}
        {isEventConfirmed && selectedEventName && (
          <div>
            {/* Top Live Statistics Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              
              {/* Total Registered Card */}
              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: 'var(--shadow-sm)' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Total Participants
                  </span>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-main)', marginTop: '0.25rem' }}>
                    {stats.total}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Registered for session</span>
                </div>
                <div style={{ width: '3rem', height: '3rem', borderRadius: '0.75rem', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={24} />
                </div>
              </div>

              {/* Present (Checked-in) Card */}
              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid #bbf7d0', borderRadius: '0.75rem', padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: 'var(--shadow-sm)' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Present (Checked In)
                  </span>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: '#059669', marginTop: '0.25rem' }}>
                    {stats.present}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#10b981' }}>
                    {stats.total > 0 ? `${Math.round((stats.present / stats.total) * 100)}% Attendance` : '0%'}
                  </span>
                </div>
                <div style={{ width: '3rem', height: '3rem', borderRadius: '0.75rem', backgroundColor: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserCheck size={24} />
                </div>
              </div>

              {/* Absent Card */}
              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid #fecaca', borderRadius: '0.75rem', padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: 'var(--shadow-sm)' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Absent
                  </span>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: '#dc2626', marginTop: '0.25rem' }}>
                    {stats.absent}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>
                    {stats.total > 0 ? `${Math.round((stats.absent / stats.total) * 100)}% Absent` : '0%'}
                  </span>
                </div>
                <div style={{ width: '3rem', height: '3rem', borderRadius: '0.75rem', backgroundColor: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserX size={24} />
                </div>
              </div>

              {/* Unmarked / Pending Card */}
              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: 'var(--shadow-sm)' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Unmarked / Pending
                  </span>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-main)', marginTop: '0.25rem' }}>
                    {stats.pending}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Awaiting check-in</span>
                </div>
                <div style={{ width: '3rem', height: '3rem', borderRadius: '0.75rem', backgroundColor: 'var(--bg-subtle)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ArrowUpDown size={24} />
                </div>
              </div>
            </div>

            {/* Branch Summary Pills */}
            {stats.branches && stats.branches.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem', backgroundColor: 'var(--bg-card)', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Branches:
                </span>
                {stats.branches.map((b, idx) => (
                  <button
                    key={idx}
                    onClick={() => setBranchFilter(branchFilter === b.name ? 'all' : b.name)}
                    style={{
                      border: '1px solid',
                      borderColor: branchFilter === b.name ? 'var(--primary)' : 'var(--border)',
                      backgroundColor: branchFilter === b.name ? 'var(--primary)' : 'var(--bg-subtle)',
                      color: branchFilter === b.name ? '#ffffff' : 'var(--text-secondary)',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '999px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <span>{b.name}</span>
                    <span style={{ opacity: 0.85, fontSize: '0.7rem' }}>({b.count})</span>
                  </button>
                ))}
              </div>
            )}

            {/* Filter & Fast Search Bar */}
            <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between', boxShadow: 'var(--shadow-sm)' }}>
              
              {/* Quick Search Input */}
              <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: '480px' }}>
                <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Quick check-in: Name, PIN/Roll No, Team, Email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--bg-main)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-main)',
                    borderRadius: '0.5rem',
                    padding: '0.6rem 2.25rem 0.6rem 2.5rem',
                    fontSize: '0.875rem'
                  }}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Attendance Filter Tabs */}
              <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--bg-subtle)', padding: '0.25rem', borderRadius: '0.5rem', border: '1px solid var(--border)', gap: '0.25rem' }}>
                <button
                  type="button"
                  onClick={() => setAttendanceFilter('all')}
                  style={{
                    backgroundColor: attendanceFilter === 'all' ? 'var(--bg-card)' : 'transparent',
                    color: attendanceFilter === 'all' ? 'var(--text-main)' : 'var(--text-muted)',
                    border: 'none',
                    padding: '0.4rem 0.75rem',
                    borderRadius: '0.35rem',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: attendanceFilter === 'all' ? 'var(--shadow-sm)' : 'none'
                  }}
                >
                  All ({stats.total})
                </button>
                <button
                  type="button"
                  onClick={() => setAttendanceFilter('present')}
                  style={{
                    backgroundColor: attendanceFilter === 'present' ? '#ecfdf5' : 'transparent',
                    color: attendanceFilter === 'present' ? '#059669' : 'var(--text-muted)',
                    border: 'none',
                    padding: '0.4rem 0.75rem',
                    borderRadius: '0.35rem',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Present ({stats.present})
                </button>
                <button
                  type="button"
                  onClick={() => setAttendanceFilter('absent')}
                  style={{
                    backgroundColor: attendanceFilter === 'absent' ? '#fef2f2' : 'transparent',
                    color: attendanceFilter === 'absent' ? '#dc2626' : 'var(--text-muted)',
                    border: 'none',
                    padding: '0.4rem 0.75rem',
                    borderRadius: '0.35rem',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Absent ({stats.absent})
                </button>
                <button
                  type="button"
                  onClick={() => setAttendanceFilter('pending')}
                  style={{
                    backgroundColor: attendanceFilter === 'pending' ? 'var(--bg-card)' : 'transparent',
                    color: attendanceFilter === 'pending' ? 'var(--text-secondary)' : 'var(--text-muted)',
                    border: 'none',
                    padding: '0.4rem 0.75rem',
                    borderRadius: '0.35rem',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Pending ({stats.pending})
                </button>
              </div>

              {/* Branch Filter Dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <select
                  value={branchFilter}
                  onChange={(e) => setBranchFilter(e.target.value)}
                  style={{
                    backgroundColor: 'var(--bg-main)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-main)',
                    borderRadius: '0.5rem',
                    padding: '0.55rem 0.85rem',
                    fontSize: '0.825rem',
                    cursor: 'pointer'
                  }}
                >
                  <option value="all">All Branches</option>
                  {branchOptions.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>

                <button
                  onClick={fetchParticipants}
                  title="Refresh List"
                  style={{
                    backgroundColor: 'var(--bg-main)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-muted)',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <RotateCcw size={15} />
                </button>
              </div>
            </div>

            {/* Attendance Data Table */}
            <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '0.75rem', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              {isLoading ? (
                <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Loader2 className="spinner-icon" size={32} style={{ margin: '0 auto 1rem auto', color: 'var(--primary)' }} />
                  <p>Loading registered participants list...</p>
                </div>
              ) : filteredParticipants.length === 0 ? (
                <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Users size={40} style={{ margin: '0 auto 1rem auto', opacity: 0.4 }} />
                  <h4 style={{ color: 'var(--text-main)', margin: '0 0 0.5rem 0' }}>No participants match criteria</h4>
                  <p style={{ margin: 0, fontSize: '0.875rem' }}>Try modifying your search query, branch filter, or attendance status.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                        <th style={{ padding: '0.85rem 1.25rem' }}>Participant / Team</th>
                        <th style={{ padding: '0.85rem 1.25rem' }}>Branch</th>
                        <th style={{ padding: '0.85rem 1.25rem' }}>Contact Info</th>
                        <th style={{ padding: '0.85rem 1.25rem' }}>Status</th>
                        <th style={{ padding: '0.85rem 1.25rem', textAlign: 'center' }}>Mark Attendance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedParticipants.map((p) => {
                        const att = (p.attendance || 'pending').toLowerCase();
                        const isUpdating = isUpdatingId === p.id;
                        const isPresent = att === 'present';
                        const isAbsent = att === 'absent';
                        const isPending = att === 'pending';

                        const participantTitle = selectedType === 'hackathon' 
                          ? (p.team_name || p.leader_name || 'Unnamed Team')
                          : (p.full_name || 'Participant');

                        const branchDisplay = p.leader_branch || p.branch || '—';

                        return (
                          <tr 
                            key={p.id}
                            style={{ 
                              borderBottom: '1px solid var(--border-light, #f1f5f9)', 
                              backgroundColor: isPresent ? 'rgba(16, 185, 129, 0.04)' : isAbsent ? 'rgba(239, 68, 68, 0.04)' : 'transparent',
                              transition: 'background-color 0.15s'
                            }}
                          >
                            {/* Participant / Team */}
                            <td style={{ padding: '1rem 1.25rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <strong style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>{participantTitle}</strong>
                                {selectedType === 'hackathon' && p.leader_name && (
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    (Leader: {p.leader_name})
                                  </span>
                                )}
                              </div>
                              {p.pin_number && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                                  PIN: <span style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{p.pin_number}</span>
                                </div>
                              )}
                              {selectedType === 'hackathon' && p.project_title && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: '0.2rem', maxWidth: '340px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                                  Project: {p.project_title}
                                </div>
                              )}
                            </td>

                            {/* Branch */}
                            <td style={{ padding: '1rem 1.25rem' }}>
                              <span style={{ 
                                backgroundColor: 'var(--bg-subtle)', 
                                border: '1px solid var(--border)', 
                                padding: '0.25rem 0.5rem', 
                                borderRadius: '4px', 
                                fontWeight: 700, 
                                fontSize: '0.8rem',
                                color: 'var(--text-main)'
                              }}>
                                {branchDisplay}
                              </span>
                              {p.year_of_study && (
                                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                  Year {p.year_of_study}
                                </div>
                              )}
                            </td>

                            {/* Contact Info */}
                            <td style={{ padding: '1rem 1.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              <div>{p.leader_email || p.email || '—'}</div>
                              <div style={{ color: 'var(--text-muted)', marginTop: '0.15rem' }}>{p.leader_phone || p.mobile || '—'}</div>
                            </td>

                            {/* Current Attendance Status Badge */}
                            <td style={{ padding: '1rem 1.25rem' }}>
                              {isPresent ? (
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  backgroundColor: '#ecfdf5',
                                  border: '1px solid #a7f3d0',
                                  color: '#059669',
                                  padding: '0.3rem 0.65rem',
                                  borderRadius: '999px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700
                                }}>
                                  <Check size={13} /> PRESENT
                                </span>
                              ) : isAbsent ? (
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  backgroundColor: '#fef2f2',
                                  border: '1px solid #fecaca',
                                  color: '#dc2626',
                                  padding: '0.3rem 0.65rem',
                                  borderRadius: '999px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700
                                }}>
                                  <X size={13} /> ABSENT
                                </span>
                              ) : (
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  backgroundColor: 'var(--bg-subtle)',
                                  border: '1px solid var(--border)',
                                  color: 'var(--text-muted)',
                                  padding: '0.3rem 0.65rem',
                                  borderRadius: '999px',
                                  fontSize: '0.75rem',
                                  fontWeight: 600
                                }}>
                                  PENDING
                                </span>
                              )}
                            </td>

                            {/* One-Click Action Buttons */}
                            <td style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                                {/* Present Button */}
                                <button
                                  type="button"
                                  disabled={isUpdating || isPresent}
                                  onClick={() => handleMarkAttendance(p.id, 'present')}
                                  title="Mark as Present"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    padding: '0.4rem 0.75rem',
                                    borderRadius: '0.4rem',
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    cursor: isPresent ? 'default' : 'pointer',
                                    border: '1px solid',
                                    borderColor: 'var(--primary)',
                                    backgroundColor: isPresent ? 'var(--primary)' : 'var(--primary-light)',
                                    color: isPresent ? '#ffffff' : 'var(--primary)',
                                    transition: 'all 0.15s'
                                  }}
                                >
                                  <Check size={14} /> Present
                                </button>

                                {/* Absent Button */}
                                <button
                                  type="button"
                                  disabled={isUpdating || isAbsent}
                                  onClick={() => handleMarkAttendance(p.id, 'absent')}
                                  title="Mark as Absent"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    padding: '0.4rem 0.75rem',
                                    borderRadius: '0.4rem',
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    cursor: isAbsent ? 'default' : 'pointer',
                                    border: '1px solid #ef4444',
                                    backgroundColor: isAbsent ? '#ef4444' : '#fef2f2',
                                    color: isAbsent ? '#ffffff' : '#ef4444',
                                    transition: 'all 0.15s'
                                  }}
                                >
                                  <X size={14} /> Absent
                                </button>

                                {/* Reset Button */}
                                <button
                                  type="button"
                                  disabled={isUpdating || isPending}
                                  onClick={() => handleMarkAttendance(p.id, 'pending')}
                                  title="Reset Attendance"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    padding: '0.4rem 0.55rem',
                                    borderRadius: '0.4rem',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    cursor: isPending ? 'not-allowed' : 'pointer',
                                    border: '1px solid var(--border)',
                                    backgroundColor: 'var(--bg-subtle)',
                                    color: isPending ? 'var(--text-muted)' : 'var(--text-secondary)',
                                    opacity: isPending ? 0.5 : 1,
                                    transition: 'all 0.15s'
                                  }}
                                >
                                  <RotateCcw size={12} /> Reset
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Bottom Pagination */}
              <AdminPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalRecords={filteredParticipants.length}
                pageSize={PAGE_SIZE}
                onPageChange={(page) => setCurrentPage(page)}
                itemName="participants"
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
