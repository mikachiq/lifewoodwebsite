import React, { useEffect, useState } from 'react';
import { TranslationSet } from '../types';
import NeuralBackground from './NeuralBackground';

interface CompanyViewProps {
  onBack: () => void;
  translations: TranslationSet;
  onJoinTeam: () => void;
}

const CompanyView: React.FC<CompanyViewProps> = ({ onBack, translations, onJoinTeam }) => {
  const [isInquirySubmitted, setIsInquirySubmitted] = useState(false);
  const [formState, setFormState] = useState({
    service: "",
    model: ""
  });

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsInquirySubmitted(true);
  };

  const handleScrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const processSteps = [
    { icon: "\u{1F4AC}", title: translations.portalProcessStep1Title, desc: translations.portalProcessStep1Desc },
    { icon: "\u{1F4CA}", title: translations.portalProcessStep2Title, desc: translations.portalProcessStep2Desc },
    { icon: "\u{1F9E0}", title: translations.portalProcessStep3Title, desc: translations.portalProcessStep3Desc },
    { icon: "✓", title: translations.portalProcessStep4Title, desc: translations.portalProcessStep4Desc },
    { icon: "\u{1F680}", title: translations.portalProcessStep5Title, desc: translations.portalProcessStep5Desc },
    { icon: "\u{1F504}", title: translations.portalProcessStep6Title, desc: translations.portalProcessStep6Desc }
  ];

  const toolsCategories = [
    { 
      icon: "\u{1F916}", 
      title: translations.portalTools1Title, 
      desc: translations.portalTools1Desc,
      tags: [translations.portalToolsTagLLM, translations.portalToolsTagCV, translations.portalToolsTagNLP]
    },
    { 
      icon: "\u2601\uFE0F", 
      title: translations.portalTools2Title, 
      desc: translations.portalTools2Desc,
      tags: [translations.portalToolsTagAWS, translations.portalToolsTagGCP, translations.portalToolsTagAzure, translations.portalToolsTagLakes]
    },
    { 
      icon: "\u{1F3F7}\uFE0F", 
      title: translations.portalTools3Title, 
      desc: translations.portalTools3Desc,
      tags: [translations.portalToolsTagAnnot, translations.portalToolsTagQC]
    },
    { 
      icon: "\u{1F50C}", 
      title: translations.portalTools4Title, 
      desc: translations.portalTools4Desc,
      tags: [translations.portalToolsTagAPI, translations.portalToolsTagDash, translations.portalToolsTagConn]
    }
  ];

  const engagementModels = [
    {
      title: translations.portalResultCard1Title,
      desc: translations.portalEngage1Desc,
      useCase: translations.portalEngage1Use,
      icon: "\u{1F4E6}"
    },
    {
      title: translations.portalResultCard2Title,
      desc: translations.portalEngage2Desc,
      useCase: translations.portalEngage2Use,
      icon: "\u{1F91D}"
    },
    {
      title: translations.portalResultCard3Title,
      desc: translations.portalEngage3Desc,
      useCase: translations.portalEngage3Use,
      icon: "\u{1F4C8}"
    }
  ];

  const ethicsPillars = [
    { icon: "\u{1F512}", title: translations.portalEthics1Title, desc: translations.portalEthics1Desc },
    { icon: "\u{1F6E1}\uFE0F", title: translations.portalEthics2Title, desc: translations.portalEthics2Desc },
    { icon: "\u2696\uFE0F", title: translations.portalEthics3Title, desc: translations.portalEthics3Desc },
    { icon: "\u{1F4DD}", title: translations.portalEthics4Title, desc: translations.portalEthics4Desc }
  ];

  const pricingTiers = [
    {
      title: translations.portalPricingTier1Title,
      range: "$5,000-$15,000",
      desc: translations.portalPricingTier1Desc,
      features: [translations.portalPricingTier1F1, translations.portalPricingTier1F2, translations.portalPricingTier1F3],
      highlight: false
    },
    {
      title: translations.portalPricingTier2Title,
      range: "$15,000-$50,000",
      desc: translations.portalPricingTier2Desc,
      features: [translations.portalPricingTier2F1, translations.portalPricingTier2F2, translations.portalPricingTier2F3, translations.portalPricingTier2F4],
      highlight: true
    },
    {
      title: translations.portalPricingTier3Title,
      range: translations.portalPricingTier3Range,
      desc: translations.portalPricingTier3Desc,
      features: [translations.portalPricingTier3F1, translations.portalPricingTier3F2, translations.portalPricingTier3F3, translations.portalPricingTier3F4],
      highlight: false
    }
  ];

  const roadmapSteps = [
    { icon: "\u{1F50D}", title: translations.portalRoadmap1Title, desc: translations.portalRoadmap1Desc },
    { icon: "\u{1F4CB}", title: translations.portalRoadmap2Title, desc: translations.portalRoadmap2Desc },
    { icon: "\u{1F91D}", title: translations.portalRoadmap3Title, desc: translations.portalRoadmap3Desc },
    { icon: "\u2699\uFE0F", title: translations.portalRoadmap4Title, desc: translations.portalRoadmap4Desc },
    { icon: "\u{1F4E6}", title: translations.portalRoadmap5Title, desc: translations.portalRoadmap5Desc },
    { icon: "\u{1F504}", title: translations.portalRoadmap6Title, desc: translations.portalRoadmap6Desc }
  ];

  return (
    <div className="animate-in fade-in duration-1000 bg-white dark:bg-[#0a1612]">
      
      {/* 1. HOME - Welcome Hero */}
      <header id="portal-home" className="relative min-h-[80vh] flex items-center bg-dark-serpent overflow-hidden text-white pt-20">
        <NeuralBackground theme="dark" intensity="high" />
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-dark-serpent via-dark-serpent/60 to-transparent z-10" />
        </div>
        
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 relative z-20 w-full py-20">
          <div className="max-w-4xl mb-16">
            <span className="inline-block px-4 py-1 bg-saffron text-dark-serpent font-black text-[10px] uppercase tracking-[0.4em] mb-6 rounded">
              {translations.portalBadge}
            </span>
            <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter leading-[0.9]">
              {translations.portalHeroTitle}
            </h1>
            <p className="text-xl md:text-2xl font-medium leading-relaxed opacity-90 max-w-2xl text-green-4">
              {translations.portalHeroDesc}
            </p>
          </div>
        </div>
      </header>

      {/* 2. OUR PROCESS */}
      <section id="portal-process" className="py-24 bg-paper/30 dark:bg-[#0d1f16] border-b border-paper dark:border-green-900/30">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-dark-serpent dark:text-white mb-4 tracking-tighter">{translations.portalProcessTitle}</h2>
            <p className="text-xl text-green-2 dark:text-green-4 font-medium">{translations.portalProcessDesc}</p>
          </div>

          <div className="relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden lg:block absolute top-12 left-0 w-full h-1 bg-castleton-green/10 dark:bg-saffron/10 -z-0" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
              {processSteps.map((step, i) => (
                <div key={i} className="relative z-10 flex flex-col items-center text-center group">
                  <div className="w-24 h-24 bg-white dark:bg-dark-serpent border-4 border-paper dark:border-green-900 rounded-full flex items-center justify-center text-3xl shadow-lg mb-6 group-hover:border-castleton-green dark:group-hover:border-saffron transition-colors bg-paper dark:bg-green-900/20">
                    {step.icon}
                  </div>
                  <h3 className="text-lg font-bold text-dark-serpent dark:text-white mb-3 leading-tight">{step.title}</h3>
                  <p className="text-sm text-green-2 dark:text-green-4 font-medium">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. TOOLS & TECHNOLOGY */}
      <section id="portal-tools" className="py-24 bg-white dark:bg-[#0a1612]">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-dark-serpent dark:text-white mb-4 tracking-tighter">{translations.portalOffersTitle}</h2>
            <p className="text-xl text-green-2 dark:text-green-4 font-medium">{translations.portalOffersDesc}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {toolsCategories.map((cat, i) => (
              <div key={i} className="p-8 rounded-[32px] border border-paper dark:border-green-900/30 bg-paper/20 dark:bg-white/5 hover:bg-paper/40 dark:hover:bg-white/10 transition-all group">
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 bg-white dark:bg-dark-serpent rounded-2xl flex items-center justify-center text-3xl shadow-md shrink-0">
                    {cat.icon}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-dark-serpent dark:text-white mb-3 group-hover:text-castleton-green dark:group-hover:text-saffron transition-colors">{cat.title}</h3>
                    <p className="text-green-2 dark:text-green-4 font-medium mb-6 leading-relaxed">{cat.desc}</p>
                    <div className="flex flex-wrap gap-2">
                      {cat.tags.map((tag, t) => (
                        <span key={t} className="px-3 py-1 bg-white dark:bg-green-900/30 rounded-full text-xs font-bold text-dark-serpent dark:text-white border border-paper dark:border-green-900/50">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. ENGAGEMENT MODELS */}
      <section id="portal-engagement" className="py-24 bg-dark-serpent text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-castleton-green/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tighter">{translations.portalEngagementTitle}</h2>
            <p className="text-xl text-green-4 font-medium">{translations.portalEngagementDesc}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {engagementModels.map((model, i) => (
              <div key={i} className="p-10 bg-white/5 border border-white/10 rounded-[40px] hover:bg-white/10 transition-all flex flex-col">
                <div className="text-5xl mb-6">{model.icon}</div>
                <h3 className="text-3xl font-black mb-4 text-saffron">{model.title}</h3>
                <p className="text-lg text-white/90 font-medium mb-6 flex-grow">{model.desc}</p>
                <div className="p-4 bg-black/20 rounded-xl mb-8 border border-white/5">
                  <p className="text-sm font-bold text-green-4">💡 {model.useCase}</p>
                </div>
                <button onClick={() => handleScrollTo('portal-start')} className="w-full py-4 rounded-full border border-white/20 font-bold hover:bg-white hover:text-dark-serpent transition-all">
                  {translations.portalNavContact}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. DATA ETHICS & COMPLIANCE */}
      <section id="portal-ethics" className="py-24 bg-paper/30 dark:bg-[#0d1f16] border-y border-paper dark:border-green-900/30">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-black text-dark-serpent dark:text-white mb-4 tracking-tighter">{translations.portalEthicsTitle}</h2>
            <p className="text-xl text-green-2 dark:text-green-4 font-medium">{translations.portalEthicsDesc}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {ethicsPillars.map((pillar, i) => (
              <div key={i} className="flex gap-6 p-8 bg-white dark:bg-white/5 rounded-[32px] border border-paper dark:border-green-900/30 shadow-sm hover:shadow-xl transition-all">
                <div className="w-16 h-16 bg-paper dark:bg-green-900/20 rounded-2xl flex items-center justify-center text-3xl shrink-0">
                  {pillar.icon}
                </div>
                <div>
                  <h3 className="text-xl font-black text-dark-serpent dark:text-white mb-2">{pillar.title}</h3>
                  <p className="text-green-2 dark:text-green-4 font-medium leading-relaxed">{pillar.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. PRICING OVERVIEW */}
      <section id="portal-pricing" className="py-24 bg-white dark:bg-[#0a1612]">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-dark-serpent dark:text-white mb-4 tracking-tighter">{translations.portalPricingTitle}</h2>
            <p className="text-xl text-green-2 dark:text-green-4 font-medium">{translations.portalPricingDesc}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {pricingTiers.map((tier, i) => (
              <div key={i} className={`p-10 rounded-[40px] border flex flex-col ${tier.highlight ? 'bg-dark-serpent text-white border-dark-serpent shadow-2xl scale-105 z-10' : 'bg-paper/20 dark:bg-white/5 border-paper dark:border-green-900/30 text-dark-serpent dark:text-white'}`}>
                <div className="mb-8">
                  <h3 className={`text-2xl font-black mb-2 ${tier.highlight ? 'text-saffron' : 'text-dark-serpent dark:text-white'}`}>{tier.title}</h3>
                  <p className={`text-sm font-bold uppercase tracking-widest opacity-60 ${tier.highlight ? 'text-white' : 'text-dark-serpent dark:text-white'}`}>{tier.desc}</p>
                </div>
                <div className="mb-8">
                  <p className="text-3xl font-black mb-1">{tier.range}</p>
                  <p className="text-xs font-bold opacity-50 uppercase tracking-widest">{translations.portalIndicativeRange}</p>
                </div>
                <ul className="space-y-4 mb-8 flex-grow">
                  {tier.features.map((feat, f) => (
                    <li key={f} className="flex items-center gap-3 font-medium">
                      <span className={tier.highlight ? 'text-saffron' : 'text-castleton-green'}>✓</span>
                      <span className="opacity-90">{feat}</span>
                    </li>
                  ))}
                </ul>
                <button onClick={() => handleScrollTo('portal-start')} className={`w-full py-4 rounded-full font-black transition-all ${tier.highlight ? 'bg-saffron text-dark-serpent hover:bg-white' : 'bg-dark-serpent text-white hover:bg-castleton-green dark:bg-white dark:text-dark-serpent dark:hover:bg-saffron'}`}>
                  {translations.portalGetQuote}
                </button>
              </div>
            ))}
          </div>
          
          <p className="text-center text-sm font-bold text-green-2 dark:text-green-4 opacity-70 max-w-2xl mx-auto">
            {translations.portalPricingNote}
          </p>
        </div>
      </section>

      {/* 7. START A PROJECT */}
      <section id="portal-start" className="py-24 bg-paper/30 dark:bg-[#0d1f16] border-t border-paper dark:border-green-900/30">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          
          {/* Part 1: Project Journey Roadmap */}
          <div className="mb-24">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black text-dark-serpent dark:text-white mb-4 tracking-tighter">{translations.portalJourneyTitle}</h2>
              <p className="text-xl text-green-2 dark:text-green-4 font-medium">{translations.portalJourneyDesc}</p>
            </div>

            <div className="relative">
               {/* Connecting Line */}
               <div className="hidden lg:block absolute top-8 left-0 w-full h-1 bg-gradient-to-r from-castleton-green/20 via-saffron/50 to-castleton-green/20 dark:from-green-900/40 dark:via-saffron/40 dark:to-green-900/40 -z-0 rounded-full" />
               
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
                 {roadmapSteps.map((step, i) => (
                   <div key={i} className="relative z-10 flex flex-col items-center text-center group animate-in fade-in slide-in-from-left-4 duration-700" style={{ animationDelay: `${i * 150}ms` }}>
                     <div className="w-16 h-16 bg-white dark:bg-dark-serpent border-4 border-castleton-green dark:border-saffron rounded-full flex items-center justify-center text-2xl shadow-lg mb-6 z-10 relative">
                       {step.icon}
                     </div>
                     <h3 className="text-base font-black text-dark-serpent dark:text-white mb-2 leading-tight">{step.title}</h3>
                     <p className="text-xs text-green-2 dark:text-green-4 font-bold leading-relaxed px-2">{step.desc}</p>
                   </div>
                 ))}
               </div>
            </div>
          </div>

          {/* Part 2: The Form */}
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-black text-dark-serpent dark:text-white mb-4">{translations.projCtaTitle}</h2>
              <p className="text-lg text-green-2 dark:text-green-4 font-medium">{translations.projCtaDesc}</p>
            </div>

            {isInquirySubmitted ? (
              <div className="bg-white dark:bg-[#133020] p-8 md:p-16 rounded-[48px] shadow-2xl border border-paper dark:border-white/5 text-center space-y-8 animate-in zoom-in-95 duration-500">
                <div className="w-20 h-20 bg-castleton-green/10 dark:bg-saffron/10 rounded-full flex items-center justify-center text-4xl mx-auto">✓</div>
                <div className="space-y-3">
                  <h3 className="text-3xl font-black text-dark-serpent dark:text-white tracking-tighter">{translations.inquirySuccessTitle}</h3>
                  <p className="text-lg text-green-1 dark:text-green-4 leading-relaxed font-medium">{translations.inquirySuccessMessage}</p>
                </div>
                <button onClick={() => setIsInquirySubmitted(false)} className="px-10 py-4 bg-castleton-green text-white font-black rounded-full hover:bg-green-1 transition-all">{translations.portalSendAnotherInquiry}</button>
              </div>
            ) : (
              <div className="bg-white dark:bg-[#112a1c] p-6 md:p-12 rounded-[48px] border border-paper dark:border-white/5 shadow-xl">
                <form onSubmit={handleInquirySubmit} className="space-y-10">
                  {/* ... Existing Form Fields ... */}
                  {/* Section 01: Account Details */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 border-b border-castleton-green/10 dark:border-white/10 pb-2">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-castleton-green dark:text-saffron">{translations.portalAccountDetails}</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-green-2 dark:text-green-4 uppercase tracking-wider opacity-80 px-1">{translations.pContFormName}</label>
                        <input type="text" required placeholder={translations.pContFormNamePlaceholder} className="w-full p-3.5 bg-paper/10 dark:bg-white/5 rounded-2xl border-2 border-castleton-green/10 focus:border-castleton-green focus:outline-none transition-all text-dark-serpent dark:text-white placeholder-green-2/50 dark:placeholder-green-4/50 placeholder:text-xs font-bold text-sm" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-green-2 dark:text-green-4 uppercase tracking-wider opacity-80 px-1">{translations.pContFormEmail}</label>
                        <input type="email" required placeholder={translations.pContFormEmailPlaceholder} className="w-full p-3.5 bg-paper/10 dark:bg-white/5 rounded-2xl border-2 border-castleton-green/10 focus:border-castleton-green focus:outline-none transition-all text-dark-serpent dark:text-white placeholder-green-2/50 dark:placeholder-green-4/50 placeholder:text-xs font-bold text-sm" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-green-2 dark:text-green-4 uppercase tracking-wider opacity-80 px-1">{translations.pContFormOrg}</label>
                        <input type="text" required placeholder={translations.pContFormOrgPlaceholder} className="w-full p-3.5 bg-paper/10 dark:bg-white/5 rounded-2xl border-2 border-castleton-green/10 focus:border-castleton-green focus:outline-none transition-all text-dark-serpent dark:text-white placeholder-green-2/50 dark:placeholder-green-4/50 placeholder:text-xs font-bold text-sm" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-green-2 dark:text-green-4 uppercase tracking-wider opacity-80 px-1">{translations.projFormRole}</label>
                        <input type="text" required placeholder={translations.projFormRole} className="w-full p-3.5 bg-paper/10 dark:bg-white/5 rounded-2xl border-2 border-castleton-green/10 focus:border-castleton-green focus:outline-none transition-all text-dark-serpent dark:text-white placeholder-green-2/50 dark:placeholder-green-4/50 placeholder:text-xs font-bold text-sm" />
                      </div>
                    </div>
                  </div>

                  {/* Section 02: Project Specifics */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 border-b border-castleton-green/10 dark:border-white/10 pb-2">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-castleton-green dark:text-saffron">{translations.portalProjectSpecifics}</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-green-2 dark:text-green-4 uppercase tracking-wider opacity-80 px-1">{translations.projFormService}</label>
                        <div className="relative">
                          <select 
                            required 
                            name="service"
                            value={formState.service}
                            onChange={handleSelectChange}
                            className={`w-full p-3.5 bg-paper/10 dark:bg-white/5 rounded-2xl border-2 border-castleton-green/10 focus:border-castleton-green focus:outline-none transition-all font-bold text-sm appearance-none cursor-pointer ${formState.service ? 'text-dark-serpent dark:text-white' : 'text-green-2/50 dark:text-green-4/50'}`}
                          >
                            <option value="" disabled className="text-green-2/50 dark:text-green-4/50">{translations.portalSelectService}</option>
                            <option value="Global Workforce Solutions" className="text-dark-serpent dark:text-white bg-white dark:bg-dark-serpent">{translations.portalServiceOption1}</option>
                            <option value="Custom AI Integration" className="text-dark-serpent dark:text-white bg-white dark:bg-dark-serpent">{translations.portalServiceOption2}</option>
                            <option value="Data Annotation" className="text-dark-serpent dark:text-white bg-white dark:bg-dark-serpent">{translations.portalServiceOption3}</option>
                            <option value="Other" className="text-dark-serpent dark:text-white bg-white dark:bg-dark-serpent">{translations.portalServiceOther}</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-dark-serpent dark:text-white">
                            <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path>
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-green-2 dark:text-green-4 uppercase tracking-wider opacity-80 px-1">{translations.projFormEngagement}</label>
                        <div className="relative">
                          <select 
                            required 
                            name="model"
                            value={formState.model}
                            onChange={handleSelectChange}
                            className={`w-full p-3.5 bg-paper/10 dark:bg-white/5 rounded-2xl border-2 border-castleton-green/10 focus:border-castleton-green focus:outline-none transition-all font-bold text-sm appearance-none cursor-pointer ${formState.model ? 'text-dark-serpent dark:text-white' : 'text-green-2/50 dark:text-green-4/50'}`}
                          >
                            <option value="" disabled className="text-green-2/50 dark:text-green-4/50">{translations.portalSelectModel}</option>
                            <option value="Per-Project" className="text-dark-serpent dark:text-white bg-white dark:bg-dark-serpent">{translations.projFormEng1}</option>
                            <option value="Retainer" className="text-dark-serpent dark:text-white bg-white dark:bg-dark-serpent">{translations.projFormEng3}</option>
                            <option value="Phased Delivery" className="text-dark-serpent dark:text-white bg-white dark:bg-dark-serpent">{translations.projFormEng2}</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-dark-serpent dark:text-white">
                            <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path>
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-green-2 dark:text-green-4 uppercase tracking-wider opacity-80 px-1">{translations.projFormDataVolume}</label>
                        <input type="text" placeholder={translations.projFormDataVolume} className="w-full p-3.5 bg-paper/10 dark:bg-white/5 rounded-2xl border-2 border-castleton-green/10 focus:border-castleton-green focus:outline-none transition-all text-dark-serpent dark:text-white placeholder-green-2/50 dark:placeholder-green-4/50 placeholder:text-xs font-bold text-sm" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-green-2 dark:text-green-4 uppercase tracking-wider opacity-80 px-1">{translations.projFormTechStack}</label>
                        <input type="text" placeholder={translations.projFormTechStack} className="w-full p-3.5 bg-paper/10 dark:bg-white/5 rounded-2xl border-2 border-castleton-green/10 focus:border-castleton-green focus:outline-none transition-all text-dark-serpent dark:text-white placeholder-green-2/50 dark:placeholder-green-4/50 placeholder:text-xs font-bold text-sm" />
                      </div>
                    </div>
                  </div>

                  {/* Section 03: Outcome */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 border-b border-castleton-green/10 dark:border-white/10 pb-2">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-castleton-green dark:text-saffron">{translations.portalOutcomeExpectations}</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-green-2 dark:text-green-4 uppercase tracking-wider opacity-80 px-1">{translations.projFormSuccess}</label>
                        <textarea required placeholder={translations.projFormSuccessPlaceholder} rows={3} className="w-full p-4 bg-paper/10 dark:bg-white/5 rounded-2xl border-2 border-castleton-green/10 focus:border-castleton-green focus:outline-none transition-all text-dark-serpent dark:text-white placeholder-green-2/50 dark:placeholder-green-4/50 placeholder:text-xs font-bold text-sm resize-none"></textarea>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-green-2 dark:text-green-4 uppercase tracking-wider opacity-80 px-1">{translations.pContFormMsg}</label>
                        <textarea required placeholder={translations.pContFormMsgPlaceholder} rows={3} className="w-full p-4 bg-paper/10 dark:bg-white/5 rounded-2xl border-2 border-castleton-green/10 focus:border-castleton-green focus:outline-none transition-all text-dark-serpent dark:text-white placeholder-green-2/50 dark:placeholder-green-4/50 placeholder:text-xs font-bold text-sm resize-none"></textarea>
                      </div>
                    </div>
                  </div>

                  {/* Form Footer */}
                  <div className="pt-6 border-t border-castleton-green/10 dark:border-white/10">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="flex items-center gap-3 opacity-60">
                         <span className="w-2 h-2 bg-saffron rounded-full animate-pulse" />
                         <p className="text-[10px] font-black text-green-2 dark:text-green-4 uppercase tracking-[0.3em]">
                           {translations.projFormNote}
                         </p>
                      </div>
                      <button type="submit" className="w-full md:w-auto px-16 py-5 bg-castleton-green text-white font-black text-xl rounded-2xl hover:bg-green-1 transition-all shadow-xl shadow-castleton-green/30">
                        {translations.pContFormBtn}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default CompanyView;


