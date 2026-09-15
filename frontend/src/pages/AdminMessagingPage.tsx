import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { API_BASE_URL } from '../config';
import { 
  Mail, 
  Send, 
  Users, 
  Calendar, 
  Award, 
  HeartHandshake, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Eye, 
  Edit3, 
  RotateCcw,
  CheckSquare,
  Square,
  Info
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
    judges: false,
    coordinators: false,
    volunteers: false,
  });

  const [subject, setSubject] = useState<string>('');
  const [message, setMessage] = useState<string>('');

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
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

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

  // Handle event selection and populate default subject & template message
  const handleEventSelect = (eventTitle: string) => {
    setSelectedEvent(eventTitle);
    setStatusMessage(null);

    // Provide default subject
    setSubject(`Important Update: ${eventTitle} — Trinity R&D Cell`);

    // Provide default starter message if empty
    if (!message || message.trim() === '') {
      setMessage(
`Dear Participant / Team Member,

We are pleased to share an important announcement regarding "${eventTitle}".

Please review the event schedule, reporting guidelines, and instructions on our official portal. Ensure all necessary project assets, identity credentials, and requirements are prepared prior to the commencement of the session.

If you have any questions or require special accommodations, kindly reach out to the Registration Desk coordinators or reply to this communication.

We look forward to your active participation!

Warm regards,
Event Organizing Committee & R&D Cell
Trinity College of Engineering & Technology (Autonomous), Peddapalli`
      );
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

    if (!message.trim()) {
      setStatusMessage({ type: 'error', text: 'Please type the message content.' });
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
          message: message.trim()
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
      <div className="admin-page-container" style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '3rem' }}>
        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#ecfdf5', color: '#047857', padding: '0.2rem 0.65rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.4rem', border: '1px solid #a7f3d0' }}>
              <Mail size={13} />
              <span>Event Communication Broadcast</span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Event Messaging
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
              Targeted messaging to event participants, judges, coordinators, and volunteers
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setActiveTab(activeTab === 'edit' ? 'preview' : 'edit')}
              className="btn btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
            >
              {activeTab === 'edit' ? <Eye size={16} /> : <Edit3 size={16} />}
              <span>{activeTab === 'edit' ? 'Live Email Preview' : 'Back to Editor'}</span>
            </button>
          </div>
        </div>

        {/* Status Alerts */}
        {statusMessage && (
          <div
            style={{
              padding: '1rem 1.25rem',
              borderRadius: '12px',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              backgroundColor: statusMessage.type === 'success' ? '#f0fdf4' : '#fef2f2',
              border: `1px solid ${statusMessage.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
              color: statusMessage.type === 'success' ? '#15803d' : '#b91c1c',
              fontSize: '0.9rem',
              fontWeight: 500
            }}
          >
            {statusMessage.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <span style={{ flex: 1 }}>{statusMessage.text}</span>
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 700 }}
            >
              ×
            </button>
          </div>
        )}

        <form onSubmit={handleSendSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
            
            {/* STEP 1: Select Event */}
            <div className="card" style={{ padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#059669', color: '#ffffff', fontSize: '0.75rem', fontWeight: 800 }}>
                  1
                </span>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                  Select Event
                </h3>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem', display: 'block' }}>
                  Target Event
                </label>
                <select
                  className="form-control"
                  value={selectedEvent}
                  onChange={(e) => handleEventSelect(e.target.value)}
                  style={{ fontWeight: 600, padding: '0.65rem 0.85rem' }}
                >
                  {events.length === 0 ? (
                    <option value="">No events configured</option>
                  ) : (
                    events.map((ev) => (
                      <option key={ev.id} value={ev.title}>
                        {ev.title} ({ev.category})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {selectedEvent && (
                <div style={{ backgroundColor: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.82rem', color: '#64748b' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#059669', fontWeight: 600, marginBottom: '0.25rem' }}>
                    <Calendar size={14} />
                    <span>Selected Event Context</span>
                  </div>
                  <div><strong>Title:</strong> {selectedEvent}</div>
                </div>
              )}
            </div>

            {/* STEP 2: Select Recipients */}
            <div className="card" style={{ padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#059669', color: '#ffffff', fontSize: '0.75rem', fontWeight: 800 }}>
                    2
                  </span>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
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
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
                  {isAllSelected ? <CheckSquare size={15} /> : <Square size={15} />}
                  <span>Select All</span>
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {/* Members / Participants */}
                <label
                  onClick={() => toggleGroup('members')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    border: `1.5px solid ${recipients.members ? '#10b981' : '#e2e8f0'}`,
                    backgroundColor: recipients.members ? '#f0fdf4' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <input
                      type="checkbox"
                      checked={recipients.members}
                      onChange={() => {}} // Handled on container
                      style={{ accentColor: '#059669', width: '16px', height: '16px' }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}>
                      <Users size={16} color="#059669" />
                      <span>Members (Event Participants)</span>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, padding: '0.15rem 0.55rem', borderRadius: '9999px', backgroundColor: recipients.members ? '#bbf7d0' : '#f1f5f9', color: recipients.members ? '#166534' : '#64748b' }}>
                    {counts.members} contacts
                  </span>
                </label>

                {/* Judges */}
                <label
                  onClick={() => toggleGroup('judges')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    border: `1.5px solid ${recipients.judges ? '#10b981' : '#e2e8f0'}`,
                    backgroundColor: recipients.judges ? '#f0fdf4' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <input
                      type="checkbox"
                      checked={recipients.judges}
                      onChange={() => {}}
                      style={{ accentColor: '#059669', width: '16px', height: '16px' }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}>
                      <Award size={16} color="#0284c7" />
                      <span>Judges</span>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, padding: '0.15rem 0.55rem', borderRadius: '9999px', backgroundColor: recipients.judges ? '#bbf7d0' : '#f1f5f9', color: recipients.judges ? '#166534' : '#64748b' }}>
                    {counts.judges} contacts
                  </span>
                </label>

                {/* Coordinators */}
                <label
                  onClick={() => toggleGroup('coordinators')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    border: `1.5px solid ${recipients.coordinators ? '#10b981' : '#e2e8f0'}`,
                    backgroundColor: recipients.coordinators ? '#f0fdf4' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <input
                      type="checkbox"
                      checked={recipients.coordinators}
                      onChange={() => {}}
                      style={{ accentColor: '#059669', width: '16px', height: '16px' }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}>
                      <Sparkles size={16} color="#eab308" />
                      <span>Coordinators</span>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, padding: '0.15rem 0.55rem', borderRadius: '9999px', backgroundColor: recipients.coordinators ? '#bbf7d0' : '#f1f5f9', color: recipients.coordinators ? '#166534' : '#64748b' }}>
                    {counts.coordinators} contacts
                  </span>
                </label>

                {/* Volunteers */}
                <label
                  onClick={() => toggleGroup('volunteers')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    border: `1.5px solid ${recipients.volunteers ? '#10b981' : '#e2e8f0'}`,
                    backgroundColor: recipients.volunteers ? '#f0fdf4' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <input
                      type="checkbox"
                      checked={recipients.volunteers}
                      onChange={() => {}}
                      style={{ accentColor: '#059669', width: '16px', height: '16px' }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}>
                      <HeartHandshake size={16} color="#ec4899" />
                      <span>Volunteers</span>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, padding: '0.15rem 0.55rem', borderRadius: '9999px', backgroundColor: recipients.volunteers ? '#bbf7d0' : '#f1f5f9', color: recipients.volunteers ? '#166534' : '#64748b' }}>
                    {counts.volunteers} contacts
                  </span>
                </label>
              </div>

              <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                <span style={{ color: '#64748b' }}>Total Unique Recipients:</span>
                <strong style={{ color: '#059669', fontSize: '1rem' }}>
                  {isLoadingPreview ? 'Calculating...' : `${counts.total} recipients`}
                </strong>
              </div>

              {previewList.length > 0 && (
                <div style={{ marginTop: '0.75rem', padding: '0.65rem 0.85rem', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '0.75rem', color: '#64748b' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    <Info size={13} color="#059669" />
                    <span>Sample verified recipients ({Math.min(previewList.length, 3)} of {counts.total}):</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {previewList.slice(0, 3).map((r, i) => (
                      <span key={i} style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '0.72rem' }}>
                        {r.name} &lt;{r.email}&gt;
                      </span>
                    ))}
                    {counts.total > 3 && (
                      <span style={{ padding: '0.15rem 0.45rem', color: '#059669', fontWeight: 600 }}>
                        +{counts.total - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* STEP 3 & 4: Subject and Message Editor / Preview */}
          <div className="card" style={{ padding: '2rem', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#059669', color: '#ffffff', fontSize: '0.75rem', fontWeight: 800 }}>
                  3 & 4
                </span>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                  Compose Message
                </h3>
              </div>

              {/* Editor / Preview Tabs */}
              <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '0.2rem', borderRadius: '8px', gap: '0.2rem' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('edit')}
                  style={{
                    padding: '0.35rem 0.85rem',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    backgroundColor: activeTab === 'edit' ? '#ffffff' : 'transparent',
                    color: activeTab === 'edit' ? '#0f172a' : '#64748b',
                    boxShadow: activeTab === 'edit' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  Editor
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  style={{
                    padding: '0.35rem 0.85rem',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    backgroundColor: activeTab === 'preview' ? '#ffffff' : 'transparent',
                    color: activeTab === 'preview' ? '#0f172a' : '#64748b',
                    boxShadow: activeTab === 'preview' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  Live Preview
                </button>
              </div>
            </div>

            {/* Subject Field */}
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Email Subject</span>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 400 }}>Admin can modify</span>
              </label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="Enter email subject line"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                style={{ fontWeight: 600, fontSize: '0.95rem', padding: '0.75rem 1rem' }}
              />
            </div>

            {activeTab === 'edit' ? (
              /* Message Textarea */
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Message Body</span>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 400 }}>
                    {message.length} characters • Paragraphs separated by blank lines
                  </span>
                </label>
                <textarea
                  required
                  rows={10}
                  className="form-control"
                  placeholder="Write the full message content here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  style={{
                    lineHeight: 1.6,
                    fontSize: '0.92rem',
                    padding: '1rem',
                    fontFamily: 'inherit',
                    borderRadius: '10px'
                  }}
                />
                <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#64748b' }}>
                  <span>Tip: Double-line breaks create distinct paragraphs in the delivered email.</span>
                  <button
                    type="button"
                    onClick={() => handleEventSelect(selectedEvent)}
                    style={{ background: 'none', border: 'none', color: '#059669', cursor: 'pointer', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <RotateCcw size={12} /> Reset Template
                  </button>
                </div>
              </div>
            ) : (
              /* Live Preview Card (Landing Page Light Theme) */
              <div style={{ marginBottom: '1.5rem', backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                  Recipient Email View (Landing Page Light Theme)
                </div>

                <div style={{ maxWidth: '580px', margin: '0 auto', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                  <div style={{ textAlign: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px', marginBottom: '18px' }}>
                    <div style={{ color: '#059669', fontSize: '18px', fontWeight: 800 }}>Trinity College of Engineering & Technology</div>
                    <div style={{ color: '#64748b', fontSize: '12px', marginTop: '2px' }}>Research & Development (R&D) Cell • Official Event Notification</div>
                    <div style={{ display: 'inline-block', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', fontSize: '11px', fontWeight: 700, padding: '3px 12px', borderRadius: '9999px', marginTop: '10px' }}>
                      {selectedEvent || 'Event Name'}
                    </div>
                  </div>

                  <h3 style={{ color: '#0f172a', fontSize: '17px', fontWeight: 800, margin: '0 0 14px 0' }}>
                    {subject || 'No Subject'}
                  </h3>

                  <div style={{ color: '#334155', fontSize: '13.5px', lineHeight: 1.65 }}>
                    {message ? (
                      message.split('\n').filter(p => p.trim() !== '').map((p, idx) => (
                        <p key={idx} style={{ margin: '0 0 12px 0' }}>{p}</p>
                      ))
                    ) : (
                      <em style={{ color: '#94a3b8' }}>Message content will appear here...</em>
                    )}
                  </div>

                  <div style={{ backgroundColor: '#f0fdf4', borderLeft: '3px solid #10b981', padding: '10px 14px', borderRadius: '4px', margin: '18px 0', fontSize: '12px', color: '#166534' }}>
                    <strong>Event:</strong> {selectedEvent}<br />
                    Delivered to selected groups: {getSelectedGroupsList().join(', ')}
                  </div>

                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '11px' }}>
                    Research & Development (R&D) Cell<br />
                    Trinity College of Engineering & Technology (Autonomous), Peddapalli<br />
                    © 2026 R&D Cell TCEK. All rights reserved.
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: Send Message Action Button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1.25rem', borderTop: '1px solid #f1f5f9', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Ready to dispatch to <strong>{counts.total}</strong> unique recipient(s) across <strong>{getSelectedGroupsList().length}</strong> group(s).
              </div>

              <button
                type="submit"
                disabled={isSending || counts.total === 0 || !subject.trim() || !message.trim()}
                className="btn btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.55rem',
                  padding: '0.85rem 1.75rem',
                  fontSize: '0.98rem',
                  fontWeight: 700,
                  borderRadius: '10px',
                  backgroundColor: '#059669',
                  borderColor: '#059669',
                  boxShadow: '0 4px 14px rgba(5, 150, 105, 0.35)'
                }}
              >
                {isSending ? (
                  <>
                    <Loader2 className="spinner-icon" size={18} /> Sending Event Messages...
                  </>
                ) : (
                  <>
                    <Send size={18} /> Send Message
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

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
