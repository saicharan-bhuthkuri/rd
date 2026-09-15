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
  Square
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
      <div className="admin-page-container" style={{ maxWidth: '1280px', margin: '0 auto', paddingBottom: '1rem' }}>
        {/* Top Header (Compact & Viewport-Friendly) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Event Messaging
              </h1>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', backgroundColor: '#ecfdf5', color: '#047857', padding: '0.15rem 0.6rem', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 700, border: '1px solid #a7f3d0' }}>
                <Mail size={12} /> Broadcast
              </span>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '0.15rem 0 0 0' }}>
              Targeted messaging to event participants, judges, coordinators, and volunteers
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 600, padding: '0.45rem 0.95rem' }}
          >
            <Eye size={15} color="#059669" />
            <span>Live Email Preview</span>
          </button>
        </div>

        {/* Status Alerts */}
        {statusMessage && (
          <div
            style={{
              padding: '0.65rem 1rem',
              borderRadius: '10px',
              marginBottom: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              backgroundColor: statusMessage.type === 'success' ? '#f0fdf4' : '#fef2f2',
              border: `1px solid ${statusMessage.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
              color: statusMessage.type === 'success' ? '#15803d' : '#b91c1c',
              fontSize: '0.85rem',
              fontWeight: 600
            }}
          >
            {statusMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span style={{ flex: 1 }}>{statusMessage.text}</span>
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 800, fontSize: '1.1rem' }}
            >
              ×
            </button>
          </div>
        )}

        <style>{`
          .messaging-grid-layout {
            display: grid;
            grid-template-columns: 350px 1fr;
            gap: 1.15rem;
            align-items: start;
          }
          @media (max-width: 990px) {
            .messaging-grid-layout {
              grid-template-columns: 1fr;
            }
          }
          .message-compose-textarea:focus {
            outline: none;
            border-color: #059669 !important;
            box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.15) !important;
          }
        `}</style>

        {/* 2-COLUMN COMPACT WORKSPACE */}
        <form onSubmit={handleSendSubmit}>
          <div className="messaging-grid-layout">
            
            {/* LEFT COLUMN: 1. Target Event & 2. Select Recipients in ONE Unified Panel */}
            <div className="card" style={{ padding: '1.15rem', borderRadius: '14px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', gap: '0.85rem', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              
              {/* 1. SELECT EVENT */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.45rem' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#059669', color: '#ffffff', fontSize: '0.75rem', fontWeight: 800 }}>
                    1
                  </span>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                    Select Event
                  </h3>
                </div>

                <select
                  className="form-control"
                  value={selectedEvent}
                  onChange={(e) => handleEventSelect(e.target.value)}
                  style={{ fontWeight: 600, padding: '0.45rem 0.75rem', fontSize: '0.85rem', borderColor: '#cbd5e1' }}
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
              </div>

              {/* DIVIDER */}
              <div style={{ height: '1px', backgroundColor: '#f1f5f9' }} />

              {/* 2. SELECT RECIPIENTS */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.55rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#059669', color: '#ffffff', fontSize: '0.75rem', fontWeight: 800 }}>
                      2
                    </span>
                    <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
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
                      gap: '0.2rem'
                    }}
                  >
                    {isAllSelected ? <CheckSquare size={14} /> : <Square size={14} />}
                    <span>Select All</span>
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.38rem' }}>
                  {/* Members */}
                  <label
                    onClick={() => toggleGroup('members')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.42rem 0.65rem',
                      borderRadius: '8px',
                      border: `1.5px solid ${recipients.members ? '#10b981' : '#e2e8f0'}`,
                      backgroundColor: recipients.members ? '#f0fdf4' : '#ffffff',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <input
                        type="checkbox"
                        checked={recipients.members}
                        onChange={() => {}}
                        style={{ accentColor: '#059669', width: '15px', height: '15px' }}
                      />
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e293b' }}>
                        Members (Participants)
                      </span>
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: '9999px', backgroundColor: recipients.members ? '#bbf7d0' : '#f1f5f9', color: recipients.members ? '#166534' : '#64748b' }}>
                      {counts.members}
                    </span>
                  </label>

                  {/* Judges */}
                  <label
                    onClick={() => toggleGroup('judges')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.42rem 0.65rem',
                      borderRadius: '8px',
                      border: `1.5px solid ${recipients.judges ? '#10b981' : '#e2e8f0'}`,
                      backgroundColor: recipients.judges ? '#f0fdf4' : '#ffffff',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <input
                        type="checkbox"
                        checked={recipients.judges}
                        onChange={() => {}}
                        style={{ accentColor: '#059669', width: '15px', height: '15px' }}
                      />
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e293b' }}>
                        Judges
                      </span>
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: '9999px', backgroundColor: recipients.judges ? '#bbf7d0' : '#f1f5f9', color: recipients.judges ? '#166534' : '#64748b' }}>
                      {counts.judges}
                    </span>
                  </label>

                  {/* Coordinators */}
                  <label
                    onClick={() => toggleGroup('coordinators')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.42rem 0.65rem',
                      borderRadius: '8px',
                      border: `1.5px solid ${recipients.coordinators ? '#10b981' : '#e2e8f0'}`,
                      backgroundColor: recipients.coordinators ? '#f0fdf4' : '#ffffff',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <input
                        type="checkbox"
                        checked={recipients.coordinators}
                        onChange={() => {}}
                        style={{ accentColor: '#059669', width: '15px', height: '15px' }}
                      />
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e293b' }}>
                        Coordinators
                      </span>
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: '9999px', backgroundColor: recipients.coordinators ? '#bbf7d0' : '#f1f5f9', color: recipients.coordinators ? '#166534' : '#64748b' }}>
                      {counts.coordinators}
                    </span>
                  </label>

                  {/* Volunteers */}
                  <label
                    onClick={() => toggleGroup('volunteers')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.42rem 0.65rem',
                      borderRadius: '8px',
                      border: `1.5px solid ${recipients.volunteers ? '#10b981' : '#e2e8f0'}`,
                      backgroundColor: recipients.volunteers ? '#f0fdf4' : '#ffffff',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <input
                        type="checkbox"
                        checked={recipients.volunteers}
                        onChange={() => {}}
                        style={{ accentColor: '#059669', width: '15px', height: '15px' }}
                      />
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e293b' }}>
                        Volunteers
                      </span>
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: '9999px', backgroundColor: recipients.volunteers ? '#bbf7d0' : '#f1f5f9', color: recipients.volunteers ? '#166534' : '#64748b' }}>
                      {counts.volunteers}
                    </span>
                  </label>
                </div>

                {/* TOTAL RECIPIENTS BANNER (ALWAYS VISIBLE DIRECTLY ON SCREEN) */}
                <div style={{ marginTop: '0.75rem', padding: '0.55rem 0.75rem', borderRadius: '8px', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#065f46', fontSize: '0.82rem', fontWeight: 700 }}>Total Audience:</span>
                  <strong style={{ color: '#047857', fontSize: '1.05rem', fontWeight: 800 }}>
                    {isLoadingPreview ? '...' : `${counts.total} recipients`}
                  </strong>
                </div>

                {previewList.length > 0 && (
                  <div style={{ marginTop: '0.45rem', fontSize: '0.72rem', color: '#64748b' }}>
                    <span>Verified: {previewList[0]?.name || 'Mohammad Fayaz'} {counts.total > 1 ? `+ ${counts.total - 1} others` : ''}</span>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: 3. SUBJECT & 4. WRITE MESSAGE & 5. SEND */}
            <div className="card" style={{ padding: '1.15rem 1.35rem', borderRadius: '14px', border: '1.5px solid #cbd5e1', backgroundColor: '#ffffff', boxShadow: '0 4px 18px -2px rgba(0,0,0,0.05)' }}>
              
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#059669', color: '#ffffff', fontSize: '0.75rem', fontWeight: 800 }}>
                    ✍️
                  </span>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                    Write & Compose Message
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => handleEventSelect(selectedEvent, true)}
                  title="Reset to default template"
                  style={{ background: 'none', border: 'none', color: '#059669', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.5rem' }}
                >
                  <RotateCcw size={12} /> Reset Template
                </button>
              </div>

              {/* 3. SUBJECT FIELD */}
              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#ecfdf5', color: '#047857', fontSize: '0.68rem', fontWeight: 800, border: '1px solid #a7f3d0' }}>3</span>
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
                  style={{ fontWeight: 600, fontSize: '0.88rem', padding: '0.5rem 0.75rem', borderColor: '#cbd5e1', borderRadius: '8px' }}
                />
              </div>

              {/* 4. MESSAGE COMPOSITION (Fixed Greeting + Editable Mid Text + Fixed Signoff) */}
              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#ecfdf5', color: '#047857', fontSize: '0.68rem', fontWeight: 800, border: '1px solid #a7f3d0' }}>4</span>
                    <Mail size={13} color="#059669" />
                    <span>Message Body (Edit Middle Text)</span>
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <button
                      type="button"
                      onClick={() => setMidMessage(prev => prev + ' {name}')}
                      title="Inserts receiver name"
                      style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem', backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', borderRadius: '4px', cursor: 'pointer', fontWeight: 700 }}
                    >
                      + {'{name}'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setMidMessage(prev => prev + ' {event}')}
                      title="Inserts event title"
                      style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem', backgroundColor: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: '4px', cursor: 'pointer', fontWeight: 700 }}
                    >
                      + {'{event}'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setMidMessage(prev => prev + ' {role}')}
                      title="Inserts recipient role"
                      style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem', backgroundColor: '#faf5ff', color: '#7e22ce', border: '1px solid #e9d5ff', borderRadius: '4px', cursor: 'pointer', fontWeight: 700 }}
                    >
                      + {'{role}'}
                    </button>
                    <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 700, backgroundColor: '#ecfdf5', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                      {midMessage.length} chars
                    </span>
                  </div>
                </div>

                {/* FIXED TOP GREETING (NON-EDITABLE) */}
                <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px 8px 0 0', padding: '0.55rem 0.75rem', fontSize: '0.82rem', color: '#475569', borderBottom: 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      🔒 Fixed Greeting (Auto-Personalized for Receiver)
                    </span>
                    <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Fixed</span>
                  </div>
                  <div style={{ fontWeight: 700, color: '#1e293b' }}>
                    Dear Mr./Ms. {'{name}'},
                  </div>
                  <div style={{ marginTop: '0.15rem', color: '#334155' }}>
                    We are pleased to share an important announcement regarding "{selectedEvent || 'Selected Event'}".
                  </div>
                </div>

                {/* EDITABLE MID TEXT (WHERE ADMIN TYPES) */}
                <textarea
                  required
                  rows={5}
                  className="form-control message-compose-textarea"
                  placeholder="Type your announcement / instructions here..."
                  value={midMessage}
                  onChange={(e) => setMidMessage(e.target.value)}
                  style={{
                    lineHeight: 1.5,
                    fontSize: '0.88rem',
                    padding: '0.65rem 0.75rem',
                    fontFamily: 'inherit',
                    borderRadius: '0',
                    borderLeft: '2px solid #059669',
                    borderRight: '2px solid #059669',
                    borderColor: '#cbd5e1',
                    borderTop: '1px dashed #cbd5e1',
                    borderBottom: '1px dashed #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    minHeight: '110px',
                    maxHeight: '180px',
                    resize: 'vertical'
                  }}
                />

                {/* FIXED BOTTOM SIGNOFF (NON-EDITABLE) */}
                <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0 0 8px 8px', padding: '0.55rem 0.75rem', fontSize: '0.82rem', color: '#475569', borderTop: 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      🔒 Fixed Official Sign-off
                    </span>
                    <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Fixed</span>
                  </div>
                  <div style={{ color: '#334155', fontWeight: 500, lineHeight: 1.4 }}>
                    Warm regards,<br />
                    <strong>Event Organizing Committee & R&D Cell</strong><br />
                    Trinity College of Engineering & Technology (Autonomous), Peddapalli
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem', fontSize: '0.7rem', color: '#64748b' }}>
                  <span>✍️ Only edit the middle text. Header and sign-off are automatically attached and personalized upon sending.</span>
                </div>
              </div>

              {/* 5. SEND MESSAGE ACTION BAR (ALWAYS VISIBLE DIRECTLY BELOW TEXTAREA) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ fontSize: '0.82rem', color: '#475569' }}>
                  <span>Audience: <strong>{counts.total} recipients</strong> selected across <strong>{getSelectedGroupsList().length} group(s)</strong></span>
                </div>

                <button
                  type="submit"
                  disabled={isSending || counts.total === 0 || !subject.trim() || !midMessage.trim()}
                  className="btn btn-primary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.65rem 1.65rem',
                    fontSize: '0.92rem',
                    fontWeight: 800,
                    borderRadius: '8px',
                    backgroundColor: '#059669',
                    borderColor: '#059669',
                    boxShadow: '0 3px 12px rgba(5, 150, 105, 0.3)',
                    cursor: (isSending || counts.total === 0 || !subject.trim() || !midMessage.trim()) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isSending ? (
                    <>
                      <Loader2 className="spinner-icon" size={16} /> Dispatching...
                    </>
                  ) : (
                    <>
                      <Send size={16} /> 5. Send Message ({counts.total})
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Live Email Preview Modal */}
        {showPreviewModal && (
          <div className="custom-modal-backdrop" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem' }}>
            <div className="custom-modal card" style={{ maxWidth: '650px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', borderRadius: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#059669', fontWeight: 800 }}>
                  <Eye size={18} />
                  <span>Recipient Email Preview (Personalized Light Theme)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#64748b' }}
                >
                  ×
                </button>
              </div>

              {/* Sample Recipient Indicator */}
              <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '0.6rem 0.85rem', marginBottom: '1.25rem', fontSize: '0.8rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Users size={14} color="#059669" />
                <span>
                  <strong>Sample Recipient:</strong> {previewList[0]?.name || 'Mohammad Fayaz'} &lt;{previewList[0]?.email || 'mdfayaz9963@gmail.com'}&gt; ({previewList[0]?.role || 'Team Leader'})
                </span>
              </div>

              {/* Email Container */}
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <div style={{ textAlign: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px', marginBottom: '18px' }}>
                  <div style={{ color: '#059669', fontSize: '19px', fontWeight: 800 }}>Trinity College of Engineering & Technology</div>
                  <div style={{ color: '#64748b', fontSize: '12px', marginTop: '2px' }}>Research & Development (R&D) Cell • Official Event Notification</div>
                  <div style={{ display: 'inline-block', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', fontSize: '11px', fontWeight: 700, padding: '3px 12px', borderRadius: '9999px', marginTop: '10px' }}>
                    {selectedEvent || 'Event Name'}
                  </div>
                </div>

                <h3 style={{ color: '#0f172a', fontSize: '18px', fontWeight: 800, margin: '0 0 14px 0' }}>
                  {(subject || 'No Subject')
                    .replace(/\{\{\s*name\s*\}\}/gi, previewList[0]?.name || 'Mohammad Fayaz')
                    .replace(/\{\s*name\s*\}/gi, previewList[0]?.name || 'Mohammad Fayaz')}
                </h3>

                <div style={{ color: '#334155', fontSize: '14px', lineHeight: 1.65 }}>
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
                      <p key={idx} style={{ margin: '0 0 12px 0' }}>{p}</p>
                    ))}
                </div>

                <div style={{ backgroundColor: '#f0fdf4', borderLeft: '3px solid #10b981', padding: '10px 14px', borderRadius: '4px', margin: '18px 0', fontSize: '12px', color: '#166534' }}>
                  <strong>Event:</strong> {selectedEvent}<br />
                  <strong>Recipient:</strong> {previewList[0]?.name || 'Mohammad Fayaz'} ({previewList[0]?.role || 'Team Leader'})<br />
                  Delivered to selected groups: {getSelectedGroupsList().join(', ')}
                </div>

                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '11px' }}>
                  Research & Development (R&D) Cell<br />
                  Trinity College of Engineering & Technology (Autonomous), Peddapalli<br />
                  © 2026 R&D Cell TCEK. All rights reserved.
                </div>
              </div>

              <div style={{ marginTop: '1.25rem', textAlign: 'right' }}>
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="btn btn-secondary"
                  style={{ padding: '0.5rem 1.25rem' }}
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="custom-modal-backdrop" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
            <div className="custom-modal card" style={{ maxWidth: '480px', width: '100%', padding: '2rem', borderRadius: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Send size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                    Confirm Message Dispatch
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                    Verify audience and subject before broadcasting
                  </p>
                </div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Event:</strong> <span style={{ color: '#059669' }}>{selectedEvent}</span>
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Subject:</strong> {subject}
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Recipient Groups:</strong> {getSelectedGroupsList().join(', ')}
                </div>
                <div style={{ paddingTop: '0.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Total Recipients to Email:</span>
                  <strong style={{ color: '#059669', fontSize: '0.95rem' }}>{counts.total} recipients</strong>
                </div>
              </div>

              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 1.5rem 0' }}>
                This message will be dispatched in official landing page light theme to all verified emails. Are you sure you want to proceed?
              </p>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="btn btn-secondary"
                  style={{ padding: '0.6rem 1.25rem' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSend}
                  className="btn btn-primary"
                  style={{ padding: '0.6rem 1.25rem', backgroundColor: '#059669', borderColor: '#059669', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
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
