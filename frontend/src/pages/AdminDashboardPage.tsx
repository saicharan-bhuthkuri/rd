import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { AdminLayout } from '../components/AdminLayout';
import { formatDisplayPhone } from '../utils/phone';
import { Download, Check, X, Layers, Calendar, Mail, Loader2, Eye, Award, HeartHandshake, FolderUp, ExternalLink, FileText, Trash2, AlertCircle } from 'lucide-react';
import { AdminFilterDropdown } from '../components/AdminFilterDropdown';
import { AdminPagination } from '../components/AdminPagination';

interface ProjectSubmission {
  id: number;
  hackathon_registration_id?: number;
  event_name: string;
  team_name: string;
  leader_name: string;
  leader_email: string;
  leader_phone: string;
  institution?: string;
  members?: string;
  project_title: string;
  project_info: string;
  problem_statement: string;
  drive_file_id?: string;
  drive_file_url?: string;
  drive_folder_id?: string;
  drive_folder_url?: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  status: 'pending' | 'approved' | 'rejected' | 'submitted';
  created_at: string;
}

interface VolunteerApplication {
  id: number;
  full_name: string;
  pin_number: string;
  email: string;
  mobile: string;
  branch: string;
  year_of_study: string;
  event_name: string;
  volunteer_role: string;
  skills: string;
  past_experience?: string;
  availability: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  certificate_sent?: number;
  certificate_id?: string;
  created_at: string;
}

interface RecognitionApplication {
  id: number;
  full_name: string;
  email: string;
  mobile: string;
  designation: string;
  organization: string;
  event_name: string;
  event_date: string;
  domain_expertise?: string;
  experience_years?: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  certificate_sent?: number;
  certificate_id?: string;
  created_at: string;
}

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
  status: string;
  certificate_sent?: number;
  certificate_id?: string;
  attendance?: 'present' | 'absent' | 'pending';
  attendance_marked_by?: string;
  attendance_marked_at?: string;
  room_code?: string;
  created_at: string;
}

