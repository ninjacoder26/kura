import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || url === 'your-project-url' || key === 'your-anon-key') {
    const errResult = { data: null, error: { message: 'Supabase not configured. Set up .env file.' } };
    const emptyResult = { data: null, error: null };

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

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component. Ignore if setting cookies in a middleware or response.
        }
      },
    },
  });
}
