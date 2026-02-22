import React, { useState, useEffect } from 'react';
import { Language, TranslationSet, View } from '../types';

interface NavbarProps {
  currentLang: Language;
  onLangChange: (lang: Language) => void;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
  onJoinTeam: () => void;
  translations: TranslationSet;
  currentView: View;
  onNavigate: (view: View) => void;
  onNavClick: (sectionId: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ 
  currentLang, 
  onLangChange, 
  theme, 
  onThemeToggle, 
  onJoinTeam,
  translations,
  currentView,
  onNavigate,
  onNavClick
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'zh', label: '中文', flag: '🇨🇳' },
    { code: 'ms', label: 'Bahasa Melayu', flag: '🇲🇾' },
    { code: 'tl', label: 'Tagalog', flag: '🇵🇭' },
    { code: 'bn', label: 'বাংলা', flag: '🇧🇩' },
    { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'ja', label: '日本語', flag: '🇯🇵' },
    { code: 'ko', label: '한국어', flag: '🇰🇷' },
  ];

  const activeLangLabel = languages.find(l => l.code === currentLang)?.code.toUpperCase() || 'EN';

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onNavigate('home');
  };

  const isPortal = currentView === 'company';

  return (
    <nav className={`fixed top-0 w-full z-[1000] transition-all duration-300 border-b ${
      isScrolled 
        ? 'bg-white/95 dark:bg-[#133020]/95 backdrop-blur-xl py-3 shadow-lg border-gray-100 dark:border-green-900' 
        : 'bg-white/80 dark:bg-[#133020]/80 backdrop-blur-md py-5 border-transparent'
    }`}>
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 flex justify-between items-center">
        <button onClick={handleLogoClick} className="flex items-center gap-2 group">
          <div className="relative">
            <img 
              src="/assets/logo.png" 
              alt="Lifewood" 
              className="h-10 w-auto object-contain dark:brightness-0 dark:invert transition-all" 
            />
            {isPortal && (
              <span className="absolute -bottom-2 -right-2 text-[9px] font-black uppercase tracking-[0.2em] text-saffron bg-dark-serpent px-1 rounded">{translations.portalChip}</span>
            )}
          </div>
        </button>

        <ul className={`hidden lg:flex items-center gap-6 font-bold text-[0.9rem] text-dark-serpent dark:text-sea-salt`}>
          {isPortal ? (
            <>
              <li><button onClick={() => onNavClick('portal-home')} className="hover:text-castleton-green dark:hover:text-saffron transition-colors whitespace-nowrap">{translations.portalNavHome}</button></li>
              <li><button onClick={() => onNavClick('portal-process')} className="hover:text-castleton-green dark:hover:text-saffron transition-colors whitespace-nowrap">{translations.portalNavProcess}</button></li>
              <li><button onClick={() => onNavClick('portal-tools')} className="hover:text-castleton-green dark:hover:text-saffron transition-colors whitespace-nowrap">{translations.portalNavOffers}</button></li>
              <li><button onClick={() => onNavClick('portal-engagement')} className="hover:text-castleton-green dark:hover:text-saffron transition-colors whitespace-nowrap">{translations.portalNavResults}</button></li>
              <li><button onClick={() => onNavClick('portal-ethics')} className="hover:text-castleton-green dark:hover:text-saffron transition-colors whitespace-nowrap">{translations.portalNavEthics}</button></li>
              <li><button onClick={() => onNavClick('portal-pricing')} className="hover:text-castleton-green dark:hover:text-saffron transition-colors whitespace-nowrap">{translations.portalNavPricing}</button></li>
              <li>
                <button 
                  onClick={() => onNavClick('portal-start')} 
                  className="bg-saffron text-dark-serpent px-6 py-2 rounded-full font-extrabold hover:bg-earth-yellow hover:-translate-y-0.5 transition-all shadow-md shadow-saffron/20 whitespace-nowrap"
                >
                  {translations.portalNavContact}
                </button>
              </li>
            </>
          ) : (
            <>
              <li><button onClick={() => onNavClick('about')} className="hover:text-castleton-green dark:hover:text-saffron transition-colors">{translations.navAbout}</button></li>
              <li><button onClick={() => onNavClick('company-background')} className="hover:text-castleton-green dark:hover:text-saffron transition-colors">{translations.navLegacy}</button></li>
              <li><button onClick={() => onNavClick('offices-section')} className="hover:text-castleton-green dark:hover:text-saffron transition-colors">{translations.navOffices}</button></li>
              <li><button onClick={() => onNavClick('services-offered-section')} className="hover:text-castleton-green dark:hover:text-saffron transition-colors">{translations.navServicesOffered}</button></li>
              <li><button onClick={() => onNavClick('services')} className="hover:text-castleton-green dark:hover:text-saffron transition-colors">{translations.navServices}</button></li>
              <li><button onClick={() => onNavClick('impact')} className="hover:text-castleton-green dark:hover:text-saffron transition-colors">{translations.navImpact}</button></li>
              <li><button onClick={() => onNavClick('careers')} className="hover:text-castleton-green dark:hover:text-saffron transition-colors">{translations.navCareers}</button></li>
              <li>
                <button 
                  onClick={() => onNavClick('contact')} 
                  className="bg-saffron text-dark-serpent px-7 py-2.5 rounded-full font-extrabold hover:bg-earth-yellow hover:-translate-y-0.5 transition-all shadow-md shadow-saffron/20"
                >
                  {translations.navContact}
                </button>
              </li>
            </>
          )}
        </ul>

        <div className="flex items-center gap-4">
          <div className="relative">
            <button 
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-2 px-3 py-2 border-2 border-paper dark:border-green-800 rounded-lg hover:border-castleton-green dark:hover:border-saffron transition-all text-sm font-bold text-dark-serpent dark:text-white"
            >
              <span>🌐 {activeLangLabel}</span>
              <span className={`text-[10px] transition-transform ${langDropdownOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>
            
            {langDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 bg-white dark:bg-dark-serpent border-2 border-paper dark:border-green-800 rounded-xl shadow-2xl py-2 min-w-[180px] overflow-hidden">
                {languages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      onLangChange(l.code);
                      setLangDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-left text-sm font-semibold transition-colors ${
                      currentLang === l.code 
                        ? 'bg-castleton-green text-white' 
                        : 'hover:bg-paper dark:hover:bg-green-900 text-dark-serpent dark:text-white'
                    }`}
                  >
                    <span>{l.flag}</span>
                    <span>{l.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button 
            onClick={onThemeToggle}
            className="w-10 h-10 flex items-center justify-center border-2 border-paper dark:border-green-800 rounded-full hover:bg-paper dark:hover:bg-green-900 transition-all text-lg text-dark-serpent dark:text-white"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>

          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden flex flex-col gap-1.5 cursor-pointer"
          >
            <span className={`w-6 h-0.5 bg-dark-serpent dark:bg-white transition-all ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`w-6 h-0.5 bg-dark-serpent dark:bg-white transition-all ${mobileMenuOpen ? 'opacity-0' : ''}`} />
            <span className={`w-6 h-0.5 bg-dark-serpent dark:bg-white transition-all ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 w-full bg-white dark:bg-dark-serpent border-b dark:border-green-900 py-8 px-6 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          <ul className="flex flex-col gap-6 font-bold text-lg text-dark-serpent dark:text-white">
            {isPortal ? (
              <>
                <li><button onClick={() => { onNavigate('home'); setMobileMenuOpen(false); }}>{translations.portalNavExit}</button></li>
                <li><button onClick={() => { onNavClick('portal-home'); setMobileMenuOpen(false); }}>{translations.portalNavHome}</button></li>
                <li><button onClick={() => { onNavClick('portal-process'); setMobileMenuOpen(false); }}>{translations.portalNavProcess}</button></li>
                <li><button onClick={() => { onNavClick('portal-tools'); setMobileMenuOpen(false); }}>{translations.portalNavOffers}</button></li>
                <li><button onClick={() => { onNavClick('portal-engagement'); setMobileMenuOpen(false); }}>{translations.portalNavResults}</button></li>
                <li><button onClick={() => { onNavClick('portal-ethics'); setMobileMenuOpen(false); }}>{translations.portalNavEthics}</button></li>
                <li><button onClick={() => { onNavClick('portal-pricing'); setMobileMenuOpen(false); }}>{translations.portalNavPricing}</button></li>
                <li><button onClick={() => { onNavClick('portal-start'); setMobileMenuOpen(false); }}>{translations.portalNavContact}</button></li>
              </>
            ) : (
              <>
                <li><button onClick={() => { onNavClick('about'); setMobileMenuOpen(false); }}>{translations.navAbout}</button></li>
                <li><button onClick={() => { onNavClick('company-background'); setMobileMenuOpen(false); }}>{translations.navLegacy}</button></li>
                <li><button onClick={() => { onNavClick('offices-section'); setMobileMenuOpen(false); }}>{translations.navOffices}</button></li>
                <li><button onClick={() => { onNavClick('services-offered-section'); setMobileMenuOpen(false); }}>{translations.navServicesOffered}</button></li>
                <li><button onClick={() => { onNavClick('services'); setMobileMenuOpen(false); }}>{translations.navServices}</button></li>
                <li><button onClick={() => { onNavClick('impact'); setMobileMenuOpen(false); }}>{translations.navImpact}</button></li>
                <li><button onClick={() => { onNavClick('careers'); setMobileMenuOpen(false); }}>{translations.navCareers}</button></li>
                <li><button onClick={() => { onNavClick('contact'); setMobileMenuOpen(false); }} className="inline-block bg-saffron text-dark-serpent px-8 py-3 rounded-full text-center">{translations.navContact}</button></li>
              </>
            )}
          </ul>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
