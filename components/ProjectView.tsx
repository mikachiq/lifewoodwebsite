import React, { useEffect, useState, useRef } from 'react';
import { TranslationSet } from '../types';

interface ProjectViewProps {
  onBack: () => void;
  translations: TranslationSet;
}

const ProjectView: React.FC<ProjectViewProps> = ({ onBack, translations }) => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const socialLinks = [
    { label: 'LinkedIn', icon: 'in', href: 'https://www.linkedin.com/company/lifewood-data-technology-ltd.' },
    { label: 'Facebook', icon: 'f', href: 'https://www.facebook.com/LifewoodPH' },
    { label: 'Instagram', icon: 'ig', href: 'https://www.instagram.com/lifewood_official/' },
    { label: 'YouTube', icon: 'yt', href: 'https://www.youtube.com/@LifewoodDataTechnology' },
  ];

  return (
    <div className="pt-32 pb-20 animate-in fade-in duration-500 bg-white dark:bg-[#0a1612] min-h-screen">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        <div className="grid lg:grid-cols-2 gap-20 lg:gap-32 items-center">
          {/* Left Content Side */}
          <div className="space-y-12">
            <div className="space-y-6">
              <button 
                onClick={onBack}
                className="text-castleton-green dark:text-saffron font-black uppercase tracking-widest text-xs flex items-center gap-2 mb-8 hover:opacity-70 transition-opacity"
              >
                ← {translations.expBtnReturn}
              </button>
              <h1 className="text-5xl md:text-7xl lg:text-9xl font-black text-dark-serpent dark:text-white tracking-tighter leading-none">
                {translations.projHeroTitle}.
              </h1>
              <p className="text-2xl text-green-1 dark:text-green-4 mb-12 font-medium opacity-80 max-w-xl">
                {translations.projHeroDesc}
              </p>
            </div>
            
            <div className="grid gap-8">
              <div className="flex items-center gap-6 group p-6 md:p-8 bg-paper/20 dark:bg-white/5 rounded-3xl border border-transparent hover:border-castleton-green/20 transition-all">
                <div className="w-16 h-16 bg-white dark:bg-white/10 rounded-2xl flex items-center justify-center text-3xl shadow-xl transition-transform group-hover:scale-110">{'\u{1F3E2}'}</div>
                <div>
                  <h4 className="font-black text-dark-serpent dark:text-white text-xl">{translations.pContHQ}</h4>
                  <p className="text-green-2 dark:text-green-4 font-bold opacity-80 text-lg">{translations.pContHQAddr}</p>
                </div>
              </div>
              <div className="flex items-center gap-6 group p-6 md:p-8 bg-paper/20 dark:bg-white/5 rounded-3xl border border-transparent hover:border-saffron/20 transition-all">
                <div className="w-16 h-16 bg-white dark:bg-white/10 rounded-2xl flex items-center justify-center text-3xl shadow-xl transition-transform group-hover:scale-110">{'\u{2709}\uFE0F'}</div>
                <div>
                  <h4 className="font-black text-dark-serpent dark:text-white text-xl">{translations.pContSales}</h4>
                  <a href={`mailto:${translations.pContSalesEmail}`} className="text-castleton-green dark:text-saffron underline font-black text-lg hover:opacity-70 transition-opacity">
                    {translations.pContSalesEmail}
                  </a>
                </div>
              </div>

              {/* Socials */}
              <div className="p-6 md:p-8 bg-paper/10 dark:bg-white/5 rounded-3xl border border-paper dark:border-green-900/30">
                <p className="text-xs font-black uppercase tracking-widest text-green-3 dark:text-green-4 mb-6">{translations.contactConnectWithTeam}</p>
                <div className="flex gap-4">
                  {socialLinks.map((s, i) => (
                    <a 
                      key={i} 
                      href={s.href} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white dark:bg-white/10 text-dark-serpent dark:text-white hover:bg-saffron dark:hover:bg-saffron hover:text-dark-serpent dark:hover:text-dark-serpent transition-all hover:-translate-y-1 shadow-md"
                      title={s.label}
                    >
                      <span className="font-black text-sm">{s.icon}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Form Side */}
          <div className="relative" ref={formRef}>
            {isSubmitted ? (
              <div className="bg-white dark:bg-dark-serpent p-8 md:p-20 rounded-[56px] shadow-3xl border border-paper dark:border-white/5 text-center space-y-8 animate-in zoom-in-95 duration-500">
                <div className="w-24 h-24 bg-castleton-green/10 dark:bg-saffron/10 rounded-full flex items-center justify-center text-5xl mx-auto">
                  {'\u{1F389}'}
                </div>
                <div className="space-y-4">
                  <h3 className="text-3xl font-black text-dark-serpent dark:text-white">{translations.inquirySuccessTitle}</h3>
                  <p className="text-xl text-green-1 dark:text-green-4 leading-relaxed font-medium">
                    {translations.inquirySuccessMessage}
                  </p>
                </div>
                <button 
                  onClick={() => setIsSubmitted(false)}
                  className="text-castleton-green dark:text-saffron font-black uppercase tracking-widest text-sm border-b-2 border-current pb-1"
                >
                  {translations.sendAnotherMessage}
                </button>
              </div>
            ) : (
              <div className="bg-paper/20 dark:bg-dark-serpent/40 p-2 rounded-[60px] shadow-3xl border border-paper dark:border-white/5">
                <form className="bg-white dark:bg-[#133020] p-6 md:p-14 rounded-[56px] space-y-6" onSubmit={handleSubmit}>
                  <div className="grid md:grid-cols-2 gap-6">
                    <input 
                      type="text" required placeholder={translations.pContFormNamePlaceholder} 
                      className="w-full p-6 bg-paper/10 dark:bg-white/5 rounded-2xl border-2 border-castleton-green/10 focus:border-castleton-green focus:outline-none transition-all placeholder-green-2/50 dark:placeholder-green-4/50 placeholder:text-xs text-dark-serpent dark:text-white font-bold text-sm" 
                    />
                    <input 
                      type="email" required placeholder={translations.pContFormEmailPlaceholder} 
                      className="w-full p-6 bg-paper/10 dark:bg-white/5 rounded-2xl border-2 border-castleton-green/10 focus:border-castleton-green focus:outline-none transition-all placeholder-green-2/50 dark:placeholder-green-4/50 placeholder:text-xs text-dark-serpent dark:text-white font-bold text-sm" 
                    />
                  </div>
                  <input 
                    type="text" required placeholder={translations.pContFormOrgPlaceholder} 
                    className="w-full p-6 bg-paper/10 dark:bg-white/5 rounded-2xl border-2 border-castleton-green/10 focus:border-castleton-green focus:outline-none transition-all placeholder-green-2/50 dark:placeholder-green-4/50 placeholder:text-xs text-dark-serpent dark:text-white font-bold text-sm" 
                  />
                  <textarea 
                    required placeholder={translations.contactMessagePlaceholder} rows={4} 
                    className="w-full p-6 bg-paper/10 dark:bg-white/5 rounded-2xl border-2 border-castleton-green/10 focus:border-castleton-green focus:outline-none transition-all placeholder-green-2/50 dark:placeholder-green-4/50 placeholder:text-xs text-dark-serpent dark:text-white font-bold text-sm"
                  ></textarea>
                  <button className="w-full py-6 bg-castleton-green text-white font-black text-2xl rounded-2xl hover:bg-green-1 transition-all shadow-2xl shadow-castleton-green/30">
                    {translations.pContFormBtn}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectView;


