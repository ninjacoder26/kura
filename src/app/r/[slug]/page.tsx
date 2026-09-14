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
        <div className="max-w-[1200px] mx-auto px-4 py-8">
          <EmptyState title="Community not found" description="This community doesn't exist yet." action={<Link href="/communities"><Button size="sm">Browse communities</Button></Link>} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      {/* Banner */}
      <div className="h-20 sm:h-28" style={{ backgroundColor: community.color }} />
      {/* Community header */}
      <div className="bg-[var(--surface)] border-b border-[var(--border)]">
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="flex items-end gap-3 -mt-4 pb-3">
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full flex items-center justify-center text-white font-bold text-2xl sm:text-3xl border-4 border-[var(--surface)] shrink-0" style={{ backgroundColor: community.color }}>
              {community.icon_url ? <img src={community.icon_url} alt={community.name} className="h-full w-full rounded-full object-cover" /> : community.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold text-[var(--fg)]">{community.name}</h1>
                <Button size="sm" variant={isMember ? 'secondary' : 'primary'} onClick={toggleJoin} loading={joining} disabled={joining}>
                  {isMember ? 'Joined' : 'Join'}
                </Button>
              </div>
              <p className="text-sm text-[var(--fg4)]">r/{community.slug}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 py-4 flex gap-6">
        {/* Main content */}
        <main className="flex-1 min-w-0 max-w-[740px]">
          {/* Sort bar */}
          <div className="post-card flex items-center gap-2 px-3 py-2 mb-2">
            <Link href={`/submit?community=${community.slug}`}>
              <button className="reddit-btn bg-[var(--brand-600)] text-white hover:bg-[var(--brand-700)] text-xs">
                <Plus className="h-3.5 w-3.5" /> Create Post
              </button>
            </Link>
          </div>
          <PostList posts={posts} showCommunity={false} />
        </main>

        {/* Sidebar */}
        <aside className="hidden lg:block w-[312px] shrink-0">
          <div className="sticky top-[calc(var(--header-h)+12px)] space-y-4 pb-8">
            <div className="sidebar-widget">
              <div className="sidebar-widget-header">About Community</div>
              <div className="p-3">
                <p className="text-sm text-[var(--fg2)] leading-relaxed">{community.description}</p>
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[var(--border)] text-sm">
                  <div>
                    <p className="font-bold text-[var(--fg)]">{community.member_count?.toLocaleString()}</p>
                    <p className="text-[11px] text-[var(--fg4)]">Members</p>
                  </div>
                  <div>
                    <p className="font-bold text-[var(--fg)]">{community.post_count?.toLocaleString()}</p>
                    <p className="text-[11px] text-[var(--fg4)]">Posts</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-3 text-xs text-[var(--fg4)]">
                  <Calendar className="h-3.5 w-3.5" />
                  Created {new Date(community.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                <Link href={`/submit?community=${community.slug}`} className="block mt-3">
                  <button className="reddit-btn w-full bg-[var(--brand-600)] text-white hover:bg-[var(--brand-700)]">
                    Create Post
                  </button>
                </Link>
              </div>
            </div>

            {community.rules && (
              <div className="sidebar-widget">
                <div className="sidebar-widget-header flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5" /> Rules
                </div>
                <div className="p-3 space-y-2">
                  {community.rules.split('\n').filter(Boolean).map((rule: string, i: number) => (
                    <div key={i} className="flex gap-2 text-sm text-[var(--fg2)]">
                      <span className="font-bold text-[var(--fg4)] shrink-0">{i + 1}.</span>
                      <span>{rule.trim()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
      <MobileNav />
    </div>
  );
}
