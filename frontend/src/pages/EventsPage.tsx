import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Clock, User, Loader2 } from 'lucide-react';

interface EventItem {
  id?: number;
  category: 'Workshop' | 'Hackathon' | 'Seminar' | 'Colloquium';
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  speaker: string;
  speaker_bio: string;
}

export const EventsPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const handleBackToHome = () => {
    window.location.hash = '#events';
  };

  const categories = ["All", "Workshop", "Hackathon", "Seminar", "Colloquium"];

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('http://localhost:5000/api/events');
        if (!response.ok) {
          throw new Error('Failed to load events calendar from server.');
        }
        const data = await response.json();
        setEvents(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const filteredEvents = events.filter(evt => selectedCategory === 'All' || evt.category === selectedCategory);

  const handleRegisterClick = (title: string) => {
    navigate(`/apply?event=${encodeURIComponent(title)}`);
  };

  return (
    <div className="subpage-container container">
      {/* Back button */}
      <a href="/" onClick={handleBackToHome} className="back-btn btn btn-secondary btn-sm">
        <ArrowLeft size={16} /> Back to Overview
      </a>

      {/* Main Section */}
      <section className="subpage-hero">
        <span className="badge">Technical Calendar</span>
        <h1 className="subpage-title">Technical Events & Bootcamps</h1>
        <p className="subpage-lead">
          Reserve seats for upcoming hands-on bootcamps, academic presentations, and hackathons. 
          Detailed archives of materials are posted post-event.
        </p>
      </section>

      {/* Categories filter */}
      <div className="event-filters-row">
        <div className="domain-filter-group">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`filter-tag ${selectedCategory === cat ? 'active' : ''}`}
            >
              {cat}s
            </button>
          ))}
        </div>
      </div>

      {/* Events listing */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
          <Loader2 className="spinner-icon" size={28} style={{ margin: '0 auto 1rem auto', display: 'block' }} />
          Loading technical calendar...
        </div>
      ) : error ? (
        <div className="alert alert-danger" style={{ maxWidth: '600px', margin: '2rem auto' }}>{error}</div>
      ) : filteredEvents.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '0.5rem', marginTop: '2rem' }}>
          No upcoming events scheduled in this category.
        </div>
      ) : (
        <div className="expanded-events-list">
          {filteredEvents.map((evt, idx) => {
            return (
              <div key={idx} className="expanded-event-card card">
                <div className="expanded-event-info">
                  <div className="event-meta-badges">
                    <span className={`event-category-badge cat-${evt.category.toLowerCase()}`}>{evt.category}</span>
                    <span className="event-date-badge">
                      <Calendar size={14} /> {evt.date}
                    </span>
                  </div>
                  <h3 className="expanded-event-title">{evt.title}</h3>
                  <p className="expanded-event-desc">{evt.description}</p>
                  
                  <div className="expanded-event-logistics">
                    <div className="logistics-item">
                      <Clock size={14} /> <span>{evt.time}</span>
                    </div>
                    <div className="logistics-item">
                      <MapPin size={14} /> <span>{evt.location}</span>
                    </div>
                  </div>

                  <div className="event-speaker-profile">
                    <User size={16} className="speaker-avatar-icon" />
                    <div>
                      <h4 className="speaker-name">{evt.speaker}</h4>
                      <p className="speaker-bio">{evt.speaker_bio}</p>
                    </div>
                  </div>
                </div>

                <div className="expanded-event-action">
                  <button onClick={() => handleRegisterClick(evt.title)} className="btn btn-primary">
                    Reserve Seat
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
