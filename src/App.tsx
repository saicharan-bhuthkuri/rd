import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
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

const MainContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isHome = location.pathname === '/';
  
  return (
    <main style={{ minHeight: 'calc(100vh - 10rem)', paddingTop: isHome ? '0' : '5rem' }}>
      {children}
    </main>
  );
};

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Header />
      
      <MainContent>
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
        </Routes>
      </MainContent>

      <Footer />
    </Router>
  );
}

export default App;
