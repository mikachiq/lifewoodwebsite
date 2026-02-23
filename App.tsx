import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Language, AppState, View } from './types';
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

const App: React.FC = () => {
  const [modalPresetPosition, setModalPresetPosition] = useState<string | undefined>(undefined);
  const [appState, setAppState] = useState<AppState>(() => {
    const savedLang = localStorage.getItem('language') as Language || 'en';
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' || 'light';
    return {
      language: savedLang,
      theme: savedTheme,
      isModalOpen: false,
      currentView: 'home'
    };
  });

  const t = useMemo(() => TRANSLATIONS[appState.language], [appState.language]);

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
    setAppState(prev => ({ ...prev, currentView: view }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

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
    // Check if we are in the portal view and the clicked link is a portal section
    const isInternalPortalNav = appState.currentView === 'company' && [
      'portal-home', 'portal-process', 'portal-tools', 'portal-engagement', 'portal-ethics', 'portal-pricing', 'portal-start'
    ].includes(sectionId);
    
    if (isInternalPortalNav) {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    // If we are not in home view and it's not a portal nav, switch to home
    if (appState.currentView !== 'home') {
      setAppState(prev => ({ ...prev, currentView: 'home' }));
      setTimeout(() => {
        // Handle target mapping for home page
        const targetId = sectionId === 'careers' ? 'careers-segment' : sectionId;
        const el = document.getElementById(targetId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      // We are in home view, just scroll
      const targetId = sectionId === 'careers' ? 'careers-segment' : sectionId;
      const el = document.getElementById(targetId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen font-manrope selection:bg-saffron selection:text-dark-serpent bg-white dark:bg-[#0a1612] transition-colors duration-300">
      <Navbar 
        currentLang={appState.language} 
        onLangChange={setLanguage} 
        theme={appState.theme} 
        onThemeToggle={toggleTheme}
        onJoinTeam={() => toggleModal(true)}
        translations={t}
        currentView={appState.currentView}
        onNavigate={setView}
        onNavClick={handleNavClick}
      />
      
      <main>
        {appState.currentView === 'home' && (
          <>
            <Hero 
              translations={t} 
              onJoinTeam={() => toggleModal(true)} 
              onNavigate={setView}
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
        )}

        {appState.currentView === 'project' && (
          <ProjectView onBack={() => setView('home')} translations={t} />
        )}

        {appState.currentView === 'company' && (
          <CompanyView 
            onBack={() => setView('home')} 
            translations={t} 
            onJoinTeam={() => toggleModal(true)} 
          />
        )}
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
