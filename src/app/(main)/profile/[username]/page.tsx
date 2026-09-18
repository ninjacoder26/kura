'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { fetchAndCacheVotes, useSyncFeedVotes } from '@/lib/feedVoteCache';
import PostList from '@/components/post/PostList';
import type { PostData } from '@/components/post/PostCard';
import { EmptyState } from '@/components/ui/Feedback';
import { cn, formatDate } from '@/lib/utils';
import { MapPin, Calendar, Link as LinkIcon, ArrowBigUp, MessageSquare, Ban, Twitter, Instagram, Github, Settings, Bookmark, ThumbsUp, Cake } from 'lucide-react';
import Link from 'next/link';
import RoleBadge from '@/components/ui/RoleBadge';
import { useAuth } from '@/components/providers/AuthProvider';

interface UserComment { id: string; body: string; post_id: string; post_title?: string; created_at: string; }

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const [username, setUsername] = useState('');
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [comments, setComments] = useState<UserComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'posts' | 'comments' | 'saved' | 'upvoted'>('posts');
  const [postSort, setPostSort] = useState<'hot' | 'new' | 'top'>('hot');
  const [savedPosts, setSavedPosts] = useState<PostData[]>([]);
  const [upvotedPosts, setUpvotedPosts] = useState<PostData[]>([]);
  const [loadingExtras, setLoadingExtras] = useState(false);
  const { user } = useAuth();
  const isOwnProfile = user && profile && user.id === profile.id;
  useSyncFeedVotes(posts, user?.id);
  useSyncFeedVotes(savedPosts, user?.id);
  useSyncFeedVotes(upvotedPosts, user?.id);

  useEffect(() => { params.then(p => setUsername(p.username)); }, [params]);

  function handleSavedRemove(id: string) {
    setSavedPosts(prev => prev.filter(p => p.id !== id));
  }

  function handleUpvotedRemove(id: string) {
    setUpvotedPosts(prev => prev.filter(p => p.id !== id));
  }

  // Own-profile extras: saved + upvoted posts (Reddit-style profile tabs)
  useEffect(() => {
    if (!profile || !user || user.id !== profile.id) return;
    if (activeTab !== 'saved' && activeTab !== 'upvoted') return;
    if ((activeTab === 'saved' && savedPosts.length > 0) || (activeTab === 'upvoted' && upvotedPosts.length > 0)) return;
    let cancelled = false;
    (async () => {
      setLoadingExtras(true);
      try {
        const supabase = createClient();
        if (activeTab === 'saved') {
          const { data } = await supabase
            .from('saved_posts')
            .select('post:posts(*, author:profiles!posts_author_id_fkey(username,display_name,avatar_url,role), community:communities!posts_community_id_fkey(id,name,slug,color,icon_url))')
            .eq('user_id', profile.id)
            .order('created_at', { ascending: false })
            .limit(20);
          if (!cancelled && data) {
            const mapped = (data as any[]).map(r => r.post).filter(Boolean)
              .map((p: any) => ({ ...p, author: p.author || { username: 'unknown' }, community: p.community || undefined }));
            if (user) fetchAndCacheVotes(supabase, user.id, mapped.map((p: any) => p.id));
            setSavedPosts(mapped);
          }
        } else {
          const { data } = await supabase
            .from('votes')
            .select('post:posts(*, author:profiles!posts_author_id_fkey(username,display_name,avatar_url,role), community:communities!posts_community_id_fkey(id,name,slug,color,icon_url))')
            .eq('user_id', profile.id)
            .eq('value', 1)
            .not('post_id', 'is', null)
            .order('created_at', { ascending: false })
            .limit(20);
          if (!cancelled && data) {
            const mapped = (data as any[]).map(r => r.post).filter(Boolean)
              .map((p: any) => ({ ...p, author: p.author || { username: 'unknown' }, community: p.community || undefined }));
            if (user) fetchAndCacheVotes(supabase, user.id, mapped.map((p: any) => p.id));
            setUpvotedPosts(mapped);
          }
        }
      } catch {
        // Tabs show their empty states on failure
      } finally {
        if (!cancelled) setLoadingExtras(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, profile?.id, user?.id]);

  useEffect(() => {
    if (!username) return;
    let cancelled = false;
    async function load() {
      try {
        const supabase = createClient();
        const { data: prof, error: profErr } = await supabase.from('profiles').select('*').eq('username', username).single();
        if (profErr) throw profErr;
        if (cancelled) return;
        setProfile(prof);
        if (prof) {
          // Parallel queries for posts and comments
          let postsQuery = supabase.from('posts').select('*, author:profiles!posts_author_id_fkey(username,display_name,avatar_url,role), community:communities!posts_community_id_fkey(id,name,slug,color,icon_url)').eq('author_id', prof.id).eq('is_removed', false);
          if (postSort === 'new') postsQuery = postsQuery.order('created_at', { ascending: false });
          else postsQuery = postsQuery.order('upvotes', { ascending: false });
          const [postsResult, commentsResult] = await Promise.all([
            postsQuery.limit(20),
            supabase.from('comments').select('id, body, post_id, created_at, posts!comments_post_id_fkey(title)').eq('author_id', prof.id).eq('is_removed', false).order('created_at', { ascending: false }).limit(20)
          ]);
          if (cancelled) return;
          if (postsResult.data) setPosts((postsResult.data as any[]).map((p: any) => ({ ...p, author: p.author || { username: 'unknown' }, community: p.community || undefined })));
          if (postsResult.data && user) fetchAndCacheVotes(supabase, user.id, (postsResult.data as any[]).map((p: any) => p.id));
          if (commentsResult.data) setComments((commentsResult.data as any[]).map((c: any) => ({ id: c.id, body: c.body, post_id: c.post_id, post_title: c.posts?.title, created_at: c.created_at })));
        }
      } catch (err: any) { if (!cancelled) setError(err.message || 'Failed to load profile'); } finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, [username, postSort]);

  if (loading && !profile) return (
    <div className="bg-[var(--bg)]">
      <div className="h-32 sm:h-40 bg-[var(--surface)] animate-pulse" />
      <div className="max-w-[900px] mx-auto px-3 sm:px-4 -mt-10">
        <div className="flex items-end gap-3 mb-4">
          <div className="h-[80px] w-[80px] sm:h-[100px] sm:w-[100px] rounded-full bg-[var(--surface-hover)] animate-pulse border-4 border-[var(--surface)]" />
          <div className="flex-1 pb-1">
            <div className="h-6 w-40 bg-[var(--surface-hover)] rounded animate-pulse mb-2" />
            <div className="h-4 w-24 bg-[var(--surface-hover)] rounded animate-pulse" />
          </div>
        </div>
        <div className="h-10 bg-[var(--surface-hover)] rounded animate-pulse" />
      </div>
      <div className="max-w-[900px] mx-auto px-3 sm:px-4 py-4">
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="post-card p-4">
              <div className="h-4 w-32 bg-[var(--surface-hover)] rounded animate-pulse mb-2" />
              <div className="h-4 w-full bg-[var(--surface-hover)] rounded animate-pulse mb-2" />
              <div className="h-4 w-3/4 bg-[var(--surface-hover)] rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  if (error || !profile) return <div className="px-4 py-8"><EmptyState title={error || 'User not found'} description="This profile doesn't exist." /></div>;

  const profileColor = profile.theme_color || 'var(--brand-600)';

  return (
    <div className="bg-[var(--bg)]">
      {/* Banner */}
      <div className="h-24 sm:h-36 relative">
        {profile.cover_url ? (
          <img src={profile.cover_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${profileColor}, ${profileColor}88)` }} />
        )}
      </div>

      {/* Profile Header */}
      <div className="bg-[var(--surface)] border-b border-[var(--border)]">
        <div className="px-4 max-w-[900px] mx-auto">
          <div className="flex items-end gap-3 -mt-8 sm:-mt-10 pb-3">
            <div className="h-[80px] w-[80px] sm:h-[100px] sm:w-[100px] rounded-full border-4 border-[var(--surface)] flex items-center justify-center text-white font-bold text-2xl shrink-0 overflow-hidden shadow-lg"
              style={{ background: profileColor }}>
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                (profile.display_name || profile.username || '?').charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-[var(--fg)]">
                  {profile.display_name || profile.username}
                </h1>
                <RoleBadge role={profile.role} size="md" />
                {profile.is_banned && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold bg-red-100 text-red-700 rounded-full">
                    <Ban className="h-3 w-3" /> Banned
                  </span>
                )}
              </div>
              <p className="text-sm text-[var(--fg4)]">u/{profile.username}</p>
            </div>
            {isOwnProfile && (
              <Link href="/settings"
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[var(--fg3)] border border-[var(--border)] rounded-full hover:bg-[var(--surface-hover)] hover:border-[var(--border-strong)] transition-all shrink-0 mb-1">
                <Settings className="h-3.5 w-3.5" /> Edit
              </Link>
            )}
          </div>
        </div>
      </div>

      {profile.is_banned && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mx-4 mt-4">
          <div className="flex items-center gap-2">
            <Ban className="h-5 w-5 text-red-500" />
            <p className="text-sm font-medium text-red-700">This account has been banned</p>
          </div>
        </div>
      )}

      <div className="max-w-[900px] mx-auto px-3 sm:px-4 py-4">
        {/* Tabs */}
        <div className="flex items-center gap-0 border-b border-[var(--border)] mb-3">
          {[
            { key: 'posts' as const, label: 'Posts', icon: ArrowBigUp },
            { key: 'comments' as const, label: 'Comments', icon: MessageSquare },
            ...(isOwnProfile
              ? [
                  { key: 'saved' as const, label: 'Saved', icon: Bookmark },
                  { key: 'upvoted' as const, label: 'Upvoted', icon: ThumbsUp },
                ]
              : []),
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={cn('flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold border-b-2 transition-colors', activeTab === tab.key ? 'border-[var(--brand-500)] text-[var(--brand-500)]' : 'border-transparent text-[var(--fg4)] hover:text-[var(--fg3)]')}>
              <tab.icon className="h-4 w-4" /> {tab.label}
            </button>
          ))}
        </div>

        <div className="flex gap-5">
          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <div className="pb-20 lg:pb-8">
              {activeTab === 'posts' && (
                <>
                  <div className="flex items-center gap-1 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--fg4)] mr-1">Sort by:</span>
                    {([['hot', 'Hot'], ['new', 'New'], ['top', 'Top']] as const).map(([key, label]) => (
                      <button key={key} onClick={() => setPostSort(key)}
                        className={cn('text-xs font-bold px-2.5 py-1 rounded-full transition-colors', postSort === key ? 'bg-[var(--surface-hover)] text-[var(--fg)]' : 'text-[var(--fg4)] hover:bg-[var(--surface-hover)]')}>
                        {label}
                      </button>
                    ))}
                  </div>
                  <PostList posts={posts} emptyTitle="No posts yet" emptyDescription="This user hasn't posted anything yet." />
                </>
              )}
              {activeTab === 'comments' && (comments.length === 0 ? (
                <EmptyState title="No comments yet" description="This user hasn't commented on anything yet." />
              ) : (
                <div className="space-y-2">{comments.map(c => (
                  <div key={c.id} className="post-card p-3 anim-fade-up">
                    {c.post_title && <Link href={`/post/${c.post_id}`} className="text-xs text-[var(--fg4)] hover:text-[var(--brand-500)] transition-colors font-bold">{c.post_title}</Link>}
                    <p className="text-sm text-[var(--fg2)] mt-1 leading-relaxed break-words">{c.body}</p>
                    <p className="text-xs text-[var(--fg4)] mt-1.5" title={new Date(c.created_at).toLocaleString()}>{formatDate(c.created_at)}</p>
                  </div>
                ))}</div>
              ))}
              {activeTab === 'saved' && (loadingExtras && savedPosts.length === 0 ? (
                <div className="space-y-2">{[1, 2].map(i => <div key={i} className="post-card p-4"><div className="h-4 w-2/3 rounded skeleton mb-2" /><div className="h-3 w-full rounded skeleton" /></div>)}</div>
              ) : (
                <PostList posts={savedPosts} emptyTitle="No saved posts" emptyDescription="Tap Save on any post to find it here later." onDelete={handleSavedRemove} />
              ))}
              {activeTab === 'upvoted' && (loadingExtras && upvotedPosts.length === 0 ? (
                <div className="space-y-2">{[1, 2].map(i => <div key={i} className="post-card p-4"><div className="h-4 w-2/3 rounded skeleton mb-2" /><div className="h-3 w-full rounded skeleton" /></div>)}</div>
              ) : (
                <PostList posts={upvotedPosts} emptyTitle="No upvoted posts" emptyDescription="Posts you upvote will show up here." onDelete={handleUpvotedRemove} />
              ))}
            </div>
          </main>

          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-[312px] shrink-0">
            <div className="sticky top-12 pb-8">
              <div className="sidebar-widget">
                <div className="sidebar-widget-header" style={{ borderBottomColor: profileColor }}>About</div>
                <div className="p-3 space-y-3">
                  {profile.bio && <p className="text-sm text-[var(--fg2)] leading-relaxed">{profile.bio}</p>}

                  <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--fg4)]">
                    {profile.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {profile.location}</span>}
                    {profile.website && (
                      <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-[var(--brand-500)]">
                        <LinkIcon className="h-3.5 w-3.5" /> {profile.website.replace(/https?:\/\//, '')}
                      </a>
                    )}
                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                    <span className="flex items-center gap-1"><Cake className="h-3.5 w-3.5" /> Cake day {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>

                  {(profile.twitter || profile.instagram || profile.github) && (
                    <div className="flex items-center gap-2 pt-2 border-t border-[var(--border)]">
                      {profile.twitter && (
                        <a href={`https://x.com/${profile.twitter}`} target="_blank" rel="noopener noreferrer"
                          className="h-8 w-8 rounded-full bg-[var(--surface-hover)] flex items-center justify-center text-[var(--fg4)] hover:text-[var(--fg)] hover:bg-[var(--border)] transition-colors">
                          <Twitter className="h-4 w-4" />
                        </a>
                      )}
                      {profile.instagram && (
                        <a href={`https://instagram.com/${profile.instagram}`} target="_blank" rel="noopener noreferrer"
                          className="h-8 w-8 rounded-full bg-[var(--surface-hover)] flex items-center justify-center text-[var(--fg4)] hover:text-[var(--fg)] hover:bg-[var(--border)] transition-colors">
                          <Instagram className="h-4 w-4" />
                        </a>
                      )}
                      {profile.github && (
                        <a href={`https://github.com/${profile.github}`} target="_blank" rel="noopener noreferrer"
                          className="h-8 w-8 rounded-full bg-[var(--surface-hover)] flex items-center justify-center text-[var(--fg4)] hover:text-[var(--fg)] hover:bg-[var(--border)] transition-colors">
                          <Github className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-5 pt-3 border-t border-[var(--border)] text-sm tabular-nums">
                    <div><p className="font-bold text-[var(--fg)]">{(profile.post_count || 0).toLocaleString()}</p><p className="text-[11px] text-[var(--fg4)]">Posts</p></div>
                    <div><p className="font-bold text-[var(--fg)]">{(profile.comment_count || 0).toLocaleString()}</p><p className="text-[11px] text-[var(--fg4)]">Comments</p></div>
                    <div><p className="font-bold" style={{ color: profileColor }}>{(profile.reputation || 0).toLocaleString()}</p><p className="text-[11px] text-[var(--fg4)]">Reputation</p></div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile Sidebar - Below content */}
      <div className="lg:hidden px-4 pb-20">
        <div className="sidebar-widget">
          <div className="sidebar-widget-header" style={{ borderBottomColor: profileColor }}>About</div>
          <div className="p-3 space-y-3">
            {profile.bio && <p className="text-sm text-[var(--fg2)] leading-relaxed">{profile.bio}</p>}

            <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--fg4)]">
              {profile.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {profile.location}</span>}
              {profile.website && (
                <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-[var(--brand-500)]">
                  <LinkIcon className="h-3.5 w-3.5" /> {profile.website.replace(/https?:\/\//, '')}
                </a>
              )}
              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
              <span className="flex items-center gap-1"><Cake className="h-3.5 w-3.5" /> Cake day {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>

            {(profile.twitter || profile.instagram || profile.github) && (
              <div className="flex items-center gap-2 pt-2 border-t border-[var(--border)]">
                {profile.twitter && (
                  <a href={`https://x.com/${profile.twitter}`} target="_blank" rel="noopener noreferrer"
                    className="h-8 w-8 rounded-full bg-[var(--surface-hover)] flex items-center justify-center text-[var(--fg4)] hover:text-[var(--fg)] hover:bg-[var(--border)] transition-colors">
                    <Twitter className="h-4 w-4" />
                  </a>
                )}
                {profile.instagram && (
                  <a href={`https://instagram.com/${profile.instagram}`} target="_blank" rel="noopener noreferrer"
                    className="h-8 w-8 rounded-full bg-[var(--surface-hover)] flex items-center justify-center text-[var(--fg4)] hover:text-[var(--fg)] hover:bg-[var(--border)] transition-colors">
                    <Instagram className="h-4 w-4" />
                  </a>
                )}
                {profile.github && (
                  <a href={`https://github.com/${profile.github}`} target="_blank" rel="noopener noreferrer"
                    className="h-8 w-8 rounded-full bg-[var(--surface-hover)] flex items-center justify-center text-[var(--fg4)] hover:text-[var(--fg)] hover:bg-[var(--border)] transition-colors">
                    <Github className="h-4 w-4" />
                  </a>
                )}
              </div>
            )}

            <div className="flex items-center gap-5 pt-3 border-t border-[var(--border)] text-sm tabular-nums">
              <div><p className="font-bold text-[var(--fg)]">{(profile.post_count || 0).toLocaleString()}</p><p className="text-[11px] text-[var(--fg4)]">Posts</p></div>
              <div><p className="font-bold text-[var(--fg)]">{(profile.comment_count || 0).toLocaleString()}</p><p className="text-[11px] text-[var(--fg4)]">Comments</p></div>
              <div><p className="font-bold" style={{ color: profileColor }}>{(profile.reputation || 0).toLocaleString()}</p><p className="text-[11px] text-[var(--fg4)]">Reputation</p></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
