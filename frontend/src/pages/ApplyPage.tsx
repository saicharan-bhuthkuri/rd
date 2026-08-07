import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, GraduationCap, Calendar, Sparkles, Check, Loader2, Code, Users, Server } from 'lucide-react';

type FormType = 'none' | 'join-club' | 'event';

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

  const handleBackToHome = () => {
    window.location.href = '/';
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/events');
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

    fetchEvents();
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
      const response = await fetch(`http://localhost:5000/api/apply/${endpoint}`, {
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
                    <input
                      type="text"
                      id="branch"
                      required
                      placeholder="e.g. CSE, ECE"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="yearOfStudy">Year of Study <span className="req">*</span></label>
                    <select
                      id="yearOfStudy"
                      required
                      value={yearOfStudy}
                      onChange={(e) => setYearOfStudy(e.target.value)}
                    >
                      <option value="">Select Year</option>
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                    </select>
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