interface HackathonRegistration {
  id: number;
  hackathon_name?: string;
  team_name: string;
  project_title: string;
  project_description: string;
  problem_statement: string;
  leader_name: string;
  leader_email: string;
  leader_phone: string;
  leader_role: string;
  leader_year?: string;
  leader_branch?: string;
  leader_institution?: string;
  leader_company?: string;
  leader_job_title?: string;
  members: string; // JSON string
  status: 'pending' | 'approved' | 'rejected';
  certificate_sent?: number;
  certificate_type?: string;
  attendance?: 'present' | 'absent' | 'pending';
  attendance_marked_by?: string;
  attendance_marked_at?: string;
  room_code?: string;
  created_at: string;
}

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = location.pathname.includes('/events') ? 'event' 
    : location.pathname.includes('/hackathons') ? 'hackathon' 
    : location.pathname.includes('/recognition') ? 'recognition' 
    : location.pathname.includes('/volunteers') ? 'volunteer'
    : (location.pathname.includes('/submissions') || location.pathname.includes('/project-submissions')) ? 'submission'
    : 'club';
  const [clubApps, setClubApps] = useState<ClubApplication[]>([]);
  const [eventRegs, setEventRegs] = useState<EventRegistration[]>([]);
  const [hackathonRegs, setHackathonRegs] = useState<HackathonRegistration[]>([]);
  const [recognitionApps, setRecognitionApps] = useState<RecognitionApplication[]>([]);
  const [volunteerApps, setVolunteerApps] = useState<VolunteerApplication[]>([]);
  const [projectSubs, setProjectSubs] = useState<ProjectSubmission[]>([]);
  const [selectedHackathon, setSelectedHackathon] = useState<HackathonRegistration | null>(null);
  const [selectedRecognition, setSelectedRecognition] = useState<RecognitionApplication | null>(null);
  const [selectedVolunteer, setSelectedVolunteer] = useState<VolunteerApplication | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<ProjectSubmission | null>(null);
  
  // Filtering & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [eventFilter, setEventFilter] = useState('all');
  const [hackathonFilter, setHackathonFilter] = useState('all');
  const [certSentFilter, setCertSentFilter] = useState<'all' | 'sent' | 'pending'>('all');
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'present' | 'absent' | 'pending'>('all');
  const [volunteerRoleFilter, setVolunteerRoleFilter] = useState('all');
  const [managedBranches, setManagedBranches] = useState<string[]>([]);

  // Pagination State (Prev / 1 2 3 ... / Next)
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  // Reset pagination to page 1 whenever active tab or any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, branchFilter, statusFilter, eventFilter, hackathonFilter, volunteerRoleFilter, certSentFilter, attendanceFilter]);

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
      setHackathonRegs(data.hackathonRegistrations || []);
      setRecognitionApps(data.recognitionApplications || []);
      setVolunteerApps(data.volunteerApplications || []);
      setProjectSubs(data.projectSubmissions || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch branches from Branch Management
  const fetchManagedBranches = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/branches`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setManagedBranches(data.map((b: any) => b.name));
        }
      }
    } catch (e) {
      console.warn("Failed to load branches from Branch Management:", e);
    }
  };

  useEffect(() => {
    fetchApplications();
    fetchManagedBranches();

    const handleSync = (e: Event) => {
      const eventType = (e as CustomEvent).detail;
      if (eventType === 'REFRESH_APPLICATIONS' || eventType === 'REFRESH_SUBMISSIONS') {
        fetchApplications();
        fetchManagedBranches();
      }
    };

    window.addEventListener('app-sync', handleSync);
    return () => window.removeEventListener('app-sync', handleSync);
  }, []);

  const [isSendingBulk, setIsSendingBulk] = useState(false);

  // Certificate Type Modal States
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);

  // Terminal Console Modal States
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [consoleProgress, setConsoleProgress] = useState(0);
  const [consoleStatus, setConsoleStatus] = useState<'idle' | 'running' | 'completed' | 'failed'>('idle');
  const [consoleTitle, setConsoleTitle] = useState('');

  // Custom Alert / Confirm / Danger Dialog Modal States
  const [dialogConfig, setDialogConfig] = useState<{
    isOpen: boolean;
    type: 'alert' | 'confirm' | 'danger';
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    type: 'alert',
    title: '',
    message: '',
    confirmText: 'Confirm',
    onConfirm: () => {}
  });

  const showCustomAlert = (title: string, message: string) => {
    setDialogConfig({
      isOpen: true,
      type: 'alert',
      title,
      message,
      confirmText: 'OK',
      onConfirm: () => {}
    });
  };

  const showCustomConfirm = (
    title: string, 
    message: string, 
    onConfirm: () => void,
    type: 'confirm' | 'danger' = 'confirm',
    confirmText: string = 'Confirm'
  ) => {
    setDialogConfig({
      isOpen: true,
      type,
      title,
      message,
      confirmText,
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

  const executeBulkSendCertificates = async () => {
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
          eventTitle: eventFilter
        })
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => null);
        const errMsg = errBody?.error || errBody?.message || 'Failed to establish stream connection.';
        throw new Error(`${errMsg} (Status: ${response.status})`);
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

    setIsCertModalOpen(true);
  };

  const executeBulkSendHackathonCertificates = async () => {
    // Reset console states
    setConsoleLogs([]);
    setConsoleProgress(0);
    setConsoleStatus('running');
    setConsoleTitle(`Bulk Dispatch Hackathon Certificates: ${hackathonFilter}`);
    setIsConsoleOpen(true);
    setIsSendingBulk(true);

    const token = localStorage.getItem('admin_token');

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/bulk-send/hackathon-certificates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          hackathonName: hackathonFilter
        })
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => null);
        const errMsg = errBody?.error || errBody?.message || 'Failed to establish stream connection.';
        throw new Error(`${errMsg} (Status: ${response.status})`);
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

  const handleBulkSendHackathonCertificates = () => {
    if (hackathonFilter === 'all') {
      showCustomAlert(
        "Hackathon Selection Required",
        "Please select a specific hackathon from the hackathon filter dropdown next to the search bar before sending certificates."
      );
      return;
    }

    const targetHackathonRegs = hackathonRegs.filter(r => hackathonFilter === 'all' || r.hackathon_name === hackathonFilter);
    const eligibleTeams = targetHackathonRegs.filter(r => r.status === 'approved' && (r.attendance || 'pending').toLowerCase() === 'present');
    const excludedTeams = targetHackathonRegs.filter(r => (r.attendance || 'pending').toLowerCase() !== 'present');

    showCustomConfirm(
      "Send Hackathon Certificates",
      `Attendance Check for "${hackathonFilter}":\n\n` +
      `• Eligible: ${eligibleTeams.length} approved team(s) marked Present.\n` +
      `• Excluded: ${excludedTeams.length} team(s) marked Absent or Pending.\n\n` +
      `Only teams marked Present will receive certificates. Proceed with dispatch?`,
      executeBulkSendHackathonCertificates
    );
  };

  const executeBulkSendRecognitionCertificates = async () => {
    // Reset console states
    setConsoleLogs([]);
    setConsoleProgress(0);
    setConsoleStatus('running');
    setConsoleTitle(eventFilter === 'all' ? "Bulk Dispatch: All Recognition Certificates" : `Bulk Dispatch Recognition: ${eventFilter}`);
    setIsConsoleOpen(true);
    setIsSendingBulk(true);

    const token = localStorage.getItem('admin_token');

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/bulk-send/recognition-certificates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          eventName: eventFilter === 'all' ? undefined : eventFilter
        })
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => null);
        const errMsg = errBody?.error || errBody?.message || 'Failed to establish stream connection.';
        throw new Error(`${errMsg} (Status: ${response.status})`);
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

  const handleBulkSendRecognitionCertificates = () => {
    const scopeDesc = eventFilter === 'all' 
      ? 'all approved judges and dignitaries across all events'
      : `all approved judges and dignitaries for "${eventFilter}"`;

    showCustomConfirm(
      "Send Recognition Certificates",
      `Are you sure you want to generate and dispatch official recognition certificates to ${scopeDesc} who haven't received them yet?`,
      executeBulkSendRecognitionCertificates
    );
  };

  const executeBulkSendVolunteerCertificates = async () => {
    // Reset console states
    setConsoleLogs([]);
    setConsoleProgress(0);
    setConsoleStatus('running');
    setConsoleTitle("Bulk Dispatch: All Approved Volunteer Certificates");
    setIsConsoleOpen(true);
    setIsSendingBulk(true);

    const token = localStorage.getItem('admin_token');

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/bulk-send/volunteer-certificates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => null);
        const errMsg = errBody?.error || errBody?.message || 'Failed to establish stream connection.';
        throw new Error(`${errMsg} (Status: ${response.status})`);
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

  const handleBulkSendVolunteerCertificates = () => {
    showCustomConfirm(
      "Send Volunteer Certificates",
      "Are you sure you want to generate and dispatch official volunteer certificates of appreciation to ALL approved student volunteers who haven't received them yet?",
      executeBulkSendVolunteerCertificates
    );
  };

  // Update status action
  const handleUpdateStatus = async (type: 'club' | 'event' | 'hackathon' | 'hackathon-certificate-type' | 'recognition' | 'volunteer' | 'project-submission', id: number, status: string) => {
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
      showCustomAlert('Status Update Error', err.message || 'Failed to update application status.');
    }
  };

  // Delete application / submission action
  const handleDeleteApplication = (type: 'club' | 'event' | 'hackathon' | 'recognition' | 'volunteer' | 'project-submission', id: number, labelName?: string) => {
    const title = labelName ? `Delete ${labelName}?` : `Delete Record #${id}?`;
    const confirmMsg = labelName 
      ? `Are you sure you want to permanently remove "${labelName}" from the database? This action cannot be undone.`
      : `Are you sure you want to permanently remove this record (ID: ${id}) from the database? This action cannot be undone.`;

    showCustomConfirm(
      title,
      confirmMsg,
      async () => {
        const token = localStorage.getItem('admin_token');
        try {
          const response = await fetch(`${API_BASE_URL}/api/admin/applications/${type}/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to delete record.');
          }

          if (selectedSubmission?.id === id) {
            setSelectedSubmission(null);
          }
          if (selectedHackathon?.id === id) {
            setSelectedHackathon(null);
          }

          fetchApplications();
        } catch (err: any) {
          showCustomAlert('Delete Failed', err.message || 'Failed to delete record.');
        }
      },
      'danger',
      'Permanently Delete'
    );
  };

  // Get distinct branches from Branch Management (with fallback)
  const getBranches = () => {
    if (managedBranches.length > 0) {
      return managedBranches;
    }
    const branches = new Set<string>();
    clubApps.forEach(app => app.branch && branches.add(app.branch.trim()));
    eventRegs.forEach(reg => reg.branch && branches.add(reg.branch.trim()));
    volunteerApps.forEach(app => app.branch && branches.add(app.branch.trim()));
    hackathonRegs.forEach(reg => {
      if (reg.leader_branch) branches.add(reg.leader_branch.trim());
    });
    return Array.from(branches);
  };

  const matchesBranchFilter = (studentBranch: string, filterVal: string) => {
    if (!filterVal || filterVal === 'all') return true;
    if (!studentBranch) return false;
    const s = studentBranch.trim().toUpperCase();
    const f = filterVal.trim().toUpperCase();
    if (s === f) return true;

    // Compare acronyms inside parentheses e.g. (CSM), (AI&ML), (CSE), (ECE), (EEE), (DCSE)
    const matchF = f.match(/\(([^)]+)\)/);
    const acronymF = matchF ? matchF[1].toUpperCase() : null;

    const matchS = s.match(/\(([^)]+)\)/);
    const acronymS = matchS ? matchS[1].toUpperCase() : null;

    if (acronymF && acronymS && acronymF === acronymS) return true;
    if (acronymF && (s === acronymF || s.includes(acronymF))) return true;
    if (acronymS && (f === acronymS || f.includes(acronymS))) return true;

    return s.includes(f) || f.includes(s);
  };

  // Get distinct volunteer roles for filter dropdown
  const getVolunteerRoles = () => {
    const roles = new Set<string>();
    volunteerApps.forEach(app => {
      if (app.volunteer_role) roles.add(app.volunteer_role);
    });
    return Array.from(roles);
  };

  // Get distinct events for filter dropdown
  const getEvents = () => {
    const events = new Set<string>();
    eventRegs.forEach(reg => events.add(reg.event_name));
    return Array.from(events);
  };

  // Get distinct events for recognition
  const getRecognitionEvents = () => {
    const events = new Set<string>();
    recognitionApps.forEach(reg => events.add(reg.event_name));
    return Array.from(events);
  };

  // Get distinct hackathons for filter dropdown
  const getHackathons = () => {
    const hackathons = new Set<string>();
    hackathonRegs.forEach(reg => {
      hackathons.add(reg.hackathon_name || 'R&D AlphaQuest Hackathon');
    });
    return Array.from(hackathons);
  };

  // Get distinct events for project submissions
  const getSubmissionEvents = () => {
    const events = new Set<string>();
    projectSubs.forEach(sub => events.add(sub.event_name));
    return Array.from(events);
  };

  // Apply filters
  const filteredClubApps = clubApps.filter(app => {
    const matchesSearch = app.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          app.pin_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          app.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    const matchesBranch = matchesBranchFilter(app.branch, branchFilter);
    return matchesSearch && matchesStatus && matchesBranch;
  });

  const filteredEventRegs = eventRegs.filter(reg => {
    const matchesSearch = reg.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          reg.pin_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          reg.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBranch = matchesBranchFilter(reg.branch, branchFilter);
    const matchesEvent = eventFilter === 'all' || reg.event_name === eventFilter;
    const matchesCertSent = certSentFilter === 'all' ||
      (certSentFilter === 'sent' && reg.certificate_sent === 1) ||
      (certSentFilter === 'pending' && (!reg.certificate_sent || reg.certificate_sent === 0));
    const matchesAttendance = attendanceFilter === 'all' || (reg.attendance || 'pending').toLowerCase() === attendanceFilter;
    return matchesSearch && matchesBranch && matchesEvent && matchesCertSent && matchesAttendance;
  });

  const filteredHackathonRegs = hackathonRegs.filter(reg => {
    const matchesSearch = reg.leader_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          reg.team_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (reg.project_title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          reg.leader_email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || reg.status === statusFilter;
    const matchesBranch = matchesBranchFilter(reg.leader_branch || '', branchFilter);
    const matchesHackathon = hackathonFilter === 'all' || 
      (reg.hackathon_name || 'R&D AlphaQuest Hackathon') === hackathonFilter;
    const matchesAttendance = attendanceFilter === 'all' || (reg.attendance || 'pending').toLowerCase() === attendanceFilter;
    return matchesSearch && matchesStatus && matchesBranch && matchesHackathon && matchesAttendance;
  });

  const filteredRecognitionApps = recognitionApps.filter(app => {
    const matchesSearch = app.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          app.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          app.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (app.domain_expertise || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          app.mobile.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    const matchesEvent = eventFilter === 'all' || app.event_name === eventFilter;
    const matchesCertSent = certSentFilter === 'all' ||
      (certSentFilter === 'sent' && app.certificate_sent === 1) ||
      (certSentFilter === 'pending' && (!app.certificate_sent || app.certificate_sent === 0));
    return matchesSearch && matchesStatus && matchesEvent && matchesCertSent;
  });

  const filteredVolunteerApps = volunteerApps.filter(app => {
    const matchesSearch = app.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          app.pin_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (app.skills || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (app.event_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          app.mobile.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    const matchesBranch = matchesBranchFilter(app.branch, branchFilter);
    const matchesRole = volunteerRoleFilter === 'all' || app.volunteer_role === volunteerRoleFilter;
    const matchesCertSent = certSentFilter === 'all' ||
      (certSentFilter === 'sent' && app.certificate_sent === 1) ||
      (certSentFilter === 'pending' && (!app.certificate_sent || app.certificate_sent === 0));
    return matchesSearch && matchesStatus && matchesBranch && matchesRole && matchesCertSent;
  });

  const filteredProjectSubs = projectSubs.filter(sub => {
    const matchesSearch = sub.team_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          sub.project_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          sub.leader_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          sub.leader_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (sub.problem_statement || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' 
      ? true 
      : (statusFilter === 'pending' || statusFilter === 'submitted')
        ? (sub.status === 'submitted' || sub.status === 'pending')
        : sub.status === statusFilter;
    const matchesEvent = eventFilter === 'all' || sub.event_name === eventFilter;
    return matchesSearch && matchesStatus && matchesEvent;
  });

  // Paginated slices for each tab (load page-by-page)
  const paginatedClubApps = filteredClubApps.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const paginatedEventRegs = filteredEventRegs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const paginatedHackathonRegs = filteredHackathonRegs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const paginatedRecognitionApps = filteredRecognitionApps.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const paginatedVolunteerApps = filteredVolunteerApps.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const paginatedProjectSubs = filteredProjectSubs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

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
    } else if (activeTab === 'event') {
      // Event registrations (filtered by active eventFilter)
      const targetRegs = eventFilter === 'all' 
        ? eventRegs 
        : eventRegs.filter(r => r.event_name === eventFilter);

      const sent = targetRegs.filter(r => r.certificate_sent === 1).length;
      const unsent = targetRegs.filter(r => !r.certificate_sent || r.certificate_sent === 0).length;
      return {
        total: targetRegs.length,
        pending: unsent,
        approved: targetRegs.length,
        rejected: 0,
        sent,
        unsent,
        sentLabel: "Certificates Sent",
        unsentLabel: "Certificates Pending"
      };
    } else if (activeTab === 'recognition') {
      // Judge and dignitary recognition applications
      const targetApps = eventFilter === 'all'
        ? recognitionApps
        : recognitionApps.filter(r => r.event_name === eventFilter);

      const approved = targetApps.filter(a => a.status === 'approved');
      const sent = approved.filter(a => a.certificate_sent === 1).length;
      const unsent = approved.filter(a => !a.certificate_sent || a.certificate_sent === 0).length;
      return {
        total: targetApps.length,
        pending: targetApps.filter(a => a.status === 'pending').length,
        approved: approved.length,
        rejected: targetApps.filter(a => a.status === 'rejected').length,
        sent,
        unsent,
        sentLabel: "Certificates Sent",
        unsentLabel: "Certificates Pending"
      };
    } else if (activeTab === 'volunteer') {
      const approved = volunteerApps.filter(a => a.status === 'approved');
      const sent = approved.filter(a => a.certificate_sent === 1).length;
      const unsent = approved.filter(a => !a.certificate_sent || a.certificate_sent === 0).length;
      return {
        total: volunteerApps.length,
        pending: volunteerApps.filter(a => a.status === 'pending').length,
        approved: approved.length,
        rejected: volunteerApps.filter(a => a.status === 'rejected').length,
        sent,
        unsent,
        sentLabel: "Certificates Sent",
        unsentLabel: "Certificates Pending"
      };
    } else if (activeTab === 'submission') {
      const targetSubs = eventFilter === 'all'
        ? projectSubs
        : projectSubs.filter(s => s.event_name === eventFilter);

      const approved = targetSubs.filter(s => s.status === 'approved');
      return {
        total: targetSubs.length,
        pending: targetSubs.filter(s => s.status === 'pending' || s.status === 'submitted').length,
        approved: approved.length,
        rejected: targetSubs.filter(s => s.status === 'rejected').length,
        sent: 0,
        unsent: 0,
        sentLabel: "Evaluated",
        unsentLabel: "Pending"
      };
    } else {
      // Hackathons
      const targetRegs = hackathonFilter === 'all'
        ? hackathonRegs
        : hackathonRegs.filter(r => r.hackathon_name === hackathonFilter);

      const approved = targetRegs.filter(r => r.status === 'approved');
      const sent = approved.filter(r => r.certificate_sent === 1).length;
      const unsent = approved.filter(r => !r.certificate_sent || r.certificate_sent === 0).length;
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
    } else if (activeTab === 'event') {
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
    } else if (activeTab === 'recognition') {
      filename = 'RD_Judge_Recognition_Applications.csv';
      headers = ['ID', 'Full Name', 'Email', 'Mobile', 'Designation', 'Organization', 'Event Served As Judge', 'Event Date', 'Domain Expertise', 'Experience (Years)', 'Citation / Bio', 'Status', 'Certificate Sent', 'Certificate ID', 'Submitted At'];
      rows = filteredRecognitionApps.map(app => [
        app.id.toString(),
        app.full_name,
        app.email,
        app.mobile,
        app.designation,
        app.organization,
        app.event_name,
        app.event_date,
        app.domain_expertise || 'N/A',
        app.experience_years || 'N/A',
        (app.notes || '').replace(/\n/g, ' '),
        app.status,
        app.certificate_sent === 1 ? 'Sent' : 'Pending',
        app.certificate_id || 'N/A',
        new Date(app.created_at).toLocaleString()
      ]);
    } else if (activeTab === 'volunteer') {
      filename = 'RD_Club_Volunteer_Applications.csv';
      headers = ['ID', 'Full Name', 'PIN Number', 'Email', 'Mobile', 'Branch', 'Year of Study', 'Target Event', 'Volunteer Role', 'Key Skills', 'Past Experience', 'Availability', 'Notes', 'Status', 'Certificate Sent', 'Certificate ID', 'Applied At'];
      rows = filteredVolunteerApps.map(app => [
        app.id.toString(),
        app.full_name,
        app.pin_number,
        app.email,
        app.mobile,
        app.branch,
        app.year_of_study,
        app.event_name,
        app.volunteer_role,
        (app.skills || '').replace(/\n/g, ' '),
        (app.past_experience || 'N/A').replace(/\n/g, ' '),
        app.availability,
        (app.notes || 'N/A').replace(/\n/g, ' '),
        app.status,
        app.certificate_sent === 1 ? 'Sent' : 'Pending',
        app.certificate_id || 'N/A',
        new Date(app.created_at).toLocaleString()
      ]);
    } else if (activeTab === 'submission') {
      filename = 'RD_Club_Project_Submissions.csv';
      headers = ['ID', 'Event Name', 'Team Name', 'Leader Name', 'Leader Email', 'Leader Phone', 'Institution', 'Project Title', 'Project Info', 'Problem Statement', 'File Name', 'Drive URL', 'Status', 'Submitted At'];
      rows = filteredProjectSubs.map(sub => [
        sub.id.toString(),
        sub.event_name,
        sub.team_name,
        sub.leader_name,
        sub.leader_email,
        sub.leader_phone,
        sub.institution || 'N/A',
        sub.project_title,
        (sub.project_info || '').replace(/\n/g, ' '),
        (sub.problem_statement || '').replace(/\n/g, ' '),
        sub.file_name || 'N/A',
        sub.drive_file_url || 'N/A',
        sub.status,
        new Date(sub.created_at).toLocaleString()
      ]);
    } else {
      filename = 'RD_Club_Hackathon_Registrations.csv';
      headers = ['ID', 'Hackathon Event', 'Team Name', 'Project Title', 'Project Description', 'Problem Statement', 'Leader Name', 'Leader Email', 'Leader Phone', 'Leader Role', 'Leader Year', 'Leader Branch', 'Leader Institution', 'Leader Company', 'Leader Job Title', 'Members Count', 'Status', 'Registered At'];
      rows = filteredHackathonRegs.map(reg => {
        let membersCount = 1;
        try {
          const parsed = JSON.parse(reg.members || '[]');
          membersCount = parsed.length + 1; // leader + members
        } catch (e) {}
        return [
          reg.id.toString(),
          reg.hackathon_name || 'R&D AlphaQuest Hackathon',
          reg.team_name,
          reg.project_title || 'N/A',
          (reg.project_description || '').replace(/\n/g, ' '),
          (reg.problem_statement || '').replace(/\n/g, ' '),
          reg.leader_name,
          reg.leader_email,
          reg.leader_phone,
          reg.leader_role,
          reg.leader_year || 'N/A',
          reg.leader_branch || 'N/A',
          reg.leader_institution || 'N/A',
          reg.leader_company || 'N/A',
          reg.leader_job_title || 'N/A',
          membersCount.toString(),
          reg.status,
          new Date(reg.created_at).toLocaleString()
        ];
      });
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
            <span>{activeTab === 'hackathon' ? 'Approved Teams' : activeTab === 'recognition' ? 'Approved Judges' : activeTab === 'volunteer' ? 'Approved Volunteers' : activeTab === 'submission' ? 'Approved Submissions' : 'Approved Seats'}</span>
            <h2>{stats.approved}</h2>
          </div>
          <div className="admin-stat-icon approved">
            <Check size={22} />
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-info">
            <span>{activeTab === 'submission' ? 'Rejected Submissions' : 'Rejected Applications'}</span>
            <h2>{stats.rejected}</h2>
          </div>
          <div className="admin-stat-icon rejected">
            <X size={22} />
          </div>
        </div>

        {activeTab !== 'hackathon' && activeTab !== 'submission' && (
          <>
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
          </>
        )}
      </div>


      {/* Filters & Actions Control Row */}
      <div className="table-controls">
        <div className="search-filter-box">
          <input
            type="text"
            className="admin-search-input"
            placeholder={
              activeTab === 'hackathon' ? "Search team, leader, project..." 
              : activeTab === 'recognition' ? "Search judge, organization, email..."
              : activeTab === 'volunteer' ? "Search volunteer, PIN, skills..."
              : activeTab === 'submission' ? "Search team, project, leader, topic..."
              : "Search student, email, or PIN..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {/* 1. Hackathons filter (for Hackathons tab) */}
          {activeTab === 'hackathon' && (
            <AdminFilterDropdown
              value={hackathonFilter}
              onChange={setHackathonFilter}
              options={[
                { value: 'all', label: 'All Hackathons' },
                ...getHackathons().map(hack => ({ value: hack, label: hack }))
              ]}
              placeholder="All Hackathons"
              minWidth="140px"
              maxWidth="190px"
              menuWidth="240px"
              title="Filter by Hackathon"
            />
          )}

          {/* 2. Events / Hackathons filter (for event / recognition / submission tabs) */}
          {(activeTab === 'event' || activeTab === 'recognition') && (
            <AdminFilterDropdown
              value={eventFilter}
              onChange={setEventFilter}
              options={[
                { value: 'all', label: 'All Events' },
                ...(activeTab === 'recognition' ? getRecognitionEvents() : getEvents()).map(evt => ({ value: evt, label: evt }))
              ]}
              placeholder="All Events"
              minWidth="130px"
              maxWidth="180px"
              menuWidth="240px"
              title="Filter by Event"
            />
          )}

          {activeTab === 'submission' && (
            <AdminFilterDropdown
              value={eventFilter}
              onChange={setEventFilter}
              options={[
                { value: 'all', label: 'All Events / Hackathons' },
                ...getSubmissionEvents().map(evt => ({ value: evt, label: evt }))
              ]}
              placeholder="All Events / Hackathons"
              minWidth="150px"
              maxWidth="200px"
              menuWidth="250px"
              title="Filter by Event / Hackathon"
            />
          )}

          {/* 3. Branch filter (from Branch Management) - DIRECTLY BESIDE ALL HACKATHONS */}
          {activeTab !== 'recognition' && activeTab !== 'submission' && (
            <AdminFilterDropdown
              value={branchFilter}
              onChange={setBranchFilter}
              options={[
                { value: 'all', label: 'All Branches' },
                ...getBranches().map(br => ({ value: br, label: br }))
              ]}
              placeholder="All Branches"
              minWidth="135px"
              maxWidth="195px"
              menuWidth="320px"
              title="Filter by Branch"
            />
          )}

          {/* 4. Volunteer Tracks filter */}
          {activeTab === 'volunteer' && (
            <AdminFilterDropdown
              value={volunteerRoleFilter}
              onChange={setVolunteerRoleFilter}
              options={[
                { value: 'all', label: 'All Volunteer Tracks' },
                ...getVolunteerRoles().map(role => ({ value: role, label: role }))
              ]}
              placeholder="All Volunteer Tracks"
              minWidth="150px"
              maxWidth="190px"
              menuWidth="220px"
              title="Filter by Track"
            />
          )}

          {/* 5. Status / Certificate filter */}
          {activeTab === 'club' || activeTab === 'hackathon' || activeTab === 'recognition' || activeTab === 'volunteer' || activeTab === 'submission' ? (
            <AdminFilterDropdown
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'pending', label: 'Pending' },
                { value: 'approved', label: 'Approved' },
                { value: 'rejected', label: 'Rejected' }
              ]}
              placeholder="All Statuses"
              minWidth="120px"
              maxWidth="140px"
              menuWidth="160px"
              title="Filter by Status"
            />
          ) : (
            <AdminFilterDropdown
              value={certSentFilter}
              onChange={(val) => setCertSentFilter(val as 'all' | 'sent' | 'pending')}
              options={[
                { value: 'all', label: 'All Certificates' },
                { value: 'sent', label: 'Sent Only' },
                { value: 'pending', label: 'Pending Only' }
              ]}
              placeholder="All Certificates"
              minWidth="130px"
              maxWidth="160px"
              menuWidth="180px"
              title="Filter by Certificate"
            />
          )}

          {/* Attendance Filter for Events and Hackathons */}
          {(activeTab === 'event' || activeTab === 'hackathon') && (
            <AdminFilterDropdown
              value={attendanceFilter}
              onChange={(val) => setAttendanceFilter(val as 'all' | 'present' | 'absent' | 'pending')}
              options={[
                { value: 'all', label: 'All Attendance' },
                { value: 'present', label: 'Present Only' },
                { value: 'absent', label: 'Absent Only' },
                { value: 'pending', label: 'Pending Only' }
              ]}
              placeholder="All Attendance"
              minWidth="135px"
              maxWidth="165px"
              menuWidth="180px"
              title="Filter by Attendance"
            />
          )}

          {/* 6. Dispatch filter (for recognition / volunteer) */}
          {(activeTab === 'recognition' || activeTab === 'volunteer') && (
            <AdminFilterDropdown
              value={certSentFilter}
              onChange={(val) => setCertSentFilter(val as 'all' | 'sent' | 'pending')}
              options={[
                { value: 'all', label: 'All Dispatch States' },
                { value: 'sent', label: 'Certificate Sent' },
                { value: 'pending', label: 'Certificate Pending' }
              ]}
              placeholder="All Dispatch States"
              minWidth="140px"
              maxWidth="180px"
              menuWidth="200px"
              title="Filter by Dispatch State"
            />
          )}
        </div>

        <div className="admin-dashboard-actions" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {activeTab === 'club' && (
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
          )}
          
          {activeTab === 'event' && (
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

          {activeTab === 'hackathon' && (
            <button 
              onClick={handleBulkSendHackathonCertificates} 
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

          {activeTab === 'recognition' && (
            <button 
              onClick={handleBulkSendRecognitionCertificates} 
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
                  <Award size={16} /> Bulk Send Recognition Certificates
                </>
              )}
            </button>
          )}

          {activeTab === 'volunteer' && (
            <button 
              onClick={handleBulkSendVolunteerCertificates} 
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
                  <HeartHandshake size={16} /> Bulk Send Volunteer Certificates
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
        <div className={`admin-table-container ${activeTab === 'hackathon' ? 'hackathons-table' : activeTab === 'submission' ? 'submissions-table' : activeTab === 'recognition' ? 'recognitions-table' : activeTab === 'volunteer' ? 'volunteers-table' : 'applications-table'}`}>
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
              ) : activeTab === 'event' ? (
                <tr>
                  <th>Student Info</th>
                  <th>Academic Profile</th>
                  <th>Target Event</th>
                  <th>Attendance</th>
                  <th>Special Notes</th>
                  <th colSpan={2}>Certificate Action / Type</th>
                </tr>
              ) : activeTab === 'recognition' ? (
                <tr>
                  <th>Judge / Dignitary Info</th>
                  <th>Organization & Role</th>
                  <th>Event Evaluated</th>
                  <th>Expertise & Citation</th>
                  <th>Status</th>
                  <th colSpan={2}>Recognition Certificate & Actions</th>
                </tr>
              ) : activeTab === 'volunteer' ? (
                <tr>
                  <th>Volunteer Info</th>
                  <th>Academic Details</th>
                  <th>Role & Event Track</th>
                  <th>Skills & Availability</th>
                  <th>Status</th>
                  <th colSpan={2}>Volunteer Certificate & Actions</th>
                </tr>
              ) : activeTab === 'submission' ? (
                <tr>
                  <th>Submission Ref & Event</th>
                  <th>Team & Leader</th>
                  <th>Project Details</th>
                  <th>Presentation (Drive)</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              ) : (
                <tr>
                  <th>Team & Leader Info</th>
                  <th>Academic & Branch Profile</th>
                  <th>Members Roster</th>
                  <th>Attendance</th>
                  <th>Status</th>
                  <th colSpan={2}>Certificate Action / Type</th>
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
                  paginatedClubApps.map(app => (
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
                        <div className="actions-cell" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
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
                          <button
                            onClick={() => handleDeleteApplication('club', app.id, `${app.full_name}`)}
                            className="btn-action reject"
                            style={{ color: '#dc2626', borderColor: '#fca5a5', backgroundColor: '#fef2f2' }}
                            title="Delete / Remove from Database"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )
              ) : activeTab === 'event' ? (
                filteredEventRegs.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                      No event registrations match the filter criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedEventRegs.map(reg => (
                    <tr key={reg.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <strong>{reg.full_name}</strong>
                          {reg.certificate_sent === 1 ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
                              <span style={{
                                fontSize: '0.625rem',
                                fontWeight: 700,
                                color: '#047857',
                                backgroundColor: '#ecfdf5',
                                padding: '0.125rem 0.375rem',
                                borderRadius: '4px',
                                textTransform: 'uppercase',
                                display: 'inline-block'
                              }}>Sent</span>
                              {reg.certificate_id && (
                                <span style={{
                                  fontSize: '0.6875rem',
                                  color: 'var(--text-muted)',
                                  fontFamily: 'monospace',
                                  backgroundColor: 'rgba(15, 15, 15, 0.1)',
                                  padding: '0.0625rem 0.375rem',
                                  borderRadius: '3px',
                                  fontWeight: 500
                                }}>{reg.certificate_id}</span>
                              )}
                            </div>
                          ) : (
                            <span style={{
                              fontSize: '0.625rem',
                              fontWeight: 700,
                              color: '#b45309',
                              backgroundColor: '#fffbeb',
                              padding: '0.125rem 0.375rem',
                              borderRadius: '4px',
                              textTransform: 'uppercase',
                              display: 'inline-block'
                            }}>Pending</span>
                          )}
                        </div>
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
                      <td>
                        {(() => {
                          const att = (reg.attendance || 'pending').toLowerCase();
                          const badgeStyles: Record<string, { bg: string; color: string; border: string; label: string }> = {
                            present: { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0', label: '✓ Present' },
                            absent: { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca', label: '✕ Absent' },
                            pending: { bg: '#f3f4f6', color: '#4b5563', border: '#e5e7eb', label: '⏳ Pending' }
                          };
                          const s = badgeStyles[att] || badgeStyles.pending;
                          return (
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
                                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                                  Room: {reg.room_code}
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td style={{ maxWidth: '250px', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        <div style={{ maxHeight: '60px', overflowY: 'auto' }}>{reg.notes || 'No notes provided'}</div>
                      </td>
                      <td colSpan={2}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          {(() => {
                            const val = reg.status || 'Participation';
                            const presetValues = ['Participation', 'Appreciation', 'Coordinated', 'Won First Place', 'Won Second Place', 'Won Third Place'];
                            const matchedPreset = presetValues.find(p => p.toLowerCase() === val.toLowerCase());
                            const displayVal = matchedPreset || val;
                            const isCustom = !matchedPreset;
                            return (
                              <select
                                value={displayVal}
                                onChange={(e) => handleUpdateStatus('event', reg.id, e.target.value)}
                                disabled={reg.certificate_sent === 1}
                                className="input"
                                style={{
                                  width: '180px',
                                  padding: '0.375rem 0.625rem',
                                  fontSize: '0.8125rem',
                                  borderRadius: '0.375rem',
                                  border: '1px solid var(--border)',
                                  background: reg.certificate_sent === 1 ? '#f1f5f9' : '#fff',
                                  color: 'var(--text-main)',
                                  cursor: reg.certificate_sent === 1 ? 'not-allowed' : 'pointer',
                                  opacity: reg.certificate_sent === 1 ? 0.7 : 1
                                }}
                              >
                                <option value="Participation">Participation</option>
                                <option value="Appreciation">Appreciation</option>
                                <option value="Coordinated">Coordinated</option>
                                <option value="Won First Place">Won First Place</option>
                                <option value="Won Second Place">Won Second Place</option>
                                <option value="Won Third Place">Won Third Place</option>
                                {isCustom && <option value={val}>{val}</option>}
                              </select>
                            );
                          })()}
                          {(() => {
                            const val = reg.status || 'Participation';
                            const isPart = val.toLowerCase() === 'participation' || val.toLowerCase() === 'participated' || val === 'pending' || val === 'approved';
                            const badgeClass = isPart ? 'status-participation' : 'status-appreciation';
                            const badgeText = isPart ? 'Participation' : val;
                            return (
                              <span className={`status-pill ${badgeClass}`} style={{ whiteSpace: 'nowrap' }}>
                                {badgeText}
                              </span>
                            );
                          })()}
                          <button
                            onClick={() => handleDeleteApplication('event', reg.id, `${reg.full_name}`)}
                            className="btn-action reject"
                            style={{ color: '#dc2626', borderColor: '#fca5a5', backgroundColor: '#fef2f2' }}
                            title="Delete / Remove from Database"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )
              ) : activeTab === 'recognition' ? (
                filteredRecognitionApps.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                      No judge recognition applications match the filter criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedRecognitionApps.map(app => (
                    <tr key={app.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <strong>{app.full_name}</strong>
                          {app.certificate_sent === 1 ? (
                            <span style={{
                              fontSize: '0.625rem',
                              fontWeight: 700,
                              color: '#047857',
                              backgroundColor: '#ecfdf5',
                              padding: '0.125rem 0.375rem',
                              borderRadius: '4px',
                              textTransform: 'uppercase'
                            }}>Sent</span>
                          ) : app.status === 'approved' ? (
                            <span style={{
                              fontSize: '0.625rem',
                              fontWeight: 700,
                              color: '#b45309',
                              backgroundColor: '#fffbeb',
                              padding: '0.125rem 0.375rem',
                              borderRadius: '4px',
                              textTransform: 'uppercase'
                            }}>Pending Send</span>
                          ) : null}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                          {app.email}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Phone: {app.mobile}
                        </div>
                      </td>
                      <td>
                        <strong style={{ fontSize: '0.875rem' }}>{app.designation}</strong>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                          {app.organization}
                        </div>
                        {app.experience_years && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                            Exp: {app.experience_years} Years
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary)' }}>
                          {app.event_name}
                        </span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                          Date: {app.event_date}
                        </div>
                      </td>
                      <td style={{ maxWidth: '250px', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        {app.domain_expertise && (
                          <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {app.domain_expertise}
                          </div>
                        )}
                        <div style={{ maxHeight: '45px', overflowY: 'auto', marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {app.notes || 'No citation notes provided'}
                        </div>
                        <button
                          onClick={() => setSelectedRecognition(app)}
                          className="btn btn-secondary btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.5rem', fontSize: '0.72rem', marginTop: '0.35rem', cursor: 'pointer' }}
                        >
                          <Eye size={11} /> View Profile
                        </button>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', alignItems: 'flex-start' }}>
                          <span className={`status-pill status-${app.status}`}>{app.status}</span>
                          <div className="actions-cell" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            {app.status === 'pending' && (
                              <>
                                <button onClick={() => handleUpdateStatus('recognition', app.id, 'approved')} className="btn-action approve" title="Approve Judge Recognition">
                                  <Check size={14} />
                                </button>
                                <button onClick={() => handleUpdateStatus('recognition', app.id, 'rejected')} className="btn-action reject" title="Reject Application">
                                  <X size={14} />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleDeleteApplication('recognition', app.id, `${app.full_name}`)}
                              className="btn-action reject"
                              style={{ color: '#dc2626', borderColor: '#fca5a5', backgroundColor: '#fef2f2' }}
                              title="Delete / Remove from Database"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </td>
                      <td colSpan={2}>
                        {app.certificate_sent === 1 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', alignItems: 'flex-start' }}>
                            <span style={{
                              fontSize: '0.75rem',
                              color: 'var(--text-muted)',
                              fontFamily: 'monospace',
                              backgroundColor: 'rgba(15, 15, 15, 0.06)',
                              padding: '0.125rem 0.375rem',
                              borderRadius: '4px',
                              fontWeight: 600
                            }}>
                              {app.certificate_id}
                            </span>
                            <a 
                              href={`/verify?id=${encodeURIComponent(app.certificate_id || '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-secondary btn-sm"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', fontSize: '0.75rem', textDecoration: 'none' }}
                            >
                              <Eye size={12} /> Verify Certificate
                            </a>
                          </div>
                        ) : app.status === 'approved' ? (
                          <span style={{
                            fontSize: '0.75rem',
                            color: '#b45309',
                            backgroundColor: '#fffbeb',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            fontWeight: 500
                          }}>
                            Ready for Dispatch
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Approval Required
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )
              ) : activeTab === 'volunteer' ? (
                filteredVolunteerApps.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                      No volunteer applications match the filter criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedVolunteerApps.map(app => (
                    <tr key={app.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <strong>{app.full_name}</strong>
                          {app.certificate_sent === 1 ? (
                            <span style={{
                              fontSize: '0.625rem',
                              fontWeight: 700,
                              color: '#047857',
                              backgroundColor: '#ecfdf5',
                              padding: '0.125rem 0.375rem',
                              borderRadius: '4px',
                              textTransform: 'uppercase'
                            }}>Sent</span>
                          ) : app.status === 'approved' ? (
                            <span style={{
                              fontSize: '0.625rem',
                              fontWeight: 700,
                              color: '#b45309',
                              backgroundColor: '#fffbeb',
                              padding: '0.125rem 0.375rem',
                              borderRadius: '4px',
                              textTransform: 'uppercase'
                            }}>Pending Send</span>
                          ) : null}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                          PIN: {app.pin_number} | {app.email}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Phone: {app.mobile}
                        </div>
                      </td>
                      <td>
                        <strong style={{ fontSize: '0.875rem' }}>{app.branch}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          Year: {app.year_of_study}
                        </div>
                      </td>
                      <td>
                        <span style={{
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          color: '#059669',
                          backgroundColor: '#ecfdf5',
                          padding: '0.125rem 0.375rem',
                          borderRadius: '4px',
                          display: 'inline-block',
                          marginBottom: '0.25rem'
                        }}>
                          {app.volunteer_role}
                        </span>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--primary)' }}>
                          {app.event_name}
                        </div>
                      </td>
                      <td style={{ maxWidth: '250px', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        <div style={{ maxHeight: '40px', overflowY: 'auto' }}>
                          <strong>Skills:</strong> {app.skills}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                          Commitment: {app.availability}
                        </div>
                        <button
                          onClick={() => setSelectedVolunteer(app)}
                          className="btn btn-secondary btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.5rem', fontSize: '0.72rem', marginTop: '0.35rem', cursor: 'pointer' }}
                        >
                          <Eye size={11} /> View Details
                        </button>
                      </td>
                      <td>
                        <span className={`status-pill status-${app.status}`}>{app.status}</span>
                      </td>
                      <td colSpan={2}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {app.certificate_sent === 1 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', alignItems: 'flex-start' }}>
                              <span style={{
                                fontSize: '0.75rem',
                                color: 'var(--text-muted)',
                                fontFamily: 'monospace',
                                backgroundColor: 'rgba(15, 15, 15, 0.06)',
                                padding: '0.125rem 0.375rem',
                                borderRadius: '4px',
                                fontWeight: 600
                              }}>
                                {app.certificate_id}
                              </span>
                              <a 
                                href={`/verify?id=${encodeURIComponent(app.certificate_id || '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-secondary btn-sm"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', fontSize: '0.75rem', textDecoration: 'none' }}
                              >
                                <Eye size={12} /> Verify Certificate
                              </a>
                            </div>
                          ) : app.status === 'approved' ? (
                            <span style={{
                              fontSize: '0.75rem',
                              color: '#b45309',
                              backgroundColor: '#fffbeb',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px',
                              fontWeight: 500,
                              display: 'inline-block'
                            }}>
                              Ready for Dispatch
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Approval Required
                            </span>
                          )}

                          <div className="actions-cell" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            {app.status === 'pending' ? (
                              <>
                                <button onClick={() => handleUpdateStatus('volunteer', app.id, 'approved')} className="btn-action approve" title="Approve Volunteer">
                                  <Check size={14} />
                                </button>
                                <button onClick={() => handleUpdateStatus('volunteer', app.id, 'rejected')} className="btn-action reject" title="Reject Application">
                                  <X size={14} />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleUpdateStatus('volunteer', app.id, app.status === 'approved' ? 'rejected' : 'approved')}
                                className="btn btn-secondary btn-sm"
                                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                              >
                                {app.status === 'approved' ? 'Revoke' : 'Re-Approve'}
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteApplication('volunteer', app.id, `${app.full_name}`)}
                              className="btn-action reject"
                              style={{ color: '#dc2626', borderColor: '#fca5a5', backgroundColor: '#fef2f2' }}
                              title="Delete / Remove from Database"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )
              ) : activeTab === 'submission' ? (
                filteredProjectSubs.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                      No project submissions match the filter criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedProjectSubs.map(sub => {
                    let membersCount = 1;
                    try {
                      const parsed = JSON.parse(sub.members || '[]');
                      membersCount = parsed.length + 1;
                    } catch (e) {}

                    const refNum = `TCEK/SUB/2026/${String(sub.id).padStart(4, '0')}`;
                    const wordCountInfo = (sub.project_info || '').trim().split(/\s+/).filter(Boolean).length;
                    const wordCountProblem = (sub.problem_statement || '').trim().split(/\s+/).filter(Boolean).length;

                    return (
                      <tr key={sub.id}>
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
                          }}>{refNum}</span>
                          <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--primary)' }}>
                            {sub.event_name}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                            {new Date(sub.created_at).toLocaleDateString()} {new Date(sub.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
                            <strong style={{ fontSize: '0.9375rem', color: 'var(--text-main)' }}>{sub.team_name}</strong>
                            <span style={{
                              fontSize: '0.6875rem',
                              fontWeight: 600,
                              color: '#6366f1',
                              backgroundColor: '#eef2ff',
                              padding: '0.1rem 0.35rem',
                              borderRadius: '4px'
                            }}>{membersCount} Members</span>
                          </div>
                          <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                            Leader: {sub.leader_name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {sub.leader_email} | {formatDisplayPhone(sub.leader_phone)}
                          </div>
                          {sub.institution && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Inst: {sub.institution}
                            </div>
                          )}
                        </td>
                        <td style={{ maxWidth: '300px' }}>
                          <strong style={{ display: 'block', fontSize: '0.875rem', color: 'var(--primary)', marginBottom: '0.25rem' }}>
                            {sub.project_title}
                          </strong>
                          <div style={{ fontSize: '0.75rem', display: 'flex', gap: '0.5rem', marginBottom: '0.35rem' }}>
                            <span style={{ color: '#059669', backgroundColor: '#ecfdf5', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 600 }}>
                              Info: {wordCountInfo}/1500w
                            </span>
                            <span style={{ color: '#0284c7', backgroundColor: '#e0f2fe', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 600 }}>
                              Problem: {wordCountProblem}/1000w
                            </span>
                          </div>
                          <div style={{ maxHeight: '48px', overflowY: 'auto', fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
                            {sub.problem_statement}
                          </div>
                          <button
                            onClick={() => setSelectedSubmission(sub)}
                            className="btn btn-secondary btn-sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.5rem', fontSize: '0.72rem', marginTop: '0.35rem', cursor: 'pointer' }}
                          >
                            <FileText size={11} /> View Full Submission
                          </button>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', alignItems: 'flex-start' }}>
                            <span style={{
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              color: 'var(--text-main)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}>
                              <FolderUp size={13} color="#4f46e5" />
                              {sub.file_name || 'Presentation File'}
                            </span>
                            {sub.file_size ? (
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                {(sub.file_size / (1024 * 1024)).toFixed(2)} MB
                              </span>
                            ) : null}
                            {sub.drive_file_url ? (
                              <a
                                href={sub.drive_file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-primary btn-sm"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  fontSize: '0.72rem',
                                  padding: '0.25rem 0.5rem',
                                  textDecoration: 'none',
                                  borderRadius: '4px'
                                }}
                              >
                                <ExternalLink size={12} /> Open in Drive
                              </a>
                            ) : (
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>No Drive link</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={`status-pill status-${sub.status}`}>{sub.status}</span>
                        </td>
                        <td>
                          <div className="actions-cell" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            {(sub.status === 'pending' || sub.status === 'submitted') ? (
                              <>
                                <button
                                  onClick={() => handleUpdateStatus('project-submission', sub.id, 'approved')}
                                  className="btn-action approve"
                                  title="Approve Submission"
                                >
                                  <Check size={14} />
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus('project-submission', sub.id, 'rejected')}
                                  className="btn-action reject"
                                  title="Reject Submission"
                                >
                                  <X size={14} />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleUpdateStatus('project-submission', sub.id, sub.status === 'approved' ? 'rejected' : 'approved')}
                                className="btn btn-secondary btn-sm"
                                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                              >
                                {sub.status === 'approved' ? 'Mark Rejected' : 'Re-Approve'}
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteApplication('project-submission', sub.id, `Team ${sub.team_name} submission`)}
                              className="btn-action reject"
                              style={{ color: '#dc2626', borderColor: '#fca5a5', backgroundColor: '#fef2f2' }}
                              title="Delete / Remove from Database"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )
              ) : (
                filteredHackathonRegs.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                      No hackathon registrations match the filter criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedHackathonRegs.map(reg => {
                    let membersCount = 1;
                    try {
                      const parsed = JSON.parse(reg.members || '[]');
                      membersCount = parsed.length + 1; // leader + members
                    } catch (e) {}

                    return (
                      <tr key={reg.id}>
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
                          }}>{reg.hackathon_name || 'R&D AlphaQuest Hackathon'}</span>
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
                            {reg.leader_branch ? `Branch: ${reg.leader_branch}` : reg.leader_company ? `Company: ${reg.leader_company}` : 'Trinity College'}
                          </div>
                          {reg.leader_year && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                              Year: {reg.leader_year}
                            </div>
                          )}
                          {reg.leader_institution && reg.leader_institution !== 'Trinity College of Engineering and Technology' && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                              {reg.leader_institution}
                            </div>
                          )}
                          {reg.project_title && (
                            <div style={{ marginTop: '0.35rem', fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>
                              Project: {reg.project_title}
                            </div>
                          )}
                        </td>
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
                        <td>
                          {(() => {
                            const att = (reg.attendance || 'pending').toLowerCase();
                            const badgeStyles: Record<string, { bg: string; color: string; border: string; label: string }> = {
                              present: { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0', label: '✓ Present' },
                              absent: { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca', label: '✕ Absent' },
                              pending: { bg: '#f3f4f6', color: '#4b5563', border: '#e5e7eb', label: '⏳ Pending' }
                            };
                            const s = badgeStyles[att] || badgeStyles.pending;
                            return (
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
                                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                                    Room: {reg.room_code}
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-start' }}>
                            <span className={`status-pill status-${reg.status}`}>{reg.status}</span>
                            
                            <div className="actions-cell" style={{ marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              {reg.status === 'pending' ? (
                                <>
                                  <button onClick={() => handleUpdateStatus('hackathon', reg.id, 'approved')} className="btn-action approve" title="Approve Registration">
                                    <Check size={14} />
                                  </button>
                                  <button onClick={() => handleUpdateStatus('hackathon', reg.id, 'rejected')} className="btn-action reject" title="Reject Registration">
                                    <X size={14} />
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => handleUpdateStatus('hackathon', reg.id, reg.status === 'approved' ? 'rejected' : 'approved')}
                                  className="btn btn-secondary btn-sm"
                                  style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem' }}
                                >
                                  {reg.status === 'approved' ? 'Reject' : 'Approve'}
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteApplication('hackathon', reg.id, `Team ${reg.team_name}`)}
                                className="btn-action reject"
                                style={{ color: '#dc2626', borderColor: '#fca5a5', backgroundColor: '#fef2f2' }}
                                title="Delete Team from Database"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        </td>
                        <td colSpan={2}>
                          {reg.status === 'approved' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              {(() => {
                                const val = reg.certificate_type || 'Participation';
                                const presetValues = ['Participation', 'Appreciation'];
                                const matchedPreset = presetValues.find(p => p.toLowerCase() === val.toLowerCase());
                                const displayVal = matchedPreset || val;
                                const isCustom = !matchedPreset;
                                return (
                                  <select
                                    value={displayVal}
                                    onChange={(e) => handleUpdateStatus('hackathon-certificate-type', reg.id, e.target.value)}
                                    disabled={reg.certificate_sent === 1}
                                    className="input"
                                    style={{
                                      width: '180px',
                                      padding: '0.375rem 0.625rem',
                                      fontSize: '0.8125rem',
                                      borderRadius: '0.375rem',
                                      border: '1px solid var(--border)',
                                      background: reg.certificate_sent === 1 ? '#f1f5f9' : '#fff',
                                      color: 'var(--text-main)',
                                      cursor: reg.certificate_sent === 1 ? 'not-allowed' : 'pointer',
                                      opacity: reg.certificate_sent === 1 ? 0.7 : 1
                                    }}
                                  >
                                    <option value="Participation">Participation</option>
                                    <option value="Appreciation">Appreciation</option>
                                    {isCustom && <option value={val}>{val}</option>}
                                  </select>
                                );
                              })()}

                              {reg.certificate_sent === 1 ? (
                                <span style={{
                                  fontSize: '0.625rem',
                                  fontWeight: 700,
                                  color: '#047857',
                                  backgroundColor: '#ecfdf5',
                                  padding: '0.125rem 0.375rem',
                                  borderRadius: '4px',
                                  textTransform: 'uppercase',
                                  whiteSpace: 'nowrap'
                                }}>Sent</span>
                              ) : (
                                <span style={{
                                  fontSize: '0.625rem',
                                  fontWeight: 700,
                                  color: '#b45309',
                                  backgroundColor: '#fffbeb',
                                  padding: '0.125rem 0.375rem',
                                  borderRadius: '4px',
                                  textTransform: 'uppercase',
                                  whiteSpace: 'nowrap'
                                }}>Pending</span>
                              )}
                            </div>
                          )}
                          {reg.status !== 'approved' && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Not Applicable
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )
              )}
            </tbody>
          </table>

          {/* Table Pagination (Prev / 1 2 3 ... / Next) */}
          {(() => {
            let total = 0;
            let itemName = 'records';
            if (activeTab === 'club') { total = filteredClubApps.length; itemName = 'club applications'; }
            else if (activeTab === 'event') { total = filteredEventRegs.length; itemName = 'event registrations'; }
            else if (activeTab === 'hackathon') { total = filteredHackathonRegs.length; itemName = 'hackathon teams'; }
            else if (activeTab === 'recognition') { total = filteredRecognitionApps.length; itemName = 'judge recognitions'; }
            else if (activeTab === 'volunteer') { total = filteredVolunteerApps.length; itemName = 'volunteer applications'; }
            else if (activeTab === 'submission') { total = filteredProjectSubs.length; itemName = 'project submissions'; }

            const totalPages = Math.ceil(total / PAGE_SIZE);

            return (
              <AdminPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalRecords={total}
                pageSize={PAGE_SIZE}
                onPageChange={(p) => setCurrentPage(p)}
                itemName={itemName}
              />
            );
          })()}
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
              Are you sure you want to generate and dispatch certificates to all unsent/pending registered attendees of the event <strong>"{eventFilter}"</strong>? The certificate action text (e.g. Coordinated, Won First Place) will be read directly from the table dropdown values.
            </p>

            {(() => {
              const targetRegs = eventRegs.filter(r => (eventFilter === 'all' || r.event_name === eventFilter) && r.certificate_sent !== 1);
              const presentCount = targetRegs.filter(r => (r.attendance || '').toLowerCase() === 'present').length;
              const excludedCount = targetRegs.length - presentCount;
              return (
                <div style={{
                  background: 'rgba(240, 253, 244, 0.7)',
                  border: '1px solid #bbf7d0',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1rem',
                  fontSize: '0.8125rem'
                }}>
                  <div style={{ fontWeight: 600, color: '#15803d', marginBottom: '0.25rem' }}>
                    Attendance Eligibility Automation
                  </div>
                  <div style={{ color: '#166534', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <div>• <strong>{presentCount}</strong> attendee(s) marked <strong>Present</strong> (Eligible for certificates)</div>
                    <div style={{ color: '#991b1b' }}>• <strong>{excludedCount}</strong> attendee(s) marked <strong>Absent / Pending</strong> (Skipped automatically)</div>
                  </div>
                </div>
              );
            })()}

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
                  executeBulkSendCertificates();
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

      {/* Hackathon Details Modal */}
      {selectedHackathon && (() => {
        let parsedMembers: any[] = [];
        try {
          parsedMembers = typeof selectedHackathon.members === 'string' 
            ? JSON.parse(selectedHackathon.members || '[]')
            : selectedHackathon.members || [];
        } catch (e) {
          console.error("Failed to parse members JSON:", e);
        }
        const membersCount = parsedMembers.length + 1;

        return (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1100,
            padding: '1.5rem'
          }}>
            <div style={{
              width: '100%',
              maxWidth: '680px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
              borderRadius: '0.75rem',
              border: '1px solid var(--border)',
              background: '#fff',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '85vh',
              overflow: 'hidden'
            }}>
              {/* Sticky Header */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                borderBottom: '1px solid var(--border)', 
                padding: '1.5rem 2rem',
                backgroundColor: '#fff'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 700, 
                    color: '#4f46e5', 
                    backgroundColor: '#e0e7ff', 
                    padding: '0.125rem 0.375rem', 
                    borderRadius: '4px', 
                    alignSelf: 'flex-start', 
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
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
                  style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem', cursor: 'pointer', borderRadius: '0.375rem' }}
                >
                  Close
                </button>
              </div>

              {/* Scrollable Content Body */}
              <div style={{
                padding: '2rem',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.75rem',
                flex: 1
              }}>
                {/* Project Details */}
                {(selectedHackathon.project_title || selectedHackathon.project_description || selectedHackathon.problem_statement) && (
                  <div>
                    <h4 style={{ 
                      fontSize: '0.9375rem', 
                      fontWeight: 600, 
                      color: 'var(--text-primary)', 
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
                        <>
                          <div><strong>Project Description:</strong></div>
                          <div style={{ 
                            padding: '0.875rem 1rem', 
                            backgroundColor: 'var(--bg-main)', 
                            borderRadius: 'var(--radius-md)', 
                            whiteSpace: 'pre-wrap', 
                            color: 'var(--text-secondary)',
                            lineHeight: 1.5,
                            border: '1px solid var(--border)'
                          }}>
                            {selectedHackathon.project_description}
                          </div>
                        </>
                      )}
                      {selectedHackathon.problem_statement && (
                        <>
                          <div><strong>Problem Statement:</strong></div>
                          <div style={{ 
                            padding: '0.875rem 1rem', 
                            backgroundColor: 'var(--bg-main)', 
                            borderRadius: 'var(--radius-md)', 
                            whiteSpace: 'pre-wrap', 
                            color: 'var(--text-secondary)',
                            lineHeight: 1.5,
                            border: '1px solid var(--border)'
                          }}>
                            {selectedHackathon.problem_statement}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Team Leader Section */}
                <div>
                  <h4 style={{ 
                    fontSize: '0.9375rem', 
                    fontWeight: 700, 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em', 
                    marginBottom: '0.75rem', 
                    color: 'var(--text-main)', 
                    borderBottom: '2px solid var(--border)', 
                    paddingBottom: '0.375rem' 
                  }}>
                    Team Leader Details
                  </h4>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                    gap: '1rem', 
                    fontSize: '0.875rem',
                    lineHeight: 1.5
                  }}>
                    <div><strong>Name:</strong> {selectedHackathon.leader_name}</div>
                    <div><strong>Email:</strong> <a href={`mailto:${selectedHackathon.leader_email}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>{selectedHackathon.leader_email}</a></div>
                    <div><strong>Phone:</strong> {formatDisplayPhone(selectedHackathon.leader_phone)}</div>
                    <div><strong>Role:</strong> {selectedHackathon.leader_role}</div>
                    {selectedHackathon.leader_role === 'Student' ? (
                      <>
                        <div><strong>Year:</strong> {selectedHackathon.leader_year}</div>
                        <div><strong>Branch:</strong> {selectedHackathon.leader_branch}</div>
                        <div style={{ gridColumn: 'span 2' }}><strong>College:</strong> {selectedHackathon.leader_institution}</div>
                      </>
                    ) : (
                      <>
                        <div><strong>Company:</strong> {selectedHackathon.leader_company}</div>
                        <div><strong>Job Title:</strong> {selectedHackathon.leader_job_title}</div>
                      </>
                    )}
                  </div>
                </div>

                {/* Team Members Section */}
                <div>
                  <h4 style={{ 
                    fontSize: '0.9375rem', 
                    fontWeight: 700, 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em', 
                    marginBottom: '0.75rem', 
                    color: 'var(--text-main)', 
                    borderBottom: '2px solid var(--border)', 
                    paddingBottom: '0.375rem' 
                  }}>
                    Team Members ({membersCount} Total)
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Visual Representation of Team Leader as Member 1 */}
                    <div style={{ 
                      padding: '1.25rem', 
                      border: '1px solid #c7d2fe', 
                      borderRadius: 'var(--radius-md)', 
                      backgroundColor: '#eef2ff', 
                      fontSize: '0.875rem' 
                    }}>
                      <div style={{ fontWeight: 700, color: '#4f46e5', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#4f46e5' }}></span>
                        Member 1: Team Leader
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem' }}>
                        <div><strong>Name:</strong> {selectedHackathon.leader_name}</div>
                        <div><strong>Email:</strong> {selectedHackathon.leader_email}</div>
                        <div><strong>Role:</strong> {selectedHackathon.leader_role}</div>
                      </div>
                    </div>

                    {parsedMembers.length === 0 ? (
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>No additional team members.</div>
                    ) : (
                      parsedMembers.map((m, idx) => (
                        <div key={idx} style={{ 
                          padding: '1.25rem', 
                          border: '1px solid var(--border)', 
                          borderRadius: 'var(--radius-md)', 
                          backgroundColor: 'var(--bg-main)', 
                          fontSize: '0.875rem' 
                        }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--text-muted)' }}></span>
                            Member {idx + 2} Details
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem' }}>
                            <div><strong>Name:</strong> {m.fullName}</div>
                            <div><strong>Email:</strong> {m.email}</div>
                            <div><strong>Phone:</strong> {m.phone}</div>
                            <div><strong>Role:</strong> {m.role}</div>
                            {m.role === 'Student' ? (
                              <>
                                <div><strong>Year:</strong> {m.year}</div>
                                <div><strong>Branch:</strong> {m.branch}</div>
                                <div style={{ gridColumn: 'span 2' }}><strong>College:</strong> {m.institution}</div>
                              </>
                            ) : (
                              <>
                                <div><strong>Company:</strong> {m.company}</div>
                                <div><strong>Job Title:</strong> {m.jobTitle}</div>
                              </>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Recognition Judge Details Modal */}
      {selectedRecognition && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1100,
          padding: '1.5rem'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '620px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            borderRadius: '0.75rem',
            border: '1px solid var(--border)',
            background: '#fff',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '85vh',
            overflow: 'hidden'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              borderBottom: '1px solid var(--border)', 
              padding: '1.25rem 1.75rem',
              backgroundColor: '#fff'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ 
                  fontSize: '0.75rem', 
                  fontWeight: 700, 
                  color: '#0284c7', 
                  backgroundColor: '#e0f2fe', 
                  padding: '0.125rem 0.375rem', 
                  borderRadius: '4px', 
                  alignSelf: 'flex-start', 
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Official Judge & Dignitary Record
                </span>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>
                  {selectedRecognition.full_name}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedRecognition(null)} 
                className="btn btn-secondary btn-sm"
                style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem', cursor: 'pointer', borderRadius: '0.375rem' }}
              >
                Close
              </button>
            </div>

            <div style={{
              padding: '1.75rem',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              flex: 1
            }}>
              <div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.25rem' }}>
                  Professional Profile
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '0.875rem' }}>
                  <div><strong>Designation:</strong> {selectedRecognition.designation}</div>
                  <div><strong>Organization:</strong> {selectedRecognition.organization}</div>
                  <div><strong>Email:</strong> <a href={`mailto:${selectedRecognition.email}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>{selectedRecognition.email}</a></div>
                  <div><strong>Mobile:</strong> {selectedRecognition.mobile}</div>
                  <div><strong>Experience:</strong> {selectedRecognition.experience_years ? `${selectedRecognition.experience_years} Years` : 'Not specified'}</div>
                  <div><strong>Domain Expertise:</strong> {selectedRecognition.domain_expertise || 'General'}</div>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.25rem' }}>
                  Evaluation Context
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '0.875rem' }}>
                  <div><strong>Event Evaluated:</strong> {selectedRecognition.event_name}</div>
                  <div><strong>Event Date:</strong> {selectedRecognition.event_date}</div>
                  <div><strong>Status:</strong> <span className={`status-pill status-${selectedRecognition.status}`}>{selectedRecognition.status}</span></div>
                  <div><strong>Certificate Sent:</strong> {selectedRecognition.certificate_sent === 1 ? 'Yes' : 'Pending'}</div>
                  {selectedRecognition.certificate_id && (
                    <div style={{ gridColumn: 'span 2' }}>
                      <strong>Certificate ID:</strong> <code style={{ backgroundColor: 'rgba(0,0,0,0.06)', padding: '0.125rem 0.375rem', borderRadius: '4px' }}>{selectedRecognition.certificate_id}</code>
                    </div>
                  )}
                </div>
              </div>

              {selectedRecognition.notes && (
                <div>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.25rem' }}>
                    Citation / Bio / Remarks
                  </h4>
                  <div style={{ 
                    padding: '0.875rem 1rem', 
                    backgroundColor: 'var(--bg-main)', 
                    borderRadius: 'var(--radius-md)', 
                    whiteSpace: 'pre-wrap', 
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                    border: '1px solid var(--border)',
                    fontSize: '0.875rem'
                  }}>
                    {selectedRecognition.notes}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Volunteer Details Modal */}
      {selectedVolunteer && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1100,
          padding: '1.5rem'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '620px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            borderRadius: '0.75rem',
            border: '1px solid var(--border)',
            background: '#fff',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '85vh',
            overflow: 'hidden'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              borderBottom: '1px solid var(--border)', 
              padding: '1.25rem 1.75rem',
              backgroundColor: '#fff'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ 
                  fontSize: '0.75rem', 
                  fontWeight: 700, 
                  color: '#059669', 
                  backgroundColor: '#ecfdf5', 
                  padding: '0.125rem 0.5rem', 
                  borderRadius: '4px', 
                  alignSelf: 'flex-start', 
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}>
                  <HeartHandshake size={14} /> Official Volunteer Record
                </span>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>
                  {selectedVolunteer.full_name}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedVolunteer(null)} 
                className="btn btn-secondary btn-sm"
                style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem', cursor: 'pointer', borderRadius: '0.375rem' }}
              >
                Close
              </button>
            </div>

            <div style={{
              padding: '1.75rem',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              flex: 1
            }}>
              <div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.25rem' }}>
                  Academic & Contact Profile
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '0.875rem' }}>
                  <div><strong>Student PIN / Roll:</strong> {selectedVolunteer.pin_number}</div>
                  <div><strong>Branch:</strong> {selectedVolunteer.branch}</div>
                  <div><strong>Year of Study:</strong> {selectedVolunteer.year_of_study}</div>
                  <div><strong>Email:</strong> <a href={`mailto:${selectedVolunteer.email}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>{selectedVolunteer.email}</a></div>
                  <div><strong>Mobile:</strong> {selectedVolunteer.mobile}</div>
                  <div><strong>Status:</strong> <span className={`status-pill status-${selectedVolunteer.status}`}>{selectedVolunteer.status}</span></div>
                  <div><strong>Certificate Sent:</strong> {selectedVolunteer.certificate_sent === 1 ? 'Yes' : 'Pending'}</div>
                  {selectedVolunteer.certificate_id && (
                    <div style={{ gridColumn: 'span 2' }}>
                      <strong>Certificate ID:</strong> <code style={{ backgroundColor: 'rgba(0,0,0,0.06)', padding: '0.125rem 0.375rem', borderRadius: '4px' }}>{selectedVolunteer.certificate_id}</code>
                      {' '}
                      <a
                        href={`/verify?id=${encodeURIComponent(selectedVolunteer.certificate_id)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'var(--primary)', textDecoration: 'underline', marginLeft: '0.5rem', fontSize: '0.8125rem' }}
                      >
                        Verify Certificate
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.25rem' }}>
                  Role & Assignment Preferences
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '0.875rem' }}>
                  <div><strong>Volunteer Track:</strong> {selectedVolunteer.volunteer_role}</div>
                  <div><strong>Target Event:</strong> {selectedVolunteer.event_name}</div>
                  <div style={{ gridColumn: 'span 2' }}><strong>Availability Commitment:</strong> {selectedVolunteer.availability}</div>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.25rem' }}>
                  Skills & Past Experience
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
                  <div>
                    <strong>Key Skills:</strong>
                    <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)' }}>{selectedVolunteer.skills}</p>
                  </div>
                  {selectedVolunteer.past_experience && (
                    <div>
                      <strong>Previous Volunteering / Organizing:</strong>
                      <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)' }}>{selectedVolunteer.past_experience}</p>
                    </div>
                  )}
                  {selectedVolunteer.notes && (
                    <div>
                      <strong>Motivation / Notes:</strong>
                      <div style={{ 
                        padding: '0.875rem 1rem', 
                        backgroundColor: 'var(--bg-main)', 
                        borderRadius: 'var(--radius-md)', 
                        whiteSpace: 'pre-wrap', 
                        color: 'var(--text-secondary)',
                        lineHeight: 1.5,
                        border: '1px solid var(--border)',
                        marginTop: '0.25rem'
                      }}>
                        {selectedVolunteer.notes}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Project Submission Full Details Modal */}
      {selectedSubmission && (() => {
        let membersList: any[] = [];
        try {
          membersList = JSON.parse(selectedSubmission.members || '[]');
        } catch (e) {}

        const infoWords = (selectedSubmission.project_info || '').trim().split(/\s+/).filter(Boolean).length;
        const problemWords = (selectedSubmission.problem_statement || '').trim().split(/\s+/).filter(Boolean).length;

        return (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1100,
            padding: '1.5rem'
          }}>
            <div style={{
              width: '100%',
              maxWidth: '760px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
              borderRadius: '0.75rem',
              border: '1px solid var(--border)',
              background: '#fff',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '90vh',
              overflow: 'hidden'
            }}>
              {/* Modal Header */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start', 
                borderBottom: '1px solid var(--border)', 
                padding: '1.25rem 1.75rem',
                backgroundColor: '#fff'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: 700, 
                      color: '#0891b2', 
                      backgroundColor: '#cffafe', 
                      padding: '0.125rem 0.5rem', 
                      borderRadius: '4px', 
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      TCEK/SUB/2026/{String(selectedSubmission.id).padStart(4, '0')}
                    </span>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#4f46e5',
                      backgroundColor: '#eef2ff',
                      padding: '0.125rem 0.5rem',
                      borderRadius: '4px',
                      textTransform: 'uppercase'
                    }}>
                      {selectedSubmission.event_name}
                    </span>
                  </div>
                  <h3 style={{ margin: '0.35rem 0 0', fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>
                    {selectedSubmission.project_title}
                  </h3>
                </div>
                <button 
                  onClick={() => setSelectedSubmission(null)} 
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem', cursor: 'pointer', borderRadius: '0.375rem' }}
                >
                  Close
                </button>
              </div>

              {/* Modal Content */}
              <div style={{
                padding: '1.75rem',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
                flex: 1
              }}>
                {/* Team & Leadership Profile */}
                <div>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.25rem' }}>
                    Team & Leadership Profile
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '0.875rem' }}>
                    <div><strong>Team Name:</strong> {selectedSubmission.team_name}</div>
                    <div><strong>Team Leader:</strong> {selectedSubmission.leader_name}</div>
                    <div><strong>Leader Email:</strong> <a href={`mailto:${selectedSubmission.leader_email}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>{selectedSubmission.leader_email}</a></div>
                    <div><strong>Leader Phone:</strong> <a href={`tel:${selectedSubmission.leader_phone}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>{formatDisplayPhone(selectedSubmission.leader_phone)}</a></div>
                    {selectedSubmission.institution && (
                      <div style={{ gridColumn: 'span 2' }}><strong>College / Institution:</strong> {selectedSubmission.institution}</div>
                    )}
                  </div>

                  {membersList.length > 0 && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Registered Members ({membersList.length}):</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.35rem' }}>
                        {membersList.map((m: any, idx: number) => (
                          <span key={idx} style={{
                            fontSize: '0.75rem',
                            padding: '0.2rem 0.5rem',
                            backgroundColor: '#f1f5f9',
                            border: '1px solid #e2e8f0',
                            borderRadius: '4px',
                            color: 'var(--text-main)'
                          }}>
                            {m.fullName || m.name || `Member ${idx + 1}`} {m.role ? `(${m.role})` : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Google Drive Presentation Storage */}
                <div style={{
                  padding: '1rem 1.25rem',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, color: '#64748b' }}>
                        Google Drive File Repository
                      </div>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
                        <FolderUp size={16} color="#4f46e5" />
                        {selectedSubmission.file_name || 'Presentation Document'}
                        {selectedSubmission.file_size ? (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                            ({(selectedSubmission.file_size / (1024 * 1024)).toFixed(2)} MB)
                          </span>
                        ) : null}
                      </div>
                    </div>
                    {selectedSubmission.drive_file_url && (
                      <a
                        href={selectedSubmission.drive_file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8125rem', padding: '0.35rem 0.75rem', textDecoration: 'none' }}
                      >
                        <ExternalLink size={14} /> Open Presentation in Drive
                      </a>
                    )}
                  </div>
                  {selectedSubmission.drive_folder_url && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Folder: <a href={selectedSubmission.drive_folder_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>{selectedSubmission.team_name} Event Folder</a>
                    </div>
                  )}
                </div>

                {/* Project Info Section */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.25rem' }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0 }}>
                      Project Information
                    </h4>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#059669', backgroundColor: '#ecfdf5', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                      {infoWords} / 1500 words
                    </span>
                  </div>
                  <div style={{
                    padding: '1rem',
                    backgroundColor: 'var(--bg-main)',
                    borderRadius: 'var(--radius-md)',
                    whiteSpace: 'pre-wrap',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                    border: '1px solid var(--border)',
                    fontSize: '0.875rem',
                    maxHeight: '220px',
                    overflowY: 'auto'
                  }}>
                    {selectedSubmission.project_info}
                  </div>
                </div>

                {/* Problem Statement Section */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.25rem' }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0 }}>
                      Problem Statement
                    </h4>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0284c7', backgroundColor: '#e0f2fe', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                      {problemWords} / 1000 words
                    </span>
                  </div>
                  <div style={{
                    padding: '1rem',
                    backgroundColor: 'var(--bg-main)',
                    borderRadius: 'var(--radius-md)',
                    whiteSpace: 'pre-wrap',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                    border: '1px solid var(--border)',
                    fontSize: '0.875rem',
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}>
                    {selectedSubmission.problem_statement}
                  </div>
                </div>

                {/* Submission Metadata & Status Controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                    Submitted: {new Date(selectedSubmission.created_at).toLocaleString()} | Current Status: <span className={`status-pill status-${selectedSubmission.status}`}>{selectedSubmission.status}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => {
                        handleUpdateStatus('project-submission', selectedSubmission.id, 'approved');
                        setSelectedSubmission(prev => prev ? { ...prev, status: 'approved' } : null);
                      }}
                      className="btn btn-primary btn-sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', backgroundColor: '#059669', borderColor: '#059669' }}
                    >
                      <Check size={14} /> Approve Submission
                    </button>
                    <button
                      onClick={() => {
                        handleUpdateStatus('project-submission', selectedSubmission.id, 'rejected');
                        setSelectedSubmission(prev => prev ? { ...prev, status: 'rejected' } : null);
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#dc2626' }}
                    >
                      <X size={14} /> Reject Submission
                    </button>
                    <button
                      onClick={() => {
                        handleDeleteApplication('project-submission', selectedSubmission.id, `Team ${selectedSubmission.team_name} submission`);
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#dc2626', borderColor: '#fca5a5', backgroundColor: '#fef2f2' }}
                      title="Delete from Database"
                    >
                      <Trash2 size={14} /> Delete from DB
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Custom Alert/Confirm/Danger Modal Dialog */}
      {dialogConfig.isOpen && (
        <div className="custom-modal-overlay">
          <div className="custom-modal-card">
            <div className="custom-modal-header">
              <div className={`custom-modal-icon-container ${
                dialogConfig.type === 'danger'
                  ? 'custom-modal-icon-danger'
                  : dialogConfig.type === 'alert'
                    ? 'custom-modal-icon-warning'
                    : 'custom-modal-icon-info'
              }`}>
                {dialogConfig.type === 'danger' && <Trash2 size={20} />}
                {dialogConfig.type === 'alert' && <AlertCircle size={20} />}
                {dialogConfig.type === 'confirm' && <Mail size={20} />}
              </div>
              <h3 className="custom-modal-title">
                {dialogConfig.title}
              </h3>
            </div>

            <p className="custom-modal-body">
              {dialogConfig.message}
            </p>

            <div className="custom-modal-footer">
              {(dialogConfig.type === 'confirm' || dialogConfig.type === 'danger') && (
                <button
                  type="button"
                  onClick={() => setDialogConfig(prev => ({ ...prev, isOpen: false }))}
                  className="custom-modal-btn-cancel"
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setDialogConfig(prev => ({ ...prev, isOpen: false }));
                  if (dialogConfig.type === 'confirm' || dialogConfig.type === 'danger') {
                    dialogConfig.onConfirm();
                  }
                }}
                className={dialogConfig.type === 'danger' ? 'custom-modal-btn-danger' : 'btn btn-primary'}
                style={
                  dialogConfig.type !== 'danger'
                    ? {
                        padding: '0.5rem 1.25rem',
                        fontSize: '0.875rem',
                        borderRadius: '0.375rem',
                        cursor: 'pointer'
                      }
                    : undefined
                }
              >
                {dialogConfig.confirmText || (dialogConfig.type === 'danger' ? 'Permanently Delete' : dialogConfig.type === 'confirm' ? 'Confirm' : 'OK')}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
