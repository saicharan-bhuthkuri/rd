import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Users, ArrowLeft, LogOut, Sparkles, Calendar } from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
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
    return location.pathname === path ? 'active' : '';
  };

  return (
    <div className="admin-container">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="brand-logo">
            <Sparkles size={20} />
          </div>
          <div>
            <h3>R&D Club</h3>
            <span>Admin Console</span>
          </div>
        </div>

        <nav className="admin-nav">
          <Link to="/admin/club" className={`admin-nav-item ${isActive('/admin/club')}`}>
            <Sparkles size={18} />
            <span>Club Membership</span>
          </Link>

          <Link to="/admin/events" className={`admin-nav-item ${isActive('/admin/events')}`}>
            <Calendar size={18} />
            <span>Event Registration</span>
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
          <div className="admin-header-title">
            <h2>{location.pathname === '/admin/club' ? 'Club Membership Applications' : location.pathname === '/admin/events' ? 'Event Registration Applications' : 'Admin Accounts Console'}</h2>
            <p>Role-Based System Access Control Active</p>
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
