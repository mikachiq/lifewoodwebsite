import React, { useEffect, useState } from 'react';
import { TranslationSet, View } from '../types';
import NeuralBackground from './NeuralBackground';
import { useAuth } from './AuthProvider';

interface HeroProps {
  translations: TranslationSet;
  onJoinTeam: () => void;
  onNavigate: (view: View) => void;
  onLogin: () => void;
  onSignUp: () => void;
  theme: 'light' | 'dark';
}

const Hero: React.FC<HeroProps> = ({ translations, onJoinTeam, onNavigate, onLogin, onSignUp, theme }) => {
  const [mounted, setMounted] = useState(false);
  const { loading: authLoading, user } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  const cards = [
    {
      icon: "🌍",
      title: translations.cardGlobalTitle,
      text: translations.cardGlobalText,
      color: "from-castleton-green to-green-2"
    },
    {
      icon: "⚡",
      title: translations.cardSpeedTitle,
      text: translations.cardSpeedText,
      color: "from-saffron to-earth-yellow",
      textColor: "text-dark-serpent dark:text-white"
    },
    {
      icon: "🎯",
      title: translations.cardPrecisionTitle,
      text: translations.cardPrecisionText,
      color: "from-green-2 to-green-3"
    },
    {
      icon: "🛡️",
      title: translations.cardSecurityTitle,
      text: translations.cardSecurityText,
      color: "from-dark-serpent to-castleton-green"
    },
    {
      icon: "🗣️",
      title: translations.cardDialectTitle,
      text: translations.cardDialectText,
      color: "from-earth-yellow to-saffron",
      textColor: "text-dark-serpent dark:text-white"
    },
    {
      icon: "🤝",
      title: translations.cardEsgTitle,
      text: translations.cardEsgText,
      color: "from-green-3 to-green-2"
    },
    {
      icon: "⏱️",
      title: translations.cardAlwaysOnTitle,
      text: translations.cardAlwaysOnText,
      color: "from-green-1 to-dark-serpent"
    }
  ];

  // Duplicate cards for seamless loop
  const marqueeCards = [...cards, ...cards, ...cards];

  return (
    <section id="home" className="relative min-h-screen pt-32 md:pt-44 pb-20 overflow-hidden flex flex-col items-center bg-gradient-to-br from-ui-surface/40 via-ui-base to-ui-base dark:from-ui-base dark:via-ui-base dark:to-ui-base">
      {/* Neural Network Background */}
      <NeuralBackground theme={theme} />

      {/* Background Decorative Element - Glowing Orb */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-castleton-green/20 dark:bg-castleton-green/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-saffron/10 dark:bg-saffron/5 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      <div className={`max-w-[1400px] mx-auto px-6 md:px-12 text-center relative z-10 w-full mb-24 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl md:text-6xl lg:text-8xl font-black text-dark-serpent dark:text-white leading-[1] mb-10 tracking-tighter relative group">
            <span className="relative z-10">{translations.heroTitle}</span>{' '}
            <span className="relative inline-block text-castleton-green dark:text-saffron transition-all duration-500 group-hover:text-green-1 dark:group-hover:text-earth-yellow">
              {translations.heroHighlight}
              <div className="absolute bottom-2 left-0 w-full h-3 bg-saffron/40 dark:bg-saffron/20 -z-10 skew-x-12 group-hover:h-full group-hover:bottom-0 transition-all duration-500" />
              <div className="absolute -inset-4 bg-saffron/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full" />
            </span>{' '}
            <span className="relative z-10">{translations.heroTitleEnd}</span>
          </h1>
          
          <p className="text-xl md:text-3xl font-black text-castleton-green dark:text-saffron/90 mb-8 tracking-tight animate-fade-in-up delay-200">
            {translations.heroSubtitle}
          </p>
          
          <p className="text-xl leading-relaxed text-green-2 dark:text-green-4 mb-14 max-w-2xl mx-auto font-medium animate-fade-in-up delay-300">
            {translations.heroDescription}
          </p>
          
          <div className="flex items-center justify-center gap-4 mt-8 flex-wrap animate-fade-in-up delay-500">
            <button
              onClick={() => onNavigate('company')}
              className="px-8 py-4 bg-[#133020] text-white rounded-full font-semibold hover:opacity-95 hover:-translate-y-0.5 transition-all shadow-2xl flex items-center justify-center gap-3 group"
            >
              {translations.heroBtnTertiary} <span className="group-hover:rotate-45 transition-transform">✧</span>
            </button>

            {!authLoading && !user ? (
              <div
                className="flex rounded-full overflow-hidden shadow-md border border-[#133020]/10"
                role="group"
                aria-label="Authentication"
              >
                <button
                  type="button"
                  onClick={onLogin}
                  className="bg-[#133020] text-white px-10 py-4 text-base font-semibold hover:bg-[#0f261a] transition-colors"
                >
                  Log In
                </button>
                <button
                  type="button"
                  onClick={onSignUp}
                  className="bg-white text-[#133020] px-10 py-4 text-base font-semibold border-l border-[#133020]/20 hover:bg-paper transition-colors"
                >
                  Sign Up
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Modern Marquee Section with Glassmorphism */}
      <div className="w-full relative marquee-container overflow-hidden py-10 select-none mt-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-white dark:from-[#0a1612] dark:via-transparent dark:to-[#0a1612] z-10 pointer-events-none" />
        <div className="flex animate-marquee gap-8 whitespace-nowrap px-4">
          {marqueeCards.map((c, i) => (
            <div
              key={i}
              className="inline-flex flex-col gap-6 p-8 bg-ui-base/80 dark:bg-ui-surface/40 backdrop-blur-md rounded-[40px] shadow-xl border border-ui-border/60 dark:border-ui-border/40 hover:scale-105 transition-transform duration-300 group shrink-0"
              style={{ width: '220px', height: '220px' }}
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${c.color} flex items-center justify-center text-3xl shadow-lg group-hover:rotate-12 transition-transform duration-500 shrink-0`}>
                {c.icon}
              </div>
              <div className="min-h-0">
                <h4 className={`text-base font-black mb-1 ${c.textColor || 'text-dark-serpent dark:text-white'}`}>{c.title}</h4>
                <p className="text-green-2 dark:text-green-4 font-bold leading-tight whitespace-normal text-xs line-clamp-3">{c.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;
