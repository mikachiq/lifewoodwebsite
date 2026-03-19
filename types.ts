
export type Language = 'en' | 'zh' | 'ms' | 'tl' | 'bn' | 'hi' | 'es' | 'ja' | 'ko';
export type View = 'home' | 'project' | 'explore' | 'company';

export interface TranslationSet {
  [key: string]: string;
}

export type Translations = {
  [key in Language]: TranslationSet;
};

export interface AppState {
  language: Language;
  theme: 'light' | 'dark';
  isModalOpen: boolean;
  currentView: View;
}

export interface Profile {
  id: string;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  updated_at: string | null;
}
