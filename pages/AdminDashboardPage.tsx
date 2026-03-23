import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useProfile } from '../hooks/useProfile';
import { useToast } from '../components/ToastProvider';
import { deleteInquiry, getInquiryStats, getAllInquiries, Inquiry, InquiryStats, updateInquiryStatus } from '../lib/admin';
import HRPipeline from '../components/admin/HRPipeline';
import { exportInquiriesWorkbook } from '../lib/adminExport';
import { getSupabase } from '../lib/supabaseClient';
import { useConfirm } from '../components/ConfirmModal';

let cachedDashboardStats: InquiryStats | null = null;
let cachedDashboardInquiries: Inquiry[] | null = null;

const STATUS_OPTIONS = ['new', 'contacted', 'closed'] as const;
type Status = typeof STATUS_OPTIONS[number];
type NavSection = 'overview' | 'contacts' | 'applicants' | 'projects' | 'posts' | 'hiring';
type AdminNotif = {
  id: string;
  type: string;
  message: string;
  link: string | null;
  read: boolean;
  created_at: string;
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
function hasLongText(value: string | null | undefined) {
  return (value || '').trim().length > 90;
}

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

const NAV_ITEMS: { key: NavSection; label: string; icon: React.ReactNode; href?: string }[] = [
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
    key: 'projects',
    label: 'Projects',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    ),
  },
  {
    key: 'posts',
    label: 'Posts',
    href: '/admin/posts',
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
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path d="M4 7h16M7 3v8M17 3v8M5 11h14a2 2 0 012 2v5a3 3 0 01-3 3H6a3 3 0 01-3-3v-5a2 2 0 012-2z" />
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
  const { profile } = useProfile();
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
  const [emailBody, setEmailBody] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [adminNotifs, setAdminNotifs] = useState<AdminNotif[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const { confirm, modal: confirmModal } = useConfirm();
  const notifRef = React.useRef<HTMLDivElement | null>(null);

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
      setLoading(!(cachedDashboardStats && cachedDashboardInquiries));
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
    if (section === 'contacts' || section === 'applicants' || section === 'projects') {
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

  const handleStatusChange = async (id: string, newStatus: Status) => {
    const inquiry = inquiries.find(item => item.id === id);
    if (!inquiry || inquiry.source === 'hr_applicants') return;
    try {
      setUpdatingId(id);
      await updateInquiryStatus(id, newStatus, inquiry.source);
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

  const handleExport = () => {
    try {
      setExporting(true);
      exportInquiriesWorkbook(inquiries);
      pushToast({ type: 'success', message: 'Workbook exported for Excel/Sheets.' });
    } catch {
      pushToast({ type: 'error', message: 'Failed to export workbook.' });
    } finally {
      setExporting(false);
    }
  };

  const visibleInquiries = activeSection === 'overview'
    ? inquiries.slice(0, 10)
    : inquiries.filter(inq =>
        activeSection === 'contacts' ? inq.context === 'contact'
        : activeSection === 'applicants' ? inq.context === 'career'
        : inq.context === 'project'
      );
  const sectionTitle: Record<NavSection, string> = {
    overview: 'Dashboard',
    contacts: 'Contact Messages',
    applicants: 'Applicants',
    projects: 'Project Requests',
    posts: 'Posts',
    hiring: 'Hiring',
  };
  const sectionSub: Record<NavSection, string> = {
    overview: 'Overview of all inquiries and submission activity.',
    contacts: 'Messages submitted through the Contact Us form.',
    applicants: 'Career form submissions from applicants.',
    projects: 'Project client requests submitted through the Portal.',
    posts: 'Manage company news and announcements.',
    hiring: 'Manage job positions and applicant pipeline.',
  };
  const unread = adminNotifs.filter(n => !n.read).length;

  if (!profile) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-[#f2ece0] font-manrope">

      {/* ── Sidebar ── */}
      <aside
        className={`relative flex flex-col shrink-0 transition-all duration-300 bg-[#f2ece0] border-r border-[#e0d9ce] ${
          sidebarCollapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-[#e0d9ce]">
          <img src="/assets/logo.png" alt="Lifewood" className="h-8 w-auto object-contain shrink-0" />
          {!sidebarCollapsed && (
            <>
              <span className="font-semibold text-xs text-[#4a6a5a] tracking-[0.28em] uppercase">Admin</span>
              <div className="relative ml-auto" ref={notifRef}>
                <button
                  type="button"
                  onClick={() => setNotifOpen(v => !v)}
                  className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#e0d9ce] bg-white transition-colors hover:bg-[#f2ece0]"
                  aria-label="Admin notifications"
                >
                  <svg className="w-4 h-4 text-[#1a3a2a]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-5-5.917V4a1 1 0 10-2 0v1.083A6 6 0 006 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unread > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute left-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-[#e0d9ce] bg-white shadow-2xl">
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
            </>
          )}
          {sidebarCollapsed && (
            <div className="relative ml-auto" ref={notifRef}>
              <button
                type="button"
                onClick={() => setNotifOpen(v => !v)}
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#e0d9ce] bg-white transition-colors hover:bg-[#f2ece0]"
                aria-label="Admin notifications"
              >
                <svg className="w-4 h-4 text-[#1a3a2a]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-5-5.917V4a1 1 0 10-2 0v1.083A6 6 0 006 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute left-full top-0 z-50 ml-2 w-80 overflow-hidden rounded-2xl border border-[#e0d9ce] bg-white shadow-2xl">
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
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setSidebarCollapsed(c => !c)}
          className="absolute -right-3 top-[68px] w-6 h-6 rounded-full bg-white border border-[#e0d9ce] shadow-sm flex items-center justify-center hover:bg-[#f2ece0] transition-colors z-10"
        >
          <svg className={`w-3 h-3 text-[#4a6a5a] transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path d="M15 19l-7-7 7-7"/>
          </svg>
        </button>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV_ITEMS.map(item => (
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
              className={`w-full flex items-center gap-3 px-5 py-3 transition-all group ${
                activeSection === item.key
                  ? 'bg-white/70 text-[#1a3a2a] font-black border-r-2 border-[#1a3a2a]'
                  : 'text-[#5a7a6a] hover:bg-white/50 hover:text-[#1a3a2a] font-semibold'
              }`}
            >
              <span className="shrink-0">{item.icon}</span>
              {!sidebarCollapsed && (
                <>
                  <span className="flex-1 text-left text-xs uppercase tracking-widest">{item.label}</span>
                  <svg className="w-3 h-3 opacity-40" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path d="M9 5l7 7-7 7"/>
                  </svg>
                </>
              )}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div className="border-t border-[#e0d9ce] py-4 px-5 space-y-1">
          {!sidebarCollapsed && (
            <p className="text-[10px] uppercase tracking-widest text-[#8a9a8a] font-semibold mb-3">
              powered by <span className="font-black text-[#1a3a2a]">lifewood</span>
            </p>
          )}
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            title={sidebarCollapsed ? 'View Website' : undefined}
            className="flex items-center gap-3 py-2 text-[#5a7a6a] hover:text-[#1a3a2a] transition-colors"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/>
            </svg>
            {!sidebarCollapsed && <span className="text-xs font-semibold">View Website</span>}
          </a>
          <button
            onClick={handleLogout}
            title={sidebarCollapsed ? 'Sign Out' : undefined}
            className="flex items-center gap-3 py-2 text-[#5a7a6a] hover:text-red-600 transition-colors w-full"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            {!sidebarCollapsed && <span className="text-xs font-semibold">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto bg-[#f7f4ef]">
        <div className="p-8 min-h-full">

          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-2xl font-black text-[#1a2e1a] tracking-tight">{sectionTitle[activeSection]}</h1>
              <p className="text-sm text-[#6a8a7a] font-medium mt-0.5">{sectionSub[activeSection]}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExport}
                disabled={loading || exporting || inquiries.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-[#fff7e6] text-[#1a3a2a] border border-[#eadbbd] font-bold text-xs rounded-xl hover:bg-[#f7eed7] transition-all disabled:opacity-50 uppercase tracking-wider"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                  <path d="M12 3v12m0 0l4-4m-4 4l-4-4M5 21h14" />
                </svg>
                {exporting ? 'Exporting' : 'Export'}
              </button>
              <button
                onClick={() => setRefreshKey(k => k + 1)}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-[#1a3a2a] text-white font-bold text-xs rounded-xl hover:bg-[#2a5a3a] transition-all disabled:opacity-50 uppercase tracking-wider"
              >
                <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
                Refresh
              </button>
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
          {activeSection === 'applicants' && <HRPipeline />}

          {/* Table — hidden on applicants (which uses HRPipeline above) */}
          {activeSection !== 'applicants' && (<div className="bg-white rounded-2xl border border-[#e8e3da] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#f0ebe2] flex items-center justify-between">
              <h2 className="font-black text-[#1a2e1a] text-base">
                {activeSection === 'overview' ? 'Recent Submissions' : sectionTitle[activeSection]}
              </h2>
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
                <span className="text-xs font-bold text-[#8a9a8a] bg-[#f2ece0] px-3 py-1 rounded-full">
                  {loading ? '…' : visibleInquiries.length} {activeSection === 'overview' ? 'recent' : 'total'}
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
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#f0ebe2]">
                      <th className="px-4 py-3 w-10" />
                      <th className="text-left px-6 py-3 text-[10px] font-black text-[#8a9a8a] uppercase tracking-widest">
                        Inquirer
                      </th>
                      <th className="text-left px-4 py-3 text-[10px] font-black text-[#8a9a8a] uppercase tracking-widest">
                        Type
                      </th>
                      {activeSection === 'contacts' && (
                        <th className="text-left px-4 py-3 text-[10px] font-black text-[#8a9a8a] uppercase tracking-widest">Message</th>
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
                                <p className="font-bold text-sm text-[#1a2e1a] truncate max-w-[180px]">{name}</p>
                                <p className="text-[11px] text-[#8a9a8a] truncate max-w-[180px]">{inquiry.email}</p>
                              </div>
                            </div>
                          </td>

                          {/* Type */}
                          <td className="px-4 py-4">{typeCell}</td>


                          {/* Contacts-only column */}
                          {activeSection === 'contacts' && (
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
                          )}

                          {/* Projects-only columns */}
                          {activeSection === 'projects' && (
                            <>
                              <td className="px-4 py-4 max-w-[200px]">
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
          </div>)}

        </div>
      </main>

      {/* ── Respond Modal ── */}
      {respondTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-3">
          <div className="w-full max-w-xl rounded-[28px] border border-white/65 bg-[#f7f2e8]/35 p-1.5 shadow-[0_28px_80px_rgba(19,41,30,0.24)] backdrop-blur-md">
            <div className="overflow-hidden rounded-[24px] bg-white shadow-[0_10px_30px_rgba(19,41,30,0.08)]">
            {/* Modal header */}
            <div className="flex items-start justify-between gap-4 border-b border-[#ece3d4] bg-[linear-gradient(135deg,rgba(247,242,232,0.92),rgba(255,255,255,0.98))] px-6 py-4">
              <div className="space-y-2">
                <span className="inline-flex items-center rounded-full border border-[#e4d7c2] bg-[#fff9ef] px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-[#8a7d63]">
                  Email Composer
                </span>
                <div>
                  <h3 className="text-[1.1rem] font-black leading-tight text-[#193728]">Respond to {respondTarget.name || respondTarget.email}</h3>
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
                        { label: 'Status', value: 'In Progress', color: '#1a7a4a' },
                      ] : [];

                    const { error } = await supabase.functions.invoke('send-email', {
                      body: {
                        to: respondTarget.email,
                        name: respondTarget.name || respondTarget.email,
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

                    pushToast({ type: 'success', message: `Email sent to ${respondTarget.email}` });
                    setRespondTarget(null);
                  } catch (err) {
                    pushToast({ type: 'error', message: 'Failed to send email. Check the edge function logs.' });
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
          <div className="w-full max-w-3xl rounded-[28px] border border-white/65 bg-[#f7f2e8]/35 p-1.5 shadow-[0_28px_80px_rgba(19,41,30,0.24)] backdrop-blur-md">
            <div className="overflow-hidden rounded-[24px] bg-white shadow-[0_10px_30px_rgba(19,41,30,0.08)]">
              <div className="flex items-start justify-between gap-4 border-b border-[#ece3d4] bg-[linear-gradient(135deg,rgba(247,242,232,0.92),rgba(255,255,255,0.98))] px-6 py-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#8a9a8a]">Applicant Details</p>
                  <h3 className="mt-2 text-[1.1rem] font-black leading-tight text-[#193728]">{detailsTarget.name || detailsTarget.email}</h3>
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

              <div className="flex justify-end border-t border-[#ece3d4] bg-[#fffdfa] px-6 py-4">
                <button
                  onClick={() => setDetailsTarget(null)}
                  className="px-4 py-2 text-sm font-bold text-[#6a8a7a] transition-colors hover:text-[#1a2e1a]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {projectDetailsTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-3">
          <div className="w-full max-w-3xl rounded-[28px] border border-white/65 bg-[#f7f2e8]/35 p-1.5 shadow-[0_28px_80px_rgba(19,41,30,0.24)] backdrop-blur-md">
            <div className="overflow-hidden rounded-[24px] bg-white shadow-[0_10px_30px_rgba(19,41,30,0.08)]">
              <div className="flex items-start justify-between gap-4 border-b border-[#ece3d4] bg-[linear-gradient(135deg,rgba(247,242,232,0.92),rgba(255,255,255,0.98))] px-6 py-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#8a9a8a]">Project Details</p>
                  <h3 className="mt-2 text-[1.1rem] font-black leading-tight text-[#193728]">{projectDetailsTarget.name || projectDetailsTarget.email}</h3>
                  <p className="mt-1 text-[13px] font-medium text-[#6d7c70]">{projectDetailsTarget.organization || projectDetailsTarget.service || '—'}</p>
                </div>
                <button
                  onClick={() => setProjectDetailsTarget(null)}
                  className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full border border-[#e8dccb] bg-white/90 text-[#7f8f82] shadow-[0_8px_18px_rgba(19,41,30,0.08)] transition-colors hover:bg-[#f8f3ea] hover:text-[#1a2e1a]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              <div className="max-h-[68vh] overflow-y-auto px-6 py-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {projectDetails(projectDetailsTarget).map(item => (
                    <div key={item.label} className={`rounded-2xl border border-[#e8e3da] bg-[#fffdfa] p-4 ${String(item.value).length > 120 ? 'md:col-span-2' : ''}`}>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8a9a8a]">{item.label}</p>
                      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#203427]">{item.value}</p>
                    </div>
                  ))}
                  {projectDetailsTarget.attachment_url && (
                    <div className="rounded-2xl border border-[#e8e3da] bg-[#fffdfa] p-4 md:col-span-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8a9a8a]">Attachment</p>
                      <div className="mt-2">
                        <a
                          href={projectDetailsTarget.attachment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl border border-[#d9cfbf] bg-white px-4 py-2 text-xs font-bold text-[#1a3a2a] transition-colors hover:bg-[#f8f3ea]"
                        >
                          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
                          </svg>
                          {projectDetailsTarget.attachment_name || 'View file'}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end border-t border-[#ece3d4] bg-[#fffdfa] px-6 py-4">
                <button
                  onClick={() => setProjectDetailsTarget(null)}
                  className="px-4 py-2 text-sm font-bold text-[#6a8a7a] transition-colors hover:text-[#1a2e1a]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {confirmModal}
    </div>
  );
}
