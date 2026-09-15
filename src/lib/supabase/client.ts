import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || url === 'your-project-url' || key === 'your-anon-key') {
    function makeQueryBuilder() {
      const builder: Record<string, any> = {
        select: () => makeResult(),
        insert: () => makeResult(),
        update: () => makeResult(),
        upsert: () => makeResult(),
        delete: () => makeResult(),
        eq: () => builder,
        neq: () => builder,
        gt: () => builder,
        gte: () => builder,
        lt: () => builder,
        lte: () => builder,
        like: () => builder,
        ilike: () => builder,
        is: () => builder,
        in: () => builder,
        contains: () => builder,
        containedBy: () => builder,
        or: () => builder,
        and: () => builder,
        not: () => builder,
        order: () => builder,
        limit: () => builder,
        range: () => builder,
        single: () => makeResult(),
        maybeSingle: () => makeResult(),
        then: (resolve: any) => resolve(makeResult()),
      };
      return builder;
    }

    function makeResult() {
      return { data: null, error: null, count: null };
    }

    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signUp: async () => ({ data: { user: null, session: null }, error: { message: 'Supabase not configured. Set up .env file.' } }),
        signInWithPassword: async () => ({ data: { user: null, session: null }, error: { message: 'Supabase not configured. Set up .env file.' } }),
        signOut: async () => ({ error: null }),
      },
      from: () => makeQueryBuilder(),
    } as any;
  }

  return createBrowserClient(url, key);
}
