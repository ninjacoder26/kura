import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import {
  tagPostWithGroq,
  fallbackTags,
  topVocab,
  GROQ_MODEL,
} from '@/lib/tagging';

/**
 * AI post-tagging endpoint (Groq free tier).
 *
 *   POST /api/tag-post { postId }  → tag one post (author or admin)
 *   POST /api/tag-post {}          → admin-only sweep of oldest untagged
 *
 * "Whenever the AI is free": a process-wide busy flag serializes work —
 * concurrent calls get 429 and back off silently. Every post always ends
 * tagged: strict AI output first, deterministic local fallback on any
 * failure. Never throws to callers that fire-and-forget.
 */

let busy = false;

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createServiceClient(url, key);
}

async function sharedVocab(supabase: any): Promise<string[]> {
  try {
    const { data } = await supabase
      .from('posts')
      .select('tags')
      .order('created_at', { ascending: false })
      .limit(200);
    return topVocab(((data as any[]) || []).map(r => r.tags), 60);
  } catch {
    return [];
  }
}

async function tagOne(
  post: { id: string; title: string; body?: string | null; type?: string | null; community?: { slug?: string; description?: string } | null },
  vocab: string[],
  apiKey: string,
  write: (id: string, tags: string[]) => Promise<void>
): Promise<{ tags: string[]; source: 'ai' | 'fallback' }> {
  const input = {
    title: post.title,
    body: post.body,
    type: post.type,
    communitySlug: post.community?.slug,
    communityDescription: post.community?.description,
    vocab,
  };
  try {
    const tags = await tagPostWithGroq({ apiKey, input, timeoutMs: 9000 });
    await write(post.id, tags);
    return { tags, source: 'ai' };
  } catch {
    const fb = fallbackTags(post.community?.slug, post.title);
    try {
      await write(post.id, fb);
    } catch {
      // Storage failed too — caller still gets a usable answer.
    }
    return { tags: fb, source: 'fallback' };
  }
}

export async function POST(request: Request) {
  let body: { postId?: string } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: 'GROQ_API_KEY is not configured on the server' },
      { status: 500 }
    );
  }

  if (busy) {
    return NextResponse.json({ ok: false, error: 'Tagger busy, try later' }, { status: 429 });
  }

  // ---- Sweep mode: oldest untagged posts, admins only ----
  if (!body.postId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (profile?.role !== 'admin') {
      return NextResponse.json({ ok: false, error: 'Admins only' }, { status: 403 });
    }
    const svc = serviceClient();
    if (!svc) {
      return NextResponse.json(
        { ok: false, error: 'SUPABASE_SERVICE_ROLE_KEY is not configured on the server' },
        { status: 500 }
      );
    }
    busy = true;
    try {
      const { data } = await svc
        .from('posts')
        .select('id, title, body, type, tags, community:communities!posts_community_id_fkey(slug, description)')
        .order('created_at', { ascending: true })
        .limit(100);
      const untagged = ((data as any[]) || [])
        .filter(p => !p.tags || p.tags.length === 0)
        .slice(0, 3);
      const vocab = await sharedVocab(svc);
      const results: { id: string; tags: string[]; source: string }[] = [];
      for (const post of untagged) {
        const r = await tagOne(post, vocab, apiKey, async (id, tags) => {
          const { error } = await svc.from('posts').update({ tags }).eq('id', id);
          if (error) throw error;
        });
        results.push({ id: post.id, tags: r.tags, source: r.source });
      }
      return NextResponse.json({ ok: true, tagged: results, model: GROQ_MODEL });
    } finally {
      busy = false;
    }
  }

  // ---- Single-post mode: author or admin ----
  const { data: post } = await supabase
    .from('posts')
    .select('id, title, body, type, author_id, tags, community:communities!posts_community_id_fkey(slug, description)')
    .eq('id', body.postId)
    .single();
  if (!post) {
    return NextResponse.json({ ok: false, error: 'Post not found' }, { status: 404 });
  }
  if (post.tags && post.tags.length > 0) {
    return NextResponse.json({ ok: true, postId: post.id, tags: post.tags, source: 'cached' });
  }

  let isAdmin = false;
  if (post.author_id !== user.id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    isAdmin = profile?.role === 'admin';
    if (!isAdmin) {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
    }
  }

  busy = true;
  try {
    const vocab = await sharedVocab(supabase);
    const svc = serviceClient();
    const writer =
      svc && (isAdmin || post.author_id !== user.id)
        ? async (id: string, tags: string[]) => {
            const { error } = await svc.from('posts').update({ tags }).eq('id', id);
            if (error) throw error;
          }
        : async (id: string, tags: string[]) => {
            const { error } = await supabase.from('posts').update({ tags }).eq('id', id);
            if (error) throw error;
          };
    const r = await tagOne(post as any, vocab, apiKey, writer);
    return NextResponse.json({ ok: true, postId: post.id, tags: r.tags, source: r.source, model: GROQ_MODEL });
  } finally {
    busy = false;
  }
}
