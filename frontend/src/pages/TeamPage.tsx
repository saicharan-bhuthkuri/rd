import React from 'react';
import { ArrowLeft, BookOpen, Briefcase, Mail } from 'lucide-react';

const GithubIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
  </svg>
);

const LinkedinIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
    <rect x="2" y="9" width="4" height="12"></rect>
    <circle cx="4" cy="4" r="2"></circle>
  </svg>
);

export const TeamPage: React.FC = () => {
  const handleBackToHome = () => {
    window.location.hash = '#team';
  };

  const members = [
    { name: "Dr. Rachel Green", role: "Faculty Director & Advisor", initials: "RG", type: "faculty", focus: "Autonomous Vehicles & ROS2", bg: "linear-gradient(135deg, hsl(238, 83%, 90%) 0%, hsl(238, 83%, 75%) 100%)" },
    { name: "Dr. Marcus Vance", role: "Research Advisor", initials: "MV", type: "faculty", focus: "Quantum Information Systems", bg: "linear-gradient(135deg, hsl(160, 84%, 90%) 0%, hsl(160, 84%, 75%) 100%)" },
    { name: "Siddharth Sen", role: "Club President & AI Lead", initials: "SS", type: "student", focus: "Generative Models & NLP", bg: "linear-gradient(135deg, hsl(271, 91%, 90%) 0%, hsl(271, 91%, 75%) 100%)" },
    { name: "Ananya Deshmukh", role: "VP & Cybersecurity Lead", initials: "AD", type: "student", focus: "ZKP Identity Protocols", bg: "linear-gradient(135deg, hsl(38, 92%, 90%) 0%, hsl(38, 92%, 75%) 100%)" },
    { name: "Kabir Mehta", role: "Hardware Systems Head", initials: "KM", type: "student", focus: "Embedded Telemetry & ROS2", bg: "linear-gradient(135deg, hsl(329, 86%, 90%) 0%, hsl(329, 86%, 75%) 100%)" },
    { name: "Elena Rostova", role: "Treasurer & Cloud Architect", initials: "ER", type: "student", focus: "Distributed Databases & KV Stores", bg: "linear-gradient(135deg, hsl(200, 95%, 90%) 0%, hsl(200, 95%, 75%) 100%)" }
  ];

  const alumni = [
    { name: "Preeti Varma", graduated: "2024", role: "PhD Candidate, Stanford University", project: "Quantum Machine Learning", destination: "Stanford AI Lab" },
    { name: "Rohan Das", graduated: "2024", role: "Computer Vision Engineer, Tesla", project: "Occupancy Network LiDAR", destination: "Tesla Autopilot" },
    { name: "Sarah Jenkins", graduated: "2025", role: "Research Engineer, OpenAI", project: "RLHF Fine-tuning compilers", destination: "OpenAI Alignment Group" },
    { name: "Arjun Mehta", graduated: "2025", role: "Core Systems Engineer, Google Cloud", project: "Serverless Microkernels", destination: "Google Systems" }
  ];

  return (
    <div className="subpage-container container">
      {/* Back button */}
      <a href="/" onClick={handleBackToHome} className="back-btn btn btn-secondary btn-sm">
        <ArrowLeft size={16} /> Back to Overview
      </a>

      {/* Main Section */}
      <section className="subpage-hero">
        <span className="badge">Club Directory</span>
        <h1 className="subpage-title">Meet the Team & Alumni</h1>
        <p className="subpage-lead">
          Our team is comprised of driven students and faculty advisors. Discover our active student directory 
          and alumni research careers.
        </p>
      </section>

      {/* Team Roster Grid */}
      <section className="teampage-roster-section">
        <h2 className="subpage-section-title">Active Roster Directory</h2>
        <div className="teampage-grid">
          {members.map((member, idx) => (
            <div key={idx} className="teampage-card card">
              <div className="teampage-card-header">
                <div className="teampage-avatar" style={{ background: member.bg }}>
                  {member.initials}
                </div>
                <div className="teampage-name-block">
                  <h3>{member.name}</h3>
                  <span className="teampage-role-badge">{member.role}</span>
                </div>
              </div>
              
              <div className="teampage-focus-block">
                <BookOpen size={14} className="focus-icon" />
                <span>Focus: {member.focus}</span>
              </div>

              <div className="teampage-socials">
                <a href="#" className="social-icon-link" aria-label="GitHub"><GithubIcon /></a>
                <a href="#" className="social-icon-link" aria-label="LinkedIn"><LinkedinIcon /></a>
                <a href={`mailto:user@rdclub.edu`} className="social-icon-link" aria-label="Email"><Mail size={16} /></a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Alumni Accomplishments Section */}
      <section className="teampage-alumni-section" style={{ marginTop: '4rem' }}>
        <h2 className="subpage-section-title">Alumni Accomplishments & Placements</h2>
        <div className="alumni-timeline">
          {alumni.map((alum, idx) => (
            <div key={idx} className="alumni-row card">
              <div className="alumni-header">
                <div className="alumni-name-meta">
                  <h3>{alum.name}</h3>
                  <span className="alumni-year-badge">Class of {alum.graduated}</span>
                </div>
                <div className="alumni-placement">
                  <Briefcase size={16} /> <span>{alum.destination}</span>
                </div>
              </div>
              <p className="alumni-role-description">{alum.role}</p>
              <div className="alumni-project-detail">
                <span className="project-label">Core Club Project:</span>
                <p>{alum.project}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
