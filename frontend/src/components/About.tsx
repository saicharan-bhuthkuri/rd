import React from 'react';
import { Link } from 'react-router-dom';
import { Target, Eye, Compass, Award } from 'lucide-react';

interface AboutProps {
  isOverview?: boolean;
}

export const About: React.FC<AboutProps> = ({ isOverview }) => {
  const values = [
    {
      icon: <Compass className="value-icon text-indigo" />,
      title: "Curiosity-Driven",
      description: "We ask the hard questions. We explore uncharted areas of technology and science without fear of failure."
    },
    {
      icon: <Target className="value-icon text-emerald" />,
      title: "Impact-Focused",
      description: "Our research isn't just theoretical. We aim to solve real-world problems and build tangible, open-source solutions."
    },
    {
      icon: <Award className="value-icon text-violet" />,
      title: "Excellence & Rigor",
      description: "We maintain high standards of scientific integrity, code quality, and peer review in everything we publish."
    }
  ];

  return (
    <section id="about" className="section section-bg-alt">
      <div className="gradient-blob gradient-blob-3 animate-pulse-slow"></div>
      
      <div className="container">
        <div className="section-header">
          <span className="badge">About the Club</span>
          <h2 className="section-title">Nurturing the Next Generation of Pioneers</h2>
          <p className="section-subtitle">
            We bridge the gap between academic theory and practical, cutting-edge development. 
            Here is how we think and work.
          </p>
        </div>

        <div className="about-grid">
          {/* Left Column: Mission & Vision */}
          <div className="about-content">
            <div className="about-block">
              <div className="about-block-header">
                <Target className="about-block-icon" size={24} />
                <h3>Our Mission</h3>
              </div>
              <p>
                To build an inclusive ecosystem that inspires students to pursue high-impact scientific research 
                and engineering development. We equip our members with the mentorship, resources, and freedom 
                needed to convert conceptual ideas into peer-reviewed papers and deployment-ready software.
              </p>
            </div>

            <div className="about-block">
              <div className="about-block-header">
                <Eye className="about-block-icon" size={24} />
                <h3>Our Vision</h3>
              </div>
              <p>
                To be recognized globally as a premier student-run innovation hub that consistently contributes 
                to open-source technology, academic journals, and breakthrough engineering prototypes that address 
                global challenges.
              </p>
            </div>
          </div>

          {/* Right Column: Key Values List */}
          <div className="about-values">
            <h3 className="values-heading">Our Core Pillars</h3>
            <div className="values-list">
              {values.map((val, idx) => (
                <div key={idx} className="value-card">
                  <div className="value-icon-container">
                    {val.icon}
                  </div>
                  <div className="value-card-body">
                    <h4>{val.title}</h4>
                    <p>{val.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {isOverview && (
          <div className="section-overview-footer" style={{ marginTop: '3.5rem', textAlign: 'center' }}>
            <Link to="/about" className="btn btn-outline-primary">
              Read Detailed History & Timeline &rarr;
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};
