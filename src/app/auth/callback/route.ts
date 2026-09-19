import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  let next = searchParams.get('next') ?? '/';

  if (!next.startsWith('/') || next.startsWith('//')) {
    next = '/';
  }

  // Always land on the canonical production domain when configured —
  // Supabase may invoke this route on a preview deployment URL (which can
  // carry Vercel protection), but the session belongs on the public site.
  // Localhost dev is exempt so local OAuth testing keeps working.
  const reqHost = new URL(request.url).hostname;
  const isLocal = reqHost === 'localhost' || reqHost === '127.0.0.1' || reqHost === '[::1]';
  const canonical = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/+$/, '');
  const base = !isLocal && canonical ? canonical : origin;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: existing } = await supabase.from('profiles').select('id').eq('id', user.id).single();
        if (!existing) {
          let baseUsername = user.user_metadata?.username || user.email?.split('@')[0] || 'user';
          baseUsername = baseUsername.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase().slice(0, 20);
          if (baseUsername.length < 3) baseUsername = `user_${baseUsername}`;

          // Batch check: try base + 9 candidates at once instead of N+1
          const candidates = [baseUsername, ...Array.from({ length: 9 }, (_, i) => `${baseUsername}${i + 1}`)];
          const { data: taken } = await supabase
            .from('profiles')
            .select('username')
            .in('username', candidates);

          const takenSet = new Set(taken?.map((t: any) => t.username) || []);
          let username = baseUsername;
          if (takenSet.has(username)) {
            for (let i = 1; i <= 999; i++) {
              const candidate = `${baseUsername}${i}`;
              if (!takenSet.has(candidate)) { username = candidate; break; }
              // If all 10 batch candidates taken, do another batch
              if (i % 10 === 0) {
                const moreCandidates = Array.from({ length: 10 }, (_, j) => `${baseUsername}${i + j + 1}`);
                const { data: moreTaken } = await supabase.from('profiles').select('username').in('username', moreCandidates);
                moreTaken?.forEach((t: any) => takenSet.add(t.username));
              }
            }
          }

          const { error: insertErr } = await supabase.from('profiles').insert({
            id: user.id,
            username,
            display_name: user.user_metadata?.full_name || username,
            avatar_url: user.user_metadata?.avatar_url || null,
          });
          if (insertErr) console.error('Profile insert error:', insertErr.message);
        }
      }

      // Propagate cookies to redirect response
      const response = NextResponse.redirect(`${base}${next}`);
      return response;
    }
  }

  return NextResponse.redirect(`${base}/login?error=Could+not+verify+email`);
}
