import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { ArrowLeft, User, Mail, Phone, GraduationCap, Calendar, Sparkles, Check, Loader2, Code, Users, Server, ChevronDown } from 'lucide-react';

type FormType = 'none' | 'join-club' | 'event';

interface CustomSelectProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
  icon: React.ReactNode;
  required?: boolean;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  id,
  value,
  onChange,
  options,
  placeholder,
  icon,
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div 
      className="custom-select-container" 
      ref={containerRef} 
      style={{ position: 'relative', width: '100%' }}
    >
      <div 
        className="input-with-icon" 
        onClick={() => setIsOpen(!isOpen)}
        style={{ cursor: 'pointer' }}
      >
        {icon}
        <div 
          className="custom-select-trigger"
          style={{
            padding: '0.75rem 2.75rem 0.75rem 2.75rem',
            borderRadius: 'var(--radius-md)',
            border: isOpen ? '1px solid var(--primary)' : '1px solid var(--border)',
            backgroundColor: 'var(--bg-main)',
            color: value ? 'var(--text-main)' : 'var(--text-muted)',
            fontSize: '0.9375rem',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: isOpen ? '0 0 0 3px var(--primary-glow)' : 'none',
            transition: 'var(--transition-fast)',
            minHeight: '45px',
            userSelect: 'none'
          }}
        >
          <span>{value || placeholder}</span>
          <ChevronDown 
            size={16} 
            style={{ 
              color: isOpen ? 'var(--primary)' : 'var(--text-muted)', 
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform var(--transition-fast)'
            }} 
          />
        </div>
      </div>

      <select
        id={id}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          position: 'absolute',
          opacity: 0,
          width: '100%',
          height: '100%',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          zIndex: -1
        }}
      >
        <option value="">{placeholder}</option>
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>

      {isOpen && (
        <div 
          className="custom-select-options"
          style={{
            position: 'absolute',
            top: 'calc(100% + 0.5rem)',
            left: 0,
            right: 0,
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 100,
            maxHeight: '200px',
            overflowY: 'auto',
            animation: 'modalFadeIn 0.15s ease-out'
          }}
        >
          {required && placeholder && (
            <div
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
              style={{
                padding: '0.625rem 1rem',
                fontSize: '0.875rem',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'background-color 0.15s',
                backgroundColor: value === '' ? 'var(--primary-light)' : 'transparent',
                fontWeight: value === '' ? 600 : 400
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = value === '' ? 'var(--primary-light)' : 'transparent'}
            >
              {placeholder}
            </div>
          )}
          {options.map((option) => (
            <div
              key={option}
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
              style={{
                padding: '0.625rem 1rem',
                fontSize: '0.875rem',
                color: value === option ? 'var(--primary)' : 'var(--text-main)',
                cursor: 'pointer',
                transition: 'background-color 0.15s, color 0.15s',
                backgroundColor: value === option ? 'var(--primary-light)' : 'transparent',
                fontWeight: value === option ? 600 : 400
              }}
              onMouseEnter={(e) => {
                if (value !== option) {
                  e.currentTarget.style.backgroundColor = 'var(--primary-light)';
                  e.currentTarget.style.color = 'var(--primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (value !== option) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-main)';
                }
              }}
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const ApplyPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [formType, setFormType] = useState<FormType>('none');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Common fields state
  const [fullName, setFullName] = useState('');
  const [pinNumber, setPinNumber] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [branch, setBranch] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('');
  const [section, setSection] = useState('');

  // Event specific fields state
  const [eventName, setEventName] = useState('');
  const [notes, setNotes] = useState('');

  // Club specific fields state
  const [interests, setInterests] = useState('');
  const [skills, setSkills] = useState('');
  const [reasonToJoin, setReasonToJoin] = useState('');

  const [eventsList, setEventsList] = useState<string[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [branchesList, setBranchesList] = useState<string[]>([]);

  const handleBackToHome = () => {
    window.location.href = '/';
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/events`);
        if (response.ok) {
          const data = await response.json();
          const titles = data.map((evt: any) => evt.title);
          setEventsList(titles);
          
          // Pre-select the query parameter event if present
          const eventParam = searchParams.get('event');
          if (eventParam && titles.includes(eventParam)) {
            setFormType('event');
            setEventName(eventParam);
          } else if (titles.length > 0) {
            setEventName(titles[0]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch events list:", err);
      } finally {
        setIsLoadingEvents(false);
      }
    };

    const fetchBranches = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/branches`);
        if (response.ok) {
          const data = await response.json();
          const names = data.map((b: any) => b.name);
          setBranchesList(names);
        }
      } catch (err) {
        console.error("Failed to fetch branches list:", err);
      }
    };

    fetchEvents();
    fetchBranches();

    const handleSync = (e: Event) => {
      const eventType = (e as CustomEvent).detail;
      if (eventType === 'REFRESH_EVENTS') {
        fetchEvents();
      } else if (eventType === 'REFRESH_BRANCHES') {
        fetchBranches();
      }
    };

    window.addEventListener('app-sync', handleSync);
    return () => window.removeEventListener('app-sync', handleSync);
  }, [searchParams]);

  const handleFormSelect = (type: FormType) => {
    setFormType(type);
    setIsSuccess(false);
    // Reset all form inputs
    setFullName('');
    setPinNumber('');
    setEmail('');
    setMobile('');
    setBranch('');
    setYearOfStudy('');
    setSection('');
    setEventName(eventsList.length > 0 ? eventsList[0] : '');
    setNotes('');
    setInterests('');
    setSkills('');
    setReasonToJoin('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = formType === 'join-club' ? {
      fullName,
      pinNumber,
      email,
      mobile,
      branch,
      yearOfStudy,
      section,
      interests,
      skills,
      reasonToJoin
    } : {
      fullName,
      pinNumber,
      email,
      mobile,
      branch,
      yearOfStudy,
      section,
      eventName,
      notes
    };

    const endpoint = formType === 'join-club' ? 'club' : 'event';

    try {
      const response = await fetch(`${API_BASE_URL}/api/apply/${endpoint}`, {
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
    } catch (err: any) {
      alert(`Submission failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="subpage-container container apply-subpage-container">
      {/* Back button */}
      <button onClick={handleBackToHome} className="back-btn btn btn-secondary btn-sm" style={{ marginBottom: '2rem' }}>
        <ArrowLeft size={16} /> Back to Homepage
      </button>

      {formType === 'none' ? (
        /* 1. Selection screen: centered, full-width options, NO branding panel */
        <div className="apply-selection-container">
          <section className="subpage-hero" style={{ marginBottom: '3rem', textAlign: 'center', marginLeft: 'auto', marginRight: 'auto', maxWidth: '42rem' }}>
            <span className="badge">Application Portal</span>
            <h1 className="subpage-title">Submit Application Request</h1>
            <p className="subpage-lead">
              Select whether you want to apply to become an official member of the R&D Club or register for one 
              of our upcoming technical workshops and hackathons.
            </p>
          </section>

          <div className="apply-options-grid">
            <div className="apply-option-card card hover-lift" onClick={() => handleFormSelect('join-club')}>
              <div className="apply-icon-wrapper club-icon">
                <Sparkles size={28} />
              </div>
              <h3>Join the R&D Club</h3>
              <p>
                Apply for official membership to get lab RFID keys, hardware budgets, and travel grants.
              </p>
              <button className="btn btn-primary btn-sm">Start Application</button>
            </div>

            <div className="apply-option-card card hover-lift" onClick={() => handleFormSelect('event')}>
              <div className="apply-icon-wrapper event-icon">
                <Calendar size={28} />
              </div>
              <h3>Apply for an Event</h3>
              <p>
                Register for upcoming PyTorch bootcamps, TinyML hackathons, or compiler colloquiums.
              </p>
              <button className="btn btn-primary btn-sm">Register for Event</button>
            </div>
          </div>
        </div>
      ) : (
        /* 2. Form screen: Two-column split layout WITH branding panel */
        <div className="apply-split-layout">
          
          {/* Left Column: Branding panel */}
          <div className="apply-info-panel">
            <span className="badge">Join the Pioneers</span>
            <h1 className="apply-panel-title">Shape the Future With R&D Club</h1>
            <p className="apply-panel-desc">
              Collaborate on bleeding-edge projects, build production-grade features, and accelerate your 
              engineering skills. We bridge the gap between academic theory and industry reality.
            </p>

            <div className="apply-features-list">
              <div className="apply-feature-item">
                <div className="feature-icon-box">
                  <Code size={18} />
                </div>
                <div className="feature-item-text">
                  <h4>Real-World Experience</h4>
                  <p>Work directly on modern software/hardware codebases and write peer-reviewed scientific papers.</p>
                </div>
              </div>

              <div className="apply-feature-item">
                <div className="feature-icon-box text-emerald">
                  <Users size={18} />
                </div>
                <div className="feature-item-text">
                  <h4>Mentorship & Growth</h4>
                  <p>Get guided by experienced senior researchers and faculty advisors with regular code reviews.</p>
                </div>
              </div>

              <div className="apply-feature-item">
                <div className="feature-icon-box text-indigo">
                  <Server size={18} />
                </div>
                <div className="feature-item-text">
                  <h4>HPC Compute & Resources</h4>
                  <p>Get priority access to high-performance A100/H100 clusters and electronics testing labs.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Detailed form */}
          <div className="apply-form-panel">
            <div className="form-container-card card">
              <div className="form-header-row">
                <div>
                  <h2>{formType === 'join-club' ? 'Membership Application' : 'Event Registration'}</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                    Fields marked with <span className="req">*</span> are required.
                  </p>
                </div>
                <button onClick={() => handleFormSelect('none')} className="btn btn-secondary btn-sm">
                  Change Option
                </button>
              </div>

              {isSuccess ? (
                <div className="success-state">
                  <div className="success-icon-wrapper">
                    <Check size={48} />
                  </div>
                  <h3>Application Submitted!</h3>
                  <p>
                    Your request has been saved. An email confirmation has been sent to your university address.
                  </p>
                  <button onClick={() => handleFormSelect('none')} className="btn btn-secondary btn-sm">
                    Back to Options
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="apply-detailed-form">
                  {/* Academic & Contact Section */}
                  <div className="form-section-title">Academic & Contact Info</div>
                  
                  <div className="form-group">
                    <label htmlFor="fullName">Full Name <span className="req">*</span></label>
                    <div className="input-with-icon">
                      <User size={16} />
                      <input
                        type="text"
                        id="fullName"
                        required
                        placeholder="e.g. John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="pinNumber">PIN Number <span className="req">*</span></label>
                    <div className="input-with-icon">
                      <GraduationCap size={16} />
                      <input
                        type="text"
                        id="pinNumber"
                        required
                        placeholder="e.g. 2100030140"
                        value={pinNumber}
                        onChange={(e) => setPinNumber(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email Address <span className="req">*</span></label>
                    <div className="input-with-icon">
                      <Mail size={16} />
                      <input
                        type="email"
                        id="email"
                        required
                        placeholder="user@university.edu"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="mobile">Mobile Number <span className="req">*</span></label>
                    <div className="input-with-icon">
                      <Phone size={16} />
                      <input
                        type="tel"
                        id="mobile"
                        required
                        placeholder="e.g. +91 98765 43210"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="branch">Branch / Department <span className="req">*</span></label>
                    <CustomSelect
                      id="branch"
                      required
                      value={branch}
                      onChange={setBranch}
                      options={branchesList}
                      placeholder="Select Branch / Department"
                      icon={<GraduationCap size={16} />}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="yearOfStudy">Year of Study <span className="req">*</span></label>
                    <CustomSelect
                      id="yearOfStudy"
                      required
                      value={yearOfStudy}
                      onChange={setYearOfStudy}
                      options={['1st Year', '2nd Year', '3rd Year', '4th Year']}
                      placeholder="Select Year"
                      icon={<Calendar size={16} />}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="section">Section <span className="opt">(Optional)</span></label>
                    <input
                      type="text"
                      id="section"
                      placeholder="e.g. Sec A"
                      value={section}
                      onChange={(e) => setSection(e.target.value)}
                    />
                  </div>

                  {/* Event Details */}
                  {formType === 'event' && (
                    <>
                      <div className="form-section-title" style={{ marginTop: '1.5rem' }}>Event Registration</div>
                      <div className="form-group">
                        <label htmlFor="eventName">Select Event / Workshop <span className="req">*</span></label>
                        <select
                          id="eventName"
                          required
                          value={eventName}
                          onChange={(e) => setEventName(e.target.value)}
                          disabled={isLoadingEvents}
                        >
                          {isLoadingEvents ? (
                            <option value="">Loading technical events...</option>
                          ) : eventsList.length === 0 ? (
                            <option value="">No events scheduled</option>
                          ) : (
                            eventsList.map((evt, idx) => (
                              <option key={idx} value={evt}>{evt}</option>
                            ))
                          )}
                        </select>
                      </div>

                      <div className="form-group">
                        <label htmlFor="notes">Additional Notes <span className="opt">(Optional)</span></label>
                        <textarea
                          id="notes"
                          rows={4}
                          placeholder="Detail any hardware prerequisites, code experience, or requirements..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  {/* Club Membership Details */}
                  {formType === 'join-club' && (
                    <>
                      <div className="form-section-title" style={{ marginTop: '1.5rem' }}>Membership Context</div>
                      
                      <div className="form-group">
                        <label htmlFor="interests">Areas of Interest <span className="req">*</span></label>
                        <input
                          type="text"
                          id="interests"
                          required
                          placeholder="e.g. ML, Cryptography, UAVs"
                          value={interests}
                          onChange={(e) => setInterests(e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="skills">Skills <span className="req">*</span></label>
                        <input
                          type="text"
                          id="skills"
                          required
                          placeholder="e.g. C++, PyTorch, Python"
                          value={skills}
                          onChange={(e) => setSkills(e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="reasonToJoin">Why do you want to join the R&D Club? <span className="req">*</span></label>
                        <textarea
                          id="reasonToJoin"
                          required
                          rows={5}
                          placeholder="Summarize your motivation and what projects you'd like to work on..."
                          value={reasonToJoin}
                          onChange={(e) => setReasonToJoin(e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  <button type="submit" disabled={isSubmitting} className="btn btn-primary form-submit-btn" style={{ marginTop: '1rem' }}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="spinner-icon" size={16} /> Submitting...
                      </>
                    ) : (
                      'Submit Application'
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
