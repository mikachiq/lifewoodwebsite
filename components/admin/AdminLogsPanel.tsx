import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AdminLogEntry, clearAdminLogs, fetchAdminLogs, updateLogRemarks } from '../../lib/adminLogs';
import { useConfirm } from '../ConfirmModal';
import { useToast } from '../ToastProvider';

const PAGE_SIZE = 10;

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function actionLabel(action: string) {
  const map: Record<string, string> = {
    replied_to_inquiry: 'Replied to inquiry',
    replied_to_application: 'Replied to application',
    replied_to_project: 'Replied to project request',
    status_changed: 'Changed status',
    deleted_inquiry: 'Deleted inquiry',
    deleted_application: 'Deleted application',
    deleted_applicant: 'Deleted applicant',
    applicant_stage_changed: 'Changed applicant stage',
    applicant_rejected: 'Rejected applicant',
    applicant_hired: 'Marked as hired',
    email_sent: 'Sent email',
    post_published: 'Published post',
    post_archived: 'Archived post',
    post_deleted: 'Deleted post',
    position_created: 'Created job position',
    position_deleted: 'Deleted job position',
  };
  return map[action] ?? action.replace(/_/g, ' ');
}

function actionColor(action: string) {
  if (action.includes('deleted') || action.includes('rejected')) return 'bg-red-100 text-red-700 border-red-200';
  if (action.includes('replied') || action.includes('email')) return 'bg-blue-100 text-blue-700 border-blue-200';
  if (action.includes('published') || action.includes('hired') || action.includes('created')) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (action.includes('stage') || action.includes('status')) return 'bg-amber-100 text-amber-700 border-amber-200';
  return 'bg-slate-100 text-slate-600 border-slate-200';
}

const DELETION_ACTIONS = new Set(['deleted_inquiry', 'deleted_application', 'deleted_applicant']);

function SnapshotModal({ log, onClose }: { log: AdminLogEntry; onClose: () => void }) {
  let fields: { label: string; value: string }[] = [];
  try {
    if (log.details) {
      const parsed = JSON.parse(log.details) as Record<string, string>;
      fields = Object.entries(parsed).map(([label, value]) => ({ label, value }));
    }
  } catch { /* ignore */ }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl border border-[#e8e3da] w-full max-w-md mx-4 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0ebe2]">
          <div>
            <h3 className="font-black text-[#1a2e1a] text-sm">Deleted Entry</h3>
            <p className="text-[11px] text-[#8a9a8a] mt-0.5">{log.target_name}</p>
          </div>
          <button onClick={onClose} className="text-[#8a9a8a] hover:text-[#1a2e1a] transition-colors p-1 rounded-lg hover:bg-[#f2ece0]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="px-5 py-4 max-h-[60vh] overflow-y-auto space-y-3">
          {fields.length === 0 ? (
            <p className="text-xs text-[#8a9a8a] text-center py-4">No snapshot available for this entry.</p>
          ) : fields.map(({ label, value }) => (
            <div key={label}>
              <p className="text-[10px] font-black text-[#8a9a8a] uppercase tracking-wider mb-0.5">{label}</p>
              <p className="text-xs text-[#1a2e1a] whitespace-pre-wrap break-words">{value}</p>
            </div>
          ))}
        </div>
        <div className="px-5 py-3 border-t border-[#f0ebe2] flex justify-end">
          <button onClick={onClose} className="px-4 py-1.5 text-xs font-bold rounded-xl bg-[#1a3a2a] text-white hover:bg-[#2a4a3a] transition-colors">Close</button>
        </div>
      </div>
    </div>
  );
}

