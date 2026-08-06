import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, User, Clock, ExternalLink, ArrowUpRight } from 'lucide-react';

interface EventItem {
  id: string;
  type: 'upcoming' | 'past';
  category: 'Workshop' | 'Hackathon' | 'Seminar' | 'Colloquium';
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  speaker: string;
  speakerRole: string;
  ctaText: string;
  link: string;
}

interface EventsProps {
  isOverview?: boolean;
}

export const Events: React.FC<EventsProps> = ({ isOverview }) => {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  const events: EventItem[] = [
    {
      id: "ev-1",
      type: "upcoming",
      category: "Workshop",
      title: "Deep Learning Bootcamp: PyTorch Fundamentals",
      description: "A intensive 2-day hands-on workshop focused on building, training, and optimizing deep neural networks using PyTorch. Ideal for beginners starting in ML.",
      date: "August 24, 2026",
      time: "10:00 AM - 4:00 PM IST",
      location: "R&D Lab 4A, Computing Block",
      speaker: "Dr. Aravind Swaminathan",
      speakerRole: "Senior AI Researcher",
      ctaText: "Reserve Seat",
      link: "#contact"
    },
    {
      id: "ev-2",
      type: "upcoming",
      category: "Hackathon",
      title: "R&D AlphaQuest Hackathon",
      description: "Build functional prototypes solving local municipal challenges. Up to ₹50,000 in project development funding for the top three winning student teams.",
      date: "September 11-13, 2026",
      time: "48 Hours Continuous",
      location: "Main Innovation Hall & Discord",
      speaker: "Club Committee Panel",
      speakerRole: "Judges & Mentors",
      ctaText: "Register Team",
      link: "#contact"
    },
    {
      id: "ev-3",
      type: "upcoming",
      category: "Seminar",
      title: "Zero-Knowledge Proofs in Modern Web Cryptography",
      description: "An exploratory guest lecture detailing the mathematics behind non-interactive zero-knowledge proofs (zk-SNARKs) and their deployment in web protocol stacks.",
      date: "September 28, 2026",
      time: "3:00 PM - 5:00 PM IST",
      location: "Seminar Hall C",
      speaker: "Prof. Clara Vance",
      speakerRole: "Cryptographer, MIT Labs",
      ctaText: "Get Invitation",
      link: "#contact"
    },
    {
      id: "ev-4",
      type: "past",
      category: "Workshop",
      title: "Edge AI: Deploying TinyML on Microcontrollers",
      description: "Learn how to optimize neural networks to run on low-power, memory-constrained hardware using TensorFlow Lite for Microcontrollers.",
      date: "July 12, 2026",
      time: "11:00 AM - 3:00 PM IST",
      location: "IoT & Embedded Labs",
      speaker: "Meera Nair",
      speakerRole: "Embedded Systems Lead",
      ctaText: "Watch Recording",
      link: "#"
    },
    {
      id: "ev-5",
      type: "past",
      category: "Colloquium",
      title: "Quantum Compiler Architectures & Optimization",
      description: "A deep dive into compiling high-level quantum instructions down to pulse-level operations, reducing decoherence effects in NISQ processors.",
      date: "June 30, 2026",
      time: "2:00 PM - 4:30 PM IST",
      location: "Online Seminar",
      speaker: "Dr. Ethan Brooks",
      speakerRole: "Quantum Compiler Architect",
      ctaText: "Read Summary",
      link: "#"
    },
    {
      id: "ev-6",
      type: "past",
      category: "Hackathon",
      title: "EcoSynth Sustainability Buildathon",
      description: "Developing computational software systems for climate monitoring, urban heat planning, and carbon offset tracking APIs.",
      date: "May 15-17, 2026",
      time: "36 Hours",
      location: "Hybrid (Innovation Hub)",
      speaker: "Sponsor Jury Team",
      speakerRole: "EcoTech Consortium",
      ctaText: "View Winners",
      link: "#"
    }
  ];

  const filteredEvents = events.filter(e => e.type === activeTab);

  return (
    <section id="events" className="section section-bg-alt">
      <div className="gradient-blob gradient-blob-2 animate-pulse-slow"></div>
      
      <div className="container">
        <div className="section-header">
          <span className="badge">Events & Workshops</span>
          <h2 className="section-title">Academic & Technical Calendar</h2>
          <p className="section-subtitle">
            Participate in our rigorous workshops, research colloquiums, and high-stakes hackathons 
            designed to push your learning curve.
          </p>

          {/* Tab Toggles */}
          <div className="event-tabs">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`event-tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
            >
              Upcoming Schedule
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`event-tab-btn ${activeTab === 'past' ? 'active' : ''}`}
            >
              Past Archives
            </button>
          </div>
        </div>

        {/* Events Grid */}
        <div className="events-grid">
          {filteredEvents.map((evt) => (
            <div key={evt.id} className="event-card card">
              <div className="event-card-header">
                <span className={`event-category-badge cat-${evt.category.toLowerCase()}`}>
                  {evt.category}
                </span>
                {evt.type === 'upcoming' && (
                  <span className="pulse-indicator-dot">
                    <span className="ping"></span>
                    <span className="dot-core"></span>
                  </span>
                )}
              </div>

              <h3 className="event-card-title">{evt.title}</h3>
              <p className="event-card-desc">{evt.description}</p>

              <div className="event-card-details">
                <div className="detail-item">
                  <Calendar size={16} />
                  <span>{evt.date}</span>
                </div>
                <div className="detail-item">
                  <Clock size={16} />
                  <span>{evt.time}</span>
                </div>
                <div className="detail-item">
                  <MapPin size={16} />
                  <span>{evt.location}</span>
                </div>
                <div className="detail-item speaker-item">
                  <User size={16} />
                  <div>
                    <span className="speaker-name">{evt.speaker}</span>
                    <span className="speaker-role">({evt.speakerRole})</span>
                  </div>
                </div>
              </div>

              <div className="event-card-action">
                {evt.type === 'upcoming' ? (
                  <a href={evt.link} className="btn btn-primary btn-sm event-btn">
                    {evt.ctaText} <ArrowUpRight size={14} />
                  </a>
                ) : (
                  <a href={evt.link} className="btn btn-secondary btn-sm event-btn">
                    {evt.ctaText} <ExternalLink size={14} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {isOverview && (
          <div className="section-overview-footer" style={{ marginTop: '3.5rem', textAlign: 'center' }}>
            <Link to="/events" className="btn btn-outline-primary">
              View Detailed Technical Calendar & Archives &rarr;
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};
