import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { 
  ShieldCheck, 
  Loader2, 
  Eye, 
  EyeOff, 
  KeyRound, 
  ArrowRight, 
  AlertCircle, 
  RotateCcw, 
  Sparkles,
  UserCheck
} from 'lucide-react';

export const RegDeskLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [deskId, setDeskId] = useState('');
  
  // 6-Character OTP-style password boxes
  const [boxes, setBoxes] = useState<string[]>(['', '', '', '', '', '']);
  const boxRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isExpired, setIsExpired] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Focus first box when page mounts
  useEffect(() => {
    if (boxRefs.current[0]) {
      const timer = setTimeout(() => {
        boxRefs.current[0]?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, []);

  // Handle input in individual OTP box
  const handleBoxChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    
    // Take the last character entered
    const char = rawVal.slice(-1).toUpperCase();
    
    // Allow only alphanumeric characters
    if (/^[A-Z0-9]$/.test(char)) {
      const newBoxes = [...boxes];
      newBoxes[index] = char;
      setBoxes(newBoxes);
      setError('');

      // Auto-advance to next box
      if (index < 5) {
        boxRefs.current[index + 1]?.focus();
      }
    } else if (rawVal === '') {
      const newBoxes = [...boxes];
      newBoxes[index] = '';
      setBoxes(newBoxes);
    }
  };

  // Handle key down navigation (backspace, arrow keys)
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (boxes[index] !== '') {
        const newBoxes = [...boxes];
        newBoxes[index] = '';
        setBoxes(newBoxes);
      } else if (index > 0) {
        const newBoxes = [...boxes];
        newBoxes[index - 1] = '';
        setBoxes(newBoxes);
        boxRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      boxRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault();
      boxRefs.current[index + 1]?.focus();
    }
  };

  // Handle paste across all 6 boxes
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!pasted) return;

    const newBoxes = [...boxes];
    for (let i = 0; i < 6; i++) {
      newBoxes[i] = pasted[i] || '';
    }
    setBoxes(newBoxes);
    setError('');

    // Focus the box following the last pasted character
    const targetIdx = Math.min(pasted.length, 5);
    boxRefs.current[targetIdx]?.focus();
  };

  const handleClearBoxes = () => {
    setBoxes(['', '', '', '', '', '']);
    boxRefs.current[0]?.focus();
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsExpired(false);

    const cleanDeskId = deskId.trim().toUpperCase();
    if (!cleanDeskId) {
      setError('Please enter your Registration Desk ID.');
      return;
    }

    const finalPassword = boxes.join('').trim();

    if (!finalPassword) {
      setError('Please enter the 6-character access pass.');
      return;
    }

    if (finalPassword.length < 6) {
      setError('Please fill in all 6 characters of your access pass.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/reg-desk/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ deskId: cleanDeskId, password: finalPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === 'TEMP_PASSWORD_EXPIRED') {
          setIsExpired(true);
          throw new Error(data.error || 'Temporary password has expired (valid for 1 week). Please reset your password via OTP.');
        }
        throw new Error(data.error || 'Login failed. Please verify your Desk ID and Passcode.');
      }

      // Store auth credentials in localStorage
      localStorage.setItem('reg_desk_token', data.token);
      localStorage.setItem('reg_desk_user', JSON.stringify(data.user));

      navigate('/reg-desk/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="regdesk-login-wrapper">
      <div className="regdesk-login-card">
        {/* Header with Live Badge */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div className="regdesk-badge-pill">
            <span className="regdesk-pulse-dot" />
            <span>Registration Desk Access Gate</span>
          </div>

          <div className="regdesk-icon-container">
            <ShieldCheck size={32} />
          </div>

          <h2 style={{ 
            fontSize: '1.65rem', 
            fontWeight: 800, 
            letterSpacing: '-0.02em', 
            color: '#0f172a',
            margin: '0 0 0.4rem 0'
          }}>
            Registration Desk Gate
          </h2>
          <p style={{ 
            fontSize: '0.875rem', 
            color: '#64748b', 
            margin: 0,
            lineHeight: 1.5 
          }}>
            Attendee check-in, desk coordination & badge validation
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            marginBottom: '1.25rem',
            padding: '0.85rem 1rem',
            borderRadius: '12px',
            backgroundColor: '#fef2f2',
            border: `1px solid ${isExpired ? '#f87171' : '#fecaca'}`,
            color: '#b91c1c',
            fontSize: '0.85rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px', color: '#ef4444' }} />
              <div style={{ flex: 1, lineHeight: 1.4 }}>{error}</div>
            </div>

            {isExpired && (
              <button
                type="button"
                onClick={() => navigate('/reg-desk/forgot-password')}
                style={{
                  marginTop: '0.35rem',
                  padding: '0.5rem 0.85rem',
                  borderRadius: '8px',
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem'
                }}
              >
                <KeyRound size={14} /> Reset Password via OTP Now
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Registration Desk ID Field */}
          <div style={{ marginBottom: '1.4rem' }}>
            <label style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              fontSize: '0.82rem', 
              fontWeight: 700, 
              color: '#1e293b', 
              marginBottom: '0.45rem',
              letterSpacing: '0.02em'
            }}>
              <span>Registration Desk ID</span>
              <span style={{ 
                fontSize: '0.72rem', 
                color: '#047857', 
                fontWeight: 600,
                backgroundColor: '#ecfdf5',
                padding: '0.15rem 0.5rem',
                borderRadius: '4px',
                border: '1px solid #a7f3d0'
              }}>
                TCEK Unique ID
              </span>
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="text"
                required
                className="regdesk-input-control"
                placeholder="e.g. TCEK-REG-DESK-A1G33N"
                value={deskId}
                onChange={(e) => setDeskId(e.target.value.toUpperCase())}
                style={{ 
                  paddingLeft: '2.5rem', 
                  fontFamily: 'monospace', 
                  fontWeight: 700,
                  letterSpacing: '0.05em' 
                }}
              />
              <UserCheck 
                size={18} 
                style={{ 
                  position: 'absolute', 
                  left: '0.85rem', 
                  color: '#94a3b8', 
                  pointerEvents: 'none' 
                }} 
              />
            </div>
          </div>

          {/* Password Section: 6-Box OTP Style */}
          <div style={{ marginBottom: '1.6rem' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '0.45rem' 
            }}>
              <label style={{ 
                margin: 0, 
                fontSize: '0.82rem', 
                fontWeight: 700, 
                color: '#1e293b',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}>
                <KeyRound size={14} color="#059669" />
                <span>Temporary Access Pass</span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Hide characters" : "Show characters"}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    padding: 0
                  }}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  <span>{showPassword ? 'Hide' : 'Show'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleClearBoxes}
                  title="Clear passcode"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.2rem',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    padding: 0
                  }}
                >
                  <RotateCcw size={13} />
                  <span>Clear</span>
                </button>
              </div>
            </div>

            {/* 6 OTP Character Boxes */}
            <div className="regdesk-otp-grid" onPaste={handlePaste}>
              {boxes.map((val, idx) => (
                <input
                  key={idx}
                  ref={(el) => { boxRefs.current[idx] = el; }}
                  type={showPassword ? 'text' : 'password'}
                  maxLength={1}
                  className={`regdesk-otp-box ${val ? 'filled' : ''}`}
                  value={val}
                  onChange={(e) => handleBoxChange(idx, e)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck="false"
                  aria-label={`Character ${idx + 1}`}
                />
              ))}
            </div>

            <div style={{ 
              marginTop: '0.55rem', 
              display: 'flex', 
              alignItems: 'center',
              fontSize: '0.72rem',
              color: '#64748b'
            }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 500 }}>
                <Sparkles size={12} color="#059669" /> 6 alphanumeric characters (Valid 1 week)
              </span>
            </div>
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="regdesk-btn-primary"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="spinner-icon" size={18} /> Authenticating Gate...
              </>
            ) : (
              <>
                <span>Access Registration Console</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>

          {/* Forgot Password Link */}
          <div style={{ 
            marginTop: '1.35rem', 
            textAlign: 'center'
          }}>
            <span
              onClick={() => navigate('/reg-desk/forgot-password')}
              style={{
                fontSize: '0.82rem',
                color: '#059669',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem'
              }}
            >
              <KeyRound size={14} /> Forgot Password? (Verify via OTP)
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};
