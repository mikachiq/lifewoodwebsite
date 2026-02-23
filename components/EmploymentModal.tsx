import React, { useState } from 'react';
import { TranslationSet } from '../types';

interface EmploymentModalProps {
  onClose: () => void;
  translations: TranslationSet;
  onExplorePortal: () => void;
}

const EmploymentModal: React.FC<EmploymentModalProps> = ({ onClose, translations, onExplorePortal }) => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneCountryCode: '+60',
    phoneNumber: '',
    country: '',
    city: '',
    position: '',
    experience: '',
    workLocation: '',
    availability: '',
    languages: [] as string[],
    skills: '',
    coverLetter: '',
    linkedin: '',
    portfolio: '',
    additionalInfo: '',
  });

  const [fileName, setFileName] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  const benefits = [
    { icon: '\u{1F30D}', label: translations.benefit1 },
    { icon: '\u{1F680}', label: translations.benefit2 },
    { icon: '\u{1F4B0}', label: translations.benefit3 },
    { icon: '\u{1F331}', label: translations.benefit4 },
    { icon: '\u{1F91D}', label: translations.benefit5 },
    { icon: '\u{1F3AF}', label: translations.benefit6 },
  ];

  const positions = [
    { value: 'data-annotator', label: translations.formPosAnnotator },
    { value: 'data-analyst', label: translations.formPosAnalyst },
    { value: 'ai-trainer', label: translations.formPosTrainer },
    { value: 'project-manager', label: translations.formPosManager },
    { value: 'intern', label: translations.formPosIntern },
  ];

  const experienceLevels = [
    { value: 'entry', label: translations.formExpEntry },
    { value: 'mid', label: translations.formExpMid },
    { value: 'senior', label: translations.formExpSenior },
  ];

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-dark-serpent/95 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative bg-paper dark:bg-[#0a1612] w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[32px] shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col">
        {isSubmitted ? (
          <div className="p-8 md:p-24 text-center animate-in zoom-in-95 duration-500">
             <div className="w-24 h-24 bg-castleton-green/10 dark:bg-saffron/10 rounded-full flex items-center justify-center text-5xl mx-auto mb-10 animate-bounce">
                ✓
             </div>
             <h2 className="text-4xl md:text-5xl font-black text-dark-serpent dark:text-white mb-6 tracking-tighter">
                {translations.formSuccessTitle}
             </h2>
             <p className="text-xl text-green-1 dark:text-green-4 leading-relaxed font-medium max-w-lg mx-auto mb-12">
                {translations.formSuccess}
             </p>
             <div className="flex flex-col sm:flex-row gap-5 justify-center">
               <button 
                 onClick={onExplorePortal}
                 className="px-10 py-5 bg-saffron text-dark-serpent font-black text-xl rounded-full hover:bg-earth-yellow transition-all shadow-xl hover:-translate-y-1 flex items-center justify-center gap-2 group"
               >
                 {translations.formSuccessExplore} <span className="group-hover:translate-x-1 transition-transform">→</span>
               </button>
               <button 
                 onClick={onClose}
                 className="px-10 py-5 border-2 border-castleton-green text-castleton-green dark:border-saffron dark:text-saffron font-black text-xl rounded-full hover:bg-castleton-green hover:text-white dark:hover:bg-saffron dark:hover:text-dark-serpent transition-all shadow-lg hover:-translate-y-1"
               >
                 {translations.formSuccessBack}
               </button>
             </div>
          </div>
        ) : (
          <>
            <div className="p-6 bg-gradient-to-r from-castleton-green to-green-1 text-white rounded-t-[32px] relative flex items-center justify-between shadow-md z-10">
              <div>
                <h2 className="text-2xl md:text-3xl font-extrabold">{translations.modalTitle}</h2>
                <p className="text-sm md:text-base text-white/90 opacity-90">{translations.modalSubtitle}</p>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-2xl hover:bg-saffron hover:text-dark-serpent transition-all"
              >
                x
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
              {/* Compact Benefits Strip */}
              <div className="bg-white/40 dark:bg-green-900/10 py-3 px-4 rounded-2xl border border-castleton-green/10 dark:border-green-800 flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-6">
                <span className="text-xs font-bold text-dark-serpent dark:text-white uppercase tracking-wider shrink-0">{translations.modalBenefitsTitle}</span>
                <div className="flex flex-wrap gap-x-6 gap-y-2 items-center">
                  {benefits.map((b, i) => (
                    <div key={i} className="flex items-center gap-2" title={b.label}>
                      <span className="text-lg">{b.icon}</span>
                      <span className="text-[10px] md:text-xs font-bold text-green-1 dark:text-green-3 whitespace-nowrap">{b.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-1 border-b border-castleton-green/10 dark:border-green-800">
                    <span className="text-lg">{'\u{1F4DD}'}</span>
                    <h3 className="text-base font-extrabold text-dark-serpent dark:text-white uppercase tracking-wider">{translations.formSectionPersonal} & {translations.formSectionPosition}</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-green-2 dark:text-green-4 uppercase tracking-wider opacity-85">{translations.formFirstName} <span className="text-saffron">*</span></label>
                      <input 
                        type="text" required name="firstName" value={formData.firstName} onChange={handleInputChange}
                        placeholder={translations.formFirstNamePlaceholder}
                        className="w-full px-3 py-2 border-2 border-castleton-green/10 bg-paper/10 dark:bg-white/5 text-dark-serpent dark:text-white rounded-2xl focus:border-castleton-green focus:outline-none transition-all text-xs font-bold placeholder-green-2/50 dark:placeholder-green-4/50 placeholder:text-[10px] placeholder:font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-green-2 dark:text-green-4 uppercase tracking-wider opacity-85">{translations.formLastName} <span className="text-saffron">*</span></label>
                      <input 
                        type="text" required name="lastName" value={formData.lastName} onChange={handleInputChange}
                        placeholder={translations.formLastNamePlaceholder}
                        className="w-full px-3 py-2 border-2 border-castleton-green/10 bg-paper/10 dark:bg-white/5 text-dark-serpent dark:text-white rounded-2xl focus:border-castleton-green focus:outline-none transition-all text-xs font-bold placeholder-green-2/50 dark:placeholder-green-4/50 placeholder:text-[10px] placeholder:font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-green-2 dark:text-green-4 uppercase tracking-wider opacity-85">{translations.formEmail} <span className="text-saffron">*</span></label>
                      <input 
                        type="email" required name="email" value={formData.email} onChange={handleInputChange}
                        placeholder={translations.formEmailPlaceholder}
                        className="w-full px-3 py-2 border-2 border-castleton-green/10 bg-paper/10 dark:bg-white/5 text-dark-serpent dark:text-white rounded-2xl focus:border-castleton-green focus:outline-none transition-all text-xs font-bold placeholder-green-2/50 dark:placeholder-green-4/50 placeholder:text-[10px] placeholder:font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-green-2 dark:text-green-4 uppercase tracking-wider opacity-85">{translations.formPhone} <span className="text-saffron">*</span></label>
                      <div className="flex items-center w-full border-2 border-castleton-green/10 bg-paper/10 dark:bg-white/5 rounded-2xl focus-within:border-castleton-green transition-all overflow-hidden">
                        <div className="relative h-full border-r border-castleton-green/10 dark:border-green-4/20">
                          <select 
                            name="phoneCountryCode" value={formData.phoneCountryCode} onChange={handleInputChange}
                            className="h-full pl-3 pr-8 py-2 bg-transparent text-dark-serpent dark:text-white font-bold text-xs appearance-none focus:outline-none cursor-pointer dark:[color-scheme:dark]"
                          >
                            <option value="+60" className="text-dark-serpent bg-white">MY +60</option>
                            <option value="+63" className="text-dark-serpent bg-white">PH +63</option>
                            <option value="+86" className="text-dark-serpent bg-white">CN +86</option>
                            <option value="+81" className="text-dark-serpent bg-white">JP +81</option>
                            <option value="+44" className="text-dark-serpent bg-white">GB +44</option>
                            <option value="+1" className="text-dark-serpent bg-white">US +1</option>
                            <option value="+886" className="text-dark-serpent bg-white">TW +886</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-dark-serpent dark:text-white">
                            <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 20 20">
                              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path>
                            </svg>
                          </div>
                        </div>
                        <input 
                          type="tel" required name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange}
                          placeholder={translations.formPhonePlaceholder}
                          className="flex-1 px-3 py-2 bg-transparent text-dark-serpent dark:text-white focus:outline-none text-xs font-bold placeholder-green-2/50 dark:placeholder-green-4/50 placeholder:text-[10px] placeholder:font-semibold"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-green-2 dark:text-green-4 uppercase tracking-wider opacity-85">{translations.formPositionLabel} <span className="text-saffron">*</span></label>
                      <div className="relative">
                        <select 
                          required name="position" value={formData.position} onChange={handleInputChange}
                          className={`w-full px-3 py-2 border-2 border-castleton-green/10 bg-paper/10 dark:bg-white/5 rounded-2xl focus:border-castleton-green focus:outline-none transition-all font-bold text-xs appearance-none cursor-pointer dark:[color-scheme:dark] ${formData.position ? 'text-dark-serpent dark:text-white' : 'text-green-2/50 dark:text-green-4/50'}`}
                        >
                          <option value="" disabled>{translations.formPositionPlaceholder}</option>
                          {positions.map(p => (
                            <option key={p.value} value={p.value} className="text-dark-serpent dark:text-white bg-white dark:bg-dark-serpent">{p.label}</option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-dark-serpent dark:text-white">
                          <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path>
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-green-2 dark:text-green-4 uppercase tracking-wider opacity-85">{translations.formExpLabel} <span className="text-saffron">*</span></label>
                      <div className="relative">
                        <select 
                          required name="experience" value={formData.experience} onChange={handleInputChange}
                          className={`w-full px-3 py-2 border-2 border-castleton-green/10 bg-paper/10 dark:bg-white/5 rounded-2xl focus:border-castleton-green focus:outline-none transition-all font-bold text-xs appearance-none cursor-pointer dark:[color-scheme:dark] ${formData.experience ? 'text-dark-serpent dark:text-white' : 'text-green-2/50 dark:text-green-4/50'}`}
                        >
                          <option value="" disabled>{translations.formExpPlaceholder}</option>
                          {experienceLevels.map(e => (
                            <option key={e.value} value={e.value} className="text-dark-serpent dark:text-white bg-white dark:bg-dark-serpent">{e.label}</option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-dark-serpent dark:text-white">
                          <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path>
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-green-2 dark:text-green-4 uppercase tracking-wider opacity-85">{translations.formWorkLocationLabel} <span className="text-saffron">*</span></label>
                      <div className="relative">
                        <select 
                          required name="workLocation" value={formData.workLocation} onChange={handleInputChange}
                          className={`w-full px-3 py-2 border-2 border-castleton-green/10 bg-paper/10 dark:bg-white/5 rounded-2xl focus:border-castleton-green focus:outline-none transition-all font-bold text-xs appearance-none cursor-pointer dark:[color-scheme:dark] ${formData.workLocation ? 'text-dark-serpent dark:text-white' : 'text-green-2/50 dark:text-green-4/50'}`}
                        >
                          <option value="" disabled>{translations.formWorkLocationPlaceholder}</option>
                          <option value="petaling-jaya" className="text-dark-serpent dark:text-white bg-white dark:bg-dark-serpent">{translations.officeCityPetalingJaya}</option>
                          <option value="manila" className="text-dark-serpent dark:text-white bg-white dark:bg-dark-serpent">{translations.officeCityManila}</option>
                          <option value="davao" className="text-dark-serpent dark:text-white bg-white dark:bg-dark-serpent">{translations.officeCityDavao}</option>
                          <option value="cebu" className="text-dark-serpent dark:text-white bg-white dark:bg-dark-serpent">{translations.officeCityCebu}</option>
                          <option value="shenzhen" className="text-dark-serpent dark:text-white bg-white dark:bg-dark-serpent">{translations.officeCityShenzhen}</option>
                          <option value="tokyo" className="text-dark-serpent dark:text-white bg-white dark:bg-dark-serpent">{translations.officeCityTokyo}</option>
                          <option value="london" className="text-dark-serpent dark:text-white bg-white dark:bg-dark-serpent">{translations.officeCityLondon}</option>
                          <option value="new-york" className="text-dark-serpent dark:text-white bg-white dark:bg-dark-serpent">{translations.officeCityNewYork}</option>
                          <option value="taipei" className="text-dark-serpent dark:text-white bg-white dark:bg-dark-serpent">{translations.officeCityTaipei}</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-dark-serpent dark:text-white">
                          <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Resume Upload - Ultra Compact */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-1 border-b border-castleton-green/10 dark:border-green-800">
                    <span className="text-lg">{'\u{1F4C4}'}</span>
                    <h3 className="text-base font-extrabold text-dark-serpent dark:text-white uppercase tracking-wider">{translations.formSectionDocs}</h3>
                  </div>
                  <div className="relative border border-dashed border-castleton-green/40 bg-white/60 dark:bg-green-900/10 p-4 rounded-xl text-center hover:bg-white dark:hover:bg-dark-serpent transition-all group flex items-center justify-center gap-3 cursor-pointer">
                    <input type="file" required onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                    <span className="text-2xl">{'\u{1F4CE}'}</span>
                    <div className="text-left">
                      <p className="text-green-1 dark:text-green-4 font-bold text-sm">
                        {fileName ? <span className="text-castleton-green dark:text-saffron">✓ {fileName}</span> : translations.formResumePlaceholder}
                      </p>
                      <p className="text-[10px] text-green-2 font-bold opacity-70">{translations.formResumeSub}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-castleton-green/10 dark:border-green-800">
                  <p className="text-xs text-green-1 font-bold opacity-70">{translations.formNeedHelp} <a href="mailto:hr@lifewood.com" className="text-castleton-green dark:text-saffron underline">hr@lifewood.com</a></p>
                  <div className="flex gap-3 w-full sm:w-auto">
                    <button 
                      type="button" 
                      onClick={onClose}
                      className="flex-1 sm:flex-none px-6 py-2.5 rounded-full font-bold border border-castleton-green/20 dark:border-green-900 text-green-1 dark:text-green-4 hover:bg-white dark:hover:bg-green-900 transition-all text-sm"
                    >
                      {translations.formBtnCancel}
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 sm:flex-none px-8 py-2.5 bg-saffron text-dark-serpent rounded-full font-extrabold hover:bg-earth-yellow hover:-translate-y-0.5 transition-all shadow-lg shadow-saffron/20 text-sm"
                    >
                      {translations.formBtnSubmit}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EmploymentModal;


