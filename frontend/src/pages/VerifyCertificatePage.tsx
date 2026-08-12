import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { Award, ShieldCheck, AlertCircle, ArrowLeft, Loader2, Landmark, Download, FileText } from 'lucide-react';

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
  const [isFocused, setIsFocused] = useState(false);

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

  // Get dynamic PDF link
  const getPdfUrl = (certId: string) => {
    return `${API_BASE_URL}/api/verify-certificate/${encodeURIComponent(certId)}/pdf`;
  };

  return (
    <div style={{
      minHeight: '90vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem 1.5rem',
      background: 'radial-gradient(circle at top, rgba(16, 185, 129, 0.08) 0%, rgba(99, 102, 241, 0.03) 50%, transparent 100%)',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '800px', // Spacious layout for the real PDF certificate preview
        background: 'var(--bg-card, #ffffff)',
        borderRadius: '24px',
        boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.08), 0 0 1px 0 rgba(0, 0, 0, 0.1)',
        border: '1px solid var(--border, #e2e8f0)',
        overflow: 'hidden',
        transition: 'all 0.3s ease'
      }}>
        {/* Top Decorative Header */}
        <div style={{
          background: 'linear-gradient(135deg, #090d16 0%, #1e1b4b 50%, #0f172a 100%)',
          padding: '2.5rem 2rem',
          textAlign: 'center',
          position: 'relative',
          borderBottom: '4px solid var(--primary, #10b981)'
        }}>
          {/* Subtle grid pattern overlay */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.05,
            backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
            backgroundSize: '16px 16px',
            pointerEvents: 'none'
          }} />

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            color: 'var(--primary, #10b981)',
            marginBottom: '1rem',
            boxShadow: '0 0 25px rgba(16, 185, 129, 0.25)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            position: 'relative',
            zIndex: 2
          }}>
            <Award size={30} />
          </div>
          <h2 style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: '1.75rem',
            fontWeight: 800,
            margin: '0 0 0.5rem 0',
            letterSpacing: '-0.02em',
            color: '#ffffff',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
            position: 'relative',
            zIndex: 2
          }}>
            Credential Verification Portal
          </h2>
          <p style={{
            margin: 0,
            fontSize: '0.925rem',
            color: '#cbd5e1',
            lineHeight: 1.5,
            maxWidth: '520px',
            marginLeft: 'auto',
            marginRight: 'auto',
            position: 'relative',
            zIndex: 2
          }}>
            Verify and validate authentic R&D academic credentials, certifications, and event achievements issued by Trinity College of Engineering & Technology.
          </p>
        </div>

        {/* Form and Results Section */}
        <div style={{ padding: '2.5rem' }}>
          <form onSubmit={handleSubmit} style={{ marginBottom: '2.25rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.8125rem',
              fontWeight: 700,
              color: 'var(--text-secondary, #334155)',
              marginBottom: '0.625rem',
              letterSpacing: '0.05em',
              textTransform: 'uppercase'
            }}>
              Certificate Reference Number
            </label>
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              backgroundColor: 'var(--bg-main, #f8fafc)',
              padding: '0.375rem',
              borderRadius: '14px',
              border: isFocused ? '2px solid var(--primary, #10b981)' : '2px solid var(--border, #e2e8f0)',
              boxShadow: isFocused ? '0 0 0 4px rgba(16, 185, 129, 0.1)' : 'none',
              transition: 'all 0.2s ease',
              alignItems: 'center'
            }}>
              <input
                type="text"
                value={certificateId}
                onChange={(e) => setCertificateId(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="TCEK/RD/2026/0001"
                style={{
                  flex: 1,
                  padding: '0.625rem 0.875rem',
                  fontSize: '1.0625rem',
                  borderRadius: '10px',
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontFamily: 'monospace',
                  fontWeight: 600,
                  color: 'var(--text-main, #0f172a)'
                }}
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  padding: '0.75rem 1.75rem',
                  fontSize: '0.9375rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  borderRadius: '10px',
                  backgroundColor: 'var(--primary, #10b981)',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = 'var(--primary-hover, #059669)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = 'var(--primary, #10b981)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Checking...
                  </>
                ) : (
                  'Verify'
                )}
              </button>
            </div>
          </form>

          {/* Verification Status */}
          {isLoading && (
            <div style={{ textAlign: 'center', padding: '3rem 0' }}>
              <Loader2 size={42} className="animate-spin" style={{ color: 'var(--primary, #10b981)', margin: '0 auto 1.25rem auto' }} />
              <p style={{ color: 'var(--text-muted, #64748b)', margin: 0, fontWeight: 500 }}>
                Querying database archives and compiling original certificate PDF...
              </p>
            </div>
          )}

          {error && searched && !isLoading && (
            <div style={{
              background: 'linear-gradient(to right, #fef2f2, #fff5f5)',
              border: '1px solid #fee2e2',
              borderRadius: '16px',
              padding: '1.75rem',
              display: 'flex',
              gap: '1.25rem',
              alignItems: 'flex-start',
              animation: 'fadeIn 0.3s ease',
              boxShadow: '0 4px 15px rgba(239, 68, 68, 0.04)'
            }}>
              <div style={{
                backgroundColor: '#fee2e2',
                color: '#ef4444',
                padding: '0.5rem',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <AlertCircle size={24} />
              </div>
              <div>
                <h4 style={{ margin: '0 0 0.375rem 0', color: '#991b1b', fontWeight: 700, fontFamily: "'Outfit', sans-serif", fontSize: '1.0625rem' }}>
                  Verification Failed
                </h4>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#ef4444', lineHeight: 1.5, fontWeight: 500 }}>
                  {error}
                </p>
                <div style={{
                  marginTop: '0.75rem',
                  fontSize: '0.8125rem',
                  color: '#991b1b',
                  opacity: 0.8,
                  lineHeight: 1.4
                }}>
                  Ensure the Reference Number is typed exactly as it appears on the certificate (e.g. capitalized, proper slashes).
                </div>
              </div>
            </div>
          )}

          {verifiedData && !isLoading && (
            <div style={{ animation: 'fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
              {/* Verified Badge */}
              <div style={{
                background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                border: '1px solid #a7f3d0',
                borderRadius: '16px',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1.5rem',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.06)'
              }}>
                <div style={{
                  backgroundColor: '#34d399',
                  color: '#ffffff',
                  padding: '0.45rem',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 4px 10px rgba(52, 211, 153, 0.3)'
                }}>
                  <ShieldCheck size={22} />
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{
                    margin: '0 0 0.125rem 0',
                    color: '#065f46',
                    fontWeight: 800,
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: '1rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                  }}>
                    Authentic Credential Verified
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: '#047857', fontWeight: 500, lineHeight: 1.4 }}>
                    This certificate is an authentic document officially recorded in our secure digital database.
                  </p>
                </div>

                {/* Print/Download Button */}
                <a
                  href={getPdfUrl(verifiedData.certificateId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '0.625rem 1.25rem',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    borderRadius: '8px',
                    backgroundColor: '#10b981',
                    color: '#ffffff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    textDecoration: 'none',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.15)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <Download size={14} /> Download PDF
                </a>
              </div>

              {/* Real PDF Certificate Viewer */}
              <div style={{
                position: 'relative',
                borderRadius: '16px',
                overflow: 'hidden',
                border: '2px solid rgba(16, 185, 129, 0.15)',
                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.04)',
                backgroundColor: '#f8fafc',
                marginBottom: '2rem',
                aspectRatio: '1.414', // Fits standard A4 certificate landscape aspect ratio!
                width: '100%'
              }}>
                <iframe
                  src={`${getPdfUrl(verifiedData.certificateId)}#toolbar=1`}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    display: 'block'
                  }}
                  title={`Official Certificate for ${verifiedData.fullName}`}
                />
              </div>

              {/* Verified Metadata Summary */}
              <div style={{
                border: '1px dashed var(--border, #cbd5e1)',
                borderRadius: '14px',
                padding: '1.5rem',
                background: 'var(--bg-main, #f8fafc)'
              }}>
                <h3 style={{
                  margin: '0 0 1rem 0',
                  fontSize: '0.9375rem',
                  fontWeight: 800,
                  fontFamily: "'Outfit', sans-serif",
                  color: 'var(--text-main, #0f172a)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem'
                }}>
                  <FileText size={16} style={{ color: 'var(--primary, #10b981)' }} />
                  Record Metadata
                </h3>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem 1.25rem',
                  fontSize: '0.8125rem',
                  lineHeight: 1.4
                }}>
                  <div>
                    <span style={{ color: 'var(--text-muted, #64748b)', display: 'block', fontWeight: 600 }}>RECIPIENT NAME</span>
                    <strong style={{ color: 'var(--text-secondary, #1e293b)' }}>{verifiedData.fullName}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted, #64748b)', display: 'block', fontWeight: 600 }}>ROLL / PIN NUMBER</span>
                    <strong style={{ color: 'var(--text-secondary, #1e293b)', fontFamily: 'monospace' }}>{verifiedData.pinNumber}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted, #64748b)', display: 'block', fontWeight: 600 }}>DEPARTMENT / YEAR</span>
                    <strong style={{ color: 'var(--text-secondary, #1e293b)' }}>{verifiedData.branch} ({verifiedData.yearOfStudy})</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted, #64748b)', display: 'block', fontWeight: 600 }}>EVENT / ACHIEVEMENT</span>
                    <strong style={{ color: 'var(--text-secondary, #1e293b)' }}>{verifiedData.eventName} ({verifiedData.status})</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted, #64748b)', display: 'block', fontWeight: 600 }}>VALIDATION KEY</span>
                    <strong style={{ color: 'var(--text-secondary, #1e293b)', fontFamily: 'monospace' }}>{verifiedData.certificateId}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted, #64748b)', display: 'block', fontWeight: 600 }}>ISSUE TIMESTAMP</span>
                    <strong style={{ color: 'var(--text-secondary, #1e293b)' }}>
                      {new Date(verifiedData.issuedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Default State guidance */}
          {!searched && (
            <div style={{
              textAlign: 'center',
              padding: '2.5rem 2rem',
              border: '2px dashed var(--border, #cbd5e1)',
              borderRadius: '16px',
              color: 'var(--text-muted, #64748b)',
              fontSize: '0.9375rem',
              lineHeight: 1.6,
              background: 'var(--bg-main, #f8fafc)'
            }}>
              <Landmark size={36} style={{ color: 'var(--text-muted, #94a3b8)', marginBottom: '0.75rem' }} />
              <p style={{ margin: 0, fontWeight: 500 }}>
                Enter the unique certificate Reference Number to verify award validity, recipient information, and specific event participation parameters directly from our secure collegiate records.
              </p>
            </div>
          )}
        </div>

        {/* Back Link */}
        <div style={{
          padding: '1.5rem 2.5rem',
          borderTop: '1px solid var(--border, #e2e8f0)',
          backgroundColor: 'var(--bg-subtle, #f8fafc)',
          textAlign: 'center'
        }}>
          <Link
            to="/"
            style={{
              fontSize: '0.9375rem',
              color: 'var(--secondary, #4f46e5)',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = 'var(--secondary-hover, #4338ca)';
              e.currentTarget.style.transform = 'translateX(-2px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = 'var(--secondary, #4f46e5)';
              e.currentTarget.style.transform = 'translateX(0)';
            }}
          >
            <ArrowLeft size={16} /> Return to Home Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};
