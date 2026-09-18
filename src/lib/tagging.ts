/**
 * AI post-tagging engine (Groq, free tier only).
 *
 * Every post gets 3–8 normalized tags so the home feed can recommend more
 * of what each user upvotes. Tag reuse across posts is maximized by feeding
 * the model the live shared vocabulary and instructing it to prefer reuse.
 *
 * Reliability design:
 * - ONE prompt, strict JSON-only layout (plus response_format: json_object).
 * - Pure, unit-testable normalize/parse/fallback helpers below.
 * - Any failure → deterministic local fallback tags (never empty, never crash).
 */

// Free-tier Groq model with the most generous rate limits. Strictly free.
export const GROQ_MODEL = 'llama-3.1-8b-instant';
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

/** Normalize a raw tag. Returns null when unusable. */
export function normalizeTag(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  let t = raw.toLowerCase().trim().replace(/[\s_]+/g, '-').replace(/[^a-z0-9-]/g, '');
  t = t.replace(/-+/g, '-').replace(/^-+|-+$/g, '');
  if (t.length < 2 || t.length > 24) return null;
  return t;
}

export interface TagPromptInput {
  title: string;
  body?: string | null;
  type?: string | null;
  communitySlug?: string | null;
  communityDescription?: string | null;
  /** Existing tags across the site, most frequent first. */
  vocab?: string[];
}

/** The single strict prompt. Output layout is pinned to {"tags": [...]}. */
export function buildTagPrompt(input: TagPromptInput): { system: string; user: string } {
  const vocab = (input.vocab ?? []).filter(Boolean).slice(0, 60);
  const system = [
    'You are a precise content tagger for a Reddit-like community app.',
    'Reply with ONLY valid JSON, exactly in this layout: {"tags": ["tag1", "tag2"]}.',
    'Rules, in priority order:',
    '1. Output 3 to 8 tags, no more, no fewer.',
    '2. Each tag: lowercase, 2-24 chars, letters/numbers/hyphens only.',
    '3. REUSE beats invention: when a word from SHARED VOCABULARY fits this post, use it instead of coining a near-duplicate.',
    '4. Still describe THIS post: topic, place, activity, or intent (e.g. hiking, kathmandu, advice, recipe).',
    '5. No duplicates, no hashtags, no explanations, no markdown fences, no other text.',
  ].join('\n');

  const lines = [
    `Title: ${(input.title || '').slice(0, 200)}`,
    `Community: k/${input.communitySlug || 'general'}`,
  ];
  if (input.communityDescription) lines.push(`Community about: ${input.communityDescription.slice(0, 160)}`);
  if (input.body) lines.push(`Body: ${input.body.slice(0, 800)}`);
  lines.push(
    vocab.length > 0
      ? `SHARED VOCABULARY (reuse when fitting): ${vocab.join(', ')}`
      : 'SHARED VOCABULARY: (none yet — invent clear reusable tags)'
  );
  return { system, user: lines.join('\n') };
}

/**
 * Strictly parse model output into 3–8 normalized tags.
 * Returns [] when the output is unusable so the caller can fall back.
 */
export function parseTagResponse(text: unknown): string[] {
  if (typeof text !== 'string') return [];
  // Tolerate fenced or prefixed JSON: grab the first {...} block.
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) return [];
  try {
    const parsed = JSON.parse(text.slice(start, end + 1));
    const raw = parsed?.tags;
    if (!Array.isArray(raw)) return [];
    const tags: string[] = [];
    for (const r of raw) {
      const t = normalizeTag(r);
      if (t && !tags.includes(t)) tags.push(t);
      if (tags.length === 8) break;
    }
    return tags.length >= 3 ? tags : [];
  } catch {
    return [];
  }
}

/** Deterministic fallback when the model fails: community + title keywords. */
export function fallbackTags(communitySlug?: string | null, title?: string | null): string[] {
  const tags: string[] = [];
  const push = (raw: string) => {
    const t = normalizeTag(raw);
    if (t && !tags.includes(t)) tags.push(t);
  };
  if (communitySlug) push(communitySlug);
  const words = (title || '').toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/[\s-]+/);
  const stop = new Set(['the', 'and', 'for', 'with', 'from', 'this', 'that', 'what', 'when', 'where', 'which', 'your', 'you', 'are', 'how', 'why', 'not', 'but', 'all', 'any', 'Nepal'.toLowerCase()]);
  for (const w of words) {
    if (w.length >= 4 && !stop.has(w)) push(w);
    if (tags.length >= 5) break;
  }
  push('discussion');
  return tags.slice(0, 6);
}

/** One Groq chat call. Throws on any failure (caller falls back). */
export async function tagPostWithGroq(opts: {
  apiKey: string;
  input: TagPromptInput;
  timeoutMs?: number;
}): Promise<string[]> {
  const { system, user } = buildTagPrompt(opts.input);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 25000);
  try {
    const res = await fetch(GROQ_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${opts.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: 0.2,
        max_tokens: 150,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Groq ${res.status}`);
    }
    const json = await res.json();
    const text = json?.choices?.[0]?.message?.content ?? '';
    const tags = parseTagResponse(text);
    if (tags.length === 0) throw new Error('Unusable model output');
    return tags;
  } finally {
    clearTimeout(timer);
  }
}

/** Top-N site-wide tags by frequency (feeds the shared vocabulary). */
export function topVocab(allTags: (string[] | null | undefined)[], limit = 60): string[] {
  const counts = new Map<string, number>();
  for (const arr of allTags) {
    if (!arr) continue;
    for (const t of arr) {
      const n = normalizeTag(t);
      if (n) counts.set(n, (counts.get(n) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([t]) => t);
}
