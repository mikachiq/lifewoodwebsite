import React, { useEffect, useMemo, useState } from 'react';
import { TranslationSet } from '../types';
import { getSupabase } from '../lib/supabaseClient';
import { fetchPublicHRPositions, HRPosition } from '../lib/hrPositions';

interface EmploymentModalProps {
  onClose: () => void;
  translations: TranslationSet;
  onExplorePortal: () => void;
  presetPosition?: string;
}

const EmploymentModal: React.FC<EmploymentModalProps> = ({ onClose, translations, onExplorePortal, presetPosition }) => {
  const [dynamicPositions, setDynamicPositions] = useState<HRPosition[]>([]);
  const officeLocations = useMemo(() => [
    { value: 'petaling-jaya', label: translations.officeCityPetalingJaya },
    { value: 'manila', label: translations.officeCityManila },
    { value: 'davao', label: translations.officeCityDavao },
    { value: 'cebu', label: translations.officeCityCebu },
    { value: 'shenzhen', label: translations.officeCityShenzhen },
    { value: 'tokyo', label: translations.officeCityTokyo },
    { value: 'london', label: translations.officeCityLondon },
    { value: 'new-york', label: translations.officeCityNewYork },
    { value: 'taipei', label: translations.officeCityTaipei },
  ], [translations]);

  const legacyPositionLocationRules = {
    'senior-ai-data-architect': { mode: 'remote', value: 'remote-global' },
    'multilingual-nlp-specialist': { mode: 'fixed', value: 'petaling-jaya' },
    'global-operations-manager': { mode: 'fixed', value: 'manila' },
    'ai-training-associate': { mode: 'flexible' },
    'ai-data-intern': { mode: 'flexible' },
  } as const;

  const getRemoteLabel = (positionValue: string) => {
    if (positionValue === 'ai-training-associate') return translations.careerJob5Loc || 'Hybrid / Global';
    return translations.careerJob1Loc || 'Remote / Global';
  };

  const getInitialLocation = (positionValue: string) => {
    const rule = legacyPositionLocationRules[positionValue];
    if (!rule || rule.mode === 'flexible') return '';
    return rule.value || '';
  };

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneCountryCode: '+60',
    phoneNumber: '',
    country: '',
    city: '',
    position: presetPosition || '',
    experience: '',
    workLocation: presetPosition ? getInitialLocation(presetPosition) : '',
    availability: '',
    languages: [] as string[],
    skills: '',
    coverLetter: '',
    linkedin: '',
    portfolio: '',
    additionalInfo: '',
    university: '',
    courseProgram: '',
    internshipHours: '',
  });

  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');

  useEffect(() => {
    let isMounted = true;
    fetchPublicHRPositions()
      .then(data => {
        if (isMounted) setDynamicPositions(data.filter(position => position.is_active));
      })
      .catch(error => {
        console.error('[EmploymentModal] positions load error', error);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const fallbackPositions = [
    { value: 'senior-ai-data-architect', label: translations.careerJob1Title },
    { value: 'multilingual-nlp-specialist', label: translations.careerJob2Title },
    { value: 'global-operations-manager', label: translations.careerJob4Title },
    { value: 'ai-training-associate', label: translations.careerJob5Title },
    { value: 'ai-data-intern', label: translations.careerJob3Title },
  ];

  const positions = dynamicPositions.length > 0
    ? dynamicPositions.map(position => ({ value: position.id, label: position.title }))
    : fallbackPositions;

  const experienceLevels = [
    { value: 'entry', label: translations.formExpEntry },
    { value: 'mid', label: translations.formExpMid },
    { value: 'senior', label: translations.formExpSenior },
  ];

  const effectivePosition = presetPosition || formData.position;
  const selectedPositionMeta = dynamicPositions.find(position => position.id === effectivePosition) || null;
  const selectedPositionRule = effectivePosition ? legacyPositionLocationRules[effectivePosition as keyof typeof legacyPositionLocationRules] : undefined;
  const dynamicPositionAllowsOfficeChoice = Boolean(
    selectedPositionMeta && /remote|global|hybrid/i.test(
      `${selectedPositionMeta.work_mode || ''} ${selectedPositionMeta.location || ''}`,
    ),
  );
  const isInternPresetModal = selectedPositionMeta
    ? selectedPositionMeta.application_form_type === 'intern'
    : effectivePosition === 'ai-data-intern';
  const isFixedRoleModal = Boolean(!selectedPositionMeta && presetPosition && selectedPositionRule && selectedPositionRule.mode !== 'flexible');
  const showPositionField = !presetPosition && !isFixedRoleModal;
  const showWorkLocationField = !isFixedRoleModal && !isInternPresetModal;
  const showExperienceField = !isInternPresetModal;

  const workLocationOptions = selectedPositionMeta
    ? dynamicPositionAllowsOfficeChoice
      ? officeLocations
      : [{ value: selectedPositionMeta.location || 'preferred-location', label: selectedPositionMeta.location || translations.formWorkLocationPlaceholder }]
    : selectedPositionRule?.mode === 'flexible'
      ? officeLocations
      : selectedPositionRule?.mode === 'fixed'
        ? officeLocations.filter(location => location.value === selectedPositionRule.value)
        : selectedPositionRule?.mode === 'remote' && effectivePosition
          ? [{ value: 'remote-global', label: getRemoteLabel(effectivePosition) }]
          : [];
  const isWorkLocationDisabled =
    selectedPositionMeta
      ? !dynamicPositionAllowsOfficeChoice && Boolean(selectedPositionMeta.location)
      : (!effectivePosition || selectedPositionRule?.mode !== 'flexible');

  useEffect(() => {
    if (!selectedPositionMeta?.location || dynamicPositionAllowsOfficeChoice) return;
    setFormData(prev => (
      prev.workLocation === selectedPositionMeta.location
        ? prev
        : { ...prev, workLocation: selectedPositionMeta.location || '' }
    ));
  }, [dynamicPositionAllowsOfficeChoice, selectedPositionMeta]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === 'position') {
      setFormData(prev => {
        if (!value) {
          return { ...prev, position: '', workLocation: '' };
        }

        const selectedDynamicPosition = dynamicPositions.find(position => position.id === value);
        if (selectedDynamicPosition) {
          const allowsOfficeChoice = /remote|global|hybrid/i.test(
            `${selectedDynamicPosition.work_mode || ''} ${selectedDynamicPosition.location || ''}`,
          );
          return {
            ...prev,
            position: value,
            workLocation: allowsOfficeChoice ? '' : (selectedDynamicPosition.location || ''),
          };
        }

        const rule = legacyPositionLocationRules[value as keyof typeof legacyPositionLocationRules];
        if (!rule) {
          return { ...prev, position: value, workLocation: '' };
        }

        if (rule.mode === 'flexible') {
          const hasValidLocation = officeLocations.some(location => location.value === prev.workLocation);
          return {
            ...prev,
            position: value,
            workLocation: hasValidLocation ? prev.workLocation : '',
          };
        }

        return {
          ...prev,
          position: value,
          workLocation: rule.value || '',
        };
      });
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachmentFile(e.target.files[0]);
      setFileName(e.target.files[0].name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const supabase = getSupabase();
      let resumeUrl: string | null = null;

      // Upload resume directly to Supabase storage (resumes bucket allows public insert).
      if (attachmentFile) {
        try {
          const ext = attachmentFile.name.split('.').pop() || 'pdf';
          const uniquePath = `${crypto.randomUUID()}.${ext}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('resumes')
            .upload(uniquePath, attachmentFile, { contentType: attachmentFile.type, upsert: false });

          if (uploadError) {
            console.error('[EmploymentModal] Supabase resume upload error:', uploadError);
            throw new Error(uploadError.message || 'Resume upload failed.');
          }

          if (uploadData) {
            const { data: { publicUrl } } = supabase.storage.from('resumes').getPublicUrl(uploadData.path);
            resumeUrl = publicUrl || null;
          }
        } catch (uploadErr) {
          console.error('[EmploymentModal] Resume upload error:', uploadErr);
          throw new Error('Resume upload failed. Please try again.');
        }
      }

      const role = effectivePosition || formData.position;
      const notes = JSON.stringify({
        phone: `${formData.phoneCountryCode} ${formData.phoneNumber}`.trim(),
        experience: formData.experience,
        workLocation: formData.workLocation,
        availability: formData.availability,
        languages: formData.languages.join(', '),
        skills: formData.skills,
        linkedin: formData.linkedin,
        portfolio: formData.portfolio,
        additionalInfo: formData.additionalInfo,
        university: formData.university,
        courseProgram: formData.courseProgram,
        internshipHours: formData.internshipHours,
        coverLetter: formData.coverLetter,
      });

      const { error: insertError } = await supabase.from('hr_applicants').insert({
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        role,
        applied_date: new Date().toISOString(),
        resume_path: resumeUrl,
        notes,
        status: null,
      });
      if (insertError) throw new Error(insertError.message);
      setIsSubmitted(true);
      setAttachmentFile(null);
      setFileName('');
    } catch (err) {
      console.error('[EmploymentModal] Submit error:', err);
      setSubmitError('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const benefits = [
    { label: translations.benefit1 },
    { label: translations.benefit2 },
    { label: translations.benefit3 },
    { label: translations.benefit4 },
    { label: translations.benefit5 },
    { label: translations.benefit6 },
  ];

  return (
    <div className="fixed inset-0 z-[2000]" role="dialog" aria-modal="true" aria-label={translations.modalTitle || 'Application'}>
      <button
        type="button"
        onClick={onClose}
        aria-label={translations.closeLabel || 'Close'}
        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
      />

      <div className="relative min-h-full flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="bg-paper/20 dark:bg-white/5 p-1.5 rounded-[44px] shadow-3xl border border-paper dark:border-green-900/30 animate-in zoom-in-95 duration-300">
            <div className="bg-paper/60 dark:bg-dark-serpent/50 rounded-[40px] relative overflow-hidden">
              <div className="absolute -top-16 -right-16 w-56 h-56 bg-castleton-green/10 dark:bg-saffron/10 rounded-full blur-[40px]" />

              <div className="relative">
                {isSubmitted ? (
          <div className="p-8 md:p-16 text-center animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-castleton-green/10 dark:bg-saffron/10 rounded-full flex items-center justify-center text-5xl mx-auto mb-10 animate-bounce">
              {'\u2713'}
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
                {translations.formSuccessExplore} <span className="group-hover:translate-x-1 transition-transform">{'\u2192'}</span>
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
            <div className="p-6 md:p-8 flex items-start justify-between gap-6 border-b border-paper dark:border-green-900/30">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/70 dark:bg-green-900/20 border border-paper dark:border-green-800 flex items-center justify-center text-xl">
                  {'\u{1F4DD}'}
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-dark-serpent dark:text-white tracking-tight leading-none">
                    {translations.modalTitle}
                  </h2>
                  <p className="mt-1 text-sm md:text-base font-bold text-green-1 dark:text-green-3 opacity-90">
                    {translations.modalSubtitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-10 h-10 rounded-2xl bg-white/70 dark:bg-green-900/20 border border-paper dark:border-green-800 text-dark-serpent dark:text-white font-black hover:opacity-80 transition-opacity"
                aria-label={translations.closeLabel || 'Close'}
              >
                {'\u00D7'}
              </button>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-1 border-b border-castleton-green/10 dark:border-green-800">
                    <span className="text-lg">{'\u{1F4DD}'}</span>
                    <h3 className="text-base font-extrabold text-dark-serpent dark:text-white uppercase tracking-wider">
                      {isInternPresetModal ? (translations.formSectionPersonalInternship || 'PERSONAL & INTERNSHIP INFORMATION') : `${translations.formSectionPersonal} & ${translations.formSectionPosition}`}
                    </h3>
                  </div>

                  {isInternPresetModal ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-green-2 dark:text-green-4 uppercase tracking-wider opacity-85">{translations.formFirstName} <span className="text-saffron">*</span></label>
                          <input
                            type="text" required name="firstName" value={formData.firstName} onChange={handleInputChange}
                            placeholder={translations.formFirstNamePlaceholder}
                            className="w-full px-4 py-3 border-2 border-paper dark:border-green-800 bg-white/80 dark:bg-[#0a1612] text-dark-serpent dark:text-white rounded-2xl focus:border-castleton-green dark:focus:border-saffron focus:outline-none transition-colors text-sm font-semibold placeholder-green-2/50 dark:placeholder-green-4/50 placeholder:text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-green-2 dark:text-green-4 uppercase tracking-wider opacity-85">{translations.formLastName} <span className="text-saffron">*</span></label>
                          <input
                            type="text" required name="lastName" value={formData.lastName} onChange={handleInputChange}
                            placeholder={translations.formLastNamePlaceholder}
                            className="w-full px-4 py-3 border-2 border-paper dark:border-green-800 bg-white/80 dark:bg-[#0a1612] text-dark-serpent dark:text-white rounded-2xl focus:border-castleton-green dark:focus:border-saffron focus:outline-none transition-colors text-sm font-semibold placeholder-green-2/50 dark:placeholder-green-4/50 placeholder:text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-green-2 dark:text-green-4 uppercase tracking-wider opacity-85">{translations.formEmail} <span className="text-saffron">*</span></label>
                          <input
                            type="email" required name="email" value={formData.email} onChange={handleInputChange}
                            placeholder={translations.formEmailPlaceholder}
                            className="w-full px-4 py-3 border-2 border-paper dark:border-green-800 bg-white/80 dark:bg-[#0a1612] text-dark-serpent dark:text-white rounded-2xl focus:border-castleton-green dark:focus:border-saffron focus:outline-none transition-colors text-sm font-semibold placeholder-green-2/50 dark:placeholder-green-4/50 placeholder:text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-green-2 dark:text-green-4 uppercase tracking-wider opacity-85">{translations.formPhone} <span className="text-saffron">*</span></label>
                          <div className="flex items-center w-full border-2 border-paper dark:border-green-800 bg-white/80 dark:bg-[#0a1612] rounded-2xl focus-within:border-castleton-green dark:focus-within:border-saffron transition-colors overflow-hidden">
                            <div className="relative h-full border-r border-paper dark:border-green-800">
                              <select
                                name="phoneCountryCode" value={formData.phoneCountryCode} onChange={handleInputChange}
                                className="h-full pl-3 pr-8 py-3 bg-transparent text-dark-serpent dark:text-white font-semibold text-sm appearance-none focus:outline-none cursor-pointer dark:[color-scheme:dark]"
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
                              className="flex-1 px-4 py-3 bg-transparent text-dark-serpent dark:text-white focus:outline-none text-sm font-semibold placeholder-green-2/50 dark:placeholder-green-4/50 placeholder:text-xs"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-green-2 dark:text-green-4 uppercase tracking-wider opacity-85">{translations.formUniversityLabel || 'University / Institution'} <span className="text-saffron">*</span></label>
                          <input
                            type="text" required name="university" value={formData.university} onChange={handleInputChange}
                            placeholder={translations.formUniversityPlaceholder || 'e.g. University of Malaya'}
                            className="w-full px-4 py-3 border-2 border-paper dark:border-green-800 bg-white/80 dark:bg-[#0a1612] text-dark-serpent dark:text-white rounded-2xl focus:border-castleton-green dark:focus:border-saffron focus:outline-none transition-colors text-sm font-semibold placeholder-green-2/50 dark:placeholder-green-4/50 placeholder:text-xs"
                          />
                        </div>
                      </div>

                      {showPositionField && (
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-green-2 dark:text-green-4 uppercase tracking-wider opacity-85">{translations.formPositionLabel} <span className="text-saffron">*</span></label>
                          <div className="relative">
                            <select
                              required
                              name="position"
                              value={formData.position}
                              onChange={handleInputChange}
                              className={`w-full px-4 py-3 border-2 border-paper dark:border-green-800 bg-white/80 dark:bg-[#0a1612] rounded-2xl focus:border-castleton-green dark:focus:border-saffron focus:outline-none transition-colors font-semibold text-sm appearance-none cursor-pointer dark:[color-scheme:dark] ${formData.position ? 'text-dark-serpent dark:text-white' : 'text-green-2/50 dark:text-green-4/50'}`}
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
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-green-2 dark:text-green-4 uppercase tracking-wider opacity-85">{translations.formCourseProgramLabel || 'Course / Program'} <span className="text-saffron">*</span></label>
                          <input
                            type="text" required name="courseProgram" value={formData.courseProgram} onChange={handleInputChange}
                            placeholder={translations.formCourseProgramPlaceholder || 'e.g. Computer Science'}
                            className="w-full px-4 py-3 border-2 border-paper dark:border-green-800 bg-white/80 dark:bg-[#0a1612] text-dark-serpent dark:text-white rounded-2xl focus:border-castleton-green dark:focus:border-saffron focus:outline-none transition-colors text-sm font-semibold placeholder-green-2/50 dark:placeholder-green-4/50 placeholder:text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-green-2 dark:text-green-4 uppercase tracking-wider opacity-85">{translations.formInternshipHoursLabel || 'Required Internship Hours'} <span className="text-saffron">*</span></label>
                          <input
                            type="text" required name="internshipHours" value={formData.internshipHours} onChange={handleInputChange}
                            placeholder={translations.formInternshipHoursPlaceholder || 'e.g. 300 hours'}
                            className="w-full px-4 py-3 border-2 border-paper dark:border-green-800 bg-white/80 dark:bg-[#0a1612] text-dark-serpent dark:text-white rounded-2xl focus:border-castleton-green dark:focus:border-saffron focus:outline-none transition-colors text-sm font-semibold placeholder-green-2/50 dark:placeholder-green-4/50 placeholder:text-xs"
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2 pb-1 border-b border-castleton-green/10 dark:border-green-800">
                          <span className="text-lg">{'\u{1F4C4}'}</span>
                          <h3 className="text-base font-extrabold text-dark-serpent dark:text-white uppercase tracking-wider">{translations.formSectionDocs}</h3>
                        </div>
                        <div className="relative border border-dashed border-paper dark:border-green-800 bg-white/70 dark:bg-green-900/20 p-5 rounded-2xl text-center hover:bg-white/90 dark:hover:bg-green-900/30 transition-colors group flex items-center justify-center gap-3 cursor-pointer">
                          <input type="file" required onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                          <span className="text-2xl">{'\u{1F4CE}'}</span>
                          <div className="text-left">
                            <p className="text-green-1 dark:text-green-4 font-bold text-sm">
                              {fileName ? <span className="text-castleton-green dark:text-saffron">{'\u2713'} {fileName}</span> : translations.formResumePlaceholder}
                            </p>
                            <p className="text-[10px] text-green-2 font-bold opacity-70">{translations.formResumeSub}</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-green-2 dark:text-green-4 uppercase tracking-wider opacity-85">{translations.formWorkLocationLabel} <span className="text-saffron">*</span></label>
                          <div className="relative">
                            <select
                              required
                              name="workLocation"
                              value={formData.workLocation}
                              onChange={handleInputChange}
                              disabled={isWorkLocationDisabled}
                              className={`w-full px-4 py-3 border-2 border-paper dark:border-green-800 bg-white/80 dark:bg-[#0a1612] rounded-2xl focus:border-castleton-green dark:focus:border-saffron focus:outline-none transition-colors font-semibold text-sm appearance-none dark:[color-scheme:dark] ${isWorkLocationDisabled ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'} ${formData.workLocation ? 'text-dark-serpent dark:text-white' : 'text-green-2/50 dark:text-green-4/50'}`}
                            >
                              <option value="" disabled>{translations.formWorkLocationPlaceholder}</option>
                              {workLocationOptions.map(location => (
                                <option key={location.value} value={location.value} className="text-dark-serpent dark:text-white bg-white dark:bg-dark-serpent">{location.label}</option>
                              ))}
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
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-green-2 dark:text-green-4 uppercase tracking-wider opacity-85">{translations.formFirstName} <span className="text-saffron">*</span></label>
                        <input
                          type="text" required name="firstName" value={formData.firstName} onChange={handleInputChange}
                          placeholder={translations.formFirstNamePlaceholder}
                          className="w-full px-4 py-3 border-2 border-paper dark:border-green-800 bg-white/80 dark:bg-[#0a1612] text-dark-serpent dark:text-white rounded-2xl focus:border-castleton-green dark:focus:border-saffron focus:outline-none transition-colors text-sm font-semibold placeholder-green-2/50 dark:placeholder-green-4/50 placeholder:text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-green-2 dark:text-green-4 uppercase tracking-wider opacity-85">{translations.formLastName} <span className="text-saffron">*</span></label>
                        <input
                          type="text" required name="lastName" value={formData.lastName} onChange={handleInputChange}
                          placeholder={translations.formLastNamePlaceholder}
                          className="w-full px-4 py-3 border-2 border-paper dark:border-green-800 bg-white/80 dark:bg-[#0a1612] text-dark-serpent dark:text-white rounded-2xl focus:border-castleton-green dark:focus:border-saffron focus:outline-none transition-colors text-sm font-semibold placeholder-green-2/50 dark:placeholder-green-4/50 placeholder:text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-green-2 dark:text-green-4 uppercase tracking-wider opacity-85">{translations.formEmail} <span className="text-saffron">*</span></label>
                        <input
                          type="email" required name="email" value={formData.email} onChange={handleInputChange}
                          placeholder={translations.formEmailPlaceholder}
                          className="w-full px-4 py-3 border-2 border-paper dark:border-green-800 bg-white/80 dark:bg-[#0a1612] text-dark-serpent dark:text-white rounded-2xl focus:border-castleton-green dark:focus:border-saffron focus:outline-none transition-colors text-sm font-semibold placeholder-green-2/50 dark:placeholder-green-4/50 placeholder:text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-green-2 dark:text-green-4 uppercase tracking-wider opacity-85">{translations.formPhone} <span className="text-saffron">*</span></label>
                        <div className="flex items-center w-full border-2 border-paper dark:border-green-800 bg-white/80 dark:bg-[#0a1612] rounded-2xl focus-within:border-castleton-green dark:focus-within:border-saffron transition-colors overflow-hidden">
                          <div className="relative h-full border-r border-paper dark:border-green-800">
                            <select
                              name="phoneCountryCode" value={formData.phoneCountryCode} onChange={handleInputChange}
                              className="h-full pl-3 pr-8 py-3 bg-transparent text-dark-serpent dark:text-white font-semibold text-sm appearance-none focus:outline-none cursor-pointer dark:[color-scheme:dark]"
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
                            className="flex-1 px-4 py-3 bg-transparent text-dark-serpent dark:text-white focus:outline-none text-sm font-semibold placeholder-green-2/50 dark:placeholder-green-4/50 placeholder:text-xs"
                          />
                        </div>
                      </div>

                    {showPositionField && (
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-green-2 dark:text-green-4 uppercase tracking-wider opacity-85">{translations.formPositionLabel} <span className="text-saffron">*</span></label>
                        <div className="relative">
                          <select
                            required name="position" value={formData.position} onChange={handleInputChange}
                            className={`w-full px-4 py-3 border-2 border-paper dark:border-green-800 bg-white/80 dark:bg-[#0a1612] rounded-2xl focus:border-castleton-green dark:focus:border-saffron focus:outline-none transition-colors font-semibold text-sm appearance-none cursor-pointer dark:[color-scheme:dark] ${formData.position ? 'text-dark-serpent dark:text-white' : 'text-green-2/50 dark:text-green-4/50'}`}
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
                    )}

                    {showExperienceField && (
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-green-2 dark:text-green-4 uppercase tracking-wider opacity-85">{translations.formExpLabel} <span className="text-saffron">*</span></label>
                        <div className="relative">
                          <select
                            required name="experience" value={formData.experience} onChange={handleInputChange}
                            className={`w-full px-4 py-3 border-2 border-paper dark:border-green-800 bg-white/80 dark:bg-[#0a1612] rounded-2xl focus:border-castleton-green dark:focus:border-saffron focus:outline-none transition-colors font-semibold text-sm appearance-none cursor-pointer dark:[color-scheme:dark] ${formData.experience ? 'text-dark-serpent dark:text-white' : 'text-green-2/50 dark:text-green-4/50'}`}
                          >
                            <option value="" disabled>{translations.formExpPlaceholder}</option>
                            {experienceLevels.map(level => (
                              <option key={level.value} value={level.value} className="text-dark-serpent dark:text-white bg-white dark:bg-dark-serpent">{level.label}</option>
                            ))}
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-dark-serpent dark:text-white">
                            <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path>
                            </svg>
                          </div>
                        </div>
                      </div>
                    )}

                    {showWorkLocationField && (
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-green-2 dark:text-green-4 uppercase tracking-wider opacity-85">{translations.formWorkLocationLabel} <span className="text-saffron">*</span></label>
                        <div className="relative">
                          <select
                            required
                            name="workLocation"
                            value={formData.workLocation}
                            onChange={handleInputChange}
                            disabled={isWorkLocationDisabled}
                            className={`w-full px-4 py-3 border-2 border-paper dark:border-green-800 bg-white/80 dark:bg-[#0a1612] rounded-2xl focus:border-castleton-green dark:focus:border-saffron focus:outline-none transition-colors font-semibold text-sm appearance-none dark:[color-scheme:dark] ${isWorkLocationDisabled ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'} ${formData.workLocation ? 'text-dark-serpent dark:text-white' : 'text-green-2/50 dark:text-green-4/50'}`}
                          >
                            <option value="" disabled>{translations.formWorkLocationPlaceholder}</option>
                            {workLocationOptions.map(location => (
                              <option key={location.value} value={location.value} className="text-dark-serpent dark:text-white bg-white dark:bg-dark-serpent">{location.label}</option>
                            ))}
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-dark-serpent dark:text-white">
                            <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path>
                            </svg>
                          </div>
                        </div>
                      </div>
                    )}
                    </div>
                  )}
                </div>

                {!isInternPresetModal && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 pb-1 border-b border-castleton-green/10 dark:border-green-800">
                      <span className="text-lg">{'\u{1F4C4}'}</span>
                      <h3 className="text-base font-extrabold text-dark-serpent dark:text-white uppercase tracking-wider">{translations.formSectionDocs}</h3>
                    </div>
                    <div className="relative border border-dashed border-paper dark:border-green-800 bg-white/70 dark:bg-green-900/20 p-5 rounded-2xl text-center hover:bg-white/90 dark:hover:bg-green-900/30 transition-colors group flex items-center justify-center gap-3 cursor-pointer">
                      <input type="file" required onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                      <span className="text-2xl">{'\u{1F4CE}'}</span>
                      <div className="text-left">
                        <p className="text-green-1 dark:text-green-4 font-bold text-sm">
                          {fileName ? <span className="text-castleton-green dark:text-saffron">{'\u2713'} {fileName}</span> : translations.formResumePlaceholder}
                        </p>
                        <p className="text-[10px] text-green-2 font-bold opacity-70">{translations.formResumeSub}</p>
                      </div>
                    </div>
                  </div>
                )}

                {submitError && (
                  <p className="text-red-500 text-sm font-bold">{submitError}</p>
                )}
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
                      disabled={isSubmitting}
                      className="flex-1 sm:flex-none px-8 py-2.5 bg-saffron text-dark-serpent rounded-full font-extrabold hover:bg-earth-yellow hover:-translate-y-0.5 transition-all shadow-lg shadow-saffron/20 text-sm disabled:opacity-60"
                    >
                      {isSubmitting ? 'Submitting...' : translations.formBtnSubmit}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </>
        )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmploymentModal;



