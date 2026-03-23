import React, { useState, useMemo, useCallback } from 'react';
import { useHRPipeline, HRApplicant, MockScreeningData, HRRecommendation, generateMockScreeningData } from '../../hooks/useHRPipeline';
import { useToast } from '../ToastProvider';

// ── Tab types ─────────────────────────────────────────────────────────────────

type Tab = 'new' | 'screening' | 'interviews' | 'interview-results' | 'shortlisted' | 'hired' | 'talent-pool';
type ScreeningSubTab = 'pending' | 'results';

type ModalType =
  | { kind: 'applicant-details'; applicantId: string }
  | { kind: 'screening-results'; applicantId: string }
  | { kind: 'interview-draft'; applicantId: string }
  | { kind: 'update-schedule'; applicantId: string }
  | { kind: 'reject'; applicantId: string }
  | { kind: 'talent-pool-email'; applicantId: string; reEngage?: boolean }
  | null;

// ── Shared UI helpers ─────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string | null }) {
  const map: Record<string, string> = {
    'Screening Sent': 'bg-blue-50 text-blue-700 border-blue-200',
    'Screening Completed': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'Interview Scheduled': 'bg-purple-50 text-purple-700 border-purple-200',
    'Shortlisted': 'bg-amber-50 text-amber-700 border-amber-200',
    'HIRED': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };
  const cls = status ? (map[status] ?? 'bg-gray-100 text-gray-500 border-gray-200') : 'bg-gray-100 text-gray-500 border-gray-200';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${cls}`}>
      {status || 'New'}
    </span>
  );
}

function ScoreBadge({ score }: { score: number | undefined }) {
  if (score === undefined || score === null) return <span className="text-[#8a9a8a] text-sm">—</span>;
  const cls =
    score >= 80
      ? 'text-emerald-700 bg-emerald-50'
      : score >= 60
        ? 'text-amber-700 bg-amber-50'
        : 'text-red-700 bg-red-50';
  return <span className={`inline-block px-2 py-0.5 rounded font-black text-sm ${cls}`}>{score}</span>;
}

function RecommendationBadge({ recommendation }: { recommendation?: string | null }) {
  if (!recommendation) return <span className="text-[#8a9a8a] text-xs">—</span>;
  const key = recommendation.toLowerCase();
  const cls =
    key === 'highly recommended'
      ? 'bg-emerald-50 text-emerald-700'
      : key === 'recommended'
        ? 'bg-blue-50 text-blue-700'
        : key === 'consider'
          ? 'bg-amber-50 text-amber-700'
          : 'bg-red-50 text-red-700';
  return <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wide ${cls}`}>{recommendation}</span>;
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0].toUpperCase())
    .join('');
  const colors = [
    'bg-emerald-700',
    'bg-teal-700',
    'bg-cyan-700',
    'bg-blue-700',
    'bg-indigo-700',
    'bg-violet-700',
    'bg-rose-700',
    'bg-amber-700',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const color = colors[Math.abs(hash) % colors.length];
  return (
    <div className={`w-9 h-9 rounded-full ${color} text-white flex items-center justify-center text-xs font-black shrink-0`}>
      {initials}
    </div>
  );
}

