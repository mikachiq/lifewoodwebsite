import React, { useState, useRef } from 'react';
import { TranslationSet } from '../types';

interface CTAProps {
  translations: TranslationSet;
  onPortalClick: () => void;
}

const CTA: React.FC<CTAProps> = ({ translations, onPortalClick }) => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [subject, setSubject] = useState("");
  const formRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  const socialLinks = [
    { label: 'LinkedIn', icon: 'in', href: 'https://www.linkedin.com/company/lifewood-data-technology-ltd.' },
    { label: 'Facebook', icon: 'f', href: 'https://www.facebook.com/LifewoodPH' },
    { label: 'Instagram', icon: 'ig', href: 'https://www.instagram.com/lifewood_official/' },
    { label: 'YouTube', icon: 'yt', href: 'https://www.youtube.com/@LifewoodDataTechnology' },
  ];

  return (
    <section id="contact" className="py-24 md:py-40 px-6 md:px-12 relative overflow-hidden bg-white dark:bg-[#0a1612]">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-castleton-green/5 dark:bg-saffron/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-saffron/5 dark:bg-castleton-green/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="max-w-[1400px] mx-auto relative z-10">
        {/* Approachable Inquiry Form Grid */}
        <div className="grid lg:grid-cols-2 gap-20 lg:gap-32 items-center">
          <div className="space-y-12">
            <div className="space-y-6">
              <h3 className="text-4xl md:text-6xl lg:text-8xl font-black text-dark-serpent dark:text-white tracking-tighter leading-[0.9]">
                {translations.contactLandingHeader}
              </h3>
              <p className="text-xl text-green-1 dark:text-green-4 font-medium opacity-80 leading-relaxed max-w-lg">
                {translations.contactLandingSub}
              </p>
            </div>

            <div className="grid gap-8">
              {/* General Support Contact */}
              <div className="flex items-center gap-6 group p-6 bg-paper/20 dark:bg-white/5 rounded-3xl border border-transparent hover:border-castleton-green/20 transition-all">
                <div className="w-16 h-16 bg-white dark:bg-white/10 rounded-2xl flex items-center justify-center text-2xl shadow-lg transition-transform group-hover:scale-110">
                  {'\u{1F44B}'}
                </div>
                <div>
                  <h4 className="font-bold text-dark-serpent dark:text-white text-lg">{translations.footerSupport}</h4>
                  <a 
                    href={`mailto:${translations.contactGeneralEmail}`} 
                    className="text-castleton-green dark:text-saffron font-bold underline hover:opacity-70 transition-opacity"
                  >
                    {translations.contactGeneralEmail}
                  </a>
                </div>
              </div>

              {/* Social Media Grid Section */}
              <div className="p-8 bg-paper/10 dark:bg-white/5 rounded-3xl border border-paper dark:border-green-900/30">
                <p className="text-xs font-black uppercase tracking-widest text-green-3 dark:text-green-4 mb-6">{translations.contactConnectWithUs}</p>
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
              <div className="bg-paper/20 dark:bg-dark-serpent/40 p-1 md:p-2 rounded-[60px] shadow-3xl border border-paper dark:border-white/5">
                <form 
                  className="bg-white dark:bg-[#133020] p-6 md:p-14 rounded-[56px] space-y-6"
                  onSubmit={handleSubmit}
                >
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <input 
                        type="text" required placeholder={translations.pContFormNamePlaceholder} 
                        className="w-full p-5 bg-paper/10 dark:bg-white/5 rounded-2xl border-2 border-castleton-green/10 focus:border-castleton-green focus:outline-none transition-all placeholder-green-2/50 dark:placeholder-green-4/50 placeholder:text-xs text-dark-serpent dark:text-white font-bold text-sm" 
                      />
                    </div>
                    <div className="space-y-2">
                      <input 
                        type="email" required placeholder={translations.pContFormEmailPlaceholder} 
                        className="w-full p-5 bg-paper/10 dark:bg-white/5 rounded-2xl border-2 border-castleton-green/10 focus:border-castleton-green focus:outline-none transition-all placeholder-green-2/50 dark:placeholder-green-4/50 placeholder:text-xs text-dark-serpent dark:text-white font-bold text-sm" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="relative">
                      <select 
                        required 
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className={`w-full p-5 bg-paper/10 dark:bg-white/5 rounded-2xl border-2 border-castleton-green/10 focus:border-castleton-green focus:outline-none transition-all font-bold text-sm appearance-none cursor-pointer ${subject ? 'text-dark-serpent dark:text-white' : 'text-green-2/50 dark:text-green-4/50'}`}
                      >
                        <option value="" disabled className="text-green-2/50 dark:text-green-4/50 bg-white dark:bg-dark-serpent">{translations.contactSubjectLabel}</option>
                        <option value="general" className="text-dark-serpent dark:text-white bg-white dark:bg-dark-serpent">{translations.contactSubject1}</option>
                        <option value="partnership" className="text-dark-serpent dark:text-white bg-white dark:bg-dark-serpent">{translations.contactSubject2}</option>
                        <option value="media" className="text-dark-serpent dark:text-white bg-white dark:bg-dark-serpent">{translations.contactSubject3}</option>
                        <option value="support" className="text-dark-serpent dark:text-white bg-white dark:bg-dark-serpent">{translations.contactSubject4}</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-5 pointer-events-none text-dark-serpent dark:text-white">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path>
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <textarea 
                      required placeholder={translations.contactMessagePlaceholder} rows={4} 
                      className="w-full p-5 bg-paper/10 dark:bg-white/5 rounded-2xl border-2 border-castleton-green/10 focus:border-castleton-green focus:outline-none transition-all placeholder-green-2/50 dark:placeholder-green-4/50 placeholder:text-xs text-dark-serpent dark:text-white font-bold text-sm"
                    ></textarea>
                  </div>
                  <button 
                    type="submit"
                    className="w-full py-5 bg-castleton-green text-white font-black text-xl rounded-2xl hover:bg-green-1 transition-all shadow-2xl shadow-castleton-green/30"
                  >
                    {translations.contactBtn}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;


