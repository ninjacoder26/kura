'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Header from '@/components/layout/Header';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { slugify } from '@/lib/utils';
import { COMMUNITY_CATEGORIES } from '@/lib/constants';
import Link from 'next/link';

export default function CreateCommunityPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [submitting, setSubmitting] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);

  useEffect(() => { if (!authLoading && !user) router.replace('/login?redirect=/k/create'); }, [user, authLoading, router]);

  const slug = slugify(name);

  useEffect(() => {
    if (!slug || slug.length < 3) { setSlugAvailable(null); return; }
    const timer = setTimeout(async () => {
      const supabase = createClient();
      const { data } = await supabase.from('communities').select('id').eq('slug', slug).single();
      setSlugAvailable(!data);
    }, 500);
    return () => clearTimeout(timer);
  }, [slug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !name.trim() || !slugAvailable) return;
    setSubmitting(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from('communities').insert({
        name: name.trim(),
        slug,
        description: description.trim() || null,
        category,
        creator_id: user.id,
      }).select('slug').single();
      if (error) throw error;
      toast('success', `k/${slug} created!`);
      router.push(`/k/${data.slug}`);
    } catch (err: any) { toast('error', err.message || 'Failed to create community'); } finally { setSubmitting(false); }
  }

  if (authLoading) return <div className="min-h-screen"><Header /><div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--brand-600)] border-t-transparent" /></div></div>;
  if (!user) return null;

  return (
    <div className="min-h-screen">
      <Header />
      <div className="px-4 py-6 max-w-[540px] mx-auto">
        <h1 className="text-xl font-bold text-[var(--fg)] mb-1">Create a Community</h1>
        <p className="text-sm text-[var(--fg3)] mb-6">Build a space for people to discuss topics you care about.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-[var(--fg2)] mb-1.5 uppercase tracking-wide">Name</label>
            <p className="text-xs text-[var(--fg4)] mb-2">Community names cannot be changed after creation.</p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--fg4)] font-bold">k/</span>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="communityname" required minLength={3} maxLength={21}
                className="w-full h-10 pl-8 pr-3 text-sm rounded border bg-[var(--bg)] border-[var(--border)] text-[var(--fg)] placeholder:text-[var(--fg4)] focus:outline-none focus:border-[var(--brand-600)] transition-all hover:border-[var(--border-strong)]" />
            </div>
            {slug && (
              <p className="text-xs mt-1.5">
                {slugAvailable === null && <span className="text-[var(--fg4)]">k/{slug}</span>}
                {slugAvailable === false && <span className="text-red-500">k/{slug} is already taken</span>}
                {slugAvailable === true && <span className="text-emerald-600">k/{slug} is available</span>}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--fg2)] mb-1.5 uppercase tracking-wide">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Tell people what this community is about" rows={3}
              className="w-full p-3 text-sm rounded border bg-[var(--bg)] border-[var(--border)] text-[var(--fg)] placeholder:text-[var(--fg4)] focus:outline-none focus:border-[var(--brand-600)] transition-all hover:border-[var(--border-strong)] resize-none" />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--fg2)] mb-1.5 uppercase tracking-wide">Category</label>
            <div className="flex flex-wrap gap-2">
              {COMMUNITY_CATEGORIES.map(c => (
                <button key={c.value} type="button" onClick={() => setCategory(c.value)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-full transition-colors ${category === c.value ? 'bg-[var(--brand-600)] text-white' : 'bg-[var(--bg-raised)] text-[var(--fg3)] border border-[var(--border)] hover:border-[var(--border-strong)]'}`}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Link href="/communities"><button type="button" className="kura-btn border border-[var(--border)] text-[var(--fg2)] hover:border-[var(--border-strong)] bg-transparent text-sm">Cancel</button></Link>
            <button type="submit" disabled={!name.trim() || !slugAvailable || submitting}
              className={`kura-btn text-sm ${name.trim() && slugAvailable && !submitting ? 'bg-[var(--brand-600)] text-white hover:bg-[var(--brand-700)]' : 'bg-[var(--fg4)] text-[var(--bg)] cursor-not-allowed opacity-50'}`}>
              {submitting ? 'Creating...' : 'Create Community'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
