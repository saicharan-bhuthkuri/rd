import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Rocket, Send, Check, Loader2 } from 'lucide-react';

const GithubIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
  </svg>
);

const LinkedinIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
    <rect x="2" y="9" width="4" height="12"></rect>
    <circle cx="4" cy="4" r="2"></circle>
  </svg>
);

const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
  </svg>
);

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email');
      return;
    }

    setError('');
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setEmail('');
    }, 1200);
  };



  return (
    <footer className="footer">
      <div className="container footer-container">
        {/* Col 1: Logo & Desc */}
        <div className="footer-col brand-col">
          <Link to="/" className="logo-container">
            <div className="logo-icon-bg">
              <Rocket className="logo-icon" size={20} />
            </div>
            <span className="logo-text">R&D <span className="logo-text-accent">Cell</span></span>
          </Link>
          <p className="brand-description">
            Pushing technological envelopes through structured scientific research and hardware prototyping. 
            A student-run innovation cluster.
          </p>
          <div className="brand-socials">
            <a href="#" aria-label="R&D Club GitHub" className="social-icon-link">
              <GithubIcon />
            </a>
            <a href="#" aria-label="R&D Club LinkedIn" className="social-icon-link">
              <LinkedinIcon />
            </a>
            <a href="#" aria-label="R&D Club Twitter/X" className="social-icon-link">
              <TwitterIcon />
            </a>
          </div>
        </div>

        {/* Col 2: Site Map */}
        <div className="footer-col">
          <h4 className="footer-heading">Navigation</h4>
          <ul className="footer-links">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/about">About Club</Link></li>
            <li><Link to="/research">Research Labs</Link></li>
            <li><Link to="/events">Events Calendar</Link></li>
            <li><Link to="/benefits">Member Benefits</Link></li>
            <li><Link to="/team">Our Team</Link></li>
            <li><Link to="/verify">Verify Certificate</Link></li>
          </ul>
        </div>

        {/* Col 3: Research Domains */}
        <div className="footer-col">
          <h4 className="footer-heading">Research Domains</h4>
          <ul className="footer-links">
            <li><Link to="/research">AI & Machine Learning</Link></li>
            <li><Link to="/research">Robotics & IoT</Link></li>
            <li><Link to="/research">Quantum Computing</Link></li>
            <li><Link to="/research">Biotech & Genomics</Link></li>
            <li><Link to="/research">Cybersecurity</Link></li>
            <li><Link to="/research">Distributed Engines</Link></li>
          </ul>
        </div>

        {/* Col 4: Newsletter */}
        <div className="footer-col newsletter-col">
          <h4 className="footer-heading">Research Digest</h4>
          <p className="newsletter-description">Subscribe to our monthly newsletter summarizing active projects, open-source releases, and paper publications.</p>
          
          {isSuccess ? (
            <div className="newsletter-success">
              <Check size={16} />
              <span>Successfully subscribed!</span>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="newsletter-form">
              <div className="newsletter-input-group">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  className={error ? 'input-error' : ''}
                />
                <button type="submit" disabled={isSubmitting} aria-label="Subscribe to newsletter">
                  {isSubmitting ? <Loader2 size={16} className="spinner-icon" /> : <Send size={16} />}
                </button>
              </div>
              {error && <span className="newsletter-error">{error}</span>}
            </form>
          )}
        </div>
      </div>

      {/* Footer Bottom copyright */}
      <div className="footer-bottom">
        <div className="container bottom-container">
          <p className="copyright-text">&copy; {new Date().getFullYear()} Research & Development Club. All rights reserved.</p>
          <div className="bottom-links">
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>Built & Managed by AI & ML Department</span>
            <span className="divider">&middot;</span>
            <a href="https://saivortex.web.app/" target="_blank" rel="noopener noreferrer">Design by saivortex</a>
            <span className="divider">&middot;</span>
            <a href="#">Privacy Policy</a>
            <span className="divider">&middot;</span>
            <a href="#">Terms of Use</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
