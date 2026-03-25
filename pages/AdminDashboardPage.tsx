import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useProfile } from '../hooks/useProfile';
import { useToast } from '../components/ToastProvider';
import { deleteInquiry, getInquiryStats, getAllInquiries, Inquiry, InquiryStats, updateInquiryStatus } from '../lib/admin';
import HRPipeline from '../components/admin/HRPipeline';
import AdminLogsPanel from '../components/admin/AdminLogsPanel';
import { exportInquiriesWorkbook } from '../lib/adminExport';
import { getSupabase } from '../lib/supabaseClient';
import { useConfirm } from '../components/ConfirmModal';
import { logAdminAction, fetchAllAdminLogs } from '../lib/adminLogs';

let cachedDashboardStats: InquiryStats | null = null;
let cachedDashboardInquiries: Inquiry[] | null = null;

const STATUS_OPTIONS = ['new', 'contacted', 'closed'] as const;
type Status = typeof STATUS_OPTIONS[number];
type NavSection = 'overview' | 'contacts' | 'applicants' | 'projects' | 'posts' | 'hiring' | 'logs';
type AdminNotif = {
  id: string;
  type: string;
  message: string;
  link: string | null;
  read: boolean;
  created_at: string;
};

type InterviewReminder = {
  id: string;
  name: string;
  role: string;
  interview_scheduled_for: string | null;
};

function getInitials(name: string) {
  if (!name) return '?';
  return name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0].toUpperCase()).join('');
}

const AVATAR_COLORS = [
  'bg-emerald-700', 'bg-teal-700', 'bg-cyan-700', 'bg-blue-700',
  'bg-indigo-700', 'bg-violet-700', 'bg-rose-700', 'bg-amber-700',
];
function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function notifIcon(type: string) {
  if (type.startsWith('new_inquiry_contact')) return '✉️';
  if (type.startsWith('new_inquiry_career')) return '👤';
  if (type.startsWith('new_inquiry_project')) return '📋';
  if (type === 'new_reaction') return '❤️';
  if (type === 'new_comment') return '💬';
  return '🔔';
}

const UPPERCASE_WORDS = new Set(['ai', 'nlp', 'hr', 'it', 'qa', 'ui', 'ux']);

function formatPositionLabel(position: string | null) {
  if (!position) return '—';
  return position
    .split(/[-_]/g)
    .filter(Boolean)
    .map(part => UPPERCASE_WORDS.has(part.toLowerCase()) ? part.toUpperCase() : part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function capitalizeFirst(value: string | null | undefined): string | null | undefined {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}
function capitalizeName(name: string): string {
  return name.replace(/\S+/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}
function hasLongText(value: string | null | undefined) {
  return (value || '').trim().length > 90;
}

const DASHBOARD_TABLE_WIDTHS = {
  checkbox: '44px',
  inquirer: '360px',
  type: '160px',
  message: '280px',
  details: '170px',
  appliedDate: '130px',
  status: '160px',
  action: '150px',
} as const;

function projectDetails(inquiry: Inquiry) {
  return [
    { label: 'Full Name', value: inquiry.name },
    { label: 'Email', value: inquiry.email },
    { label: 'Organization', value: inquiry.organization },
    { label: 'Service of Interest', value: inquiry.service },
    { label: 'Preferred Engagement Model', value: inquiry.engagement_model },
    { label: 'Data Volume / Scale', value: inquiry.data_volume },
    { label: 'Current Tech Stack / Tools', value: inquiry.tech_stack },
    { label: 'Expected Outcome', value: inquiry.message },
    { label: 'Success Criteria', value: inquiry.success_criteria },
  ].filter(item => item.value && String(item.value).trim());
}

function applicantDetails(inquiry: Inquiry) {
  return [
    { label: 'First Name', value: inquiry.first_name },
    { label: 'Last Name', value: inquiry.last_name },
    { label: 'Phone', value: inquiry.phone },
    { label: 'Email', value: inquiry.email },
    { label: 'Country', value: inquiry.country },
    { label: 'City', value: inquiry.city },
    { label: 'Experience', value: capitalizeFirst(inquiry.experience) },
    { label: 'Preferred Work Location', value: capitalizeFirst(inquiry.work_location) },
    { label: 'Availability', value: inquiry.availability },
    { label: 'Languages', value: inquiry.languages },
    { label: 'Skills', value: inquiry.skills },
    { label: 'LinkedIn', value: inquiry.linkedin },
    { label: 'Portfolio', value: inquiry.portfolio },
    { label: 'University', value: inquiry.university },
    { label: 'Course / Program', value: inquiry.course_program },
    { label: 'Internship Hours', value: inquiry.internship_hours },
    { label: 'Cover Letter', value: inquiry.cover_letter },
    { label: 'Additional Info', value: inquiry.additional_info },
  ].filter(item => item.value && String(item.value).trim());
}

function ContextBadge({ context }: { context: string }) {
  if (context === 'contact') return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#e8f3eb] text-[#1d6a46] border border-[#b9d8c3] uppercase">Inquiry</span>
  );
  if (context === 'career') return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#fff4d8] text-[#a86d00] border border-[#f2d48d] uppercase">Application</span>
  );
  if (context === 'project') return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#efe7dc] text-[#6d5640] border border-[#deceb8] uppercase">Project Client</span>
  );
  return null;
}

const NAV_ITEMS: { key: NavSection; label: string; icon: React.ReactNode; href?: string; superAdminOnly?: boolean }[] = [
  {
    key: 'overview',
    label: 'Overview',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    key: 'contacts',
    label: 'Contacts',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
      </svg>
    ),
  },
  {
    key: 'projects',
    label: 'Projects',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    ),
  },
  {
    key: 'applicants',
    label: 'Applicants',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
      </svg>
    ),
  },
  {
    key: 'posts',
    label: 'Posts',
    href: '/admin/posts',
    superAdminOnly: true,
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path d="M5 4h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"/>
        <path d="M8 8h8M8 12h8M8 16h5"/>
      </svg>
    ),
  },
  {
    key: 'hiring',
    label: 'Hiring',
    href: '/admin/hiring',
    superAdminOnly: true,
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path d="M4 7h16M7 3v8M17 3v8M5 11h14a2 2 0 012 2v5a3 3 0 01-3 3H6a3 3 0 01-3-3v-5a2 2 0 012-2z" />
      </svg>
    ),
  },
  {
    key: 'logs',
    label: 'Logs',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
      </svg>
    ),
  },
];

const STAT_CARDS = (stats: InquiryStats | null) => [
  {
    label: 'Total Inquiries',
    value: stats?.total || 0,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
      </svg>
    ),
  },
  {
    label: 'Contact Messages',
    value: stats?.contacts || 0,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
      </svg>
    ),
  },
  {
    label: 'Applicants',
    value: stats?.applicants || 0,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
      </svg>
    ),
  },
  {
    label: 'Project Requests',
    value: stats?.projects || 0,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"/>
      </svg>
    ),
  },
  {
    label: 'New This Week',
    value: stats?.newThisWeek || 0,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
      </svg>
    ),
  },
  {
    label: 'Closed',
    value: stats?.closed || 0,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
      </svg>
    ),
  },
];

