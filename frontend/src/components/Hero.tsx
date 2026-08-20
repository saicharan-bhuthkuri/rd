import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, BookOpen } from 'lucide-react';

export const Hero: React.FC = () => {
  const handleScroll = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section id="home" className="hero-section">
      {/* Background visual blobs */}
      <div className="gradient-blob gradient-blob-1 animate-pulse-slow"></div>
      <div className="gradient-blob gradient-blob-2 animate-pulse-slow"></div>

      <div className="container hero-container">
        <div className="hero-content">
          <div className="badge badge-secondary animate-float">
            <Sparkles size={14} className="badge-icon-left" />
            Discover & Innovate
          </div>
          <h1 className="hero-title">
            Pushing the Boundaries of <span className="text-gradient">Technology</span> & Research
          </h1>
          <p className="hero-description">
            Welcome to R&D Cell. We are a community of student researchers, developers, 
            and creators dedicated to exploring deep tech, building impactful solutions, and 
            pioneering scientific discovery.
          </p>
          <div className="hero-actions">
            <Link
              to="/apply"
              className="btn btn-primary"
            >
              Apply to Join <ArrowRight size={18} />
            </Link>
            <button
              onClick={() => handleScroll('#research')}
              className="btn btn-secondary"
            >
              Explore Domains <BookOpen size={18} />
            </button>
          </div>
          <div className="hero-stats">
            <div className="hero-stat-item">
              <span className="hero-stat-number">15+</span>
              <span className="hero-stat-label">Research Domains</span>
            </div>
            <div className="hero-stat-item">
              <span className="hero-stat-number">50+</span>
              <span className="hero-stat-label">Projects Published</span>
            </div>
            <div className="hero-stat-item">
              <span className="hero-stat-number">300+</span>
              <span className="hero-stat-label">Active Members</span>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-visual-card">
            {/* Elegant floating R&D node diagram */}
            <svg viewBox="0 0 500 500" className="hero-svg" aria-hidden="true">
              {/* Grid backdrop */}
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(226, 232, 240, 0.5)" strokeWidth="1" />
                </pattern>
                <linearGradient id="primary-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(160, 84%, 33%)" />
                  <stop offset="100%" stopColor="hsl(180, 80%, 40%)" />
                </linearGradient>
                <linearGradient id="secondary-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(238, 83%, 58%)" />
                  <stop offset="100%" stopColor="hsl(271, 91%, 65%)" />
                </linearGradient>
              </defs>
              
              <rect width="100%" height="100%" fill="url(#grid)" />
              
              {/* Connected web lines */}
              <g className="svg-connections" stroke="rgba(16, 185, 129, 0.15)" strokeWidth="2">
                <line x1="250" y1="250" x2="150" y2="150" className="pulse-line-1" />
                <line x1="250" y1="250" x2="350" y2="150" className="pulse-line-2" />
                <line x1="250" y1="250" x2="150" y2="350" className="pulse-line-3" />
                <line x1="250" y1="250" x2="350" y2="350" className="pulse-line-4" />
                <line x1="150" y1="150" x2="350" y2="150" />
                <line x1="150" y1="350" x2="350" y2="350" />
                <line x1="150" y1="150" x2="150" y2="350" />
                <line x1="350" y1="150" x2="350" y2="350" />
              </g>

              {/* Floating science/tech themed orbits */}
              <circle cx="250" cy="250" r="130" fill="none" stroke="rgba(16, 185, 129, 0.08)" strokeWidth="1" strokeDasharray="5 5" />
              <circle cx="250" cy="250" r="80" fill="none" stroke="rgba(99, 102, 241, 0.08)" strokeWidth="1" />

              {/* Node core circles */}
              <g className="svg-nodes">
                {/* Center node */}
                <g className="animate-float" style={{ animationDelay: '0s' }}>
                  <circle cx="250" cy="250" r="28" fill="url(#primary-grad)" filter="drop-shadow(0px 8px 16px rgba(16, 185, 129, 0.3))" />
                  <text x="250" y="254" fill="white" fontSize="11" fontWeight="bold" textAnchor="middle">R&D</text>
                </g>

                {/* Top-Left node: AI */}
                <g className="animate-float" style={{ animationDelay: '1s' }}>
                  <circle cx="150" cy="150" r="20" fill="url(#primary-grad)" filter="drop-shadow(0px 6px 12px rgba(16, 185, 129, 0.2))" />
                  <text x="150" y="153" fill="white" fontSize="10" fontWeight="600" textAnchor="middle">AI</text>
                </g>

                {/* Top-Right node: IoT */}
                <g className="animate-float" style={{ animationDelay: '2s' }}>
                  <circle cx="350" cy="150" r="20" fill="url(#secondary-grad)" filter="drop-shadow(0px 6px 12px rgba(99, 102, 241, 0.2))" />
                  <text x="350" y="153" fill="white" fontSize="10" fontWeight="600" textAnchor="middle">IoT</text>
                </g>

                {/* Bottom-Left node: Rob */}
                <g className="animate-float" style={{ animationDelay: '3s' }}>
                  <circle cx="150" cy="350" r="20" fill="url(#secondary-grad)" filter="drop-shadow(0px 6px 12px rgba(99, 102, 241, 0.2))" />
                  <text x="150" y="353" fill="white" fontSize="9" fontWeight="600" textAnchor="middle">ROB</text>
                </g>

                {/* Bottom-Right node: Quant */}
                <g className="animate-float" style={{ animationDelay: '4s' }}>
                  <circle cx="350" cy="350" r="20" fill="url(#primary-grad)" filter="drop-shadow(0px 6px 12px rgba(16, 185, 129, 0.2))" />
                  <text x="350" y="353" fill="white" fontSize="9" fontWeight="600" textAnchor="middle">QUANT</text>
                </g>
              </g>
            </svg>
            <div className="visual-badge visual-badge-1 animate-float">
              <span className="dot dot-primary"></span> Deep Tech Research
            </div>
            <div className="visual-badge visual-badge-2 animate-float" style={{ animationDelay: '2s' }}>
              <span className="dot dot-secondary"></span> Engineering Innovation
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
