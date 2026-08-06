import React, { useState } from 'react';
import { ArrowLeft, Calendar, MapPin, Clock, User, Check, Loader2 } from 'lucide-react';

interface EventItem {
  category: 'Workshop' | 'Hackathon' | 'Seminar' | 'Colloquium';
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  speaker: string;
  speakerBio: string;
}

export const EventsPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [registeringEvent, setRegisteringEvent] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredEvents, setRegisteredEvents] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState('');

  const handleBackToHome = () => {
    window.location.hash = '#events';
  };

  const categories = ["All", "Workshop", "Hackathon", "Seminar", "Colloquium"];

  const events: EventItem[] = [
    {
      category: "Workshop",
      title: "Deep Learning Bootcamp: PyTorch Fundamentals",
      description: "An intensive workshop focused on building, training, and optimizing deep neural networks using PyTorch. Designed to bootstrap ML research projects.",
      date: "August 24, 2026",
      time: "10:00 AM - 4:00 PM IST",
      location: "R&D Lab 4A, Computing Block",
      speaker: "Dr. Aravind Swaminathan",
      speakerBio: "Dr. Swaminathan is a Senior AI Scientist with over 10 publications in CVPR/ICML, specializing in spatial transformers."
    },
    {
      category: "Hackathon",
      title: "R&D AlphaQuest Hackathon",
      description: "Build functional prototypes solving local municipal challenges. Top teams receive direct workspace placement and development funding.",
      date: "September 11-13, 2026",
      time: "48 Hours Continuous",
      location: "Main Innovation Hall & Discord",
      speaker: "Club Committee Panel",
      speakerBio: "Senior committee members and guest engineering mentors from leading deep tech hardware startups."
    },
    {
      category: "Seminar",
      title: "Zero-Knowledge Proofs in Modern Web Cryptography",
      description: "An exploratory guest lecture detailing the mathematics behind non-interactive zero-knowledge proofs (zk-SNARKs) and web integration layers.",
      date: "September 28, 2026",
      time: "3:00 PM - 5:00 PM IST",
      location: "Seminar Hall C",
      speaker: "Prof. Clara Vance",
      speakerBio: "Prof. Vance is an associate cryptographer with MIT Labs, researching decentralized public key infrastructures."
    },
    {
      category: "Workshop",
      title: "Edge AI: Deploying TinyML on Microcontrollers",
      description: "Learn how to optimize neural networks to run on memory-constrained systems using TensorFlow Lite Micro APIs.",
      date: "July 12, 2026",
      time: "11:00 AM - 3:00 PM IST",
      location: "IoT & Embedded Labs",
      speaker: "Meera Nair",
      speakerBio: "Meera leads the hardware systems division at R&D, designing telemetry platforms for autonomous drones."
    },
    {
      category: "Colloquium",
      title: "Quantum Compiler Architectures & Optimization",
      description: "A deep dive into compiling high-level quantum instructions down to pulse-level operations, reducing decoherence effects in NISQ processors.",
      date: "June 30, 2026",
      time: "2:00 PM - 4:30 PM IST",
      location: "Online Seminar",
      speaker: "Dr. Ethan Brooks",
      speakerRole: "Quantum Compiler Architect",
      speakerBio: "Dr. Brooks develops compiler backends for superconducting hardware topologies."
    }
  ] as (EventItem & { speakerRole?: string })[];

  const filteredEvents = events.filter(evt => selectedCategory === 'All' || evt.category === selectedCategory);

  const handleRegisterClick = (title: string) => {
    setRegisteringEvent(title);
    setEmailInput('');
  };

  const handleConfirmRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      if (registeringEvent) {
        setRegisteredEvents([...registeredEvents, registeringEvent]);
      }
      setRegisteringEvent(null);
    }, 1500);
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
      <div className="expanded-events-list">
        {filteredEvents.map((evt, idx) => {
          const isAlreadyRegistered = registeredEvents.includes(evt.title);
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
                    <p className="speaker-bio">{evt.speakerBio}</p>
                  </div>
                </div>
              </div>

              <div className="expanded-event-action">
                {isAlreadyRegistered ? (
                  <button className="btn btn-secondary" disabled>
                    <Check size={16} /> Registered
                  </button>
                ) : (
                  <button onClick={() => handleRegisterClick(evt.title)} className="btn btn-primary">
                    Reserve Seat
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Simple register modal */}
      {registeringEvent && (
        <div className="modal-backdrop">
          <div className="modal-content card">
            <h3>Event Registration</h3>
            <p>You are registering for: <strong style={{ color: 'var(--primary)' }}>{registeringEvent}</strong></p>
            
            <form onSubmit={handleConfirmRegistration} className="modal-form">
              <div className="form-group">
                <label htmlFor="modal-email">Enter Institutional Email Address</label>
                <input
                  type="email"
                  id="modal-email"
                  required
                  placeholder="e.g. user@rdclub.edu"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                />
              </div>
              
              <div className="modal-actions">
                <button type="button" onClick={() => setRegisteringEvent(null)} className="btn btn-secondary btn-sm">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="btn btn-primary btn-sm">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="spinner-icon" size={14} /> Registering...
                    </>
                  ) : (
                    'Confirm Seat'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
