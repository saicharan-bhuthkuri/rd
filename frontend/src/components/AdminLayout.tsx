import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Users, ArrowLeft, LogOut, Sparkles, Calendar, ClipboardList, Layers, Menu, X, Code, Award, HeartHandshake, FolderUp } from 'lucide-react';
import { API_BASE_URL } from '../config';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Get active admin user from localStorage
  const adminUser = JSON.parse(localStorage.getItem('admin_user') || '{}');
  const role = adminUser.role || '';
  const username = adminUser.username || '';

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
      navigate('/admin/login');
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path ? 'active' : '';
  };

  // Close sidebar on navigation change (mobile)
  React.useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="admin-container">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="mobile-sidebar-backdrop"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header">
          <div className="admin-brand">
            <span className="brand-dot"></span>
            <span>Admin Console</span>
          </div>
          <button 
            className="mobile-sidebar-close" 
            onClick={() => setIsSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="admin-nav">
          <Link to="/admin/club" className={`admin-nav-item ${isActive('/admin/club')}`}>
            <Sparkles size={18} />
            <span>Club Membership</span>
          </Link>

          <Link to="/admin/events" className={`admin-nav-item ${isActive('/admin/events')}`}>
            <ClipboardList size={18} />
            <span>Event Registration</span>
          </Link>

          <Link to="/admin/hackathons" className={`admin-nav-item ${isActive('/admin/hackathons')}`}>
            <Code size={18} />
            <span>Hackathon Registration</span>
          </Link>

          <Link to="/admin/recognition" className={`admin-nav-item ${isActive('/admin/recognition')}`}>
            <Award size={18} />
            <span>Judge Recognition</span>
          </Link>

          <Link to="/admin/volunteers" className={`admin-nav-item ${isActive('/admin/volunteers')}`}>
            <HeartHandshake size={18} />
            <span>Volunteers</span>
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

          {(role === 'developer' || role === 'superadmin') && (
            <Link to="/admin/users" className={`admin-nav-item ${isActive('/admin/users')}`}>
              <Users size={18} />
              <span>Manage Admins</span>
            </Link>
          )}

          <hr className="admin-nav-divider" />

          <Link to="/" className="admin-nav-item">
            <ArrowLeft size={18} />
            <span>Back to Site</span>
          </Link>

          <button onClick={handleLogout} className="admin-nav-item logout-btn" style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </nav>

        {/* Profile Card */}
        <div className="admin-profile-card">
          <div className="admin-avatar">
            {username.slice(0, 2).toUpperCase()}
          </div>
          <div className="admin-profile-info">
            <h4>{username}</h4>
            <span className={`role-badge role-${role}`}>{role}</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main">
        <header className="admin-header">
          <div className="header-left-group">
            <button 
              className="mobile-sidebar-toggle" 
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={24} />
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
                  : 'Admin Accounts Console'}
              </h2>
              <p>Role-Based System Access Control Active</p>
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