function getEmailTemplate(inquiry: Inquiry): string {
  if (inquiry.context === 'career') {
    return `Thank you for submitting your application${inquiry.position ? ` for the ${formatPositionLabel(inquiry.position)} role` : ''} at Lifewood.

Please complete the initial assessment using this link:
https://lifewoodph-ai-interviewer.vercel.app/

After that, we will contact you in the following days regarding an interview.

We appreciate your interest in Lifewood and look forward to speaking with you soon.

Sincerely,
The Lifewood Team`;
  }
  if (inquiry.context === 'project') {
    return `Thank you for reaching out to Lifewood${inquiry.organization ? ` on behalf of ${inquiry.organization}` : ''}${inquiry.service ? ` regarding ${inquiry.service}` : ''}.

We have discussed your project scope, and we are confident that we can achieve it successfully.

We can further discuss this in a virtual call. Feel free to reply to this email with your timezone, available time, and the link you would like us to use for the meeting.

We look forward to speaking with you soon.`;
  }
  // contact
  return `We have assessed your inquiry and [admin can freely edit this part].

If you have any follow-up details to share, feel free to reply directly to this email.

Sincerely,
The Lifewood Team`;
}

export default function AdminDashboardPage() {
  const { profile, isSuperAdmin, displayName } = useProfile();
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState<NavSection>('overview');
  const [stats, setStats] = useState<InquiryStats | null>(cachedDashboardStats);
  const [inquiries, setInquiries] = useState<Inquiry[]>(cachedDashboardInquiries || []);
  const [loading, setLoading] = useState(!(cachedDashboardStats && cachedDashboardInquiries));
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [selectedInquiryIds, setSelectedInquiryIds] = useState<string[]>([]);
  const [respondTarget, setRespondTarget] = useState<Inquiry | null>(null);
  const [detailsTarget, setDetailsTarget] = useState<Inquiry | null>(null);
  const [projectDetailsTarget, setProjectDetailsTarget] = useState<Inquiry | null>(null);
  const [expandedMessageIds, setExpandedMessageIds] = useState<string[]>([]);
  const [overviewFilter, setOverviewFilter] = useState<'all' | 'contact' | 'career' | 'project'>('all');
  const [emailBody, setEmailBody] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [adminNotifs, setAdminNotifs] = useState<AdminNotif[]>([]);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [todayReminders, setTodayReminders] = useState<InterviewReminder[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const { confirm, modal: confirmModal } = useConfirm();
  const notifRef = React.useRef<HTMLDivElement | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadTodayReminders = async () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const supabase = getSupabase();
      const { data } = await supabase
        .from('hr_applicants')
        .select('id, name, role, interview_scheduled_for')
        .eq('is_deleted', false)
        .eq('status', 'Interview Scheduled')
        .gte('interview_scheduled_for', start.toISOString())
        .lt('interview_scheduled_for', end.toISOString())
        .order('interview_scheduled_for', { ascending: true });

      if (!cancelled) {
        setTodayReminders((data as InterviewReminder[] | null) || []);
      }
    };

    void loadTodayReminders();
    const timer = window.setInterval(() => void loadTodayReminders(), 60000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const handleLogout = async () => {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    navigate('/login', { replace: true });
  };

  const markAllRead = async () => {
    const supabase = getSupabase();
    await supabase.from('admin_notifications').update({ read: true }).eq('read', false);
    setAdminNotifs(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markOneRead = async (id: string) => {
    const supabase = getSupabase();
    await supabase.from('admin_notifications').update({ read: true }).eq('id', id);
    setAdminNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, inquiriesData] = await Promise.all([
        getInquiryStats(),
        getAllInquiries(),
      ]);
      cachedDashboardStats = statsData;
      cachedDashboardInquiries = inquiriesData;
      setStats(statsData);
      setInquiries(inquiriesData);
    } catch (error) {
      console.error('[AdminDashboard] Load error:', error);
      pushToast({ type: 'error', message: 'Failed to load dashboard data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const section = params.get('section');
    if (section === 'contacts' || section === 'applicants' || section === 'projects' || section === 'logs') {
      setActiveSection(section);
      return;
    }
    setActiveSection('overview');
  }, [location.search]);

  useEffect(() => {
    setSelectedInquiryIds([]);
    setExpandedMessageIds([]);
  }, [activeSection, refreshKey]);


  useEffect(() => {
    const supabase = getSupabase();
    supabase
      .from('admin_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(40)
      .then(({ data }) => setAdminNotifs((data as AdminNotif[]) || []));

    const channel = supabase
      .channel('admin_dashboard_notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_notifications' }, payload => {
        setAdminNotifs(prev => [payload.new as AdminNotif, ...prev]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'admin_notifications' }, payload => {
        setAdminNotifs(prev => prev.map(n => n.id === (payload.new as AdminNotif).id ? { ...n, ...(payload.new as AdminNotif) } : n));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (!notifRef.current?.contains(e.target as Node)) setNotifOpen(false);
    };
    if (notifOpen) {
      window.addEventListener('pointerdown', onPointerDown);
      return () => window.removeEventListener('pointerdown', onPointerDown);
    }
  }, [notifOpen]);

  useEffect(() => { setCurrentPage(1); }, [activeSection, overviewFilter]);

  const handleStatusChange = async (id: string, newStatus: Status) => {
    const inquiry = inquiries.find(item => item.id === id);
    if (!inquiry || inquiry.source === 'hr_applicants') return;
    try {
      setUpdatingId(id);
      await updateInquiryStatus(id, newStatus, inquiry.source);
      void logAdminAction('status_changed', inquiry.context, capitalizeName(inquiry.name || inquiry.email), `Status changed to: ${newStatus}`);
      setInquiries(prev => {
        const next = prev.map(inq => inq.id === id ? { ...inq, status: newStatus } : inq);
        cachedDashboardInquiries = next;
        return next;
      });
      pushToast({ type: 'success', message: `Status updated to ${newStatus}` });
    } catch {
      pushToast({ type: 'error', message: 'Failed to update status' });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedInquiryIds.length === 0) return;
    const label = selectedInquiryIds.length === 1 ? 'this entry' : `${selectedInquiryIds.length} entries`;
    if (!await confirm(`Delete ${label}? This cannot be undone.`, { confirmLabel: 'Delete', danger: true })) return;

    try {
      setUpdatingId('bulk-delete');
      const selectedItems = inquiries.filter(item => selectedInquiryIds.includes(item.id));
      await Promise.all(selectedItems.map(item => deleteInquiry(item.id, item.source)));
      for (const item of selectedItems) {
        const actionKey = item.source === 'hr_applicants' ? 'deleted_applicant' : item.context === 'contact' ? 'deleted_inquiry' : 'deleted_application';
        const snapshot = item.source === 'hr_applicants'
          ? JSON.stringify(applicantDetails(item).reduce<Record<string, string>>((acc, { label, value }) => { acc[label] = String(value); return acc; }, {}))
          : item.context === 'contact'
            ? JSON.stringify({ Name: item.name || '', Email: item.email || '', Message: item.message || '' })
            : JSON.stringify(projectDetails(item).reduce<Record<string, string>>((acc, { label, value }) => { acc[label] = String(value); return acc; }, {}));
        void logAdminAction(actionKey, item.context, capitalizeName(item.name || item.email), snapshot);
      }
      setInquiries(prev => {
        const next = prev.filter(item => !selectedInquiryIds.includes(item.id));
        cachedDashboardInquiries = next;
        return next;
      });
      setSelectedInquiryIds([]);
      pushToast({ type: 'success', message: 'Selected entries deleted.' });
    } catch {
      pushToast({ type: 'error', message: 'Failed to delete selected entries.' });
    } finally {
      setUpdatingId(null);
    }
  };


  const handleExport = async () => {
    try {
      setExporting(true);
      const logs = await fetchAllAdminLogs();
      exportInquiriesWorkbook(inquiries, logs);
      pushToast({ type: 'success', message: 'Workbook exported for Excel/Sheets.' });
    } catch {
      pushToast({ type: 'error', message: 'Failed to export workbook.' });
    } finally {
      setExporting(false);
    }
  };

  const PAGE_SIZE = 10;
  const filteredInquiries = activeSection === 'overview'
    ? (overviewFilter === 'all' ? inquiries : inquiries.filter(inq => inq.context === overviewFilter))
    : inquiries.filter(inq =>
        activeSection === 'contacts' ? inq.context === 'contact'
        : inq.context === 'project'
      );
  const totalPages = Math.max(1, Math.ceil(filteredInquiries.length / PAGE_SIZE));
  const visibleInquiries = filteredInquiries.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const sectionTitle: Record<NavSection, string> = {
    overview: 'Dashboard',
    contacts: 'Contact Messages',
    applicants: 'HR Pipeline',
    projects: 'Project Requests',
    posts: 'Posts',
    hiring: 'Hiring',
    logs: 'Activity Logs',
  };
  const sectionSub: Record<NavSection, string> = {
    overview: 'Overview of all inquiries and submission activity.',
    contacts: 'Messages submitted through the Contact Us form.',
    applicants: 'Career form submissions from applicants.',
    projects: 'Project client requests submitted through the Portal.',
    posts: 'Manage company news and announcements.',
    hiring: 'Manage job positions and applicant pipeline.',
    logs: 'Track every action performed by admins across the system.',
  };
  const unread = adminNotifs.filter(n => !n.read).length;
  const greetingName = displayName || 'Admin';
  const dateLabel = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const timeLabel = currentTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  });

  if (!profile) return null;

  return (
    <div className="relative flex h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(31,74,56,0.2),_transparent_24%),linear-gradient(135deg,#efe7db_0%,#f7f4ef_46%,#ece5d8_100%)] font-manrope">
      <div className="pointer-events-none absolute inset-0 opacity-50">
        <div className="absolute inset-y-0 left-[72px] w-px bg-[linear-gradient(180deg,transparent,rgba(24,58,42,0.18),transparent)]" />
        <div className="absolute right-16 top-12 h-40 w-40 rounded-full bg-[#1f4a38]/10 blur-3xl" />
        <div className="absolute bottom-12 left-1/3 h-56 w-56 rounded-full bg-[#d8b86b]/10 blur-3xl" />
      </div>

      {/* ── Sidebar ── */}
      <aside
        className={`relative z-30 flex flex-col shrink-0 transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] border-r border-white/10 bg-[linear-gradient(180deg,#143527_0%,#102d21_55%,#0d241a_100%)] text-white shadow-[18px_0_48px_rgba(8,22,16,0.18)] ${
          sidebarCollapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        {/* Logo */}
        <div className={`border-b border-white/10 pt-7 pb-4 transition-[padding] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${sidebarCollapsed ? 'px-3' : 'px-5'}`}>
          <div className={`flex items-center transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
          <div className={`flex shrink-0 items-center rounded-2xl border border-white/10 bg-white/95 shadow-[0_10px_22px_rgba(0,0,0,0.14)] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            sidebarCollapsed ? 'h-11 w-11 justify-center px-0' : 'h-11 px-2.5'
          }`}>
            <img
              src="/assets/logo.png"
              alt="Lifewood"
              className={`${sidebarCollapsed ? 'h-6 w-6 object-contain' : 'h-[26px] w-auto object-contain'} transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]`}
            />
          </div>
              <div className="relative shrink-0 transition-all duration-300 ease-out" ref={notifRef}>
                <button
                  type="button"
                  onClick={() => setNotifOpen(v => !v)}
                  className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/8 text-white backdrop-blur-sm transition-colors hover:bg-white/14"
                  aria-label="Admin notifications"
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-5-5.917V4a1 1 0 10-2 0v1.083A6 6 0 006 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unread > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className={`absolute z-50 w-80 overflow-hidden rounded-2xl border border-[#e0d9ce] bg-white shadow-2xl ${sidebarCollapsed ? 'left-full top-0 ml-2' : 'left-0 top-full mt-2'}`}>
                    <div className="flex items-center justify-between border-b border-[#f0ebe2] px-4 py-3">
                      <span className="text-sm font-black text-[#1a2e1a]">Notifications</span>
                      {unread > 0 && (
                        <button
                          type="button"
                          onClick={markAllRead}
                          className="text-[11px] font-bold text-[#1a3a2a] transition-opacity hover:opacity-70"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {adminNotifs.length === 0 ? (
                        <div className="px-4 py-8 text-center text-xs font-medium text-[#8a9a8a]">No notifications yet</div>
                      ) : adminNotifs.map(n => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => {
                            if (!n.read) void markOneRead(n.id);
                            setNotifOpen(false);
                            if (n.link) navigate(n.link);
                          }}
                          className={`w-full border-b border-[#f7f4ef] px-4 py-3 text-left transition-colors last:border-0 hover:bg-[#faf8f4] ${!n.read ? 'bg-[#edf4ef]' : ''}`}
                        >
                          <div className="flex items-start gap-2.5">
                            <span className="mt-0.5 shrink-0 text-base">{notifIcon(n.type)}</span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start gap-1.5">
                                {!n.read && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1a3a2a]" />}
                                <p className="text-xs font-semibold leading-relaxed text-[#1a2e1a]">{n.message}</p>
                              </div>
                              <p className="ml-3 mt-1 text-[10px] text-[#8a9a8a]">
                                {new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
          </div>

          <div className={`overflow-hidden transition-all duration-400 ease-out ${sidebarCollapsed ? 'mt-0 max-h-0 opacity-0' : 'mt-4 max-h-[420px] opacity-100 delay-100'}`}>
            <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#8fb3a1]">{dateLabel}</p>
              <p className="mt-1 text-lg font-black tracking-[0.04em] text-white">{timeLabel}</p>
              <p className="mt-3 text-center text-sm font-semibold text-[#a9c7b8]">Hello {greetingName}</p>

              <div className="mt-4 rounded-2xl border border-white/8 bg-black/10 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#8fb3a1]">Reminders For Today</p>
                  <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[10px] font-bold text-white/80">
                    {todayReminders.length}
                  </span>
                </div>

                {todayReminders.length === 0 ? (
                  <p className="mt-3 text-xs leading-relaxed text-[#d2ddd6]">No reminders.</p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {todayReminders.slice(0, 3).map(reminder => (
                      <div key={reminder.id} className="rounded-2xl border border-white/8 bg-white/6 px-3 py-2.5">
                        <p className="text-xs font-bold text-white">{reminder.name}</p>
                        <p className="mt-0.5 text-[11px] text-[#b8cec2]">{reminder.role}</p>
                        <p className="mt-1 text-[11px] font-semibold text-[#f0d48f]">
                          {reminder.interview_scheduled_for
                            ? new Date(reminder.interview_scheduled_for).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                              })
                            : 'Time pending'}
                        </p>
                      </div>
                    ))}
                    {todayReminders.length > 3 && (
                      <p className="text-[11px] font-semibold text-[#8fb3a1]">
                        +{todayReminders.length - 3} more interview reminder{todayReminders.length - 3 === 1 ? '' : 's'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setSidebarCollapsed(c => !c)}
          className="absolute -right-3 top-[118px] z-10 flex h-7 w-7 items-center justify-center rounded-full border border-[#d8dfd7] bg-white text-[#1a3a2a] shadow-[0_10px_24px_rgba(15,42,30,0.16)] transition-colors hover:bg-[#eef3ef]"
        >
          <svg className={`w-3 h-3 transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path d="M15 19l-7-7 7-7"/>
          </svg>
        </button>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 overflow-y-auto">
          {NAV_ITEMS.filter(item => !item.superAdminOnly || isSuperAdmin).map(item => (
            <button
              key={item.key}
              onClick={() => {
                if (item.href) {
                  navigate(item.href);
                  return;
                }
                setActiveSection(item.key);
                navigate(item.key === 'overview' ? '/admin' : `/admin?section=${item.key}`, { replace: true });
              }}
              title={sidebarCollapsed ? item.label : undefined}
              className={`mb-1 w-full flex items-center gap-3 rounded-2xl px-4 py-3 transition-all group ${
                activeSection === item.key
                  ? 'border border-[#3f6c59] bg-[linear-gradient(135deg,rgba(255,255,255,0.14),rgba(255,255,255,0.06))] text-white font-black shadow-[0_12px_28px_rgba(0,0,0,0.18)]'
                  : 'border border-transparent text-[#99b7a8] hover:bg-white/6 hover:border-white/8 hover:text-white font-semibold'
              }`}
            >
              <span className="shrink-0">{item.icon}</span>
              <div className={`flex min-w-0 flex-1 items-center justify-between overflow-hidden transition-all duration-300 ease-out ${sidebarCollapsed ? 'max-w-0 opacity-0' : 'max-w-[180px] opacity-100 delay-75'}`}>
                <span className="flex-1 whitespace-nowrap text-left text-xs uppercase tracking-[0.24em]">{item.label}</span>
                <svg className="w-3 h-3 shrink-0 opacity-40" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path d="M9 5l7 7-7 7"/>
                </svg>
              </div>
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div className="border-t border-white/10 py-4 px-5 space-y-1">
          <div className={`overflow-hidden transition-all duration-300 ease-out ${sidebarCollapsed ? 'max-h-0 opacity-0' : 'max-h-12 opacity-100 delay-75'}`}>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#85a494]">
              powered by <span className="font-black text-white">lifewood</span>
            </p>
          </div>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            title={sidebarCollapsed ? 'View Website' : undefined}
            className="flex items-center gap-3 py-2 text-[#99b7a8] hover:text-white transition-colors"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/>
            </svg>
            <span className={`overflow-hidden whitespace-nowrap text-xs font-semibold uppercase tracking-[0.2em] transition-all duration-300 ease-out ${sidebarCollapsed ? 'max-w-0 opacity-0' : 'max-w-[140px] opacity-100 delay-75'}`}>View Website</span>
          </a>
          <button
            onClick={handleLogout}
            title={sidebarCollapsed ? 'Sign Out' : undefined}
            className="flex items-center gap-3 py-2 text-[#99b7a8] hover:text-[#ffb4a4] transition-colors w-full"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            <span className={`overflow-hidden whitespace-nowrap text-xs font-semibold uppercase tracking-[0.2em] transition-all duration-300 ease-out ${sidebarCollapsed ? 'max-w-0 opacity-0' : 'max-w-[140px] opacity-100 delay-75'}`}>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="relative z-10 flex-1 overflow-y-auto">
        <div className="p-8 min-h-full">

          {/* Header */}
          <div className="mb-8 rounded-[30px] border border-white/60 bg-[linear-gradient(135deg,rgba(255,255,255,0.86),rgba(249,246,240,0.72))] p-6 shadow-[0_24px_60px_rgba(20,45,33,0.12)] backdrop-blur-md">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex items-center rounded-full border border-[#d7dfd5] bg-[#f6fbf7] px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-[#416452]">
                  Admin Workspace
                </span>
                <h1 className="mt-4 text-3xl font-black tracking-[-0.03em] text-[#172d22]">{sectionTitle[activeSection]}</h1>
                <p className="mt-1 text-sm font-medium text-[#6a8a7a]">{sectionSub[activeSection]}</p>
              </div>
              <div className="flex items-center gap-3">
              <button
                onClick={handleExport}
                disabled={loading || exporting || inquiries.length === 0}
                className="flex items-center gap-2 px-4 py-2.5 bg-[linear-gradient(180deg,#fffaf0_0%,#f8efda_100%)] text-[#1a3a2a] border border-[#eadbbd] font-bold text-xs rounded-2xl hover:-translate-y-0.5 hover:bg-[#f7eed7] transition-all disabled:opacity-50 uppercase tracking-[0.22em] shadow-[0_10px_24px_rgba(218,189,122,0.12)]"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                  <path d="M12 3v12m0 0l4-4m-4 4l-4-4M5 21h14" />
                </svg>
                {exporting ? 'Exporting' : 'Export'}
              </button>
              <button
                onClick={() => setRefreshKey(k => k + 1)}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2.5 bg-[linear-gradient(135deg,#173826,#29543f)] text-white font-bold text-xs rounded-2xl hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(23,56,38,0.24)] transition-all disabled:opacity-50 uppercase tracking-[0.22em] shadow-[0_14px_30px_rgba(23,56,38,0.2)]"
              >
                <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
                Refresh
              </button>
            </div>
          </div>
          </div>


          {/* Stats cards — only on overview */}
          {activeSection === 'overview' && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              {STAT_CARDS(stats).map((card, i) => (
                <div key={i} className="bg-white rounded-2xl border border-[#e8e3da] shadow-sm overflow-hidden">
                  <div className="h-1 bg-[#1a3a2a]" />
                  <div className="p-4">
                    <div className="w-9 h-9 rounded-xl bg-[#f2ece0] flex items-center justify-center text-[#1a3a2a] mb-3">
                      {card.icon}
                    </div>
                    <p className="text-[11px] font-semibold text-[#8a9a8a] uppercase tracking-wider leading-tight">{card.label}</p>
                    <p className="text-3xl font-black text-[#1a2e1a] mt-1">{loading ? '—' : card.value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* HR Pipeline — applicants section */}
          {activeSection === 'applicants' && <HRPipeline refreshKey={refreshKey} />}

          {/* Logs section */}
          {activeSection === 'logs' && <AdminLogsPanel isSuperAdmin={isSuperAdmin} refreshKey={refreshKey} />}

          {/* Table — hidden on applicants and logs */}
          {activeSection !== 'applicants' && activeSection !== 'logs' && (<div className="overflow-hidden rounded-[28px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(248,245,239,0.86))] shadow-[0_22px_54px_rgba(20,45,33,0.1)] backdrop-blur-sm">
            <div className="px-6 py-4 border-b border-[#edf1eb] bg-[linear-gradient(180deg,rgba(248,252,249,0.92),rgba(246,241,233,0.76))] flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="font-black text-[#1a2e1a] text-base">
                  {activeSection === 'overview' ? 'Recent Submissions' : sectionTitle[activeSection]}
                </h2>
                {activeSection === 'overview' && (
                  <div className="flex items-center gap-1 rounded-2xl border border-[#d9e2da] bg-white/70 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
                    {(['all', 'contact', 'career', 'project'] as const).map(f => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setOverviewFilter(f)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-[0.18em] transition-colors ${overviewFilter === f ? 'bg-[linear-gradient(135deg,#173826,#29543f)] text-white shadow-[0_10px_18px_rgba(23,56,38,0.16)]' : 'text-[#6a8a7a] hover:bg-[#eef4ef]'}`}
                      >
                        {f === 'all' ? 'All' : f === 'contact' ? 'Inquiries' : f === 'career' ? 'Applications' : 'Projects'}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {selectedInquiryIds.length > 0 ? (
                  <button
                    onClick={() => void handleDeleteSelected()}
                    disabled={updatingId === 'bulk-delete'}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#fff1ee] text-[#a64534] border border-[#f0c9bf] text-[11px] font-bold rounded-full hover:bg-[#ffe5df] transition-colors whitespace-nowrap disabled:opacity-50"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path d="M3 6h18M8 6V4h8v2m-7 0v12m6-12v12M5 6l1 14a2 2 0 002 2h8a2 2 0 002-2l1-14"/>
                    </svg>
                    Delete {selectedInquiryIds.length}
                  </button>
                ) : null}
                <span className="text-xs font-bold text-[#708577] bg-[#f4f8f5] border border-[#dde5dc] px-3 py-1 rounded-full">
                  {loading ? '…' : filteredInquiries.length} {activeSection === 'overview' ? 'recent' : 'total'}
                </span>
              </div>
            </div>

            {loading ? (
              <div className="py-20 text-center">
                <div className="w-8 h-8 border-2 border-[#1a3a2a] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-[#8a9a8a] font-medium">Loading data...</p>
              </div>
            ) : visibleInquiries.length === 0 ? (
              <div className="py-20 text-center">
                <div className="w-12 h-12 bg-[#f2ece0] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-[#8a9a8a]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
                  </svg>
                </div>
                <p className="text-sm font-bold text-[#6a8a7a]">No entries yet</p>
                <p className="text-xs text-[#8a9a8a] mt-1">Submissions will appear here once received.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-fixed">
                  <colgroup>
                    <col style={{ width: DASHBOARD_TABLE_WIDTHS.checkbox }} />
                    <col style={{ width: activeSection === 'overview' ? '32%' : DASHBOARD_TABLE_WIDTHS.inquirer }} />
                    <col style={{ width: DASHBOARD_TABLE_WIDTHS.type }} />
                    {activeSection === 'contacts' && <col style={{ width: DASHBOARD_TABLE_WIDTHS.message }} />}
                    {activeSection === 'projects' && <col style={{ width: DASHBOARD_TABLE_WIDTHS.message }} />}
                    {(activeSection === 'contacts' || activeSection === 'projects') && <col style={{ width: DASHBOARD_TABLE_WIDTHS.details }} />}
                    <col style={{ width: DASHBOARD_TABLE_WIDTHS.appliedDate }} />
                    <col style={{ width: DASHBOARD_TABLE_WIDTHS.status }} />
                    <col style={{ width: DASHBOARD_TABLE_WIDTHS.action }} />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-[#f0ebe2]">
                      <th className="px-4 py-3" />
                      <th className="text-left px-6 py-3 text-[10px] font-black text-[#8a9a8a] uppercase tracking-widest">
                        Inquirer
                      </th>
                      <th className="text-left px-4 py-3 text-[10px] font-black text-[#8a9a8a] uppercase tracking-widest">
                        Type
                      </th>
                      {activeSection === 'contacts' && (
                        <>
                          <th className="text-left px-4 py-3 text-[10px] font-black text-[#8a9a8a] uppercase tracking-widest">Message</th>
                          <th className="px-4 py-3" aria-hidden="true" />
                        </>
                      )}
                      {activeSection === 'projects' && (
                        <>
                          <th className="text-left px-4 py-3 text-[10px] font-black text-[#8a9a8a] uppercase tracking-widest">Expectations</th>
                          <th className="text-left px-4 py-3 text-[10px] font-black text-[#8a9a8a] uppercase tracking-widest">Project Details</th>
                        </>
                      )}
                      <th className="text-left px-4 py-3 text-[10px] font-black text-[#8a9a8a] uppercase tracking-widest">Applied Date</th>
                      <th className="text-left px-4 py-3 text-[10px] font-black text-[#8a9a8a] uppercase tracking-widest">Status</th>
                      <th className="text-left px-4 py-3 text-[10px] font-black text-[#8a9a8a] uppercase tracking-widest">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleInquiries.map((inquiry: Inquiry) => {
                      const name = inquiry.name || inquiry.email || 'Unknown';
                      const initials = getInitials(name);
                      const color = avatarColor(name);
                      const date = new Date(inquiry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                      const status = (inquiry.status || 'new') as Status;
                      const isHrApplicant = inquiry.source === 'hr_applicants';
                      const isMessageExpanded = expandedMessageIds.includes(inquiry.id);

                      const typeCell =
                        activeSection === 'overview' ? <ContextBadge context={inquiry.context} /> :
                        activeSection === 'contacts' ? <span className="text-sm text-[#4a6a5a] font-medium capitalize">{inquiry.position || '—'}</span> :
                        <span className="text-sm text-[#4a6a5a] font-semibold">{inquiry.service || '—'}</span>;

                      return (
                        <tr key={inquiry.id} className="border-b border-[#f7f4ef] last:border-0 hover:bg-[#faf8f4] transition-colors">
                          <td className="px-4 py-4">
                            <input
                              type="checkbox"
                              checked={selectedInquiryIds.includes(inquiry.id)}
                              onChange={e => {
                                if (isHrApplicant) return;
                                setSelectedInquiryIds(current =>
                                  e.target.checked
                                    ? [...current, inquiry.id]
                                    : current.filter(id => id !== inquiry.id),
                                );
                              }}
                              disabled={isHrApplicant}
                              className="h-4 w-4 rounded border-[#d7cdbd] text-[#1a3a2a] focus:ring-[#1a3a2a]"
                              aria-label={`Select ${name}`}
                            />
                          </td>
                          {/* Inquirer */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-full ${color} text-white flex items-center justify-center text-xs font-black shrink-0`}>
                                {initials}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-sm text-[#1a2e1a] truncate max-w-[180px]">{capitalizeName(name)}</p>
                                <p className="text-[11px] text-[#8a9a8a] truncate max-w-[180px]">{inquiry.email}</p>
                              </div>
                            </div>
                          </td>

                          {/* Type */}
                          <td className="px-4 py-4">{typeCell}</td>


                          {/* Contacts-only column */}
                          {activeSection === 'contacts' && (
                            <>
                              <td className="px-4 py-4 max-w-[260px]">
                                {inquiry.message ? (
                                  <div className="flex items-start gap-2">
                                    <p className={`flex-1 text-xs text-[#8a9a8a] leading-relaxed ${isMessageExpanded ? '' : 'line-clamp-2'}`} title={inquiry.message}>{inquiry.message}</p>
                                    {hasLongText(inquiry.message) ? (
                                      <button
                                        type="button"
                                        onClick={() => setExpandedMessageIds(current => isMessageExpanded ? current.filter(id => id !== inquiry.id) : [...current, inquiry.id])}
                                        className="mt-0.5 shrink-0 flex items-center justify-center w-6 h-6 rounded-full border border-[#d9cfbf] bg-white text-[#1a3a2a] transition-colors hover:bg-[#f8f3ea]"
                                        aria-label={isMessageExpanded ? 'Collapse' : 'Expand'}
                                      >
                                        <svg className={`w-3 h-3 transition-transform ${isMessageExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                          <path d="M6 9l6 6 6-6"/>
                                        </svg>
                                      </button>
                                    ) : null}
                                  </div>
                                ) : <span className="text-xs text-[#c0c8c0]">—</span>}
                              </td>
                              <td className="px-4 py-4" aria-hidden="true" />
                            </>
                          )}

                          {/* Projects-only columns */}
                          {activeSection === 'projects' && (
                            <>
                              <td className="px-4 py-4 max-w-[260px]">
                                {inquiry.message ? (
                                  <div className="flex items-start gap-2">
                                    <p className={`flex-1 text-xs text-[#8a9a8a] leading-relaxed ${isMessageExpanded ? '' : 'line-clamp-2'}`} title={inquiry.message}>{inquiry.message}</p>
                                    {hasLongText(inquiry.message) ? (
                                      <button
                                        type="button"
                                        onClick={() => setExpandedMessageIds(current => isMessageExpanded ? current.filter(id => id !== inquiry.id) : [...current, inquiry.id])}
                                        className="mt-0.5 shrink-0 flex items-center justify-center w-6 h-6 rounded-full border border-[#d9cfbf] bg-white text-[#1a3a2a] transition-colors hover:bg-[#f8f3ea]"
                                        aria-label={isMessageExpanded ? 'Collapse' : 'Expand'}
                                      >
                                        <svg className={`w-3 h-3 transition-transform ${isMessageExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                          <path d="M6 9l6 6 6-6"/>
                                        </svg>
                                      </button>
                                    ) : null}
                                  </div>
                                ) : <span className="text-xs text-[#c0c8c0]">—</span>}
                              </td>
                              <td className="px-4 py-4">
                                <button
                                  type="button"
                                  onClick={() => setProjectDetailsTarget(inquiry)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#d9cfbf] bg-white text-[#1a3a2a] text-[11px] font-bold hover:bg-[#f8f3ea] transition-colors whitespace-nowrap"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0Z" />
                                    <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7Z" />
                                  </svg>
                                  View details
                                </button>
                              </td>
                            </>
                          )}

                          {/* Date */}
                          <td className="px-4 py-4 text-sm text-[#6a8a7a] font-medium whitespace-nowrap">{date}</td>

                          {/* Status */}
                          <td className="px-4 py-4">
                            {isHrApplicant ? (
                              <span className="inline-flex rounded-full border border-[#d9cfbf] bg-[#f8f3ea] px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-[#355846]">
                                {inquiry.pipeline_status || 'New'}
                              </span>
                            ) : (
                              <select
                                value={status}
                                onChange={e => handleStatusChange(inquiry.id, e.target.value as Status)}
                                disabled={updatingId === inquiry.id}
                                className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wide border cursor-pointer focus:outline-none transition-colors disabled:cursor-wait ${
                                  status === 'new'
                                    ? 'bg-[#fff4d8] text-[#a86d00] border-[#f2d48d]'
                                    : status === 'contacted'
                                    ? 'bg-[#e8f3eb] text-[#1d6a46] border-[#b9d8c3]'
                                    : 'bg-[#1a3a2a] text-white border-[#1a3a2a]'
                                }`}
                              >
                                {STATUS_OPTIONS.map(s => (
                                  <option key={s} value={s} className="bg-white text-[#1a2e1a] normal-case font-semibold">
                                    {s.charAt(0).toUpperCase() + s.slice(1)}
                                  </option>
                                ))}
                              </select>
                            )}
                          </td>

                          {/* Action */}
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap items-center gap-2">
                              {isHrApplicant ? (
                                <button
                                  onClick={() => navigate('/admin?section=applicants')}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#d9cfbf] bg-white text-[#1a3a2a] text-[11px] font-bold hover:bg-[#f8f3ea] transition-colors whitespace-nowrap"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path d="M9 5l7 7-7 7"/>
                                  </svg>
                                  Open pipeline
                                </button>
                              ) : status !== 'contacted' && status !== 'closed' && (
                                <button
                                  onClick={() => { setRespondTarget(inquiry); setEmailBody(getEmailTemplate(inquiry)); }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a3a2a] text-white text-[11px] font-bold rounded-lg hover:bg-[#2a5a3a] transition-colors whitespace-nowrap"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                                  </svg>
                                  Respond
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {!loading && totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-3 border-t border-[#f0ebe2] bg-[#faf8f4]">
                <span className="text-xs text-[#8a9a8a] font-medium">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg border border-[#e8e3da] bg-white text-[#4a6a5a] hover:bg-[#f2ece0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    ← Prev
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 text-xs font-bold rounded-lg border transition-colors ${
                        page === currentPage
                          ? 'bg-[#1a3a2a] text-white border-[#1a3a2a]'
                          : 'border-[#e8e3da] bg-white text-[#4a6a5a] hover:bg-[#f2ece0]'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg border border-[#e8e3da] bg-white text-[#4a6a5a] hover:bg-[#f2ece0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>)}

        </div>
      </main>

      {/* ── Respond Modal ── */}
      {respondTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(9,16,12,0.42)] px-3 py-5 backdrop-blur-md">
          <div className="w-full max-w-xl rounded-[28px] border border-white/65 bg-[#f7f2e8]/35 p-1.5 shadow-[0_28px_80px_rgba(19,41,30,0.24)] backdrop-blur-md">
            <div className="overflow-hidden rounded-[24px] bg-white shadow-[0_10px_30px_rgba(19,41,30,0.08)]">
            {/* Modal header */}
            <div className="flex items-start justify-between gap-4 border-b border-[#ece3d4] bg-[linear-gradient(135deg,rgba(247,242,232,0.92),rgba(255,255,255,0.98))] px-6 py-4">
              <div className="space-y-2">
                <span className="inline-flex items-center rounded-full border border-[#e4d7c2] bg-[#fff9ef] px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-[#8a7d63]">
                  Email Composer
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[1.1rem] font-black leading-tight text-[#193728]">Respond to {capitalizeName(respondTarget.name || respondTarget.email)}</h3>
                  <p className="mt-1.5 text-[13px] font-medium text-[#6d7c70]">
                    Sending to <span className="font-bold text-[#29523d]">{respondTarget.email}</span>
                  </p>
                  <p className="mt-1 text-[11px] text-[#8b988d]">
                    Review the message below before sending your response.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRespondTarget(null)}
                className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full border border-[#e8dccb] bg-white/90 text-[#7f8f82] shadow-[0_8px_18px_rgba(19,41,30,0.08)] transition-colors hover:bg-[#f8f3ea] hover:text-[#1a2e1a]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* Email template */}
            <div className="px-6 py-5">
              <div className="mb-2.5">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#8a9a8a]">Email Draft</p>
              </div>
              <textarea
                value={emailBody}
                onChange={e => setEmailBody(e.target.value)}
                rows={10}
                className="w-full resize-none rounded-[20px] border border-[#ded3c4] bg-[linear-gradient(180deg,#fffdfa_0%,#fbf7f0_100%)] px-4 py-3.5 text-[14px] leading-7 text-[#203427] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-colors placeholder:text-[#a8afa8] focus:border-[#1a3a2a] focus:outline-none focus:ring-4 focus:ring-[#1a3a2a]/10"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-4 border-t border-[#ece3d4] bg-[#fffdfa] px-6 py-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setRespondTarget(null)}
                  className="px-4 py-2 text-sm font-bold text-[#6a8a7a] transition-colors hover:text-[#1a2e1a]"
                >
                  Cancel
                </button>
                <button
                disabled={sendingEmail}
                onClick={async () => {
                  setSendingEmail(true);
                  try {
                    const supabase = getSupabase();
                    const badge =
                      respondTarget.context === 'career' ? 'Application Update' :
                      respondTarget.context === 'project' ? 'Project Request Update' :
                      '';

                    const meta =
                      respondTarget.context === 'career' ? [
                        { label: 'Position', value: formatPositionLabel(respondTarget.position) },
                        { label: 'Date', value: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) },
                        { label: 'Status', value: 'Under Review', color: '#e8a020' },
                      ] : respondTarget.context === 'project' ? [
                        { label: 'Service', value: respondTarget.service || 'N/A' },
                        { label: 'Date', value: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) },
                      ] : [];

                    const recipientEmail = respondTarget.email?.trim() ?? '';
                    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
                      pushToast({ type: 'error', message: 'This email address does not exist or is invalid.' });
                      setSendingEmail(false);
                      return;
                    }

                    const { error } = await supabase.functions.invoke('send-email', {
                      body: {
                        to: recipientEmail,
                        name: capitalizeName(respondTarget.name || respondTarget.email),
                        subject: `Re: Your Lifewood ${respondTarget.context === 'career' ? 'Application' : respondTarget.context === 'project' ? 'Project Request' : 'Inquiry'}`,
                        body: emailBody,
                        badge,
                        meta,
                      },
                    });
                    if (error) throw error;

                    handleStatusChange(respondTarget.id, 'contacted');

                    const notifMessage =
                      respondTarget.context === 'career'
                        ? `Your application${respondTarget.position ? ` for the ${respondTarget.position} role` : ''} has received a response from Lifewood. Please check your email for details.`
                        : respondTarget.context === 'project'
                        ? `Your project request has received a response from Lifewood. Please check your email for details.`
                        : `Your inquiry has received a response from Lifewood. Please check your email for details.`;

                    await supabase.from('notifications').insert({
                      user_email: respondTarget.email,
                      message: notifMessage,
                      inquiry_id: respondTarget.id,
                      read: false,
                    });

                    const replyAction = respondTarget.context === 'career' ? 'replied_to_application' : respondTarget.context === 'project' ? 'replied_to_project' : 'replied_to_inquiry';
                    void logAdminAction(replyAction, respondTarget.context, capitalizeName(respondTarget.name || respondTarget.email), `Email sent to ${respondTarget.email}`);
                    pushToast({ type: 'success', message: `Email sent to ${respondTarget.email}` });
                    setRespondTarget(null);
                  } catch (err) {
                    const msg = err instanceof Error ? err.message.toLowerCase() : '';
                    const isInvalidEmail = msg.includes('invalid') || msg.includes('not found') || msg.includes('does not exist') || msg.includes('recipient') || msg.includes('bounce');
                    pushToast({ type: 'error', message: isInvalidEmail ? 'This email address does not exist or is invalid.' : 'Failed to send email. Please try again.' });
                  } finally {
                    setSendingEmail(false);
                  }
                }}
                  className="flex items-center gap-2 rounded-2xl bg-[#173826] px-8 py-2.5 text-sm font-black text-white shadow-[0_12px_24px_rgba(23,56,38,0.22)] transition-colors hover:bg-[#214a35] disabled:cursor-wait disabled:opacity-60 whitespace-nowrap"
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                </svg>
                {sendingEmail ? 'Sending…' : 'Send Email'}
              </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}
      {detailsTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-3">
          <div className="w-full max-w-4xl rounded-[32px] border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.38),rgba(247,242,232,0.18))] p-1.5 shadow-[0_32px_100px_rgba(15,33,25,0.28)]">
            <div className="overflow-hidden rounded-[28px] border border-[#e8ecdf] bg-white shadow-[0_18px_48px_rgba(19,41,30,0.12)]">
              <div className="relative overflow-hidden border-b border-[#e7e2d8] bg-[radial-gradient(circle_at_top_left,rgba(52,108,79,0.18),transparent_34%),linear-gradient(135deg,#fcfaf5_0%,#f5efe4_52%,#fdfcf8_100%)] px-6 py-5">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#8a9a8a]">Applicant Details</p>
                  <h3 className="mt-2 text-[1.1rem] font-black leading-tight text-[#193728]">{capitalizeName(detailsTarget.name || detailsTarget.email)}</h3>
                  <p className="mt-1 text-[13px] font-medium text-[#6d7c70]">{formatPositionLabel(detailsTarget.position)}</p>
                </div>
                <button
                  onClick={() => setDetailsTarget(null)}
                  className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full border border-[#e8dccb] bg-white/90 text-[#7f8f82] shadow-[0_8px_18px_rgba(19,41,30,0.08)] transition-colors hover:bg-[#f8f3ea] hover:text-[#1a2e1a]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              <div className="max-h-[68vh] overflow-y-auto px-6 py-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {applicantDetails(detailsTarget).map(item => (
                    <div key={item.label} className={`rounded-2xl border border-[#e8e3da] bg-[#fffdfa] p-4 ${String(item.value).length > 120 ? 'md:col-span-2' : ''}`}>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8a9a8a]">{item.label}</p>
                      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#203427]">{item.value}</p>
                    </div>
                  ))}
                  <div className="rounded-2xl border border-[#e8e3da] bg-[#fffdfa] p-4 md:col-span-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8a9a8a]">Resume / CV</p>
                    <div className="mt-2">
                      {detailsTarget.attachment_url ? (
                        <a
                          href={detailsTarget.attachment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl border border-[#d9cfbf] bg-white px-4 py-2 text-xs font-bold text-[#1a3a2a] transition-colors hover:bg-[#f8f3ea]"
                        >
                          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0Z" />
                            <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7Z" />
                          </svg>
                          {detailsTarget.attachment_name || 'View file'}
                        </a>
                      ) : (
                        <p className="text-sm text-[#8a9a8a]">No file uploaded.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
      {projectDetailsTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(9,16,12,0.42)] px-3 py-5 backdrop-blur-md">
          <div className="w-full max-w-4xl rounded-[32px] border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.38),rgba(247,242,232,0.18))] p-1.5 shadow-[0_32px_100px_rgba(15,33,25,0.28)]">
            <div className="overflow-hidden rounded-[28px] border border-[#e8ecdf] bg-white shadow-[0_18px_48px_rgba(19,41,30,0.12)]">
              <div className="relative overflow-hidden border-b border-[#e7e2d8] bg-[radial-gradient(circle_at_top_left,rgba(52,108,79,0.18),transparent_34%),linear-gradient(135deg,#fcfaf5_0%,#f5efe4_52%,#fdfcf8_100%)] px-6 py-5">
                <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[rgba(21,74,53,0.08)] blur-3xl" />
                <div className="absolute bottom-0 left-0 right-0 h-px bg-[linear-gradient(90deg,transparent,rgba(40,86,63,0.28),transparent)]" />
                <div className="relative flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="inline-flex items-center rounded-full border border-[#d8dece] bg-white/78 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-[#547361] shadow-[0_8px_18px_rgba(31,57,43,0.06)]">
                      Project Details
                    </div>
                    <h3 className="mt-3 text-[1.45rem] font-black leading-tight tracking-[-0.03em] text-[#193728]">
                      {capitalizeName(projectDetailsTarget.name || projectDetailsTarget.email)}
                    </h3>
                    <p className="mt-1 text-[13px] font-medium text-[#6a7b70]">
                      {projectDetailsTarget.organization || 'Independent inquiry'}
                    </p>
                    </div>
                  <button
                    onClick={() => setProjectDetailsTarget(null)}
                    className="relative z-10 mt-0.5 flex h-11 w-11 items-center justify-center rounded-full border border-[#d9dece] bg-white/92 text-[#768779] shadow-[0_10px_22px_rgba(19,41,30,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#f9f5ed] hover:text-[#183326]"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24">
                      <path d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              </div>

              <div className="max-h-[66vh] overflow-y-auto bg-[linear-gradient(180deg,#fffdfa_0%,#f6f3eb_100%)] px-6 py-5">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
                  {projectDetails(projectDetailsTarget).map(item => (
                    <div
                      key={item.label}
                      className={`rounded-2xl border border-[#e3e8dd] bg-white/92 p-4 shadow-[0_10px_24px_rgba(20,44,31,0.05)] ${
                        String(item.value).length > 100 ? 'md:col-span-6' : 'md:col-span-2'
                      }`}
                    >
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#90a292]">{item.label}</p>
                      <p className="mt-2 whitespace-pre-wrap break-words text-[15px] leading-6 text-[#203427]">{item.value}</p>
                    </div>
                  ))}
                  {projectDetailsTarget.attachment_url && (
                    <div className="md:col-span-6 rounded-[22px] border border-[#dfe6da] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(249,246,239,0.96))] p-4 shadow-[0_12px_28px_rgba(20,44,31,0.06)]">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#dbe2d5] bg-[#f4f8f2] text-[#1d4a35] shadow-[0_8px_18px_rgba(29,74,53,0.08)]">
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
                            </svg>
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#90a292]">Attachment</p>
                            <p className="mt-1 text-sm font-semibold text-[#1b3528]">
                              {projectDetailsTarget.attachment_name || 'Attached file'}
                            </p>
                            <p className="mt-1 text-xs text-[#708173]">Open the uploaded file in a new tab for review.</p>
                          </div>
                        </div>
                        <a
                          href={projectDetailsTarget.attachment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#d6dece] bg-white px-4 py-2.5 text-sm font-bold text-[#173526] shadow-[0_10px_22px_rgba(20,44,31,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#f6f3ec]"
                        >
                          <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
                          </svg>
                          View attachment
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {confirmModal}
    </div>
  );
}
