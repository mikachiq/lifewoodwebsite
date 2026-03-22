import React from 'react';
import { TranslationSet } from '../types';

interface ServicesOfferedSectionProps {
  translations: TranslationSet;
  onPortalClick: () => void;
}

const ServicesOfferedSection: React.FC<ServicesOfferedSectionProps> = ({ translations, onPortalClick }) => {
  return (
    <section id="services-offered-section" className="py-20 md:py-32 px-6 md:px-12 bg-white dark:bg-[#0a1612]">
      <div className="max-w-[1400px] mx-auto">
        <header className="max-w-4xl mx-auto mb-24 text-center">
          <span className="inline-block px-4 py-1.5 bg-paper dark:bg-green-900/40 text-castleton-green dark:text-saffron rounded-full text-xs font-bold uppercase tracking-widest mb-6">
            {translations.expHeroTag}
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-7xl font-extrabold mb-8 leading-tight text-dark-serpent dark:text-white tracking-tighter">
            {translations.expHeroTitle}
          </h2>
          <p className="text-xl text-green-1 dark:text-green-4 max-w-3xl mx-auto leading-relaxed font-medium">
            {translations.expHeroDesc}
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-paper/30 dark:bg-dark-serpent/40 p-6 md:p-10 rounded-[40px] border border-paper dark:border-green-900/50 hover:border-saffron/50 transition-all duration-500 group shadow-lg hover:shadow-2xl">
            <h3 className="text-2xl font-black mb-4 text-dark-serpent dark:text-white">{translations.expSrv1Title}</h3>
            <p className="text-green-1 dark:text-green-4 font-bold leading-relaxed">{translations.landingSrv1Value}</p>
          </div>

          <div className="bg-paper/30 dark:bg-dark-serpent/40 p-6 md:p-10 rounded-[40px] border border-paper dark:border-green-900/50 hover:border-saffron/50 transition-all duration-500 group shadow-lg hover:shadow-2xl">
            <h3 className="text-2xl font-black mb-4 text-dark-serpent dark:text-white">{translations.expSrv2Title}</h3>
            <p className="text-green-1 dark:text-green-4 font-bold leading-relaxed">{translations.landingSrv2Value}</p>
          </div>

          <div className="bg-paper/30 dark:bg-dark-serpent/40 p-6 md:p-10 rounded-[40px] border border-paper dark:border-green-900/50 hover:border-saffron/50 transition-all duration-500 group shadow-lg hover:shadow-2xl">
            <h3 className="text-2xl font-black mb-4 text-dark-serpent dark:text-white">{translations.expSrv3Title}</h3>
            <p className="text-green-1 dark:text-green-4 font-bold leading-relaxed">{translations.landingSrv3Value}</p>
          </div>
        </div>

        <div className="mt-14 text-center">
          <button
            type="button"
            onClick={onPortalClick}
            className="inline-block px-10 py-4 bg-saffron text-dark-serpent font-black rounded-full hover:bg-earth-yellow hover:-translate-y-1 transition-all shadow-xl"
          >
            {translations.landingServicesCta}
          </button>
        </div>
      </div>
    </section>
  );
};

export default ServicesOfferedSection;
