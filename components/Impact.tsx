
import React, { useState } from 'react';
import { TranslationSet } from '../types';

interface ImpactProps {
  translations: TranslationSet;
}

const Impact: React.FC<ImpactProps> = ({ translations }) => {
  const [playEsgVideo, setPlayEsgVideo] = useState(false);
  const impacts = [
    {
      title: translations.impact1Title,
      text: translations.impact1Text,
      icon: "🌍",
      image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&q=80"
    },
    {
      title: translations.impact2Title,
      text: translations.impact2Text,
      icon: "⚖️",
      image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&q=80"
    },
    {
      title: translations.impact3Title,
      text: translations.impact3Text,
      icon: "🛡️",
      image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80"
    }
  ];

  return (
    <section id="impact" className="py-24 md:py-40 px-6 md:px-12 bg-white dark:bg-[#0a1612] overflow-hidden">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col lg:flex-row justify-between items-end mb-24 gap-12">
          <div className="max-w-2xl">
            <span className="inline-block px-5 py-2 bg-saffron/10 text-castleton-green dark:text-saffron font-bold text-xs uppercase tracking-widest rounded-full mb-6">
              {translations.impactTag}
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-7xl font-black text-dark-serpent dark:text-white tracking-tighter leading-none mb-8">
              {translations.impactTitle}
            </h2>
            <p className="text-2xl text-green-2 dark:text-green-4 font-medium">
              {translations.impactSubtitle}
            </p>
          </div>
          <div className="lg:mb-4">
             <div className="flex -space-x-4">
                {[1,2,3,4].map(i => (
                  <img key={i} className="w-16 h-16 rounded-full border-4 border-white dark:border-dark-serpent object-cover" src={`https://i.pravatar.cc/150?u=${i+10}`} alt={translations.imgAltTeamMember} />
                ))}
                <div className="w-16 h-16 rounded-full border-4 border-white dark:border-dark-serpent bg-saffron flex items-center justify-center font-black text-dark-serpent">+56K</div>
             </div>
             <p className="mt-4 text-sm font-bold text-green-3 dark:text-green-4 uppercase tracking-widest">{translations.impactWorkforcePart}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {impacts.map((item, i) => (
            <div key={i} className="group relative h-[500px] rounded-[48px] overflow-hidden shadow-2xl border border-paper dark:border-green-900/30">
              <img 
                src={item.image} 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 grayscale group-hover:grayscale-0" 
                alt={item.title}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-serpent via-dark-serpent/40 to-transparent opacity-90 group-hover:opacity-100 transition-opacity" />
              
              <div className="absolute bottom-0 left-0 p-10 w-full transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                <div className="w-14 h-14 bg-saffron rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-xl">
                  {item.icon}
                </div>
                <h3 className="text-3xl font-black text-white mb-4 tracking-tight">{item.title}</h3>
                <p className="text-lg text-white/80 font-medium leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                  {item.text}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20 md:mt-32 p-6 md:p-12 bg-paper/20 dark:bg-dark-serpent/50 rounded-[48px] border border-paper dark:border-green-900/30 grid lg:grid-cols-2 gap-20 items-center">
          <div>
            <h4 className="text-3xl font-black dark:text-white mb-6">{translations.feature4Title}</h4>
            <p className="text-xl text-green-2 dark:text-green-4 leading-relaxed mb-8">
              {translations.impactEsgDesc}
            </p>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-4xl font-black text-castleton-green dark:text-saffron">0%</p>
                <p className="text-sm font-bold opacity-75 text-dark-serpent/70 dark:text-green-4 uppercase tracking-widest">{translations.impactChildLabor}</p>
              </div>
              <div>
                <p className="text-4xl font-black text-castleton-green dark:text-saffron">100%</p>
                <p className="text-sm font-bold opacity-75 text-dark-serpent/70 dark:text-green-4 uppercase tracking-widest">{translations.impactFairWage}</p>
              </div>
            </div>
          </div>
          <div className="relative">
             <div className="aspect-video bg-dark-serpent rounded-3xl overflow-hidden shadow-2xl border-8 border-white dark:border-green-900">
                {playEsgVideo ? (
                  <iframe
                    className="w-full h-full"
                    src="https://www.youtube-nocookie.com/embed/vYiB0caGai0?autoplay=1&rel=0&modestbranding=1"
                    title="Lifewood ESG Video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                ) : (
                  <>
                    <img src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&q=80" className="w-full h-full object-cover opacity-80" alt={translations.imgAltEsgTeam} />
                    <button
                      type="button"
                      onClick={() => setPlayEsgVideo(true)}
                      className="absolute inset-0 flex items-center justify-center"
                      aria-label="Play ESG video"
                    >
                      <span className="w-20 h-20 bg-saffron rounded-full flex items-center justify-center text-3xl shadow-3xl animate-pulse cursor-pointer">▶</span>
                    </button>
                  </>
                )}
             </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Impact;
