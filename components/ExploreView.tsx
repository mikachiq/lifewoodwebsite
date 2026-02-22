
import React, { useEffect, useState, useRef } from 'react';
import { TranslationSet } from '../types';

interface ExploreViewProps {
  onBack: () => void;
  translations: TranslationSet;
}

const ExploreView: React.FC<ExploreViewProps> = ({ onBack, translations }) => {
  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleInquiryClick = () => {
    setShowInquiryForm(true);
    setIsSubmitted(false);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    // Smooth scroll to the success message
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  return (
    <div className="pt-32 pb-20 animate-in fade-in duration-500 bg-white dark:bg-[#0a1612]">
      <header className="max-w-[1400px] mx-auto px-6 md:px-12 mb-24 text-center">
        <span className="inline-block px-4 py-1.5 bg-paper dark:bg-green-900/40 text-castleton-green dark:text-saffron rounded-full text-xs font-bold uppercase tracking-widest mb-6">
          {translations.expHeroTag}
        </span>
        <h1 className="text-5xl md:text-7xl font-extrabold mb-8 leading-tight text-dark-serpent dark:text-white">
          {translations.expHeroTitle}
        </h1>
        <p className="text-xl text-green-1 dark:text-green-4 max-w-3xl mx-auto leading-relaxed">
          {translations.expHeroDesc}
        </p>
      </header>

      <section className="max-w-[1400px] mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Audio */}
        <div className="bg-paper/30 dark:bg-dark-serpent/40 p-10 rounded-[40px] border border-paper dark:border-green-900/50 hover:border-saffron/50 transition-all duration-500 group">
          <div className="w-16 h-16 bg-gradient-to-br from-castleton-green to-green-2 rounded-2xl flex items-center justify-center text-3xl mb-8 group-hover:scale-110 transition-transform">{'\u{1F399}\uFE0F'}</div>
          <h3 className="text-2xl font-bold mb-4 text-dark-serpent dark:text-white">{translations.expSrv1Title}</h3>
          <ul className="space-y-3 text-green-1 dark:text-green-4 font-medium">
            <li>• {translations.expSrv1D1}</li>
            <li>• {translations.expSrv1D2}</li>
            <li>• {translations.expSrv1D3}</li>
            <li>• {translations.expSrv1D4}</li>
            <li>• {translations.expSrv1D5}</li>
          </ul>
        </div>

        {/* Vision */}
        <div className="bg-paper/30 dark:bg-dark-serpent/40 p-10 rounded-[40px] border border-paper dark:border-green-900/50 hover:border-saffron/50 transition-all duration-500 group">
          <div className="w-16 h-16 bg-gradient-to-br from-saffron to-earth-yellow rounded-2xl flex items-center justify-center text-3xl mb-8 group-hover:scale-110 transition-transform">{'\u{1F441}\uFE0F'}</div>
          <h3 className="text-2xl font-bold mb-4 text-dark-serpent dark:text-white">{translations.expSrv2Title}</h3>
          <ul className="space-y-3 text-green-1 dark:text-green-4 font-medium">
            <li>• {translations.expSrv2D1}</li>
            <li>• {translations.expSrv2D2}</li>
            <li>• {translations.expSrv2D3}</li>
            <li>• {translations.expSrv2D4}</li>
            <li>• {translations.expSrv2D5}</li>
          </ul>
        </div>

        {/* NLP */}
        <div className="bg-paper/30 dark:bg-dark-serpent/40 p-10 rounded-[40px] border border-paper dark:border-green-900/50 hover:border-saffron/50 transition-all duration-500 group">
          <div className="w-16 h-16 bg-gradient-to-br from-green-2 to-green-3 rounded-2xl flex items-center justify-center text-3xl mb-8 group-hover:scale-110 transition-transform">{'\u{270D}\uFE0F'}</div>
          <h3 className="text-2xl font-bold mb-4 text-dark-serpent dark:text-white">{translations.expSrv3Title}</h3>
          <ul className="space-y-3 text-green-1 dark:text-green-4 font-medium">
            <li>• {translations.expSrv3D1}</li>
            <li>• {translations.expSrv3D2}</li>
            <li>• {translations.expSrv3D3}</li>
            <li>• {translations.expSrv3D4}</li>
            <li>• {translations.expSrv3D5}</li>
          </ul>
        </div>
      </section>

      {!showInquiryForm ? (
        <section className="mt-40 text-center px-6 animate-in slide-in-from-bottom-8 duration-700">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-10 text-dark-serpent dark:text-white">{translations.expCtaTitle}</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={onBack}
              className="inline-block px-12 py-5 bg-castleton-green text-white font-bold text-xl rounded-full hover:bg-green-1 hover:-translate-y-2 transition-all shadow-2xl"
            >
              {translations.expBtnReturn}
            </button>
            <button 
              onClick={handleInquiryClick}
              className="inline-block px-12 py-5 border-2 border-castleton-green dark:border-saffron text-castleton-green dark:text-saffron font-bold text-xl rounded-full hover:bg-castleton-green dark:hover:bg-saffron hover:text-white dark:hover:text-dark-serpent hover:-translate-y-2 transition-all shadow-lg"
            >
              {translations.expBtnInquiry}
            </button>
          </div>
        </section>
      ) : (
        <div ref={formRef} className="mt-40 bg-paper dark:bg-dark-serpent/30 py-40 px-6 animate-in fade-in duration-1000">
          <div className="max-w-[1400px] mx-auto grid lg:grid-cols-2 gap-32 items-start">
            <div>
              <h2 className="text-7xl md:text-9xl font-black text-dark-serpent dark:text-white tracking-tighter mb-10 leading-none">
                {translations.portalContactTitle}.
              </h2>
              <p className="text-2xl text-green-1 dark:text-green-4 mb-12 font-medium max-w-xl">
                {translations.portalContactDesc}
              </p>
              
              <div className="space-y-8">
                <div className="flex items-center gap-6 group">
                  <div className="w-16 h-16 bg-white dark:bg-white/10 rounded-3xl flex items-center justify-center text-2xl shadow-xl transition-transform group-hover:scale-110">{'\u{1F3E2}'}</div>
                  <div>
                    <h4 className="font-extrabold text-dark-serpent dark:text-white text-lg">{translations.pContHQ}</h4>
                    <p className="text-green-1 dark:text-green-4 font-bold opacity-80">{translations.pContHQAddr}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 group">
                  <div className="w-16 h-16 bg-white dark:bg-white/10 rounded-3xl flex items-center justify-center text-2xl shadow-xl transition-transform group-hover:scale-110">{'\u{2709}\uFE0F'}</div>
                  <div>
                    <h4 className="font-extrabold text-dark-serpent dark:text-white text-lg">{translations.pContSales}</h4>
                    <a href={`mailto:${translations.pContSalesEmail}`} className="text-castleton-green dark:text-saffron underline font-black hover:opacity-70 transition-opacity">
                      {translations.pContSalesEmail}
                    </a>
                  </div>
                </div>
              </div>

              <button 
                onClick={onBack}
                className="mt-16 group px-6 py-3 border-2 border-castleton-green/30 dark:border-saffron/30 text-castleton-green dark:text-saffron font-black text-lg rounded-full hover:bg-castleton-green dark:hover:bg-saffron hover:text-white dark:hover:text-dark-serpent transition-all flex items-center gap-3 w-fit"
              >
                <span className="group-hover:-translate-x-1 transition-transform">←</span> {translations.expBtnReturn}
              </button>
            </div>
            
            <div className="relative">
              {isSubmitted ? (
                <div className="bg-white dark:bg-dark-serpent p-12 md:p-16 rounded-[56px] shadow-3xl border border-paper dark:border-white/5 animate-in zoom-in-95 duration-500 text-center space-y-8">
                  <div className="w-24 h-24 bg-castleton-green/10 dark:bg-saffron/10 rounded-full flex items-center justify-center text-5xl mx-auto">
                    ✓
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-3xl font-black text-dark-serpent dark:text-white">{translations.inquirySuccessTitle}</h3>
                    <p className="text-xl text-green-1 dark:text-green-4 leading-relaxed font-medium">
                      {translations.inquirySuccessMessage}
                    </p>
                  </div>
                  <div className="pt-8 border-t border-castleton-green/10 dark:border-green-800">
                    <button 
                      onClick={onBack}
                      className="px-10 py-4 bg-castleton-green text-white font-bold rounded-full hover:bg-green-1 transition-all"
                    >
                      {translations.expBtnReturn}
                    </button>
                  </div>
                </div>
              ) : (
                <form className="space-y-6 bg-white dark:bg-dark-serpent p-12 rounded-[56px] shadow-3xl border border-paper dark:border-white/5" onSubmit={handleSubmit}>
                  <div className="grid md:grid-cols-2 gap-6">
                    <input 
                      type="text" 
                      required
                      placeholder={translations.pContFormNamePlaceholder} 
                      className="w-full p-6 bg-paper/10 dark:bg-white/5 rounded-2xl border-2 border-castleton-green/10 focus:border-castleton-green focus:outline-none text-dark-serpent dark:text-white placeholder-green-2/50 dark:placeholder-green-4/50 placeholder:text-xs transition-all font-bold text-sm" 
                    />
                    <input 
                      type="email" 
                      required
                      placeholder={translations.pContFormEmailPlaceholder} 
                      className="w-full p-6 bg-paper/10 dark:bg-white/5 rounded-2xl border-2 border-castleton-green/10 focus:border-castleton-green focus:outline-none text-dark-serpent dark:text-white placeholder-green-2/50 dark:placeholder-green-4/50 placeholder:text-xs transition-all font-bold text-sm" 
                    />
                  </div>
                  <input 
                    type="text" 
                    required
                    placeholder={translations.pContFormOrgPlaceholder} 
                    className="w-full p-6 bg-paper/10 dark:bg-white/5 rounded-2xl border-2 border-castleton-green/10 focus:border-castleton-green focus:outline-none text-dark-serpent dark:text-white placeholder-green-2/50 dark:placeholder-green-4/50 placeholder:text-xs transition-all font-bold text-sm" 
                  />
                  <textarea 
                    placeholder={translations.pContFormMsgPlaceholder} 
                    rows={4} 
                    required
                    className="w-full p-6 bg-paper/10 dark:bg-white/5 rounded-2xl border-2 border-castleton-green/10 focus:border-castleton-green focus:outline-none text-dark-serpent dark:text-white placeholder-green-2/50 dark:placeholder-green-4/50 placeholder:text-xs transition-all font-bold text-sm"
                  ></textarea>
                  <button className="w-full py-6 bg-castleton-green text-white font-black text-2xl rounded-2xl hover:bg-green-1 hover:-translate-y-1 transition-all shadow-2xl shadow-castleton-green/20">
                    {translations.pContFormBtn}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExploreView;


