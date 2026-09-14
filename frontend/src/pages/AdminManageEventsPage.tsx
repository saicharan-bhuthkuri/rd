import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { AdminLayout } from '../components/AdminLayout';
import { Calendar, Plus, Trash2 } from 'lucide-react';
import { AdminPagination } from '../components/AdminPagination';

interface EventItem {
  id: number;
  category: 'Workshop' | 'Hackathon' | 'Seminar' | 'Colloquium';
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  speaker: string;
  speaker_bio: string;
  created_at: string;
}

export const AdminManageEventsPage: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination State (Prev / 1 2 3 ... / Next)
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;
  
  // Custom styled confirmation modal state
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; eventId: number; eventTitle: string }>({
    isOpen: false,
    eventId: 0,
    eventTitle: ''
  });

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/events`);
      if (!response.ok) {
        throw new Error('Failed to load technical events list.');
      }
      const data = await response.json();
      setEvents(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Auth check
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    setTimeout(() => {
      fetchEvents();
    }, 0);

    const handleSync = (e: Event) => {
      const eventType = (e as CustomEvent).detail;
      if (eventType === 'REFRESH_EVENTS') {
        fetchEvents();
      }
    };

    window.addEventListener('app-sync', handleSync);
    return () => window.removeEventListener('app-sync', handleSync);
  }, []);

  const handleDeleteEvent = async (id: number) => {
    const token = localStorage.getItem('admin_token');

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/events/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete event.');
      }

      // Refresh list
      fetchEvents();
      // Notify other tabs
      const syncEvent = new CustomEvent('app-sync', { detail: 'REFRESH_EVENTS' });
      window.dispatchEvent(syncEvent);
    } catch (err: any) {
      alert(err.message);
    }
  };


  return (
    <AdminLayout>
      <div className="card" style={{ width: '100%' }}>
        <div className="admin-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <Calendar size={20} /> Active Technical Calendar
          </h2>
          <button 
            onClick={() => navigate('/admin/events/create')} 
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Plus size={16} /> Create New Event
          </button>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            Loading technical events calendar...
          </div>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: '0.5rem' }}>
            No technical events are scheduled. Create one to populate the registry.
          </div>
        ) : (
          <div className="admin-table-container events-table">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Event Details</th>
                  <th>Schedule & Venue</th>
                  <th>Presenter</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((evt) => (
                  <tr key={evt.id}>
                    <td>
                      <strong>{evt.title}</strong>
                      <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.25rem' }}>
                        <span className={`role-badge role-admin`} style={{ fontSize: '0.7rem', padding: '0.1rem 0.35rem' }}>{evt.category}</span>
                      </div>
                    </td>
                    <td>
                      <div>{evt.date}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{evt.time}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Loc: {evt.location}</div>
                    </td>
                    <td>
                      {evt.speaker && evt.speaker.trim() ? (
                        <>
                          <strong>{evt.speaker}</strong>
                          {evt.speaker_bio && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '180px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                              {evt.speaker_bio}
                            </div>
                          )}
                        </>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td>
                      <button
                        onClick={() => setDeleteConfirm({ isOpen: true, eventId: evt.id, eventTitle: evt.title })}
                        className="btn-action reject"
                        title="Delete Event"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            <AdminPagination
              currentPage={currentPage}
              totalPages={Math.ceil(events.length / PAGE_SIZE)}
              totalRecords={events.length}
              pageSize={PAGE_SIZE}
              onPageChange={(p) => setCurrentPage(p)}
              itemName="technical events"
            />
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm.isOpen && (
        <div className="custom-modal-overlay">
          <div className="custom-modal-card">
            <div className="custom-modal-header">
              <div className="custom-modal-icon-container custom-modal-icon-error">
                <Trash2 size={20} />
              </div>
              <h3 className="custom-modal-title">Delete Event</h3>
            </div>
            <p className="custom-modal-body">
              Are you sure you want to delete event: <strong>"{deleteConfirm.eventTitle}"</strong>? This will remove it from public view and selection options.
            </p>
            <div className="custom-modal-footer">
              <button
                onClick={() => setDeleteConfirm({ isOpen: false, eventId: 0, eventTitle: '' })}
                className="custom-modal-btn-cancel"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const id = deleteConfirm.eventId;
                  setDeleteConfirm({ isOpen: false, eventId: 0, eventTitle: '' });
                  await handleDeleteEvent(id);
                }}
                className="btn btn-primary"
                style={{
                  backgroundColor: '#ef4444',
                  borderColor: '#ef4444',
                  color: '#fff',
                  padding: '0.5rem 1.25rem',
                  fontSize: '0.875rem',
                  borderRadius: '0.375rem',
                  cursor: 'pointer'
                }}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
