import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { Award, ShieldCheck, ArrowLeft, Loader2, ShieldAlert, CheckCircle, Download, Bookmark } from 'lucide-react';

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
  const navigate = useNavigate();
  const initialId = searchParams.get('id') || '';
  
  const [certificateId, setCertificateId] = useState(initialId);
  const [isLoading, setIsLoading] = useState(false);
  const [verifiedData, setVerifiedData] = useState<VerifiedData | null>(null);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const handleVerify = async (idToVerify: string) => {
    const cleanId = idToVerify.trim();
    if (!cleanId) {
      setError('Please enter a Certificate ID');
      return;
    }

    setIsLoading(true);
    setIsPdfLoading(true); // Reset PDF loading state for new queries
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

  useEffect(() => {
    if (initialId) {
      setTimeout(() => {
        handleVerify(initialId);
      }, 0);
    }
  }, [initialId]);

  // Track window resizing to apply mobile style adjustments
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ id: certificateId.trim() });
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  const getPdfUrl = (certId: string) => {
    return `${API_BASE_URL}/api/verify-certificate/${encodeURIComponent(certId)}/pdf`;
  };

  return (
    <div className="subpage-container container apply-subpage-container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      {/* Back button matching ApplyPage */}
      <button 
        onClick={handleBackToHome} 
        className="back-btn btn btn-secondary btn-sm" 
        style={{ marginBottom: '2.5rem' }}
      >
        <ArrowLeft size={16} /> Back to Homepage
      </button>

      {/* Split Layout matching ApplyPage */}
      <div className="apply-split-layout">
        
        {/* Left Column: Branding panel for verification */}
        <div className="apply-info-panel">
          <span className="badge">Security Ledger</span>
          <h1 className="apply-panel-title" style={{ marginTop: '0.5rem' }}>
            Verify Authentic R&D Credentials
          </h1>
          <p className="apply-panel-desc">
            Our public credential database allows companies, academic institutions, and coordinators to instantly verify the authenticity of certificates, achievement statuses, and participation records issued by the R&D Club.
          </p>

          <div className="apply-features-list">
            <div className="apply-feature-item">
              <div className="feature-icon-box">
                <ShieldCheck size={18} />
              </div>
              <div className="feature-item-text">
                <h4>Instant Validation</h4>
                <p>Query official college databases in real-time to check if a certificate reference number is genuine.</p>
              </div>
            </div>

            <div className="apply-feature-item">
              <div className="feature-icon-box text-emerald" style={{ color: 'var(--primary)' }}>
                <CheckCircle size={18} />
              </div>
              <div className="feature-item-text">
                <h4>Tamper-Proof Records</h4>
                <p>Verify critical metadata details including recipient name, department branch, year of study, and specific event status details.</p>
              </div>
            </div>

            <div className="apply-feature-item">
              <div className="feature-icon-box text-indigo" style={{ color: 'var(--secondary)' }}>
                <Award size={18} />
              </div>
              <div className="feature-item-text">
                <h4>Original Document Export</h4>
                <p>Download or print the exact high-fidelity PDF certificate with authorized signatures, identical to the issued copy.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Detailed form & verification card */}
        <div className="apply-form-panel">
          <div 
            className="form-container-card card" 
            style={{ 
              padding: isMobile ? '1.25rem' : '2.5rem', 
              width: '100%', 
              maxWidth: '100%',
              boxSizing: 'border-box'
            }}
          >
            
            <div className="form-header-row" style={{ marginBottom: '2rem', paddingBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Credential Validation</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                  Provide the Reference ID printed on the certificate footer.
                </p>
              </div>
            </div>

            {/* Form using theme styling with icon overlap fixed */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label 
                  htmlFor="certificateId" 
                  style={{
                    display: 'block',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    color: 'var(--text-secondary)',
                    marginBottom: '0.5rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                >
                  Certificate Reference Number <span className="req">*</span>
                </label>
                
                {/* Standardized input structure matching ApplyPage to avoid icon overlaps */}
                <div className="input-with-icon">
                  <Award size={16} />
                  <input
                    type="text"
                    id="certificateId"
                    required
                    placeholder="e.g. TCEK/RD/2026-A9B2E3F4"
                    value={certificateId}
                    onChange={(e) => setCertificateId(e.target.value)}
                    style={{
                      fontFamily: 'monospace',
                      fontWeight: 600
                    }}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isLoading} 
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '0.5rem' }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="spinner-icon animate-spin" size={16} /> Verifying...
                  </>
                ) : (
                  'Validate Credential'
                )}
              </button>
            </form>

            {/* Results display inside form container card */}
            {isLoading && (
              <div style={{ textAlign: 'center', padding: '3rem 0', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
                <Loader2 size={36} className="animate-spin" style={{ color: 'var(--primary)' }} />
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500, margin: 0 }}>
                  Compiling certificate security signatures...
                </p>
              </div>
            )}

            {error && searched && !isLoading && (
              <div style={{
                background: 'linear-gradient(to right, #fef2f2, #fff5f5)',
                border: '1px solid #fee2e2',
                borderRadius: '12px',
                padding: '1.25rem',
                display: 'flex',
                gap: '1rem',
                alignItems: 'flex-start',
                marginTop: '2rem',
                animation: 'modalFadeIn 0.2s ease-out'
              }}>
                <div style={{
                  backgroundColor: '#fee2e2',
                  color: '#ef4444',
                  padding: '0.375rem',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 0.25rem 0', color: '#991b1b', fontWeight: 700, fontSize: '0.9375rem' }}>
                    Invalid Certificate Code
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: '#ef4444', lineHeight: 1.4, fontWeight: 500 }}>
                    {error}
                  </p>
                </div>
              </div>
            )}

            {verifiedData && !isLoading && (
              <div style={{ marginTop: '2rem', animation: 'modalFadeIn 0.3s ease-out' }}>
                
                {/* Verified success notification banner (responsive flex flow to prevent horizontal overflow on mobile) */}
                <div style={{
                  background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                  border: '1px solid #a7f3d0',
                  borderRadius: '12px',
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  flexDirection: isMobile ? 'column' : 'row',
                  alignItems: isMobile ? 'stretch' : 'center',
                  textAlign: isMobile ? 'center' : 'left',
                  gap: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{
                    backgroundColor: '#34d399',
                    color: '#ffffff',
                    padding: '0.375rem',
                    borderRadius: '8px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    alignSelf: isMobile ? 'center' : 'auto',
                    flexShrink: 0
                  }}>
                    <ShieldCheck size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{
                      margin: '0 0 0.125rem 0',
                      color: '#065f46',
                      fontWeight: 800,
                      fontSize: '0.875rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em'
                    }}>
                      Authentic Certificate Verified
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#047857', fontWeight: 500 }}>
                      This credential represents an official R&D cell achievement.
                    </p>
                  </div>

                  <a
                    href={getPdfUrl(verifiedData.certificateId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                    style={{
                      padding: '0.5rem 1rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      borderRadius: '8px',
                      boxShadow: 'none',
                      gap: '0.25rem',
                      justifyContent: 'center'
                    }}
                  >
                    <Download size={12} /> Download PDF
                  </a>
                </div>

                {/* Real Dynamic PDF Certificate Viewer (Responsive scaling to prevent horizontal scroll overflow) */}
                <div style={{
                  position: 'relative',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-sm)',
                  backgroundColor: '#f8fafc',
                  marginBottom: '2rem',
                  width: '100%',
                  // If mobile, use a fixed height with NO aspect-ratio to keep it constrained to 100% width
                  aspectRatio: isMobile ? undefined : '16/9',
                  height: isMobile ? '240px' : 'auto',
                  minHeight: isMobile ? undefined : '380px'
                }}>
                  {/* Dynamic PDF loading spinner overlay */}
                  {isPdfLoading && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#f8fafc',
                      zIndex: 10,
                      gap: '0.75rem'
                    }}>
                      <Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary)' }} />
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                        Generating official PDF document...
                      </span>
                    </div>
                  )}

                  <iframe
                    src={`${getPdfUrl(verifiedData.certificateId)}#toolbar=0&navpanes=0&scrollbar=0&view=Fit&zoom=page-fit`}
                    onLoad={() => setIsPdfLoading(false)}
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 'none',
                      display: 'block',
                      overflow: 'hidden',
                      opacity: isPdfLoading ? 0 : 1, // Smooth reveal
                      transition: 'opacity 0.3s ease'
                    }}
                    scrolling="no"
                    title={`Official Certificate for ${verifiedData.fullName}`}
                  />
                </div>

                {/* Metadata Summary Grid */}
                <div style={{
                  border: '1px dashed var(--border)',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  background: 'var(--bg-main)'
                }}>
                  <h3 style={{
                    margin: '0 0 0.875rem 0',
                    fontSize: '0.875rem',
                    fontWeight: 800,
                    fontFamily: "'Outfit', sans-serif",
                    color: 'var(--text-main)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem'
                  }}>
                    <Bookmark size={14} style={{ color: 'var(--primary)' }} />
                    Credential Record Data
                  </h3>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '0.875rem 1rem',
                    fontSize: '0.75rem',
                    lineHeight: 1.4
                  }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>RECIPIENT NAME</span>
                      <strong style={{ color: 'var(--text-secondary)' }}>{verifiedData.fullName}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>ROLL / PIN NUMBER</span>
                      <strong style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{verifiedData.pinNumber}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>DEPARTMENT / YEAR</span>
                      <strong style={{ color: 'var(--text-secondary)' }}>{verifiedData.branch} ({verifiedData.yearOfStudy})</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>EVENT / ACHIEVEMENT</span>
                      <strong style={{ color: 'var(--text-secondary)' }}>{verifiedData.eventName} ({verifiedData.status})</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>VALIDATION KEY</span>
                      <strong style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{verifiedData.certificateId}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>ISSUE TIMESTAMP</span>
                      <strong style={{ color: 'var(--text-secondary)' }}>
                        {new Date(verifiedData.issuedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </strong>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* Default state instructions */}
            {!searched && (
              <div style={{
                textAlign: 'center',
                padding: '2.5rem 1.5rem',
                border: '2px dashed var(--border)',
                borderRadius: '12px',
                color: 'var(--text-muted)',
                fontSize: '0.875rem',
                lineHeight: 1.5,
                background: 'var(--bg-main)',
                marginTop: '2rem'
              }}>
                <ShieldCheck size={32} style={{ color: 'var(--text-muted)', marginBottom: '0.75rem', opacity: 0.7 }} />
                <p style={{ margin: 0, fontWeight: 500 }}>
                  Enter the unique certificate Reference ID code to verify its authenticity, recipient record parameters, and load the dynamic signature copy directly.
                </p>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};
