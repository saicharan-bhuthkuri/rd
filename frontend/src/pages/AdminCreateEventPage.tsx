import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { AdminLayout } from '../components/AdminLayout';
import { Plus, ArrowLeft, Loader2 } from 'lucide-react';

export const AdminCreateEventPage: React.FC = () => {
  const navigate = useNavigate();

  // Form states
  const [category, setCategory] = useState<'Workshop' | 'Hackathon' | 'Seminar' | 'Colloquium'>('Workshop');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');

  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');

  useEffect(() => {
    // Auth check
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/admin/login');
    }
  }, []);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreateSuccess('');
    setIsCreating(true);

    const token = localStorage.getItem('admin_token');

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          category,
          title,
          description,
          date,
          time,
          location,
          speaker: '',
          speakerBio: ''
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create event.');
      }

      setCreateSuccess(`Event "${title}" has been published successfully.`);
      
      // Reset form
      setTitle('');
      setDescription('');
      setDate('');
      setTime('');
      setLocation('');
      setCategory('Workshop');
    } catch (err: any) {
      setCreateError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <AdminLayout>
      <div className="card" style={{ maxWidth: '680px', margin: '0 auto' }}>
        <div className="admin-card-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <Plus size={20} /> Create Technical Event
          </h2>
          <button
            onClick={() => navigate('/admin/events/manage')}
            className="btn"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              background: 'rgba(0, 0, 0, 0.05)', 
              color: 'var(--text-main, #333)',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              fontSize: '0.875rem'
            }}
          >
            <ArrowLeft size={16} /> Back to Calendar
          </button>
        </div>

        {createError && <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>{createError}</div>}
        {createSuccess && <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>{createSuccess}</div>}

        <form onSubmit={handleCreateEvent}>
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label htmlFor="evt-category">Event Category</label>
            <select
              id="evt-category"
              required
              className="form-control"
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
            >
              <option value="Workshop">Workshop (Hands-on Lab)</option>
              <option value="Hackathon">Hackathon (Build prototypes)</option>
              <option value="Seminar">Seminar (Guest lecture)</option>
              <option value="Colloquium">Colloquium (Academic discourse)</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label htmlFor="evt-title">Event Title</label>
            <input
              type="text"
              id="evt-title"
              required
              className="form-control"
              placeholder="e.g. Edge AI: Deploying TinyML"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label htmlFor="evt-desc">Event Description</label>
            <textarea
              id="evt-desc"
              required
              rows={4}
              className="form-control"
              placeholder="Summarize the event goals, content, and targets..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
            <div className="form-group">
              <label htmlFor="evt-date">Date of Event</label>
              <input
                type="text"
                id="evt-date"
                required
                className="form-control"
                placeholder="e.g. August 24, 2026"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="evt-time">Timing / Schedule</label>
              <input
                type="text"
                id="evt-time"
                required
                className="form-control"
                placeholder="e.g. 10:00 AM - 4:00 PM"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.75rem' }}>
            <label htmlFor="evt-location">Venue / Location</label>
            <input
              type="text"
              id="evt-location"
              required
              className="form-control"
              placeholder="e.g. R&D Lab 4A"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <button type="submit" disabled={isCreating} className="btn btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem' }}>
            {isCreating ? (
              <>
                <Loader2 className="spinner-icon" size={16} /> Publishing Event...
              </>
            ) : (
              <>
                <Plus size={16} /> Publish Event
              </>
            )}
          </button>
        </form>
      </div>
    </AdminLayout>
  );
};
