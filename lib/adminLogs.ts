import { getSupabase } from './supabaseClient';

export type AdminLogEntry = {
  id: string;
  admin_id: string | null;
  admin_email: string;
  admin_name: string | null;
  action: string;
  target_type: string | null;
  target_name: string | null;
  details: string | null;
  remarks: string | null;
  created_at: string;
};

export async function logAdminAction(
  action: string,
  targetType: string,
  targetName: string,
  details?: string,
) {
  try {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: prof } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single();

    await supabase.from('admin_logs').insert({
      admin_id: user.id,
      admin_email: user.email ?? '',
      admin_name: prof?.username ?? user.email ?? '',
      action,
      target_type: targetType,
      target_name: targetName,
      details: details ?? null,
    });
  } catch {
    // Logging failure should never break the main action
  }
}

export async function fetchAllAdminLogs(): Promise<AdminLogEntry[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('admin_logs')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as AdminLogEntry[];
}

export async function fetchAdminLogs(page = 1, pageSize = 20): Promise<{ logs: AdminLogEntry[]; total: number }> {
  const supabase = getSupabase();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await supabase
    .from('admin_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;
  return { logs: (data || []) as AdminLogEntry[], total: count || 0 };
}

export async function updateLogRemarks(id: string, remarks: string) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('admin_logs')
    .update({ remarks: remarks.trim() || null })
    .eq('id', id);
  if (error) throw error;
}

export async function clearAdminLogs() {
  const supabase = getSupabase();
  const { error } = await supabase.from('admin_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) throw error;
}
