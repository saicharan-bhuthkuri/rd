import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Rocket } from 'lucide-react';

export const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Reset mobile menu on navigation
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { label: 'Home', to: '/' },
    { label: 'About', to: '/about' },
    { label: 'Research', to: '/research' },
    { label: 'Events', to: '/events' },
    { label: 'Benefits', to: '/benefits' },
    { label: 'Team', to: '/team' },
    { label: 'FAQs', to: '/faqs' },
    { label: 'Contact', to: '/contact' },
    { label: 'Verify Certificate', to: '/verify' },
  ];

  return (
    <header className={`header ${isScrolled ? 'header-scrolled' : ''} ${isMobileMenuOpen ? 'mobile-menu-open' : ''}`}>
      <div className="container header-container">
        {/* Logo */}
        <Link to="/" className="logo-container">
          <div className="logo-icon-bg">
            <Rocket className="logo-icon" size={20} />
          </div>
          <span className="logo-text">R&D <span className="logo-text-accent">Club</span></span>
        </Link>

        {/* Desktop Nav */}
        <nav className="desktop-nav">
          <ul className="nav-list">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className={`nav-link ${isActive ? 'active' : ''}`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* CTA */}
        <div className="header-cta">
          <Link
            to="/apply"
            className="btn btn-primary btn-sm"
          >
            Apply Now
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="mobile-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-expanded={isMobileMenuOpen}
          aria-label="Toggle navigation menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      <div className={`mobile-drawer ${isMobileMenuOpen ? 'open' : ''}`}>
        <nav className="mobile-nav">
          <ul className="mobile-nav-list">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className={`mobile-nav-link ${isActive ? 'active' : ''}`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
            <li className="mobile-nav-cta">
              <Link
                to="/apply"
                className="btn btn-primary"
              >
                Apply Now
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};
