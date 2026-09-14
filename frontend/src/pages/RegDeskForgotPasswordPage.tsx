import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { KeyRound, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';

export const RegDeskForgotPasswordPage: React.FC = () => {
  const [deskIdOrEmail, setDeskIdOrEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!deskIdOrEmail || deskIdOrEmail.trim() === '') {
      setError('Please enter your Registration Desk ID or registered email.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/reg-desk/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ deskIdOrEmail: deskIdOrEmail.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send recovery instructions.');
      }

      setSuccess(data.message || 'Password reset instructions have been dispatched to your registered email.');
      setDeskIdOrEmail('');
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
            <KeyRound size={28} />
          </div>
          <h2>Desk Password Recovery</h2>
          <p>Retrieve access to the Registration Desk</p>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        {success ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ color: 'var(--primary)', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
              <CheckCircle2 size={48} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>Check Your Email</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '1.75rem' }}>
              {success}
            </p>
            <Link 
              to="/reg-desk/login" 
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <ArrowLeft size={16} /> Return to Desk Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="deskIdOrEmail">Desk ID or Registered Email</label>
              <input
                type="text"
                id="deskIdOrEmail"
                required
                className="form-control"
                placeholder="e.g. REG-DESK-01 or coordinator@email.com"
                value={deskIdOrEmail}
                onChange={(e) => setDeskIdOrEmail(e.target.value)}
              />
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
                gap: '0.5rem'
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="spinner-icon" size={16} /> Sending Instructions...
                </>
              ) : (
                'Send Recovery Link'
              )}
            </button>

            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <Link to="/reg-desk/login" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 500 }}>
                <ArrowLeft size={14} /> Back to Desk Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
