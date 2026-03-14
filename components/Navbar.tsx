import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Language, TranslationSet, View } from '../types';
import { useAuth } from './AuthProvider';
import { useProfile } from '../hooks/useProfile';

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
  const navigate = useNavigate();
  const { loading: authLoading, user, signOut } = useAuth();
  const { loading: profileLoading, avatarSrc, displayName } = useProfile();

  const [isScrolled, setIsScrolled] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (!profileMenuRef.current) return;
      if (profileMenuRef.current.contains(e.target as Node)) return;
      setProfileMenuOpen(false);
    };

    if (profileMenuOpen) {
      window.addEventListener('pointerdown', onPointerDown);
      return () => window.removeEventListener('pointerdown', onPointerDown);
    }
  }, [profileMenuOpen]);

  useEffect(() => {
    setProfileMenuOpen(false);
  }, [mobileMenuOpen]);

  const greeting = useMemo(() => {
    if (!user) return null;
    const hours = new Date().getHours();
    const timeGreeting =
      hours >= 5 && hours <= 11 ? 'Good morning' : hours >= 12 && hours <= 16 ? 'Good afternoon' : 'Good evening';

    const name = displayName || 'there';
    return `Hey, ${name}! ${timeGreeting}`;
  }, [displayName, user]);

  const initials = useMemo(() => {
    const value = (displayName || user?.email || '').trim();
    if (!value) return 'U';
    const parts = value.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || 'U';
    return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase() || 'U';
  }, [displayName, user?.email]);

  const onLogout = async () => {
    await signOut();
    navigate('/');
  };

  const RightSlot = () => {
    if (authLoading || profileLoading) return null;
    if (!user) return null;

    return (
      <div className="flex items-center gap-4">
        {greeting ? (
          <div className="hidden lg:block text-xs font-bold text-green-1 dark:text-green-4/80 whitespace-nowrap">
            {greeting}
          </div>
        ) : null}

        <div className="relative" ref={profileMenuRef}>
          <button
            type="button"
            onClick={() => setProfileMenuOpen(v => !v)}
            className="w-10 h-10 rounded-full border-2 border-paper dark:border-green-800 bg-white/70 dark:bg-green-900/20 overflow-hidden flex items-center justify-center font-black text-dark-serpent dark:text-white hover:opacity-90 transition-opacity"
            aria-label="Open profile menu"
          >
            {avatarSrc ? (
              <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm">{initials}</span>
            )}
          </button>

          {profileMenuOpen ? (
            <div className="absolute right-0 mt-3 w-64 rounded-3xl border border-paper dark:border-green-900/30 bg-paper/80 dark:bg-dark-serpent/80 backdrop-blur-xl shadow-3xl overflow-hidden">
              <div className="px-5 py-4">
                <div className="text-sm font-black text-dark-serpent dark:text-white truncate">
                  {displayName || user.email}
                </div>
                <div className="text-xs font-semibold text-green-2 dark:text-green-4/80 truncate">{user.email}</div>
              </div>
              <div className="h-px bg-castleton-green/10 dark:bg-green-800" />
              <div className="p-2">
                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    navigate('/profile');
                  }}
                  className="w-full text-left px-4 py-3 rounded-2xl font-black text-sm text-dark-serpent dark:text-white hover:bg-white/60 dark:hover:bg-green-900/20 transition-colors"
                >
                  Account Settings
                </button>
                <div className="h-px my-1 bg-castleton-green/10 dark:bg-green-800" />
                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    void onLogout();
                  }}
                  className="w-full text-left px-4 py-3 rounded-2xl font-black text-sm text-red-700 dark:text-red-200 hover:bg-red-500/10 transition-colors"
                >
                  Log Out
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <nav className={`fixed top-0 w-full z-[1000] transition-all duration-300 border-b h-[72px] ${
      isScrolled 
        ? 'bg-ui-base/95 backdrop-blur-xl shadow-lg border-ui-border/60' 
        : 'bg-ui-base/80 backdrop-blur-md border-transparent'
    }`}>
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 flex items-center justify-between h-full gap-0">
        <button onClick={handleLogoClick} className="min-w-[220px] lg:min-w-[300px] flex items-center gap-2 group">
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

        <ul className={`hidden lg:flex flex-1 items-center justify-center gap-8 font-bold text-[0.9rem] text-ui-text`}>
          {isPortal ? (
            <>
              <li><button onClick={() => onNavClick('portal-home')} className="hover:text-ui-secondary transition-colors whitespace-nowrap">{translations.portalNavHome}</button></li>
              <li><button onClick={() => onNavClick('portal-process')} className="hover:text-ui-secondary transition-colors whitespace-nowrap">{translations.portalNavProcess}</button></li>
              <li><button onClick={() => onNavClick('portal-tools')} className="hover:text-ui-secondary transition-colors whitespace-nowrap">{translations.portalNavOffers}</button></li>
              <li><button onClick={() => onNavClick('portal-engagement')} className="hover:text-ui-secondary transition-colors whitespace-nowrap">{translations.portalNavResults}</button></li>
              <li><button onClick={() => onNavClick('portal-ethics')} className="hover:text-ui-secondary transition-colors whitespace-nowrap">{translations.portalNavEthics}</button></li>
              <li><button onClick={() => onNavClick('portal-pricing')} className="hover:text-ui-secondary transition-colors whitespace-nowrap">{translations.portalNavPricing}</button></li>
            </>
          ) : (
            <>
              <li><button onClick={() => onNavClick('about')} className="hover:text-ui-secondary transition-colors">{translations.navAbout}</button></li>
              <li><button onClick={() => onNavClick('company-background')} className="hover:text-ui-secondary transition-colors">{translations.navLegacy}</button></li>
              <li><button onClick={() => onNavClick('offices-section')} className="hover:text-ui-secondary transition-colors">{translations.navOffices}</button></li>
              <li><button onClick={() => onNavClick('services-offered-section')} className="hover:text-ui-secondary transition-colors">{translations.navServicesOffered}</button></li>
              <li><button onClick={() => onNavClick('services')} className="hover:text-ui-secondary transition-colors">{translations.navServices}</button></li>
              <li><button onClick={() => onNavClick('impact')} className="hover:text-ui-secondary transition-colors">{translations.navImpact}</button></li>
              <li><button onClick={() => onNavClick('careers')} className="hover:text-ui-secondary transition-colors">{translations.navCareers}</button></li>
            </>
          )}
        </ul>

        <div className="min-w-[220px] lg:min-w-[300px] flex items-center justify-end gap-3 shrink-0">

          <button
            onClick={() => onNavClick(isPortal ? 'portal-start' : 'contact')}
            className="hidden lg:inline-flex bg-saffron text-dark-serpent px-7 py-2.5 rounded-full font-extrabold hover:bg-earth-yellow hover:-translate-y-0.5 transition-all shadow-md shadow-saffron/20 whitespace-nowrap"
          >
            {isPortal ? translations.portalNavContact : translations.navContact}
          </button>

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

          <RightSlot />

          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden flex flex-col gap-1.5 cursor-pointer"
            aria-label="Toggle menu"
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
            {!authLoading && user && greeting ? (
              <li className="text-sm font-bold text-green-1 dark:text-green-3 opacity-90">{greeting}</li>
            ) : null}
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

            {!authLoading && user ? (
              <>
                <li className="pt-2">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/profile');
                    }}
                    className="w-full text-left px-6 py-4 rounded-2xl bg-white/70 dark:bg-green-900/20 border border-paper dark:border-green-800 font-black"
                  >
                    Account Settings
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      void onLogout();
                    }}
                    className="w-full text-left px-6 py-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-200 font-black"
                  >
                    Log Out
                  </button>
                </li>
              </>
            ) : null}
          </ul>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
