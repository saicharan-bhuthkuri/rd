import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Users, 
  LogOut, 
  Sparkles, 
  Calendar, 
  ClipboardList, 
  Layers, 
  Menu, 
  Code, 
  Award, 
  HeartHandshake, 
  FolderUp, 
  ChevronLeft, 
  UserCheck, 
  DoorOpen,
  ClipboardCheck,
  Mail
} from 'lucide-react';
import { API_BASE_URL } from '../config';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Persistent sidebar open/close state
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    try {
      const saved = localStorage.getItem('admin_sidebar_open');
      if (saved !== null) {
        return saved === 'true';
      }
    } catch (e) {}
    // Default open on desktop (>= 1024px), closed on mobile/tablet (< 1024px)
    return typeof window !== 'undefined' ? window.innerWidth >= 1024 : true;
  });
  
  const toggleSidebar = () => {
    setIsSidebarOpen(prev => {
      const next = !prev;
      try {
        localStorage.setItem('admin_sidebar_open', String(next));
      } catch (e) {}
      return next;
    });
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
    try {
      localStorage.setItem('admin_sidebar_open', 'false');
    } catch (e) {}
  };

  // Close sidebar on mobile navigation change
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname]);

  // Check auth for either admin or reg desk user
  const adminUser = JSON.parse(localStorage.getItem('admin_user') || '{}');
  const regDeskUser = JSON.parse(localStorage.getItem('reg_desk_user') || '{}');
  const isAdmin = !!adminUser.username;
  const isRegDesk = !!regDeskUser.deskId;
  const role = adminUser.role || (isRegDesk ? 'reg_desk' : '');

  const displayName = isAdmin 
    ? (adminUser.name || adminUser.username || 'Admin') 
    : (regDeskUser.name || regDeskUser.deskId || 'Registration Desk');

  const displayRole = isAdmin
    ? (adminUser.role ? String(adminUser.role).replace('_', ' ') : 'Administrator')
    : (regDeskUser.deskId ? `Desk: ${regDeskUser.deskId}` : 'Reg Desk Staff');

  const roleBadgeColor = (role === 'developer' || role === 'superadmin')
    ? '#4338ca'
    : role === 'reg_desk'
    ? '#047857'
    : '#0369a1';

  const roleBadgeBg = (role === 'developer' || role === 'superadmin')
    ? '#e0e7ff'
    : role === 'reg_desk'
    ? '#ecfdf5'
    : '#e0f2fe';

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      if (token) {
        await fetch(`${API_BASE_URL}/api/admin/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      localStorage.removeItem('reg_desk_token');
      localStorage.removeItem('reg_desk_user');
      if (isRegDesk && !isAdmin) {
        navigate('/reg-desk/login');
      } else {
        navigate('/admin/login');
      }
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path ? 'active' : '';
  };

  const isRegDeskPage = location.pathname.startsWith('/reg-desk');

  return (
    <div className="admin-container">
      {/* Mobile / Drawer Backdrop */}
      {isSidebarOpen && (
        <div 
          className="admin-sidebar-overlay mobile-sidebar-backdrop"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar (supports open and closed states) */}
      <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="admin-sidebar-header">
          <div className="admin-brand">
            <span className="brand-dot"></span>
            <span>{isRegDeskPage ? 'Registration Desk' : 'Admin Console'}</span>
          </div>
          <button 
            className="admin-sidebar-close-btn" 
            onClick={toggleSidebar}
            title="Collapse Sidebar"
            aria-label="Collapse Sidebar"
          >
            <ChevronLeft size={18} />
          </button>
        </div>

        {isRegDeskPage && regDeskUser.deskId && (
          <div style={{ padding: '0.5rem 1.25rem 0.25rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span>Active Desk:</span>
            <span style={{ fontWeight: 700, color: 'var(--primary)', backgroundColor: 'var(--primary-light)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
              {regDeskUser.deskId}
            </span>
          </div>
        )}

        <nav className="admin-nav">
          {isRegDeskPage ? (
            /* SEPARATE DASHBOARD FOR REG-DESK: ONLY SHOW ATTENDANCE DESK */
            <>
              <Link to="/reg-desk/dashboard" className={`admin-nav-item ${isActive('/reg-desk/dashboard')}`}>
                <ClipboardCheck size={18} />
                <span>Attendance Desk</span>
              </Link>
            </>
          ) : (
            /* MAIN ADMIN CONSOLE SIDEBAR */
            <>
              <Link to="/admin/club" className={`admin-nav-item ${isActive('/admin/club')}`}>
                <Sparkles size={18} />
                <span>Club Membership</span>
              </Link>

              <Link to="/admin/volunteers" className={`admin-nav-item ${isActive('/admin/volunteers')}`}>
                <HeartHandshake size={18} />
                <span>Volunteers</span>
              </Link>

              <Link to="/admin/events" className={`admin-nav-item ${isActive('/admin/events')}`}>
                <ClipboardList size={18} />
                <span>Event Registration</span>
              </Link>

              <Link to="/admin/recognition" className={`admin-nav-item ${isActive('/admin/recognition')}`}>
                <Award size={18} />
                <span>Judge Recognition</span>
              </Link>

              <Link to="/admin/hackathons" className={`admin-nav-item ${isActive('/admin/hackathons')}`}>
                <Code size={18} />
                <span>Hackathon Registration</span>
              </Link>

              <Link to="/admin/submissions" className={`admin-nav-item ${isActive('/admin/submissions')}`}>
                <FolderUp size={18} />
                <span>Project Submissions</span>
              </Link>

              <Link to="/admin/events/manage" className={`admin-nav-item ${isActive('/admin/events/manage')}`}>
                <Calendar size={18} />
                <span>Manage Events</span>
              </Link>

              <Link to="/admin/messaging" className={`admin-nav-item ${isActive('/admin/messaging')}`}>
                <Mail size={18} />
                <span>Event Messaging</span>
              </Link>

              <Link to="/admin/branches" className={`admin-nav-item ${isActive('/admin/branches')}`}>
                <Layers size={18} />
                <span>Manage Branches</span>
              </Link>

              <Link to="/admin/reg-desk" className={`admin-nav-item ${isActive('/admin/reg-desk')}`}>
                <UserCheck size={18} />
                <span>Registration Desk</span>
              </Link>

              <Link to="/admin/rooms" className={`admin-nav-item ${isActive('/admin/rooms')}`}>
                <DoorOpen size={18} />
                <span>Registration Rooms</span>
              </Link>

              {(role === 'developer' || role === 'superadmin') && (
                <Link to="/admin/users" className={`admin-nav-item ${isActive('/admin/users')}`}>
                  <Users size={18} />
                  <span>Manage Admins</span>
                </Link>
              )}
            </>
          )}

          <hr className="admin-nav-divider" />

          {/* Premium User Profile Dock */}
          {(isAdmin || isRegDesk) && (
            <div style={{
              margin: '0.65rem 0.65rem 0.5rem 0.65rem',
              padding: '0.75rem 0.85rem',
              borderRadius: '12px',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 6px -1px rgba(0, 0, 0, 0.05), 0 1px 4px -1px rgba(0, 0, 0, 0.03)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              transition: 'all 0.15s ease'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0, flex: 1 }}>
                {/* Avatar with Status Ring */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: role === 'reg_desk' 
                      ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)' 
                      : (role === 'developer' 
                        ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' 
                        : 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)'),
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.875rem',
                    letterSpacing: '0.04em',
                    boxShadow: role === 'reg_desk'
                      ? '0 3px 8px rgba(5, 150, 105, 0.25)'
                      : (role === 'developer'
                        ? '0 3px 8px rgba(79, 70, 229, 0.25)'
                        : '0 3px 8px rgba(2, 132, 199, 0.25)')
                  }}>
                    {displayName.slice(0, 2).toUpperCase()}
                  </div>
                  {/* Active Online Pulse Dot */}
                  <div style={{
                    position: 'absolute',
                    bottom: '0px',
                    right: '0px',
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: '#10b981',
                    border: '2px solid #ffffff',
                    boxShadow: '0 0 4px rgba(16, 185, 129, 0.6)'
                  }} title="Active session" />
                </div>

                {/* User Info Details */}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    color: '#0f172a',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    lineHeight: 1.25,
                    textTransform: 'capitalize'
                  }} title={displayName}>
                    {displayName}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.25rem' }}>
                    <span style={{
                      fontSize: '0.625rem',
                      fontWeight: 800,
                      color: roleBadgeColor,
                      backgroundColor: roleBadgeBg,
                      padding: '0.125rem 0.45rem',
                      borderRadius: '4px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: roleBadgeColor }} />
                      {displayRole}
                    </span>
                  </div>
                </div>
              </div>

              {/* Integrated Logout Icon Button */}
              <button
                type="button"
                onClick={handleLogout}
                title="Sign out of account"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#f8fafc',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#fef2f2';
                  e.currentTarget.style.borderColor = '#fecaca';
                  e.currentTarget.style.color = '#ef4444';
                  e.currentTarget.style.boxShadow = '0 2px 5px rgba(239, 68, 68, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8fafc';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.color = '#64748b';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <LogOut size={15} />
              </button>
            </div>
          )}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className={`admin-main ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <header className="admin-header">
          <div className="header-left-group">
            <button 
              className="admin-sidebar-toggle-btn" 
              onClick={toggleSidebar}
              aria-label={isSidebarOpen ? "Collapse sidebar" : "Open sidebar"}
              title={isSidebarOpen ? "Collapse sidebar" : "Open sidebar"}
            >
              <Menu size={20} />
            </button>
            <div className="admin-header-title">
              <h2>
                {location.pathname === '/admin/club'
                  ? 'Club Membership Applications'
                  : location.pathname === '/admin/events'
                  ? 'Event Registration Applications'
                  : location.pathname === '/admin/hackathons'
                  ? 'Hackathon Team Registrations'
                  : location.pathname === '/admin/recognition'
                  ? 'Judge & Dignitary Recognition Applications'
                  : location.pathname === '/admin/volunteers'
                  ? 'Volunteer Applications'
                  : location.pathname === '/admin/events/manage'
                  ? 'Manage Technical Events'
                  : location.pathname === '/admin/events/create'
                  ? 'Create Technical Event'
                  : location.pathname === '/admin/branches'
                  ? 'Manage Branches & Departments'
                  : location.pathname === '/admin/users/create'
                  ? 'Create Administrator Account'
                  : location.pathname === '/admin/reg-desk'
                  ? 'Registration Desk User Accounts'
                  : location.pathname === '/admin/rooms'
                  ? 'Registration Rooms & Venues'
                  : location.pathname === '/reg-desk/dashboard'
                  ? 'Hackathon & Event Registration Desk'
                  : 'Admin Accounts Console'}
              </h2>
              <p>
                {location.pathname === '/reg-desk/dashboard'
                  ? 'Participant Check-in & Live Attendance Verification Active'
                  : 'Role-Based System Access Control Active'}
              </p>
            </div>
          </div>
          <div className="admin-header-actions">
            <span className="live-indicator">
              <span className="pulse"></span> Live Connection
            </span>
          </div>
        </header>

        <div className="admin-content">
          {children}
        </div>
      </main>
    </div>
  );
};

