import React, { useState } from 'react';
import { TranslationSet } from '../types';

interface ServicesProps {
  translations: TranslationSet;
}

const Services: React.FC<ServicesProps> = ({ translations }) => {
  const [flippedIndex, setFlippedIndex] = useState<number | null>(null);

  const services = [
    { 
      id: 'service-lidar',
      badge: translations.serviceBadge1, 
      title: translations.serviceTitle1, 
      desc: translations.serviceDesc1,
      detail: translations.serviceDetail1,
      image: 'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=800&q=80' // LiDAR/Tech
    },
    { 
      id: 'service-speech',
      badge: translations.serviceBadge2, 
      title: translations.serviceTitle2, 
      desc: translations.serviceDesc2,
      detail: translations.serviceDetail2,
      image: 'https://images.unsplash.com/photo-1589254065878-42c9da997008?w=800&q=80' // Audio/Robot
    },
    { 
      id: 'service-rlhf',
      badge: translations.serviceBadge3, 
      title: translations.serviceTitle3, 
      desc: translations.serviceDesc3,
      detail: translations.serviceDetail3,
      image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80' // Generative AI/RLHF
    },
    { 
      id: 'service-medical',
      badge: translations.serviceBadge4, 
      title: translations.serviceTitle4, 
      desc: translations.serviceDesc4,
      detail: translations.serviceDetail4,
      image: 'https://images.unsplash.com/photo-1530210124550-912dc1381cb8?w=800&q=80' // Medical Data
    },
  ];

  const handleFlip = (index: number) => {
    setFlippedIndex(flippedIndex === index ? null : index);
  };

  return (
    <section id="services" className="py-20 md:py-32 px-6 md:px-12 bg-paper/20 dark:bg-dark-serpent/20">
      <div className="max-w-[1400px] mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <span className="inline-block px-5 py-2 bg-paper dark:bg-green-900/40 text-castleton-green dark:text-saffron font-bold text-xs uppercase tracking-widest rounded-full mb-6">
            {translations.servicesTag}
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-dark-serpent dark:text-white mb-8 leading-tight tracking-tighter">
            {translations.servicesTitle}
          </h2>
          <p className="text-xl text-green-3 dark:text-green-4 leading-relaxed font-medium">
            {translations.servicesDescription}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {services.map((s, i) => (
            <div id={s.id} key={i} className="group bg-white dark:bg-[#133020] rounded-[40px] overflow-hidden shadow-xl border border-paper dark:border-green-900/50 flex flex-col md:flex-row transition-all duration-500 hover:shadow-2xl scroll-mt-28">
              {/* Image Side (Static) */}
              <div className="md:w-[45%] relative min-h-[320px] shrink-0">
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-110" 
                  style={{ backgroundImage: `url(${s.image})` }} 
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-castleton-green/60 to-transparent group-hover:from-castleton-green/40 transition-all duration-500" />
                <div className="absolute top-6 left-6">
                  <span className="px-4 py-1.5 bg-white/90 dark:bg-dark-serpent/90 text-dark-serpent dark:text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                    {s.badge}
                  </span>
                </div>
              </div>

              {/* Content Side (Interactive Flip) */}
              <div className="md:w-[55%] relative perspective-1000 min-h-[400px] md:min-h-0 bg-white dark:bg-[#133020]">
                <div 
                  className={`relative w-full h-full transition-transform duration-700 preserve-3d cursor-pointer ${flippedIndex === i ? 'rotate-y-180' : ''}`}
                  onClick={() => handleFlip(i)}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {/* Front Face */}
                  <div className="absolute inset-0 backface-hidden p-10 flex flex-col justify-center bg-white dark:bg-[#133020]">
                    <h3 className="text-2xl font-black text-dark-serpent dark:text-white mb-4 group-hover:text-castleton-green dark:group-hover:text-saffron transition-colors tracking-tight">
                      {s.title}
                    </h3>
                    <p className="text-green-2 dark:text-green-4 leading-relaxed mb-8 text-[0.95rem] font-medium">
                      {s.desc}
                    </p>
                    <div className="mt-auto">
                      <button 
                        className="flex items-center gap-2 font-black text-castleton-green dark:text-saffron hover:gap-4 transition-all text-sm uppercase tracking-wider"
                      >
                        {translations.serviceLearnMore} <span className="text-xl">→</span>
                      </button>
                    </div>
                  </div>

                  {/* Back Face (Case Study Details) */}
                  <div className="absolute inset-0 backface-hidden rotate-y-180 p-10 flex flex-col justify-center bg-castleton-green text-white dark:bg-green-900">
                    <div className="mb-4">
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{translations.serviceDeepDiveOutcome}</span>
                      <h4 className="text-xl font-black text-saffron mt-1">
                        {s.title}
                      </h4>
                    </div>
                    <p className="text-sm font-medium leading-relaxed mb-8 text-sea-salt/90">
                      {s.detail}
                    </p>
                    <div className="mt-auto">
                      <button 
                        className="flex items-center gap-2 font-black text-saffron hover:gap-4 transition-all text-xs uppercase tracking-widest"
                      >
                        <span>←</span> {translations.serviceGoBack}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </section>
  );
};

export default Services;
