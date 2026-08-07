import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { AdminLayout } from '../components/AdminLayout';
import { Calendar, Plus, Trash2 } from 'lucide-react';

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
    fetchEvents();

    const handleSync = (e: Event) => {
      const eventType = (e as CustomEvent).detail;
      if (eventType === 'REFRESH_EVENTS') {
        fetchEvents();
      }
    };

    window.addEventListener('app-sync', handleSync);
    return () => window.removeEventListener('app-sync', handleSync);
  }, []);

  const handleDeleteEvent = async (id: number, eventTitle: string) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete event: "${eventTitle}"? This will remove it from public view and selection options.`);
    if (!confirmDelete) return;

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

      alert(`Event "${eventTitle}" deleted successfully.`);
      fetchEvents();
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
                {events.map((evt) => (
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
                      <strong>{evt.speaker}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '180px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {evt.speaker_bio}
                      </div>
                    </td>
                    <td>
                      <button
                        onClick={() => handleDeleteEvent(evt.id, evt.title)}
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
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
