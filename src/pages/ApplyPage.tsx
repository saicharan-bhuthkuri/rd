import React, { useState } from 'react';
import { ArrowLeft, User, Mail, Phone, GraduationCap, Calendar, Sparkles, Check, Loader2 } from 'lucide-react';

type FormType = 'none' | 'join-club' | 'event';

export const ApplyPage: React.FC = () => {
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
  const [eventName, setEventName] = useState('Deep Learning Bootcamp: PyTorch Fundamentals');
  const [notes, setNotes] = useState('');

  // Club specific fields state
  const [interests, setInterests] = useState('');
  const [skills, setSkills] = useState('');
  const [reasonToJoin, setReasonToJoin] = useState('');

  const eventsList = [
    "Deep Learning Bootcamp: PyTorch Fundamentals",
    "R&D AlphaQuest Hackathon",
    "Zero-Knowledge Proofs in Modern Web Cryptography",
    "Edge AI: Deploying TinyML on Microcontrollers",
    "Quantum Compiler Architectures & Optimization"
  ];

  const handleBackToHome = () => {
    window.location.href = '/';
  };

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
    setEventName(eventsList[0]);
    setNotes('');
    setInterests('');
    setSkills('');
    setReasonToJoin('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1500);
  };

  return (
    <div className="subpage-container container">
      {/* Back button */}
      <button onClick={handleBackToHome} className="back-btn btn btn-secondary btn-sm">
        <ArrowLeft size={16} /> Back to Homepage
      </button>

      {/* Main Section */}
      <section className="subpage-hero" style={{ marginBottom: '2.5rem' }}>
        <span className="badge">Application Portal</span>
        <h1 className="subpage-title">Submit Application Request</h1>
        <p className="subpage-lead">
          Select whether you want to apply to become an official member of the R&D Club or register for one 
          of our upcoming technical workshops and hackathons.
        </p>
      </section>

      {/* Options Selection Cards */}
      {formType === 'none' && (
        <div className="apply-options-grid">
          <div className="apply-option-card card hover-lift" onClick={() => handleFormSelect('join-club')}>
            <div className="apply-icon-wrapper club-icon">
              <Sparkles size={28} />
            </div>
            <h3>Join the R&D Club</h3>
            <p>
              Submit an application to join our student research division. Core members get physical lab 
              clearance, GPU compute allocations, and conference travel grants.
            </p>
            <button className="btn btn-primary btn-sm">Start Application</button>
          </div>

          <div className="apply-option-card card hover-lift" onClick={() => handleFormSelect('event')}>
            <div className="apply-icon-wrapper event-icon">
              <Calendar size={28} />
            </div>
            <h3>Apply for an Event</h3>
            <p>
              Register your seat for upcoming PyTorch bootcamps, quantum computing colloquiums, edge IoT 
              workshops, or hackathons.
            </p>
            <button className="btn btn-primary btn-sm">Register for Event</button>
          </div>
        </div>
      )}

      {/* Form Views */}
      {formType !== 'none' && (
        <div className="form-container-card card">
          <div className="form-header-row">
            <h2>{formType === 'join-club' ? 'Membership Application' : 'Event Registration'}</h2>
            <button onClick={() => handleFormSelect('none')} className="btn btn-secondary btn-sm">
              Change Option
            </button>
          </div>

          {isSuccess ? (
            <div className="success-state">
              <div className="success-icon-wrapper">
                <Check size={48} />
              </div>
              <h3>Request Submitted Successfully!</h3>
              <p>
                Your application request has been queued in our database system. An confirmation email with 
                admissions credentials or seat confirmation has been dispatched.
              </p>
              <button onClick={() => handleFormSelect('none')} className="btn btn-secondary">
                Back to Options
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="apply-detailed-form">
              {/* Common Section: Personal & Academic Info */}
              <div className="form-section-title">Academic & Contact Information</div>
              <div className="form-grid-row">
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
              </div>

              <div className="form-grid-row">
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
              </div>

              <div className="form-grid-row-three">
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
                    placeholder="e.g. Sec A, Sec 4"
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                  />
                </div>
              </div>

              {/* Event Specific Form Section */}
              {formType === 'event' && (
                <>
                  <div className="form-section-title" style={{ marginTop: '2.5rem' }}>Event Details</div>
                  <div className="form-group">
                    <label htmlFor="eventName">Select Event / Workshop <span className="req">*</span></label>
                    <select
                      id="eventName"
                      required
                      value={eventName}
                      onChange={(e) => setEventName(e.target.value)}
                    >
                      {eventsList.map((evt, idx) => (
                        <option key={idx} value={evt}>{evt}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="notes">Additional Notes / Prerequisites <span className="opt">(Optional)</span></label>
                    <textarea
                      id="notes"
                      rows={4}
                      placeholder="Detail any topics you are particularly interested in or relevant background..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </>
              )}

              {/* Club Membership Specific Form Section */}
              {formType === 'join-club' && (
                <>
                  <div className="form-section-title" style={{ marginTop: '2.5rem' }}>Research & Background Details</div>
                  
                  <div className="form-group">
                    <label htmlFor="interests">Areas of Interest <span className="req">*</span></label>
                    <input
                      type="text"
                      id="interests"
                      required
                      placeholder="e.g. Computer Vision, Cryptography, Robotics"
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
                      placeholder="e.g. Python, PyTorch, ROS2, C++"
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
                      placeholder="Please summarize your motivation, code experience, and what you plan to build or research with us..."
                      value={reasonToJoin}
                      onChange={(e) => setReasonToJoin(e.target.value)}
                    />
                  </div>
                </>
              )}

              <button type="submit" disabled={isSubmitting} className="btn btn-primary form-submit-btn" style={{ marginTop: '2rem' }}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="spinner-icon" size={16} /> Submitting Application...
                  </>
                ) : (
                  'Submit Application'
                )}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
