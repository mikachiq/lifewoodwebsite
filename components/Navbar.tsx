import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Language, TranslationSet, View } from '../types';
import { useAuth } from './AuthProvider';
import { useProfile } from '../hooks/useProfile';
import { getSupabase, isSupabaseConfigured } from '../lib/supabaseClient';

type Notification = {
  id: string;
  message: string;
  read: boolean;
  created_at: string;
  link: string | null;
};

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
  const { loading: profileLoading, avatarSrc, displayName, isAdmin } = useProfile();

  const [isScrolled, setIsScrolled] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const notifRef = useRef<HTMLDivElement | null>(null);

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

  // Fetch notifications + real-time subscription
  useEffect(() => {
    if (!user?.email || !isSupabaseConfigured) return;
    const supabase = getSupabase();
    let cancelled = false;

    const refreshNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('id, message, read, created_at, link')
        .or(`user_id.eq.${user.id},user_email.eq.${user.email}`)
        .order('created_at', { ascending: false });

      if (!cancelled) {
        setNotifications((data as Notification[]) || []);
      }
    };

    void refreshNotifications();

    const channels = [
      supabase
      .channel(`notifications:user:${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, payload => {
        setNotifications(prev => [payload.new as Notification, ...prev]);
      })
      .subscribe(),
      supabase
      .channel(`notifications:email:${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_email=eq.${user.email}`,
      }, payload => {
        setNotifications(prev => [payload.new as Notification, ...prev]);
      })
      .subscribe(),
    ];

    const onVisibilityRefresh = () => {
      if (document.visibilityState === 'visible') {
        void refreshNotifications();
      }
    };

    const intervalId = window.setInterval(() => {
      void refreshNotifications();
    }, 30000);

    window.addEventListener('focus', onVisibilityRefresh);
    document.addEventListener('visibilitychange', onVisibilityRefresh);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', onVisibilityRefresh);
      document.removeEventListener('visibilitychange', onVisibilityRefresh);
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [user?.email, user?.id]);

  // Close notif dropdown on outside click
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (!notifRef.current) return;
      if (notifRef.current.contains(e.target as Node)) return;
      setNotifOpen(false);
    };
    if (notifOpen) {
      window.addEventListener('pointerdown', onPointerDown);
      return () => window.removeEventListener('pointerdown', onPointerDown);
    }
  }, [notifOpen]);

  const markAllRead = async () => {
    if (!user?.email || !isSupabaseConfigured) return;
    const supabase = getSupabase();
    await supabase.from('notifications').update({ read: true }).or(`user_id.eq.${user.id},user_email.eq.${user.email}`).eq('read', false);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markOneRead = async (notificationId: string) => {
    if (!isSupabaseConfigured) return;
    const supabase = getSupabase();
    await supabase.from('notifications').update({ read: true }).eq('id', notificationId);
    setNotifications(prev => prev.map(item => item.id === notificationId ? { ...item, read: true } : item));
  };

  const greeting = useMemo(() => {
    if (!user) return null;
    const hours = new Date().getHours();
    const timeGreeting =
      hours >= 5 && hours <= 11 ? 'Good morning' : hours >= 12 && hours <= 16 ? 'Good afternoon' : 'Good evening';

    const name = displayName || 'there';
    return {
      headline: `Hey, ${name}!`,
      subline: timeGreeting,
    };
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

    const unread = notifications.filter(n => !n.read).length;

    return (
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(v => !v)}
            className="relative w-10 h-10 flex items-center justify-center border-2 border-paper dark:border-green-800 rounded-full hover:bg-paper dark:hover:bg-green-900 transition-all text-dark-serpent dark:text-white"
            aria-label="Notifications"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-5-5.917V4a1 1 0 10-2 0v1.083A6 6 0 006 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
            </svg>
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-3 w-80 rounded-2xl border border-paper dark:border-green-900/30 bg-white dark:bg-dark-serpent shadow-2xl overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-paper dark:border-green-800 flex items-center justify-between">
                <span className="font-black text-sm text-dark-serpent dark:text-white">Notifications</span>
                {unread > 0 && (
                  <button onClick={markAllRead} className="text-[11px] font-bold text-castleton-green dark:text-saffron hover:opacity-70 transition-opacity">
                    Mark all as read
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-xs text-[#8a9a8a] font-medium">No notifications yet</div>
                ) : notifications.map(n => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => {
                      if (!n.read) void markOneRead(n.id);
                      setNotifOpen(false);
                      if (n.link) navigate(n.link);
                    }}
                    className={`w-full text-left px-4 py-3 border-b border-paper/50 dark:border-green-900/30 last:border-0 ${!n.read ? 'bg-castleton-green/5 dark:bg-green-900/20' : ''}`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.read && <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-castleton-green dark:bg-saffron shrink-0" />}
                      <div className={!n.read ? '' : 'pl-3.5'}>
                        <p className="text-xs text-dark-serpent dark:text-white font-semibold leading-relaxed">{n.message}</p>
                        <p className="text-[10px] text-[#8a9a8a] mt-1">{new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {greeting ? (
          <div className="hidden xl:flex min-w-0 flex-col justify-center leading-none text-left">
            <span className="max-w-[180px] truncate text-[13px] font-black text-dark-serpent dark:text-white">
              {greeting.headline}
            </span>
            <span className="mt-1 max-w-[180px] truncate text-[11px] font-semibold text-green-1 dark:text-green-4/80">
              {greeting.subline}
            </span>
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
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      navigate('/admin');
                    }}
                    className="w-full text-left px-4 py-3 rounded-2xl font-black text-sm text-saffron bg-saffron/10 hover:bg-saffron/20 transition-colors"
                  >
                    Admin Dashboard
                  </button>
                )}
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
      <div className="max-w-[1760px] mx-auto px-6 md:px-10 grid grid-cols-[auto_1fr_auto] items-center h-full gap-4">
        <button onClick={handleLogoClick} className="flex items-center gap-2 group shrink-0">
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

        <ul className="hidden lg:flex items-center justify-center gap-5 xl:gap-7 font-bold text-[0.9rem] text-ui-text">
          {isPortal ? (
            <>
              <li><button onClick={() => onNavClick('portal-home')} className="hover:text-ui-secondary transition-colors whitespace-nowrap">{translations.portalNavHome}</button></li>
              <li><button onClick={() => onNavClick('portal-process')} className="hover:text-ui-secondary transition-colors whitespace-nowrap">{translations.portalNavProcess}</button></li>
              <li><button onClick={() => onNavClick('portal-tools')} className="hover:text-ui-secondary transition-colors whitespace-nowrap">{translations.portalNavOffers}</button></li>
              <li><button onClick={() => onNavClick('portal-engagement')} className="hover:text-ui-secondary transition-colors whitespace-nowrap">{translations.portalNavResults}</button></li>
              <li><button onClick={() => onNavClick('portal-ethics')} className="hover:text-ui-secondary transition-colors whitespace-nowrap">{translations.portalNavEthics}</button></li>
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
              <li><button onClick={() => onNavClick('news')} className="hover:text-ui-secondary transition-colors">News</button></li>
            </>
          )}
        </ul>

        <div className="flex items-center justify-end gap-3">

          <button
            onClick={() => onNavClick(isPortal ? 'portal-start' : 'contact')}
            className="hidden lg:inline-flex bg-saffron text-dark-serpent px-7 py-2.5 rounded-full font-extrabold hover:bg-earth-yellow hover:-translate-y-0.5 transition-all shadow-md shadow-saffron/20 whitespace-nowrap"
          >
            {isPortal ? translations.portalNavContact : translations.navContact}
          </button>

          <div className="relative">
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-paper text-dark-serpent transition-all hover:border-castleton-green hover:bg-paper dark:border-green-800 dark:text-white dark:hover:border-saffron dark:hover:bg-green-900"
              aria-label={`Change language. Current language: ${activeLangLabel}`}
            >
              <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c4.97 0 9 4.03 9 9s-4.03 9-9 9-9-4.03-9-9 4.03-9 9-9Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3a14.5 14.5 0 0 1 0 18" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3a14.5 14.5 0 0 0 0 18" />
              </svg>
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
              <li className="text-sm text-green-1 dark:text-green-3 opacity-90">
                <div className="font-black">{greeting.headline}</div>
                <div className="mt-1 text-xs font-semibold">{greeting.subline}</div>
              </li>
            ) : null}
            {isPortal ? (
              <>
                <li><button onClick={() => { onNavigate('home'); setMobileMenuOpen(false); }}>{translations.portalNavExit}</button></li>
                <li><button onClick={() => { onNavClick('portal-home'); setMobileMenuOpen(false); }}>{translations.portalNavHome}</button></li>
                <li><button onClick={() => { onNavClick('portal-process'); setMobileMenuOpen(false); }}>{translations.portalNavProcess}</button></li>
                <li><button onClick={() => { onNavClick('portal-tools'); setMobileMenuOpen(false); }}>{translations.portalNavOffers}</button></li>
                <li><button onClick={() => { onNavClick('portal-engagement'); setMobileMenuOpen(false); }}>{translations.portalNavResults}</button></li>
                <li><button onClick={() => { onNavClick('portal-ethics'); setMobileMenuOpen(false); }}>{translations.portalNavEthics}</button></li>
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
                <li><button onClick={() => { onNavClick('news'); setMobileMenuOpen(false); }}>News</button></li>
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
                {isAdmin && (
                  <li>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        navigate('/admin');
                      }}
                      className="w-full text-left px-6 py-4 rounded-2xl bg-saffron/10 border-2 border-saffron/30 font-black text-saffron"
                    >
                      🛠️ Admin Dashboard
                    </button>
                  </li>
                )}
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
