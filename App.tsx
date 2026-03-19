import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Language, AppState, View } from './types';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { TRANSLATIONS } from './constants';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Stats from './components/Stats';
import Features from './components/Features';
import CompanyBackground from './components/CompanyBackground';
import Services from './components/Services';
import ServicesOfferedSection from './components/ServicesOfferedSection';
import Impact from './components/Impact';
import CareersSection from './components/CareersSection';
import CTA from './components/CTA';
import Footer from './components/Footer';
import EmploymentModal from './components/EmploymentModal';
import ProjectView from './components/ProjectView';
import CompanyView from './components/CompanyView';
import ExploreView from './components/ExploreView';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ProfilePage from './pages/ProfilePage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import AdminDashboardPage from './pages/AdminDashboardPage';

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [modalPresetPosition, setModalPresetPosition] = useState<string | undefined>(undefined);
  const [appState, setAppState] = useState<AppState>(() => {
    const savedLang = localStorage.getItem('language') as Language || 'en';
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' || 'light';
    return {
      language: savedLang,
      theme: savedTheme,
      isModalOpen: false,
      currentView: 'home',
    };
  });

  const t = useMemo(() => TRANSLATIONS[appState.language], [appState.language]);

  const currentView = useMemo<View>(() => {
    if (location.pathname.startsWith('/company')) return 'company';
    if (location.pathname.startsWith('/project')) return 'project';
    if (location.pathname.startsWith('/explore')) return 'explore';
    return 'home';
  }, [location.pathname]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', appState.theme);
    if (appState.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', appState.theme);
  }, [appState.theme]);

  useEffect(() => {
    localStorage.setItem('language', appState.language);
  }, [appState.language]);

  const toggleTheme = useCallback(() => {
    setAppState(prev => ({ ...prev, theme: prev.theme === 'light' ? 'dark' : 'light' }));
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setAppState(prev => ({ ...prev, language: lang }));
  }, []);

  const setView = useCallback((view: View) => {
    const path = view === 'home' ? '/' : `/${view}`;
    navigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [navigate]);

  const toggleModal = useCallback((open: boolean, presetPosition?: string) => {
    setAppState(prev => ({ ...prev, isModalOpen: open }));
    setModalPresetPosition(open ? presetPosition : undefined);
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, []);

  const onExplorePortalFromModal = useCallback(() => {
    setView('company');
    toggleModal(false);
  }, [setView, toggleModal]);

  const handleNavClick = (sectionId: string) => {
    if (sectionId === 'login') {
      navigate('/login');
      return;
    }

    // Check if we are in the portal view and the clicked link is a portal section
    const isInternalPortalNav = location.pathname.startsWith('/company') && [
      'portal-home', 'portal-process', 'portal-tools', 'portal-engagement', 'portal-ethics', 'portal-pricing', 'portal-start'
    ].includes(sectionId);
    
    if (isInternalPortalNav) {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    // If we are not in home view and it's not a portal nav, switch to home
    if (location.pathname !== '/') {
      const targetId = sectionId === 'careers' ? 'careers-segment' : sectionId;
      navigate('/', { state: { scrollTo: targetId } });
    } else {
      // We are in home view, just scroll
      const targetId = sectionId === 'careers' ? 'careers-segment' : sectionId;
      const el = document.getElementById(targetId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (location.pathname !== '/') return;
    const state = location.state as unknown;
    if (!state || typeof state !== 'object') return;
    const scrollTo = (state as { scrollTo?: unknown }).scrollTo;
    if (typeof scrollTo !== 'string' || !scrollTo) return;

    window.setTimeout(() => {
      const el = document.getElementById(scrollTo);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      navigate('.', { replace: true, state: null });
    }, 50);
  }, [location.pathname, location.state, navigate]);

  return (
    <div className="min-h-screen font-manrope selection:bg-ui-accent selection:text-ui-accent-contrast bg-ui-base text-ui-text transition-colors duration-300">
      <Navbar 
        currentLang={appState.language} 
        onLangChange={setLanguage} 
        theme={appState.theme} 
        onThemeToggle={toggleTheme}
        onJoinTeam={() => toggleModal(true)}
        translations={t}
        currentView={currentView}
        onNavigate={setView}
        onNavClick={handleNavClick}
      />
      
      <main>
        <Routes>
          <Route
            path="/"
            element={
              <>
                <Hero
                  translations={t}
                  onJoinTeam={() => toggleModal(true)}
                  onNavigate={setView}
                  onLogin={() => navigate('/login')}
                  onSignUp={() => navigate('/signup')}
                  theme={appState.theme}
                />
                <Stats translations={t} />
                <Features translations={t} />
                <CompanyBackground translations={t} />
                <ServicesOfferedSection translations={t} onPortalClick={() => setView('company')} />
                <Services translations={t} />
                <Impact translations={t} />
                <CareersSection translations={t} onJoinTeam={(positionValue?: string) => toggleModal(true, positionValue)} />
                <CTA translations={t} onPortalClick={() => setView('company')} />
              </>
            }
          />
          <Route path="/project" element={<ProjectView onBack={() => setView('home')} translations={t} />} />
          <Route
            path="/company"
            element={<CompanyView onBack={() => setView('home')} translations={t} onJoinTeam={() => toggleModal(true)} />}
          />
          <Route path="/explore" element={<ExploreView onBack={() => setView('home')} translations={t} />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminProtectedRoute>
                <AdminDashboardPage />
              </AdminProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer
        translations={t}
        theme={appState.theme}
        onContactClick={() => handleNavClick('contact')}
        onNavigateSection={handleNavClick}
      />

      {appState.isModalOpen && (
        <EmploymentModal 
          onClose={() => toggleModal(false)} 
          translations={t} 
          onExplorePortal={onExplorePortalFromModal}
          presetPosition={modalPresetPosition}
        />
      )}
    </div>
  );
};

export default App;
