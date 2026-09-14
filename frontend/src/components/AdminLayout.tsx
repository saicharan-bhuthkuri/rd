import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Users, 
  ArrowLeft, 
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
  ClipboardCheck
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

              <Link to="/admin/branches" className={`admin-nav-item ${isActive('/admin/branches')}`}>
                <Layers size={18} />
                <span>Manage Branches</span>
              </Link>

              <Link to="/reg-desk/dashboard" className={`admin-nav-item ${isActive('/reg-desk/dashboard')}`}>
                <ClipboardCheck size={18} />
                <span>Attendance Desk</span>
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

          {!isRegDeskPage && (
            <Link to="/" className="admin-nav-item">
              <ArrowLeft size={18} />
              <span>Back to Site</span>
            </Link>
          )}

          <button onClick={handleLogout} className="admin-nav-item logout-btn" style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
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

