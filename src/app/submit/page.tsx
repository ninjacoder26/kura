'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Header from '@/components/layout/Header';
import MobileNav from '@/components/layout/MobileNav';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import { FileText, Link2, Image as ImageIcon, ChevronDown, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Suspense } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/providers/ToastProvider';

const TYPES = [
  { value: 'text', label: 'Text', icon: FileText },
  { value: 'link', label: 'Link', icon: Link2 },
  { value: 'image', label: 'Image', icon: ImageIcon },
];

function SubmitForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const preselectedCommunity = searchParams.get('community') || '';
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [type, setType] = useState('text');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('');
  const [communityId, setCommunityId] = useState('');
  const [communitySearch, setCommunitySearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [communities, setCommunities] = useState<{ id: string; slug: string; name: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login?redirect=/submit');
    }
  }, [user, authLoading, router]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [showDropdown]);

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data } = await supabase.from('communities').select('id, slug, name').order('name');
        if (data) {
          setCommunities(data as any[]);
          if (preselectedCommunity) {
            const match = (data as any[]).find((c: any) => c.slug === preselectedCommunity);
            if (match) setCommunityId(match.id);
          }
        }
      } catch { /* not configured */ }
    }
    load();
  }, [preselectedCommunity]);

  const filtered = communities.filter(c =>
    c.name.toLowerCase().includes(communitySearch.toLowerCase()) ||
    c.slug.includes(communitySearch.toLowerCase())
  );
  const selectedCommunity = communities.find(c => c.id === communityId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !user) return;
    setSubmitting(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.from('posts').insert({
        title: title.trim(),
        body: body.trim(),
        type,
        url: type === 'link' ? url : null,
        author_id: user.id,
        community_id: communityId || null,
      });

      if (error) throw error;

      toast('success', 'Post created!');
      if (selectedCommunity) {
        router.push(`/r/${selectedCommunity.slug}`);
      } else {
        router.push('/');
      }
    } catch (err: any) {
      toast('error', err.message || 'Failed to create post');
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading) {
    return <div className="min-h-screen"><Header /><div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--brand-600)] border-t-transparent" /></div></div>;
  }

  if (!user) return null;

  return (
    <div className="min-h-screen">
      <Header />
      <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="flex items-center gap-3 mb-5 anim-fade-up">
          <Link href="/" className="p-1 text-[var(--fg4)] hover:text-[var(--fg)] transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg sm:text-xl font-bold text-[var(--fg)]">Create a post</h1>
        </div>

        {/* Community selector */}
        <div className="mb-4 anim-fade-up" style={{ animationDelay: '50ms' }} ref={dropdownRef}>
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-full flex items-center justify-between h-11 px-3.5 text-sm rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)] transition-colors text-left"
            >
              {selectedCommunity ? (
                <span className="text-[var(--fg)]">{selectedCommunity.name}</span>
              ) : (
                <span className="text-[var(--fg4)]">Choose a community (optional)</span>
              )}
              <ChevronDown className={cn('h-4 w-4 text-[var(--fg4)] shrink-0 transition-transform', showDropdown && 'rotate-180')} />
            </button>
            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-lg)] z-20 anim-slide-down">
                <div className="p-2 border-b border-[var(--border)]">
                  <input
                    type="text" placeholder="Search..." value={communitySearch}
                    onChange={e => setCommunitySearch(e.target.value)}
                    className="w-full h-9 px-2.5 text-sm bg-[var(--bg)] border border-[var(--border)] rounded-[var(--r-sm)] outline-none focus:ring-1 focus:ring-[var(--brand-500)]"
                    autoFocus
                  />
                </div>
                <div className="max-h-[200px] overflow-y-auto p-1">
                  {filtered.map(c => (
                    <button
                      key={c.id}
                      onClick={() => { setCommunityId(c.id); setShowDropdown(false); setCommunitySearch(''); }}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-[var(--r-sm)] text-left transition-colors',
                        communityId === c.id ? 'bg-[var(--brand-50)] text-[var(--brand-600)]' : 'text-[var(--fg)] hover:bg-[var(--bg-raised)]'
                      )}
                    >
                      <div className="h-6 w-6 rounded bg-[var(--brand-500)] flex items-center justify-center text-white text-[10px] font-bold">{c.name.charAt(0)}</div>
                      {c.name}
                    </button>
                  ))}
                  {filtered.length === 0 && <p className="py-3 text-center text-sm text-[var(--fg4)]">No communities found</p>}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Type tabs */}
        <div className="flex border border-[var(--border)] rounded-t-[var(--r-md)] bg-[var(--bg-alt)] anim-fade-up" style={{ animationDelay: '100ms' }}>
          {TYPES.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.value}
                onClick={() => setType(t.value)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-2.5 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors',
                  type === t.value
                    ? 'border-[var(--brand-600)] text-[var(--brand-600)] bg-[var(--surface)]'
                    : 'border-transparent text-[var(--fg4)] hover:text-[var(--fg3)]'
                )}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="anim-fade-up" style={{ animationDelay: '150ms' }}>
          <div className="border border-t-0 border-[var(--border)] rounded-b-[var(--r-md)] bg-[var(--surface)] p-3 sm:p-4 space-y-3 sm:space-y-4">
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" maxLength={300} required />
            {type === 'text' && (
              <Textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Text (optional). Markdown is supported." className="min-h-[150px] sm:min-h-[200px]" />
            )}
            {type === 'link' && (
              <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." type="url" />
            )}
            {type === 'image' && (
              <div className="border-2 border-dashed border-[var(--border)] rounded-[var(--r-md)] p-6 sm:p-8 text-center hover:border-[var(--brand-500)] transition-colors cursor-pointer">
                <ImageIcon className="h-8 w-8 mx-auto text-[var(--fg4)] mb-2" />
                <p className="text-sm text-[var(--fg4)]">Drag and drop or click to browse</p>
                <p className="text-xs text-[var(--fg4)] mt-1">PNG, JPG, GIF up to 10MB</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 sm:gap-3 mt-4">
            <Link href="/"><Button variant="ghost" type="button" size="sm">Cancel</Button></Link>
            <Button type="submit" size="sm" disabled={!title.trim() || submitting} loading={submitting}>Post</Button>
          </div>
        </form>
      </div>
      <MobileNav />
    </div>
  );
}

export default function SubmitPage() {
  return (
    <Suspense fallback={<div className="min-h-screen"><Header /></div>}>
      <SubmitForm />
    </Suspense>
  );
}
