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
    <div className="admin-login-wrapper" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', backgroundColor: '#0f172a' }}>
      <div className="admin-login-card card" style={{ maxWidth: '440px', width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '1rem', padding: '2.5rem', color: '#f8fafc', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>
        <div className="login-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div 
            style={{ 
              width: '3.75rem', 
              height: '3.75rem', 
              backgroundColor: 'rgba(56, 189, 248, 0.15)', 
              color: '#38bdf8', 
              borderRadius: '1rem', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 1.25rem auto',
              border: '1px solid rgba(56, 189, 248, 0.3)'
            }}
          >
            <KeyRound size={28} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>Desk Password Recovery</h2>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginTop: '0.35rem' }}>Retrieve access to the Registration Desk</p>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1.5rem', fontSize: '0.875rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: '#ef4444', color: '#fca5a5' }}>
            {error}
          </div>
        )}

        {success ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ color: '#10b981', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
              <CheckCircle2 size={48} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.5rem' }}>Check Your Email</h3>
            <p style={{ fontSize: '0.875rem', color: '#cbd5e1', lineHeight: '1.5', marginBottom: '1.75rem' }}>
              {success}
            </p>
            <Link 
              to="/reg-desk/login" 
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#0284c7', borderColor: '#0284c7', padding: '0.65rem 1.5rem', borderRadius: '0.5rem', textDecoration: 'none', color: '#ffffff', fontWeight: 600 }}
            >
              <ArrowLeft size={16} /> Return to Desk Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="deskIdOrEmail" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.5rem' }}>
                Desk ID or Registered Email
              </label>
              <input
                type="text"
                id="deskIdOrEmail"
                required
                className="form-control"
                placeholder="e.g. REG-DESK-01 or coordinator@email.com"
                value={deskIdOrEmail}
                onChange={(e) => setDeskIdOrEmail(e.target.value)}
                style={{
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  color: '#ffffff',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1rem',
                  width: '100%',
                  fontSize: '0.95rem'
                }}
              />
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting} 
              className="btn btn-primary" 
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                fontSize: '0.95rem', 
                fontWeight: 700, 
                backgroundColor: '#0284c7', 
                borderColor: '#0284c7',
                borderRadius: '0.5rem',
                color: '#ffffff',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '0.5rem',
                cursor: isSubmitting ? 'not-allowed' : 'pointer'
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
              <Link to="/reg-desk/login" style={{ color: '#94a3b8', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <ArrowLeft size={14} /> Back to Desk Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
