import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getSupabase } from '../../lib/supabaseClient';

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
  children: React.ReactNode;
};

const NAV_ITEMS = [
  {
    href: '/admin',
    label: 'Overview',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    href: '/admin?section=contacts',
    label: 'Contacts',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
  },
  {
    href: '/admin?section=applicants',
    label: 'Applicants',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    href: '/admin?section=projects',
    label: 'Projects',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },
  {
    href: '/admin/posts',
    label: 'Posts',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path d="M5 4h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </svg>
    ),
  },
] as const;

function isActive(pathname: string, search: string, href: string) {
  if (href.startsWith('/admin/posts')) return pathname.startsWith('/admin/posts');
  if (href === '/admin') return pathname === '/admin' && !search;
  return pathname === '/admin' && search === href.replace('/admin', '');
}

export default function AdminShell({ title, subtitle, actions, children }: AdminShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [adminNotifs, setAdminNotifs] = React.useState<AdminNotif[]>([]);
  const [notifOpen, setNotifOpen] = React.useState(false);
  const notifRef = React.useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

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

  return (
    <div className="flex h-screen overflow-hidden bg-[#f2ece0] font-manrope">
      <aside
        className={`relative flex flex-col shrink-0 transition-all duration-300 bg-[#f2ece0] border-r border-[#e0d9ce] ${
          sidebarCollapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        <div className="flex items-center gap-3 px-5 py-5 border-b border-[#e0d9ce]">
          <img src="/assets/logo.png" alt="Lifewood" className="h-8 w-auto object-contain shrink-0" />
          {!sidebarCollapsed && (
            <>
              <span className="font-black text-[#1a3a2a] text-base tracking-tight leading-tight">
                <span className="font-semibold text-xs text-[#4a6a5a] tracking-widest uppercase">Admin</span>
              </span>
              <div className="relative ml-auto" ref={notifRef}>
                <button
                  type="button"
                  onClick={() => setNotifOpen(v => !v)}
                  className="relative w-10 h-10 flex items-center justify-center rounded-xl border border-[#e0d9ce] bg-white hover:bg-[#f2ece0] transition-colors"
                  aria-label="Admin notifications"
                >
                  <svg className="w-4 h-4 text-[#1a3a2a]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-5-5.917V4a1 1 0 10-2 0v1.083A6 6 0 006 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                  </svg>
                  {unread > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute left-0 top-full mt-2 w-80 rounded-2xl border border-[#e0d9ce] bg-white shadow-2xl overflow-hidden z-50">
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
            </>
          )}
          {sidebarCollapsed && (
            <div className="relative ml-auto" ref={notifRef}>
              <button
                type="button"
                onClick={() => setNotifOpen(v => !v)}
                className="relative w-10 h-10 flex items-center justify-center rounded-xl border border-[#e0d9ce] bg-white hover:bg-[#f2ece0] transition-colors"
                aria-label="Admin notifications"
              >
                <svg className="w-4 h-4 text-[#1a3a2a]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-5-5.917V4a1 1 0 10-2 0v1.083A6 6 0 006 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                </svg>
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute left-full top-0 ml-2 w-80 rounded-2xl border border-[#e0d9ce] bg-white shadow-2xl overflow-hidden z-50">
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
          )}
        </div>

        <button
          onClick={() => setSidebarCollapsed(value => !value)}
          className="absolute -right-3 top-[68px] w-6 h-6 rounded-full bg-white border border-[#e0d9ce] shadow-sm flex items-center justify-center hover:bg-[#f2ece0] transition-colors z-10"
        >
          <svg className={`w-3 h-3 text-[#4a6a5a] transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              title={sidebarCollapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-5 py-3 transition-all group ${
                isActive(location.pathname, location.search, item.href)
                  ? 'bg-white/70 text-[#1a3a2a] font-black border-r-2 border-[#1a3a2a]'
                  : 'text-[#5a7a6a] hover:bg-white/50 hover:text-[#1a3a2a] font-semibold'
              }`}
            >
              <span className="shrink-0">{item.icon}</span>
              {!sidebarCollapsed && (
                <>
                  <span className="flex-1 text-left text-xs uppercase tracking-widest">{item.label}</span>
                  <svg className="w-3 h-3 opacity-40" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          ))}
        </nav>

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
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
            </svg>
            {!sidebarCollapsed && <span className="text-xs font-semibold">View Website</span>}
          </a>
          <button
            onClick={handleLogout}
            title={sidebarCollapsed ? 'Sign Out' : undefined}
            className="flex items-center gap-3 py-2 text-[#5a7a6a] hover:text-red-600 transition-colors w-full"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {!sidebarCollapsed && <span className="text-xs font-semibold">Sign Out</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-[#f7f4ef]">
        <div className="p-8 min-h-full">
          <div className="flex items-start justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-black text-[#1a2e1a] tracking-tight">{title}</h1>
              <p className="text-sm text-[#6a8a7a] font-medium mt-0.5">{subtitle}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">{actions}</div>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
