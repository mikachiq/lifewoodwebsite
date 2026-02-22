
import React from 'react';
import { TranslationSet } from '../types';

interface FeaturesProps {
  translations: TranslationSet;
}

const Features: React.FC<FeaturesProps> = ({ translations }) => {
  const features = [
    { icon: '🚀', title: translations.feature1Title, text: translations.feature1Text },
    { icon: '🤝', title: translations.feature2Title, text: translations.feature2Text },
    { icon: '💡', title: translations.feature3Title, text: translations.feature3Text },
    { icon: '🌱', title: translations.feature4Title, text: translations.feature4Text },
    { icon: '⚙️', title: translations.feature5Title, text: translations.feature5Text },
    { icon: '🎓', title: translations.feature6Title, text: translations.feature6Text },
  ];

  return (
    <section id="about" className="py-20 md:py-32 px-6 md:px-12 bg-white dark:bg-[#0a1612]">
      <div className="max-w-[1400px] mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <span className="inline-block px-5 py-2 bg-paper dark:bg-green-900/40 text-castleton-green dark:text-saffron font-bold text-xs uppercase tracking-widest rounded-full mb-6">
            {translations.featuresTag}
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-dark-serpent dark:text-white mb-8 leading-tight">
            {translations.featuresTitle}
          </h2>
          <p className="text-xl text-green-3 dark:text-green-4 leading-relaxed">
            {translations.featuresDescription}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <div key={i} className="group p-10 bg-paper/30 dark:bg-dark-serpent/40 border border-paper dark:border-green-900/50 rounded-[32px] hover:bg-white dark:hover:bg-dark-serpent hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-castleton-green to-saffron scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500" />
              <div className="w-16 h-16 bg-gradient-to-br from-castleton-green to-green-2 rounded-2xl flex items-center justify-center text-3xl mb-8 group-hover:rotate-6 group-hover:scale-110 transition-transform text-white">
                {f.icon}
              </div>
              <h3 className="text-2xl font-bold text-dark-serpent dark:text-white mb-4">{f.title}</h3>
              <p className="text-green-2 dark:text-green-4 leading-relaxed">{f.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
