import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { Award, ShieldCheck, AlertCircle, Calendar, User, BookOpen, ArrowLeft, Loader2, Landmark } from 'lucide-react';

interface VerifiedData {
  id: number;
  fullName: string;
  pinNumber: string;
  email: string;
  branch: string;
  yearOfStudy: string;
  section?: string;
  eventName: string;
  status: string;
  certificateId: string;
  eventDate: string;
  issuedAt: string;
}

export const VerifyCertificatePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialId = searchParams.get('id') || '';
  
  const [certificateId, setCertificateId] = useState(initialId);
  const [isLoading, setIsLoading] = useState(false);
  const [verifiedData, setVerifiedData] = useState<VerifiedData | null>(null);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (initialId) {
      handleVerify(initialId);
    }
  }, [initialId]);

  const handleVerify = async (idToVerify: string) => {
    const cleanId = idToVerify.trim();
    if (!cleanId) {
      setError('Please enter a Certificate ID');
      return;
    }

    setIsLoading(true);
    setError('');
    setVerifiedData(null);
    setSearched(true);

    try {
      // URL encode the certificate ID since it contains slashes (e.g., TCEK/RD/2026/0001)
      const encodedId = encodeURIComponent(cleanId);
      const res = await fetch(`${API_BASE_URL}/api/verify-certificate/${encodedId}`);
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to verify certificate');
      }

      setVerifiedData(result.data);
    } catch (err: any) {
      setError(err.message || 'Verification failed. Certificate ID may be invalid or unissued.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ id: certificateId.trim() });
  };

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      background: 'radial-gradient(circle at top, rgba(99, 102, 241, 0.05) 0%, transparent 60%)',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '640px',
        background: 'var(--card-bg, #fff)',
        borderRadius: '16px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
        border: '1px solid var(--border-color, #e2e8f0)',
        overflow: 'hidden',
        transition: 'all 0.3s ease'
      }}>
        {/* Top Decorative Header */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#fff',
          padding: '2.5rem 2rem',
          textAlign: 'center',
          position: 'relative'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: 'rgba(99, 102, 241, 0.15)',
            color: '#818cf8',
            marginBottom: '1rem',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.2)'
          }}>
            <Award size={32} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 0.5rem 0', letterSpacing: '-0.025em' }}>
            Credential Verification
          </h2>
          <p style={{ margin: 0, fontSize: '0.9375rem', color: '#94a3b8' }}>
            Verify the authenticity of academic & research certifications issued by Trinity College R&D Cell
          </p>
        </div>

        {/* Form and Results Section */}
        <div style={{ padding: '2.5rem 2rem' }}>
          <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--text-secondary, #475569)',
              marginBottom: '0.5rem'
            }}>
              Certificate ID / Reference Number
            </label>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <input
                type="text"
                value={certificateId}
                onChange={(e) => setCertificateId(e.target.value)}
                placeholder="e.g., TCEK/RD/2026/0001"
                style={{
                  flex: 1,
                  minWidth: '240px',
                  padding: '0.75rem 1rem',
                  fontSize: '1rem',
                  borderRadius: '8px',
                  border: '2px solid var(--border-color, #cbd5e1)',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  fontFamily: 'monospace'
                }}
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary"
                style={{
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  height: '100%',
                  cursor: 'pointer'
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify'
                )}
              </button>
            </div>
          </form>

          {/* Verification Status */}
          {isLoading && (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <Loader2 size={40} className="animate-spin" style={{ color: 'var(--primary)', margin: '0 auto 1rem auto' }} />
              <p style={{ color: 'var(--text-muted, #64748b)', margin: 0 }}>Validating digital credentials against edge ledger...</p>
            </div>
          )}

          {error && searched && !isLoading && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fee2e2',
              borderRadius: '8px',
              padding: '1.5rem',
              display: 'flex',
              gap: '1rem',
              alignItems: 'flex-start'
            }}>
              <AlertCircle size={24} style={{ color: '#ef4444', flexShrink: 0 }} />
              <div>
                <h4 style={{ margin: '0 0 0.25rem 0', color: '#991b1b', fontWeight: 600 }}>Verification Failed</h4>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#991b1b' }}>{error}</p>
                <div style={{ marginTop: '0.75rem', fontSize: '0.8125rem', color: '#7f1d1d' }}>
                  Please verify that the Certificate ID has been input correctly, including capitalization and slashes.
                </div>
              </div>
            </div>
          )}

          {verifiedData && !isLoading && (
            <div style={{ animation: 'fadeIn 0.4s ease' }}>
              {/* Verified Badge */}
              <div style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                padding: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '2rem',
                boxShadow: '0 4px 12px rgba(34, 197, 94, 0.05)'
              }}>
                <ShieldCheck size={28} style={{ color: '#22c55e', flexShrink: 0 }} />
                <div>
                  <h4 style={{ margin: '0 0 0.125rem 0', color: '#166534', fontWeight: 700, fontSize: '0.9375rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Authentic Credential Verified
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: '#15803d' }}>
                    This certificate is validly registered in Trinity College R&D Cell's archives.
                  </p>
                </div>
              </div>

              {/* Certificate Details Card */}
              <div style={{
                border: '1px dashed var(--border-color, #cbd5e1)',
                borderRadius: '12px',
                padding: '2rem 1.5rem',
                background: 'linear-gradient(to bottom right, var(--bg-primary, #f8fafc), var(--bg-secondary, #f1f5f9))',
                position: 'relative'
              }}>
                {/* Background Watermark */}
                <Landmark size={120} style={{
                  position: 'absolute',
                  right: '1.5rem',
                  bottom: '1.5rem',
                  opacity: 0.03,
                  color: 'var(--text-secondary, #475569)',
                  pointerEvents: 'none'
                }} />

                <h3 style={{
                  margin: '0 0 1.5rem 0',
                  fontSize: '1.125rem',
                  fontWeight: 700,
                  color: 'var(--text-primary, #1e293b)',
                  borderBottom: '1px solid var(--border-color, #e2e8f0)',
                  paddingBottom: '0.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>Certificate Metadata</span>
                  <span style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted, #64748b)',
                    fontFamily: 'monospace',
                    fontWeight: 500,
                    marginLeft: 'auto'
                  }}>{verifiedData.certificateId}</span>
                </h3>

                <div style={{ display: 'grid', gap: '1.25rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                  {/* Recipient */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', marginBottom: '0.25rem', fontWeight: 600 }}>
                      <User size={14} /> RECIPIENT NAME
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
                      {verifiedData.fullName}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary, #475569)', marginTop: '0.125rem' }}>
                      PIN: {verifiedData.pinNumber}
                    </div>
                  </div>

                  {/* Academic Profile */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', marginBottom: '0.25rem', fontWeight: 600 }}>
                      <BookOpen size={14} /> ACADEMIC PROFILE
                    </div>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary, #334155)' }}>
                      {verifiedData.branch}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary, #475569)', marginTop: '0.125rem' }}>
                      Year of Study: {verifiedData.yearOfStudy}
                      {verifiedData.section && ` | Sec: ${verifiedData.section}`}
                    </div>
                  </div>

                  {/* Event Details */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', marginBottom: '0.25rem', fontWeight: 600 }}>
                      <Landmark size={14} /> EVENT / DISPATCH
                    </div>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--primary, #6366f1)' }}>
                      {verifiedData.eventName}
                    </div>
                  </div>

                  {/* Credential Status */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', marginBottom: '0.25rem', fontWeight: 600 }}>
                      <Award size={14} /> INVOLVEMENT ROLE
                    </div>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#6366f1',
                      backgroundColor: 'rgba(99, 102, 241, 0.08)',
                      padding: '0.25rem 0.625rem',
                      borderRadius: '9999px',
                      display: 'inline-block',
                      marginTop: '0.125rem'
                    }}>
                      {verifiedData.status}
                    </span>
                  </div>

                  {/* Dates */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', marginBottom: '0.25rem', fontWeight: 600 }}>
                      <Calendar size={14} /> ISSUE & EVENT DATE
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary, #334155)' }}>
                      {verifiedData.eventDate}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', marginTop: '0.125rem' }}>
                      Verified Dispatch: {new Date(verifiedData.issuedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Default State guidance */}
          {!searched && (
            <div style={{
              textAlign: 'center',
              padding: '1.5rem',
              border: '1px dashed var(--border-color, #cbd5e1)',
              borderRadius: '8px',
              color: 'var(--text-muted, #64748b)',
              fontSize: '0.875rem'
            }}>
              Enter a certificate identification key to verify its authenticity, recipient details, and event parameters directly from our secure student registry database.
            </div>
          )}
        </div>

        {/* Back Link */}
        <div style={{
          padding: '1.25rem 2rem',
          borderTop: '1px solid var(--border-color, #e2e8f0)',
          backgroundColor: 'var(--bg-secondary, #f8fafc)',
          textAlign: 'center'
        }}>
          <Link
            to="/"
            style={{
              fontSize: '0.875rem',
              color: 'var(--primary, #6366f1)',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem'
            }}
          >
            <ArrowLeft size={16} /> Back to Home Page
          </Link>
        </div>
      </div>
    </div>
  );
};
