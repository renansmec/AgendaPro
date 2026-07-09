import { createClient, User } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://khmovwmazpqlrawjauyo.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtobW92d21henBxbHJhd2phdXlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1NTYwMjAsImV4cCI6MjA5OTEzMjAyMH0.FhOouoUHHglulI0WsQST4hgltsPRXoTKMnaSr2A-4sM";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: (error?: any) => void
) => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) {
      cachedAccessToken = session.provider_token || null;
      if (onAuthSuccess) onAuthSuccess(session.user, cachedAccessToken);
    } else {
      if (onAuthFailure) onAuthFailure();
    }
  });

  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
      cachedAccessToken = session.provider_token || null;
      if (onAuthSuccess) onAuthSuccess(session.user, cachedAccessToken);
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
  return () => {
    subscription.unsubscribe();
  };
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      scopes: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly',
      redirectTo: window.location.origin,
    }
  });
  if (error) throw error;
  return null;
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await supabase.auth.signOut();
  cachedAccessToken = null;
};
