'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import MobileNav from '@/components/layout/MobileNav';
import PostList from '@/components/post/PostList';
import type { PostData } from '@/components/post/PostCard';
import Button from '@/components/ui/Button';
import { LoadingSpinner, EmptyState } from '@/components/ui/Feedback';
import { Users, Calendar, Shield, Plus } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/providers/ToastProvider';

export default function CommunityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [slug, setSlug] = useState('');
  const [community, setCommunity] = useState<any>(null);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [joining, setJoining] = useState(false);

  useEffect(() => { params.then(p => setSlug(p.slug)); }, [params]);

  const load = useCallback(async () => {
    if (!slug) return;
    try {
      const supabase = createClient();
      const { data: comm } = await supabase.from('communities').select('*').eq('slug', slug).single();
      setCommunity(comm);

      if (comm) {
        // Check membership
        if (user) {
          const { data: member } = await supabase
            .from('community_members')
            .select('id')
            .eq('community_id', comm.id)
            .eq('user_id', user.id)
            .single();
          setIsMember(!!member);
        }

        const { data: postData } = await supabase
          .from('posts')
          .select('*, author:profiles!posts_author_id_fkey(username,display_name,avatar_url), community:communities!posts_community_id_fkey(name,slug,color)')
          .eq('community_id', comm.id).eq('is_removed', false)
          .order('created_at', { ascending: false }).limit(20);

        if (postData) {
          setPosts((postData as any[]).map((p: any) => ({ ...p, author: p.author || { username: 'unknown' }, community: p.community || undefined })));
        }
      }
    } catch { /* not found */ } finally { setLoading(false); }
  }, [slug, user]);

  useEffect(() => { load(); }, [load]);

  async function toggleJoin() {
    if (!user) { toast('info', 'Log in to join communities'); return; }
    const supabase = createClient();
    setJoining(true);
    try {
      if (isMember) {
        await supabase.from('community_members').delete().eq('community_id', community.id).eq('user_id', user.id);
        setIsMember(false);
        toast('success', `Left ${community.name}`);
      } else {
        await supabase.from('community_members').insert({ community_id: community.id, user_id: user.id });
        setIsMember(true);
        toast('success', `Joined ${community.name}`);
      }
    } catch (err: any) {
      toast('error', err.message || 'Failed');
    } finally {
      setJoining(false);
    }
  }

  if (loading) return <div className="min-h-screen"><Header /><LoadingSpinner /></div>;

  if (!community) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <EmptyState title="Community not found" description="This community doesn't exist yet." action={<Link href="/communities"><Button size="sm">Browse communities</Button></Link>} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="h-24 sm:h-32 lg:h-40" style={{ backgroundColor: community.color }} />
      <div className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="relative -mt-7 sm:-mt-8 mb-5 sm:mb-6 anim-fade-up">
          <div className="flex items-end gap-3 sm:gap-4">
            <div className="h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24 rounded-2xl flex items-center justify-center text-white font-bold text-2xl sm:text-3xl border-4 border-[var(--bg)] shadow-lg shrink-0" style={{ backgroundColor: community.color }}>
              {community.icon_url ? <img src={community.icon_url} alt={community.name} className="h-full w-full rounded-2xl object-cover" /> : community.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1 pb-0.5">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[var(--fg)] truncate">{community.name}</h1>
              <p className="text-xs sm:text-sm text-[var(--fg4)]">r/{community.slug}</p>
            </div>
            <div className="flex items-center gap-2 pb-0.5 shrink-0">
              <Button size="sm" variant={isMember ? 'secondary' : 'primary'} onClick={toggleJoin} loading={joining} disabled={joining}>
                {isMember ? 'Joined' : 'Join'}
              </Button>
              <Link href={`/submit?community=${community.slug}`}>
                <Button variant="ghost" size="sm" className="p-2"><Plus className="h-4 w-4" /></Button>
              </Link>
            </div>
          </div>
          <div className="flex items-center flex-wrap gap-3 sm:gap-4 mt-3 text-xs sm:text-sm text-[var(--fg3)]">
            <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {community.member_count?.toLocaleString()} members</span>
            <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Created {new Date(community.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
          </div>
          {community.description && <p className="mt-2.5 text-sm text-[var(--fg2)] leading-relaxed">{community.description}</p>}
        </div>

        <div className="flex gap-5 lg:gap-6 pb-20 lg:pb-8">
          <main className="flex-1 min-w-0">
            <Link href={`/submit?community=${community.slug}`} className="block mb-3">
              <div className="flex items-center gap-3 p-3 rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)] transition-colors">
                <div className="h-8 w-8 rounded-full bg-[var(--bg-raised)] flex items-center justify-center text-[var(--fg4)] text-sm">?</div>
                <span className="text-sm text-[var(--fg4)]">Create a post in {community.name}...</span>
              </div>
            </Link>
            <PostList posts={posts} showCommunity={false} />
          </main>

          <aside className="hidden lg:block w-64 xl:w-72 shrink-0">
            <div className="sticky top-[72px] space-y-4 pb-8">
              <div className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-4">
                <h3 className="font-semibold text-sm text-[var(--fg)] mb-2">About</h3>
                <p className="text-sm text-[var(--fg2)] leading-relaxed">{community.description}</p>
                <div className="mt-3 pt-3 border-t border-[var(--border)] space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-[var(--fg4)]">Members</span><span className="font-medium text-[var(--fg)]">{community.member_count?.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-[var(--fg4)]">Posts</span><span className="font-medium text-[var(--fg)]">{community.post_count?.toLocaleString()}</span></div>
                </div>
              </div>
              {community.rules && (
                <div className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-4">
                  <h3 className="font-semibold text-sm text-[var(--fg)] mb-2 flex items-center gap-2"><Shield className="h-4 w-4" /> Rules</h3>
                  <ol className="space-y-2">
                    {community.rules.split('\n').filter(Boolean).map((rule: string, i: number) => (
                      <li key={i} className="flex gap-2 text-sm text-[var(--fg2)]">
                        <span className="font-medium text-[var(--fg4)] shrink-0">{i + 1}.</span>{rule.trim()}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
      <MobileNav />
    </div>
  );
}
