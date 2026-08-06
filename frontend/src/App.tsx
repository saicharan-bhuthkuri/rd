import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
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

// Admin Pages
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminUsersPage } from './pages/AdminUsersPage';


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
  const token = localStorage.getItem('admin_token');
  const adminUser = JSON.parse(localStorage.getItem('admin_user') || '{}');
  const role = adminUser.role || '';

  if (!token) {
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

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          
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
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['developer', 'superadmin']}>
                <AdminUsersPage />
              </ProtectedRoute>
            }
          />


        </Routes>
      </MainLayout>
    </Router>
  );
}

export default App;
