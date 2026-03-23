import { getSupabase } from './supabaseClient';

export type HRPosition = {
  id: string;
  title: string;
  department: string | null;
  employment_type: string | null;
  location: string | null;
  work_mode: string | null;
  compensation: string | null;
  application_form_type: 'standard' | 'intern';
  details: string | null;
  qualifications: string[];
  is_active: boolean;
  created_at: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function fetchPublicHRPositions() {
  const response = await fetch('/api/public/positions');
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Failed to load positions.');
  }
  return (await response.json()) as HRPosition[];
}

export async function listAdminHRPositions() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('hr_positions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as HRPosition[];
}

export async function createHRPosition(input: {
  title: string;
  department?: string;
  employmentType?: string;
  location?: string;
  workMode?: string;
  compensation?: string;
  applicationFormType?: 'standard' | 'intern';
  details?: string;
  qualifications?: string[];
}) {
  const supabase = getSupabase();
  const title = input.title.trim();
  if (!title) throw new Error('Position title is required.');

  const baseId = slugify(title) || 'position';
  const id = `${baseId}-${Math.random().toString(36).slice(2, 8)}`;

  const payload = {
    id,
    title,
    department: input.department?.trim() || null,
    employment_type: input.employmentType?.trim() || null,
    location: input.location?.trim() || null,
    work_mode: input.workMode?.trim() || null,
    compensation: input.compensation?.trim() || null,
    application_form_type: input.applicationFormType || 'standard',
    details: input.details?.trim() || null,
    qualifications: (input.qualifications || []).filter(Boolean),
    is_active: true,
  };

  const { data, error } = await supabase
    .from('hr_positions')
    .insert(payload)
    .select('*')
    .single();

  if (error) throw error;
  return data as HRPosition;
}

export async function deleteHRPosition(id: string) {
  const supabase = getSupabase();
  const { error } = await supabase.from('hr_positions').delete().eq('id', id);
  if (error) throw error;
}
