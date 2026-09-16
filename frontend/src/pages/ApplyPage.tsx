import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { getPhoneParts } from '../utils/phone';
import { ArrowLeft, ArrowRight, User, Mail, Phone, GraduationCap, Calendar, Sparkles, Check, CheckCircle2, Loader2, Code, Users, Server, ChevronDown, Plus, Trash2, AlertTriangle, Award, Briefcase, Building2, HeartHandshake, FolderUp, FileText, UploadCloud, ExternalLink, ShieldCheck, Copy, Lock, Hash } from 'lucide-react';

type FormType = 'none' | 'join-club' | 'event' | 'hackathon' | 'recognition' | 'volunteer' | 'submission';

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

export interface CountryRule {
  code: string;
  name: string;
  flag: string;
  pattern: RegExp;
  minDigits: number;
  maxDigits: number;
  example: string;
  formatHint: string;
}

export const COUNTRY_RULES: CountryRule[] = [
  { code: '+91', name: 'India', flag: '🇮🇳', pattern: /^[6-9]\d{9}$/, minDigits: 10, maxDigits: 10, example: '98765 43210', formatHint: '10 digits starting with 6, 7, 8, or 9' },
  { code: '+1', name: 'USA / Canada', flag: '🇺🇸', pattern: /^[2-9]\d{9}$/, minDigits: 10, maxDigits: 10, example: '202 555 0123', formatHint: '10 digits (area code starts with 2-9)' },
  { code: '+44', name: 'UK', flag: '🇬🇧', pattern: /^[7]\d{9}$/, minDigits: 10, maxDigits: 10, example: '7911 123456', formatHint: '10 digits starting with 7' },
  { code: '+971', name: 'UAE', flag: '🇦🇪', pattern: /^[5]\d{8}$/, minDigits: 9, maxDigits: 9, example: '50 123 4567', formatHint: '9 digits starting with 5' },
  { code: '+61', name: 'Australia', flag: '🇦🇺', pattern: /^[4]\d{8}$/, minDigits: 9, maxDigits: 9, example: '412 345 678', formatHint: '9 digits starting with 4' },
  { code: '+65', name: 'Singapore', flag: '🇸🇬', pattern: /^[89]\d{7}$/, minDigits: 8, maxDigits: 8, example: '8123 4567', formatHint: '8 digits starting with 8 or 9' },
  { code: '+966', name: 'Saudi Arabia', flag: '🇸🇦', pattern: /^[5]\d{8}$/, minDigits: 9, maxDigits: 9, example: '50 123 4567', formatHint: '9 digits starting with 5' },
  { code: '+974', name: 'Qatar', flag: '🇶🇦', pattern: /^[3567]\d{7}$/, minDigits: 8, maxDigits: 8, example: '3312 3456', formatHint: '8 digits starting with 3, 5, 6, or 7' },
  { code: '+49', name: 'Germany', flag: '🇩🇪', pattern: /^[1]\d{9,10}$/, minDigits: 10, maxDigits: 11, example: '151 2345678', formatHint: '10-11 digits starting with 1' },
  { code: '+977', name: 'Nepal', flag: '🇳🇵', pattern: /^[9]\d{9}$/, minDigits: 10, maxDigits: 10, example: '9841 234567', formatHint: '10 digits starting with 9' },
  { code: '+880', name: 'Bangladesh', flag: '🇧🇩', pattern: /^[1]\d{9}$/, minDigits: 10, maxDigits: 10, example: '1712 345678', formatHint: '10 digits starting with 1' },
  { code: '+94', name: 'Sri Lanka', flag: '🇱🇰', pattern: /^[7]\d{8}$/, minDigits: 9, maxDigits: 9, example: '71 234 5678', formatHint: '9 digits starting with 7' },
  { code: '+63', name: 'Philippines', flag: '🇵🇭', pattern: /^[9]\d{9}$/, minDigits: 10, maxDigits: 10, example: '917 123 4567', formatHint: '10 digits starting with 9' },
  { code: '+', name: 'Other', flag: '🌐', pattern: /^\d{7,15}$/, minDigits: 7, maxDigits: 15, example: '1234567890', formatHint: '7 to 15 digits' },
];

export const validatePhone = (phone: string, countryCode: string): { isValid: boolean; message: string } => {
  const digits = phone.replace(/\D/g, '');
  const rule = COUNTRY_RULES.find(r => r.code === countryCode) || COUNTRY_RULES[COUNTRY_RULES.length - 1];
  
  if (!digits) {
    return { isValid: false, message: 'Please enter a mobile number' };
  }
  
  if (digits.length < rule.minDigits) {
    return { isValid: false, message: `Please enter at least ${rule.minDigits} digits for ${rule.name}` };
  }
  
  if (digits.length > rule.maxDigits) {
    return { isValid: false, message: `Maximum ${rule.maxDigits} digits allowed for ${rule.name}` };
  }
  
  if (!rule.pattern.test(digits)) {
    return { isValid: false, message: `Invalid mobile number for ${rule.name} (Requires ${rule.formatHint})` };
  }
  
  return { isValid: true, message: `Valid ${rule.name} Mobile Number` };
};

interface VerifiedEmailInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  isVerified?: boolean;
  onVerifiedChange?: (verified: boolean) => void;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
}

