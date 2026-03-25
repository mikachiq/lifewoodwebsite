import React from 'react';
import AdminShell from '../components/admin/AdminShell';
import { createHRPosition, deleteHRPosition, HRPosition, listAdminHRPositions, notifyUsersNewPosition } from '../lib/hrPositions';
import { useToast } from '../components/ToastProvider';
import { getSupabase } from '../lib/supabaseClient';
import { logAdminAction } from '../lib/adminLogs';

type PositionWithCount = HRPosition & { applicantCount: number };

function prettifyFormType(value: HRPosition['application_form_type']) {
  return value === 'intern' ? 'AI Intern Special' : 'Standard';
}

const TITLE_ACRONYMS = new Set(['ai', 'hr', 'it', 'qa', 'ui', 'ux', 'nlp', 'ml', 'api']);
function toTitleCase(str: string): string {
  return str.trim().split(/\s+/).map(word =>
    TITLE_ACRONYMS.has(word.toLowerCase())
      ? word.toUpperCase()
      : word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

export default function AdminHiringPage() {
  const { pushToast } = useToast();
  const [positions, setPositions] = React.useState<PositionWithCount[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [removingId, setRemovingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({
    title: '',
    department: '',
    employmentType: 'Full-Time',
    location: '',
    workMode: 'Onsite',
    compensation: '',
    applicationFormType: 'standard' as 'standard' | 'intern',
    details: '',
    qualifications: '',
  });

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      const [allPositions, applicantsResult] = await Promise.all([
        listAdminHRPositions(),
        getSupabase().from('hr_applicants').select('role'),
      ]);

      if (applicantsResult.error) throw applicantsResult.error;
      const applicantRoles = (applicantsResult.data || []).map(row => String(row.role || '').trim().toLowerCase());

      const next = allPositions.map(position => {
        const id = position.id.trim().toLowerCase();
        const title = position.title.trim().toLowerCase();
        const applicantCount = applicantRoles.filter(role => role === id || role === title).length;
        return { ...position, applicantCount };
      });

      setPositions(next);
    } catch (error) {
      console.error('[AdminHiringPage] load error', error);
      pushToast({ type: 'error', message: error instanceof Error ? error.message : 'Failed to load positions.' });
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setSaving(true);
      const created = await createHRPosition({
        title: toTitleCase(form.title),
        department: form.department,
        employmentType: form.employmentType,
        location: form.location,
        workMode: form.workMode,
        compensation: form.compensation,
        applicationFormType: form.applicationFormType,
        details: form.details,
        qualifications: form.qualifications
          .split(/\r?\n/)
          .map(item => item.trim())
          .filter(Boolean),
      });

      void logAdminAction('position_created', 'hr_position', created.title);
      setPositions(prev => [{ ...created, applicantCount: 0 }, ...prev]);
      setForm({
        title: '',
        department: '',
        employmentType: 'Full-Time',
        location: '',
        workMode: 'Onsite',
        compensation: '',
        applicationFormType: 'standard',
        details: '',
        qualifications: '',
      });
      pushToast({ type: 'success', message: 'Position added.' });
      void notifyUsersNewPosition(created.title).catch(err => {
        console.warn('[AdminHiringPage] Failed to send new position notifications:', err);
      });
    } catch (error) {
      console.error('[AdminHiringPage] create error', error);
      pushToast({ type: 'error', message: error instanceof Error ? error.message : 'Failed to add position.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setRemovingId(id);
      const pos = positions.find(p => p.id === id);
      await deleteHRPosition(id);
      void logAdminAction('position_deleted', 'hr_position', pos?.title ?? id);
      setPositions(prev => prev.filter(position => position.id !== id));
      pushToast({ type: 'success', message: 'Position deleted.' });
    } catch (error) {
      console.error('[AdminHiringPage] delete error', error);
      pushToast({ type: 'error', message: error instanceof Error ? error.message : 'Failed to delete position.' });
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <AdminShell
      title="Hiring"
      subtitle="Add and manage open positions for the careers page."
      onRefresh={() => void load()}
      refreshing={loading}
      actions={
        <div className="flex items-center gap-3">
          <a
            href="/#job-board"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 rounded-xl border border-[#d8cfbf] text-[#1a3a2a] font-black text-sm bg-white hover:bg-[#f2ece0] transition-colors"
          >
            View Careers Page
          </a>
          <span className="px-4 py-2.5 rounded-xl border border-[#d8cfbf] text-[#1a3a2a] font-black text-sm bg-white">
            {positions.filter(position => position.is_active).length} Active Roles
          </span>
        </div>
      }
    >
      <div className="space-y-5">
        <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-[#e8e3da] shadow-sm p-5">
          <h2 className="text-base font-black text-[#1a2e1a] mb-3">Add Position</h2>
          <div className="space-y-2.5">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5">
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Position title"
                className="col-span-2 lg:col-span-2 w-full rounded-xl border border-[#dfd7ca] px-3 py-2.5 text-sm font-semibold text-[#1a2e1a] focus:outline-none focus:border-[#1a3a2a]"
                required
              />
              <input
                name="department"
                value={form.department}
                onChange={handleChange}
                placeholder="Department"
                className="w-full rounded-xl border border-[#dfd7ca] px-3 py-2.5 text-sm font-semibold text-[#1a2e1a] focus:outline-none focus:border-[#1a3a2a]"
              />
              <input
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="Location"
                className="w-full rounded-xl border border-[#dfd7ca] px-3 py-2.5 text-sm font-semibold text-[#1a2e1a] focus:outline-none focus:border-[#1a3a2a]"
              />
              <input
                name="workMode"
                value={form.workMode}
                onChange={handleChange}
                placeholder="Work mode"
                className="w-full rounded-xl border border-[#dfd7ca] px-3 py-2.5 text-sm font-semibold text-[#1a2e1a] focus:outline-none focus:border-[#1a3a2a]"
              />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
              <input
                name="employmentType"
                value={form.employmentType}
                onChange={handleChange}
                placeholder="Employment type"
                className="w-full rounded-xl border border-[#dfd7ca] px-3 py-2.5 text-sm font-semibold text-[#1a2e1a] focus:outline-none focus:border-[#1a3a2a]"
              />
              <input
                name="compensation"
                value={form.compensation}
                onChange={handleChange}
                placeholder="Compensation"
                className="w-full rounded-xl border border-[#dfd7ca] px-3 py-2.5 text-sm font-semibold text-[#1a2e1a] focus:outline-none focus:border-[#1a3a2a]"
              />
              <select
                name="applicationFormType"
                value={form.applicationFormType}
                onChange={handleChange}
                className="col-span-2 w-full rounded-xl border border-[#dfd7ca] px-3 py-2.5 text-sm font-semibold text-[#1a2e1a] bg-white focus:outline-none focus:border-[#1a3a2a]"
              >
                <option value="standard">Standard Application Form</option>
                <option value="intern">Intern Application Form</option>
              </select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
              <textarea
                name="details"
                value={form.details}
                onChange={handleChange}
                placeholder="Other details (responsibilities, setup, team notes)"
                rows={2}
                className="w-full rounded-xl border border-[#dfd7ca] px-3 py-2.5 text-sm font-semibold text-[#1a2e1a] focus:outline-none focus:border-[#1a3a2a] resize-none"
              />
              <textarea
                name="qualifications"
                value={form.qualifications}
                onChange={handleChange}
                placeholder="Qualifications"
                rows={2}
                className="w-full rounded-xl border border-[#dfd7ca] px-3 py-2.5 text-sm font-semibold text-[#1a2e1a] focus:outline-none focus:border-[#1a3a2a] resize-none overflow-hidden"
                onInput={e => { const el = e.currentTarget; el.style.height = 'auto'; el.style.height = `${el.scrollHeight}px`; }}
              />
            </div>
          </div>

          <div className="flex justify-end mt-3">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-[#1a3a2a] text-white font-black text-sm hover:bg-[#29513a] transition-colors disabled:opacity-60"
            >
              {saving ? 'Adding...' : 'Add Position'}
            </button>
          </div>
        </form>

        <div className="bg-white rounded-2xl border border-[#e8e3da] shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-sm font-medium text-[#8a9a8a]">Loading positions...</div>
          ) : positions.length === 0 ? (
            <div className="py-16 text-center text-sm font-medium text-[#8a9a8a]">No positions added yet.</div>
          ) : (
            <table className="w-full min-w-max">
              <thead>
                <tr className="border-b border-[#f0ebe2] bg-[#faf8f4]">
                  {['Title', 'Department', 'Compensation', 'Applicants', 'Form', 'Action'].map(header => (
                    <th key={header} className="px-4 py-3 text-left text-[10px] font-black text-[#8a9a8a] uppercase tracking-widest">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {positions.map(position => (
                  <tr key={position.id} className="border-b border-[#f7f4ef] last:border-0">
                    <td className="px-4 py-3">
                      <p className="text-sm font-black text-[#1a2e1a]">{position.title}</p>
                      <p className="text-xs text-[#8a9a8a] mt-1">
                        {[position.location, position.work_mode].filter(Boolean).join(' / ') || '-'}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#5a7a6a]">{position.department || '-'}</td>
                    <td className="px-4 py-3 text-sm text-[#5a7a6a]">{position.compensation || '-'}</td>
                    <td className="px-4 py-3 text-sm text-[#1a2e1a] font-semibold">{position.applicantCount}</td>
                    <td className="px-4 py-3 text-sm text-[#5a7a6a]">{prettifyFormType(position.application_form_type)}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => void handleDelete(position.id)}
                        disabled={removingId === position.id}
                        className="text-sm font-black text-red-500 hover:text-red-600 disabled:opacity-60"
                      >
                        {removingId === position.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
