import { getSupabase } from './supabaseClient';

export type Inquiry = {
  id: string;
  created_at: string;
  email: string;
  name: string;
  organization: string | null;
  position: string | null;
  message: string;
  context: 'contact' | 'career' | 'project';
  status: 'new' | 'read' | 'resolved' | 'under review' | 'shortlisted' | 'rejected' | 'reviewed' | 'in progress';
};

export type InquiryStats = {
  total: number;
  contacts: number;
  applicants: number;
  projects: number;
  newThisWeek: number;
};

export async function getAllInquiries(): Promise<Inquiry[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('inquiries')
    .select('id, created_at, email, name, organization, position, message, context, status')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getInquiryStats(): Promise<InquiryStats> {
  const supabase = getSupabase();
  
  const { count: total } = await supabase
    .from('inquiries')
    .select('*', { count: 'exact', head: true });

  const { count: contacts } = await supabase
    .from('inquiries')
    .select('*', { count: 'exact', head: true })
    .eq('context', 'contact');

  const { count: applicants } = await supabase
    .from('inquiries')
    .select('*', { count: 'exact', head: true })
    .eq('context', 'career');

  const { count: projects } = await supabase
    .from('inquiries')
    .select('*', { count: 'exact', head: true })
    .eq('context', 'project');

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count: newThisWeek } = await supabase
    .from('inquiries')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', oneWeekAgo);

  return {
    total: total || 0,
    contacts: contacts || 0,
    applicants: applicants || 0,
    projects: projects || 0,
    newThisWeek: newThisWeek || 0,
  };
}

export async function updateInquiryStatus(id: string, status: string) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('inquiries')
    .update({ status })
    .eq('id', id);

  if (error) throw error;
}

