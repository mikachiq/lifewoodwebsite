import React, { useState } from 'react';
import { TranslationSet } from '../types';

interface CareersSectionProps {
  translations: TranslationSet;
  onJoinTeam: (positionValue?: string) => void;
}

const CareersSection: React.FC<CareersSectionProps> = ({ translations, onJoinTeam }) => {
  const [expandedJob, setExpandedJob] = useState<number | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const safeText = (value: string | undefined, fallback = '-') =>
    value && value.trim().length > 0 ? value : fallback;

  const images = [
    '/assets/career-1.jpg',
    '/assets/career-2.jpg',
    '/assets/career-3.jpg'
  ];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const jobs = [
    {
      positionValue: 'senior-ai-data-architect',
      title: translations.careerJob1Title,
      dept: translations.careerJob1Dept,
      loc: translations.careerJob1Loc,
      type: translations.careerJob1Type,
      pay: translations.careerCompensation,
      qualifications: [
        translations.careerJob1Qual1,
        translations.careerJob1Qual2,
        translations.careerJob1Qual3
      ].filter((q): q is string => Boolean(q && q.trim()))
    },
    {
      positionValue: 'multilingual-nlp-specialist',
      title: translations.careerJob2Title,
      dept: translations.careerJob2Dept,
      loc: translations.careerJob2Loc,
      type: translations.careerJob2Type,
      pay: translations.careerCompensation,
      qualifications: [
        translations.careerJob2Qual1,
        translations.careerJob2Qual2,
        translations.careerJob2Qual3
      ].filter((q): q is string => Boolean(q && q.trim()))
    },
    {
      positionValue: 'ai-data-intern',
      title: translations.careerJob3Title,
      dept: translations.careerJob3Dept,
      loc: translations.careerJob3Loc,
      type: translations.careerJob3Type,
      pay: translations.careerCompensation,
      qualifications: [
        translations.careerJob3Qual1,
        translations.careerJob3Qual2,
        translations.careerJob3Qual3
      ].filter((q): q is string => Boolean(q && q.trim()))
    },
    {
      positionValue: 'global-operations-manager',
      title: translations.careerJob4Title,
      dept: translations.careerJob4Dept,
      loc: translations.careerJob4Loc,
      type: translations.careerJob4Type,
      pay: translations.careerCompensation,
      qualifications: [
        translations.careerJob4Qual1,
        translations.careerJob4Qual2,
        translations.careerJob4Qual3
      ].filter((q): q is string => Boolean(q && q.trim()))
    },
    {
      positionValue: 'ai-training-associate',
      title: translations.careerJob5Title,
      dept: translations.careerJob5Dept,
      loc: translations.careerGlobalLocation || 'Global',
      type: translations.careerJob5Type,
      pay: translations.careerCompensation,
      qualifications: [
        translations.careerJob5Qual1,
        translations.careerJob5Qual2,
        translations.careerJob5Qual3
      ].filter((q): q is string => Boolean(q && q.trim()))
    }
  ];

  const benefits = [
    { icon: '\u{1F3E0}', title: translations.careerBenefitRemote, desc: translations.careerBenefitRemoteDesc },
    { icon: '\u{1F393}', title: translations.careerBenefitDev, desc: translations.careerBenefitDevDesc },
    { icon: '\u2695\uFE0F', title: translations.careerBenefitHealth, desc: translations.careerBenefitHealthDesc }
  ];

  const steps = [
    { num: '01', title: translations.careerHiringStep1, desc: translations.careerHiringStep1Desc },
    { num: '02', title: translations.careerHiringStep2, desc: translations.careerHiringStep2Desc },
    { num: '03', title: translations.careerHiringStep3, desc: translations.careerHiringStep3Desc },
    { num: '04', title: translations.careerHiringStep4, desc: translations.careerHiringStep4Desc }
  ];

  return (
    <section id="careers-segment" className="py-40 px-6 md:px-12 bg-white dark:bg-[#0a1612] overflow-hidden relative">
      <div className="absolute top-40 left-0 w-1/3 h-[500px] pointer-events-none opacity-[0.03] dark:opacity-[0.05]">
        <svg width="100%" height="100%" viewBox="0 0 400 600" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="2" fill="currentColor" />
          <circle cx="150" cy="150" r="2" fill="currentColor" />
          <circle cx="250" cy="250" r="2" fill="currentColor" />
          <path d="M50 50L150 150M150 150L250 250M150 150L50 250" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
          <rect x="240" y="240" width="20" height="20" stroke="currentColor" strokeWidth="1" />
        </svg>
      </div>

      <div className="max-w-[1400px] mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-20 items-center mb-32">
          <div className="order-2 lg:order-1 space-y-10">
            <div>
              <span className="inline-block px-5 py-2 bg-paper dark:bg-green-900/40 text-castleton-green dark:text-saffron font-bold text-xs uppercase tracking-widest rounded-full mb-8">
                {translations.navJoinTeam}
              </span>
              <h2 className="text-5xl md:text-7xl font-black text-dark-serpent dark:text-white tracking-tighter leading-none mb-10">
                {translations.careerHeroTitle}
              </h2>
              <p className="text-2xl text-green-2 dark:text-green-4 font-medium leading-relaxed">
                {translations.careerCultureDesc}
              </p>
            </div>

            <div className="flex flex-wrap gap-8 py-6 border-y border-paper dark:border-green-900/30">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{"\u{1F30D}"}</span>
                <div>
                  <p className="text-lg font-black text-dark-serpent dark:text-white leading-none">30+</p>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-50">{translations.careerPulseNations}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{"\u{1F5E3}\uFE0F"}</span>
                <div>
                  <p className="text-lg font-black text-dark-serpent dark:text-white leading-none">60+</p>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-50">{translations.careerPulseDialects}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{"\u23F1\uFE0F"}</span>
                <div>
                  <p className="text-lg font-black text-dark-serpent dark:text-white leading-none">24/7</p>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-50">{translations.careerPulseSync}</p>
                </div>
              </div>
            </div>

            <div className="bg-paper/30 dark:bg-dark-serpent/40 p-10 rounded-[40px] border border-paper dark:border-green-900/30 relative overflow-hidden group">
              <div className="absolute top-4 right-4 px-3 py-1 bg-castleton-green/10 dark:bg-saffron/10 text-[9px] font-black uppercase tracking-widest text-castleton-green dark:text-saffron rounded border border-current opacity-60">
                {translations.careerVerifiedBadge}
              </div>

              <p className="text-xl font-bold italic text-dark-serpent dark:text-white mb-8 leading-relaxed">
                "{translations.careerTestimonial1}"
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img
                    src="/assets/twinky-casidsid.jpg"
                    onError={(e) => {
                      e.currentTarget.src = 'https://i.pravatar.cc/150?u=sarah';
                    }}
                    className="w-12 h-12 rounded-full object-cover shadow-lg border-2 border-white dark:border-green-900"
                    alt={translations.imgAltProfilePerson}
                  />
                  <div>
                    <p className="font-black text-dark-serpent dark:text-white">{translations.careerTestimonial1Author}</p>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-castleton-green dark:text-saffron">{translations.careerTestimonial1Meta}</p>
                  </div>
                </div>
                <div className="hidden sm:block">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => <span key={star} className="text-saffron text-sm">{'\u2605'}</span>)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2 relative">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-castleton-green/5 dark:bg-saffron/5 rounded-full blur-[60px]" />
            <div className="aspect-[16/9] rounded-[60px] overflow-hidden shadow-3xl relative border border-paper dark:border-green-900/30 bg-dark-serpent/10 dark:bg-dark-serpent group">
              <img
                src={images[currentImageIndex]}
                className="w-full h-full object-cover object-center grayscale hover:grayscale-0 transition-all duration-700"
                alt={translations.imgAltLifewoodTeam}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-serpent/60 via-transparent to-transparent pointer-events-none" />

              <button
                onClick={nextImage}
                className="absolute bottom-8 right-8 w-12 h-12 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30 transition-all hover:scale-110 z-20"
                aria-label={translations.ariaNextImage}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>

            <div className="mt-6 bg-saffron p-6 rounded-[28px] shadow-2xl w-full max-w-sm border-2 border-white dark:border-dark-serpent transform hover:-translate-y-1 transition-transform duration-500">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-dark-serpent text-white rounded-lg flex items-center justify-center font-black text-sm">L</div>
                <h4 className="font-black text-xl text-dark-serpent leading-none">{translations.careerJoinEliteTitle}</h4>
              </div>
              <p className="text-sm font-bold opacity-80 leading-relaxed">{translations.careerJoinEliteDesc}</p>
              <div className="mt-4 flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <img key={i} className="w-6 h-6 rounded-full border-2 border-saffron object-cover" src={`https://i.pravatar.cc/100?u=${i + 20}`} alt={translations.imgAltExpert} />
                ))}
                <div className="w-6 h-6 rounded-full bg-dark-serpent text-[7px] font-black text-white flex items-center justify-center border-2 border-saffron">+56k</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-40">
          <div className="text-center mb-20 max-w-2xl mx-auto">
            <h3 className="text-4xl font-black text-dark-serpent dark:text-white mb-4 tracking-tight">{translations.careerPerksTitle}</h3>
            <p className="text-xl text-green-2 dark:text-green-4 font-medium leading-relaxed">{translations.careerValuesDesc}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((b, i) => (
              <div key={i} className="p-10 bg-paper/20 dark:bg-dark-serpent/40 rounded-[40px] border border-paper dark:border-green-900/30 hover:-translate-y-2 transition-all hover:bg-white dark:hover:bg-dark-serpent hover:shadow-2xl group">
                <div className="text-5xl mb-8 group-hover:scale-110 transition-transform origin-left">{b.icon}</div>
                <h4 className="text-2xl font-black text-dark-serpent dark:text-white mb-4 group-hover:text-castleton-green dark:group-hover:text-saffron transition-colors">{b.title}</h4>
                <p className="text-green-1 dark:text-green-4 font-medium leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-40 p-12 md:p-20 bg-dark-serpent rounded-[60px] text-white relative overflow-hidden shadow-3xl border border-white/5">
          <div className="absolute top-0 right-0 w-64 h-64 bg-saffron/10 blur-[100px]" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-castleton-green/10 blur-[100px]" />
          <h3 className="text-4xl font-black mb-20 tracking-tight text-center relative z-10">{translations.careerNextTitle}</h3>
          <div className="grid md:grid-cols-4 gap-12 relative">
            <div className="hidden md:block absolute top-12 left-0 w-full h-1 bg-white/10 -z-0" />
            {steps.map((s, i) => (
              <div key={i} className="relative z-10 group">
                <div className="w-24 h-24 bg-saffron text-dark-serpent rounded-[32px] flex items-center justify-center text-3xl font-black mb-8 shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-transform">
                  {s.num}
                </div>
                <h4 className="text-2xl font-black mb-4 group-hover:text-saffron transition-colors">{s.title}</h4>
                <p className="text-green-4 leading-relaxed font-medium">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div id="job-board">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <div>
              <h3 className="text-5xl font-black text-dark-serpent dark:text-white tracking-tighter mb-4">{translations.careerOpenPositionsTitle}</h3>
              <p className="text-xl text-green-2 dark:text-green-4 font-medium">{translations.careerOpenPositionsDesc}</p>
            </div>
            <div className="flex items-center gap-4 text-sm font-black uppercase tracking-widest text-castleton-green dark:text-saffron">
              <span className="w-3 h-3 bg-castleton-green dark:bg-saffron rounded-full animate-pulse" />
              {jobs.length} {translations.careerActiveRoles}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {jobs.map((job, i) => (
              <div key={i} className="bg-white dark:bg-dark-serpent/40 rounded-[36px] border border-paper dark:border-green-900/30 p-8 md:p-9 shadow-[0_14px_36px_rgba(9,42,29,0.12)] dark:shadow-none transition-all hover:shadow-[0_18px_44px_rgba(9,42,29,0.18)] dark:hover:shadow-2xl hover:border-saffron group">
                <div className="flex items-start justify-between gap-6 mb-6">
                  <h4 className="text-3xl md:text-4xl font-black text-dark-serpent dark:text-white tracking-tight leading-tight group-hover:text-castleton-green dark:group-hover:text-saffron transition-colors">{job.title}</h4>
                  <span className="hidden md:inline-flex px-3 py-1 bg-paper dark:bg-green-900/30 text-[10px] font-black uppercase tracking-widest text-dark-serpent dark:text-white rounded-md shrink-0">{safeText(job.dept)}</span>
                </div>

                <div className="mb-6 p-4 rounded-2xl border border-castleton-green/20 dark:border-saffron/30 bg-castleton-green/5 dark:bg-saffron/10">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-castleton-green dark:text-saffron mb-2">{translations.formWorkLocationLabel}</p>
                  <p className="text-xl font-black text-dark-serpent dark:text-white flex items-center gap-2">
                    <svg className="w-5 h-5 text-castleton-green dark:text-saffron" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7zm0 9.5A2.5 2.5 0 1112 6a2.5 2.5 0 010 5.5z" />
                    </svg>
                    {safeText(job.loc)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 mb-6">
                  <span className="px-3 py-1 bg-paper dark:bg-green-900/30 text-[10px] font-black uppercase tracking-widest text-dark-serpent dark:text-white rounded-md">{safeText(job.dept)}</span>
                  <span className="px-3 py-1 bg-paper dark:bg-green-900/30 text-[10px] font-black uppercase tracking-widest text-dark-serpent dark:text-white rounded-md">{safeText(job.type)}</span>
                </div>

                <div className="mb-8">
                  <button
                    onClick={() => setExpandedJob(expandedJob === i ? null : i)}
                    className="w-full px-5 py-3 border-2 border-castleton-green/20 dark:border-saffron/40 text-castleton-green dark:text-saffron font-black rounded-2xl hover:bg-castleton-green hover:text-white dark:hover:bg-saffron dark:hover:text-dark-serpent transition-all flex items-center justify-between"
                  >
                    {translations.careerQualificationsBtn}
                    <span className={`transform transition-transform duration-300 ${expandedJob === i ? 'rotate-180' : ''}`}>{'\u25BE'}</span>
                  </button>
                  <div className={`overflow-hidden transition-all duration-500 ease-in-out ${expandedJob === i ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                    <h5 className="text-xs font-black uppercase tracking-widest text-dark-serpent dark:text-white mb-3">{translations.careerKeyQualifications}</h5>
                    <ul className="space-y-2">
                      {(job.qualifications.length > 0 ? job.qualifications : ['-']).map((q, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-dark-serpent/80 dark:text-green-4 font-medium">
                          <span className="text-castleton-green dark:text-saffron mt-1">{'\u2713'}</span>
                          {q}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-green-3 mb-1">{translations.careerCompensationLabel}</p>
                    <p className="text-sm font-bold text-dark-serpent dark:text-white">{job.pay}</p>
                  </div>
                  <button
                    onClick={() => onJoinTeam(job.positionValue)}
                    className="px-8 py-3.5 bg-castleton-green text-white font-black rounded-full hover:bg-saffron hover:text-dark-serpent transition-all shadow-xl hover:-translate-y-1 whitespace-nowrap"
                  >
                    {translations.careerApplyNow}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CareersSection;
