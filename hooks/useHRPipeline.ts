import { useState, useCallback, useEffect } from 'react';
import { getSupabase } from '../lib/supabaseClient';
import { logAdminAction } from '../lib/adminLogs';

// ── Type definitions ──────────────────────────────────────────────────────────

export type PipelineStatus =
  | 'Screening Sent'
  | 'Screening Completed'
  | 'Interview Scheduled'
  | 'Shortlisted'
  | 'HIRED';

export type HRRecommendation =
  | 'Highly Recommended'
  | 'Recommended'
  | 'Consider'
  | 'Not Recommend';

export type ApplicantFormDetails = {
  phone?: string;
  experience?: string;
  workLocation?: string;
  availability?: string;
  languages?: string;
  skills?: string;
  linkedin?: string;
  portfolio?: string;
  additionalInfo?: string;
  university?: string;
  courseProgram?: string;
  internshipHours?: string;
  coverLetter?: string;
};

export interface HRApplicant {
  id: string;
  name: string;
  email: string;
  role: string;
  appliedDate: string;
  status: PipelineStatus | null;
  previousStatus?: PipelineStatus;
  screeningScore?: number;
  screeningSentAt?: string;
  screeningCompletedAt?: string;
  lastContacted?: string;
  responseDueAt?: string;
  followUpDueAt?: string;
  interviewScheduledFor?: string;
  interviewMeetLink?: string;
  interviewEmailDraft?: string;
  interviewInviteSentAt?: string;
  hrRecommendation?: HRRecommendation;
  hrFeedback?: string;
  hrReviewedAt?: string;
  talentPool: boolean;
  talentPoolMovedAt?: string;
  shortlistedAt?: string;
  notes?: string;
  resumePath?: string;
  applicationDetails: ApplicantFormDetails;
  mockScreening?: MockScreeningData;
  createdAt: string;
  updatedAt: string;
}

function parseNotes(notes: string | undefined): {
  details: ApplicantFormDetails;
  mockScreening?: MockScreeningData;
} {
  if (!notes) return { details: {} };
  try {
    const parsed = JSON.parse(notes) as Record<string, unknown> & { mockScreening?: MockScreeningData };
    return {
      details: {
        phone: typeof parsed.phone === 'string' ? parsed.phone : undefined,
        experience: typeof parsed.experience === 'string' ? parsed.experience : undefined,
        workLocation: typeof parsed.workLocation === 'string' ? parsed.workLocation : undefined,
        availability: typeof parsed.availability === 'string' ? parsed.availability : undefined,
        languages: typeof parsed.languages === 'string' ? parsed.languages : undefined,
        skills: typeof parsed.skills === 'string' ? parsed.skills : undefined,
        linkedin: typeof parsed.linkedin === 'string' ? parsed.linkedin : undefined,
        portfolio: typeof parsed.portfolio === 'string' ? parsed.portfolio : undefined,
        additionalInfo: typeof parsed.additionalInfo === 'string' ? parsed.additionalInfo : undefined,
        university: typeof parsed.university === 'string' ? parsed.university : undefined,
        courseProgram: typeof parsed.courseProgram === 'string' ? parsed.courseProgram : undefined,
        internshipHours: typeof parsed.internshipHours === 'string' ? parsed.internshipHours : undefined,
        coverLetter: typeof parsed.coverLetter === 'string' ? parsed.coverLetter : undefined,
      },
      mockScreening: parsed.mockScreening,
    };
  } catch {
    return { details: {} };
  }
}

// ── DB row → HRApplicant mapper ───────────────────────────────────────────────

