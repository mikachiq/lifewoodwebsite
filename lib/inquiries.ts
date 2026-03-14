import { getSupabase } from './supabaseClient';

export type InquiryInsert = {
  name: string;
  email: string;
  organization: string;
  message: string;
};

export async function createInquiry(payload: InquiryInsert) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('inquiries')
    .insert({
      name: payload.name,
      email: payload.email,
      organization: payload.organization,
      message: payload.message,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}
