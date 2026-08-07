import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { Mail, MapPin, Clock, Send, Check, Loader2 } from 'lucide-react';

interface FormData {
  name: string;
  email: string;
  majorYear: string;
  domain: string;
  pitch: string;
  portfolio: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  majorYear?: string;
  domain?: string;
  pitch?: string;
}

interface ContactProps {
  isOverview?: boolean;
}

export const Contact: React.FC<ContactProps> = ({ isOverview }) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    majorYear: '',
    domain: '',
    pitch: '',
    portfolio: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Full name is required';
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.majorYear.trim()) newErrors.majorYear = 'Major & Year are required';
    if (!formData.domain) newErrors.domain = 'Please select a research domain';
    
    if (!formData.pitch.trim()) {
      newErrors.pitch = 'Project pitch or interest is required';
    } else if (formData.pitch.trim().length < 30) {
      newErrors.pitch = 'Please write at least 30 characters explaining your interest';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear errors when typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    const payload = {
      fullName: formData.name,
      pinNumber: "Quick Submit",
      email: formData.email,
      mobile: "N/A",
      branch: formData.majorYear,
      yearOfStudy: "Other",
      section: "N/A",
      interests: formData.domain,
      skills: formData.portfolio || "N/A",
      reasonToJoin: formData.pitch
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/apply/club`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Server error occurred');
      }

      setIsSuccess(true);
      setFormData({
        name: '',
        email: '',
        majorYear: '',
        domain: '',
        pitch: '',
        portfolio: ''
      });
    } catch (err: any) {
      alert(`Submission failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="section section-bg-alt">
      <div className="gradient-blob gradient-blob-2 animate-pulse-slow"></div>
      
      <div className="container">
        <div className="section-header">
          <span className="badge">Apply / Inquire</span>
          <h2 className="section-title">Join the Research Team</h2>
          <p className="section-subtitle">
            Submit your application details below. Our executive board will review all submissions 
            and contact qualified candidates within 7 business days.
          </p>
        </div>

        <div className="contact-grid">
          {/* Left: Contact Info Sidebar */}
          <div className="contact-info">
            <div className="info-card">
              <h3 className="info-title">Lab Information</h3>
              <p className="info-description">Feel free to drop by the lab during operational hours to meet current members and see live projects.</p>
              
              <div className="info-list">
                <div className="info-item">
                  <div className="info-icon-wrapper">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <h4>Lab Office Location</h4>
                    <p>Computing Sciences Block, Floor 3, Suite 304</p>
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-icon-wrapper">
                    <Mail size={18} />
                  </div>
                  <div>
                    <h4>Email Address</h4>
                    <p>recruitment@rdclub.edu</p>
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-icon-wrapper">
                    <Clock size={18} />
                  </div>
                  <div>
                    <h4>Open Access Hours</h4>
                    <p>Mon - Fri: 9:00 AM - 6:00 PM IST</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Map Placeholder Card */}
            <div className="map-placeholder-card">
              <div className="map-grid-pattern"></div>
              <div className="map-pin-indicator animate-float">
                <MapPin size={24} className="map-pin-svg" />
                <span className="map-pin-ripple"></span>
              </div>
              <div className="map-label">
                <span>R&D Main Laboratory (Suite 304)</span>
              </div>
            </div>
          </div>

          {/* Right: Application Form */}
          <div className="contact-form-container">
            {isSuccess ? (
              <div className="success-state">
                <div className="success-icon-wrapper">
                  <Check size={48} />
                </div>
                <h3>Application Submitted!</h3>
                <p>
                  Thank you for applying to the R&D Club. A copy of your submission has been recorded. 
                  We will evaluate your responses and email you details regarding the initial interview slots.
                </p>
                <button onClick={() => setIsSuccess(false)} className="btn btn-secondary">
                  Submit another application
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-grid">
                  {/* Full Name */}
                  <div className="form-group">
                    <label htmlFor="name">Full Name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. John Doe"
                      className={errors.name ? 'input-error' : ''}
                    />
                    {errors.name && <span className="error-text">{errors.name}</span>}
                  </div>

                  {/* Email */}
                  <div className="form-group">
                    <label htmlFor="email">Email Address *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="e.g. john@rdclub.edu"
                      className={errors.email ? 'input-error' : ''}
                    />
                    {errors.email && <span className="error-text">{errors.email}</span>}
                  </div>

                  {/* Major / Year */}
                  <div className="form-group">
                    <label htmlFor="majorYear">Major & Year of Study *</label>
                    <input
                      type="text"
                      id="majorYear"
                      name="majorYear"
                      value={formData.majorYear}
                      onChange={handleChange}
                      placeholder="e.g. B.Tech CSE, 3rd Year"
                      className={errors.majorYear ? 'input-error' : ''}
                    />
                    {errors.majorYear && <span className="error-text">{errors.majorYear}</span>}
                  </div>

                  {/* Domain Selector */}
                  <div className="form-group">
                    <label htmlFor="domain">Preferred Research Domain *</label>
                    <select
                      id="domain"
                      name="domain"
                      value={formData.domain}
                      onChange={handleChange}
                      className={errors.domain ? 'input-error' : ''}
                    >
                      <option value="">Select a Domain</option>
                      <option value="AI & Machine Learning">AI & Machine Learning</option>
                      <option value="Robotics & IoT">Robotics & IoT</option>
                      <option value="Quantum Computing">Quantum Computing</option>
                      <option value="Biotechnology & Bioinformatics">Biotechnology & Bioinformatics</option>
                      <option value="Cybersecurity & Cryptography">Cybersecurity & Cryptography</option>
                      <option value="Cloud & Distributed Systems">Cloud & Distributed Systems</option>
                    </select>
                    {errors.domain && <span className="error-text">{errors.domain}</span>}
                  </div>

                  {/* Portfolio Link */}
                  <div className="form-group full-width">
                    <label htmlFor="portfolio">GitHub or Portfolio URL (Optional)</label>
                    <input
                      type="url"
                      id="portfolio"
                      name="portfolio"
                      value={formData.portfolio}
                      onChange={handleChange}
                      placeholder="https://github.com/yourusername"
                    />
                  </div>

                  {/* Project Pitch / Interest */}
                  <div className="form-group full-width">
                    <label htmlFor="pitch">Why do you want to join? Briefly pitch a project idea or interest *</label>
                    <textarea
                      id="pitch"
                      name="pitch"
                      rows={5}
                      value={formData.pitch}
                      onChange={handleChange}
                      placeholder="Explain your research objectives, any past projects, or a specific problem domain you want to focus on (minimum 30 characters)..."
                      className={errors.pitch ? 'input-error' : ''}
                    ></textarea>
                    {errors.pitch && <span className="error-text">{errors.pitch}</span>}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary form-submit-btn"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="spinner-icon" size={18} /> Processing Application...
                    </>
                  ) : (
                    <>
                      Submit Application <Send size={16} />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {isOverview && (
          <div className="section-overview-footer" style={{ marginTop: '3.5rem', textAlign: 'center' }}>
            <Link to="/contact" className="btn btn-outline-primary">
              View Visitor Guidelines & Laboratory Directory &rarr;
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};
