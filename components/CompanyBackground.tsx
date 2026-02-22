import React from 'react';
import { TranslationSet } from '../types';

interface CompanyBackgroundProps {
  translations: TranslationSet;
}

const CompanyBackground: React.FC<CompanyBackgroundProps> = ({ translations }) => {
  const offices = [
    { 
      region: translations.officeRegionHeadquarters, 
      city: "Petaling Jaya", 
      country: "Malaysia", 
      address: "B-13-01, Menara Bata, PJ Trade Centre, No 8, Jalan PJU 8/8A, Bandar Damansara Perdana, 47820 Petaling Jaya, Selangor",
      icon: "🇲🇾", 
      image: "/assets/office-petaling-jaya.jpg",
      details: translations.officeDetailsPetalingJaya
    },
    { 
      region: translations.officeRegionDeliveryHub, 
      city: "Manila", 
      country: "Philippines", 
      address: "26th Street, Bonifacio Global City, Taguig, Metro Manila",
      icon: "🇵🇭", 
      image: "/assets/office-manila.jpg",
      details: translations.officeDetailsManila
    },
    { 
      region: translations.officeRegionDeliveryHub, 
      city: "Davao", 
      country: "Philippines", 
      address: "Pryce Tower, Bajada, Davao City",
      icon: "🇵🇭", 
      image: "/assets/office-davao.jpg",
      details: translations.officeDetailsDavao
    },
    { 
      region: translations.officeRegionDeliveryHub, 
      city: "Cebu", 
      country: "Philippines", 
      address: "Cebu IT Park, Lahug, Cebu City",
      icon: "🇵🇭", 
      image: "/assets/office-cebu.jpg",
      details: translations.officeDetailsCebu
    },
    { 
      region: translations.officeRegionOperations, 
      city: "Shenzhen", 
      country: "China", 
      address: "Nanshan Science and Technology Park, Nanshan District",
      icon: "🇨🇳", 
      image: "/assets/office-shenzhen.jpg",
      details: translations.officeDetailsShenzhen
    },
    { 
      region: translations.officeRegionStrategicLab, 
      city: "Tokyo", 
      country: "Japan", 
      address: "Marunouchi, Chiyoda City, Tokyo",
      icon: "🇯🇵", 
      image: "/assets/office-tokyo.jpg",
      details: translations.officeDetailsTokyo
    },
    { 
      region: translations.officeRegionBusinessOffice, 
      city: "London", 
      country: "United Kingdom", 
      address: "Canary Wharf, London",
      icon: "🇬🇧", 
      image: "/assets/office-london.jpg",
      details: translations.officeDetailsLondon
    },
    { 
      region: translations.officeRegionBusinessOffice, 
      city: "New York", 
      country: "United States", 
      address: "Manhattan Business District, New York, NY",
      icon: "🇺🇸", 
      image: "/assets/office-new-york.jpg",
      details: translations.officeDetailsNewYork
    },
    { 
      region: translations.officeRegionRegionalHub, 
      city: "Taipei", 
      country: "Taiwan", 
      address: "Xinyi District, Taipei City",
      icon: "🇹🇼", 
      image: "/assets/office-taipei.jpg",
      details: translations.officeDetailsTaipei
    }
  ];

  return (
    <section id="company-background" className="py-40 bg-paper dark:bg-[#0d1f18] overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        {/* Legacy Narrative Grid */}
        <div className="grid lg:grid-cols-2 gap-24 items-center mb-40">
          {/* Visual Side */}
          <div className="relative group">
            <div className="absolute -top-10 -left-10 w-64 h-64 bg-castleton-green/10 rounded-full blur-[80px]" />
            <div className="relative aspect-square rounded-[80px] overflow-hidden shadow-3xl">
              <img 
                src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1000&q=80" 
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 scale-105 group-hover:scale-100" 
                alt={translations.imgAltLifewoodLegacy}
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-dark-serpent/40 to-transparent" />
            </div>
            <div className="absolute -bottom-10 -right-10 bg-white dark:bg-dark-serpent p-12 rounded-[60px] shadow-2xl border border-paper dark:border-green-900/30 max-w-xs">
              <p className="text-6xl font-black text-castleton-green dark:text-saffron mb-2">20</p>
              <p className="text-sm font-black uppercase tracking-widest text-dark-serpent dark:text-white leading-tight">
                {translations.bgYearsBadge}
              </p>
            </div>
          </div>

          {/* Content Side */}
          <div className="space-y-12">
            <div>
              <span className="inline-block px-4 py-1.5 bg-castleton-green/10 text-castleton-green dark:text-saffron rounded-full text-xs font-black uppercase tracking-widest mb-6">
                {translations.bgTag}
              </span>
              <h2 className="text-5xl md:text-7xl font-black text-dark-serpent dark:text-white tracking-tighter leading-none mb-10">
                {translations.bgTitle}
              </h2>
              <p className="text-2xl text-green-1 dark:text-green-4 leading-relaxed font-medium">
                {translations.bgDesc}
              </p>
            </div>

            <div className="space-y-10">
              <div className="flex gap-8 group">
                <div className="w-16 h-16 bg-white dark:bg-white/5 rounded-3xl flex items-center justify-center text-3xl shadow-xl transition-transform group-hover:scale-110">🏆</div>
                <div>
                  <h4 className="text-2xl font-black text-dark-serpent dark:text-white mb-2">{translations.bgPoint1Title}</h4>
                  <p className="text-lg text-green-2 dark:text-green-4 font-medium leading-relaxed">{translations.bgPoint1Text}</p>
                </div>
              </div>
              <div className="flex gap-8 group">
                <div className="w-16 h-16 bg-white dark:bg-white/5 rounded-3xl flex items-center justify-center text-3xl shadow-xl transition-transform group-hover:scale-110">🌍</div>
                <div>
                  <h4 className="text-2xl font-black text-dark-serpent dark:text-white mb-2">{translations.bgPoint2Title}</h4>
                  <p className="text-lg text-green-2 dark:text-green-4 font-medium leading-relaxed">{translations.bgPoint2Text}</p>
                </div>
              </div>
              <div className="flex gap-8 group">
                <div className="w-16 h-16 bg-white dark:bg-white/5 rounded-3xl flex items-center justify-center text-3xl shadow-xl transition-transform group-hover:scale-110">🛡️</div>
                <div>
                  <h4 className="text-2xl font-black text-dark-serpent dark:text-white mb-2">{translations.bgPoint3Title}</h4>
                  <p className="text-lg text-green-2 dark:text-green-4 font-medium leading-relaxed">{translations.bgPoint3Text}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Office Locations Sub-section - Updated to flexbox for centering */}
        <div id="offices-section" className="pt-20 border-t border-castleton-green/10 dark:border-green-900/30 scroll-mt-24">
          <div className="mb-16 text-center">
            <h3 className="text-4xl md:text-6xl font-black text-dark-serpent dark:text-white tracking-tighter mb-6">{translations.officesTitle}</h3>
            <p className="text-xl text-green-2 dark:text-green-4 font-medium max-w-3xl mx-auto">
              {translations.officesDesc}
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6">
            {offices.map((office, idx) => (
              <div 
                key={idx} 
                className="group relative h-[400px] w-full sm:w-[calc(50%-12px)] lg:w-[calc(20%-20px)] rounded-[40px] overflow-hidden shadow-2xl border border-paper dark:border-green-900/30 cursor-help"
              >
                {/* Background Image */}
                <img 
                  src={office.image} 
                  className="absolute inset-0 w-full h-full object-cover grayscale transition-all duration-1000 group-hover:grayscale-0 group-hover:scale-110" 
                  alt={office.city}
                />
                
                {/* Overlay Gradients */}
                <div className="absolute inset-0 bg-gradient-to-b from-dark-serpent/20 via-transparent to-dark-serpent/90 opacity-80 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 bg-castleton-green/40 opacity-0 group-hover:opacity-40 transition-opacity" />

                {/* Content - Static Title */}
                <div className="absolute bottom-0 left-0 p-8 w-full transition-transform duration-500 transform group-hover:-translate-y-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl filter drop-shadow-md">{office.icon}</span>
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[9px] font-black uppercase tracking-widest text-white border border-white/30">
                      {office.region}
                    </span>
                  </div>
                  <h4 className="text-3xl font-black text-white mb-1 tracking-tight">
                    {office.city}
                  </h4>
                  <p className="text-sm font-bold text-saffron uppercase tracking-widest mb-4">
                    {office.country}
                  </p>
                  
                  {/* Address */}
                  <p className="text-xs text-white/80 font-medium mb-4 flex items-start gap-2">
                    <span className="mt-0.5">📍</span>
                    {office.address}
                  </p>
                  
                  {/* Hidden Details revealed on hover */}
                  <div className="max-h-0 group-hover:max-h-40 overflow-hidden transition-all duration-700 opacity-0 group-hover:opacity-100">
                    <p className="text-sea-salt/90 text-sm font-medium leading-relaxed border-t border-white/20 pt-4">
                      {office.details}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-20 text-center space-y-4">
            <p className="text-xs font-black uppercase tracking-[0.4em] text-castleton-green dark:text-saffron opacity-60">
              {translations.officesAlwaysOn}
            </p>
            <div className="flex justify-center items-center gap-2 text-[10px] font-black text-green-2 dark:text-green-4 uppercase tracking-widest">
              <span className="w-2 h-2 bg-saffron rounded-full animate-pulse" />
              {translations.officesRealtime}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CompanyBackground;