function fmtDate(iso: string | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtDateTime(iso: string | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Strips the trailing random ID suffix from position IDs (e.g. "ai-data-annotator-btfzkj" → "AI Data Annotator")
function formatRole(role: string): string {
  const parts = role.split('-');
  if (parts.length > 1 && /^[a-z0-9]{4,8}$/.test(parts[parts.length - 1])) {
    parts.pop();
  }
  return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}

function ActionBtn({
  children,
  onClick,
  disabled,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-lg transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-wait ${
        danger
          ? 'bg-[#fff1ee] text-[#a64534] border border-[#f0c9bf] hover:bg-[#ffe5df]'
          : 'bg-[#1a3a2a] text-white hover:bg-[#2a5a3a]'
      }`}
    >
      {children}
    </button>
  );
}

function GhostBtn({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-lg border border-[#d9cfbf] bg-white text-[#1a3a2a] hover:bg-[#f8f3ea] transition-colors whitespace-nowrap disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function ResumeButton({ url }: { url?: string | null }) {
  if (!url) return <span className="text-[#8a9a8a] text-xs">—</span>;
  return (
    <GhostBtn onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}>
      View
    </GhostBtn>
  );
}

function DetailItem({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="rounded-xl border border-[#e8e3da] bg-[#fffdfa] p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8a9a8a]">{label}</p>
      <p className="mt-1.5 text-sm leading-6 text-[#203427] break-words whitespace-pre-wrap">{value}</p>
    </div>
  );
}

function ApplicantDetailsGrid({ applicant }: { applicant: HRApplicant }) {
  const detailEntries = [
    { label: 'Phone', value: applicant.applicationDetails.phone },
    { label: 'Experience Level', value: applicant.applicationDetails.experience },
    { label: 'Preferred Work Location', value: applicant.applicationDetails.workLocation },
    { label: 'Availability', value: applicant.applicationDetails.availability },
    { label: 'Languages', value: applicant.applicationDetails.languages },
    { label: 'Skills', value: applicant.applicationDetails.skills },
    { label: 'LinkedIn', value: applicant.applicationDetails.linkedin },
    { label: 'Portfolio', value: applicant.applicationDetails.portfolio },
    { label: 'University', value: applicant.applicationDetails.university },
    { label: 'Course / Program', value: applicant.applicationDetails.courseProgram },
    { label: 'Internship Hours', value: applicant.applicationDetails.internshipHours },
    { label: 'Additional Info', value: applicant.applicationDetails.additionalInfo },
    { label: 'Cover Letter', value: applicant.applicationDetails.coverLetter },
  ].filter(item => item.value && item.value.trim().length > 0);

  if (!detailEntries.length) {
    return (
      <div className="rounded-xl border border-[#ede8e0] bg-[#fdfaf6] px-4 py-8 text-center">
        <p className="text-sm text-[#8a9a8a] font-medium">No application form details were captured for this applicant.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {detailEntries.map(item => (
        <DetailItem key={item.label} label={item.label} value={item.value} />
      ))}
    </div>
  );
}

// ── ApplicantTable ────────────────────────────────────────────────────────────

function ApplicantTable({
  headers,
  rows,
  renderRow,
  emptyMessage,
}: {
  headers: string[];
  rows: HRApplicant[];
  renderRow: (a: HRApplicant) => React.ReactNode;
  emptyMessage: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#e8e3da] shadow-sm overflow-hidden">
      {rows.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <p className="text-sm text-[#8a9a8a] font-medium">{emptyMessage}</p>
        </div>
      ) : (
        <table className="w-full min-w-max">
          <thead>
            <tr className="border-b border-[#f0ebe2] bg-[#faf8f4]">
              {headers.map(h => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-[10px] font-black text-[#8a9a8a] uppercase tracking-widest whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(a => (
              <tr
                key={a.id}
                className="border-b border-[#f7f4ef] last:border-0 hover:bg-[#faf8f4] transition-colors"
              >
                {renderRow(a)}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ── Modal wrapper ─────────────────────────────────────────────────────────────

function Modal({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className={`w-full ${wide ? 'max-w-6xl' : 'max-w-lg'} rounded-[28px] border border-white/65 bg-[#f7f2e8]/35 p-1.5 shadow-[0_28px_80px_rgba(19,41,30,0.24)] backdrop-blur-md`}>
        <div className="overflow-hidden rounded-[24px] bg-white shadow-[0_10px_30px_rgba(19,41,30,0.08)]">
          <div className="flex items-center justify-between border-b border-[#ece3d4] bg-gradient-to-br from-[#f7f2e8]/92 to-white px-6 py-4">
            <h3 className="text-[1rem] font-black text-[#193728]">{title}</h3>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-[#f2ece0] flex items-center justify-center text-[#1a3a2a] hover:bg-[#e8e0d0] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="px-6 py-5">{children}</div>
        </div>
      </div>
    </div>
  );
}

// ── Name/Email cell ───────────────────────────────────────────────────────────

function NameCell({ applicant, onViewDetails }: { applicant: HRApplicant; onViewDetails?: (applicant: HRApplicant) => void }) {
  return (
    <td className="px-4 py-3">
      <div className="flex items-center gap-2.5">
        <Avatar name={applicant.name} />
        <div className="min-w-0">
          <p className="text-sm font-black text-[#1a2e1a] truncate max-w-[160px]">{applicant.name}</p>
          <p className="text-[11px] text-[#8a9a8a] truncate max-w-[160px]">{applicant.email}</p>
          {onViewDetails ? (
            <button
              type="button"
              onClick={() => onViewDetails(applicant)}
              className="mt-1 text-[10px] font-black uppercase tracking-wide text-[#1a3a2a] hover:underline"
            >
              View details
            </button>
          ) : null}
        </div>
      </div>
    </td>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function HRPipeline() {
  const {
    applicants,
    loading,
    working,
    approveRecentApplicant,
    completeScreening,
    scheduleInterview,
    markInterviewDone,
    shortlistApplicant,
    hireApplicant,
    moveToTalentPool,
    rejectApplicantWithEmail,
    revertApplicantStatus,
    updateInterviewDetails,
  } = useHRPipeline();

  const [activeTab, setActiveTab] = useState<Tab>('new');
  const [screeningSubTab, setScreeningSubTab] = useState<ScreeningSubTab>('pending');
  const [modal, setModal] = useState<ModalType>(null);

  // Modal local state
  const [draftInput, setDraftInput] = useState('');
  const [meetLinkInput, setMeetLinkInput] = useState('');
  const [interviewDateInput, setInterviewDateInput] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [rejectCustomBody, setRejectCustomBody] = useState('');
  const [talentPoolEmail, setTalentPoolEmail] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  // Inline Interview Results state (per-applicant)
  const [inlineFeedback, setInlineFeedback] = useState<Record<string, string>>({});
  const [inlineRec, setInlineRec] = useState<Record<string, string>>({});

  const { pushToast } = useToast();

  // ── Tab data derivations ──────────────────────────────────────────────────

  const newApplicants = useMemo(() => applicants.filter(a => !a.status && !a.talentPool), [applicants]);
  const screeningPending = useMemo(() => applicants.filter(a => a.status === 'Screening Sent' && !a.talentPool), [applicants]);
  const screeningCompleted = useMemo(() => applicants.filter(a => a.status === 'Screening Completed' && !a.talentPool), [applicants]);
  // Interview Schedule: invite sent, interview not yet marked done
  const interviewSchedule = useMemo(() => applicants.filter(a => a.status === 'Interview Scheduled' && !a.hrReviewedAt && !a.talentPool), [applicants]);
  // Interview Results: HR has marked the interview as done (hrReviewedAt set)
  const interviewResults = useMemo(() => applicants.filter(a => a.status === 'Interview Scheduled' && !!a.hrReviewedAt && !a.talentPool), [applicants]);
  const shortlisted = useMemo(() => applicants.filter(a => a.status === 'Shortlisted' && !a.talentPool), [applicants]);
  const hired = useMemo(() => applicants.filter(a => a.status === 'HIRED'), [applicants]);
  const talentPool = useMemo(() => applicants.filter(a => a.talentPool), [applicants]);

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: 'new', label: 'New', count: newApplicants.length },
    { key: 'screening', label: 'AI Screening', count: screeningPending.length + screeningCompleted.length },
    { key: 'interviews', label: 'Interview Schedule', count: interviewSchedule.length },
    { key: 'interview-results', label: 'Interview Results', count: interviewResults.length },
    { key: 'shortlisted', label: 'Shortlisted', count: shortlisted.length },
    { key: 'hired', label: 'Hired', count: hired.length },
    { key: 'talent-pool', label: 'Talent Pool', count: talentPool.length },
  ];

  const recommendationOptions: HRRecommendation[] = [
    'Highly Recommended',
    'Recommended',
    'Consider',
    'Not Recommend',
  ];

  // ── Modal open helpers ────────────────────────────────────────────────────

  const openInterviewDraftModal = useCallback((id: string) => {
    const a = applicants.find(x => x.id === id);
    if (!a) return;
    setDraftInput(
      a.interviewEmailDraft ||
        `Hi ${a.name},\n\nWe are pleased to invite you to an interview for the ${a.role} position at Lifewood.\n\nPlease join us at the scheduled time using the link below.\n\nBest regards,\nThe Lifewood HR Team`
    );
    setInterviewDateInput(
      a.interviewScheduledFor
        ? new Date(a.interviewScheduledFor).toISOString().slice(0, 16)
        : ''
    );
    setMeetLinkInput(a.interviewMeetLink || '');
    setActionError(null);
    setModal({ kind: 'interview-draft', applicantId: id });
  }, [applicants]);

  const openUpdateScheduleModal = useCallback((id: string) => {
    const a = applicants.find(x => x.id === id);
    if (!a) return;
    setInterviewDateInput(
      a.interviewScheduledFor
        ? new Date(a.interviewScheduledFor).toISOString().slice(0, 16)
        : ''
    );
    setMeetLinkInput(a.interviewMeetLink || '');
    setDraftInput(
      a.interviewEmailDraft ||
      `Hi ${a.name},\n\nYour interview schedule for the ${a.role} position at Lifewood has been updated. Please review the revised details below.\n\nBest regards,\nThe Lifewood HR Team`
    );
    setActionError(null);
    setModal({ kind: 'update-schedule', applicantId: id });
  }, [applicants]);

  const openApplicantDetailsModal = useCallback((id: string) => {
    setModal({ kind: 'applicant-details', applicantId: id });
  }, []);

  const openRejectModal = useCallback((id: string) => {
    const a = applicants.find(x => x.id === id);
    if (!a) return;
    setRejectReason('');
    setRejectCustomBody(
      `Hi ${a.name},\n\nThank you for your interest in the ${a.role} position at Lifewood.\n\nAfter careful consideration, we regret that we will not be moving forward. [reason here]\n\nWe appreciate your time and wish you all the best.\n\nBest regards,\nThe Lifewood HR Team`
    );
    setActionError(null);
    setModal({ kind: 'reject', applicantId: id });
  }, [applicants]);

  const openTalentPoolModal = useCallback((id: string, reEngage = false) => {
    setTalentPoolEmail(
      reEngage
        ? "We'd like to reconnect with you! We have new opportunities that may align with your profile. We would love to discuss how your experience could be a great fit for our team. Please let us know if you're interested."
        : "Thank you for your interest in Lifewood. While we don't have an immediate opening that matches your profile, we'd like to keep you in our talent pool for future opportunities. We'll be in touch when a suitable role becomes available."
    );
    setActionError(null);
    setModal({ kind: 'talent-pool-email', applicantId: id, reEngage });
  }, []);

  const closeModal = useCallback(() => {
    setModal(null);
    setActionError(null);
  }, []);

  // ── Action wrappers ───────────────────────────────────────────────────────

  const run = useCallback(
    async (fn: () => Promise<void>, successMsg: string, closeOnSuccess = true) => {
      setActionLoading(true);
      setActionError(null);
      try {
        await fn();
        pushToast({ type: 'success', message: successMsg });
        if (closeOnSuccess) closeModal();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Something went wrong';
        setActionError(msg);
        pushToast({ type: 'error', message: msg });
      } finally {
        setActionLoading(false);
      }
    },
    [pushToast, closeModal]
  );

  // ── Loading state ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#1a3a2a] border-t-transparent animate-spin" />
          <p className="text-sm text-[#8a9a8a] font-medium">Loading HR pipeline...</p>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-[#1a2e1a] tracking-tight">HR Pipeline</h2>
          <p className="text-xs text-[#6a8a7a] font-medium mt-0.5">{applicants.length} total applicant{applicants.length !== 1 ? 's' : ''} across all stages</p>
        </div>
      </div>

      {/* Pipeline stage guide */}
      <div className="bg-white rounded-2xl border border-[#e8e3da] shadow-sm overflow-hidden">
        <button
          onClick={() => setShowGuide(v => !v)}
          className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-[#faf8f4] transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#f2ece0] flex items-center justify-center text-[11px] font-black text-[#1a3a2a]">?</span>
            <span className="text-xs font-black text-[#1a3a2a] uppercase tracking-widest">Pipeline Stage Guide</span>
          </div>
          <svg
            className={`w-3.5 h-3.5 text-[#6a8a7a] transition-transform duration-200 ${showGuide ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        {showGuide && (
          <div className="border-t border-[#f0ebe2] px-5 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              {
                status: 'Screening Sent',
                color: 'bg-blue-50 text-blue-700 border-blue-200',
                desc: 'Applicant received the AI pre-assessment link via email. Click "Mark Complete" once they finish.',
              },
              {
                status: 'Screening Completed',
                color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
                desc: 'AI score and mock Q&A generated. HR reviews responses then clicks "Set an interview" or rejects.',
              },
              {
                status: 'Interview Scheduled',
                color: 'bg-purple-50 text-purple-700 border-purple-200',
                desc: 'Interview invite sent. HR marks ✓ when the interview is done to move to Interview Results.',
              },
              {
                status: 'Shortlisted',
                color: 'bg-amber-50 text-amber-700 border-amber-200',
                desc: 'HR added feedback and recommendation. Company Head makes final call: Hired or Talent Pool.',
              },
              {
                status: 'HIRED',
                color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                desc: 'Candidate hired. A congratulations email is sent automatically.',
              },
            ].map(item => (
              <div key={item.status} className="rounded-xl border border-[#ede8e0] bg-[#fdfaf6] p-3">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border mb-2 ${item.color}`}>
                  {item.status}
                </span>
                <p className="text-[12px] text-[#4a6a5a] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tab navigation */}
      <div className="overflow-x-auto">
        <div className="flex gap-1 min-w-max bg-white rounded-2xl border border-[#e8e3da] p-1.5 shadow-sm">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-black transition-all whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-[#1a3a2a] text-white shadow-sm'
                  : 'text-[#5a7a6a] hover:bg-[#f0ebe2]'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span
                  className={`inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[9px] font-black px-1 ${
                    activeTab === tab.key
                      ? 'bg-white/20 text-white'
                      : 'bg-[#e8e3da] text-[#1a3a2a]'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab: New ── */}
      {activeTab === 'new' && (
        <ApplicantTable
          headers={['Name / Email', 'Role', 'Applied Date', 'Details', 'Actions']}
          rows={newApplicants}
          emptyMessage="No new applicants at the moment."
          renderRow={a => (
            <>
              <NameCell applicant={a} />
              <td className="px-4 py-3 text-sm text-[#3a5a4a] font-semibold">{formatRole(a.role)}</td>
              <td className="px-4 py-3 text-sm text-[#6a8a7a]">{fmtDate(a.appliedDate)}</td>
              <td className="px-4 py-3"><GhostBtn onClick={() => openApplicantDetailsModal(a.id)}>View</GhostBtn></td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <ActionBtn
                    onClick={() => void run(() => approveRecentApplicant(a.id), `Screening link sent to ${a.name}`)}
                    disabled={working === a.id}
                  >
                    Send Screening
                  </ActionBtn>
                  <GhostBtn onClick={() => openRejectModal(a.id)} disabled={working === a.id}>
                    Reject
                  </GhostBtn>
                </div>
              </td>
            </>
          )}
        />
      )}

      {/* ── Tab: Interview Results ── */}
      {activeTab === 'screening' && (
        <div className="space-y-4">
          <div className="flex gap-1 rounded-2xl border border-[#e8e3da] bg-white p-1.5 w-fit shadow-sm">
            <button
              type="button"
              onClick={() => setScreeningSubTab('pending')}
              className={`px-3.5 py-2 rounded-xl text-[11px] font-black transition-colors ${
                screeningSubTab === 'pending' ? 'bg-[#1a3a2a] text-white' : 'text-[#5a7a6a] hover:bg-[#f0ebe2]'
              }`}
            >
              Pending
            </button>
            <button
              type="button"
              onClick={() => setScreeningSubTab('results')}
              className={`px-3.5 py-2 rounded-xl text-[11px] font-black transition-colors ${
                screeningSubTab === 'results' ? 'bg-[#1a3a2a] text-white' : 'text-[#5a7a6a] hover:bg-[#f0ebe2]'
              }`}
            >
              Results
            </button>
          </div>

          {screeningSubTab === 'pending' ? (
            <ApplicantTable
              headers={['Candidate', 'Position', 'Applied Date', 'Details', 'Status', 'Actions']}
              rows={screeningPending}
              emptyMessage="No applicants are waiting for screening completion."
              renderRow={a => (
                <>
                  <NameCell applicant={a} />
                  <td className="px-4 py-3 text-sm text-[#3a5a4a] font-semibold">{formatRole(a.role)}</td>
                  <td className="px-4 py-3 text-sm text-[#6a8a7a]">{fmtDate(a.appliedDate)}</td>
                  <td className="px-4 py-3"><GhostBtn onClick={() => openApplicantDetailsModal(a.id)}>View</GhostBtn></td>
                  <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <ActionBtn
                        onClick={() => void run(() => completeScreening(a.id), `Screening marked complete for ${a.name}`)}
                        disabled={working === a.id}
                      >
                        Mark Complete
                      </ActionBtn>
                      <GhostBtn onClick={() => openRejectModal(a.id)} disabled={working === a.id}>
                        Reject
                      </GhostBtn>
                    </div>
                  </td>
                </>
              )}
            />
          ) : (
            <ApplicantTable
              headers={['Candidate', 'Position', 'AI Score', 'AI Results', 'Details', 'Recommendation', 'Actions']}
              rows={screeningCompleted}
              emptyMessage="No completed screening results yet."
              renderRow={a => {
                const effectiveMockScreening = a.mockScreening ?? (a.screeningScore != null ? generateMockScreeningData(a.id, a.role, a.screeningScore) : null);
                const recommendation = effectiveMockScreening?.recommendation ?? null;
                return (
                  <>
                    <NameCell applicant={a} />
                    <td className="px-4 py-3 text-sm text-[#3a5a4a] font-semibold">{formatRole(a.role)}</td>
                    <td className="px-4 py-3"><ScoreBadge score={a.screeningScore} /></td>
                    <td className="px-4 py-3"><GhostBtn onClick={() => setModal({ kind: 'screening-results', applicantId: a.id })}>View</GhostBtn></td>
                    <td className="px-4 py-3"><GhostBtn onClick={() => openApplicantDetailsModal(a.id)}>View</GhostBtn></td>
                    <td className="px-4 py-3"><RecommendationBadge recommendation={recommendation} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <ActionBtn onClick={() => openInterviewDraftModal(a.id)} disabled={working === a.id}>
                          Set Interview
                        </ActionBtn>
                        <GhostBtn onClick={() => openRejectModal(a.id)} disabled={working === a.id}>
                          Reject
                        </GhostBtn>
                      </div>
                    </td>
                  </>
                );
              }}
            />
          )}
        </div>
      )}

      {activeTab === 'interviews' && (
        <div className="space-y-2">
          <p className="text-xs text-[#6a8a7a] font-medium px-1">Scheduled interviews with applicant files, screening output, and submitted form details.</p>
          <ApplicantTable
            headers={['Candidate', 'Position', 'AI Score', 'AI Results', 'Details', 'Schedule', 'Meeting Link', 'Status', 'Actions']}
            rows={interviewSchedule}
            emptyMessage="No interviews are scheduled right now."
            renderRow={a => (
              <>
                <NameCell applicant={a} />
                <td className="px-4 py-3 text-sm text-[#3a5a4a] font-semibold">{formatRole(a.role)}</td>
                <td className="px-4 py-3"><ScoreBadge score={a.screeningScore} /></td>
                <td className="px-4 py-3"><GhostBtn onClick={() => setModal({ kind: 'screening-results', applicantId: a.id })}>View</GhostBtn></td>
                <td className="px-4 py-3"><GhostBtn onClick={() => openApplicantDetailsModal(a.id)}>View</GhostBtn></td>
                <td className="px-4 py-3 min-w-[170px]">
                  <div className="text-xs text-[#1a2e1a] font-semibold leading-relaxed">
                    <p>{fmtDateTime(a.interviewScheduledFor)}</p>
                  </div>
                </td>
                <td className="px-4 py-3 max-w-[200px]">
                  {a.interviewMeetLink ? (
                    <a
                      href={a.interviewMeetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-[#1a3a2a] hover:underline break-all"
                    >
                      Open Link
                    </a>
                  ) : (
                    <span className="text-[#8a9a8a] text-xs">-</span>
                  )}
                </td>
                <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <GhostBtn onClick={() => openUpdateScheduleModal(a.id)} disabled={working === a.id}>
                      Update
                    </GhostBtn>
                    <button
                      onClick={() => void run(() => markInterviewDone(a.id), `Interview marked as done for ${a.name}`)}
                      disabled={working === a.id}
                      title="Mark interview done"
                      className="w-7 h-7 rounded-lg flex items-center justify-center bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </button>
                  </div>
                </td>
              </>
            )}
          />
        </div>
      )}

      {activeTab === 'interview-results' && (
        <div className="space-y-2">
          <p className="text-xs text-[#6a8a7a] font-medium px-1">Completed interviews with evaluation summaries and HR recommendations.</p>
          <ApplicantTable
            headers={['Candidate', 'Position', 'AI Score', 'AI Results', 'Details', 'Feedback', 'HR Recommendation', 'Action']}
            rows={interviewResults}
            emptyMessage="No interview results to review."
            renderRow={a => {
              const feedback = inlineFeedback[a.id] ?? a.hrFeedback ?? '';
              const rec = inlineRec[a.id] ?? a.hrRecommendation ?? '';
              return (
                <>
                  <NameCell applicant={a} />
                  <td className="px-4 py-3 text-sm text-[#3a5a4a] font-semibold">{formatRole(a.role)}</td>
                  <td className="px-4 py-3"><ScoreBadge score={a.screeningScore} /></td>
                  <td className="px-4 py-3"><GhostBtn onClick={() => setModal({ kind: 'screening-results', applicantId: a.id })}>View</GhostBtn></td>
                  <td className="px-4 py-3"><GhostBtn onClick={() => openApplicantDetailsModal(a.id)}>View</GhostBtn></td>
                  <td className="px-4 py-3 min-w-[200px]">
                    <textarea
                      value={feedback}
                      onChange={e => setInlineFeedback(prev => ({ ...prev, [a.id]: e.target.value }))}
                      placeholder="Add HR Feedback..."
                      rows={2}
                      className="w-full rounded-lg border border-[#e8e3da] bg-[#faf8f4] px-3 py-1.5 text-xs text-[#1a2e1a] font-medium focus:outline-none focus:ring-2 focus:ring-[#1a3a2a]/20 resize-none leading-relaxed"
                    />
                  </td>
                  <td className="px-4 py-3 min-w-[160px]">
                    <select
                      value={rec}
                      onChange={e => setInlineRec(prev => ({ ...prev, [a.id]: e.target.value }))}
                      className="w-full rounded-lg border border-[#e8e3da] bg-[#faf8f4] px-3 py-1.5 text-xs text-[#1a2e1a] font-semibold focus:outline-none focus:ring-2 focus:ring-[#1a3a2a]/20"
                    >
                      <option value="">Select...</option>
                      {recommendationOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {/* Shortlist ✓ */}
                      <button
                        onClick={() => void run(
                          () => shortlistApplicant(a.id, (rec || 'Recommended') as HRRecommendation, feedback),
                          `${a.name} has been shortlisted`
                        )}
                        disabled={working === a.id || !rec}
                        title="Shortlist candidate"
                        className="w-7 h-7 rounded-lg flex items-center justify-center bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      </button>
                      {/* Reject ✗ */}
                      <button
                        onClick={() => openRejectModal(a.id)}
                        disabled={working === a.id}
                        title="Reject candidate"
                        className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#fff1ee] text-[#a64534] border border-[#f0c9bf] hover:bg-[#ffe5df] transition-colors disabled:opacity-50"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </>
              );
            }}
          />
        </div>
      )}

      {/* ── Tab: Shortlisted ── */}
      {activeTab === 'shortlisted' && (
        <div className="space-y-2">
          <p className="text-xs text-[#6a8a7a] font-medium px-1">HR-recommended candidates awaiting final decision by the Company Head.</p>
          <ApplicantTable
            headers={['Candidate', 'Position', 'AI Score', 'AI Responses', 'Feedback', 'Recommendation', 'Actions']}
            rows={shortlisted}
            emptyMessage="No shortlisted candidates."
            renderRow={a => (
              <>
                <NameCell applicant={a} />
                <td className="px-4 py-3 text-sm text-[#3a5a4a] font-semibold">{formatRole(a.role)}</td>
                <td className="px-4 py-3">
                  <ScoreBadge score={a.screeningScore} />
                </td>
                <td className="px-4 py-3">
                  <GhostBtn onClick={() => setModal({ kind: 'screening-results', applicantId: a.id })} disabled={working === a.id}>
                    View
                  </GhostBtn>
                </td>
                <td className="px-4 py-3 max-w-[160px]">
                  <p className="text-xs text-[#5a7a6a] leading-relaxed line-clamp-2">{a.hrFeedback || '—'}</p>
                </td>
                <td className="px-4 py-3">
                  <RecommendationBadge recommendation={a.hrRecommendation} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {/* Hired */}
                    <ActionBtn
                      onClick={() => void run(() => hireApplicant(a.id), `${a.name} has been hired!`)}
                      disabled={working === a.id}
                    >
                      Hired
                    </ActionBtn>
                    {/* X → Talent Pool */}
                    <button
                      onClick={() => void run(() => moveToTalentPool(a.id), `${a.name} moved to Talent Pool`)}
                      disabled={working === a.id}
                      title="Move to Talent Pool"
                      className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#fff1ee] text-[#a64534] border border-[#f0c9bf] hover:bg-[#ffe5df] transition-colors disabled:opacity-50"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </td>
              </>
            )}
          />
        </div>
      )}

      {/* ── Tab: Hired ── */}
      {activeTab === 'hired' && (
        <div className="space-y-2">
          <p className="text-xs text-[#6a8a7a] font-medium px-1">Candidates marked as hired after the welcome email was sent.</p>
          <ApplicantTable
            headers={['Candidate', 'Position', 'AI Score', 'AI Responses', 'Details', 'Feedback', 'Recommendation']}
            rows={hired}
            emptyMessage="No hired candidates yet."
            renderRow={a => (
              <>
                <NameCell applicant={a} />
                <td className="px-4 py-3 text-sm text-[#3a5a4a] font-semibold">{formatRole(a.role)}</td>
                <td className="px-4 py-3">
                  <ScoreBadge score={a.screeningScore} />
                </td>
                <td className="px-4 py-3">
                  <GhostBtn onClick={() => setModal({ kind: 'screening-results', applicantId: a.id })}>
                    View
                  </GhostBtn>
                </td>
                <td className="px-4 py-3 max-w-[160px]">
                  <p className="text-xs text-[#5a7a6a] leading-relaxed line-clamp-2">{a.hrFeedback || '—'}</p>
                </td>
                <td className="px-4 py-3">
                  <RecommendationBadge recommendation={a.hrRecommendation} />
                </td>
              </>
            )}
          />
        </div>
      )}

      {/* ── Tab: Talent Pool ── */}
      {activeTab === 'talent-pool' && (
        <div className="space-y-2">
          <p className="text-xs text-[#6a8a7a] font-medium px-1">Qualified candidates saved for future opportunities.</p>
          <ApplicantTable
            headers={['Candidate', 'Position', 'AI Score', 'Responses', 'Feedback', 'Recommendation', 'Actions']}
            rows={talentPool}
            emptyMessage="No candidates in the talent pool."
            renderRow={a => (
              <>
                <NameCell applicant={a} />
                <td className="px-4 py-3 text-sm text-[#3a5a4a] font-semibold">{formatRole(a.role)}</td>
                <td className="px-4 py-3">
                  <ScoreBadge score={a.screeningScore} />
                </td>
                <td className="px-4 py-3">
                  <GhostBtn onClick={() => setModal({ kind: 'screening-results', applicantId: a.id })}>
                    View
                  </GhostBtn>
                </td>
                <td className="px-4 py-3 max-w-[160px]">
                  <p className="text-xs text-[#5a7a6a] leading-relaxed line-clamp-2">{a.hrFeedback || '—'}</p>
                </td>
                <td className="px-4 py-3">
                  <RecommendationBadge recommendation={a.hrRecommendation} />
                </td>
                <td className="px-4 py-3">
                  <GhostBtn onClick={() => openTalentPoolModal(a.id, true)} disabled={working === a.id}>
                    Re-engage
                  </GhostBtn>
                </td>
              </>
            )}
          />
        </div>
      )}

      {/* ── Modals ────────────────────────────────────────────────────────────── */}

      {/* Interview draft modal — opened from AI Screening Results → "Set an interview" */}
      {modal?.kind === 'interview-draft' && (() => {
        const applicant = applicants.find(a => a.id === modal.applicantId);
        if (!applicant) return null;
        return (
          <Modal title={`Schedule Interview — ${applicant.name}`} onClose={closeModal}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-[#1a3a2a] uppercase tracking-widest mb-1.5">
                    Interview Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={interviewDateInput}
                    onChange={e => setInterviewDateInput(e.target.value)}
                    className="w-full rounded-xl border border-[#e8e3da] bg-[#faf8f4] px-3 py-2 text-sm text-[#1a2e1a] font-semibold focus:outline-none focus:ring-2 focus:ring-[#1a3a2a]/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-[#1a3a2a] uppercase tracking-widest mb-1.5">
                    Meet Link
                  </label>
                  <input
                    type="url"
                    value={meetLinkInput}
                    onChange={e => setMeetLinkInput(e.target.value)}
                    placeholder="https://meet.google.com/..."
                    className="w-full rounded-xl border border-[#e8e3da] bg-[#faf8f4] px-3 py-2 text-sm text-[#1a2e1a] font-semibold focus:outline-none focus:ring-2 focus:ring-[#1a3a2a]/20"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-[#1a3a2a] uppercase tracking-widest mb-1.5">
                  Email Body
                </label>
                <textarea
                  rows={6}
                  value={draftInput}
                  onChange={e => setDraftInput(e.target.value)}
                  className="w-full rounded-xl border border-[#e8e3da] bg-[#faf8f4] px-4 py-2.5 text-sm text-[#1a2e1a] font-medium leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#1a3a2a]/20 resize-none"
                />
              </div>
              {actionError && (
                <p className="text-xs text-red-600 font-semibold">{actionError}</p>
              )}
              <div className="flex justify-end gap-2 pt-1">
                <GhostBtn onClick={closeModal} disabled={actionLoading}>Cancel</GhostBtn>
                <ActionBtn
                  onClick={() =>
                    void run(
                      () => scheduleInterview(applicant.id, {
                        draft: draftInput,
                        scheduledFor: interviewDateInput ? new Date(interviewDateInput).toISOString() : new Date(Date.now() + 2 * 86400000).toISOString(),
                        meetLink: meetLinkInput,
                      }),
                      `Interview scheduled and invite sent to ${applicant.name}`
                    )
                  }
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Sending...' : 'Send Interview Invite'}
                </ActionBtn>
              </div>
            </div>
          </Modal>
        );
      })()}

      {/* Update schedule modal — from Interview Schedule tab */}
      {modal?.kind === 'update-schedule' && (() => {
        const applicant = applicants.find(a => a.id === modal.applicantId);
        if (!applicant) return null;
        return (
          <Modal title={`Update Schedule — ${applicant.name}`} onClose={closeModal}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-[#1a3a2a] uppercase tracking-widest mb-1.5">
                    Interview Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={interviewDateInput}
                    onChange={e => setInterviewDateInput(e.target.value)}
                    className="w-full rounded-xl border border-[#e8e3da] bg-[#faf8f4] px-3 py-2 text-sm text-[#1a2e1a] font-semibold focus:outline-none focus:ring-2 focus:ring-[#1a3a2a]/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-[#1a3a2a] uppercase tracking-widest mb-1.5">
                    Meet Link
                  </label>
                  <input
                    type="url"
                    value={meetLinkInput}
                    onChange={e => setMeetLinkInput(e.target.value)}
                    placeholder="https://meet.google.com/..."
                    className="w-full rounded-xl border border-[#e8e3da] bg-[#faf8f4] px-3 py-2 text-sm text-[#1a2e1a] font-semibold focus:outline-none focus:ring-2 focus:ring-[#1a3a2a]/20"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-[#1a3a2a] uppercase tracking-widest mb-1.5">
                  Update Email Body
                </label>
                <textarea
                  rows={6}
                  value={draftInput}
                  onChange={e => setDraftInput(e.target.value)}
                  className="w-full rounded-xl border border-[#e8e3da] bg-[#faf8f4] px-4 py-2.5 text-sm text-[#1a2e1a] font-medium leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#1a3a2a]/20 resize-none"
                />
              </div>
              {actionError && (
                <p className="text-xs text-red-600 font-semibold">{actionError}</p>
              )}
              <div className="flex justify-end gap-2 pt-1">
                <GhostBtn onClick={closeModal} disabled={actionLoading}>Cancel</GhostBtn>
                <ActionBtn
                  onClick={() =>
                    void run(
                      () => updateInterviewDetails(applicant.id, {
                        interviewScheduledFor: interviewDateInput ? new Date(interviewDateInput).toISOString() : undefined,
                        interviewMeetLink: meetLinkInput || undefined,
                        emailBody: draftInput,
                      }),
                      `Schedule updated for ${applicant.name}`
                    )
                  }
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </ActionBtn>
              </div>
            </div>
          </Modal>
        );
      })()}

      {modal?.kind === 'applicant-details' && (() => {
        const applicant = applicants.find(a => a.id === modal.applicantId);
        if (!applicant) return null;
        return (
          <Modal title={`Applicant Details — ${applicant.name}`} onClose={closeModal} wide>
            <div className="space-y-5">
              {/* Top row: identity + status info */}
              <div className="rounded-2xl border border-[#e8e3da] bg-[#fdfaf6] p-4">
                <div className="flex items-center gap-3 mb-4">
                  <Avatar name={applicant.name} />
                  <div className="min-w-0">
                    <p className="text-base font-black text-[#1a2e1a]">{applicant.name}</p>
                    <p className="text-sm font-semibold text-[#3a5a4a]">{formatRole(applicant.role)}</p>
                    <p className="text-xs text-[#8a9a8a]">{applicant.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <DetailItem label="Applied Date" value={fmtDate(applicant.appliedDate)} />
                  <DetailItem label="Current Status" value={applicant.status || 'New'} />
                  <DetailItem label="AI Score" value={applicant.screeningScore != null ? String(applicant.screeningScore) : '—'} />
                  <DetailItem label="Interview Schedule" value={applicant.interviewScheduledFor ? fmtDateTime(applicant.interviewScheduledFor) : '—'} />
                </div>
              </div>

              {/* Files + evaluation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-[#e8e3da] bg-[#faf8f4] p-4 space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8a9a8a]">Applicant Files</p>
                  <p className="text-sm text-[#4a6a5a]">Resume, screening output, and pipeline summary.</p>
                  <div className="flex flex-wrap gap-2">
                    <ResumeButton url={applicant.resumePath} />
                    <GhostBtn onClick={() => setModal({ kind: 'screening-results', applicantId: applicant.id })}>
                      View AI Results
                    </GhostBtn>
                  </div>
                </div>
                <div className="rounded-2xl border border-[#e8e3da] bg-[#faf8f4] p-4 space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8a9a8a]">Evaluation</p>
                  <div className="grid grid-cols-2 gap-3">
                    <DetailItem label="Recommendation" value={applicant.hrRecommendation || applicant.mockScreening?.recommendation || '—'} />
                    <DetailItem label="HR Feedback" value={applicant.hrFeedback || '—'} />
                  </div>
                </div>
              </div>

              {/* Application form details */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8a9a8a] mb-3">Application Form Details</p>
                <ApplicantDetailsGrid applicant={applicant} />
              </div>

              <div className="flex justify-end">
                <GhostBtn onClick={closeModal}>Close</GhostBtn>
              </div>
            </div>
          </Modal>
        );
      })()}

      {/* Reject modal */}
      {modal?.kind === 'reject' && (() => {
        const applicant = applicants.find(a => a.id === modal.applicantId);
        if (!applicant) return null;
        return (
          <Modal title={`Reject — ${applicant.name}`} onClose={closeModal}>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-[#1a3a2a] uppercase tracking-widest mb-1.5">
                  Rejection Reason (optional)
                </label>
                <input
                  type="text"
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="Briefly describe the reason..."
                  className="w-full rounded-xl border border-[#e8e3da] bg-[#faf8f4] px-4 py-2.5 text-sm text-[#1a2e1a] font-semibold focus:outline-none focus:ring-2 focus:ring-[#1a3a2a]/20"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-[#1a3a2a] uppercase tracking-widest mb-1.5">
                  Email Body
                </label>
                <textarea
                  rows={5}
                  value={rejectCustomBody}
                  onChange={e => setRejectCustomBody(e.target.value)}
                  className="w-full rounded-xl border border-[#e8e3da] bg-[#faf8f4] px-4 py-2.5 text-sm text-[#1a2e1a] font-medium leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#1a3a2a]/20 resize-none"
                />
              </div>
              {actionError && (
                <p className="text-xs text-red-600 font-semibold">{actionError}</p>
              )}
              <div className="flex justify-end gap-2 pt-1">
                <GhostBtn onClick={closeModal} disabled={actionLoading}>Cancel</GhostBtn>
                <ActionBtn
                  danger
                  onClick={() =>
                    void run(
                      () => rejectApplicantWithEmail(applicant.id, rejectReason, rejectCustomBody),
                      `${applicant.name} has been rejected and removed`
                    )
                  }
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Sending...' : 'Send Rejection & Remove'}
                </ActionBtn>
              </div>
            </div>
          </Modal>
        );
      })()}

      {/* Screening results modal */}
      {modal?.kind === 'screening-results' && (() => {
        const applicant = applicants.find(a => a.id === modal.applicantId);
        if (!applicant) return null;
        const mockData: MockScreeningData | null =
          applicant.mockScreening ??
          (applicant.screeningScore != null
            ? generateMockScreeningData(applicant.id, applicant.role, applicant.screeningScore)
            : null);
        return (
          <Modal title={`Screening Results — ${applicant.name}`} onClose={closeModal} wide>
            <div className="space-y-4">
              <div className="grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)] gap-4">
                <div className="rounded-2xl border border-[#e8e3da] bg-[#faf8f4] p-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={applicant.name} />
                    <div>
                      <p className="text-sm font-black text-[#1a2e1a]">{applicant.name}</p>
                      <p className="text-[11px] font-semibold text-[#3a5a4a]">{formatRole(applicant.role)}</p>
                      <p className="text-[11px] text-[#8a9a8a]">{applicant.email}</p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <DetailItem label="AI Score" value={applicant.screeningScore != null ? `${applicant.screeningScore}` : '—'} />
                    <DetailItem label="Recommendation" value={mockData?.recommendation || '—'} />
                    <DetailItem label="Applied Date" value={fmtDate(applicant.appliedDate)} />
                    <DetailItem label="Resume / CV" value={applicant.resumePath ? 'Available to view' : 'No CV uploaded'} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <ResumeButton url={applicant.resumePath} />
                    <GhostBtn onClick={() => openApplicantDetailsModal(applicant.id)}>
                      View Details
                    </GhostBtn>
                  </div>
                </div>

                {mockData ? (
                  <div className="rounded-2xl border border-[#e8e3da] bg-[#fdfaf6] p-4">
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                  {mockData.questions.map((q, i) => (
                      <div key={i} className="rounded-xl border border-[#ede8e0] bg-white p-4 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-[11px] font-black text-[#1a3a2a] uppercase tracking-widest leading-relaxed flex-1">
                          Q{i + 1}: {q.question}
                        </p>
                        <span className={`shrink-0 inline-block px-2 py-0.5 rounded font-black text-[11px] ${
                          q.score >= 80
                            ? 'text-emerald-700 bg-emerald-50'
                            : q.score >= 60
                              ? 'text-amber-700 bg-amber-50'
                              : 'text-red-700 bg-red-50'
                        }`}>
                          {q.score}/100
                        </span>
                      </div>
                      <p className="text-[12px] text-[#3a5a4a] leading-relaxed border-l-2 border-[#d0e8d8] pl-3 italic">
                        "{q.answer}"
                      </p>
                      <p className="text-[11px] text-[#6a8a7a] leading-relaxed">
                        <span className="font-bold text-[#1a3a2a]">Feedback: </span>{q.feedback}
                      </p>
                      </div>
                  ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-[#ede8e0] bg-[#fdfaf6] px-4 py-8 text-center">
                    <p className="text-sm text-[#8a9a8a] font-medium">No mock screening data available for this applicant.</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-1">
                <GhostBtn onClick={closeModal}>Close</GhostBtn>
              </div>
            </div>
          </Modal>
        );
      })()}

      {/* Talent pool email modal */}
      {modal?.kind === 'talent-pool-email' && (() => {
        const applicant = applicants.find(a => a.id === modal.applicantId);
        if (!applicant) return null;
        const isReEngage = modal.reEngage === true;
        return (
          <Modal
            title={isReEngage ? `Re-engage — ${applicant.name}` : `Move to Talent Pool — ${applicant.name}`}
            onClose={closeModal}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-[#1a3a2a] uppercase tracking-widest mb-1.5">
                  Message to Candidate
                </label>
                <textarea
                  rows={5}
                  value={talentPoolEmail}
                  onChange={e => setTalentPoolEmail(e.target.value)}
                  className="w-full rounded-xl border border-[#e8e3da] bg-[#faf8f4] px-4 py-2.5 text-sm text-[#1a2e1a] font-medium leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#1a3a2a]/20 resize-none"
                />
              </div>
              {actionError && (
                <p className="text-xs text-red-600 font-semibold">{actionError}</p>
              )}
              <div className="flex justify-end gap-2 pt-1">
                <GhostBtn onClick={closeModal} disabled={actionLoading}>Cancel</GhostBtn>
                <ActionBtn
                  onClick={() =>
                    void run(
                      () => moveToTalentPool(applicant.id, talentPoolEmail),
                      isReEngage
                        ? `Re-engagement email sent to ${applicant.name}`
                        : `${applicant.name} moved to talent pool`
                    )
                  }
                  disabled={actionLoading || !talentPoolEmail.trim()}
                >
                  {actionLoading
                    ? 'Sending...'
                    : isReEngage
                      ? 'Send Re-engagement Email'
                      : 'Move to Talent Pool'}
                </ActionBtn>
              </div>
            </div>
          </Modal>
        );
      })()}
    </div>
  );
}
