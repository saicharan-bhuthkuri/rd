import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { ClipboardCheck, Loader2, Eye, EyeOff, ShieldCheck, ArrowLeft } from 'lucide-react';

export const RegDeskLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [deskId, setDeskId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/reg-desk/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ deskId: deskId.trim(), password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed. Please check your credentials.');
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
    <div className="admin-login-wrapper">
      <div className="admin-login-card card">
        <div className="login-header">
          <div className="login-header-logo">
            <ClipboardCheck size={28} />
          </div>
          <h2>Registration Desk</h2>
          <p>Participant Check-in & Live Attendance Portal</p>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="deskId">Registration Desk ID</label>
            <input
              type="text"
              id="deskId"
              required
              className="form-control"
              placeholder="e.g. REG-DESK-01"
              value={deskId}
              onChange={(e) => setDeskId(e.target.value)}
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label htmlFor="password" style={{ margin: 0 }}>Password</label>
              <Link 
                to="/reg-desk/forgot-password" 
                style={{ fontSize: '0.8rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}
              >
                Forgot Password?
              </Link>
            </div>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                required
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                  padding: 0
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
              gap: '0.5rem'
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="spinner-icon" size={18} /> Signing In...
              </>
            ) : (
              <>
                <ShieldCheck size={18} /> Access Desk Dashboard
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 500 }}>
            <ArrowLeft size={14} /> Back to Site
          </Link>
          <Link to="/admin/login" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
            Main Admin Login &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
};
