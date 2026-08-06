import React from 'react';
import { Link } from 'react-router-dom';
import { Server, Users, Banknote, Briefcase, Sparkles, CheckCircle2 } from 'lucide-react';

interface BenefitItem {
  icon: React.ReactNode;
  title: string;
  description: string;
  points: string[];
}

interface BenefitsProps {
  isOverview?: boolean;
}

export const Benefits: React.FC<BenefitsProps> = ({ isOverview }) => {
  const benefits: BenefitItem[] = [
    {
      icon: <Server className="benefit-icon text-indigo" />,
      title: "Premium Lab Infrastructure",
      description: "Get direct, priority access to our dedicated workspace and hardware assets to test your prototypes.",
      points: [
        "High-performance compute clusters (NVIDIA H100/A100 GPUs)",
        "Fully equipped electronics bench & SMD rework stations",
        "Autonomous drone fleets & robotics hardware kits"
      ]
    },
    {
      icon: <Users className="benefit-icon text-emerald" />,
      title: "1-on-1 Academic Mentorship",
      description: "Work directly alongside senior professors, postdocs, and guest mentors from global companies.",
      points: [
        "Bi-weekly code & math reviews of ongoing projects",
        "Guidance on writing structured research papers",
        "Recommendation letters for higher studies & internships"
      ]
    },
    {
      icon: <Banknote className="benefit-icon text-violet" />,
      title: "Research & Travel Grants",
      description: "Never worry about hardware or publishing fees. We sponsor promising concepts from start to finish.",
      points: [
        "100% funding for conference registry (IEEE, ACM, NeurIPS)",
        "Sponsorship for travel and accommodation to presentations",
        "Stipends for outstanding open-source contributors"
      ]
    },
    {
      icon: <Briefcase className="benefit-icon text-amber" />,
      title: "Industry Placements",
      description: "Our alumni work at the absolute forefront of deep tech, research labs, and pioneering startups.",
      points: [
        "Exclusionary recruitment drives from deep tech partners",
        "Fast-track internship referrals to major research centers",
        "Mock interview prep sessions with senior alumni"
      ]
    }
  ];

  return (
    <section id="benefits" className="section">
      <div className="gradient-blob gradient-blob-1 animate-pulse-slow"></div>
      
      <div className="container">
        <div className="section-header">
          <span className="badge">Club Benefits</span>
          <h2 className="section-title">Why Join the R&D Club?</h2>
          <p className="section-subtitle">
            We provide a highly funded environment and community tailored for students who want to build 
            remarkable systems and conduct breakthrough research.
          </p>
        </div>

        <div className="benefits-grid">
          {benefits.map((benefit, index) => (
            <div key={index} className="benefit-card card">
              <div className="benefit-card-header">
                <div className="benefit-icon-container">
                  {benefit.icon}
                </div>
                <h3 className="benefit-card-title">{benefit.title}</h3>
              </div>
              
              <p className="benefit-card-description">{benefit.description}</p>
              
              <ul className="benefit-points-list">
                {benefit.points.map((pt, idx) => (
                  <li key={idx}>
                    <CheckCircle2 size={16} className="point-check-icon" />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Dynamic prompt section */}
        <div className="benefits-footer-banner">
          <div className="banner-content">
            <Sparkles className="banner-sparkle-icon" size={24} />
            <div>
              <h3>Ready to build something outstanding?</h3>
              <p>We are recruiting developers, designers, mathematicians, and technical writers. Applications are evaluated on a rolling basis.</p>
            </div>
          </div>
          <Link to="/apply" className="btn btn-primary">
            Submit Application
          </Link>
        </div>

        {isOverview && (
          <div className="section-overview-footer" style={{ marginTop: '3.5rem', textAlign: 'center' }}>
            <Link to="/benefits" className="btn btn-outline-primary">
              View Detailed Compute Quotas & Funding Tiers &rarr;
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};
