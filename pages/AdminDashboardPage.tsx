import React, { useEffect, useState } from 'react';
import { useProfile } from '../hooks/useProfile';
import { useToast } from '../components/ToastProvider';
import { getInquiryStats, getAllInquiries, Inquiry, InquiryStats, updateInquiryStatus } from '../lib/admin';

const STATUS_OPTIONS = ['new', 'contacted', 'closed'] as const;
type Status = typeof STATUS_OPTIONS[number];

export default function AdminDashboardPage() {
  const { profile } = useProfile();
  const { pushToast } = useToast();

  const [stats, setStats] = useState<InquiryStats | null>(null);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'contacts' | 'applicants' | 'projects'>('contacts');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [statsData, inquiriesData] = await Promise.all([
          getInquiryStats(),
          getAllInquiries()
        ]);
        setStats(statsData);
        setInquiries(inquiriesData);
      } catch (error) {
        pushToast({
          type: 'error',
          message: 'Failed to load dashboard data. Ensure you ran the updated supabase/setup.sql and inquiries table exists.'
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [pushToast]);

  const filteredInquiries = inquiries.filter(inq => {
    if (activeTab === 'contacts') return inq.context === 'contact';
    if (activeTab === 'applicants') return inq.context === 'career';
    if (activeTab === 'projects') return inq.context === 'project';
    return false;
  });

  const handleStatusChange = async (id: string, newStatus: Status) => {
    try {
      setUpdatingId(id);
      await updateInquiryStatus(id, newStatus);
      setInquiries(prev => prev.map(inq =>
        inq.id === id ? { ...inq, status: newStatus } : inq
      ));
      pushToast({ type: 'success', message: `Status updated to ${newStatus}` });
    } catch (error) {
      pushToast({ type: 'error', message: 'Failed to update status' });
    } finally {
      setUpdatingId(null);
    }
  };

  if (!profile) return null;

  const cardClass = 'bg-white/70 dark:bg-green-900/20 rounded-[32px] border border-paper dark:border-green-800 shadow-xl p-6';

  return (
    <div className="pt-32 pb-20 px-4 bg-white dark:bg-[#0a1612] animate-in fade-in duration-500">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex items-start justify-between gap-6 mb-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-saffron text-dark-serpent border-2 border-saffron/30 flex items-center justify-center text-xl font-black">
              🛠️
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-dark-serpent dark:text-white">
                Admin Dashboard
              </h1>
              <p className="mt-1 text-sm font-bold text-green-1 dark:text-green-3 opacity-90">
                Manage inquiries, applicants, and projects. Welcome, <span className="font-black">{profile.username}</span>
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className={`p-12 ${cardClass} text-center`}>
            <div className="text-lg font-bold text-slate-600 dark:text-slate-400">Loading dashboard...</div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
              <div className={`${cardClass}`}>
                <div className="text-2xl font-black text-saffron">📊 {stats?.total || 0}</div>
                <div className="text-sm font-bold text-green-1 dark:text-green-3 mt-1">Total Inquiries</div>
              </div>
              <div className={`${cardClass}`}>
                <div className="text-xl font-black text-castleton-green">💬 {stats?.contacts || 0}</div>
                <div className="text-sm font-bold text-green-1 dark:text-green-3 mt-1">Contact Messages</div>
              </div>
              <div className={`${cardClass}`}>
                <div className="text-xl font-black text-blue-600">👥 {stats?.applicants || 0}</div>
                <div className="text-sm font-bold text-green-1 dark:text-green-3 mt-1">Applicants</div>
              </div>
              <div className={`${cardClass}`}>
                <div className="text-xl font-black text-purple-600">🚀 {stats?.projects || 0}</div>
                <div className="text-sm font-bold text-green-1 dark:text-green-3 mt-1">Project Requests</div>
              </div>
              <div className={`${cardClass}`}>
                <div className="text-xl font-black text-orange-500">✨ {stats?.newThisWeek || 0}</div>
                <div className="text-sm font-bold text-green-1 dark:text-green-3 mt-1">New This Week</div>
              </div>
            </div>

            {/* Tabs */}
            <div className={`${cardClass} mb-10`}>
              <div className="flex border-b border-paper dark:border-green-800">
                {[
                  { key: 'contacts' as const, label: 'Contact Messages', icon: '💬', count: stats?.contacts || 0 },
                  { key: 'applicants' as const, label: 'Applicants', icon: '👥', count: stats?.applicants || 0 },
                  { key: 'projects' as const, label: 'Projects', icon: '🚀', count: stats?.projects || 0 }
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-6 py-4 font-black text-sm uppercase tracking-wider transition-all ${
                      activeTab === tab.key
                        ? 'text-saffron border-b-2 border-saffron'
                        : 'text-green-2 dark:text-green-4 hover:text-castleton-green'
                    }`}
                  >
                    {tab.icon} {tab.label} ({tab.count})
                  </button>
                ))}
              </div>
            </div>

            {/* Inquiries Table */}
            <div className={`${cardClass}`}>
              {filteredInquiries.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="text-4xl mb-4">📭</div>
                  <div className="text-lg font-bold text-slate-600 dark:text-slate-400 mb-2">No {activeTab} yet</div>
                  <div className="text-sm text-green-2 dark:text-green-4">Inquiries will appear here when submitted.</div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-paper dark:border-green-800">
                        <th className="text-left py-4 pr-4 font-black text-sm uppercase text-green-2 dark:text-green-4 tracking-wider w-16">Date</th>
                        <th className="text-left py-4 pr-4 font-black text-sm uppercase text-green-2 dark:text-green-4 tracking-wider">Name</th>
                        <th className="text-left py-4 pr-4 font-black text-sm uppercase text-green-2 dark:text-green-4 tracking-wider">Email</th>
                        <th className="text-left py-4 pr-4 font-black text-sm uppercase text-green-2 dark:text-green-4 tracking-wider min-w-[300px]">Message</th>
                        <th className="text-left py-4 font-black text-sm uppercase text-green-2 dark:text-green-4 tracking-wider w-32">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInquiries.map(inquiry => {
                        const date = new Date(inquiry.created_at).toLocaleDateString();
                        return (
                          <tr key={inquiry.id} className="border-b border-paper/50 dark:border-green-900/50 last:border-b-0 hover:bg-paper/50 dark:hover:bg-green-900/10">
                            <td className="py-4 pr-4 text-sm font-semibold text-dark-serpent dark:text-white">{date}</td>
                            <td className="py-4 pr-4">
                              <div className="font-black text-dark-serpent dark:text-white">{inquiry.name || '—'}</div>
                            </td>
                            <td className="py-4 pr-4">
                              <div className="font-mono text-sm text-green-2 dark:text-green-4 break-all">{inquiry.email}</div>
                            </td>
                            <td className="py-4 pr-4 max-w-[300px] truncate">
                              <div className="text-sm font-semibold text-dark-serpent dark:text-white line-clamp-2">{inquiry.message}</div>
                            </td>
                            <td className="py-4">
                              <select
                                value={inquiry.status || 'new'}
                                onChange={e => handleStatusChange(inquiry.id, e.target.value as Status)}
                                disabled={updatingId === inquiry.id}
                                className="px-3 py-1.5 bg-white/70 dark:bg-green-900/30 border border-paper dark:border-green-800 rounded-xl text-sm font-black focus:border-saffron focus:outline-none transition-all disabled:opacity-70"
                              >
                                {STATUS_OPTIONS.map(status => (
                                  <option key={status} value={status}>{status.toUpperCase()}</option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}