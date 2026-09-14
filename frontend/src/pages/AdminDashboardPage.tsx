import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { AdminLayout } from '../components/AdminLayout';
import { Download, Check, X, Layers, Calendar, Mail, Loader2, Eye, Award } from 'lucide-react';

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
  created_at: string;
}

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = location.pathname.includes('/events') ? 'event' 
    : location.pathname.includes('/hackathons') ? 'hackathon' 
    : location.pathname.includes('/recognition') ? 'recognition' 
    : 'club';
  const [clubApps, setClubApps] = useState<ClubApplication[]>([]);
  const [eventRegs, setEventRegs] = useState<EventRegistration[]>([]);
  const [hackathonRegs, setHackathonRegs] = useState<HackathonRegistration[]>([]);
  const [recognitionApps, setRecognitionApps] = useState<RecognitionApplication[]>([]);
  const [selectedHackathon, setSelectedHackathon] = useState<HackathonRegistration | null>(null);
  const [selectedRecognition, setSelectedRecognition] = useState<RecognitionApplication | null>(null);
  
  // Filtering & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [eventFilter, setEventFilter] = useState('all');
  const [hackathonFilter, setHackathonFilter] = useState('all');
  const [certSentFilter, setCertSentFilter] = useState<'all' | 'sent' | 'pending'>('all');

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

    showCustomConfirm(
      "Send Hackathon Certificates",
      `Are you sure you want to generate and dispatch certificates to ALL approved team members registered for the hackathon "${hackathonFilter}"?`,
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

  // Update status action
  const handleUpdateStatus = async (type: 'club' | 'event' | 'hackathon' | 'hackathon-certificate-type' | 'recognition', id: number, status: string) => {
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
    hackathonRegs.forEach(reg => {
      if (reg.leader_branch) {
        branches.add(reg.leader_branch.toUpperCase());
      }
    });
    return Array.from(branches);
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
    const matchesBranch = branchFilter === 'all' || reg.branch.toUpperCase() === branchFilter.toUpperCase();
    const matchesEvent = eventFilter === 'all' || reg.event_name === eventFilter;
    const matchesCertSent = certSentFilter === 'all' ||
      (certSentFilter === 'sent' && reg.certificate_sent === 1) ||
      (certSentFilter === 'pending' && (!reg.certificate_sent || reg.certificate_sent === 0));
    return matchesSearch && matchesBranch && matchesEvent && matchesCertSent;
  });

  const filteredHackathonRegs = hackathonRegs.filter(reg => {
    const matchesSearch = reg.leader_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          reg.team_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (reg.project_title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          reg.leader_email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || reg.status === statusFilter;
    const matchesBranch = branchFilter === 'all' || 
      (reg.leader_branch && reg.leader_branch.toUpperCase() === branchFilter.toUpperCase());
    const matchesHackathon = hackathonFilter === 'all' || 
      (reg.hackathon_name || 'R&D AlphaQuest Hackathon') === hackathonFilter;
    return matchesSearch && matchesStatus && matchesBranch && matchesHackathon;
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
            <span>{activeTab === 'hackathon' ? 'Approved Teams' : activeTab === 'recognition' ? 'Approved Judges' : 'Approved Seats'}</span>
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

        {activeTab !== 'hackathon' && (
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
              : "Search student, email, or PIN..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {activeTab === 'club' || activeTab === 'hackathon' || activeTab === 'recognition' ? (
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
          ) : (
            <select
              className="admin-filter-select"
              value={certSentFilter}
              onChange={(e) => setCertSentFilter(e.target.value as 'all' | 'sent' | 'pending')}
            >
              <option value="all">All Certificates</option>
              <option value="sent">Sent Only</option>
              <option value="pending">Pending Only</option>
            </select>
          )}

          {activeTab === 'recognition' && (
            <select
              className="admin-filter-select"
              value={certSentFilter}
              onChange={(e) => setCertSentFilter(e.target.value as 'all' | 'sent' | 'pending')}
            >
              <option value="all">All Dispatch States</option>
              <option value="sent">Certificate Sent</option>
              <option value="pending">Certificate Pending</option>
            </select>
          )}

          {activeTab !== 'recognition' && (
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
          )}

          {(activeTab === 'event' || activeTab === 'recognition') && (
            <select
              className="admin-filter-select"
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
            >
              <option value="all">All Events</option>
              {(activeTab === 'recognition' ? getRecognitionEvents() : getEvents()).map((evt, idx) => (
                <option key={idx} value={evt}>{evt}</option>
              ))}
            </select>
          )}

          {activeTab === 'hackathon' && (
            <select
              className="admin-filter-select"
              value={hackathonFilter}
              onChange={(e) => setHackathonFilter(e.target.value)}
            >
              <option value="all">All Hackathons</option>
              {getHackathons().map((hack, idx) => (
                <option key={idx} value={hack}>{hack}</option>
              ))}
            </select>
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
              ) : activeTab === 'event' ? (
                <tr>
                  <th>Student Info</th>
                  <th>Academic Profile</th>
                  <th>Target Event</th>
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
              ) : (
                <tr>
                  <th>Team & Leader Info</th>
                  <th>Project Info</th>
                  <th>Problem Statement</th>
                  <th>Members</th>
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
              ) : activeTab === 'event' ? (
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
                  filteredRecognitionApps.map(app => (
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
                          {app.status === 'pending' && (
                            <div className="actions-cell">
                              <button onClick={() => handleUpdateStatus('recognition', app.id, 'approved')} className="btn-action approve" title="Approve Judge Recognition">
                                <Check size={14} />
                              </button>
                              <button onClick={() => handleUpdateStatus('recognition', app.id, 'rejected')} className="btn-action reject" title="Reject Application">
                                <X size={14} />
                              </button>
                            </div>
                          )}
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
              ) : (
                filteredHackathonRegs.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                      No hackathon registrations match the filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredHackathonRegs.map(reg => {
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
                            {reg.leader_email} | {reg.leader_phone}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Role: {reg.leader_role} {reg.leader_role === 'Student' ? `(${reg.leader_branch})` : `(${reg.leader_company})`}
                          </div>
                        </td>
                        <td>
                          {reg.project_title ? (
                            <strong style={{ display: 'block', fontSize: '0.875rem', color: 'var(--primary)' }}>{reg.project_title}</strong>
                          ) : null}
                          {reg.project_description ? (
                            <div style={{ maxHeight: '60px', overflowY: 'auto', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                              {reg.project_description}
                            </div>
                          ) : (!reg.project_title ? <span style={{ color: 'var(--text-muted)' }}>—</span> : null)}
                        </td>
                        <td style={{ maxWidth: '250px', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                          <div style={{ maxHeight: '60px', overflowY: 'auto' }}>{reg.problem_statement || '—'}</div>
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
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-start' }}>
                            <span className={`status-pill status-${reg.status}`}>{reg.status}</span>
                            
                            {reg.status === 'pending' && (
                              <div className="actions-cell" style={{ marginTop: '0.5rem' }}>
                                <button onClick={() => handleUpdateStatus('hackathon', reg.id, 'approved')} className="btn-action approve" title="Approve Registration">
                                  <Check size={14} />
                                </button>
                                <button onClick={() => handleUpdateStatus('hackathon', reg.id, 'rejected')} className="btn-action reject" title="Reject Registration">
                                  <X size={14} />
                                </button>
                              </div>
                            )}
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
                    <div><strong>Phone:</strong> {selectedHackathon.leader_phone}</div>
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