export const VerifiedEmailInput: React.FC<VerifiedEmailInputProps> = ({
  id = 'email',
  value,
  onChange,
  isVerified = false,
  onVerifiedChange,
  required = true,
  placeholder = 'user@university.edu',
  disabled = false,
  label = 'Email Address'
}) => {
  const [otpCode, setOtpCode] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackType, setFeedbackType] = useState<'error' | 'success' | 'info' | ''>('');
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

  useEffect(() => {
    if (!isVerified && verifiedEmail) {
      setVerifiedEmail('');
    }
  }, [isVerified]);

  useEffect(() => {
    let timer: any = null;
    if (cooldownSeconds > 0) {
      timer = setInterval(() => {
        setCooldownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [cooldownSeconds]);

  const handleEmailInputChange = (newVal: string) => {
    onChange(newVal);
    // If user changes email after verification, revoke verified state
    if (isVerified || verifiedEmail) {
      if (newVal.trim().toLowerCase() !== verifiedEmail.toLowerCase()) {
        onVerifiedChange?.(false);
        setVerifiedEmail('');
        setShowOtpInput(false);
        setCooldownSeconds(0);
        setFeedbackMessage('Email address changed. Please click Send OTP to verify your new email address.');
        setFeedbackType('info');
      }
    }
  };

  const handleSendVerificationCode = async () => {
    const trimmed = value.trim();
    if (!trimmed) {
      setFeedbackMessage('Please enter an email address before clicking Send OTP.');
      setFeedbackType('error');
      return;
    }

    if (!emailRegex.test(trimmed)) {
      setFeedbackMessage('The email address entered is incorrect. Please enter the correct email address (e.g. name@domain.com).');
      setFeedbackType('error');
      return;
    }

    if (cooldownSeconds > 0) {
      setFeedbackMessage(`Please wait ${cooldownSeconds} seconds before requesting another code.`);
      setFeedbackType('info');
      return;
    }

    setIsSending(true);
    setFeedbackMessage('');
    setFeedbackType('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/send-email-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowOtpInput(true);
        setOtpCode('');
        setCooldownSeconds(30); // 30-second cooldown period
        setFeedbackMessage(data.message || `Verification code sent to ${trimmed} (valid for 15 minutes). Please check your inbox or spam folder.`);
        setFeedbackType('info');
      } else {
        setFeedbackMessage(data.error || 'Failed to send verification code. Please enter the correct email address.');
        setFeedbackType('error');
      }
    } catch (err: any) {
      setFeedbackMessage('Network error sending verification code. Please try again.');
      setFeedbackType('error');
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    const trimmedEmail = value.trim();
    const trimmedCode = otpCode.trim();

    if (!trimmedEmail) {
      setFeedbackMessage('Please enter an email address.');
      setFeedbackType('error');
      return;
    }

    if (trimmedCode.length !== 6) {
      setFeedbackMessage('Please enter the 6-digit verification code.');
      setFeedbackType('error');
      return;
    }

    setIsVerifying(true);
    setFeedbackMessage('');
    setFeedbackType('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/verify-email-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, code: trimmedCode })
      });

      const data = await res.json();
      if (res.ok && data.verified) {
        setVerifiedEmail(trimmedEmail);
        setShowOtpInput(false);
        setFeedbackMessage('Email address verified successfully!');
        setFeedbackType('success');
        onVerifiedChange?.(true);
      } else {
        setFeedbackMessage(data.error || 'Verification failed. Please enter the correct verification code or enter the correct email address.');
        setFeedbackType('error');
        onVerifiedChange?.(false);
      }
    } catch (err: any) {
      setFeedbackMessage('Network error during verification. Please try again.');
      setFeedbackType('error');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={id}>
          {label} {required && <span className="req">*</span>}
        </label>
      )}

      <div className="email-input-action-wrapper">
        <div className="input-with-icon" style={{ width: '100%', position: 'relative' }}>
          <Mail size={16} />
          <input
            type="email"
            id={id}
            required={required}
            disabled={disabled}
            placeholder={placeholder}
            value={value}
            onChange={(e) => handleEmailInputChange(e.target.value)}
            className={`input-validated ${isVerified ? 'is-valid' : feedbackType === 'error' ? 'is-invalid' : ''}`}
            style={{ paddingRight: isVerified ? '6.5rem' : cooldownSeconds > 0 ? '9.5rem' : '7.5rem' }}
          />

          {isVerified ? (
            <div className="email-verified-pill">
              <CheckCircle2 size={14} />
              <span>Verified</span>
            </div>
          ) : (
            <button
              type="button"
              className="email-check-btn"
              onClick={handleSendVerificationCode}
              disabled={disabled || isSending || !value.trim() || cooldownSeconds > 0}
              title={cooldownSeconds > 0 ? `Resend OTP available in ${cooldownSeconds}s` : showOtpInput ? 'Resend OTP' : 'Send OTP to this email'}
            >
              {isSending ? (
                <>
                  <Loader2 size={13} className="spinner-icon" /> Sending...
                </>
              ) : cooldownSeconds > 0 ? (
                `Sent OTP (${cooldownSeconds}s)`
              ) : showOtpInput ? (
                'Resend OTP'
              ) : (
                'Send OTP'
              )}
            </button>
          )}
        </div>
      </div>

      {/* OTP Code Entry Section */}
      {showOtpInput && !isVerified && (
        <div className="email-otp-card">
          <div className="email-otp-header">
            Enter the 6-digit verification code sent to <strong>{value.trim()}</strong> (valid for 15 minutes):
          </div>
          <div className="email-otp-row">
            <input
              type="text"
              maxLength={6}
              inputMode="numeric"
              placeholder="123456"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="email-otp-input"
              autoFocus
            />
            <button
              type="button"
              className="btn btn-primary btn-sm email-verify-btn"
              onClick={handleVerifyOtp}
              disabled={isVerifying || otpCode.trim().length !== 6}
            >
              {isVerifying ? (
                <>
                  <Loader2 size={13} className="spinner-icon" /> Verifying...
                </>
              ) : (
                'Verify Code'
              )}
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm email-resend-btn"
              onClick={handleSendVerificationCode}
              disabled={isSending || cooldownSeconds > 0}
              title={cooldownSeconds > 0 ? `Resend available in ${cooldownSeconds}s` : "Resend verification code"}
            >
              {isSending ? (
                <>
                  <Loader2 size={13} className="spinner-icon" /> Sending...
                </>
              ) : cooldownSeconds > 0 ? (
                `Resend in ${cooldownSeconds}s`
              ) : (
                'Resend OTP'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Status Feedback Messages */}
      {isVerified && (
        <span className="field-hint-success">
          <CheckCircle2 size={12} /> Email verified successfully
        </span>
      )}

      {!isVerified && feedbackType === 'error' && feedbackMessage && (
        <span className="field-hint-error">
          <AlertTriangle size={12} /> {feedbackMessage}
        </span>
      )}

      {!isVerified && feedbackType === 'info' && feedbackMessage && (
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--primary)', marginTop: '0.375rem' }}>
          <Mail size={12} /> {feedbackMessage}
        </span>
      )}
    </div>
  );
};

interface CountryPhoneInputProps {
  id?: string;
  countryCode: string;
  onCountryCodeChange: (code: string) => void;
  phone: string;
  onPhoneChange: (phone: string) => void;
  required?: boolean;
  disabled?: boolean;
  label?: string;
}

export const CountryPhoneInput: React.FC<CountryPhoneInputProps> = ({
  id = 'mobile',
  countryCode,
  onCountryCodeChange,
  phone,
  onPhoneChange,
  required = true,
  disabled = false,
  label = 'Mobile Number'
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [touched, setTouched] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const selectedRule = COUNTRY_RULES.find(r => r.code === countryCode) || COUNTRY_RULES[0];
  const validation = validatePhone(phone, countryCode);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDigitsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTouched(true);
    // Strict numbers only: filter out all non-digits
    const digitsOnly = e.target.value.replace(/\D/g, '');
    const truncated = digitsOnly.slice(0, selectedRule.maxDigits);
    onPhoneChange(truncated);
  };

  const isFieldValid = phone.length > 0 && validation.isValid;
  const isFieldInvalid = touched && (phone.length === 0 || !validation.isValid);

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={id}>
          {label} {required && <span className="req">*</span>}
        </label>
      )}
      <div className="country-phone-wrapper" ref={dropdownRef}>
        {/* Country Code Trigger & Dropdown */}
        <div className="country-code-select-container">
          <button
            type="button"
            className="country-code-trigger"
            disabled={disabled}
            onClick={() => !disabled && setIsDropdownOpen(!isDropdownOpen)}
            aria-label="Select Country Code"
          >
            <span className="country-flag">{selectedRule.flag}</span>
            <span className="country-code-text">{selectedRule.code}</span>
            <ChevronDown 
              size={14} 
              style={{ 
                color: 'var(--text-muted)', 
                transform: isDropdownOpen ? 'rotate(180deg)' : 'none', 
                transition: 'transform 0.2s' 
              }} 
            />
          </button>

          {isDropdownOpen && (
            <div className="country-code-dropdown">
              {COUNTRY_RULES.map((rule) => (
                <div
                  key={rule.code + rule.name}
                  className={`country-code-option ${rule.code === countryCode ? 'selected' : ''}`}
                  onClick={() => {
                    onCountryCodeChange(rule.code);
                    setIsDropdownOpen(false);
                    if (phone.length > rule.maxDigits) {
                      onPhoneChange(phone.slice(0, rule.maxDigits));
                    }
                  }}
                >
                  <span className="country-flag">{rule.flag}</span>
                  <span className="country-name">{rule.name}</span>
                  <span className="country-dial-code">{rule.code}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mobile Input Field */}
        <div className="phone-number-field-wrapper">
          <div className="input-with-icon" style={{ position: 'relative' }}>
            <Phone size={16} />
            <input
              type="tel"
              id={id}
              required={required}
              disabled={disabled}
              placeholder={`e.g. ${selectedRule.example}`}
              value={phone}
              onChange={handleDigitsChange}
              onBlur={() => setTouched(true)}
              maxLength={selectedRule.maxDigits}
              inputMode="numeric"
              pattern="[0-9]*"
              className={`input-validated ${isFieldValid ? 'is-valid' : isFieldInvalid ? 'is-invalid' : ''}`}
              style={{ paddingRight: '2.5rem' }}
            />
            <div
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                display: 'flex',
                alignItems: 'center',
                pointerEvents: 'none'
              }}
            >
              {isFieldValid && (
                <CheckCircle2 size={18} style={{ color: '#16a34a' }} />
              )}
              {isFieldInvalid && (
                <AlertTriangle size={18} style={{ color: '#dc2626' }} />
              )}
            </div>
          </div>
        </div>
      </div>

      {isFieldValid && (
        <span className="field-hint-success">
          <CheckCircle2 size={12} /> {validation.message}
        </span>
      )}
      {isFieldInvalid && (
        <span className="field-hint-error">
          <AlertTriangle size={12} /> {validation.message}
        </span>
      )}
    </div>
  );
};


const getFormTypeFromParam = (param?: string): FormType => {
  if (!param) return 'none';
  const clean = param.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (clean.includes('submission') || clean.includes('project')) return 'submission';
  if (clean.includes('recognition') || clean.includes('judge') || clean.includes('evaluator')) return 'recognition';
  if (clean.includes('hackathon')) return 'hackathon';
  if (clean.includes('club') || clean.includes('membership') || clean.includes('join')) return 'join-club';
  if (clean.includes('event')) return 'event';
  if (clean.includes('volunteer')) return 'volunteer';
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
  const [registrationSuccessData, setRegistrationSuccessData] = useState<{
    referenceId?: string;
    teamId?: string;
    email?: string;
    name?: string;
    teamName?: string;
    eventName?: string;
  } | null>(null);

  // Common fields state
  const [fullName, setFullName] = useState('');
  const [pinNumber, setPinNumber] = useState('');
  const [email, setEmail] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [countryCode, setCountryCode] = useState('+91');
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

  // Volunteer specific fields state
  const [volunteerRole, setVolunteerRole] = useState('Event Operations & Logistics');
  const [volunteerSkills, setVolunteerSkills] = useState('');
  const [volunteerExperience, setVolunteerExperience] = useState('');
  const [volunteerAvailability, setVolunteerAvailability] = useState('All Days & Event Days (Full Commitment)');
  const [volunteerNotes, setVolunteerNotes] = useState('');
  const [volunteerEvent, setVolunteerEvent] = useState('General / All Upcoming Events');

  // Hackathon specific fields state
  const [teamName, setTeamName] = useState('');
  const [hackathonProjectTitle, setHackathonProjectTitle] = useState('');
  const [hackathonProblemStatement, setHackathonProblemStatement] = useState('');
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

  // Project Submission specific fields state
  const [submissionEvent, setSubmissionEvent] = useState('');
  const [submissionEventsList, setSubmissionEventsList] = useState<string[]>([]);
  const [submissionTeamId, setSubmissionTeamId] = useState(() => searchParams.get('teamId') || '');
  const [submissionTeamName, setSubmissionTeamName] = useState('');
  const [submissionDetailsConfirmed, setSubmissionDetailsConfirmed] = useState(false);
  const [copiedTeamId, setCopiedTeamId] = useState(false);
  const [isVerifyingTeam, setIsVerifyingTeam] = useState(false);
  const [verifiedTeam, setVerifiedTeam] = useState<any | null>(null);
  const [teamVerifyError, setTeamVerifyError] = useState('');
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [submissionFileBase64, setSubmissionFileBase64] = useState('');
  const [submissionSuccessData, setSubmissionSuccessData] = useState<{
    referenceNumber: string;
    submissionId: number;
    teamId?: string;
    teamName: string;
    eventName: string;
    driveFileUrl: string;
    driveFolderUrl: string;
  } | null>(null);

  interface Member {
    id: string;
    fullName: string;
    email: string;
    emailVerified?: boolean;
    countryCode: string;
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

    const tid = searchParams.get('teamId');
    if (tid) {
      setSubmissionTeamId(tid);
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
    } else if (formType === 'volunteer') {
      document.title = 'Volunteer Registration | R&D Club';
    } else if (formType === 'submission') {
      document.title = 'Project Submission | R&D Club';
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

          // Fetch project submission events
          try {
            const subRes = await fetch(`${API_BASE_URL}/api/project-submission/events`);
            if (subRes.ok) {
              const subData = await subRes.json();
              if (Array.isArray(subData) && subData.length > 0) {
                setSubmissionEventsList(subData);
                const subParam = searchParams.get('event');
                if (subParam && subData.includes(subParam)) {
                  setSubmissionEvent(subParam);
                } else {
                  setSubmissionEvent(subData[0]);
                }
              } else if (allList.length > 0) {
                setSubmissionEventsList(allList);
                setSubmissionEvent(allList[0]);
              }
            } else if (allList.length > 0) {
              setSubmissionEventsList(allList);
              setSubmissionEvent(allList[0]);
            }
          } catch (e) {
            if (allList.length > 0) {
              setSubmissionEventsList(allList);
              setSubmissionEvent(allList[0]);
            }
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
    setIsEmailVerified(false);
    setCountryCode('+91');
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

    // Volunteer reset
    setVolunteerRole('Event Operations & Logistics');
    setVolunteerSkills('');
    setVolunteerExperience('');
    setVolunteerAvailability('All Days & Event Days (Full Commitment)');
    setVolunteerNotes('');
    setVolunteerEvent('General / All Upcoming Events');

    // Hackathon reset
    setTeamName('');
    setHackathonProjectTitle('');
    setHackathonProblemStatement('');
    setSelectedHackathonName(hackathonsList.length > 0 ? hackathonsList[0] : '');
    setLeaderRole('Student');
    setLeaderYear('');
    setLeaderBranch('');
    setLeaderInstitution('');
    setLeaderCompany('');
    setLeaderJobTitle('');
    setMembers([]);
    setHackathonConfirmed(false);

    // Project submission reset
    setSubmissionTeamId('');
    setSubmissionTeamName('');
    setSubmissionDetailsConfirmed(false);
    setIsVerifyingTeam(false);
    setVerifiedTeam(null);
    setTeamVerifyError('');
    setCopiedTeamId(false);
    setSubmissionFile(null);
    setSubmissionFileBase64('');
    setSubmissionSuccessData(null);
    setRegistrationSuccessData(null);
  };

  const handleProceedToSubmission = (teamIdPreFill?: string, eventNamePreFill?: string) => {
    setIsSuccess(false);
    resetFormFields();
    if (teamIdPreFill) {
      setSubmissionTeamId(teamIdPreFill);
    }
    if (eventNamePreFill) {
      setSubmissionEvent(eventNamePreFill);
    }
    const query = teamIdPreFill ? `?teamId=${encodeURIComponent(teamIdPreFill)}` : '';
    navigate(`/apply/ProjectSubmission${query}`);
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
    } else if (type === 'volunteer') {
      navigate('/apply/VolunteerRegistration');
    } else if (type === 'submission') {
      navigate('/apply/ProjectSubmission');
    } else {
      navigate('/apply');
    }
  };

  const handleAddMember = () => {
    const newMember: Member = {
      id: Math.random().toString(36).substring(2, 9),
      fullName: '',
      email: '',
      emailVerified: false,
      countryCode: '+91',
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
    setMembers(members.map(m => {
      if (m.id === id) {
        const updated = { ...m, [field]: value };
        if (field === 'email') {
          updated.emailVerified = false;
        }
        return updated;
      }
      return m;
    }));
  };

  const countWords = (text: string): number => {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  const handleVerifyTeam = async () => {
    const key = (submissionTeamId || submissionTeamName).trim();
    if (!key) {
      setTeamVerifyError('Please enter your Unique Team ID (e.g. TCEK-HK26-0001).');
      return;
    }

    setIsVerifyingTeam(true);
    setTeamVerifyError('');
    setVerifiedTeam(null);
    setSubmissionDetailsConfirmed(false);

    try {
      const queryParams = new URLSearchParams({
        teamId: key,
        eventName: submissionEvent || ''
      });
      const res = await fetch(`${API_BASE_URL}/api/project-submission/verify-team?${queryParams.toString()}`);
      const data = await res.json();
      if (res.ok && data.success && data.team) {
        setVerifiedTeam(data.team);
        if (!submissionEvent && data.team.eventName) {
          setSubmissionEvent(data.team.eventName);
        }
        if (data.team.teamId) {
          setSubmissionTeamId(data.team.teamId);
        }
      } else {
        setTeamVerifyError(data.message || data.error || `No registered team found matching Team ID "${key}". Please ensure you enter the exact Team ID received upon registration.`);
      }
    } catch (err: any) {
      setTeamVerifyError('Network error while verifying team. Please check your connection and try again.');
    } finally {
      setIsVerifyingTeam(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedExtensions = ['.ppt', '.pptx', '.pdf'];
    const fileName = file.name.toLowerCase();
    const isAllowed = allowedExtensions.some(ext => fileName.endsWith(ext));

    if (!isAllowed) {
      alert('Only PPT, PPTX, or PDF files are accepted for presentation upload.');
      e.target.value = '';
      return;
    }

    const maxSizeInMB = 35;
    if (file.size > maxSizeInMB * 1024 * 1024) {
      alert(`File size exceeds the ${maxSizeInMB}MB limit. Please upload a smaller file.`);
      e.target.value = '';
      return;
    }

    setSubmissionFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setSubmissionFileBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitProject = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!submissionEvent) {
      alert('Please select an event.');
      return;
    }
    if (!verifiedTeam) {
      alert('Please enter and verify your registered Team ID first.');
      return;
    }
    if (!submissionDetailsConfirmed) {
      alert('Please review and confirm that your registered team and project details are correct before submitting.');
      return;
    }
    if (!submissionFile || !submissionFileBase64) {
      alert('Please upload your PPT/PPTX or PDF presentation file.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        eventName: submissionEvent,
        teamName: verifiedTeam.teamName,
        teamId: verifiedTeam.teamId || submissionTeamId,
        fileName: submissionFile.name,
        fileBase64: submissionFileBase64,
        mimeType: submissionFile.type || 'application/octet-stream',
        fileSize: submissionFile.size
      };

      const res = await fetch(`${API_BASE_URL}/api/project-submission/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSubmissionSuccessData({
          referenceNumber: data.referenceNumber,
          submissionId: data.submissionId,
          teamId: data.teamId || verifiedTeam.teamId || submissionTeamId,
          teamName: data.teamName || verifiedTeam.teamName,
          eventName: data.eventName || submissionEvent,
          driveFileUrl: data.driveFileUrl,
          driveFolderUrl: data.driveFolderUrl
        });
        setIsSuccess(true);
      } else {
        alert(data.error || 'Failed to submit project. Please try again.');
      }
    } catch (err: any) {
      console.error('Project submission error:', err);
      alert('Network or server error occurred while uploading your presentation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

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
      if (!isEmailVerified) {
        alert("Please verify your email address. Click 'Send OTP' next to the Email Address field and enter the 6-digit verification code sent to your email.");
        return;
      }
      const phoneValidation = validatePhone(mobile, countryCode);
      if (!phoneValidation.isValid) {
        alert(phoneValidation.message);
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
      if (!isEmailVerified) {
        alert("Please verify your email address. Click 'Send OTP' next to the Email Address field and enter the 6-digit verification code sent to your email.");
        return;
      }
      const phoneValidation = validatePhone(mobile, countryCode);
      if (!phoneValidation.isValid) {
        alert(phoneValidation.message);
        return;
      }
    } else if (formType === 'recognition') {
      if (!fullName.trim() || !email.trim() || !mobile.trim() || !judgeDesignation.trim() || !judgeOrganization.trim() || !judgeEventName.trim() || !judgeDomain.trim() || !judgeExperience.trim()) {
        alert("Please fill in all required fields (Full Name, Email, Mobile, Designation, Organization, Event, Domain/Specialization, and Experience).");
        return;
      }
      if (!emailRegex.test(email.trim())) {
        alert("Please enter a valid Email Address.");
        return;
      }
      if (!isEmailVerified) {
        alert("Please verify your email address. Click 'Send OTP' next to the Email Address field and enter the 6-digit verification code sent to your email.");
        return;
      }
      const phoneValidation = validatePhone(mobile, countryCode);
      if (!phoneValidation.isValid) {
        alert(phoneValidation.message);
        return;
      }
      if (!recognitionConfirmed) {
        alert("Please confirm the verification checkbox at the bottom before submitting.");
        return;
      }
    } else if (formType === 'volunteer') {
      if (!fullName.trim() || !pinNumber.trim() || !email.trim() || !mobile.trim() || !branch || !yearOfStudy || !volunteerRole || !volunteerSkills.trim()) {
        alert("Please fill in all required fields (Full Name, Roll Number, Email, Mobile, Branch, Year, Volunteer Role, and Skills).");
        return;
      }
      if (!emailRegex.test(email.trim())) {
        alert("Please enter a valid Email Address.");
        return;
      }
      if (!isEmailVerified) {
        alert("Please verify your email address. Click 'Send OTP' next to the Email Address field and enter the 6-digit verification code sent to your email.");
        return;
      }
      const phoneValidation = validatePhone(mobile, countryCode);
      if (!phoneValidation.isValid) {
        alert(phoneValidation.message);
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
      if (!hackathonProjectTitle.trim()) {
        alert("Please enter your Project Title.");
        return;
      }
      if (!hackathonProblemStatement.trim()) {
        alert("Please provide your Problem Statement.");
        return;
      }
      if (countWords(hackathonProblemStatement) > 1000) {
        alert(`Problem Statement cannot exceed 1,000 words (Current: ${countWords(hackathonProblemStatement)} words).`);
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
      if (!isEmailVerified) {
        alert("Please verify the Team Leader's email address. Click 'Send OTP' next to the Email Address field and enter the 6-digit verification code.");
        return;
      }
      if (!mobile.trim()) {
        alert("Please enter the Team Leader's Phone Number.");
        return;
      }
      const leaderPhoneValidation = validatePhone(mobile, countryCode);
      if (!leaderPhoneValidation.isValid) {
        alert(`Team Leader: ${leaderPhoneValidation.message}`);
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
        if (!m.emailVerified) {
          alert(`Please verify Member ${num}'s email address (${m.email}). Click 'Send OTP' and enter the 6-digit verification code sent to their email.`);
          return;
        }
        if (!m.phone.trim()) {
          alert(`Please enter Member ${num}'s Phone Number.`);
          return;
        }
        const memberPhoneValidation = validatePhone(m.phone, m.countryCode || '+91');
        if (!memberPhoneValidation.isValid) {
          alert(`Member ${num}: ${memberPhoneValidation.message}`);
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

    const formattedFullMobile = `${countryCode} ${mobile.trim()}`;

    const payload = formType === 'join-club' ? {
      fullName,
      pinNumber,
      email,
      mobile: formattedFullMobile,
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
      mobile: formattedFullMobile,
      branch,
      yearOfStudy,
      section,
      eventName,
      notes
    } : formType === 'recognition' ? {
      fullName,
      email,
      mobile: formattedFullMobile,
      designation: judgeDesignation,
      organization: judgeOrganization,
      eventName: judgeEventName,
      eventDate: judgeEventDate || eventDateMap[judgeEventName] || '',
      domainExpertise: judgeDomain,
      experienceYears: judgeExperience,
      notes: judgeNotes
    } : formType === 'volunteer' ? {
      fullName,
      pinNumber,
      email,
      mobile: formattedFullMobile,
      branch,
      yearOfStudy,
      eventName: volunteerEvent || 'General / All Upcoming Events',
      volunteerRole,
      skills: volunteerSkills,
      pastExperience: volunteerExperience,
      availability: volunteerAvailability,
      notes: volunteerNotes
    } : {
      hackathonName: selectedHackathonName,
      teamName,
      projectTitle: hackathonProjectTitle.trim(),
      problemStatement: hackathonProblemStatement.trim(),
      leaderName: fullName,
      leaderEmail: email,
      leaderPhone: formattedFullMobile,
      leaderRole,
      leaderYear: leaderRole === 'Student' ? leaderYear : null,
      leaderBranch: leaderRole === 'Student' ? leaderBranch : null,
      leaderInstitution: leaderRole === 'Student' ? leaderInstitution : null,
      leaderCompany: leaderRole !== 'Student' ? leaderCompany : null,
      leaderJobTitle: leaderRole !== 'Student' ? leaderJobTitle : null,
      members: members.map(m => ({
        ...m,
        phone: `${m.countryCode || '+91'} ${m.phone.trim()}`
      }))
    };

    const endpoint = formType === 'join-club' ? 'club' : formType === 'event' ? 'event' : formType === 'recognition' ? 'recognition' : formType === 'volunteer' ? 'volunteer' : 'hackathon';

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

      const resData = await response.json();
      setRegistrationSuccessData({
        referenceId: resData.referenceId || (resData.id ? `TCEK/REF/${resData.id}` : undefined),
        teamId: resData.teamId || (resData.id ? `TCEK-HK26-${String(resData.id).padStart(4, '0')}` : undefined),
        email: email.trim(),
        name: fullName.trim(),
        teamName: teamName.trim(),
        eventName: selectedHackathonName || eventName || judgeEventName || volunteerEvent
      });

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
            {/* 1. Join the R&D Club */}
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

            {/* 2. Volunteer Registration */}
            <div className="apply-option-card card hover-lift" onClick={() => handleFormSelect('volunteer')}>
              <div className="apply-icon-wrapper volunteer-icon">
                <HeartHandshake size={28} />
              </div>
              <h3>Volunteer Registration</h3>
              <p>
                Contribute to event operations, management, and technical logistics.
              </p>
              <button className="btn btn-primary btn-sm">Register as Volunteer</button>
            </div>

            {/* 3. Apply event */}
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

            {/* 4. Judge & Dignitary Recognition */}
            <div className="apply-option-card card hover-lift" onClick={() => handleFormSelect('recognition')}>
              <div className="apply-icon-wrapper recognition-icon">
                <Award size={28} />
              </div>
              <h3>Judge & Dignitary Recognition</h3>
              <p>
                Register as an official Judge, Evaluator, or Guest Dignitary.
              </p>
              <button className="btn btn-primary btn-sm">Register for Recognition</button>
            </div>

            {/* 5. Hackathon Registration */}
            <div className="apply-option-card card hover-lift" onClick={() => handleFormSelect('hackathon')}>
              <div className="apply-icon-wrapper hackathon-icon">
                <Code size={28} />
              </div>
              <h3>Hackathon Registration</h3>
              <p>
                Register your team for the hackathon. Official presentation template will be emailed upon registration.
              </p>
              <button className="btn btn-primary btn-sm">Register Team</button>
            </div>

            {/* 6. Project Submission */}
            <div className="apply-option-card card hover-lift" onClick={() => handleFormSelect('submission')}>
              <div className="apply-icon-wrapper submission-icon">
                <FolderUp size={28} />
              </div>
              <h3>Project Submission</h3>
              <p>
                Submit your completed project presentation (PDF) after team registration is completed.
              </p>
              <button className="btn btn-primary btn-sm">Submit Presentation</button>
            </div>
          </div>
        </div>
      ) : (
        /* 2. Form screen: Two-column split layout WITH branding panel */
        <div className="apply-split-layout">
          
          {/* Left Column: Branding panel */}
          <div className="apply-info-panel">
            <span className="badge">
              {formType === 'submission'
                ? 'Project Submission'
                : formType === 'recognition'
                ? 'Honoring Excellence'
                : formType === 'volunteer'
                ? 'Support & Lead'
                : 'Join the Pioneers'}
            </span>
            <h1 className="apply-panel-title">
              {formType === 'submission'
                ? 'Showcase Your Innovation'
                : formType === 'recognition'
                ? 'Distinguished Judges & Evaluators'
                : formType === 'volunteer'
                ? 'Become a Core Event Volunteer'
                : 'Shape the Future With R&D Club'}
            </h1>
            <p className="apply-panel-desc">
              {formType === 'submission'
                ? 'Submit your registered team\'s project presentation directly to our Google Drive evaluation repository.'
                : formType === 'recognition'
                ? 'We express our deepest gratitude to industry leaders, eminent academicians, and technical experts whose fair evaluations guide and inspire our student innovators.'
                : formType === 'volunteer'
                ? 'Be the backbone of major hackathons, technical symposiums, and R&D Club operations. Gain hands-on leadership experience, event management skills, and verified volunteer certificates.'
                : 'Collaborate on bleeding-edge projects, build production-grade features, and accelerate your engineering skills. We bridge the gap between academic theory and industry reality.'}
            </p>

            <div className="apply-features-list">
              <div className="apply-feature-item">
                <div className="feature-icon-box">
                  {formType === 'submission' ? <FolderUp size={18} /> : formType === 'recognition' ? <Award size={18} /> : formType === 'volunteer' ? <HeartHandshake size={18} /> : <Code size={18} />}
                </div>
                <div className="feature-item-text">
                  <h4>{formType === 'submission' ? 'Google Drive Cloud Storage' : formType === 'recognition' ? 'Institutional Recognition' : formType === 'volunteer' ? 'Leadership & Networking' : 'Real-World Experience'}</h4>
                  <p>{formType === 'submission' ? 'Presentations are organized automatically into dedicated event and team folders in Google Drive.' : formType === 'recognition' ? 'Receive an official, tamper-proof Certificate of Recognition verified by institutional leadership.' : formType === 'volunteer' ? 'Work closely with faculty, industry judges, and guest speakers while leading high-impact initiatives.' : 'Work directly on modern software/hardware codebases and write peer-reviewed scientific papers.'}</p>
                </div>
              </div>

              <div className="apply-feature-item">
                <div className="feature-icon-box text-emerald">
                  {formType === 'submission' ? <ShieldCheck size={18} /> : <Users size={18} />}
                </div>
                <div className="feature-item-text">
                  <h4>{formType === 'submission' ? 'Automated Team Verification' : formType === 'recognition' ? 'Academic Leadership' : formType === 'volunteer' ? 'Team Coordination' : 'Mentorship & Growth'}</h4>
                  <p>{formType === 'submission' ? 'System matches your registered team name and automatically loads leader and member details.' : formType === 'recognition' ? 'Guide students through real-world problem statements and identify promising engineering talent.' : formType === 'volunteer' ? 'Coordinate stage management, registration desks, hackathon logistics, and participant mentoring.' : 'Get guided by experienced senior researchers and faculty advisors with regular code reviews.'}</p>
                </div>
              </div>

              <div className="apply-feature-item">
                <div className="feature-icon-box text-indigo">
                  {formType === 'submission' ? <FileText size={18} /> : <Sparkles size={18} />}
                </div>
                <div className="feature-item-text">
                  <h4>{formType === 'submission' ? 'Automated Cloud Archival' : formType === 'recognition' ? 'Verifiable Credential' : formType === 'volunteer' ? 'Volunteer Certification' : 'HPC Compute & Resources'}</h4>
                  <p>{formType === 'submission' ? 'Direct upload to Google Drive with automated synchronization of registered team details.' : formType === 'recognition' ? 'Indexed with a permanent verification ID accessible to academic institutions and organizations globally.' : formType === 'volunteer' ? 'Receive an official, verifiable Certificate of Appreciation acknowledging your dedication and service.' : 'Get priority access to high-performance A100/H100 clusters and electronics testing labs.'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Detailed form */}
          <div className="apply-form-panel">
            <div className="form-container-card card">
              <div className="form-header-row">
                <div>
                  <h2>
                    {formType === 'submission'
                      ? 'Project Submission Portal'
                      : formType === 'join-club'
                      ? 'Membership Application'
                      : formType === 'event'
                      ? 'Event Registration'
                      : formType === 'recognition'
                      ? 'Judge & Dignitary Recognition'
                      : formType === 'volunteer'
                      ? 'Volunteer Registration'
                      : 'Hackathon Registration'}
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                    Fields marked with <span className="req">*</span> are required.
                  </p>
                </div>
                <button onClick={() => handleFormSelect('none')} className="btn btn-secondary btn-sm">
                  Change Option
                </button>
              </div>

              {isSuccess ? (
                formType === 'hackathon' ? (
                  <div className="success-state">
                    <div className="success-icon-wrapper" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                      <Check size={48} />
                    </div>
                    <h2 style={{ fontSize: '1.625rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0.75rem 0 0.5rem 0' }}>
                      Registration Successful!
                    </h2>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.85rem', borderRadius: '20px', backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#059669', fontSize: '0.875rem', fontWeight: 600, marginBottom: '1.25rem' }}>
                      <CheckCircle2 size={16} /> Team Registered: {registrationSuccessData?.teamName || teamName}
                    </div>

                    {/* Prominent Unique Team ID Card */}
                    <div style={{
                      backgroundColor: 'rgba(16, 185, 129, 0.08)',
                      border: '2px solid #10b981',
                      borderRadius: '14px',
                      padding: '1.25rem 1.5rem',
                      maxWidth: '36rem',
                      margin: '0 auto 1.25rem auto',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.08)'
                    }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#047857', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                        Your Assigned Unique Team ID
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', margin: '0.5rem 0 0.75rem 0', flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: '1.75rem',
                          fontWeight: 800,
                          fontFamily: 'monospace',
                          color: '#065f46',
                          backgroundColor: '#d1fae5',
                          padding: '0.35rem 1.25rem',
                          borderRadius: '8px',
                          letterSpacing: '0.05em',
                          border: '1px solid #a7f3d0'
                        }}>
                          {registrationSuccessData?.teamId || 'TCEK-HK26-0001'}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const idToCopy = registrationSuccessData?.teamId || 'TCEK-HK26-0001';
                            navigator.clipboard.writeText(idToCopy);
                            setCopiedTeamId(true);
                            setTimeout(() => setCopiedTeamId(false), 2500);
                          }}
                          className="btn btn-secondary btn-sm"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.45rem 0.85rem',
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            borderColor: copiedTeamId ? '#10b981' : undefined,
                            color: copiedTeamId ? '#047857' : undefined
                          }}
                        >
                          {copiedTeamId ? (
                            <>
                              <Check size={14} style={{ color: '#10b981' }} /> Copied!
                            </>
                          ) : (
                            <>
                              <Copy size={14} /> Copy Team ID
                            </>
                          )}
                        </button>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#047857', lineHeight: 1.5 }}>
                        <strong>Save this Team ID!</strong> You will be required to enter and verify this Team ID to upload your presentation in <strong>Project Submission</strong>. We have also sent this Team ID automatically to your registered email address.
                      </p>
                    </div>

                    <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: '12px', padding: '1.25rem 1.5rem', maxWidth: '36rem', margin: '0 auto 1.25rem auto', textAlign: 'left', lineHeight: 1.65 }}>
                      <div style={{ fontWeight: 700, color: '#1d4ed8', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9375rem' }}>
                        <FileText size={18} /> Official Presentation Template Notice
                      </div>
                      <p style={{ margin: '0 0 0.75rem 0', color: 'var(--text-primary)', fontSize: '0.9375rem' }}>
                        The official PPT/PPTX presentation template has been sent to your registered email address (<strong>{registrationSuccessData?.email || email}</strong>).
                      </p>
                      <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>
                        Complete the presentation using the template, convert it to <strong>PDF format (.pdf)</strong>, and submit it using your <strong>Team ID</strong> in <strong>Project Submission</strong>.
                      </p>
                    </div>

                    {registrationSuccessData?.referenceId && (
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                        Registration Reference: <strong style={{ color: 'var(--primary)' }}>{registrationSuccessData.referenceId}</strong>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleProceedToSubmission(registrationSuccessData?.teamId, registrationSuccessData?.eventName)}
                        className="btn btn-primary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.35rem' }}
                      >
                        Proceed to Project Submission <ArrowRight size={16} />
                      </button>
                      <button
                        onClick={() => handleFormSelect('none')}
                        className="btn btn-secondary btn-sm"
                      >
                        Back to Options
                      </button>
                    </div>
                  </div>
                ) : formType === 'submission' ? (
                  <div className="success-state">
                    <div className="success-icon-wrapper" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                      <Check size={48} />
                    </div>
                    <h2 style={{ fontSize: '1.625rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0.75rem 0 0.5rem 0' }}>
                      Submission Successful!
                    </h2>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.85rem', borderRadius: '20px', backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#059669', fontSize: '0.875rem', fontWeight: 600, marginBottom: '1.25rem' }}>
                      <CheckCircle2 size={16} /> Presentation Saved Directly to Google Drive
                    </div>

                    <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '12px', padding: '1.25rem 1.5rem', maxWidth: '36rem', margin: '0 auto 1.25rem auto', textAlign: 'left', lineHeight: 1.65 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(16, 185, 129, 0.2)' }}>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Verified Team ID:</span>
                        <span style={{
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          fontSize: '0.9375rem',
                          color: '#065f46',
                          backgroundColor: '#d1fae5',
                          padding: '0.2rem 0.65rem',
                          borderRadius: '6px',
                          border: '1px solid #a7f3d0'
                        }}>
                          {submissionSuccessData?.teamId || verifiedTeam?.teamId || submissionTeamId}
                        </span>
                      </div>
                      <p style={{ margin: '0 0 0.75rem 0', color: 'var(--text-primary)', fontSize: '0.9375rem' }}>
                        Your project presentation has been uploaded and stored directly in the Google Drive folder for Team <strong>{submissionSuccessData?.teamName || verifiedTeam?.teamName}</strong>.
                      </p>
                      <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>
                        An automatic confirmation email has been sent to your registered email address (<strong>{verifiedTeam?.leaderEmail || email}</strong>) with submission and presentation details.
                      </p>
                      {submissionSuccessData?.referenceNumber && (
                        <div style={{ marginTop: '0.875rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(16, 185, 129, 0.2)', fontSize: '0.875rem', color: '#047857', fontWeight: 600 }}>
                          Submission Reference ID: {submissionSuccessData.referenceNumber}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                      {submissionSuccessData?.driveFileUrl && (
                        <a
                          href={submissionSuccessData.driveFileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-primary"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.35rem' }}
                        >
                          <ExternalLink size={16} /> View Presentation in Google Drive
                        </a>
                      )}
                      <button
                        onClick={() => handleFormSelect('none')}
                        className="btn btn-secondary btn-sm"
                      >
                        Back to Options
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="success-state">
                    <div className="success-icon-wrapper" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                      <Check size={48} />
                    </div>
                    <h2 style={{ fontSize: '1.625rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0.75rem 0 0.5rem 0' }}>
                      Submission Successful!
                    </h2>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.85rem', borderRadius: '20px', backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#059669', fontSize: '0.875rem', fontWeight: 600, marginBottom: '1.25rem' }}>
                      <CheckCircle2 size={16} />
                      {formType === 'join-club'
                        ? 'Club Membership Application Submitted'
                        : formType === 'volunteer'
                        ? 'Volunteer Registration Submitted'
                        : formType === 'event'
                        ? 'Event Registration Confirmed'
                        : 'Recognition Details Recorded'}
                    </div>

                    <div style={{ backgroundColor: 'var(--card-bg, #ffffff)', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '12px', padding: '1.25rem 1.5rem', maxWidth: '36rem', margin: '0 auto 1.25rem auto', textAlign: 'center', lineHeight: 1.65 }}>
                      <p style={{ margin: '0 0 0.75rem 0', color: 'var(--text-primary)', fontSize: '0.9375rem' }}>
                        {formType === 'join-club'
                          ? 'Your application to join the R&D Club has been submitted successfully.'
                          : formType === 'volunteer'
                          ? 'Thank you for stepping forward to volunteer! Your registration has been submitted successfully.'
                          : formType === 'event'
                          ? 'Your registration for the event has been officially recorded.'
                          : 'Thank you for your valuable contribution. Your judge/dignitary recognition details have been saved.'}
                      </p>
                      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        An automatic confirmation email has been sent to your registered email address (<strong>{registrationSuccessData?.email || email}</strong>).
                      </p>
                      {registrationSuccessData?.referenceId && (
                        <div style={{ marginTop: '0.875rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color, #f1f5f9)', fontSize: '0.875rem', color: 'var(--primary)', fontWeight: 600 }}>
                          Registration Reference: {registrationSuccessData.referenceId}
                        </div>
                      )}
                    </div>

                    <button onClick={() => handleFormSelect('none')} className="btn btn-secondary btn-sm">
                      Back to Options
                    </button>
                  </div>
                )
              ) : (
                <form onSubmit={formType === 'submission' ? handleSubmitProject : handleSubmit} className="apply-detailed-form">
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

                      <VerifiedEmailInput
                        id="email"
                        value={email}
                        onChange={setEmail}
                        isVerified={isEmailVerified}
                        onVerifiedChange={setIsEmailVerified}
                        placeholder="user@university.edu"
                        label="Email Address"
                        required
                      />

                      <CountryPhoneInput
                        id="mobile"
                        countryCode={countryCode}
                        onCountryCodeChange={setCountryCode}
                        phone={mobile}
                        onPhoneChange={setMobile}
                        label="Mobile Number"
                        required
                      />

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

                      <VerifiedEmailInput
                        id="judgeEmail"
                        value={email}
                        onChange={setEmail}
                        isVerified={isEmailVerified}
                        onVerifiedChange={setIsEmailVerified}
                        placeholder="e.g. judge@institution.edu or expert@company.com"
                        label="Email Address"
                        required
                      />

                      <CountryPhoneInput
                        id="judgeMobile"
                        countryCode={countryCode}
                        onCountryCodeChange={setCountryCode}
                        phone={mobile}
                        onPhoneChange={setMobile}
                        label="Mobile / Contact Number"
                        required
                      />

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
                        <label htmlFor="judgeDomain">Area of Domain / Specialization <span className="req">*</span></label>
                        <input
                          type="text"
                          id="judgeDomain"
                          required
                          placeholder="e.g. AI/ML, Cloud Architecture, Robotics, Embedded Systems"
                          value={judgeDomain}
                          onChange={(e) => setJudgeDomain(e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="judgeExperience">Experience (Years in Industry / Academia) <span className="req">*</span></label>
                        <input
                          type="text"
                          id="judgeExperience"
                          required
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

                  {/* Volunteer Details */}
                  {formType === 'volunteer' && (
                    <>
                      <div className="form-section-title">Volunteer Profile & Academic Info</div>

                      <div className="form-group">
                        <label htmlFor="volunteerFullName">Full Name <span className="req">*</span></label>
                        <div className="input-with-icon">
                          <User size={16} />
                          <input
                            type="text"
                            id="volunteerFullName"
                            required
                            placeholder="e.g. John Doe"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label htmlFor="volunteerPin">Roll Number / Student PIN <span className="req">*</span></label>
                        <div className="input-with-icon">
                          <GraduationCap size={16} />
                          <input
                            type="text"
                            id="volunteerPin"
                            required
                            placeholder="e.g. 21TK1A0501"
                            value={pinNumber}
                            onChange={(e) => setPinNumber(e.target.value)}
                          />
                        </div>
                      </div>

                      <VerifiedEmailInput
                        id="volunteerEmail"
                        value={email}
                        onChange={setEmail}
                        isVerified={isEmailVerified}
                        onVerifiedChange={setIsEmailVerified}
                        placeholder="e.g. student@college.edu"
                        label="Email Address"
                        required
                      />

                      <CountryPhoneInput
                        id="volunteerMobile"
                        countryCode={countryCode}
                        onCountryCodeChange={setCountryCode}
                        phone={mobile}
                        onPhoneChange={setMobile}
                        label="Mobile / WhatsApp Number"
                        required
                      />

                      <div className="form-grid-2">
                        <div className="form-group">
                          <label htmlFor="volunteerBranch">Branch / Department <span className="req">*</span></label>
                          <CustomSelect
                            id="volunteerBranch"
                            required
                            value={branch}
                            onChange={setBranch}
                            options={branchesList.length > 0 ? branchesList : ['Computer Science & Engineering', 'Electronics & Communication', 'Electrical & Electronics', 'Mechanical Engineering', 'Civil Engineering']}
                            placeholder="Select Branch"
                            icon={<GraduationCap size={16} />}
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="volunteerYear">Year of Study <span className="req">*</span></label>
                          <CustomSelect
                            id="volunteerYear"
                            required
                            value={yearOfStudy}
                            onChange={setYearOfStudy}
                            options={['1st Year', '2nd Year', '3rd Year', '4th Year']}
                            placeholder="Select Year"
                            icon={<Calendar size={16} />}
                          />
                        </div>
                      </div>

                      <div className="form-section-title" style={{ marginTop: '1.5rem' }}>Role & Event Assignment</div>

                      <div className="form-group">
                        <label htmlFor="volunteerEvent">Target Event / Activity <span className="req">*</span></label>
                        <CustomSelect
                          id="volunteerEvent"
                          required
                          value={volunteerEvent}
                          onChange={setVolunteerEvent}
                          options={['General / All Upcoming Events', ...(allEventsList.length > 0 ? allEventsList : ['Smart India Hackathon 2026', 'R&D Annual TechFest'])]}
                          placeholder="Select Event Preference"
                          icon={<Sparkles size={16} />}
                          disabled={isLoadingEvents}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="volunteerRole">Preferred Volunteering Track <span className="req">*</span></label>
                        <CustomSelect
                          id="volunteerRole"
                          required
                          value={volunteerRole}
                          onChange={setVolunteerRole}
                          options={[
                            'Event Operations & Logistics',
                            'Stage, Anchor & Dignitary Management',
                            'Technical & Lab Support',
                            'Registration & Crowd Coordination',
                            'Design, Media & Photography',
                            'Social Media & Live Coverage'
                          ]}
                          placeholder="Select Track"
                          icon={<Briefcase size={16} />}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="volunteerAvailability">Availability Commitment <span className="req">*</span></label>
                        <CustomSelect
                          id="volunteerAvailability"
                          required
                          value={volunteerAvailability}
                          onChange={setVolunteerAvailability}
                          options={[
                            'All Days & Event Days (Full Commitment)',
                            'Event Days Only',
                            'Pre-Event Preparation Days',
                            'Flexible / On-Call'
                          ]}
                          placeholder="Select Availability"
                          icon={<Calendar size={16} />}
                        />
                      </div>

                      <div className="form-section-title" style={{ marginTop: '1.5rem' }}>Skills & Experience</div>

                      <div className="form-group">
                        <label htmlFor="volunteerSkills">Key Skills & Strengths <span className="req">*</span></label>
                        <input
                          type="text"
                          id="volunteerSkills"
                          required
                          placeholder="e.g. Public speaking, event hosting, photography, Python, lab networking"
                          value={volunteerSkills}
                          onChange={(e) => setVolunteerSkills(e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="volunteerExperience">Previous Volunteering / Organizing Experience <span className="opt">(Optional)</span></label>
                        <textarea
                          id="volunteerExperience"
                          rows={3}
                          placeholder="List any past events, clubs, or symposiums you have organized or volunteered for..."
                          value={volunteerExperience}
                          onChange={(e) => setVolunteerExperience(e.target.value.slice(0, 500))}
                          maxLength={500}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="volunteerNotes">Why would you like to volunteer with R&D Club? <span className="opt">(Optional)</span></label>
                        <textarea
                          id="volunteerNotes"
                          rows={4}
                          placeholder="Tell us what motivates you and how you can best contribute to our team..."
                          value={volunteerNotes}
                          onChange={(e) => setVolunteerNotes(e.target.value.slice(0, 500))}
                          maxLength={500}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', fontSize: '0.75rem' }}>
                          <span />
                          <span style={{ color: volunteerNotes.length === 500 ? '#dc2626' : 'var(--text-secondary)' }}>
                            {volunteerNotes.length} / 500
                          </span>
                        </div>
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

                      {/* Project Details */}
                      <div className="form-section-title" style={{ marginTop: '1.5rem' }}>Project Details</div>

                      <div className="form-group">
                        <label htmlFor="hackathonProjectTitle">Project Title <span className="req">*</span></label>
                        <div className="input-with-icon">
                          <FileText size={16} />
                          <input
                            type="text"
                            id="hackathonProjectTitle"
                            required
                            placeholder="e.g. AI-Powered Autonomous Crop Monitoring System"
                            value={hackathonProjectTitle}
                            onChange={(e) => setHackathonProjectTitle(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                          <label htmlFor="hackathonProblemStatement" style={{ margin: 0 }}>
                            Problem Statement <span className="req">*</span>
                          </label>
                          <span className={`word-counter-pill ${countWords(hackathonProblemStatement) > 1000 ? 'counter-danger' : countWords(hackathonProblemStatement) > 900 ? 'counter-warning' : 'counter-normal'}`}>
                            {countWords(hackathonProblemStatement)} / 1,000 words
                          </span>
                        </div>
                        <textarea
                          id="hackathonProblemStatement"
                          rows={5}
                          required
                          placeholder="Explain the real-world problem statement, societal/industrial relevance, current constraints, and proposed innovative solution (maximum 1,000 words)..."
                          value={hackathonProblemStatement}
                          onChange={(e) => setHackathonProblemStatement(e.target.value)}
                        />
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

                      <VerifiedEmailInput
                        id="leaderEmail"
                        value={email}
                        onChange={setEmail}
                        isVerified={isEmailVerified}
                        onVerifiedChange={setIsEmailVerified}
                        placeholder="leader@domain.com"
                        label="Email Address"
                        required
                      />

                      <CountryPhoneInput
                        id="leaderPhone"
                        countryCode={countryCode}
                        onCountryCodeChange={setCountryCode}
                        phone={mobile}
                        onPhoneChange={setMobile}
                        label="Phone Number"
                        required
                      />

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

                          <VerifiedEmailInput
                            id={`member-email-${member.id}`}
                            value={member.email}
                            onChange={(val) => handleMemberChange(member.id, 'email', val)}
                            isVerified={member.emailVerified || false}
                            onVerifiedChange={(verified) => handleMemberChange(member.id, 'emailVerified', verified)}
                            placeholder="jane@domain.com"
                            label="Email Address"
                            required
                          />

                          <CountryPhoneInput
                            id={`member-phone-${member.id}`}
                            countryCode={member.countryCode || '+91'}
                            onCountryCodeChange={(code) => handleMemberChange(member.id, 'countryCode', code)}
                            phone={member.phone}
                            onPhoneChange={(phone) => handleMemberChange(member.id, 'phone', phone)}
                            label="Phone Number"
                            required
                          />

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

                  {formType === 'submission' && (
                    <>
                      <div className="alert-notice-box" style={{ 
                        backgroundColor: '#eff6ff', 
                        border: '1px solid #dbeafe', 
                        borderRadius: '8px', 
                        padding: '1.25rem', 
                        marginBottom: '1.75rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: '#1d4ed8', fontSize: '0.9375rem' }}>
                          <FolderUp size={18} />
                          <span>Google Drive Project Submission:</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.875rem', color: '#1e40af', lineHeight: 1.6 }}>
                          Please select your event and enter your registered team name. Once your team is verified, upload your presentation file (.ppt, .pptx, or .pdf). All files will be automatically created and organized inside dedicated Google Drive folders.
                        </p>
                      </div>

                      {/* 1. Select Event */}
                      <div className="form-section-title">1. Select Event</div>
                      <div className="form-group">
                        <label htmlFor="submissionEvent">Registered Event / Hackathon <span className="req">*</span></label>
                        <CustomSelect
                          id="submissionEvent"
                          required
                          value={submissionEvent}
                          onChange={(val) => {
                            setSubmissionEvent(val);
                            setVerifiedTeam(null);
                            setTeamVerifyError('');
                          }}
                          options={submissionEventsList.length > 0 ? submissionEventsList : (allEventsList.length > 0 ? allEventsList : ['Smart India Hackathon 2026', 'R&D Annual TechFest'])}
                          placeholder="Select Event"
                          icon={<Calendar size={16} />}
                        />
                      </div>

                      {/* 2. Enter Team ID */}
                      <div className="form-section-title" style={{ marginTop: '1.5rem' }}>2. Enter Team ID</div>
                      <div className="form-group">
                        <label htmlFor="submissionTeamId">Unique Team ID <span className="req">*</span></label>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                          <div className="input-with-icon" style={{ flex: 1 }}>
                            <Hash size={16} />
                            <input
                              type="text"
                              id="submissionTeamId"
                              required
                              placeholder="e.g. TCEK-HK26-0001"
                              value={submissionTeamId}
                              onChange={(e) => {
                                setSubmissionTeamId(e.target.value);
                                if (verifiedTeam) {
                                  setVerifiedTeam(null);
                                  setSubmissionDetailsConfirmed(false);
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleVerifyTeam();
                                }
                              }}
                            />
                          </div>
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleVerifyTeam}
                            disabled={isVerifyingTeam || !submissionTeamId.trim()}
                            style={{ whiteSpace: 'nowrap', minHeight: '44px', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                          >
                            {isVerifyingTeam ? (
                              <>
                                <Loader2 size={15} className="spinner-icon" /> Verifying...
                              </>
                            ) : (
                              <>
                                <ShieldCheck size={15} /> Verify Team
                              </>
                            )}
                          </button>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                          Enter the unique Team ID provided upon hackathon registration (e.g. <strong>TCEK-HK26-0001</strong>). You can also find it in your registration confirmation email.
                        </div>
                        {teamVerifyError && (
                          <div className="field-hint-error" style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <AlertTriangle size={14} /> {teamVerifyError}
                          </div>
                        )}
                      </div>

                      {/* Verified Team Details Card */}
                      {verifiedTeam && (
                        <>
                          <div className="submission-verified-card">
                            <div className="submission-verified-header">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#16a34a', fontWeight: 600, fontSize: '0.9375rem' }}>
                                <CheckCircle2 size={18} />
                                <span>Registered Team Verified</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span className="badge" style={{ backgroundColor: '#e0e7ff', color: '#4338ca', border: '1px solid #c7d2fe', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.8125rem' }}>
                                  {verifiedTeam.teamId}
                                </span>
                                <span className="badge" style={{ backgroundColor: 'rgba(22, 163, 74, 0.1)', color: '#16a34a', border: '1px solid rgba(22, 163, 74, 0.2)' }}>
                                  Verified
                                </span>
                              </div>
                            </div>
                            
                            <div className="submission-team-grid">
                              <div className="team-meta-item">
                                <span className="meta-label">Team Name:</span>
                                <span className="meta-value font-semibold">{verifiedTeam.teamName}</span>
                              </div>
                              <div className="team-meta-item">
                                <span className="meta-label">Event:</span>
                                <span className="meta-value">{verifiedTeam.eventName}</span>
                              </div>
                              <div className="team-meta-item full-width team-leader-item">
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.35rem' }}>
                                  <span className="meta-label" style={{ margin: 0 }}>Team Leader</span>
                                  {verifiedTeam.leaderRole && (
                                    <span className="badge" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', border: '1px solid rgba(59, 130, 246, 0.2)', fontSize: '0.75rem', fontWeight: 600 }}>
                                      {verifiedTeam.leaderRole}
                                    </span>
                                  )}
                                </div>
                                <div className="leader-meta-content">
                                  <span className="leader-name-highlight">{verifiedTeam.leaderName}</span>
                                  {(verifiedTeam.leaderYear || verifiedTeam.leaderBranch) && (
                                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                      <GraduationCap size={14} style={{ opacity: 0.8, color: 'var(--primary)', flexShrink: 0 }} />
                                      <span>{[verifiedTeam.leaderYear, verifiedTeam.leaderBranch].filter(Boolean).join(' • ')}</span>
                                    </div>
                                  )}
                                  <div className="leader-badges-wrap">
                                    {verifiedTeam.leaderPhone && (() => {
                                      const parts = getPhoneParts(verifiedTeam.leaderPhone);
                                      return (
                                        <a href={`tel:${verifiedTeam.leaderPhone}`} className="leader-contact-chip phone-chip" title="Call Team Leader">
                                          <Phone size={13} className="chip-icon" />
                                          <span className="phone-flag-prefix">{parts.countryCode}</span>
                                          <span className="phone-number-part">{parts.localNumber}</span>
                                        </a>
                                      );
                                    })()}
                                    {verifiedTeam.leaderEmail && (
                                      <a href={`mailto:${verifiedTeam.leaderEmail}`} className="leader-contact-chip email-chip" title="Email Team Leader">
                                        <Mail size={13} className="chip-icon" />
                                        <span>{verifiedTeam.leaderEmail}</span>
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="team-meta-item full-width">
                                <span className="meta-label">College / Institution:</span>
                                <span className="meta-value">{verifiedTeam.institution}</span>
                              </div>
                              {verifiedTeam.projectTitle && (
                                <div className="team-meta-item full-width">
                                  <span className="meta-label">Registered Project Title:</span>
                                  <span className="meta-value font-semibold" style={{ color: 'var(--primary)' }}>
                                    {verifiedTeam.projectTitle}
                                  </span>
                                </div>
                              )}
                              {verifiedTeam.problemStatement && (
                                <div className="team-meta-item full-width">
                                  <span className="meta-label">Registered Problem Statement:</span>
                                  <span className="meta-value" style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                                    {verifiedTeam.problemStatement}
                                  </span>
                                </div>
                              )}
                              {verifiedTeam.members && verifiedTeam.members.length > 0 && (
                                <div className="team-meta-item full-width" style={{ marginTop: '0.5rem' }}>
                                  <span className="meta-label" style={{ marginBottom: '0.35rem' }}>
                                    Team Members ({verifiedTeam.members.length}):
                                  </span>
                                  <div className="verified-members-grid">
                                    {verifiedTeam.members.map((m: any, idx: number) => {
                                      const memberName = m.fullName || m.name || `Member ${idx + 1}`;
                                      const phoneParts = m.phone ? getPhoneParts(m.phone) : null;
                                      const academicParts = [m.year, m.branch].filter(Boolean).join(' • ');
                                      const workParts = [m.jobTitle, m.company].filter(Boolean).join(' at ');
                                      const memberInst = m.institution && m.institution.trim() !== verifiedTeam.institution?.trim() ? m.institution.trim() : null;

                                      return (
                                        <div key={idx} className="verified-member-card">
                                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                              <span className="member-index-tag">#{idx + 1}</span>
                                              <span className="member-name-text">{memberName}</span>
                                            </div>
                                            {m.role && (
                                              <span className="member-role-badge">
                                                {m.role}
                                              </span>
                                            )}
                                          </div>

                                          {academicParts && (
                                            <div className="member-meta-line">
                                              <GraduationCap size={13} className="member-meta-icon" />
                                              <span>{academicParts}</span>
                                            </div>
                                          )}

                                          {workParts && (
                                            <div className="member-meta-line">
                                              <Briefcase size={13} className="member-meta-icon" />
                                              <span>{workParts}</span>
                                            </div>
                                          )}

                                          {memberInst && (
                                            <div className="member-meta-line" style={{ fontSize: '0.75rem' }}>
                                              <Building2 size={13} className="member-meta-icon" />
                                              <span>{memberInst}</span>
                                            </div>
                                          )}

                                          <div className="member-contact-chips">
                                            {m.phone && phoneParts && (
                                              <a href={`tel:${m.phone}`} className="leader-contact-chip phone-chip" title={`Call ${memberName}`}>
                                                <Phone size={12} className="chip-icon" />
                                                <span className="phone-flag-prefix">{phoneParts.countryCode}</span>
                                                <span className="phone-number-part">{phoneParts.localNumber}</span>
                                              </a>
                                            )}
                                            {m.email && (
                                              <a href={`mailto:${m.email}`} className="leader-contact-chip email-chip" title={`Email ${memberName}`}>
                                                <Mail size={12} className="chip-icon" />
                                                <span>{m.email}</span>
                                              </a>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* 3. Review & Confirm Registered Details */}
                          <div className="form-section-title" style={{ marginTop: '1.75rem' }}>3. Review & Confirm Registered Details</div>
                          <div style={{
                            backgroundColor: submissionDetailsConfirmed ? 'rgba(22, 163, 74, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                            border: `1px solid ${submissionDetailsConfirmed ? 'rgba(22, 163, 74, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                            borderRadius: '10px',
                            padding: '1rem 1.25rem',
                            marginTop: '0.5rem',
                            transition: 'all 0.2s ease'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                              <input
                                type="checkbox"
                                id="confirmTeamDetails"
                                checked={submissionDetailsConfirmed}
                                onChange={(e) => setSubmissionDetailsConfirmed(e.target.checked)}
                                style={{ width: '1.2rem', height: '1.2rem', marginTop: '0.15rem', cursor: 'pointer', accentColor: '#16a34a' }}
                              />
                              <label htmlFor="confirmTeamDetails" style={{ cursor: 'pointer', fontSize: '0.875rem', color: 'var(--text-main)', lineHeight: 1.5, margin: 0 }}>
                                <strong style={{ color: submissionDetailsConfirmed ? '#15803d' : 'var(--text-main)' }}>
                                  I confirm that the Team Name, Members, Project Title, and Problem Statement displayed above are correct.
                                </strong>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                  {submissionDetailsConfirmed ? (
                                    <span style={{ color: '#15803d', fontWeight: 600 }}>✓ Details reviewed & confirmed. You can now upload your presentation below.</span>
                                  ) : (
                                    <span>Please check this box to confirm all registered details before uploading your presentation.</span>
                                  )}
                                </div>
                              </label>
                            </div>
                          </div>
                        </>
                      )}

                      {/* 4. Upload Presentation */}
                      <div className="form-section-title" style={{ marginTop: '1.75rem' }}>4. Upload Presentation</div>
                      
                      {!verifiedTeam || !submissionDetailsConfirmed ? (
                        <div style={{
                          backgroundColor: 'var(--bg-subtle, #f8fafc)',
                          border: '1px dashed var(--border-color, #cbd5e1)',
                          borderRadius: '10px',
                          padding: '1.5rem',
                          textAlign: 'center',
                          color: 'var(--text-muted)'
                        }}>
                          <Lock size={26} style={{ margin: '0 auto 0.5rem auto', opacity: 0.6, display: 'block' }} />
                          <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-main)' }}>Presentation Upload Locked</div>
                          <div style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                            {!verifiedTeam 
                              ? 'Please enter and verify your Unique Team ID above.'
                              : 'Please check the confirmation box in Step 3 above to unlock presentation upload.'}
                          </div>
                        </div>
                      ) : (
                        <div className="form-group">
                          <label>Upload Presentation (PPT/PPTX converted to PDF format) <span className="req">*</span></label>
                          <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '0.875rem', fontSize: '0.8125rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                            <strong>Important:</strong> Please convert your completed PPT/PPTX presentation to <strong>PDF format (.pdf)</strong> before uploading. All presentations are saved directly into the event's <strong>Google Drive folder</strong> and are <strong>not stored in the database</strong>.
                          </div>

                          {!submissionFile ? (
                            <div className="file-upload-dropzone">
                              <input
                                type="file"
                                id="submissionFileInput"
                                accept=".pdf,.ppt,.pptx,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                              />
                              <label htmlFor="submissionFileInput" className="dropzone-label">
                                <UploadCloud size={36} className="dropzone-icon" />
                                <span className="dropzone-title">Click or Drag to Upload Presentation (PDF)</span>
                                <span className="dropzone-subtitle">Preferred format: PDF (.pdf) • Converted from PPT/PPTX (Max 35MB)</span>
                              </label>
                            </div>
                          ) : (
                            <div className="selected-file-card">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div className="file-icon-badge">
                                  <FileText size={24} />
                                </div>
                                <div>
                                  <div className="file-name-text">{submissionFile.name}</div>
                                  <div className="file-size-text">{(submissionFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for Google Drive upload</div>
                                </div>
                              </div>
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => {
                                  setSubmissionFile(null);
                                  setSubmissionFileBase64('');
                                }}
                                title="Remove file and choose another"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                              >
                                <Trash2 size={14} /> Remove
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginTop: '2rem' }}>
                    <button
                      type="submit"
                      disabled={isSubmitting || (formType === 'submission' && (!verifiedTeam || !submissionDetailsConfirmed || !submissionFile))}
                      className="btn btn-primary form-submit-btn"
                      style={{ alignSelf: 'center', minWidth: '260px', padding: '0.75rem 2rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: 0 }}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="spinner-icon" size={16} />
                          {formType === 'submission' ? 'Uploading to Drive & Submitting...' : 'Submitting...'}
                        </>
                      ) : formType === 'submission' ? (
                        <>
                          <UploadCloud size={18} /> Submit Project Presentation
                        </>
                      ) : (
                        'Submit Application'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
