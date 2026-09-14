import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { ArrowLeft, User, Mail, Phone, GraduationCap, Calendar, Sparkles, Check, Loader2, Code, Users, Server, ChevronDown, Plus, Trash2, AlertTriangle, Award, Briefcase, Building2 } from 'lucide-react';

type FormType = 'none' | 'join-club' | 'event' | 'hackathon' | 'recognition';

interface CustomSelectProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
  icon: React.ReactNode;
  required?: boolean;
  disabled?: boolean;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  id,
  value,
  onChange,
  options,
  placeholder,
  icon,
  required = false,
  disabled = false
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
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
      >
        {icon}
        <div 
          className="custom-select-trigger"
          style={{
            padding: '0.75rem 2.75rem 0.75rem 2.75rem',
            borderRadius: 'var(--radius-md)',
            border: isOpen && !disabled ? '1px solid var(--primary)' : '1px solid var(--border)',
            backgroundColor: disabled ? '#f1f5f9' : 'var(--bg-main)',
            color: value ? 'var(--text-main)' : 'var(--text-muted)',
            fontSize: '0.9375rem',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: isOpen && !disabled ? '0 0 0 3px var(--primary-glow)' : 'none',
            transition: 'var(--transition-fast)',
            minHeight: '45px',
            userSelect: 'none',
            opacity: disabled ? 0.7 : 1
          }}
        >
          <span>{value || placeholder}</span>
          <ChevronDown 
            size={16} 
            style={{ 
              color: isOpen && !disabled ? 'var(--primary)' : 'var(--text-muted)', 
              transform: isOpen && !disabled ? 'rotate(180deg)' : 'rotate(0deg)',
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

const getFormTypeFromParam = (param?: string): FormType => {
  if (!param) return 'none';
  const clean = param.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (clean.includes('recognition') || clean.includes('judge') || clean.includes('evaluator')) return 'recognition';
  if (clean.includes('hackathon')) return 'hackathon';
  if (clean.includes('club') || clean.includes('membership') || clean.includes('join')) return 'join-club';
  if (clean.includes('event')) return 'event';
  return 'none';
};

export const ApplyPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { registrationType } = useParams<{ registrationType?: string }>();
  const navigate = useNavigate();

  const [formType, setFormType] = useState<FormType>(() => {
    const routeType = getFormTypeFromParam(registrationType);
    if (routeType !== 'none') return routeType;
    const queryType = getFormTypeFromParam(searchParams.get('type') || '');
    if (queryType !== 'none') return queryType;
    if (searchParams.get('event')) return 'event';
    return 'none';
  });
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

  // Recognition / Judge specific fields state
  const [judgeDesignation, setJudgeDesignation] = useState('');
  const [judgeOrganization, setJudgeOrganization] = useState('');
  const [judgeEventName, setJudgeEventName] = useState('');
  const [judgeEventDate, setJudgeEventDate] = useState('');
  const [judgeDomain, setJudgeDomain] = useState('');
  const [judgeExperience, setJudgeExperience] = useState('');
  const [judgeNotes, setJudgeNotes] = useState('');
  const [recognitionConfirmed, setRecognitionConfirmed] = useState(false);

  // Hackathon specific fields state
  const [teamName, setTeamName] = useState('');
  const [selectedHackathonName, setSelectedHackathonName] = useState('');
  const [hackathonsList, setHackathonsList] = useState<string[]>([]);
  const [hackathonConfirmed, setHackathonConfirmed] = useState(false);

  // Team Leader Details (reuses fullName, email, mobile for Name, Email, Phone)
  const [leaderRole, setLeaderRole] = useState<'Student' | 'Professional' | 'Other'>('Student');
  const [leaderYear, setLeaderYear] = useState('');
  const [leaderBranch, setLeaderBranch] = useState('');
  const [leaderInstitution, setLeaderInstitution] = useState('');
  const [leaderCompany, setLeaderCompany] = useState('');
  const [leaderJobTitle, setLeaderJobTitle] = useState('');

  interface Member {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    role: 'Student' | 'Professional' | 'Other';
    year: string;
    branch: string;
    institution: string;
    company: string;
    jobTitle: string;
  }

  const [members, setMembers] = useState<Member[]>([]);

  const [eventsList, setEventsList] = useState<string[]>([]);
  const [allEventsList, setAllEventsList] = useState<string[]>([]);
  const [eventDateMap, setEventDateMap] = useState<{ [key: string]: string }>({});
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [branchesList, setBranchesList] = useState<string[]>([]);

  const handleBackToHome = () => {
    navigate('/');
  };

  useEffect(() => {
    const typeFromRoute = getFormTypeFromParam(registrationType);
    if (typeFromRoute !== 'none') {
      setFormType(typeFromRoute);
      setIsSuccess(false);
    } else {
      const typeFromQuery = getFormTypeFromParam(searchParams.get('type') || '');
      if (typeFromQuery !== 'none') {
        setFormType(typeFromQuery);
        setIsSuccess(false);
      } else if (searchParams.get('event')) {
        setFormType('event');
        setIsSuccess(false);
      } else {
        setFormType('none');
      }
    }
  }, [registrationType, searchParams]);

  useEffect(() => {
    if (formType === 'hackathon') {
      document.title = 'Hackathon Registration | R&D Club';
    } else if (formType === 'join-club') {
      document.title = 'Club Membership Application | R&D Club';
    } else if (formType === 'event') {
      document.title = 'Event Registration | R&D Club';
    } else if (formType === 'recognition') {
      document.title = 'Judge Recognition Registration | R&D Club';
    } else {
      document.title = 'Application Portal | R&D Club';
    }
  }, [formType]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/events`);
        if (response.ok) {
          const data = await response.json();
          const titles = data
            .filter((evt: any) => evt.category !== 'Hackathon')
            .map((evt: any) => evt.title);
          setEventsList(titles);
          
          const hackathons = data
            .filter((evt: any) => evt.category === 'Hackathon')
            .map((evt: any) => evt.title);
          setHackathonsList(hackathons);

          const allList = data.map((evt: any) => evt.title);
          setAllEventsList(allList);

          const dates: { [key: string]: string } = {};
          data.forEach((evt: any) => {
            dates[evt.title] = evt.date;
          });
          setEventDateMap(dates);
          
          if (hackathons.length > 0) {
            const hackathonParam = searchParams.get('hackathon');
            if (hackathonParam && hackathons.includes(hackathonParam)) {
              setSelectedHackathonName(hackathonParam);
            } else {
              setSelectedHackathonName(hackathons[0]);
            }
          }

          // Pre-select the query parameter event if present
          const eventParam = searchParams.get('event');
          if (eventParam && titles.includes(eventParam)) {
            setEventName(eventParam);
          } else if (titles.length > 0) {
            setEventName(titles[0]);
          }

          // Initialize judgeEventName
          if (allList.length > 0) {
            const initialJudgeEvt = eventParam && allList.includes(eventParam) ? eventParam : allList[0];
            setJudgeEventName(initialJudgeEvt);
            setJudgeEventDate(dates[initialJudgeEvt] || '');
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

  const resetFormFields = () => {
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
    
    // Recognition reset
    setJudgeDesignation('');
    setJudgeOrganization('');
    if (allEventsList.length > 0) {
      setJudgeEventName(allEventsList[0]);
      setJudgeEventDate(eventDateMap[allEventsList[0]] || '');
    } else {
      setJudgeEventName('');
      setJudgeEventDate('');
    }
    setJudgeDomain('');
    setJudgeExperience('');
    setJudgeNotes('');
    setRecognitionConfirmed(false);

    // Hackathon reset
    setTeamName('');
    setSelectedHackathonName(hackathonsList.length > 0 ? hackathonsList[0] : '');
    setLeaderRole('Student');
    setLeaderYear('');
    setLeaderBranch('');
    setLeaderInstitution('');
    setLeaderCompany('');
    setLeaderJobTitle('');
    setMembers([]);
    setHackathonConfirmed(false);
  };

  const handleFormSelect = (type: FormType) => {
    setIsSuccess(false);
    resetFormFields();
    if (type === 'hackathon') {
      navigate('/apply/HackathonRegistration');
    } else if (type === 'join-club') {
      navigate('/apply/ClubRegistration');
    } else if (type === 'event') {
      navigate('/apply/EventRegistration');
    } else if (type === 'recognition') {
      navigate('/apply/RecognitionRegistration');
    } else {
      navigate('/apply');
    }
  };

  const handleAddMember = () => {
    const newMember: Member = {
      id: Math.random().toString(36).substring(2, 9),
      fullName: '',
      email: '',
      phone: '',
      role: 'Student',
      year: '1st Year',
      branch: branchesList.length > 0 ? branchesList[0] : '',
      institution: '',
      company: '',
      jobTitle: ''
    };
    setMembers([...members, newMember]);
  };

  const handleRemoveMember = (id: string) => {
    setMembers(members.filter(m => m.id !== id));
  };

  const handleMemberChange = (id: string, field: keyof Member, value: any) => {
    setMembers(members.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // JS-based manual form verification to prevent hidden inputs focus block issues
    if (formType === 'join-club') {
      if (!fullName.trim() || !pinNumber.trim() || !email.trim() || !mobile.trim() || !branch || !yearOfStudy || !interests.trim() || !skills.trim() || !reasonToJoin.trim()) {
        alert("Please fill in all required fields.");
        return;
      }
      if (!emailRegex.test(email.trim())) {
        alert("Please enter a valid Email Address.");
        return;
      }
    } else if (formType === 'event') {
      if (!fullName.trim() || !pinNumber.trim() || !email.trim() || !mobile.trim() || !branch || !yearOfStudy || !eventName) {
        alert("Please fill in all required fields.");
        return;
      }
      if (!emailRegex.test(email.trim())) {
        alert("Please enter a valid Email Address.");
        return;
      }
    } else if (formType === 'recognition') {
      if (!fullName.trim() || !email.trim() || !mobile.trim() || !judgeDesignation.trim() || !judgeOrganization.trim() || !judgeEventName.trim()) {
        alert("Please fill in all required fields (Full Name, Email, Mobile, Designation, Organization, and Event).");
        return;
      }
      if (!emailRegex.test(email.trim())) {
        alert("Please enter a valid Email Address.");
        return;
      }
      if (!recognitionConfirmed) {
        alert("Please confirm the verification checkbox at the bottom before submitting.");
        return;
      }
    } else if (formType === 'hackathon') {
      if (!selectedHackathonName) {
        alert("Please select a Hackathon event.");
        return;
      }
      if (!teamName.trim()) {
        alert("Please enter a Team Name.");
        return;
      }
      if (!fullName.trim()) {
        alert("Please enter the Team Leader's Full Name.");
        return;
      }
      if (!email.trim()) {
        alert("Please enter the Team Leader's Email Address.");
        return;
      }
      if (!emailRegex.test(email.trim())) {
        alert("Please enter a valid Email Address for the Team Leader.");
        return;
      }
      if (!mobile.trim()) {
        alert("Please enter the Team Leader's Phone Number.");
        return;
      }
      if (!leaderRole) {
        alert("Please select the Team Leader's Designation / Role.");
        return;
      }
      if (leaderRole === 'Student') {
        if (!leaderYear) {
          alert("Please select the Team Leader's Year of Study.");
          return;
        }
        if (!leaderBranch) {
          alert("Please select the Team Leader's Branch / Department.");
          return;
        }
        if (!leaderInstitution.trim()) {
          alert("Please enter the Team Leader's College / University / School Name.");
          return;
        }
      } else {
        if (!leaderCompany.trim()) {
          alert("Please enter the Team Leader's Company / Organization.");
          return;
        }
        if (!leaderJobTitle.trim()) {
          alert("Please enter the Team Leader's Job Title / Designation.");
          return;
        }
      }

      // Verify each team member
      for (let i = 0; i < members.length; i++) {
        const num = i + 2;
        const m = members[i];
        if (!m.fullName.trim()) {
          alert(`Please enter Member ${num}'s Full Name.`);
          return;
        }
        if (!m.email.trim()) {
          alert(`Please enter Member ${num}'s Email Address.`);
          return;
        }
        if (!emailRegex.test(m.email.trim())) {
          alert(`Please enter a valid Email Address for Member ${num}.`);
          return;
        }
        if (!m.phone.trim()) {
          alert(`Please enter Member ${num}'s Phone Number.`);
          return;
        }
        if (!m.role) {
          alert(`Please select Member ${num}'s Designation / Role.`);
          return;
        }
        if (m.role === 'Student') {
          if (!m.year) {
            alert(`Please select Member ${num}'s Year of Study.`);
            return;
          }
          if (!m.branch) {
            alert(`Please select Member ${num}'s Branch / Department.`);
            return;
          }
          if (!m.institution?.trim()) {
            alert(`Please enter Member ${num}'s College / University / School Name.`);
            return;
          }
        } else {
          if (!m.company?.trim()) {
            alert(`Please enter Member ${num}'s Company / Organization.`);
            return;
          }
          if (!m.jobTitle?.trim()) {
            alert(`Please enter Member ${num}'s Job Title / Designation.`);
            return;
          }
        }
      }

      if (!hackathonConfirmed) {
        alert("Please confirm the details check box at the bottom before submitting.");
        return;
      }
    }

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
    } : formType === 'event' ? {
      fullName,
      pinNumber,
      email,
      mobile,
      branch,
      yearOfStudy,
      section,
      eventName,
      notes
    } : formType === 'recognition' ? {
      fullName,
      email,
      mobile,
      designation: judgeDesignation,
      organization: judgeOrganization,
      eventName: judgeEventName,
      eventDate: judgeEventDate || eventDateMap[judgeEventName] || '',
      domainExpertise: judgeDomain,
      experienceYears: judgeExperience,
      notes: judgeNotes
    } : {
      hackathonName: selectedHackathonName,
      teamName,
      leaderName: fullName,
      leaderEmail: email,
      leaderPhone: mobile,
      leaderRole,
      leaderYear: leaderRole === 'Student' ? leaderYear : null,
      leaderBranch: leaderRole === 'Student' ? leaderBranch : null,
      leaderInstitution: leaderRole === 'Student' ? leaderInstitution : null,
      leaderCompany: leaderRole !== 'Student' ? leaderCompany : null,
      leaderJobTitle: leaderRole !== 'Student' ? leaderJobTitle : null,
      members
    };

    const endpoint = formType === 'join-club' ? 'club' : formType === 'event' ? 'event' : formType === 'recognition' ? 'recognition' : 'hackathon';

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

          <div className="apply-options-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
            <div className="apply-option-card card hover-lift" onClick={() => handleFormSelect('join-club')}>
              <div className="apply-icon-wrapper club-icon">
                <Sparkles size={28} />
              </div>
              <h3>Join the R&D Club</h3>
              <p>
                Apply for official membership.
              </p>
              <button className="btn btn-primary btn-sm">Start Application</button>
            </div>

            <div className="apply-option-card card hover-lift" onClick={() => handleFormSelect('event')}>
              <div className="apply-icon-wrapper event-icon">
                <Calendar size={28} />
              </div>
              <h3>Apply for an Event</h3>
              <p>
                Register for workshops, bootcamps, and technical events.
              </p>
              <button className="btn btn-primary btn-sm">Register for Event</button>
            </div>

            <div className="apply-option-card card hover-lift" onClick={() => handleFormSelect('hackathon')}>
              <div className="apply-icon-wrapper hackathon-icon">
                <Code size={28} />
              </div>
              <h3>Apply for a Hackathon</h3>
              <p>
                Register your team and submit your hackathon project.
              </p>
              <button className="btn btn-primary btn-sm">Register for Hackathon</button>
            </div>

            <div className="apply-option-card card hover-lift" onClick={() => handleFormSelect('recognition')}>
              <div className="apply-icon-wrapper recognition-icon">
                <Award size={28} />
              </div>
              <h3>Judge Recognition</h3>
              <p>
                Register as an official Judge, Evaluator, or Guest Dignitary.
              </p>
              <button className="btn btn-primary btn-sm">Register for Recognition</button>
            </div>
          </div>
        </div>
      ) : (
        /* 2. Form screen: Two-column split layout WITH branding panel */
        <div className="apply-split-layout">
          
          {/* Left Column: Branding panel */}
          <div className="apply-info-panel">
            <span className="badge">
              {formType === 'recognition' ? 'Honoring Excellence' : 'Join the Pioneers'}
            </span>
            <h1 className="apply-panel-title">
              {formType === 'recognition' ? 'Distinguished Judges & Evaluators' : 'Shape the Future With R&D Club'}
            </h1>
            <p className="apply-panel-desc">
              {formType === 'recognition'
                ? 'We express our deepest gratitude to industry leaders, eminent academicians, and technical experts whose fair evaluations guide and inspire our student innovators.'
                : 'Collaborate on bleeding-edge projects, build production-grade features, and accelerate your engineering skills. We bridge the gap between academic theory and industry reality.'}
            </p>

            <div className="apply-features-list">
              <div className="apply-feature-item">
                <div className="feature-icon-box">
                  {formType === 'recognition' ? <Award size={18} /> : <Code size={18} />}
                </div>
                <div className="feature-item-text">
                  <h4>{formType === 'recognition' ? 'Institutional Recognition' : 'Real-World Experience'}</h4>
                  <p>{formType === 'recognition' ? 'Receive an official, tamper-proof Certificate of Recognition verified by institutional leadership.' : 'Work directly on modern software/hardware codebases and write peer-reviewed scientific papers.'}</p>
                </div>
              </div>

              <div className="apply-feature-item">
                <div className="feature-icon-box text-emerald">
                  <Users size={18} />
                </div>
                <div className="feature-item-text">
                  <h4>{formType === 'recognition' ? 'Academic Leadership' : 'Mentorship & Growth'}</h4>
                  <p>{formType === 'recognition' ? 'Guide students through real-world problem statements and identify promising engineering talent.' : 'Get guided by experienced senior researchers and faculty advisors with regular code reviews.'}</p>
                </div>
              </div>

              <div className="apply-feature-item">
                <div className="feature-icon-box text-indigo">
                  {formType === 'recognition' ? <Sparkles size={18} /> : <Server size={18} />}
                </div>
                <div className="feature-item-text">
                  <h4>{formType === 'recognition' ? 'Verifiable Credential' : 'HPC Compute & Resources'}</h4>
                  <p>{formType === 'recognition' ? 'Indexed with a permanent verification ID accessible to academic institutions and organizations globally.' : 'Get priority access to high-performance A100/H100 clusters and electronics testing labs.'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Detailed form */}
          <div className="apply-form-panel">
            <div className="form-container-card card">
              <div className="form-header-row">
                <div>
                  <h2>{formType === 'join-club' ? 'Membership Application' : formType === 'event' ? 'Event Registration' : formType === 'recognition' ? 'Judge & Dignitary Recognition' : 'Hackathon Registration'}</h2>
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
                  <h3>{formType === 'recognition' ? 'Recognition Details Recorded!' : 'Application Submitted!'}</h3>
                  <p>
                    {formType === 'recognition'
                      ? 'Thank you for your valuable contribution. Your information has been saved. Your official Certificate of Recognition will be issued by the administration.'
                      : 'Your request has been saved. An email confirmation has been sent to your university address.'}
                  </p>
                  <button onClick={() => handleFormSelect('none')} className="btn btn-secondary btn-sm">
                    Back to Options
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="apply-detailed-form">
                  {/* Academic & Contact Section */}
                  {(formType === 'join-club' || formType === 'event') && (
                    <>
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
                    </>
                  )}

                  {/* Event Details */}
                  {formType === 'event' && (
                    <>
                      <div className="form-section-title" style={{ marginTop: '1.5rem' }}>Event Registration</div>
                      <div className="form-group">
                        <label htmlFor="eventName">Select Event / Workshop <span className="req">*</span></label>
                        <CustomSelect
                          id="eventName"
                          required
                          value={eventName}
                          onChange={setEventName}
                          options={eventsList}
                          placeholder={
                            isLoadingEvents 
                              ? "Loading technical events..." 
                              : eventsList.length === 0 
                                ? "No events scheduled" 
                                : "Select Event / Workshop"
                          }
                          icon={<Sparkles size={16} />}
                          disabled={isLoadingEvents || eventsList.length === 0}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="notes">Additional Notes <span className="opt">(Optional)</span></label>
                        <textarea
                          id="notes"
                          rows={4}
                          placeholder="Detail any hardware prerequisites, code experience, or requirements..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value.slice(0, 500))}
                          maxLength={500}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', fontSize: '0.75rem' }}>
                          {notes.length === 500 ? (
                            <span style={{ color: '#dc2626', fontWeight: 500 }}>Maximum limit of 500 characters reached</span>
                          ) : (
                            <span />
                          )}
                          <span style={{ color: notes.length === 500 ? '#dc2626' : 'var(--text-secondary)' }}>
                            {notes.length} / 500
                          </span>
                        </div>
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
                          onChange={(e) => setReasonToJoin(e.target.value.slice(0, 500))}
                          maxLength={500}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', fontSize: '0.75rem' }}>
                          {reasonToJoin.length === 500 ? (
                            <span style={{ color: '#dc2626', fontWeight: 500 }}>Maximum limit of 500 characters reached</span>
                          ) : (
                            <span />
                          )}
                          <span style={{ color: reasonToJoin.length === 500 ? '#dc2626' : 'var(--text-secondary)' }}>
                            {reasonToJoin.length} / 500
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Recognition / Judge Details */}
                  {formType === 'recognition' && (
                    <>
                      <div className="form-section-title">Judge / Dignitary Profile</div>

                      <div className="form-group">
                        <label htmlFor="fullName">Full Name <span className="req">*</span></label>
                        <div className="input-with-icon">
                          <User size={16} />
                          <input
                            type="text"
                            id="fullName"
                            required
                            placeholder="e.g. Dr. Alan Turing / Prof. Clara Vance"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
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
                            placeholder="e.g. judge@institution.edu or expert@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label htmlFor="mobile">Mobile / Contact Number <span className="req">*</span></label>
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
                        <label htmlFor="judgeDesignation">Job Title / Designation <span className="req">*</span></label>
                        <div className="input-with-icon">
                          <Briefcase size={16} />
                          <input
                            type="text"
                            id="judgeDesignation"
                            required
                            placeholder="e.g. Associate Professor / Lead Architect / Senior Judge"
                            value={judgeDesignation}
                            onChange={(e) => setJudgeDesignation(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label htmlFor="judgeOrganization">Organization / Institution / Company <span className="req">*</span></label>
                        <div className="input-with-icon">
                          <Building2 size={16} />
                          <input
                            type="text"
                            id="judgeOrganization"
                            required
                            placeholder="e.g. Trinity College of Engineering / Google / NIT Warangal"
                            value={judgeOrganization}
                            onChange={(e) => setJudgeOrganization(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="form-section-title" style={{ marginTop: '1.5rem' }}>Evaluation & Event Context</div>

                      <div className="form-group">
                        <label htmlFor="judgeEventName">Event / Hackathon Served As Judge <span className="req">*</span></label>
                        <CustomSelect
                          id="judgeEventName"
                          value={judgeEventName}
                          onChange={(val) => {
                            setJudgeEventName(val);
                            if (eventDateMap[val]) {
                              setJudgeEventDate(eventDateMap[val]);
                            }
                          }}
                          options={allEventsList.length > 0 ? allEventsList : ["Smart India Hackathon 2026", "R&D AlphaQuest Hackathon"]}
                          placeholder="Select Event"
                          icon={<Sparkles size={16} />}
                          disabled={isLoadingEvents}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="judgeEventDate">Event Date <span className="req">*</span></label>
                        <div className="input-with-icon">
                          <Calendar size={16} />
                          <input
                            type="text"
                            id="judgeEventDate"
                            required
                            placeholder="e.g. September 14, 2026"
                            value={judgeEventDate}
                            onChange={(e) => setJudgeEventDate(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label htmlFor="judgeDomain">Area of Domain / Specialization <span className="opt">(Optional)</span></label>
                        <input
                          type="text"
                          id="judgeDomain"
                          placeholder="e.g. AI/ML, Cloud Architecture, Robotics, Embedded Systems"
                          value={judgeDomain}
                          onChange={(e) => setJudgeDomain(e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="judgeExperience">Experience (Years in Industry / Academia) <span className="opt">(Optional)</span></label>
                        <input
                          type="text"
                          id="judgeExperience"
                          placeholder="e.g. 10+ Years / 15 Years in Research"
                          value={judgeExperience}
                          onChange={(e) => setJudgeExperience(e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="judgeNotes">Citation / Evaluation Remarks / Bio <span className="opt">(Optional)</span></label>
                        <textarea
                          id="judgeNotes"
                          rows={4}
                          placeholder="Brief biography or key highlights from your evaluation session..."
                          value={judgeNotes}
                          onChange={(e) => setJudgeNotes(e.target.value.slice(0, 500))}
                          maxLength={500}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', fontSize: '0.75rem' }}>
                          <span />
                          <span style={{ color: judgeNotes.length === 500 ? '#dc2626' : 'var(--text-secondary)' }}>
                            {judgeNotes.length} / 500
                          </span>
                        </div>
                      </div>

                      <div className="form-group" style={{ 
                        marginTop: '1.5rem', 
                        padding: '1.25rem', 
                        backgroundColor: 'rgba(217, 119, 6, 0.05)', 
                        border: '1px solid rgba(217, 119, 6, 0.2)', 
                        borderRadius: '8px' 
                      }}>
                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer', userSelect: 'none' }}>
                          <input
                            type="checkbox"
                            required
                            checked={recognitionConfirmed}
                            onChange={(e) => setRecognitionConfirmed(e.target.checked)}
                            style={{ marginTop: '0.25rem', width: '16px', height: '16px', cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                            I confirm that the above information is accurate and reflects my contribution as an official Judge / Evaluator for Trinity College of Engineering & Technology. I understand that my Certificate of Recognition will be issued based on these details.
                          </span>
                        </label>
                      </div>
                    </>
                  )}

                  {formType === 'hackathon' && (
                    <>
                      <div className="alert-notice-box" style={{ 
                        backgroundColor: '#fffbeb', 
                        border: '1px solid #fef3c7', 
                        borderRadius: '8px', 
                        padding: '1.25rem', 
                        marginBottom: '2rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: '#b45309', fontSize: '0.9375rem' }}>
                          <AlertTriangle size={18} />
                          <span>Important Notice:</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.875rem', color: '#b45309', lineHeight: 1.6 }}>
                          Please enter all details carefully and accurately. The information provided in this form will be used to generate and issue hackathon certificates. If any information is incorrect, incomplete, or misspelled, the organizers will not be responsible for errors appearing on the issued certificate.
                        </p>
                      </div>

                      <div className="form-section-title" style={{ marginTop: '1.5rem' }}>Select Hackathon</div>
                      <div className="form-group">
                        <label htmlFor="selectedHackathonName">Select Hackathon <span className="req">*</span></label>
                        <CustomSelect
                          id="selectedHackathonName"
                          required
                          value={selectedHackathonName}
                          onChange={setSelectedHackathonName}
                          options={hackathonsList}
                          placeholder={
                            isLoadingEvents 
                              ? "Loading hackathons..." 
                              : hackathonsList.length === 0 
                                ? "No hackathons scheduled" 
                                : "Select Hackathon"
                          }
                          icon={<Sparkles size={16} />}
                        />
                      </div>

                      {/* Team & Project Info */}
                      <div className="form-section-title">Team Info</div>
                      
                      <div className="form-group">
                        <label htmlFor="teamName">Team Name <span className="req">*</span></label>
                        <div className="input-with-icon">
                          <Users size={16} />
                          <input
                            type="text"
                            id="teamName"
                            required
                            placeholder="e.g. Code Pioneers"
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Team Leader Details */}
                      <div className="form-section-title" style={{ marginTop: '1.5rem' }}>Team Leader Details</div>
                      
                      <div className="form-group">
                        <label htmlFor="leaderName">Full Name <span className="req">*</span></label>
                        <div className="input-with-icon">
                          <User size={16} />
                          <input
                            type="text"
                            id="leaderName"
                            required
                            placeholder="e.g. John Doe"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="form-grid-2">
                        <div className="form-group">
                          <label htmlFor="leaderEmail">Email Address <span className="req">*</span></label>
                          <div className="input-with-icon">
                            <Mail size={16} />
                            <input
                              type="email"
                              id="leaderEmail"
                              required
                              placeholder="leader@domain.com"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label htmlFor="leaderPhone">Phone Number <span className="req">*</span></label>
                          <div className="input-with-icon">
                            <Phone size={16} />
                            <input
                              type="tel"
                              id="leaderPhone"
                              required
                              placeholder="e.g. +91 98765 43210"
                              value={mobile}
                              onChange={(e) => setMobile(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="form-group">
                        <label htmlFor="leaderRole">Designation / Role <span className="req">*</span></label>
                        <CustomSelect
                          id="leaderRole"
                          required
                          value={leaderRole}
                          onChange={(val) => setLeaderRole(val as any)}
                          options={['Student', 'Professional', 'Other']}
                          placeholder="Select Role"
                          icon={<User size={16} />}
                        />
                      </div>

                      {leaderRole === 'Student' ? (
                        <div className="academic-fields animate-fade-in">
                          <div className="form-grid-2">
                            <div className="form-group">
                              <label htmlFor="leaderYear">Year of Study <span className="req">*</span></label>
                              <CustomSelect
                                id="leaderYear"
                                required
                                value={leaderYear}
                                onChange={setLeaderYear}
                                options={['1st Year', '2nd Year', '3rd Year', '4th Year']}
                                placeholder="Select Year"
                                icon={<Calendar size={16} />}
                              />
                            </div>

                            <div className="form-group">
                              <label htmlFor="leaderBranch">Branch / Department <span className="req">*</span></label>
                              <CustomSelect
                                id="leaderBranch"
                                required
                                value={leaderBranch}
                                onChange={setLeaderBranch}
                                options={branchesList}
                                placeholder="Select Branch"
                                icon={<GraduationCap size={16} />}
                              />
                            </div>
                          </div>

                          <div className="form-group">
                            <label htmlFor="leaderInstitution">College / University / School Name <span className="req">*</span></label>
                            <div className="input-with-icon">
                              <GraduationCap size={16} />
                              <input
                                type="text"
                                id="leaderInstitution"
                                required
                                placeholder="e.g. Trinity College"
                                value={leaderInstitution}
                                onChange={(e) => setLeaderInstitution(e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="professional-fields animate-fade-in">
                          <div className="form-grid-2">
                            <div className="form-group">
                              <label htmlFor="leaderCompany">Company / Organization <span className="req">*</span></label>
                              <div className="input-with-icon">
                                <Server size={16} />
                                <input
                                  type="text"
                                  id="leaderCompany"
                                  required
                                  placeholder="e.g. Google"
                                  value={leaderCompany}
                                  onChange={(e) => setLeaderCompany(e.target.value)}
                                />
                              </div>
                            </div>

                            <div className="form-group">
                              <label htmlFor="leaderJobTitle">Job Title / Designation <span className="req">*</span></label>
                              <div className="input-with-icon">
                                <User size={16} />
                                <input
                                  type="text"
                                  id="leaderJobTitle"
                                  required
                                  placeholder="e.g. Software Engineer"
                                  value={leaderJobTitle}
                                  onChange={(e) => setLeaderJobTitle(e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Team Members Section */}
                      <div className="form-section-title" style={{ marginTop: '2rem' }}>Team Members</div>

                      {/* Additional Dynamic Members */}
                      {members.map((member, index) => (
                        <div key={member.id} className="member-form-card animate-fade-in">
                          <div className="member-card-header">
                            <span className="member-card-title">
                              <User size={16} /> Member {index + 2} Details
                            </span>
                            <button
                              type="button"
                              className="remove-member-btn"
                              onClick={() => handleRemoveMember(member.id)}
                            >
                              <Trash2 size={12} /> Remove
                            </button>
                          </div>

                          <div className="form-group">
                            <label>Full Name <span className="req">*</span></label>
                            <div className="input-with-icon">
                              <User size={16} />
                              <input
                                type="text"
                                required
                                placeholder="e.g. Jane Doe"
                                value={member.fullName}
                                onChange={(e) => handleMemberChange(member.id, 'fullName', e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="form-grid-2">
                            <div className="form-group">
                              <label>Email Address <span className="req">*</span></label>
                              <div className="input-with-icon">
                                <Mail size={16} />
                                <input
                                  type="email"
                                  required
                                  placeholder="jane@domain.com"
                                  value={member.email}
                                  onChange={(e) => handleMemberChange(member.id, 'email', e.target.value)}
                                />
                              </div>
                            </div>

                            <div className="form-group">
                              <label>Phone Number <span className="req">*</span></label>
                              <div className="input-with-icon">
                                <Phone size={16} />
                                <input
                                  type="tel"
                                  required
                                  placeholder="e.g. +91 98765 43210"
                                  value={member.phone}
                                  onChange={(e) => handleMemberChange(member.id, 'phone', e.target.value)}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="form-group">
                            <label>Designation / Role <span className="req">*</span></label>
                            <CustomSelect
                              id={`role-${member.id}`}
                              required
                              value={member.role}
                              onChange={(val) => handleMemberChange(member.id, 'role', val)}
                              options={['Student', 'Professional', 'Other']}
                              placeholder="Select Role"
                              icon={<User size={16} />}
                            />
                          </div>

                          {member.role === 'Student' ? (
                            <div className="academic-fields animate-fade-in">
                              <div className="form-grid-2">
                                <div className="form-group">
                                  <label>Year of Study <span className="req">*</span></label>
                                  <CustomSelect
                                    id={`year-${member.id}`}
                                    required
                                    value={member.year}
                                    onChange={(val) => handleMemberChange(member.id, 'year', val)}
                                    options={['1st Year', '2nd Year', '3rd Year', '4th Year']}
                                    placeholder="Select Year"
                                    icon={<Calendar size={16} />}
                                  />
                                </div>

                                <div className="form-group">
                                  <label>Branch / Department <span className="req">*</span></label>
                                  <CustomSelect
                                    id={`branch-${member.id}`}
                                    required
                                    value={member.branch}
                                    onChange={(val) => handleMemberChange(member.id, 'branch', val)}
                                    options={branchesList}
                                    placeholder="Select Branch"
                                    icon={<GraduationCap size={16} />}
                                  />
                                </div>
                              </div>

                              <div className="form-group">
                                <label>College / University / School Name <span className="req">*</span></label>
                                <div className="input-with-icon">
                                  <GraduationCap size={16} />
                                  <input
                                    type="text"
                                    required
                                    placeholder="e.g. Trinity College"
                                    value={member.institution}
                                    onChange={(e) => handleMemberChange(member.id, 'institution', e.target.value)}
                                  />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="professional-fields animate-fade-in">
                              <div className="form-grid-2">
                                <div className="form-group">
                                  <label>Company / Organization <span className="req">*</span></label>
                                  <div className="input-with-icon">
                                    <Server size={16} />
                                    <input
                                      type="text"
                                      required
                                      placeholder="e.g. Google"
                                      value={member.company}
                                      onChange={(e) => handleMemberChange(member.id, 'company', e.target.value)}
                                    />
                                  </div>
                                </div>

                                <div className="form-group">
                                  <label>Job Title / Designation <span className="req">*</span></label>
                                  <div className="input-with-icon">
                                    <User size={16} />
                                    <input
                                      type="text"
                                      required
                                      placeholder="e.g. Software Engineer"
                                      value={member.jobTitle}
                                      onChange={(e) => handleMemberChange(member.id, 'jobTitle', e.target.value)}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}

                      <button
                        type="button"
                        className="add-member-btn"
                        onClick={handleAddMember}
                      >
                        <Plus size={16} /> + Add Member
                      </button>

                      <div className="form-group" style={{ 
                        marginTop: '2rem', 
                        padding: '1.25rem', 
                        backgroundColor: 'rgba(79, 70, 229, 0.05)', 
                        border: '1px solid rgba(79, 70, 229, 0.1)', 
                        borderRadius: '8px' 
                      }}>
                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer', userSelect: 'none' }}>
                          <input
                            type="checkbox"
                            required
                            checked={hackathonConfirmed}
                            onChange={(e) => setHackathonConfirmed(e.target.checked)}
                            style={{ marginTop: '0.25rem', width: '16px', height: '16px', cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                            I confirm that all the information provided above is correct, accurate, and genuine. I understand that these details will be used for certificate generation, and I accept responsibility for any incorrect or false information submitted by me.
                          </span>
                        </label>
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
