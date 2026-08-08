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
    { name: "Dr. Ashok Kumar Vootla", role: "Chief Coordinator", initials: "AV", type: "faculty", focus: "Institutional R&D & Strategy Coordination", bg: "linear-gradient(135deg, hsl(210, 100%, 90%) 0%, hsl(210, 100%, 75%) 100%)" },
    { name: "Kasarapu Ashok", role: "Coordinator", initials: "KA", type: "faculty", focus: "Program Management & Operations", bg: "linear-gradient(135deg, hsl(140, 70%, 90%) 0%, hsl(140, 70%, 75%) 100%)" },
    { name: "Gaddam Lakshmi", role: "Faculty & Head of AIML", initials: "GL", type: "faculty", focus: "Machine Learning & Neural Networks", bg: "linear-gradient(135deg, hsl(340, 80%, 90%) 0%, hsl(340, 80%, 75%) 100%)" },
    { name: "Syed Khaja Pasha", role: "Faculty", initials: "SP", type: "faculty", focus: "Data Engineering & Systems Architecture", bg: "linear-gradient(135deg, hsl(280, 80%, 90%) 0%, hsl(280, 80%, 75%) 100%)" },
    { name: "Prabhakar Parlapalli", role: "HOD of ECE", initials: "PP", type: "faculty", focus: "Embedded Systems & Signal Processing", bg: "linear-gradient(135deg, hsl(25, 95%, 90%) 0%, hsl(25, 95%, 75%) 100%)" },
    { name: "Ayhya", role: "Student Coordinator", initials: "AY", type: "student", focus: "Research & Operations Coordination", bg: "linear-gradient(135deg, hsl(271, 91%, 90%) 0%, hsl(271, 91%, 75%) 100%)" }
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
