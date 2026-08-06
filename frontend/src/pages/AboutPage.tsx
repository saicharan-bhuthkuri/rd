import React from 'react';
import { ArrowLeft, Calendar, ShieldCheck } from 'lucide-react';

export const AboutPage: React.FC = () => {
  const handleBackToHome = () => {
    window.location.hash = '#about';
  };

  const milestones = [
    {
      year: "2020",
      title: "Club Foundation",
      description: "Founded by Dr. Rachel Green and a group of 5 visionary computer engineering students with a single server rack and a passion for machine intelligence."
    },
    {
      year: "2022",
      title: "First Major Funding & Lab Setup",
      description: "Secured institutional grants to build dedicated hardware laboratory blocks. Installed computing servers and established the IoT Bench."
    },
    {
      year: "2023",
      title: "Research Recognition",
      description: "Published 12 research papers in reputable international conferences including IEEE and ACM, winning 2 best paper awards."
    },
    {
      year: "2024",
      title: "Rover-X Development & Field Test",
      description: "Launched our flagship autonomous exploration vehicle, Rover-X, testing it in complex subterranean cave systems."
    },
    {
      year: "2025",
      title: "Quantum Expansion",
      description: "Expanded domains to include Zero-Knowledge Cryptography and Quantum Computing Simulators, partnering with national institutes."
    }
  ];

  return (
    <div className="subpage-container container">
      {/* Back button */}
      <a href="/" onClick={handleBackToHome} className="back-btn btn btn-secondary btn-sm">
        <ArrowLeft size={16} /> Back to Overview
      </a>

      {/* Main Section */}
      <section className="subpage-hero">
        <span className="badge">Detailed Overview</span>
        <h1 className="subpage-title">About the R&D Club</h1>
        <p className="subpage-lead">
          An in-depth look at our operational philosophy, developmental timeline, and our pursuit of 
          computational and scientific excellence.
        </p>
      </section>

      {/* Core Values Detail Grid */}
      <div className="subpage-content-grid">
        <div className="subpage-main-column">
          <h2>Our Philosophy & Mission</h2>
          <p>
            At the R&D Club, we believe that students should not merely consume technology—they should shape it. 
            By providing access to high-performance hardware, institutional funding, and experienced mentorship, 
            we remove the bottlenecks that typically stall early-stage student innovation.
          </p>
          <p style={{ marginTop: '1rem' }}>
            We work in a peer-reviewed, open-source model. Every algorithm developed in our labs is hosted publicly, 
            and every paper drafted is subjected to rigorous internal reviews prior to formal submissions. This 
            academic rigor guarantees that our members develop skills that prepare them for elite industry positions 
            and prestigious graduate schools.
          </p>

          <h2 style={{ marginTop: '3.5rem', marginBottom: '2rem' }}>Historical Timeline</h2>
          <div className="timeline">
            {milestones.map((milestone, idx) => (
              <div key={idx} className="timeline-item">
                <div className="timeline-badge">
                  <Calendar size={14} />
                  <span>{milestone.year}</span>
                </div>
                <div className="timeline-panel">
                  <h3>{milestone.title}</h3>
                  <p>{milestone.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="subpage-sidebar">
          <div className="sidebar-card">
            <h3>Club Statistics</h3>
            <div className="sidebar-stat">
              <span className="stat-number">6+</span>
              <span className="stat-label">Years of Operation</span>
            </div>
            <div className="sidebar-stat">
              <span className="stat-number">40+</span>
              <span className="stat-label">Alumni in Top-Tier Labs</span>
            </div>
            <div className="sidebar-stat">
              <span className="stat-number">₹8L+</span>
              <span className="stat-label">Annual Research Funding Pool</span>
            </div>
          </div>

          <div className="sidebar-card highlight-card">
            <ShieldCheck className="sidebar-card-icon" size={24} />
            <h3>Institutional Affiliations</h3>
            <p>Our research works are supported by the University Grants Council and collaborate with national computing clusters.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
