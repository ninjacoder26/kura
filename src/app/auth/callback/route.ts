import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  let next = searchParams.get('next') ?? '/';

  // Security (#3): Validate redirect is a relative path
  if (!next.startsWith('/') || next.startsWith('//')) {
    next = '/';
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: existing } = await supabase.from('profiles').select('id').eq('id', user.id).single();
        if (!existing) {
          // Security (#9): Generate unique username with suffix if needed
          let baseUsername = user.user_metadata?.username || user.email?.split('@')[0] || 'user';
          let username = baseUsername;
          let suffix = 1;
          while (true) {
            const { data: taken } = await supabase.from('profiles').select('id').eq('username', username).single();
            if (!taken) break;
            username = `${baseUsername}${suffix}`;
            suffix++;
            if (suffix > 999) break; // safety limit
          }

          const { error: insertErr } = await supabase.from('profiles').insert({
            id: user.id,
            username,
            display_name: user.user_metadata?.full_name || username,
            avatar_url: user.user_metadata?.avatar_url || null,
          });
          // Bug (#16): If insert fails (e.g. trigger already created profile), silently continue
          if (insertErr) console.error('Profile insert error:', insertErr.message);
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Could+not+verify+email`);
}
