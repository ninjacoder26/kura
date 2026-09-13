import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || url === 'your-project-url' || key === 'your-anon-key') {
    // Return a proxy that gracefully handles all calls when not configured
    return new Proxy({} as ReturnType<typeof createBrowserClient>, {
      get(_target, prop) {
        if (prop === 'auth') {
          return {
            getUser: async () => ({ data: { user: null }, error: null }),
            getSession: async () => ({ data: { session: null }, error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
            signUp: async () => ({ data: { user: null, session: null }, error: { message: 'Supabase not configured. Set up .env file.' } }),
            signInWithPassword: async () => ({ data: { user: null, session: null }, error: { message: 'Supabase not configured. Set up .env file.' } }),
            signOut: async () => ({ error: null }),
          };
        }
        if (prop === 'from') {
          return () => ({
            select: () => ({ data: null, error: { message: 'Supabase not configured' } }),
            insert: () => ({ data: null, error: { message: 'Supabase not configured' } }),
            update: () => ({ data: null, error: { message: 'Supabase not configured' } }),
            delete: () => ({ data: null, error: { message: 'Supabase not configured' } }),
            eq: function() { return this; },
            single: function() { return this; },
            order: function() { return this; },
            limit: function() { return this; },
            ilike: function() { return this; },
            or: function() { return this; },
          });
        }
        return () => {};
      },
    });
  }

  return createBrowserClient(url, key);
}
