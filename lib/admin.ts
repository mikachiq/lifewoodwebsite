import { getSupabase } from './supabaseClient';

export type Inquiry = {
  id: string;
  created_at: string;
  email: string;
  name: string;
  message: string;
  context: 'contact' | 'career' | 'project';
  status: 'new' | 'contacted' | 'closed';
  position: string | null;
  organization: string | null;
  // career fields
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  country: string | null;
  city: string | null;
  experience: string | null;
  work_location: string | null;
  availability: string | null;
  languages: string | null;
  skills: string | null;
  cover_letter: string | null;
  linkedin: string | null;
  portfolio: string | null;
  additional_info: string | null;
  university: string | null;
  course_program: string | null;
  internship_hours: string | null;
  // project fields
  role: string | null;
  service: string | null;
  engagement_model: string | null;
  data_volume: string | null;
  tech_stack: string | null;
  success_criteria: string | null;
  attachment_url: string | null;
  attachment_name: string | null;
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
    .select('id, created_at, email, name, message, context, status, position, organization, first_name, last_name, phone, country, city, experience, work_location, availability, languages, skills, cover_letter, linkedin, portfolio, additional_info, university, course_program, internship_hours, role, service, engagement_model, data_volume, tech_stack, success_criteria, attachment_url, attachment_name')
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

export async function deleteInquiry(id: string) {
  const supabase = getSupabase();
  const { error, count } = await supabase
    .from('inquiries')
    .delete({ count: 'exact' })
    .eq('id', id);

  if (error) throw error;
  if (count === 0) throw new Error('Delete blocked — check Supabase RLS policies for inquiries.');
}

