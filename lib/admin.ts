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
  role: string | null;
  service: string | null;
  engagement_model: string | null;
  data_volume: string | null;
  tech_stack: string | null;
  success_criteria: string | null;
  attachment_url: string | null;
  attachment_name: string | null;
  source?: 'inquiries' | 'hr_applicants';
  pipeline_status?: string | null;
};

export type InquiryStats = {
  total: number;
  contacts: number;
  applicants: number;
  projects: number;
  newThisWeek: number;
  closed: number;
};

function splitName(name: string | null): { firstName: string | null; lastName: string | null } {
  const trimmed = (name || '').trim();
  if (!trimmed) return { firstName: null, lastName: null };
  const parts = trimmed.split(/\s+/);
  return {
    firstName: parts[0] || null,
    lastName: parts.slice(1).join(' ') || null,
  };
}

function parseApplicantNotes(notes: string | null): Record<string, string | null> {
  if (!notes) return {};
  try {
    const parsed = JSON.parse(notes) as Record<string, unknown>;
    const read = (key: string) => {
      const value = parsed[key];
      return typeof value === 'string' && value.trim() ? value : null;
    };
    return {
      phone: read('phone'),
      experience: read('experience'),
      workLocation: read('workLocation'),
      availability: read('availability'),
      languages: read('languages'),
      skills: read('skills'),
      coverLetter: read('coverLetter'),
      linkedin: read('linkedin'),
      portfolio: read('portfolio'),
      additionalInfo: read('additionalInfo'),
      university: read('university'),
      courseProgram: read('courseProgram'),
      internshipHours: read('internshipHours'),
    };
  } catch {
    return {};
  }
}

function fileNameFromUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const pathname = new URL(url).pathname;
    return decodeURIComponent(pathname.split('/').pop() || '') || null;
  } catch {
    return null;
  }
}

export async function getAllInquiries(): Promise<Inquiry[]> {
  const supabase = getSupabase();
  const [{ data: inquiriesData, error: inquiriesError }, { data: applicantsData, error: applicantsError }] = await Promise.all([
    supabase
      .from('inquiries')
      .select('id, created_at, email, name, message, context, status, position, organization, first_name, last_name, phone, country, city, experience, work_location, availability, languages, skills, cover_letter, linkedin, portfolio, additional_info, university, course_program, internship_hours, role, service, engagement_model, data_volume, tech_stack, success_criteria, attachment_url, attachment_name')
      .order('created_at', { ascending: false }),
    supabase
      .from('hr_applicants')
      .select('id, created_at, applied_date, email, name, role, status, notes, resume_path'),
  ]);

  if (inquiriesError) throw inquiriesError;
  if (applicantsError) throw applicantsError;

  const mappedInquiries: Inquiry[] = ((inquiriesData as Inquiry[] | null) || []).map(row => ({
    ...row,
    source: 'inquiries',
    pipeline_status: null,
  }));

  const mappedApplicants: Inquiry[] = ((applicantsData as Record<string, unknown>[] | null) || []).map(row => {
    const name = (row.name as string) || '';
    const { firstName, lastName } = splitName(name);
    const notes = parseApplicantNotes((row.notes as string | null) ?? null);
    const resumeUrl = (row.resume_path as string | null) ?? null;

    return {
      id: row.id as string,
      created_at: (row.applied_date as string) || (row.created_at as string),
      email: (row.email as string) || '',
      name,
      message: '',
      context: 'career',
      status: 'new',
      position: (row.role as string) || null,
      organization: null,
      first_name: firstName,
      last_name: lastName,
      phone: notes.phone ?? null,
      country: null,
      city: null,
      experience: notes.experience ?? null,
      work_location: notes.workLocation ?? null,
      availability: notes.availability ?? null,
      languages: notes.languages ?? null,
      skills: notes.skills ?? null,
      cover_letter: notes.coverLetter ?? null,
      linkedin: notes.linkedin ?? null,
      portfolio: notes.portfolio ?? null,
      additional_info: notes.additionalInfo ?? null,
      university: notes.university ?? null,
      course_program: notes.courseProgram ?? null,
      internship_hours: notes.internshipHours ?? null,
      role: (row.role as string) || null,
      service: null,
      engagement_model: null,
      data_volume: null,
      tech_stack: null,
      success_criteria: null,
      attachment_url: resumeUrl,
      attachment_name: fileNameFromUrl(resumeUrl),
      source: 'hr_applicants',
      pipeline_status: (row.status as string | null) ?? null,
    };
  });

  return [...mappedInquiries, ...mappedApplicants].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export async function getInquiryStats(): Promise<InquiryStats> {
  const supabase = getSupabase();
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: inquiriesTotal },
    { count: contacts },
    { count: inquiryApplicants },
    { count: projects },
    { count: inquiriesNewThisWeek },
    { count: hrApplicantsTotal },
    { count: hrApplicantsNewThisWeek },
    { count: closedCount },
  ] = await Promise.all([
    supabase.from('inquiries').select('*', { count: 'exact', head: true }),
    supabase.from('inquiries').select('*', { count: 'exact', head: true }).eq('context', 'contact'),
    supabase.from('inquiries').select('*', { count: 'exact', head: true }).eq('context', 'career'),
    supabase.from('inquiries').select('*', { count: 'exact', head: true }).eq('context', 'project'),
    supabase.from('inquiries').select('*', { count: 'exact', head: true }).gte('created_at', oneWeekAgo),
    supabase.from('hr_applicants').select('*', { count: 'exact', head: true }),
    supabase.from('hr_applicants').select('*', { count: 'exact', head: true }).gte('applied_date', oneWeekAgo),
    supabase.from('inquiries').select('*', { count: 'exact', head: true }).eq('status', 'closed'),
  ]);

  return {
    total: (inquiriesTotal || 0) + (hrApplicantsTotal || 0),
    contacts: contacts || 0,
    applicants: (inquiryApplicants || 0) + (hrApplicantsTotal || 0),
    projects: projects || 0,
    newThisWeek: (inquiriesNewThisWeek || 0) + (hrApplicantsNewThisWeek || 0),
    closed: closedCount || 0,
  };
}

export async function updateInquiryStatus(id: string, status: string, source: Inquiry['source'] = 'inquiries') {
  if (source !== 'inquiries') return;
  const supabase = getSupabase();
  const { error } = await supabase
    .from('inquiries')
    .update({ status })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteInquiry(id: string, source: Inquiry['source'] = 'inquiries') {
  const supabase = getSupabase();

  if (source === 'hr_applicants') {
    const { error, count } = await supabase
      .from('hr_applicants')
      .delete({ count: 'exact' })
      .eq('id', id);

    if (error) throw error;
    if (count === 0) throw new Error('Delete blocked on hr_applicants.');
    return;
  }

  const { error, count } = await supabase
    .from('inquiries')
    .delete({ count: 'exact' })
    .eq('id', id);

  if (error) throw error;
  if (count === 0) throw new Error('Delete blocked - check Supabase RLS policies for inquiries.');
}
