import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Users, ArrowLeft, LogOut, Sparkles, Calendar, ClipboardList, Layers, Menu, X, Code } from 'lucide-react';

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

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    navigate('/admin/login');
  };

  const isActive = (path: string) => {
    if (path === '/admin/users') {
      return location.pathname.startsWith('/admin/users') ? 'active' : '';
    }
    if (path === '/admin/events/manage') {
      return (location.pathname === '/admin/events/manage' || location.pathname === '/admin/events/create') ? 'active' : '';
    }
    return location.pathname === path ? 'active' : '';
  };

  // Close sidebar on navigation change (mobile)
  React.useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="admin-container">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="admin-sidebar-overlay" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="admin-brand">
          <div className="brand-logo">
            <Sparkles size={20} />
          </div>
          <div>
            <h3>R&D Club</h3>
            <span>Admin Console</span>
          </div>
          <button 
            className="mobile-sidebar-close" 
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close menu"
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

