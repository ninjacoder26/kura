import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Canonical domain: never let two Vercel/alt domains split auth state.
  // Inactive when NEXT_PUBLIC_SITE_URL is unset (local dev unaffected).
  const canonical = process.env.NEXT_PUBLIC_SITE_URL;
  if (canonical) {
    try {
      const canonicalUrl = new URL(canonical);
      const host = request.nextUrl.hostname;
      const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
      if (canonicalUrl.hostname && host !== canonicalUrl.hostname && !isLocal) {
        const url = request.nextUrl.clone();
        url.protocol = canonicalUrl.protocol;
        url.host = canonicalUrl.host;
        return NextResponse.redirect(url, 308);
      }
    } catch {
      // Misconfigured env — fail open, never block traffic.
    }
  }

  const protectedRoutes = ['/submit', '/settings', '/k/create'];
  const isProtected = protectedRoutes.some(r => pathname.startsWith(r))
    || /^\/post\/[^/]+\/edit/.test(pathname)
    || /^\/k\/[^/]+\/edit/.test(pathname);

  // Public pages (home, communities, posts, profiles, search) skip Supabase
  // entirely — no server roundtrip blocking the navigation. The client SDK
  // and AuthProvider own session state there.
  if (!isProtected) {
    return NextResponse.next();
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || url === 'your-project-url' || key === 'your-anon-key') {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options as any));
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
