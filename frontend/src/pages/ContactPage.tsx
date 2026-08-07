import React, { useState } from 'react';
import { API_BASE_URL } from '../config';
import { ArrowLeft, Mail, Phone, Send, Check, Loader2, Info } from 'lucide-react';

interface ContactMessage {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState<ContactMessage>({
    name: '',
    email: '',
    subject: 'Collaboration Proposal',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleBackToHome = () => {
    window.location.hash = '#contact';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Server error occurred');
      }

      setIsSuccess(true);
      setFormData({
        name: '',
        email: '',
        subject: 'Collaboration Proposal',
        message: ''
      });
    } catch (err: any) {
      alert(`Submission failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="subpage-container container">
      {/* Back button */}
      <a href="/" onClick={handleBackToHome} className="back-btn btn btn-secondary btn-sm">
        <ArrowLeft size={16} /> Back to Overview
      </a>

      {/* Main Section */}
      <section className="subpage-hero">
        <span className="badge">Get in Touch</span>
        <h1 className="subpage-title">Contact & Communication Directory</h1>
        <p className="subpage-lead">
          Reach out to specific laboratory divisions, request visitor permissions, or submit academic 
          collaboration requests.
        </p>
      </section>

      <div className="contact-grid" style={{ marginTop: '2rem' }}>
        {/* Left column: detailed department extensions */}
        <div className="contact-info">
          <div className="info-card">
            <h3>Laboratory Directory</h3>
            <p className="info-description">For domain-specific inquiries, direct emails ensure faster routing.</p>
            
            <div className="info-list">
              <div className="info-item">
                <div className="info-icon-wrapper"><Mail size={16} /></div>
                <div>
                  <h4>General Inquiries & Admissions</h4>
                  <p>recruitment@rdclub.edu</p>
                  <p className="sub-text">Response time: ~48 Hours</p>
                </div>
              </div>

              <div className="info-item">
                <div className="info-icon-wrapper"><Mail size={16} /></div>
                <div>
                  <h4>Research & Publications Panel</h4>
                  <p>submissions@rdclub.edu</p>
                  <p className="sub-text">For LaTeX draft submissions & pre-prints</p>
                </div>
              </div>

              <div className="info-item">
                <div className="info-icon-wrapper"><Mail size={16} /></div>
                <div>
                  <h4>Corporate Partnerships & PR</h4>
                  <p>collab@rdclub.edu</p>
                  <p className="sub-text">For hardware sponsors & speaker requests</p>
                </div>
              </div>

              <div className="info-item">
                <div className="info-icon-wrapper"><Phone size={16} /></div>
                <div>
                  <h4>Main Laboratory Desk</h4>
                  <p>+91 (080) 2554-9041 ext. 304</p>
                  <p className="sub-text">Operational desk, Mon-Fri 9AM-6PM</p>
                </div>
              </div>
            </div>
          </div>

          {/* Visitor Protocol */}
          <div className="benefits-disclaimer-card" style={{ border: '1px solid var(--border)' }}>
            <Info size={20} className="disclaimer-icon" style={{ color: 'var(--primary)' }} />
            <div className="disclaimer-text">
              <h4>Visitor Guidelines</h4>
              <p>
                Outside researchers and campus visitors must request a gate pass at least 24 hours in advance. 
                Please email `collab@rdclub.edu` with your research objectives to obtain visitor credentials.
              </p>
            </div>
          </div>
        </div>

        {/* Right column: General Enquiry Form */}
        <div className="contact-form-container">
          {isSuccess ? (
            <div className="success-state">
              <div className="success-icon-wrapper">
                <Check size={48} />
              </div>
              <h3>Message Sent Successfully!</h3>
              <p>
                Your inquiry has been logged. Our student panel or faculty coordinators will review it 
                and respond via email.
              </p>
              <button onClick={() => setIsSuccess(false)} className="btn btn-secondary">
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="contact-form">
              <h3>Send a Message</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                Use this form for general questions, suggestion submissions, or feedback.
              </p>
              
              <div className="form-group">
                <label htmlFor="name">Your Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  placeholder="e.g. John Doe"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  placeholder="e.g. john@university.edu"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="subject">Subject</label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                >
                  <option value="Collaboration Proposal">Collaboration Proposal</option>
                  <option value="Event Inquiry">Event Inquiry</option>
                  <option value="Sponsorship Inquiry">Sponsorship Inquiry</option>
                  <option value="General Feedback">General Feedback</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="message">Message Body</label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={4}
                  placeholder="Write your query in detail..."
                  value={formData.message}
                  onChange={handleChange}
                ></textarea>
              </div>

              <button type="submit" disabled={isSubmitting} className="btn btn-primary form-submit-btn">
                {isSubmitting ? (
                  <>
                    <Loader2 className="spinner-icon" size={16} /> Sending...
                  </>
                ) : (
                  <>
                    Send Message <Send size={16} />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
