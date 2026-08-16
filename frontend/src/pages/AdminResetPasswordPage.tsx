import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { KeyRound, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';

export const AdminResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError('Reset token is missing from the URL. Please request a new link.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password.');
      }

      setSuccess(data.message || 'Password has been reset successfully.');
      setPassword('');
      setConfirmPassword('');
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
          <h2>Reset Password</h2>
          <p>Establish your new administrator credential</p>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', color: '#22c55e' }}>
              <CheckCircle2 size={48} />
            </div>
            <div className="alert alert-success" style={{ marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              {success}
            </div>
            <button
              onClick={() => navigate('/admin/login')}
              className="btn btn-primary"
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              Proceed to Login Gateway
            </button>
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="new-password">New Password</label>
              <input
                type="password"
                id="new-password"
                required
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirm-password">Confirm Password</label>
              <input
                type="password"
                id="confirm-password"
                required
                className="form-control"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              {isSubmitting ? (
                <>
                  <Loader2 className="spinner-icon" size={16} /> Saving Password...
                </>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>
        )}

        {!success && (
          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <span
              onClick={() => navigate('/admin/login')}
              style={{ fontSize: '0.85rem', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
            >
              <ArrowLeft size={14} /> Back to Login Gateway
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
