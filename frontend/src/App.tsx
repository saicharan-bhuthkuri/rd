import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { API_BASE_URL } from './config';

// Global Fetch Interceptor to inject Credentials and CSRF token
const originalFetch = window.fetch;
window.fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : (input instanceof Request ? input.url : '');
  if (url.startsWith(API_BASE_URL) || url.startsWith('/api')) {
    const newInit = { ...init };
    newInit.credentials = 'include';

    // Normalize headers structure
    let headers: Record<string, string> = {};
    if (newInit.headers) {
      if (newInit.headers instanceof Headers) {
        newInit.headers.forEach((value, key) => {
          headers[key] = value;
        });
      } else if (Array.isArray(newInit.headers)) {
        newInit.headers.forEach(([key, value]) => {
          headers[key] = value;
        });
      } else {
        headers = { ...newInit.headers } as Record<string, string>;
      }
    }

    // Set CSRF token header for mutating requests
    const method = (newInit.method || 'GET').toUpperCase();
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      const csrfToken = localStorage.getItem('csrf_token');
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }
    }

    // Remove bearer null / bearer undefined headers if they exist
    if (headers['Authorization'] || headers['authorization']) {
      const authKey = headers['Authorization'] ? 'Authorization' : 'authorization';
      const authVal = headers[authKey];
      if (authVal === 'Bearer null' || authVal === 'Bearer undefined' || !authVal.split(' ')[1] || authVal.split(' ')[1] === 'null' || authVal.split(' ')[1] === 'undefined') {
        delete headers[authKey];
      }
    }

    newInit.headers = headers;
    return originalFetch(input, newInit);
  }
  return originalFetch(input, init);
};
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { About } from './components/About';
import { ResearchDomains } from './components/ResearchDomains';
import { Events } from './components/Events';
import { Benefits } from './components/Benefits';
import { Team } from './components/Team';
import { FAQ } from './components/FAQ';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';

// Pages
import { AboutPage } from './pages/AboutPage';
import { ResearchPage } from './pages/ResearchPage';
import { EventsPage } from './pages/EventsPage';
import { BenefitsPage } from './pages/BenefitsPage';
import { TeamPage } from './pages/TeamPage';
import { FAQPage } from './pages/FAQPage';
import { ContactPage } from './pages/ContactPage';
import { ApplyPage } from './pages/ApplyPage';
import { VerifyCertificatePage } from './pages/VerifyCertificatePage';

// Admin Pages
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AdminCreateUserPage } from './pages/AdminCreateUserPage';
import { AdminManageEventsPage } from './pages/AdminManageEventsPage';
import { AdminCreateEventPage } from './pages/AdminCreateEventPage';
import { AdminBranchesPage } from './pages/AdminBranchesPage';
import { AdminForgotPasswordPage } from './pages/AdminForgotPasswordPage'; // Newly created page
import { AdminResetPasswordPage } from './pages/AdminResetPasswordPage'; // Newly created page



// Scroll Restoration Hook
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

// Unified Homepage Overview
const HomePage: React.FC = () => {
  return (
    <>
      <Hero />
      <About isOverview={true} />
      <ResearchDomains isOverview={true} />
      <Events isOverview={true} />
      <Benefits isOverview={true} />
      <Team isOverview={true} />
      <FAQ isOverview={true} />
      <Contact isOverview={true} />
    </>
  );
};

// Protected Router Guard for Admin Privileges
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({ children, allowedRoles }) => {
  const adminUser = JSON.parse(localStorage.getItem('admin_user') || '{}');
  const role = adminUser.role || '';
  const isLoggedIn = !!adminUser.username;

  if (!isLoggedIn) {
    return <Navigate to="/admin/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <>{children}</>;
};

// Main Layout Wrapper
const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');
  const isHome = location.pathname === '/';

  if (isAdminPath) {
    return (
      <main style={{ minHeight: '100vh' }}>
        {children}
      </main>
    );
  }

  return (
    <>
      <Header />
      <main style={{ minHeight: 'calc(100vh - 10rem)', paddingTop: isHome ? '0' : '5rem' }}>
        {children}
      </main>
      <Footer />
    </>
  );
};

function App() {
  useEffect(() => {
    const eventSource = new EventSource(`${API_BASE_URL}/api/sync-stream`, { withCredentials: true });
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type) {
          const customEvent = new CustomEvent('app-sync', { detail: data.type });
          window.dispatchEvent(customEvent);
        }
      } catch (e) {
        console.error("Error parsing sync event:", e);
      }
    };

    eventSource.onerror = (err) => {
      console.warn("Sync stream connection failed. Reconnecting...", err);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <Router>
      <ScrollToTop />
      
      <MainLayout>
        <Routes>
          {/* Home Route */}
          <Route path="/" element={<HomePage />} />
          
          {/* Subpages */}
          <Route path="/about" element={<AboutPage />} />
          <Route path="/research" element={<ResearchPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/benefits" element={<BenefitsPage />} />
          <Route path="/team" element={<TeamPage />} />
          <Route path="/faqs" element={<FAQPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/apply" element={<ApplyPage />} />
          <Route path="/verify" element={<VerifyCertificatePage />} />

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin/forgot-password" element={<AdminForgotPasswordPage />} />
          <Route path="/admin/reset-password" element={<AdminResetPasswordPage />} />
          
          <Route
            path="/admin/dashboard"
            element={<Navigate to="/admin/club" replace />}
          />

          <Route
            path="/admin/club"
            element={
              <ProtectedRoute>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/events"
            element={
              <ProtectedRoute>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/hackathons"
            element={
              <ProtectedRoute>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['developer', 'superadmin']}>
                <AdminUsersPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/users/create"
            element={
              <ProtectedRoute allowedRoles={['developer', 'superadmin']}>
                <AdminCreateUserPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/events/manage"
            element={
              <ProtectedRoute>
                <AdminManageEventsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/events/create"
            element={
              <ProtectedRoute>
                <AdminCreateEventPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/branches"
            element={
              <ProtectedRoute>
                <AdminBranchesPage />
              </ProtectedRoute>
            }
          />


        </Routes>
      </MainLayout>
    </Router>
  );
}

export default App;
