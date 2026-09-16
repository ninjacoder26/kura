'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import MobileNav from '@/components/layout/MobileNav';
import PostList from '@/components/post/PostList';
import type { PostData } from '@/components/post/PostCard';
import { LoadingSpinner, EmptyState } from '@/components/ui/Feedback';
import { Users, Calendar, Shield } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/providers/ToastProvider';

export default function CommunityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [slug, setSlug] = useState('');
  const [community, setCommunity] = useState<any>(null);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [isMember, setIsMember] = useState(false);
  const [joining, setJoining] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => { params.then(p => setSlug(p.slug)); }, [params]);

  const load = useCallback(async (pageNum: number = 0) => {
    if (!slug) return;
    if (pageNum === 0) setLoading(true);
    else setLoadingMore(true);

    try {
      const supabase = createClient();

      // Parallel: community info + membership + posts
      const commQuery = supabase.from('communities').select('*').eq('slug', slug).single();
      const postsQuery = supabase
        .from('posts')
        .select('*, author:profiles!posts_author_id_fkey(username,display_name,avatar_url), community:communities!posts_community_id_fkey(name,slug,color)')
        .eq('is_removed', false)
        .order('created_at', { ascending: false })
        .range(pageNum * 20, (pageNum + 1) * 20 - 1);

      const [commResult, postsResult] = await Promise.all([commQuery, postsQuery]);

      if (commResult.error) throw commResult.error;
      setCommunity(commResult.data);

      if (commResult.data) {
        // Check membership
        if (user) {
          const { data: member } = await supabase.from('community_members').select('id').eq('community_id', commResult.data.id).eq('user_id', user.id).single();
          setIsMember(!!member);
        }

        // Filter posts to this community
        if (postsResult.data) {
          const communityPosts = (postsResult.data as any[])
            .filter((p: any) => p.community_id === commResult.data.id)
            .map((p: any) => ({ ...p, author: p.author || { username: 'unknown' }, community: p.community || undefined }));

          setPosts(prev => pageNum === 0 ? communityPosts : [...prev, ...communityPosts]);
          setHasMore(communityPosts.length === 20);
        }
      }
    } catch (err: any) { setError(err.message || 'Failed to load community'); } finally { setLoading(false); setLoadingMore(false); }
  }, [slug, user]);

  useEffect(() => { load(0); setPage(0); }, [load]);

  function loadMore() {
    const nextPage = page + 1;
    setPage(nextPage);
    load(nextPage);
  }

  async function toggleJoin() {
    if (!user) { toast('info', 'Log in to join communities'); return; }
    setJoining(true);
    try {
      const supabase = createClient();
      if (isMember) {
        await supabase.from('community_members').delete().eq('community_id', community.id).eq('user_id', user.id);
        setIsMember(false); toast('success', `Left ${community.name}`);
      } else {
        await supabase.from('community_members').insert({ community_id: community.id, user_id: user.id });
        setIsMember(true); toast('success', `Joined ${community.name}`);
      }
    } catch (err: any) { toast('error', err.message || 'Failed'); } finally { setJoining(false); }
  }

  if (loading) return <div className="min-h-screen"><Header /><LoadingSpinner /></div>;

  if (error || !community) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="px-4 py-8">
          <EmptyState title={error || 'Community not found'} action={<Link href="/communities"><button className="kura-btn bg-[var(--brand-500)] text-white hover:bg-[var(--brand-600)] text-sm">Browse communities</button></Link>} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <Header />
      <div className="h-20 sm:h-24" style={{ backgroundColor: community.color }} />
      <div className="bg-[var(--surface)] border-b border-[var(--border)]">
        <div className="px-4 max-w-[1200px] mx-auto">
          <div className="flex items-end gap-3 -mt-4 pb-3">
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full flex items-center justify-center text-white font-bold text-2xl border-4 border-[var(--surface)] shrink-0" style={{ backgroundColor: community.color }}>
              {community.icon_url ? <img src={community.icon_url} alt={community.name} className="h-full w-full rounded-full object-cover" /> : community.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold text-[var(--fg)]">{community.name}</h1>
                <button onClick={toggleJoin} disabled={joining} className={`kura-btn text-sm py-1.5 px-5 ${isMember ? 'border border-[var(--border)] text-[var(--fg2)] bg-transparent hover:border-[var(--border-strong)]' : 'bg-[var(--brand-500)] text-white hover:bg-[var(--brand-600)]'}`}>
                  {isMember ? 'Joined' : 'Join'}
                </button>
              </div>
              <p className="text-sm text-[var(--fg4)]">k/{community.slug}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex px-4 py-4 gap-5 max-w-[1200px] mx-auto">
        <main className="flex-1 min-w-0">
          <Link href={`/submit?community=${community.slug}`} className="block mb-3">
            <div className="post-card flex items-center gap-3 p-3">
              <div className="h-9 w-9 rounded-full bg-[var(--bg-raised)] flex items-center justify-center text-[var(--fg4)] text-sm border border-[var(--border)]">?</div>
              <span className="text-sm text-[var(--fg4)]">Create a post in {community.name}...</span>
            </div>
          </Link>

          <PostList posts={posts} showCommunity={false} />

          {loadingMore && <div className="mt-3"><LoadingSpinner /></div>}

          {hasMore && posts.length > 0 && !loadingMore && (
            <div className="flex justify-center mt-4">
              <button onClick={loadMore} className="kura-btn border border-[var(--border)] text-[var(--fg2)] hover:border-[var(--border-strong)] bg-transparent text-sm">
                Load More
              </button>
            </div>
          )}

          <div className="pb-20 lg:pb-6" />
        </main>

        <aside className="hidden lg:block w-[312px] shrink-0">
          <div className="sticky top-12 space-y-4">
            <div className="sidebar-widget">
              <div className="sidebar-widget-header">About Community</div>
              <div className="p-3">
                <p className="text-sm text-[var(--fg2)] leading-relaxed">{community.description}</p>
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[var(--border)] text-sm">
                  <div><p className="font-bold text-[var(--fg)]">{community.member_count?.toLocaleString()}</p><p className="text-[11px] text-[var(--fg4)]">Members</p></div>
                  <div><p className="font-bold text-[var(--fg)]">{community.post_count?.toLocaleString()}</p><p className="text-[11px] text-[var(--fg4)]">Posts</p></div>
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-[var(--fg4)]">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(community.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                <Link href={`/submit?community=${community.slug}`} className="block mt-3">
                  <button className="kura-btn w-full bg-[var(--brand-500)] text-white hover:bg-[var(--brand-600)] text-sm py-2">Create Post</button>
                </Link>
              </div>
            </div>
            {community.rules && (
              <div className="sidebar-widget">
                <div className="sidebar-widget-header flex items-center gap-1.5"><Shield className="h-3 w-3" /> Rules</div>
                <div className="p-3 space-y-2">
                  {community.rules.split('\n').filter(Boolean).map((rule: string, i: number) => (
                    <div key={i} className="flex gap-2 text-sm text-[var(--fg2)]"><span className="font-bold text-[var(--fg4)] shrink-0">{i + 1}.</span><span>{rule.trim()}</span></div>
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
