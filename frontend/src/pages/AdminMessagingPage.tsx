import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { API_BASE_URL } from '../config';
import { 
  Mail, 
  Send, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Eye, 
  Edit3, 
  RotateCcw,
  CheckSquare,
  Square,
  Lock,
  Award,
  Shield,
  HeartHandshake,
  Sparkles,
  Check,
  ChevronDown
} from 'lucide-react';

interface EventItem {
  id: number;
  title: string;
  category: string;
  date: string;
  time: string;
  location: string;
  speaker: string;
}

interface RecipientCounts {
  members: number;
  judges: number;
  coordinators: number;
  volunteers: number;
  total: number;
}

interface RecipientPreview {
  name: string;
  email: string;
  group: string;
  role: string;
}

export const AdminMessagingPage: React.FC = () => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  
  // Recipient checkboxes
  const [recipients, setRecipients] = useState({
    members: true,
    judges: true,
    coordinators: true,
    volunteers: true,
  });

  const [subject, setSubject] = useState<string>('');
  const [midMessage, setMidMessage] = useState<string>('');

  // Counts & preview
  const [counts, setCounts] = useState<RecipientCounts>({
    members: 0,
    judges: 0,
    coordinators: 0,
    volunteers: 0,
    total: 0,
  });
  const [previewList, setPreviewList] = useState<RecipientPreview[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);

  // Load events on mount
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/events`);
        if (res.ok) {
          const data = await res.json();
          setEvents(data);
          if (data.length > 0) {
            handleEventSelect(data[0].title);
          }
        }
      } catch (err) {
        console.error("Failed to fetch events:", err);
      }
    };
    fetchEvents();
  }, []);

  // Fixed top greeting & fixed bottom signoff (Non-editable boilerplate)
  const getFixedGreeting = (eventTitle: string) => 
    `Dear Mr./Ms. {name},\n\nWe are pleased to share an important announcement regarding "${eventTitle || 'Selected Event'}".`;

  const getFixedSignoff = () => 
    `Warm regards,\nEvent Organizing Committee & R&D Cell\nTrinity College of Engineering & Technology (Autonomous), Peddapalli`;

  const getDefaultMidText = () => 
    `Please review the event schedule, reporting guidelines, and instructions on our official portal. Ensure all necessary project assets, identity credentials, and requirements are prepared prior to the commencement of the session.\n\nIf you have any questions or require special accommodations, kindly reach out to the Registration Desk coordinators or reply to this communication.\n\nWe look forward to your active participation!`;

  const getFullMessage = () => 
    `${getFixedGreeting(selectedEvent)}\n\n${midMessage.trim()}\n\n${getFixedSignoff()}`;

  // Handle event selection and populate default subject & template message
  const handleEventSelect = (eventTitle: string, forceReset = false) => {
    setSelectedEvent(eventTitle);
    setStatusMessage(null);

    // Provide default subject
    setSubject(`Important Update: ${eventTitle} — Trinity R&D Cell`);

    // Provide default starter mid message if empty or forceReset
    if (forceReset || !midMessage || midMessage.trim() === '') {
      setMidMessage(getDefaultMidText());
    }
  };

  // Fetch live recipient counts whenever event or group selection changes
  useEffect(() => {
    if (!selectedEvent) return;

    const activeGroups: string[] = [];
    if (recipients.members) activeGroups.push('members');
    if (recipients.judges) activeGroups.push('judges');
    if (recipients.coordinators) activeGroups.push('coordinators');
    if (recipients.volunteers) activeGroups.push('volunteers');

    if (activeGroups.length === 0) {
      setCounts({ members: 0, judges: 0, coordinators: 0, volunteers: 0, total: 0 });
      setPreviewList([]);
      return;
    }

    const fetchCounts = async () => {
      setIsLoadingPreview(true);
      try {
        const token = localStorage.getItem('admin_token');
        const res = await fetch(
          `${API_BASE_URL}/api/admin/messaging/recipients?eventTitle=${encodeURIComponent(selectedEvent)}&types=${activeGroups.join(',')}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        if (res.ok) {
          const data = await res.json();
          setCounts(data.counts || { members: 0, judges: 0, coordinators: 0, volunteers: 0, total: 0 });
          setPreviewList(data.recipients || []);
        }
      } catch (err) {
        console.error("Error fetching recipient counts:", err);
      } finally {
        setIsLoadingPreview(false);
      }
    };

    const timer = setTimeout(fetchCounts, 250);
    return () => clearTimeout(timer);
  }, [selectedEvent, recipients]);

  // Master toggle: Select All
  const isAllSelected = recipients.members && recipients.judges && recipients.coordinators && recipients.volunteers;
  const toggleSelectAll = () => {
    const nextState = !isAllSelected;
    setRecipients({
      members: nextState,
      judges: nextState,
      coordinators: nextState,
      volunteers: nextState,
    });
  };

  const toggleGroup = (group: keyof typeof recipients) => {
    setRecipients(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const getSelectedGroupsList = () => {
    const list: string[] = [];
    if (recipients.members) list.push('members');
    if (recipients.judges) list.push('judges');
    if (recipients.coordinators) list.push('coordinators');
    if (recipients.volunteers) list.push('volunteers');
    return list;
  };

  const handleSendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!selectedEvent) {
      setStatusMessage({ type: 'error', text: 'Please select an event.' });
      return;
    }

    const groups = getSelectedGroupsList();
    if (groups.length === 0) {
      setStatusMessage({ type: 'error', text: 'Please select at least one recipient group.' });
      return;
    }

    if (!subject.trim()) {
      setStatusMessage({ type: 'error', text: 'Please provide an email subject.' });
      return;
    }

    if (!midMessage.trim()) {
      setStatusMessage({ type: 'error', text: 'Please write the announcement message content.' });
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmSend = async () => {
    setShowConfirmModal(false);
    setIsSending(true);
    setStatusMessage(null);

    const groups = getSelectedGroupsList();
    const token = localStorage.getItem('admin_token');

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/messaging/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          eventTitle: selectedEvent,
          recipientGroups: groups,
          subject: subject.trim(),
          message: getFullMessage()
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch event messages.');
      }

      setStatusMessage({
        type: 'success',
        text: data.message || `Successfully sent message to ${data.deliveredCount} recipients.`
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'An unexpected error occurred while sending messages.'
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AdminLayout>
      <div className="admin-page-container" style={{ maxWidth: '1320px', margin: '0 auto', paddingBottom: '3.5rem', width: '100%' }}>
        
        {/* TOP HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <h1 style={{ fontSize: '1.55rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                Event Messaging
              </h1>
              <span style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.35rem', 
                backgroundColor: '#ecfdf5', 
                color: '#047857', 
                padding: '0.2rem 0.65rem', 
                borderRadius: '9999px', 
                fontSize: '0.75rem', 
                fontWeight: 700, 
                border: '1px solid #a7f3d0' 
              }}>
                <Sparkles size={12} /> Live Broadcast Engine
              </span>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.84rem', margin: '0.2rem 0 0 0' }}>
              Compose official event updates and dispatch with guaranteed institutional branding
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            className="btn btn-secondary"
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.45rem', 
              fontSize: '0.85rem', 
              fontWeight: 700, 
              padding: '0.55rem 1.1rem',
              borderRadius: '9px',
              border: '1.5px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#1e293b',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              transition: 'all 0.2s'
            }}
          >
            <Eye size={16} color="#059669" />
            <span>Live Email Preview</span>
          </button>
        </div>

        {/* Status Alerts */}
        {statusMessage && (
          <div
            style={{
              padding: '0.75rem 1.1rem',
              borderRadius: '10px',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              backgroundColor: statusMessage.type === 'success' ? '#f0fdf4' : '#fef2f2',
              border: `1px solid ${statusMessage.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
              color: statusMessage.type === 'success' ? '#15803d' : '#b91c1c',
              fontSize: '0.88rem',
              fontWeight: 600,
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
            }}
          >
            {statusMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span style={{ flex: 1 }}>{statusMessage.text}</span>
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 800, fontSize: '1.2rem', padding: '0 0.25rem' }}
            >
              ×
            </button>
          </div>
        )}

        <style>{`
          .messaging-grid-layout {
            display: grid;
            grid-template-columns: 360px 1fr;
            gap: 1.25rem;
            align-items: start;
          }
          @media (max-width: 1024px) {
            .messaging-grid-layout {
              grid-template-columns: 1fr;
            }
          }
          .recipient-toggle-card {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.55rem 0.85rem;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.15s ease-in-out;
            user-select: none;
          }
          .recipient-toggle-card:hover {
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          }
          .message-compose-textarea {
            width: 100%;
            border: none;
            outline: none;
            background: transparent;
            font-family: inherit;
            font-size: 0.92rem;
            line-height: 1.6;
            color: #0f172a;
            padding: 0.85rem 1rem;
            resize: vertical;
            overflow-y: auto;
          }
          .message-compose-textarea:focus {
            outline: none;
          }
          .tag-pill-btn {
            font-size: 0.72rem;
            font-weight: 700;
            padding: 0.2rem 0.55rem;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.15s ease;
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
          }
          .tag-pill-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 2px 6px rgba(0,0,0,0.06);
          }
        `}</style>

        {/* 2-COLUMN WORKSPACE */}
        <form onSubmit={handleSendSubmit}>
          <div className="messaging-grid-layout">
            
            {/* LEFT COLUMN: 1. Target Event & 2. Select Recipients */}
            <div className="card" style={{ 
              padding: '1.25rem', 
              borderRadius: '16px', 
              border: '1.5px solid #e2e8f0', 
              backgroundColor: '#ffffff', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '1rem', 
              boxShadow: '0 4px 16px -2px rgba(0,0,0,0.04)' 
            }}>
              
              {/* 1. SELECT EVENT */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    width: '22px', 
                    height: '22px', 
                    borderRadius: '50%', 
                    backgroundColor: '#059669', 
                    color: '#ffffff', 
                    fontSize: '0.75rem', 
                    fontWeight: 800 
                  }}>
                    1
                  </span>
                  <h3 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800, color: '#0f172a' }}>
                    Select Event
                  </h3>
                </div>

                <div style={{ position: 'relative' }}>
                  <select
                    className="form-control"
                    value={selectedEvent}
                    onChange={(e) => handleEventSelect(e.target.value)}
                    style={{ 
                      fontWeight: 700, 
                      padding: '0.55rem 2.2rem 0.55rem 0.85rem', 
                      fontSize: '0.88rem', 
                      borderColor: '#cbd5e1',
                      borderRadius: '10px',
                      backgroundColor: '#f8fafc',
                      color: '#0f172a',
                      appearance: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {events.length === 0 ? (
                      <option value="">No events found</option>
                    ) : (
                      events.map((ev) => (
                        <option key={ev.id} value={ev.title}>
                          {ev.title} ({ev.category})
                        </option>
                      ))
                    )}
                  </select>
                  <ChevronDown size={16} color="#64748b" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                </div>
              </div>

              {/* DIVIDER */}
              <div style={{ height: '1px', backgroundColor: '#f1f5f9' }} />

              {/* 2. SELECT RECIPIENTS */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      width: '22px', 
                      height: '22px', 
                      borderRadius: '50%', 
                      backgroundColor: '#059669', 
                      color: '#ffffff', 
                      fontSize: '0.75rem', 
                      fontWeight: 800 
                    }}>
                      2
                    </span>
                    <h3 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800, color: '#0f172a' }}>
                      Select Recipients
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#059669',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.2rem 0.4rem',
                      borderRadius: '6px'
                    }}
                  >
                    {isAllSelected ? <CheckSquare size={14} /> : <Square size={14} />}
                    <span>Select All</span>
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  
                  {/* Members */}
                  <div
                    onClick={() => toggleGroup('members')}
                    className="recipient-toggle-card"
                    style={{
                      border: `1.5px solid ${recipients.members ? '#10b981' : '#e2e8f0'}`,
                      backgroundColor: recipients.members ? '#f0fdf4' : '#ffffff',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div style={{ 
                        width: '28px', 
                        height: '28px', 
                        borderRadius: '8px', 
                        backgroundColor: recipients.members ? '#dcfce7' : '#f1f5f9', 
                        color: recipients.members ? '#059669' : '#64748b',
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                      }}>
                        <Users size={14} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1e293b' }}>
                          Members (Participants)
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Registered attendees & teams</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <span style={{ 
                        fontSize: '0.74rem', 
                        fontWeight: 800, 
                        padding: '0.15rem 0.55rem', 
                        borderRadius: '9999px', 
                        backgroundColor: recipients.members && counts.members > 0 ? '#bbf7d0' : '#f1f5f9', 
                        color: recipients.members && counts.members > 0 ? '#166534' : '#64748b' 
                      }}>
                        {counts.members}
                      </span>
                      <div style={{ 
                        width: '18px', 
                        height: '18px', 
                        borderRadius: '5px', 
                        border: `1.5px solid ${recipients.members ? '#059669' : '#cbd5e1'}`,
                        backgroundColor: recipients.members ? '#059669' : '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff'
                      }}>
                        {recipients.members && <Check size={12} strokeWidth={3} />}
                      </div>
                    </div>
                  </div>

                  {/* Judges */}
                  <div
                    onClick={() => toggleGroup('judges')}
                    className="recipient-toggle-card"
                    style={{
                      border: `1.5px solid ${recipients.judges ? '#10b981' : '#e2e8f0'}`,
                      backgroundColor: recipients.judges ? '#f0fdf4' : '#ffffff',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div style={{ 
                        width: '28px', 
                        height: '28px', 
                        borderRadius: '8px', 
                        backgroundColor: recipients.judges ? '#dcfce7' : '#f1f5f9', 
                        color: recipients.judges ? '#059669' : '#64748b',
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                      }}>
                        <Award size={14} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1e293b' }}>
                          Judges & Evaluators
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Jury members & dignitaries</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <span style={{ 
                        fontSize: '0.74rem', 
                        fontWeight: 800, 
                        padding: '0.15rem 0.55rem', 
                        borderRadius: '9999px', 
                        backgroundColor: recipients.judges && counts.judges > 0 ? '#bbf7d0' : '#f1f5f9', 
                        color: recipients.judges && counts.judges > 0 ? '#166534' : '#64748b' 
                      }}>
                        {counts.judges}
                      </span>
                      <div style={{ 
                        width: '18px', 
                        height: '18px', 
                        borderRadius: '5px', 
                        border: `1.5px solid ${recipients.judges ? '#059669' : '#cbd5e1'}`,
                        backgroundColor: recipients.judges ? '#059669' : '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff'
                      }}>
                        {recipients.judges && <Check size={12} strokeWidth={3} />}
                      </div>
                    </div>
                  </div>

                  {/* Coordinators */}
                  <div
                    onClick={() => toggleGroup('coordinators')}
                    className="recipient-toggle-card"
                    style={{
                      border: `1.5px solid ${recipients.coordinators ? '#10b981' : '#e2e8f0'}`,
                      backgroundColor: recipients.coordinators ? '#f0fdf4' : '#ffffff',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div style={{ 
                        width: '28px', 
                        height: '28px', 
                        borderRadius: '8px', 
                        backgroundColor: recipients.coordinators ? '#dcfce7' : '#f1f5f9', 
                        color: recipients.coordinators ? '#059669' : '#64748b',
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                      }}>
                        <Shield size={14} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1e293b' }}>
                          Event Coordinators
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Desk & operations leads</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <span style={{ 
                        fontSize: '0.74rem', 
                        fontWeight: 800, 
                        padding: '0.15rem 0.55rem', 
                        borderRadius: '9999px', 
                        backgroundColor: recipients.coordinators && counts.coordinators > 0 ? '#bbf7d0' : '#f1f5f9', 
                        color: recipients.coordinators && counts.coordinators > 0 ? '#166534' : '#64748b' 
                      }}>
                        {counts.coordinators}
                      </span>
                      <div style={{ 
                        width: '18px', 
                        height: '18px', 
                        borderRadius: '5px', 
                        border: `1.5px solid ${recipients.coordinators ? '#059669' : '#cbd5e1'}`,
                        backgroundColor: recipients.coordinators ? '#059669' : '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff'
                      }}>
                        {recipients.coordinators && <Check size={12} strokeWidth={3} />}
                      </div>
                    </div>
                  </div>

                  {/* Volunteers */}
                  <div
                    onClick={() => toggleGroup('volunteers')}
                    className="recipient-toggle-card"
                    style={{
                      border: `1.5px solid ${recipients.volunteers ? '#10b981' : '#e2e8f0'}`,
                      backgroundColor: recipients.volunteers ? '#f0fdf4' : '#ffffff',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div style={{ 
                        width: '28px', 
                        height: '28px', 
                        borderRadius: '8px', 
                        backgroundColor: recipients.volunteers ? '#dcfce7' : '#f1f5f9', 
                        color: recipients.volunteers ? '#059669' : '#64748b',
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                      }}>
                        <HeartHandshake size={14} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1e293b' }}>
                          Volunteers
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Assigned student volunteers</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <span style={{ 
                        fontSize: '0.74rem', 
                        fontWeight: 800, 
                        padding: '0.15rem 0.55rem', 
                        borderRadius: '9999px', 
                        backgroundColor: recipients.volunteers && counts.volunteers > 0 ? '#bbf7d0' : '#f1f5f9', 
                        color: recipients.volunteers && counts.volunteers > 0 ? '#166534' : '#64748b' 
                      }}>
                        {counts.volunteers}
                      </span>
                      <div style={{ 
                        width: '18px', 
                        height: '18px', 
                        borderRadius: '5px', 
                        border: `1.5px solid ${recipients.volunteers ? '#059669' : '#cbd5e1'}`,
                        backgroundColor: recipients.volunteers ? '#059669' : '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff'
                      }}>
                        {recipients.volunteers && <Check size={12} strokeWidth={3} />}
                      </div>
                    </div>
                  </div>
                </div>

                {/* TOTAL RECIPIENTS STAT CARD */}
                <div style={{ 
                  marginTop: '0.85rem', 
                  padding: '0.75rem 0.95rem', 
                  borderRadius: '12px', 
                  background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)', 
                  border: '1.5px solid #a7f3d0', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '0.35rem' 
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#065f46', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Total Target Audience
                    </span>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: counts.total > 0 ? '#10b981' : '#cbd5e1' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                    <span style={{ color: '#047857', fontSize: '1.45rem', fontWeight: 900 }}>
                      {isLoadingPreview ? '...' : counts.total}
                    </span>
                    <span style={{ color: '#065f46', fontSize: '0.85rem', fontWeight: 700 }}>verified recipients</span>
                  </div>
                  {previewList.length > 0 && (
                    <div style={{ fontSize: '0.72rem', color: '#047857', opacity: 0.9, borderTop: '1px solid #a7f3d0', paddingTop: '0.35rem', marginTop: '0.2rem' }}>
                      Sample: <strong>{previewList[0]?.name}</strong> ({previewList[0]?.email})
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: 3. SUBJECT & 4. EXECUTIVE LETTERHEAD COMPOSER & 5. DISPATCH */}
            <div className="card" style={{ 
              padding: '1.25rem 1.45rem', 
              borderRadius: '16px', 
              border: '1.5px solid #cbd5e1', 
              backgroundColor: '#ffffff', 
              boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05)' 
            }}>
              
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', paddingBottom: '0.65rem', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                  <span style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    width: '26px', 
                    height: '26px', 
                    borderRadius: '8px', 
                    backgroundColor: '#059669', 
                    color: '#ffffff'
                  }}>
                    <Edit3 size={15} />
                  </span>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>
                    Executive Message Composer
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => handleEventSelect(selectedEvent, true)}
                  title="Reset to default template"
                  style={{ 
                    background: 'none', 
                    border: '1px solid #cbd5e1', 
                    borderRadius: '6px',
                    color: '#059669', 
                    fontSize: '0.75rem', 
                    fontWeight: 700, 
                    cursor: 'pointer', 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '0.3rem', 
                    padding: '0.25rem 0.6rem',
                    backgroundColor: '#f8fafc'
                  }}
                >
                  <RotateCcw size={12} /> Reset Template
                </button>
              </div>

              {/* 3. SUBJECT FIELD */}
              <div className="form-group" style={{ marginBottom: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#ecfdf5', color: '#047857', fontSize: '0.7rem', fontWeight: 800, border: '1px solid #a7f3d0' }}>3</span>
                    <Edit3 size={13} color="#059669" />
                    <span>Subject Line</span>
                  </label>
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Editable</span>
                </div>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="Enter email subject line..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  style={{ 
                    fontWeight: 700, 
                    fontSize: '0.92rem', 
                    padding: '0.55rem 0.85rem', 
                    borderColor: '#cbd5e1', 
                    borderRadius: '10px',
                    backgroundColor: '#f8fafc',
                    color: '#0f172a'
                  }}
                />
              </div>

              {/* 4. UNIFIED EXECUTIVE LETTERHEAD CANVAS */}
              <div className="form-group" style={{ marginBottom: '0.85rem' }}>
                
                {/* Header & Quick-insert tag bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#ecfdf5', color: '#047857', fontSize: '0.7rem', fontWeight: 800, border: '1px solid #a7f3d0' }}>4</span>
                    <Mail size={13} color="#059669" />
                    <span>Message Body (Official Letterhead)</span>
                  </label>

                  {/* Insert Tags */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ fontSize: '0.7rem', color: '#64748b', marginRight: '0.2rem' }}>Insert:</span>
                    <button
                      type="button"
                      onClick={() => setMidMessage(prev => prev + ' {name}')}
                      title="Inserts receiver name"
                      className="tag-pill-btn"
                      style={{ backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}
                    >
                      + {'{name}'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setMidMessage(prev => prev + ' {event}')}
                      title="Inserts event title"
                      className="tag-pill-btn"
                      style={{ backgroundColor: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd' }}
                    >
                      + {'{event}'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setMidMessage(prev => prev + ' {role}')}
                      title="Inserts recipient role"
                      className="tag-pill-btn"
                      style={{ backgroundColor: '#faf5ff', color: '#7e22ce', border: '1px solid #e9d5ff' }}
                    >
                      + {'{role}'}
                    </button>
                    <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 700, backgroundColor: '#ecfdf5', padding: '0.15rem 0.5rem', borderRadius: '6px' }}>
                      {midMessage.length} chars
                    </span>
                  </div>
                </div>

                {/* THE UNIFIED LETTERHEAD CARD */}
                <div style={{ 
                  borderRadius: '12px', 
                  border: '1.5px solid #cbd5e1', 
                  backgroundColor: '#ffffff', 
                  overflow: 'hidden',
                  boxShadow: '0 3px 12px rgba(0,0,0,0.03)'
                }}>
                  
                  {/* TOP LOCKED GREETING */}
                  <div style={{ 
                    backgroundColor: '#f8fafc', 
                    padding: '0.65rem 1rem', 
                    borderBottom: '1px solid #e2e8f0' 
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                      <span style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '0.3rem', 
                        fontSize: '0.68rem', 
                        fontWeight: 800, 
                        color: '#047857', 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.04em',
                        backgroundColor: '#ecfdf5',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        border: '1px solid #a7f3d0'
                      }}>
                        <Lock size={10} /> Locked Official Greeting
                      </span>
                      <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Personalized per receiver</span>
                    </div>

                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem' }}>
                      Dear Mr./Ms. <span style={{ color: '#059669', backgroundColor: '#ecfdf5', padding: '0.1rem 0.4rem', borderRadius: '4px', border: '1px solid #a7f3d0' }}>{'{name}'}</span>,
                    </div>
                    <div style={{ marginTop: '0.2rem', color: '#334155', fontSize: '0.86rem' }}>
                      We are pleased to share an important announcement regarding <strong>"{selectedEvent || 'Selected Event'}"</strong>.
                    </div>
                  </div>

                  {/* EDITABLE WRITING SURFACE (SEAMLESS IN THE MIDDLE) */}
                  <div style={{ position: 'relative', backgroundColor: '#ffffff' }}>
                    <textarea
                      required
                      rows={5}
                      className="message-compose-textarea"
                      placeholder="Type your custom announcement, reporting guidelines, or schedule updates here..."
                      value={midMessage}
                      onChange={(e) => setMidMessage(e.target.value)}
                      style={{
                        minHeight: '120px',
                        maxHeight: '300px'
                      }}
                    />
                  </div>

                  {/* BOTTOM LOCKED SIGNOFF */}
                  <div style={{ 
                    backgroundColor: '#f8fafc', 
                    padding: '0.65rem 1rem', 
                    borderTop: '1px solid #e2e8f0' 
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <span style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '0.3rem', 
                        fontSize: '0.68rem', 
                        fontWeight: 800, 
                        color: '#475569', 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.04em',
                        backgroundColor: '#f1f5f9',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        border: '1px solid #e2e8f0'
                      }}>
                        <Lock size={10} /> Locked Official Sign-off
                      </span>
                      <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Trinity R&D Cell Seal Attached</span>
                    </div>

                    <div style={{ color: '#334155', fontWeight: 500, fontSize: '0.84rem', lineHeight: 1.45 }}>
                      Warm regards,<br />
                      <strong style={{ color: '#0f172a' }}>Event Organizing Committee & R&D Cell</strong><br />
                      <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Trinity College of Engineering & Technology (Autonomous), Peddapalli</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.35rem', fontSize: '0.72rem', color: '#64748b' }}>
                  <span>Note: Only edit the middle text. Header and sign-off are automatically attached and personalized upon sending.</span>
                </div>
              </div>

              {/* 5. SEND MESSAGE ACTION BAR */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                paddingTop: '0.85rem', 
                borderTop: '1px solid #f1f5f9', 
                flexWrap: 'wrap', 
                gap: '0.75rem' 
              }}>
                <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                  <span>Audience: <strong style={{ color: '#0f172a' }}>{counts.total} recipients</strong> selected across <strong style={{ color: '#059669' }}>{getSelectedGroupsList().length} group(s)</strong></span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowPreviewModal(true)}
                    className="btn btn-secondary"
                    style={{ 
                      padding: '0.65rem 1.15rem', 
                      fontSize: '0.88rem', 
                      fontWeight: 700,
                      borderRadius: '9px'
                    }}
                  >
                    <Eye size={15} color="#059669" /> Preview
                  </button>

                  <button
                    type="submit"
                    disabled={isSending || counts.total === 0 || !subject.trim() || !midMessage.trim()}
                    className="btn btn-primary"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.65rem 1.75rem',
                      fontSize: '0.94rem',
                      fontWeight: 800,
                      borderRadius: '9px',
                      background: (isSending || counts.total === 0 || !subject.trim() || !midMessage.trim()) 
                        ? '#cbd5e1' 
                        : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                      borderColor: 'transparent',
                      boxShadow: (isSending || counts.total === 0 || !subject.trim() || !midMessage.trim())
                        ? 'none'
                        : '0 4px 14px rgba(5, 150, 105, 0.35)',
                      cursor: (isSending || counts.total === 0 || !subject.trim() || !midMessage.trim()) ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="spinner-icon" size={16} /> Dispatching...
                      </>
                    ) : (
                      <>
                        <Send size={16} /> Send Message ({counts.total})
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* LIVE EMAIL PREVIEW MODAL (FIXED CUTOFF & BEAUTIFIED) */}
        {showPreviewModal && (
          <div 
            className="custom-modal-backdrop" 
            style={{ 
              position: 'fixed', 
              inset: 0, 
              backgroundColor: 'rgba(15, 23, 42, 0.65)', 
              backdropFilter: 'blur(4px)',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              zIndex: 1200, 
              padding: '1.25rem' 
            }}
          >
            <div 
              className="custom-modal" 
              style={{ 
                maxWidth: '720px', 
                width: '100%', 
                maxHeight: '92vh', 
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#ffffff',
                borderRadius: '20px',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)',
                overflow: 'hidden',
                border: '1px solid #cbd5e1'
              }}
            >
              {/* STICKY MODAL TOP BAR (MAC WINDOW STYLE) */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '0.85rem 1.4rem', 
                backgroundColor: '#ffffff',
                borderBottom: '1px solid #e2e8f0',
                flexShrink: 0
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                  </div>
                  <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', marginLeft: '0.3rem' }}>
                    Recipient Email Simulation
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#059669', backgroundColor: '#ecfdf5', padding: '0.1rem 0.5rem', borderRadius: '9999px', fontWeight: 700, border: '1px solid #a7f3d0' }}>
                    Landing Page Light Theme
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    fontSize: '1.4rem', 
                    cursor: 'pointer', 
                    color: '#94a3b8',
                    lineHeight: 1,
                    padding: '0.2rem'
                  }}
                >
                  ×
                </button>
              </div>

              {/* SIMULATED EMAIL CLIENT HEADER BAR */}
              <div style={{ 
                backgroundColor: '#f8fafc', 
                padding: '0.65rem 1.4rem', 
                borderBottom: '1px solid #e2e8f0',
                fontSize: '0.78rem',
                color: '#475569',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem',
                flexShrink: 0
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontWeight: 700, width: '45px', color: '#64748b' }}>From:</span>
                  <span style={{ color: '#0f172a', fontWeight: 600 }}>Trinity R&D Cell &lt;tcekrdcell@gmail.com&gt;</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontWeight: 700, width: '45px', color: '#64748b' }}>To:</span>
                  <span style={{ color: '#0f172a', fontWeight: 600 }}>
                    {previewList[0]?.name || 'Mohammad Fayaz'} &lt;{previewList[0]?.email || 'mdfayaz9963@gmail.com'}&gt;
                  </span>
                  <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', fontSize: '0.68rem', fontWeight: 800, padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                    {previewList[0]?.role || 'Team Leader'}
                  </span>
                </div>
              </div>

              {/* SCROLLABLE EMAIL CANVAS (NEVER CUT OFF) */}
              <div style={{ 
                flex: 1, 
                overflowY: 'auto', 
                padding: '1.5rem', 
                backgroundColor: '#f1f5f9' 
              }}>
                <div style={{ 
                  backgroundColor: '#ffffff', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '14px', 
                  padding: '28px', 
                  boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
                  maxWidth: '600px',
                  margin: '0 auto'
                }}>
                  
                  {/* Institutional Letterhead Banner */}
                  <div style={{ textAlign: 'center', borderBottom: '1.5px solid #f1f5f9', paddingBottom: '20px', marginBottom: '22px' }}>
                    <div style={{ color: '#059669', fontSize: '20px', fontWeight: 900, letterSpacing: '-0.01em' }}>
                      Trinity College of Engineering & Technology
                    </div>
                    <div style={{ color: '#64748b', fontSize: '12px', marginTop: '3px', fontWeight: 600 }}>
                      Research & Development (R&D) Cell • Official Event Notification
                    </div>
                    <div style={{ display: 'inline-block', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', fontSize: '11px', fontWeight: 800, padding: '4px 14px', borderRadius: '9999px', marginTop: '12px' }}>
                      {selectedEvent || 'Event Name'}
                    </div>
                  </div>

                  {/* Subject Title */}
                  <h3 style={{ color: '#0f172a', fontSize: '19px', fontWeight: 900, margin: '0 0 16px 0', lineHeight: 1.35 }}>
                    {(subject || 'Important Announcement')
                      .replace(/\{\{\s*name\s*\}\}/gi, previewList[0]?.name || 'Mohammad Fayaz')
                      .replace(/\{\s*name\s*\}/gi, previewList[0]?.name || 'Mohammad Fayaz')}
                  </h3>

                  {/* Rendered Email Body with Paragraphs */}
                  <div style={{ color: '#334155', fontSize: '14px', lineHeight: 1.7 }}>
                    {getFullMessage()
                      .replace(/\{\{\s*name\s*\}\}/gi, previewList[0]?.name || 'Mohammad Fayaz')
                      .replace(/\{\s*name\s*\}/gi, previewList[0]?.name || 'Mohammad Fayaz')
                      .replace(/\[\s*Recipient\s*Name\s*\]/gi, previewList[0]?.name || 'Mohammad Fayaz')
                      .replace(/\[\s*Name\s*\]/gi, previewList[0]?.name || 'Mohammad Fayaz')
                      .replace(/\{\{\s*event\s*\}\}/gi, selectedEvent || 'Event Name')
                      .replace(/\{\s*event\s*\}/gi, selectedEvent || 'Event Name')
                      .replace(/\{\{\s*role\s*\}\}/gi, previewList[0]?.role || 'Team Leader')
                      .replace(/\{\s*role\s*\}/gi, previewList[0]?.role || 'Team Leader')
                      .replace(/^Dear\s+(?:Participant\s*\/\s*Team\s*Member|Participant|Team\s*Member|Member)\s*,/im, `Dear Mr./Ms. ${previewList[0]?.name || 'Mohammad Fayaz'},`)
                      .split('\n')
                      .filter(p => p.trim() !== '')
                      .map((p, idx) => (
                        <p key={idx} style={{ margin: '0 0 14px 0' }}>{p}</p>
                      ))}
                  </div>

                  {/* Verified Metadata Box */}
                  <div style={{ backgroundColor: '#f0fdf4', borderLeft: '3px solid #10b981', padding: '12px 16px', borderRadius: '6px', margin: '20px 0', fontSize: '12px', color: '#166534', lineHeight: 1.6 }}>
                    <strong>Event:</strong> {selectedEvent}<br />
                    <strong>Recipient:</strong> {previewList[0]?.name || 'Mohammad Fayaz'} ({previewList[0]?.role || 'Team Leader'})<br />
                    <strong>Audience:</strong> {getSelectedGroupsList().join(', ')}
                  </div>

                  {/* Institutional Footer */}
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '18px', textAlign: 'center', color: '#94a3b8', fontSize: '11px', lineHeight: 1.5 }}>
                    Research & Development (R&D) Cell<br />
                    Trinity College of Engineering & Technology (Autonomous), Peddapalli<br />
                    © 2026 R&D Cell TCEK. All rights reserved.
                  </div>
                </div>
              </div>

              {/* STICKY MODAL FOOTER (ALWAYS IN SIGHT) */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '0.9rem 1.4rem', 
                backgroundColor: '#ffffff',
                borderTop: '1px solid #e2e8f0',
                flexShrink: 0
              }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Live simulation for verified recipient <strong>{previewList[0]?.name || 'Mohammad Fayaz'}</strong>
                </span>

                <div style={{ display: 'flex', gap: '0.6rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowPreviewModal(false)}
                    className="btn btn-secondary"
                    style={{ padding: '0.55rem 1.15rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700 }}
                  >
                    Close Preview
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowPreviewModal(false);
                      setShowConfirmModal(true);
                    }}
                    className="btn btn-primary"
                    style={{ 
                      padding: '0.55rem 1.35rem', 
                      borderRadius: '8px', 
                      fontSize: '0.85rem', 
                      fontWeight: 800,
                      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                      borderColor: 'transparent',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <Send size={14} /> Proceed to Dispatch ({counts.total})
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CONFIRMATION MODAL */}
        {showConfirmModal && (
          <div className="custom-modal-backdrop" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1300, padding: '1rem' }}>
            <div className="custom-modal card" style={{ maxWidth: '490px', width: '100%', padding: '2rem', borderRadius: '18px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.2rem' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Send size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>
                    Confirm Message Dispatch
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
                    Verify audience and subject before broadcasting
                  </p>
                </div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '1rem 1.15rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.25rem', fontSize: '0.86rem' }}>
                <div style={{ marginBottom: '0.55rem' }}>
                  <strong style={{ color: '#475569' }}>Event:</strong> <span style={{ color: '#059669', fontWeight: 700 }}>{selectedEvent}</span>
                </div>
                <div style={{ marginBottom: '0.55rem' }}>
                  <strong style={{ color: '#475569' }}>Subject:</strong> <span style={{ fontWeight: 600, color: '#0f172a' }}>{subject}</span>
                </div>
                <div style={{ marginBottom: '0.55rem' }}>
                  <strong style={{ color: '#475569' }}>Target Groups:</strong> <span style={{ fontWeight: 600 }}>{getSelectedGroupsList().join(', ')}</span>
                </div>
                <div style={{ paddingTop: '0.55rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, color: '#334155' }}>Total Delivery Volume:</span>
                  <strong style={{ color: '#059669', fontSize: '1.05rem', fontWeight: 900 }}>{counts.total} recipients</strong>
                </div>
              </div>

              <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 1.5rem 0', lineHeight: 1.5 }}>
                This message will be dispatched in official institutional light theme to all verified emails. Are you sure you want to proceed?
              </p>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="btn btn-secondary"
                  style={{ padding: '0.6rem 1.3rem', borderRadius: '8px', fontSize: '0.88rem', fontWeight: 700 }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSend}
                  className="btn btn-primary"
                  style={{ 
                    padding: '0.6rem 1.45rem', 
                    borderRadius: '8px',
                    fontSize: '0.88rem',
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', 
                    borderColor: 'transparent', 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '0.45rem',
                    boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)'
                  }}
                >
                  <Send size={15} /> Yes, Send Messages
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
