import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: {
      getItem: async (key: string): Promise<string | null> => {
        return new Promise((resolve) => {
          chrome.storage.local.get([key], (result) => {
            const val = result[key];
            resolve(typeof val === 'string' ? val : null);
          });
        });
      },
      setItem: async (key: string, value: string) => {
        return new Promise((resolve) => { 
          chrome.storage.local.set({ [key]: value }, () => resolve());
        });
      },
      removeItem: async (key: string) => {
        return new Promise((resolve) => {
          chrome.storage.local.remove([key], () => resolve());
        });
      }
    },
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});