function mapRow(row: Record<string, unknown>): HRApplicant {
  const parsedNotes = parseNotes(row.notes as string | undefined);
  return {
    id: row.id as string,
    name: row.name as string,
    email: row.email as string,
    role: row.role as string,
    appliedDate: (row.applied_date as string) || (row.created_at as string),
    status: (row.status as PipelineStatus | null) ?? null,
    previousStatus: row.previous_status as PipelineStatus | undefined,
    screeningScore: row.screening_score as number | undefined,
    screeningSentAt: row.screening_sent_at as string | undefined,
    screeningCompletedAt: row.screening_completed_at as string | undefined,
    lastContacted: row.last_contacted as string | undefined,
    responseDueAt: row.response_due_at as string | undefined,
    followUpDueAt: row.follow_up_due_at as string | undefined,
    interviewScheduledFor: row.interview_scheduled_for as string | undefined,
    interviewMeetLink: row.interview_meet_link as string | undefined,
    interviewEmailDraft: row.interview_email_draft as string | undefined,
    interviewInviteSentAt: row.interview_invite_sent_at as string | undefined,
    hrRecommendation: row.hr_recommendation as HRRecommendation | undefined,
    hrFeedback: row.hr_feedback as string | undefined,
    hrReviewedAt: row.hr_reviewed_at as string | undefined,
    talentPool: (row.talent_pool as boolean) || false,
    talentPoolMovedAt: row.talent_pool_moved_at as string | undefined,
    shortlistedAt: row.shortlisted_at as string | undefined,
    notes: row.notes as string | undefined,
    resumePath: row.resume_path as string | undefined,
    applicationDetails: parsedNotes.details,
    mockScreening: parsedNotes.mockScreening,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ── Helper functions ──────────────────────────────────────────────────────────

// Adds N calendar days from now
function addDays(n: number): string {
  return new Date(Date.now() + n * 86400000).toISOString();
}

const ACRONYMS = new Set(['ai', 'hr', 'it', 'qa', 'ui', 'ux', 'nlp', 'ml']);

function fmtRole(role: string): string {
  // Strip trailing 6-char random suffix added during position creation (e.g. "ai-data-annotator-btfzkj")
  const cleaned = role.replace(/-[a-z0-9]{6}$/, '');
  return cleaned.split(/[-_\s]+/).filter(Boolean)
    .map(p => ACRONYMS.has(p.toLowerCase()) ? p.toUpperCase() : p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}

function fmtName(name: string): string {
  return name.replace(/\S+/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

function todayStr(): string {
  return new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function buildHrEmail(opts: {
  templateKey: string;
  name: string;
  role: string;
  customBody?: string;
  interviewDate?: string;
  meetLink?: string;
  reason?: string;
}): { badge: string; subject: string; body: string; meta: { label: string; value: string; color?: string }[] } {
  const role = fmtRole(opts.role);
  const reason = opts.reason || 'We selected another candidate whose profile is more aligned with the current role requirements.';

  switch (opts.templateKey) {
    case 'screening-link':
      return {
        badge: 'Pre-Screening Assessment',
        subject: `Next Step: Pre-Assessment for ${role} at Lifewood`,
        body: `Thank you for reaching out to Lifewood regarding the ${role} position.\n\nWe have reviewed your application and would like to invite you to complete the AI screening assessment as the next step in the process.\n\nPlease complete the assessment at your earliest convenience using the link below. It should take approximately 15–20 minutes.\n\nhttps://lifewoodph-ai-interviewer.vercel.app/\n\nPlease complete this within 2 business days to keep your application active.`,
        meta: [{ label: 'Position', value: role }, { label: 'Date Sent', value: todayStr() }],
      };
    case 'screening-reject':
      return {
        badge: 'Application Update',
        subject: `Your Application for ${role} at Lifewood`,
        body: `Thank you for reaching out to Lifewood regarding the ${role} position and for the time you invested in your application.\n\nAfter careful consideration, we regret to inform you that we will not be moving forward with your application at this time.\n\n${reason}\n\nWe appreciate the effort you put into your application and wish you all the best in your future endeavors.`,
        meta: [{ label: 'Position', value: role }, { label: 'Date', value: todayStr() }],
      };
    case 'screening-follow-up':
      return {
        badge: 'Screening Reminder',
        subject: `Reminder: Complete Your AI Screening — ${role} at Lifewood`,
        body: `This is a friendly reminder that you have a pending AI screening assessment for the ${role} position at Lifewood.\n\nPlease complete the assessment as soon as possible using the link below.\n\nhttps://lifewoodph-ai-interviewer.vercel.app/\n\nIf we do not hear back, your application may be marked as inactive. Please reach out if you have any questions.`,
        meta: [{ label: 'Position', value: role }, { label: 'Date', value: todayStr() }],
      };
    case 'interview-schedule': {
      const body = opts.customBody ||
        `Congratulations on passing the initial screening! We would like to set an interview with you. Please review the date and details below.\n\nPlease note that if you do not join within 10 minutes of the scheduled time, we will consider your application as inactive. If you need to reschedule, please contact us in advance.`;
      return {
        badge: 'Interview Invitation',
        subject: `Interview Scheduled — ${role} at Lifewood`,
        body,
        meta: [
          { label: 'Position', value: role },
          { label: 'Date & Time', value: opts.interviewDate || 'To be confirmed' },
          { label: 'Meeting Link', value: opts.meetLink || '—' },
        ],
      };
    }
    case 'talent-pool': {
      const body = opts.customBody ||
        `Thank you for your interest in Lifewood. While we don't have an immediate opening that matches your profile right now, we'd like to keep you in our talent pool for future opportunities.`;
      return {
        badge: 'Talent Pool',
        subject: `Update on Your Lifewood Application — ${role}`,
        body,
        meta: [{ label: 'Position', value: role }, { label: 'Date', value: todayStr() }],
      };
    }
    case 'inactive':
      return {
        badge: 'Application Status',
        subject: `Your Lifewood Application Has Been Marked Inactive — ${role}`,
        body: `We noticed we haven't heard back from you regarding your application for the ${role} position at Lifewood.\n\nYour application has been marked as inactive due to no response within the allotted timeframe.\n\nIf you remain interested in opportunities at Lifewood, we welcome you to reapply in the future. Thank you for your interest, and we wish you the best.`,
        meta: [{ label: 'Position', value: role }, { label: 'Date', value: todayStr() }],
      };
    case 'hired':
      return {
        badge: 'Offer Extended',
        subject: `Congratulations! You've Been Hired — ${role} at Lifewood`,
        body: `We are absolutely thrilled to extend this offer to you! After a thorough evaluation, you have been selected for the ${role} position at Lifewood.\n\nWe have discussed the details of your role and are confident that you will be a tremendous addition to our team.\n\nOur HR team will be reaching out shortly with your onboarding details and next steps.\n\nWelcome to the Lifewood family! We are excited to have you on board.`,
        meta: [{ label: 'Position', value: role }, { label: 'Date', value: todayStr() }],
      };
    default:
      return { badge: 'HR Update', subject: `Update from Lifewood HR`, body: opts.customBody || '', meta: [] };
  }
}

function notifMessage(templateKey: string, role: string): string {
  switch (templateKey) {
    case 'screening-link':    return `Your application for the ${role} position has moved forward. Please check your email for the AI screening link.`;
    case 'screening-reject':  return `An update regarding your application for the ${role} position has been sent to your email.`;
    case 'interview-schedule':return `Your interview for the ${role} position has been scheduled. Please check your email for details.`;
    case 'talent-pool':       return `You have been added to the Lifewood talent pool for the ${role} role. Check your email for details.`;
    case 'inactive':          return `Your application for the ${role} position has been marked inactive. Check your email for details.`;
    case 'hired':             return `Congratulations! You have been selected for the ${role} position at Lifewood. Check your email for your offer details.`;
    default:                  return `You have a new update from Lifewood HR regarding your application. Check your email for details.`;
  }
}

async function sendEmail(payload: {
  templateKey: string;
  to: string;
  name: string;
  role: string;
  customBody?: string;
  interviewDate?: string;
  meetLink?: string;
  reason?: string;
}): Promise<void> {
  const supabase = getSupabase();
  const { badge, subject, body, meta } = buildHrEmail(payload);
  const { error } = await supabase.functions.invoke('send-email', {
    body: { to: payload.to, name: fmtName(payload.name), subject, body, badge, meta },
  });
  if (error) throw new Error(`Email failed: ${error.message}`);

  const role = fmtRole(payload.role);
  await supabase.from('notifications').insert({
    user_email: payload.to,
    message: notifMessage(payload.templateKey, role),
    read: false,
  });
}

// ── Mock screening data ────────────────────────────────────────────────────────

interface MockQuestion {
  question: string;
  answer: string;
  score: number;
  feedback: string;
}

export interface MockScreeningData {
  generatedAt: string;
  totalScore: number;
  recommendation: HRRecommendation;
  questions: MockQuestion[];
}

const SCREENING_QUESTIONS = [
  {
    q: 'Describe your relevant experience for this role.',
    strongA: 'I have several years of hands-on experience directly relevant to this position. Throughout my career I have led projects end-to-end, collaborated across departments, and consistently delivered results above expectations. I am confident my background aligns well with what this role requires.',
    weakA: 'I have some background in related areas and I am actively working to build my skills. While I may not have extensive experience yet, I am a fast learner and excited to grow in this role.',
    strongFb: 'Clear, confident response with evidence of relevant experience and measurable outcomes.',
    weakFb: 'Response lacked specificity; candidate is still building foundational experience.',
  },
  {
    q: 'How do you handle working under pressure or tight deadlines?',
    strongA: 'I thrive under pressure. My approach is to immediately break the task into smaller milestones, prioritize the most critical deliverables, and communicate proactively with stakeholders if timelines need to shift. In my previous role, I managed three concurrent deadlines simultaneously and delivered all on time.',
    weakA: 'I try my best to stay calm and focus on completing things one at a time. Sometimes deadlines can be stressful but I do my best to get things done.',
    strongFb: 'Demonstrated clear strategy for managing pressure with a concrete example.',
    weakFb: 'Generic response without specific strategies or examples; limited insight into performance under stress.',
  },
  {
    q: 'What motivates you to apply for this position at Lifewood?',
    strongA: "Lifewood's mission in AI-powered data solutions resonates deeply with my professional interests. I am particularly drawn to the company's focus on meaningful, data-driven impact. I believe this role offers the perfect intersection of my skills and the kind of work I am most passionate about.",
    weakA: 'I am looking for a new opportunity and Lifewood seemed like a good company. The role also looks interesting to me.',
    strongFb: 'Well-articulated alignment between personal goals and company mission; shows genuine research and enthusiasm.',
    weakFb: 'Vague motivation; does not demonstrate company research or genuine passion for the role.',
  },
  {
    q: 'Tell us about a professional challenge you faced and how you resolved it.',
    strongA: 'In my previous role, our team encountered a critical system failure two days before a major client presentation. I coordinated an emergency response, divided tasks by expertise, and we resolved the issue with 12 hours to spare. The client presentation was a success.',
    weakA: "I once had a difficult project where things weren't going well. I talked to my team and we managed to figure it out eventually. It was challenging but we got through it.",
    strongFb: 'Strong STAR-format response demonstrating leadership, problem-solving, and resilience.',
    weakFb: 'Lacked structure and specifics; difficult to assess the actual impact or role in resolution.',
  },
  {
    q: 'Where do you see yourself professionally in the next 3–5 years?',
    strongA: 'I see myself growing into a leadership position where I can mentor others while continuing to develop technical depth. I am committed to remaining current with industry trends and contributing to the growth of the organization I join.',
    weakA: 'I hope to keep improving and maybe get promoted. I am not entirely sure yet but I will see where things go.',
    strongFb: 'Clear, ambitious yet realistic career vision; demonstrates commitment and forward-thinking orientation.',
    weakFb: 'Unclear career direction; suggests limited professional self-awareness or long-term planning.',
  },
];

export function generateMockScreeningData(applicantId: string, _role: string, overallScore: number): MockScreeningData {
  // Seeded PRNG so the same applicant always gets the same mock data
  let seed = 0;
  for (let i = 0; i < applicantId.length; i++) {
    seed = ((seed * 31) + applicantId.charCodeAt(i)) & 0x7fffffff;
  }
  function nextInt(min: number, max: number): number {
    seed = ((seed * 1103515245) + 12345) & 0x7fffffff;
    return min + (seed % (max - min + 1));
  }

  const isStrong = overallScore >= 70;
  const questions: MockQuestion[] = SCREENING_QUESTIONS.map(q => {
    const variation = nextInt(-15, 15);
    const qScore = Math.max(0, Math.min(100, overallScore + variation));
    return {
      question: q.q,
      answer: isStrong ? q.strongA : q.weakA,
      score: qScore,
      feedback: isStrong ? q.strongFb : q.weakFb,
    };
  });

  const recommendation: MockScreeningData['recommendation'] =
    overallScore >= 85 ? 'Highly Recommended' :
    overallScore >= 74 ? 'Recommended' :
    overallScore >= 60 ? 'Consider' :
    'Not Recommend';

  return { generatedAt: new Date().toISOString(), totalScore: overallScore, recommendation, questions };
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useHRPipeline() {
  const [applicants, setApplicants] = useState<HRApplicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<string | null>(null); // applicant id being mutated

  // ── Fetch all ──────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('hr_applicants')
        .select('*')
        .eq('is_deleted', false)
        .order('applied_date', { ascending: false });
      if (error) throw error;
      setApplicants((data || []).map(mapRow));
    } catch (err) {
      console.error('[useHRPipeline] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchAll(); }, [fetchAll]);

  // Realtime subscription
  useEffect(() => {
    const supabase = getSupabase();
    const channel = supabase
      .channel('hr_applicants_pipeline')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hr_applicants' }, () => {
        void fetchAll();
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [fetchAll]);

  // 10-second polling fallback
  useEffect(() => {
    const t = setInterval(() => { void fetchAll(); }, 10000);
    return () => clearInterval(t);
  }, [fetchAll]);

  // ── Optimistic update helper ────────────────────────────────────────────────
  // Updates local state → patches DB → sends email (if emailFn provided)
  // On DB error: reverts local state and rethrows
  const mutate = useCallback(async (
    id: string,
    localPatch: Partial<HRApplicant>,
    dbPatch: Record<string, unknown>,
    emailFn?: () => Promise<void>
  ) => {
    const snapshot = applicants.find(a => a.id === id);
    if (!snapshot) throw new Error('Applicant not found');

    setApplicants(prev => prev.map(a => a.id === id ? { ...a, ...localPatch } : a));
    setWorking(id);

    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('hr_applicants')
        .update(dbPatch)
        .eq('id', id);
      if (error) throw error;
      if (emailFn) await emailFn();
    } catch (err) {
      setApplicants(prev => prev.map(a => a.id === id ? snapshot : a));
      throw err;
    } finally {
      setWorking(null);
    }
  }, [applicants]);

  // ── Delete helper (for reject + inactive) ──────────────────────────────────
  const deleteApplicant = useCallback(async (id: string) => {
    setApplicants(prev => prev.filter(a => a.id !== id));
    setWorking(id);
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from('hr_applicants').update({ is_deleted: true, deleted_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    } catch (err) {
      void fetchAll(); // re-fetch on error to restore state
      throw err;
    } finally {
      setWorking(null);
    }
  }, [fetchAll]);

  // ── 1. approveRecentApplicant ─────────────────────────────────────────────
  const approveRecentApplicant = useCallback(async (id: string) => {
    const a = applicants.find(x => x.id === id);
    if (!a) return;
    const now = new Date().toISOString();
    const responseDueAt = addDays(2);
    await mutate(
      id,
      { status: 'Screening Sent', previousStatus: a.status ?? undefined, screeningSentAt: now, lastContacted: now, responseDueAt },
      { status: 'Screening Sent', previous_status: a.status, screening_sent_at: now, last_contacted: now, response_due_at: responseDueAt },
      () => sendEmail({ templateKey: 'screening-link', to: a.email, name: a.name, role: a.role })
    );
    void logAdminAction('applicant_stage_changed', 'hr_applicant', fmtName(a.name), `Moved to: Screening Sent — ${fmtRole(a.role)}`);
  }, [applicants, mutate]);

  // ── 2. completeScreening ──────────────────────────────────────────────────
  // Admin manually triggers after applicant finishes pre-assessment.
  // Generates and stores mock screening Q&A in the notes field.
  const completeScreening = useCallback(async (id: string) => {
    const a = applicants.find(x => x.id === id);
    if (!a) return;
    const now = new Date().toISOString();

    // Auto-generate score from applicant ID (seeded, range 62–91, consistent per applicant)
    let seed = 0;
    for (let i = 0; i < a.id.length; i++) {
      seed = ((seed * 31) + a.id.charCodeAt(i)) & 0x7fffffff;
    }
    const screeningScore = 62 + (seed % 30);

    // Generate mock Q&A that simulates the candidate's screening responses
    const mockData = generateMockScreeningData(a.id, a.role, screeningScore);

    // Merge with any existing notes
    let existing: Record<string, unknown> = {};
    try { if (a.notes) existing = JSON.parse(a.notes) as Record<string, unknown>; } catch { /* ignore */ }
    const notesJson = JSON.stringify({ ...existing, mockScreening: mockData });

    await mutate(
      id,
      { status: 'Screening Completed', previousStatus: 'Screening Sent', screeningScore, screeningCompletedAt: now, responseDueAt: undefined, followUpDueAt: undefined, notes: notesJson },
      { status: 'Screening Completed', previous_status: 'Screening Sent', screening_score: screeningScore, screening_completed_at: now, response_due_at: null, follow_up_due_at: null, notes: notesJson }
    );
    void logAdminAction('applicant_screening_completed', 'hr_applicant', fmtName(a.name), `Score: ${screeningScore} — ${fmtRole(a.role)}`);
  }, [applicants, mutate]);

  // ── 3. scheduleInterview ──────────────────────────────────────────────────
  // Sets Interview Scheduled status AND sends invite email in one action.
  const scheduleInterview = useCallback(async (
    id: string,
    opts: { draft: string; scheduledFor: string; meetLink: string }
  ) => {
    const a = applicants.find(x => x.id === id);
    if (!a) return;
    const now = new Date().toISOString();
    const interviewDateStr = new Date(opts.scheduledFor).toLocaleString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
    const meetLink =
      opts.meetLink ||
      (import.meta.env.VITE_DEFAULT_MEET_LINK as string | undefined) ||
      'https://meet.google.com/lifewood-hr';
    await mutate(
      id,
      {
        status: 'Interview Scheduled',
        previousStatus: 'Screening Completed',
        interviewScheduledFor: opts.scheduledFor,
        interviewMeetLink: meetLink,
        interviewEmailDraft: opts.draft,
        interviewInviteSentAt: now,
        lastContacted: now,
      },
      {
        status: 'Interview Scheduled',
        previous_status: 'Screening Completed',
        interview_scheduled_for: opts.scheduledFor,
        interview_meet_link: meetLink,
        interview_email_draft: opts.draft,
        interview_invite_sent_at: now,
        last_contacted: now,
      },
      () => sendEmail({
        templateKey: 'interview-schedule',
        to: a.email,
        name: a.name,
        role: a.role,
        customBody: opts.draft,
        interviewDate: interviewDateStr,
        meetLink,
      })
    );
    void logAdminAction('applicant_interview_scheduled', 'hr_applicant', fmtName(a.name), `Interview: ${interviewDateStr} — ${fmtRole(a.role)}`);
  }, [applicants, mutate]);

  // ── 4. markInterviewDone ──────────────────────────────────────────────────
  // HR marks that the interview has taken place → moves to Interview Results.
  const markInterviewDone = useCallback(async (id: string) => {
    const a = applicants.find(x => x.id === id);
    const now = new Date().toISOString();
    await mutate(id, { hrReviewedAt: now }, { hr_reviewed_at: now });
    if (a) void logAdminAction('applicant_interview_done', 'hr_applicant', fmtName(a.name), `Interview marked complete — ${fmtRole(a.role)}`);
  }, [applicants, mutate]);

  // ── 5. shortlistApplicant ─────────────────────────────────────────────────
  const shortlistApplicant = useCallback(async (id: string, hrRecommendation: HRRecommendation, hrFeedback: string) => {
    const a = applicants.find(x => x.id === id);
    const now = new Date().toISOString();
    await mutate(
      id,
      { status: 'Shortlisted', previousStatus: 'Interview Scheduled', hrRecommendation, hrFeedback, shortlistedAt: now, hrReviewedAt: now },
      { status: 'Shortlisted', previous_status: 'Interview Scheduled', hr_recommendation: hrRecommendation, hr_feedback: hrFeedback, shortlisted_at: now, hr_reviewed_at: now }
    );
    if (a) void logAdminAction('applicant_shortlisted', 'hr_applicant', fmtName(a.name), `${hrRecommendation} — ${fmtRole(a.role)}`);
  }, [applicants, mutate]);

  // ── 6. hireApplicant ──────────────────────────────────────────────────────
  const hireApplicant = useCallback(async (id: string) => {
    const a = applicants.find(x => x.id === id);
    if (!a) return;
    const now = new Date().toISOString();
    await mutate(
      id,
      { status: 'HIRED', previousStatus: 'Shortlisted', lastContacted: now },
      { status: 'HIRED', previous_status: 'Shortlisted', last_contacted: now },
      () => sendEmail({ templateKey: 'hired', to: a.email, name: a.name, role: a.role })
    );
    void logAdminAction('applicant_hired', 'hr_applicant', fmtName(a.name), `Hired for: ${fmtRole(a.role)}`);
  }, [applicants, mutate]);

  // ── 7. moveToTalentPool ───────────────────────────────────────────────────
  const moveToTalentPool = useCallback(async (id: string, customBody?: string) => {
    const a = applicants.find(x => x.id === id);
    if (!a) return;
    const now = new Date().toISOString();
    const defaultBody = "Thank you for your interest in Lifewood. While we don't have an immediate opening that matches your profile right now, we'd like to keep you in our talent pool for future opportunities. We'll be in touch when a suitable role becomes available.";
    await mutate(
      id,
      { talentPool: true, talentPoolMovedAt: now },
      { talent_pool: true, talent_pool_moved_at: now },
      () => sendEmail({ templateKey: 'talent-pool', to: a.email, name: a.name, role: a.role, customBody: customBody ?? defaultBody })
    );
    void logAdminAction('applicant_talent_pool', 'hr_applicant', fmtName(a.name), `Added to talent pool — ${fmtRole(a.role)}`);
  }, [applicants, mutate]);

  // ── 8. rejectApplicant ────────────────────────────────────────────────────
  const rejectApplicant = useCallback(async (id: string) => {
    const a = applicants.find(x => x.id === id);
    if (!a) return;
    await sendEmail({ templateKey: 'screening-reject', to: a.email, name: a.name, role: a.role });
    void logAdminAction('applicant_rejected', 'hr_applicant', fmtName(a.name), `Rejected for: ${fmtRole(a.role)}`);
    await deleteApplicant(id);
  }, [applicants, deleteApplicant]);

  // ── 9. rejectApplicantWithEmail ───────────────────────────────────────────
  const rejectApplicantWithEmail = useCallback(async (id: string, reason: string, customBody: string) => {
    const a = applicants.find(x => x.id === id);
    if (!a) return;
    const resolvedReason = reason.trim() || 'We selected another candidate whose profile is more aligned with the current role requirements.';
    const body = customBody.replace('[reason here]', resolvedReason);
    await sendEmail({
      templateKey: 'screening-reject',
      to: a.email,
      name: a.name,
      role: a.role,
      reason: resolvedReason,
      customBody: body,
    });
    void logAdminAction('applicant_rejected', 'hr_applicant', fmtName(a.name), `Rejected for: ${fmtRole(a.role)}`);
    await deleteApplicant(id);
  }, [applicants, deleteApplicant]);

  // ── 10. revertApplicantStatus ─────────────────────────────────────────────
  const revertApplicantStatus = useCallback(async (id: string) => {
    const a = applicants.find(x => x.id === id);
    if (!a || !a.previousStatus) return;
    await mutate(
      id,
      { status: a.previousStatus, previousStatus: undefined },
      { status: a.previousStatus, previous_status: null }
    );
    void logAdminAction('applicant_status_reverted', 'hr_applicant', fmtName(a.name), `Reverted to: ${a.previousStatus} — ${fmtRole(a.role)}`);
  }, [applicants, mutate]);

  // ── Update interview draft (local helper used by UI) ──────────────────────
  const updateInterviewDraft = useCallback(async (id: string, draft: string) => {
    await mutate(id, { interviewEmailDraft: draft }, { interview_email_draft: draft });
  }, [mutate]);

  // ── Update interview details ──────────────────────────────────────────────
  const updateInterviewDetails = useCallback(async (
    id: string,
    patch: { interviewScheduledFor?: string; interviewMeetLink?: string; emailBody?: string }
  ) => {
    const applicant = applicants.find(x => x.id === id);
    if (!applicant) return;
    const dbPatch: Record<string, unknown> = {};
    if (patch.interviewScheduledFor !== undefined) dbPatch.interview_scheduled_for = patch.interviewScheduledFor;
    if (patch.interviewMeetLink !== undefined) dbPatch.interview_meet_link = patch.interviewMeetLink;
    if (patch.emailBody !== undefined) dbPatch.interview_email_draft = patch.emailBody;

    const localPatch: Partial<HRApplicant> = {
      interviewScheduledFor: patch.interviewScheduledFor,
      interviewMeetLink: patch.interviewMeetLink,
      interviewEmailDraft: patch.emailBody ?? applicant.interviewEmailDraft,
    };

    const interviewDateStr = new Date(
      patch.interviewScheduledFor || applicant.interviewScheduledFor || new Date().toISOString()
    ).toLocaleString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
    const meetLink =
      patch.interviewMeetLink ||
      applicant.interviewMeetLink ||
      (import.meta.env.VITE_DEFAULT_MEET_LINK as string | undefined) ||
      'https://meet.google.com/lifewood-hr';

    await mutate(
      id,
      localPatch,
      dbPatch,
      () => sendEmail({
        templateKey: 'interview-schedule',
        to: applicant.email,
        name: applicant.name,
        role: applicant.role,
        customBody: patch.emailBody || applicant.interviewEmailDraft || 'Your interview schedule has been updated. Please review the details below.',
        interviewDate: interviewDateStr,
        meetLink,
      })
    );
  }, [applicants, mutate]);

  return {
    applicants,
    loading,
    working,
    refresh: fetchAll,
    approveRecentApplicant,
    completeScreening,
    scheduleInterview,
    markInterviewDone,
    shortlistApplicant,
    hireApplicant,
    moveToTalentPool,
    rejectApplicant,
    rejectApplicantWithEmail,
    revertApplicantStatus,
    updateInterviewDetails,
  };
}