function RemarksCell({ log }: { log: AdminLogEntry }) {
  const [value, setValue] = useState(log.remarks ?? '');
  const [saving, setSaving] = useState(false);
  const original = useRef(log.remarks ?? '');

  const save = async () => {
    if (value.trim() === original.current.trim()) return;
    try {
      setSaving(true);
      await updateLogRemarks(log.id, value);
      original.current = value.trim();
    } catch {
      setValue(original.current);
    } finally {
      setSaving(false);
    }
  };

  return (
    <textarea
      value={value}
      onChange={e => setValue(e.target.value)}
      onBlur={() => void save()}
      rows={1}
      placeholder="Add remark…"
      disabled={saving}
      className="w-full min-w-[140px] resize-none overflow-hidden rounded-lg border border-transparent bg-transparent px-2 py-1 text-xs text-[#4a6a5a] placeholder-[#b0c0b4] focus:border-[#c5dac8] focus:bg-white focus:outline-none transition-colors disabled:opacity-50"
      onInput={e => { const el = e.currentTarget; el.style.height = 'auto'; el.style.height = `${el.scrollHeight}px`; }}
      style={{ height: 'auto', minHeight: '1.5rem' }}
    />
  );
}

export default function AdminLogsPanel({ isSuperAdmin, refreshKey }: { isSuperAdmin: boolean; refreshKey?: number }) {
  const { pushToast } = useToast();
  const { confirm, modal: confirmModal } = useConfirm();
  const [logs, setLogs] = useState<AdminLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [initialLoading, setInitialLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [adminFilter, setAdminFilter] = useState<string>('all');
  const [snapshotLog, setSnapshotLog] = useState<AdminLogEntry | null>(null);

  const load = useCallback(async (p: number, isInitial = false) => {
    try {
      if (isInitial) setInitialLoading(true);
      else setFetching(true);
      const result = await fetchAdminLogs(p, PAGE_SIZE);
      setLogs(result.logs);
      setTotal(result.total);
    } catch {
      pushToast({ type: 'error', message: 'Failed to load logs.' });
    } finally {
      setInitialLoading(false);
      setFetching(false);
    }
  }, [pushToast]);

  useEffect(() => { void load(1, true); setPage(1); }, [refreshKey, load]);
  useEffect(() => { void load(page); }, [page, load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const adminOptions = ['all', ...Array.from(new Set(logs.map(l => l.admin_email)))];
  const visibleLogs = adminFilter === 'all' ? logs : logs.filter(l => l.admin_email === adminFilter);

  const handleClear = async () => {
    if (!await confirm('Clear all admin logs? This cannot be undone.', { confirmLabel: 'Clear All', danger: true })) return;
    try {
      setClearing(true);
      await clearAdminLogs();
      setLogs([]);
      setTotal(0);
      setPage(1);
      pushToast({ type: 'success', message: 'All logs cleared.' });
    } catch {
      pushToast({ type: 'error', message: 'Failed to clear logs.' });
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#e8e3da] shadow-sm overflow-hidden">
      {confirmModal}
      {snapshotLog && <SnapshotModal log={snapshotLog} onClose={() => setSnapshotLog(null)} />}
      <div className="px-6 py-4 border-b border-[#f0ebe2] flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <h2 className="font-black text-[#1a2e1a] text-base">Activity Logs</h2>
          <span className="text-xs font-bold text-[#8a9a8a] bg-[#f2ece0] px-3 py-1 rounded-full">
            {total} total
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={adminFilter}
            onChange={e => setAdminFilter(e.target.value)}
            className="text-xs font-semibold border border-[#e0d9ce] rounded-xl px-3 py-1.5 bg-white text-[#1a2e1a] focus:outline-none"
          >
            {adminOptions.map(opt => (
              <option key={opt} value={opt}>
                {opt === 'all' ? 'All Admins' : opt}
              </option>
            ))}
          </select>
          {isSuperAdmin && (
            <button
              onClick={() => void handleClear()}
              disabled={clearing || logs.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#fff1ee] text-[#a64534] border border-[#f0c9bf] text-xs font-bold rounded-xl hover:bg-[#ffe5df] transition-colors disabled:opacity-50"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      <div>
        <table className="w-full table-fixed text-sm">
          <colgroup>
            <col style={{ width: '150px' }} />
            <col style={{ width: '150px' }} />
            <col style={{ width: '270px' }} />
            <col style={{ width: '170px' }} />
            <col style={{ width: '230px' }} />
            <col />
          </colgroup>
          <thead>
            <tr className="border-b border-[#f0ebe2] bg-[#faf8f5]">
              <th className="px-4 py-3 text-left text-[10px] font-black text-[#8a9a8a] uppercase tracking-wider">Timestamp</th>
              <th className="px-4 py-3 text-left text-[10px] font-black text-[#8a9a8a] uppercase tracking-wider">Admin</th>
              <th className="px-4 py-3 text-left text-[10px] font-black text-[#8a9a8a] uppercase tracking-wider">Action</th>
              <th className="px-4 py-3 text-left text-[10px] font-black text-[#8a9a8a] uppercase tracking-wider">Target</th>
              <th className="px-4 py-3 text-left text-[10px] font-black text-[#8a9a8a] uppercase tracking-wider">Details</th>
              <th className="px-4 py-3 text-left text-[10px] font-black text-[#8a9a8a] uppercase tracking-wider">Remarks</th>
            </tr>
          </thead>
          <tbody className={fetching ? 'opacity-50 pointer-events-none transition-opacity' : 'transition-opacity'}>
            {initialLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-xs text-[#8a9a8a]">Loading…</td>
              </tr>
            ) : visibleLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-xs text-[#8a9a8a]">No activity logged yet.</td>
              </tr>
            ) : visibleLogs.map(log => (
              <tr key={log.id} className="border-b border-[#f7f4ef] hover:bg-[#faf8f5] transition-colors align-top">
                <td className="px-4 py-3 text-[11px] text-[#6a8a7a] whitespace-nowrap">{fmtDate(log.created_at)}</td>
                <td className="px-4 py-3">
                  <div className="text-xs font-black text-[#1a2e1a] truncate">{log.admin_name}</div>
                  <div className="text-[10px] text-[#8a9a8a] truncate">{log.admin_email}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border ${actionColor(log.action)}`}>
                    {actionLabel(log.action)}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs font-semibold text-[#1a2e1a] whitespace-normal break-words">{log.target_name || '—'}</td>
                <td className="px-4 py-3 text-xs text-[#6a8a7a] whitespace-normal break-words">
                  {DELETION_ACTIONS.has(log.action) && log.details ? (
                    <button
                      onClick={() => setSnapshotLog(log)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#f2ece0] text-[#1a3a2a] border border-[#d9d0c0] text-[10px] font-black rounded-lg hover:bg-[#e8e0d0] transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      View
                    </button>
                  ) : (
                    log.details || '—'
                  )}
                </td>
                <td className="px-2 py-2"><RemarksCell log={log} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-6 py-3 border-t border-[#f0ebe2]">
        <span className="text-xs text-[#8a9a8a]">
          Page {page} of {totalPages}
        </span>
        <div className="flex items-center gap-1">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="px-4 py-1.5 text-xs font-bold rounded-lg border border-[#1a3a2a] text-[#1a3a2a] bg-white disabled:opacity-30 hover:bg-[#1a3a2a] hover:text-white transition-colors"
          >
            ← Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
            .reduce<(number | '...')[]>((acc, n, idx, arr) => {
              if (idx > 0 && n - (arr[idx - 1] as number) > 1) acc.push('...');
              acc.push(n);
              return acc;
            }, [])
            .map((item, idx) =>
              item === '...' ? (
                <span key={`ellipsis-${idx}`} className="px-2 text-xs text-[#8a9a8a]">…</span>
              ) : (
                <button
                  key={item}
                  onClick={() => setPage(item as number)}
                  className={`w-8 h-8 text-xs font-bold rounded-lg border transition-colors ${
                    page === item
                      ? 'bg-[#1a3a2a] text-white border-[#1a3a2a]'
                      : 'border-[#c0c8c0] text-[#1a3a2a] bg-white hover:bg-[#f2ece0]'
                  }`}
                >
                  {item}
                </button>
              )
            )}
          <button
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
            className="px-4 py-1.5 text-xs font-bold rounded-lg border border-[#1a3a2a] text-[#1a3a2a] bg-white disabled:opacity-30 hover:bg-[#1a3a2a] hover:text-white transition-colors"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
