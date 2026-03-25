import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getSupabase } from '../../lib/supabaseClient';
import { useProfile } from '../../hooks/useProfile';

type AdminNotif = {
  id: string;
  type: string;
  message: string;
  link: string | null;
  read: boolean;
  created_at: string;
};

type AdminShellProps = {
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
  children: React.ReactNode;
};

type InterviewReminder = {
  id: string;
  name: string;
  role: string;
  interview_scheduled_for: string | null;
};

const ALL_NAV_ITEMS = [
  { href: '/admin', label: 'Overview', superAdminOnly: false, icon: (<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>) },
  { href: '/admin?section=contacts', label: 'Contacts', superAdminOnly: false, icon: (<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>) },
  { href: '/admin?section=projects', label: 'Projects', superAdminOnly: false, icon: (<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>) },
  { href: '/admin?section=applicants', label: 'Applicants', superAdminOnly: false, icon: (<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>) },
  { href: '/admin/posts', label: 'Posts', superAdminOnly: true, icon: (<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M5 4h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>) },
  { href: '/admin/hiring', label: 'Hiring', superAdminOnly: true, icon: (<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M4 7h16M7 3v8M17 3v8M5 11h14a2 2 0 012 2v5a3 3 0 01-3 3H6a3 3 0 01-3-3v-5a2 2 0 012-2z"/></svg>) },
  { href: '/admin?section=logs', label: 'Logs', superAdminOnly: false, icon: (<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>) },
];

function isActive(pathname: string, search: string, href: string) {
  if (href.startsWith('/admin/posts')) return pathname.startsWith('/admin/posts');
  if (href.startsWith('/admin/hiring')) return pathname.startsWith('/admin/hiring');
  if (href === '/admin') return pathname === '/admin' && !search;
  return pathname === '/admin' && search === href.replace('/admin', '');
}

export default function AdminShell({ title, subtitle, actions, onRefresh, refreshing, children }: AdminShellProps) {
  const { isSuperAdmin, displayName } = useProfile();
  const NAV_ITEMS = ALL_NAV_ITEMS.filter(item => !item.superAdminOnly || isSuperAdmin);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [adminNotifs, setAdminNotifs] = React.useState<AdminNotif[]>([]);
  const [currentTime, setCurrentTime] = React.useState(() => new Date());
  const [todayReminders, setTodayReminders] = React.useState<InterviewReminder[]>([]);
  const [notifOpen, setNotifOpen] = React.useState(false);
  const notifRef = React.useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  React.useEffect(() => {
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

  // Fetch + subscribe to admin notifications
  React.useEffect(() => {
    const supabase = getSupabase();
    supabase
      .from('admin_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(40)
      .then(({ data }) => setAdminNotifs((data as AdminNotif[]) || []));

    const channel = supabase
      .channel('admin_notifications_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_notifications' }, payload => {
        setAdminNotifs(prev => [payload.new as AdminNotif, ...prev]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'admin_notifications' }, payload => {
        setAdminNotifs(prev => prev.map(n => n.id === (payload.new as AdminNotif).id ? { ...n, ...(payload.new as AdminNotif) } : n));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Close notif dropdown on outside click
  React.useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (!notifRef.current?.contains(e.target as Node)) setNotifOpen(false);
    };
    if (notifOpen) {
      window.addEventListener('pointerdown', onPointerDown);
      return () => window.removeEventListener('pointerdown', onPointerDown);
    }
  }, [notifOpen]);

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

  const notifIcon = (type: string) => {
    if (type.startsWith('new_inquiry_contact')) return '✉️';
    if (type.startsWith('new_inquiry_career')) return '👤';
    if (type.startsWith('new_inquiry_project')) return '📋';
    if (type === 'new_reaction') return '❤️';
    if (type === 'new_comment') return '💬';
    return '🔔';
  };

  const handleLogout = async () => {
    await getSupabase().auth.signOut();
    navigate('/login', { replace: true });
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

  return (
    <div className="relative flex h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(31,74,56,0.2),_transparent_24%),linear-gradient(135deg,#efe7db_0%,#f7f4ef_46%,#ece5d8_100%)] font-manrope">
      <div className="pointer-events-none absolute inset-0 opacity-50">
        <div className="absolute inset-y-0 left-[72px] w-px bg-[linear-gradient(180deg,transparent,rgba(24,58,42,0.18),transparent)]" />
        <div className="absolute right-16 top-12 h-40 w-40 rounded-full bg-[#1f4a38]/10 blur-3xl" />
        <div className="absolute bottom-12 left-1/3 h-56 w-56 rounded-full bg-[#d8b86b]/10 blur-3xl" />
      </div>
      <aside
        className={`relative z-30 flex flex-col shrink-0 transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] border-r border-white/10 bg-[linear-gradient(180deg,#143527_0%,#102d21_55%,#0d241a_100%)] text-white shadow-[18px_0_48px_rgba(8,22,16,0.18)] ${
          sidebarCollapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
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
                  className="relative w-10 h-10 flex items-center justify-center rounded-2xl border border-white/10 bg-white/8 hover:bg-white/14 backdrop-blur-sm transition-colors"
                  aria-label="Admin notifications"
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-5-5.917V4a1 1 0 10-2 0v1.083A6 6 0 006 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                  </svg>
                  {unread > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className={`absolute w-80 rounded-2xl border border-[#e0d9ce] bg-white shadow-2xl overflow-hidden z-50 ${sidebarCollapsed ? 'left-full top-0 ml-2' : 'left-0 top-full mt-2'}`}>
                    <div className="px-4 py-3 border-b border-[#f0ebe2] flex items-center justify-between">
                      <span className="font-black text-sm text-[#1a2e1a]">Notifications</span>
                      {unread > 0 && (
                        <button
                          type="button"
                          onClick={markAllRead}
                          className="text-[11px] font-bold text-[#1a3a2a] hover:opacity-70 transition-opacity"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {adminNotifs.length === 0 ? (
                        <div className="px-4 py-8 text-center text-xs text-[#8a9a8a] font-medium">No notifications yet</div>
                      ) : adminNotifs.map(n => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => {
                            if (!n.read) void markOneRead(n.id);
                            setNotifOpen(false);
                            if (n.link) navigate(n.link);
                          }}
                          className={`w-full text-left px-4 py-3 border-b border-[#f7f4ef] last:border-0 transition-colors hover:bg-[#faf8f4] ${!n.read ? 'bg-[#edf4ef]' : ''}`}
                        >
                          <div className="flex items-start gap-2.5">
                            <span className="text-base shrink-0 mt-0.5">{notifIcon(n.type)}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start gap-1.5">
                                {!n.read && <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#1a3a2a] shrink-0" />}
                                <p className="text-xs text-[#1a2e1a] font-semibold leading-relaxed">{n.message}</p>
                              </div>
                              <p className="text-[10px] text-[#8a9a8a] mt-1 ml-3">
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

        <button
          onClick={() => setSidebarCollapsed(value => !value)}
          className="absolute -right-3 top-[118px] z-10 w-7 h-7 rounded-full bg-white border border-[#d8dfd7] shadow-[0_10px_24px_rgba(15,42,30,0.16)] flex items-center justify-center hover:bg-[#eef3ef] transition-colors"
        >
          <svg className={`w-3 h-3 text-[#1a3a2a] transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <nav className="flex-1 py-5 px-3 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              title={sidebarCollapsed ? item.label : undefined}
              className={`mb-1 w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all group ${
                isActive(location.pathname, location.search, item.href)
                  ? 'border border-[#3f6c59] bg-[linear-gradient(135deg,rgba(255,255,255,0.14),rgba(255,255,255,0.06))] text-white font-black shadow-[0_12px_28px_rgba(0,0,0,0.18)]'
                  : 'border border-transparent text-[#99b7a8] hover:bg-white/6 hover:border-white/8 hover:text-white font-semibold'
              }`}
            >
              <span className="shrink-0">{item.icon}</span>
              <div className={`flex min-w-0 flex-1 items-center justify-between overflow-hidden transition-all duration-300 ease-out ${sidebarCollapsed ? 'max-w-0 opacity-0' : 'max-w-[180px] opacity-100 delay-75'}`}>
                <span className="flex-1 whitespace-nowrap text-left text-xs uppercase tracking-[0.24em]">{item.label}</span>
                <svg className="w-3 h-3 shrink-0 opacity-40" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </nav>

        <div className="border-t border-white/10 py-4 px-5 space-y-1">
          <div className={`overflow-hidden transition-all duration-300 ease-out ${sidebarCollapsed ? 'max-h-0 opacity-0' : 'max-h-12 opacity-100 delay-75'}`}>
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#85a494] font-semibold mb-3">
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
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
            </svg>
            <span className={`overflow-hidden whitespace-nowrap text-xs font-semibold uppercase tracking-[0.2em] transition-all duration-300 ease-out ${sidebarCollapsed ? 'max-w-0 opacity-0' : 'max-w-[140px] opacity-100 delay-75'}`}>View Website</span>
          </a>
          <button
            onClick={handleLogout}
            title={sidebarCollapsed ? 'Sign Out' : undefined}
            className="flex items-center gap-3 py-2 text-[#99b7a8] hover:text-[#ffb4a4] transition-colors w-full"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className={`overflow-hidden whitespace-nowrap text-xs font-semibold uppercase tracking-[0.2em] transition-all duration-300 ease-out ${sidebarCollapsed ? 'max-w-0 opacity-0' : 'max-w-[140px] opacity-100 delay-75'}`}>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="relative z-10 flex-1 overflow-y-auto">
        <div className="p-8 min-h-full">
          <div className="mb-8 rounded-[30px] border border-white/60 bg-[linear-gradient(135deg,rgba(255,255,255,0.86),rgba(249,246,240,0.72))] p-6 shadow-[0_24px_60px_rgba(20,45,33,0.12)] backdrop-blur-md">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex items-center rounded-full border border-[#d7dfd5] bg-[#f6fbf7] px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-[#416452]">
                  Admin Workspace
                </span>
                <h1 className="mt-4 text-3xl font-black tracking-[-0.03em] text-[#172d22]">{title}</h1>
                <p className="mt-1 text-sm font-medium text-[#6a8a7a]">{subtitle}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
              {actions}
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  disabled={refreshing}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[linear-gradient(135deg,#173826,#29543f)] text-white font-bold text-xs rounded-2xl hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(23,56,38,0.24)] transition-all disabled:opacity-50 uppercase tracking-[0.22em] shadow-[0_14px_30px_rgba(23,56,38,0.2)]"
                >
                  <svg className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                  </svg>
                  Refresh
                </button>
              )}
            </div>
          </div>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
