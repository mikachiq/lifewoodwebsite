import React, { useEffect, useState } from 'react';
import { TranslationSet } from '../types';

interface FooterProps {
  translations: TranslationSet;
  theme: 'light' | 'dark';
  onContactClick: () => void;
  onNavigateSection: (sectionId: string) => void;
}

type PolicyType = 'privacy' | 'cookie' | 'terms' | null;

const Footer: React.FC<FooterProps> = ({ translations, theme, onContactClick, onNavigateSection }) => {
  const [activePolicy, setActivePolicy] = useState<PolicyType>(null);
  const isDark = theme === 'dark';

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActivePolicy(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (activePolicy) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [activePolicy]);

  const policyContent = {
    privacy: {
      title: translations.footerPrivacy,
      sections: [
        {
          heading: '1. Information We Collect',
          body: 'We collect business contact details, account and project information, technical usage data, and service interaction records. Where required for project delivery, we may process client-provided datasets under documented instructions.'
        },
        {
          heading: '2. How We Use Information',
          body: 'We use information to provide AI data services, manage client engagements, secure our systems, improve operational quality, and comply with legal obligations. We do not use client confidential data for unrelated purposes.'
        },
        {
          heading: '3. Third-Party Sharing',
          body: 'We share data only with authorized service providers, infrastructure partners, or legal authorities when required. All processing is governed by contractual, confidentiality, and security controls.'
        },
        {
          heading: '4. Data Retention and Security',
          body: 'We retain data only as long as required by contract, law, or operational necessity. Security measures include access controls, encryption, monitoring, and controlled processing environments.'
        },
        {
          heading: '5. User Rights',
          body: 'Depending on jurisdiction, users may request access, correction, deletion, restriction, or objection to processing. Requests can be submitted through the contact channels below.'
        },
        {
          heading: '6. Contact',
          body: 'For privacy requests or concerns, contact: privacy@lifewood.com or contact@lifewood.com.'
        }
      ]
    },
    cookie: {
      title: translations.footerCookie,
      sections: [
        {
          heading: '1. What Cookies We Use',
          body: 'We use essential cookies for site functionality, analytics cookies to understand performance, and preference cookies to remember settings such as language and display choices.'
        },
        {
          heading: '2. Why We Use Cookies',
          body: 'Cookies help us keep the site secure, improve usability, measure traffic patterns, and optimize user experience across devices and sessions.'
        },
        {
          heading: '3. Consent and Control',
          body: 'Where required by law, non-essential cookies are used only after consent. You can withdraw consent or adjust preferences at any time through browser controls.'
        },
        {
          heading: '4. Opt-Out Options',
          body: 'You can block or delete cookies in your browser settings. Disabling essential cookies may affect site functionality and access to certain features.'
        },
        {
          heading: '5. Contact',
          body: 'For cookie-related questions, contact: privacy@lifewood.com.'
        }
      ]
    },
    terms: {
      title: translations.footerTerms,
      sections: [
        {
          heading: '1. Service Scope',
          body: 'Services are delivered based on agreed statements of work, timelines, and acceptance criteria. Client obligations and dependencies must be met for delivery schedules to remain valid.'
        },
        {
          heading: '2. Intellectual Property',
          body: 'Ownership of deliverables, datasets, and outputs is governed by contract. Pre-existing tools, frameworks, and methodologies remain the property of their respective owners.'
        },
        {
          heading: '3. Acceptable Use',
          body: 'Users must not misuse the website or services for unlawful activities, unauthorized access attempts, or interference with system integrity.'
        },
        {
          heading: '4. Limitation of Liability',
          body: 'To the maximum extent permitted by law, liability is limited to direct damages under applicable agreements. Indirect or consequential damages are excluded unless explicitly required by law.'
        },
        {
          heading: '5. Suspension and Termination',
          body: 'We may suspend or terminate access for material breach, legal requirements, or security risk. Contractual termination terms apply to active engagements.'
        },
        {
          heading: '6. Governing Terms and Contact',
          body: 'Additional legal terms may be specified in master service agreements and project contracts. For questions, contact: legal@lifewood.com or contact@lifewood.com.'
        }
      ]
    }
  } as const;

  const socialLinks = [
    { label: 'LinkedIn', icon: 'in', href: 'https://www.linkedin.com/company/lifewood-data-technology-ltd.' },
    { label: 'Facebook', icon: 'f', href: 'https://www.facebook.com/LifewoodPH' },
    { label: 'Instagram', icon: 'ig', href: 'https://www.instagram.com/lifewood_official/' },
    { label: 'YouTube', icon: 'yt', href: 'https://www.youtube.com/@LifewoodDataTechnology' },
  ];

  return (
    <footer className="bg-dark-serpent text-white pt-24 pb-12 px-6 md:px-12 border-t border-green-900/50">
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <img
                src="/assets/logo.png"
                alt="Lifewood"
                className={`h-10 w-auto object-contain ${theme === 'dark' ? 'brightness-0 invert' : ''}`}
              />
            </div>
            <p className="text-green-4 leading-relaxed text-lg">
              {translations.footerTagline}
            </p>
            <div className="flex gap-4">
              {socialLinks.map((s, i) => (
                <a
                  key={i}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/10 hover:bg-saffron hover:text-dark-serpent transition-all hover:-translate-y-1 shadow-lg"
                  title={s.label}
                >
                  <span className="text-sm font-black">{s.icon}</span>
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xl font-bold mb-8">{translations.footerCompany}</h4>
            <ul className="space-y-4 text-green-4">
              <li><a href="#company-background" onClick={(e) => { e.preventDefault(); onNavigateSection('company-background'); }} className="hover:text-saffron transition-colors">{translations.footerAboutUs}</a></li>
              <li><a href="#impact" onClick={(e) => { e.preventDefault(); onNavigateSection('impact'); }} className="hover:text-saffron transition-colors">{translations.footerOurTeam}</a></li>
              <li><a href="#careers-segment" onClick={(e) => { e.preventDefault(); onNavigateSection('careers'); }} className="hover:text-saffron transition-colors">{translations.footerCareers}</a></li>
              <li><a href="#services-offered-section" onClick={(e) => { e.preventDefault(); onNavigateSection('services-offered-section'); }} className="hover:text-saffron transition-colors">{translations.footerNews}</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xl font-bold mb-8">{translations.footerServices}</h4>
            <ul className="space-y-4 text-green-4">
              <li><a href="#service-lidar" onClick={(e) => { e.preventDefault(); onNavigateSection('service-lidar'); }} className="hover:text-saffron transition-colors">{translations.serviceTitle1}</a></li>
              <li><a href="#service-speech" onClick={(e) => { e.preventDefault(); onNavigateSection('service-speech'); }} className="hover:text-saffron transition-colors">{translations.serviceTitle2}</a></li>
              <li><a href="#service-rlhf" onClick={(e) => { e.preventDefault(); onNavigateSection('service-rlhf'); }} className="hover:text-saffron transition-colors">{translations.serviceTitle3}</a></li>
              <li><a href="#service-medical" onClick={(e) => { e.preventDefault(); onNavigateSection('service-medical'); }} className="hover:text-saffron transition-colors">{translations.serviceTitle4}</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xl font-bold mb-8">{translations.footerResources}</h4>
            <ul className="space-y-4 text-green-4">
              <li><a href="#services" onClick={(e) => { e.preventDefault(); onNavigateSection('services'); }} className="hover:text-saffron transition-colors">{translations.footerCaseStudies}</a></li>
              <li><a href="#services-offered-section" onClick={(e) => { e.preventDefault(); onNavigateSection('services-offered-section'); }} className="hover:text-saffron transition-colors">{translations.footerDocumentation}</a></li>
              <li><a href="#contact" onClick={(e) => { e.preventDefault(); onNavigateSection('contact'); }} className="hover:text-saffron transition-colors">{translations.footerSupport}</a></li>
              <li>
                <a
                  href="#contact"
                  onClick={(e) => {
                    e.preventDefault();
                    onContactClick();
                  }}
                  className="hover:text-saffron transition-colors"
                >
                  {translations.navContact}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-12 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-green-4">
          <p>(c) 2026 {translations.footerCopyright}</p>
          <div className="flex gap-8">
            <button type="button" onClick={() => setActivePolicy('privacy')} className="hover:text-saffron transition-colors">{translations.footerPrivacy}</button>
            <button type="button" onClick={() => setActivePolicy('cookie')} className="hover:text-saffron transition-colors">{translations.footerCookie}</button>
            <button type="button" onClick={() => setActivePolicy('terms')} className="hover:text-saffron transition-colors">{translations.footerTerms}</button>
          </div>
        </div>
      </div>

      {activePolicy && (
        <div className="fixed inset-0 z-[10050] flex items-center justify-center p-4 md:p-8">
          <div
            className={`absolute inset-0 backdrop-blur-sm ${isDark ? 'bg-dark-serpent/85' : 'bg-dark-serpent/40'}`}
            onClick={() => setActivePolicy(null)}
          />
          <div className={`relative w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden border ${isDark ? 'bg-[#0d2518] border-green-900/60' : 'bg-white border-paper'}`}>
            <div className={`flex items-center justify-between px-6 md:px-8 py-5 border-b ${isDark ? 'border-green-900/60 bg-[#113422]' : 'border-paper bg-paper/70'}`}>
              <h3 className={`text-xl md:text-2xl font-black ${isDark ? 'text-white' : 'text-dark-serpent'}`}>{policyContent[activePolicy].title}</h3>
              <button
                type="button"
                onClick={() => setActivePolicy(null)}
                className={`w-10 h-10 rounded-full transition-all flex items-center justify-center text-xl ${isDark ? 'bg-white/10 text-white hover:bg-saffron hover:text-dark-serpent' : 'bg-dark-serpent/10 text-dark-serpent hover:bg-saffron hover:text-dark-serpent'}`}
                aria-label="Close policy modal"
              >
                x
              </button>
            </div>
            <div className={`max-h-[70vh] overflow-y-auto px-6 md:px-8 py-6 space-y-6 ${isDark ? 'text-green-4' : 'text-green-2'}`}>
              {policyContent[activePolicy].sections.map((section, idx) => (
                <section key={idx} className="space-y-2">
                  <h4 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-dark-serpent'}`}>{section.heading}</h4>
                  <p className="leading-relaxed">{section.body}</p>
                </section>
              ))}
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};

export default Footer;
