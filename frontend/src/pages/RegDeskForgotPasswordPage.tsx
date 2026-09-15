import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { KeyRound, Loader2, ArrowLeft, CheckCircle2, Eye, EyeOff, ShieldCheck, Mail, RefreshCw } from 'lucide-react';

type Step = 'EMAIL' | 'OTP' | 'PASSWORD' | 'SUCCESS';

export const RegDeskForgotPasswordPage: React.FC = () => {
  // Multi-step state
  const [step, setStep] = useState<Step>('EMAIL');

  // Form fields
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI status
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Resend cooldown timer
  const [resendCooldown, setResendCooldown] = useState(0);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (resendCooldown > 0) {
      timerRef.current = setTimeout(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resendCooldown]);

  // Step 1: Send OTP to registered email
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setSuccess('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || email.trim() === '' || !emailRegex.test(email.trim())) {
      setError('Please enter a valid registered email address.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/reg-desk/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send verification code.');
      }

      setSuccess(data.message || 'Verification code has been sent to your email.');
      setStep('OTP');
      setResendCooldown(30);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const cleanOtp = otp.trim();
    if (!cleanOtp || !/^\d{6}$/.test(cleanOtp)) {
      setError('Please enter the 6-digit numeric verification code.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/reg-desk/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp: cleanOtp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid verification code.');
      }

      setResetToken(data.resetToken);
      setSuccess('');
      setStep('PASSWORD');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 3: Set New Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/reg-desk/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToken, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update password.');
      }

      setSuccess('Password has been successfully updated.');
      setStep('SUCCESS');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-login-wrapper">
      <div className="admin-login-card card">
        <div className="login-header">
          <div className="login-header-logo">
            {step === 'PASSWORD' || step === 'SUCCESS' ? (
              <ShieldCheck size={28} />
            ) : (
              <KeyRound size={28} />
            )}
          </div>
          <h2>Desk Password Recovery</h2>
          <p>
            {step === 'EMAIL' && 'Enter your registered email to receive an OTP'}
            {step === 'OTP' && 'Verify the 6-digit code sent to your email'}
            {step === 'PASSWORD' && 'Establish a new password for your desk account'}
            {step === 'SUCCESS' && 'Desk access successfully restored'}
          </p>
        </div>

        {/* Step progress indicator */}
        {step !== 'SUCCESS' && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '0.2rem 0.6rem',
                borderRadius: '9999px',
                background: step === 'EMAIL' ? 'var(--primary, #0284c7)' : 'rgba(255,255,255,0.08)',
                color: step === 'EMAIL' ? '#ffffff' : 'var(--text-muted, #94a3b8)'
              }}
            >
              1. Email
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '0.2rem 0.6rem',
                borderRadius: '9999px',
                background: step === 'OTP' ? 'var(--primary, #0284c7)' : 'rgba(255,255,255,0.08)',
                color: step === 'OTP' ? '#ffffff' : 'var(--text-muted, #94a3b8)'
              }}
            >
              2. Verify OTP
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '0.2rem 0.6rem',
                borderRadius: '9999px',
                background: step === 'PASSWORD' ? 'var(--primary, #0284c7)' : 'rgba(255,255,255,0.08)',
                color: step === 'PASSWORD' ? '#ffffff' : 'var(--text-muted, #94a3b8)'
              }}
            >
              3. New Password
            </span>
          </div>
        )}

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1.25rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        {success && step !== 'SUCCESS' && (
          <div className="alert alert-success" style={{ marginBottom: '1.25rem', fontSize: '0.875rem' }}>
            {success}
          </div>
        )}

        {/* STEP 1: Email Input */}
        {step === 'EMAIL' && (
          <form onSubmit={handleSendOtp}>
            <div className="form-group">
              <label htmlFor="desk-recovery-email">Registered Email Address</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="email"
                  id="desk-recovery-email"
                  required
                  autoFocus
                  className="form-control"
                  placeholder="coordinator@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: '2.5rem', width: '100%' }}
                />
                <Mail
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '0.85rem',
                    color: 'var(--text-muted, #94a3b8)',
                    pointerEvents: 'none',
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{
                width: '100%',
                marginTop: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="spinner-icon" size={16} /> Sending Verification Code...
                </>
              ) : (
                'Send Verification Code'
              )}
            </button>
          </form>
        )}

        {/* STEP 2: OTP Entry & Verification */}
        {step === 'OTP' && (
          <form onSubmit={handleVerifyOtp}>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                Enter the 6-digit code sent to:
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                <strong style={{ color: 'var(--text-main, #ffffff)', fontSize: '0.9rem' }}>{email}</strong>
                <button
                  type="button"
                  onClick={() => {
                    setStep('EMAIL');
                    setError('');
                    setSuccess('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary, #0284c7)',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: 0,
                  }}
                >
                  Change
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="desk-otp" style={{ textAlign: 'center', display: 'block' }}>
                6-Digit Verification Code
              </label>
              <input
                type="text"
                id="desk-otp"
                required
                autoFocus
                maxLength={6}
                className="form-control"
                placeholder="123456"
                value={otp}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setOtp(val);
                }}
                style={{
                  textAlign: 'center',
                  fontSize: '1.75rem',
                  letterSpacing: '0.5rem',
                  fontWeight: 700,
                  fontFamily: 'monospace',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || otp.trim().length !== 6}
              className="btn btn-primary"
              style={{
                width: '100%',
                marginTop: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="spinner-icon" size={16} /> Verifying Code...
                </>
              ) : (
                'Verify Code'
              )}
            </button>

            <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
              {resendCooldown > 0 ? (
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Resend code in <strong style={{ color: 'var(--text-main)' }}>{resendCooldown}s</strong>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSendOtp()}
                  disabled={isSubmitting}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary, #0284c7)',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    fontWeight: 500,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <RefreshCw size={14} /> Resend Verification Code
                </button>
              )}
            </div>
          </form>
        )}

        {/* STEP 3: Password Creation */}
        {step === 'PASSWORD' && (
          <form onSubmit={handleResetPassword}>
            <div className="form-group">
              <label htmlFor="desk-new-password">New Desk Password</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="desk-new-password"
                  required
                  autoFocus
                  className="form-control"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ paddingRight: '2.5rem', width: '100%' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted, #94a3b8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label htmlFor="desk-confirm-password">Confirm New Password</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="desk-confirm-password"
                  required
                  className="form-control"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ paddingRight: '2.5rem', width: '100%' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted, #94a3b8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                  }}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{
                width: '100%',
                marginTop: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="spinner-icon" size={16} /> Updating Password...
                </>
              ) : (
                'Update Password'
              )}
            </button>
          </form>
        )}

        {/* STEP 4: Success State */}
        {step === 'SUCCESS' && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem', color: 'var(--primary, #0284c7)' }}>
              <CheckCircle2 size={56} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              Password Updated!
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '1.75rem' }}>
              Your Registration Desk password has been successfully reset. You can now use your new password to sign in.
            </p>
            <Link
              to="/reg-desk/login"
              className="btn btn-primary"
              style={{
                width: '100%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                textDecoration: 'none',
              }}
            >
              <ArrowLeft size={16} /> Return to Desk Sign In
            </Link>
          </div>
        )}

        {/* Return to Desk Sign In for steps 1-3 */}
        {step !== 'SUCCESS' && (
          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <Link
              to="/reg-desk/login"
              style={{
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontWeight: 500,
              }}
            >
              <ArrowLeft size={14} /> Back to Desk Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
