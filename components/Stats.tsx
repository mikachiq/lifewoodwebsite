
import React, { useState, useEffect, useRef } from 'react';
import { TranslationSet } from '../types';

interface StatsProps {
  translations: TranslationSet;
}

const StatCounter: React.FC<{ target: number; suffix?: string }> = ({ target, suffix = '+' }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setIsVisible(true);
    }, { threshold: 0.1 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    let start = 0;
    const duration = 2000;
    const step = (target / duration) * 16;
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isVisible, target]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
};

const Stats: React.FC<StatsProps> = ({ translations }) => {
  return (
    <section className="bg-dark-serpent py-24 px-6 md:px-12 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-saffron to-transparent" />
      
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 text-center">
        <div className="space-y-2">
          <div className="text-4xl md:text-6xl font-extrabold text-saffron">
            <StatCounter target={40} />
          </div>
          <p className="text-white/80 font-medium text-lg uppercase tracking-wider">{translations.statCenters}</p>
        </div>
        
        <div className="space-y-2">
          <div className="text-4xl md:text-6xl font-extrabold text-saffron">
            <StatCounter target={30} />
          </div>
          <p className="text-white/80 font-medium text-lg uppercase tracking-wider">{translations.statCountries}</p>
        </div>
        
        <div className="space-y-2">
          <div className="text-4xl md:text-6xl font-extrabold text-saffron">
            <StatCounter target={50} />
          </div>
          <p className="text-white/80 font-medium text-lg uppercase tracking-wider">{translations.statLanguages}</p>
        </div>
        
        <div className="space-y-2">
          <div className="text-4xl md:text-6xl font-extrabold text-saffron">
            <StatCounter target={56000} />
          </div>
          <p className="text-white/80 font-medium text-lg uppercase tracking-wider">{translations.statResources}</p>
        </div>
      </div>
    </section>
  );
};

export default Stats;
