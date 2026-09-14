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
    <div className="admin-login-wrapper" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', backgroundColor: '#0f172a' }}>
      <div className="admin-login-card card" style={{ maxWidth: '440px', width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '1rem', padding: '2.5rem', color: '#f8fafc', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)' }}>
        <div className="login-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div 
            style={{ 
              width: '4rem', 
              height: '4rem', 
              backgroundColor: 'rgba(14, 165, 233, 0.15)', 
              color: '#38bdf8', 
              borderRadius: '1rem', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 1.25rem auto',
              border: '1px solid rgba(56, 189, 248, 0.3)'
            }}
          >
            <ClipboardCheck size={32} />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>Registration Desk</h2>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginTop: '0.35rem' }}>Participant Check-in & Live Attendance Portal</p>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1.5rem', fontSize: '0.875rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: '#ef4444', color: '#fca5a5' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label htmlFor="deskId" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.5rem' }}>
              Registration Desk ID
            </label>
            <input
              type="text"
              id="deskId"
              required
              className="form-control"
              placeholder="e.g. REG-DESK-01"
              value={deskId}
              onChange={(e) => setDeskId(e.target.value)}
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

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label htmlFor="password" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1' }}>
                Password
              </label>
              <Link 
                to="/reg-desk/forgot-password" 
                style={{ fontSize: '0.8rem', color: '#38bdf8', textDecoration: 'none', fontWeight: 500 }}
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
                style={{
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  color: '#ffffff',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 2.75rem 0.75rem 1rem',
                  width: '100%',
                  fontSize: '0.95rem'
                }}
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
                  color: '#94a3b8',
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
              padding: '0.8rem', 
              fontSize: '1rem', 
              fontWeight: 700, 
              backgroundColor: '#0284c7', 
              borderColor: '#0284c7',
              borderRadius: '0.5rem',
              color: '#ffffff',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '0.5rem',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s'
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

        <div style={{ marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#94a3b8' }}>
          <Link to="/" style={{ color: '#94a3b8', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <ArrowLeft size={14} /> Back to Site
          </Link>
          <Link to="/admin/login" style={{ color: '#38bdf8', textDecoration: 'none' }}>
            Main Admin Login &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
};
