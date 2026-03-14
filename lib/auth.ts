import { getSupabase } from './supabaseClient';

export type EmailPasswordSignUp = {
  name: string;
  email: string;
  password: string;
};

export type SignUpResult = {
  emailConfirmationLikely: boolean;
};

export async function signUpWithEmailPassword(payload: EmailPasswordSignUp): Promise<SignUpResult> {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.signUp({
    email: payload.email,
    password: payload.password,
    options: {
      data: { name: payload.name },
    },
  });

  if (error) throw error;

  return { emailConfirmationLikely: !data.session };
}
