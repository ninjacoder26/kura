'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Header from '@/components/layout/Header';
import MobileNav from '@/components/layout/MobileNav';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import { FileText, Link2, Image as ImageIcon, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/providers/ToastProvider';

const TYPES = [
  { value: 'text', label: 'Post', icon: FileText },
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [type, setType] = useState('text');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('');
  const [communityId, setCommunityId] = useState('');
  const [communitySearch, setCommunitySearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [communities, setCommunities] = useState<{ id: string; slug: string; name: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { if (!authLoading && !user) router.replace('/login?redirect=/submit'); }, [user, authLoading, router]);

  useEffect(() => {
    function handleClick(e: MouseEvent) { if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowDropdown(false); }
    if (showDropdown) { document.addEventListener('mousedown', handleClick); return () => document.removeEventListener('mousedown', handleClick); }
  }, [showDropdown]);

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data } = await supabase.from('communities').select('id, slug, name').order('name');
        if (data) { setCommunities(data as any[]); if (preselectedCommunity) { const match = (data as any[]).find((c: any) => c.slug === preselectedCommunity); if (match) setCommunityId(match.id); } }
      } catch {}
    }
    load();
  }, [preselectedCommunity]);

  const filtered = communities.filter(c => c.name.toLowerCase().includes(communitySearch.toLowerCase()) || c.slug.includes(communitySearch.toLowerCase()));
  const selectedCommunity = communities.find(c => c.id === communityId);

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) { toast('error', 'Image must be under 20MB'); return; }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function uploadImage(): Promise<string | null> {
    if (!imageFile || !user) return null;
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = imageFile.name.split('.').pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('post-images').upload(path, imageFile);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('post-images').getPublicUrl(path);
      return urlData.publicUrl;
    } catch (err: any) { toast('error', err.message || 'Image upload failed'); return null; } finally { setUploading(false); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !user) return;
    setSubmitting(true);
    try {
      const supabase = createClient();
      let imageUrl: string | null = null;
      if (type === 'image' && imageFile) {
        imageUrl = await uploadImage();
        if (type === 'image' && !imageUrl) { setSubmitting(false); return; }
      }
      const { error } = await supabase.from('posts').insert({
        title: title.trim(),
        body: body.trim() || null,
        type,
        url: type === 'link' ? url : null,
        image_url: imageUrl,
        author_id: user.id,
        community_id: communityId || null,
      });
      if (error) throw error;
      toast('success', 'Post created!');
      router.push(selectedCommunity ? `/k/${selectedCommunity.slug}` : '/');
    } catch (err: any) { toast('error', err.message || 'Failed to create post'); } finally { setSubmitting(false); }
  }

  if (authLoading) return <div className="min-h-screen"><Header /><div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--brand-600)] border-t-transparent" /></div></div>;
  if (!user) return null;

  return (
    <div className="min-h-screen">
      <Header />
      <div className="px-4 py-4 max-w-[740px] mx-auto">
        <h1 className="text-lg font-medium text-[var(--fg)] mb-4 anim-fade-up">Create a post</h1>
        <div className="mb-4 anim-fade-up" ref={dropdownRef}>
          <div className="relative">
            <button onClick={() => setShowDropdown(!showDropdown)} className="flex items-center justify-between w-72 h-10 px-3 text-sm rounded border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)] transition-colors text-left">
              {selectedCommunity ? <span className="text-[var(--fg)] font-medium">{selectedCommunity.name}</span> : <span className="text-[var(--fg4)]">Choose a community</span>}
              <ChevronDown className={cn('h-4 w-4 text-[var(--fg4)] shrink-0 transition-transform', showDropdown && 'rotate-180')} />
            </button>
            {showDropdown && (
              <div className="absolute top-full left-0 w-80 mt-1 rounded border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-lg)] z-20 anim-slide-down">
                <div className="p-2 border-b border-[var(--border)]">
                  <input type="text" placeholder="Search communities" value={communitySearch} onChange={e => setCommunitySearch(e.target.value)}
                    className="w-full h-9 px-3 text-sm bg-[var(--bg)] border border-[var(--border)] rounded outline-none focus:border-[var(--brand-600)]" autoFocus />
                </div>
                <div className="max-h-[200px] overflow-y-auto p-1">
                  {filtered.map(c => (
                    <button key={c.id} onClick={() => { setCommunityId(c.id); setShowDropdown(false); setCommunitySearch(''); }}
                      className={cn('w-full flex items-center gap-2 px-3 py-2 text-sm rounded text-left transition-colors', communityId === c.id ? 'bg-[var(--surface-hover)] text-[var(--brand-600)]' : 'text-[var(--fg)] hover:bg-[var(--surface-hover)]')}>
                      <div className="h-6 w-6 rounded-full bg-[var(--brand-500)] flex items-center justify-center text-white text-[10px] font-bold shrink-0">{c.name.charAt(0)}</div>
                      <span className="truncate">{c.name}</span>
                    </button>
                  ))}
                  {filtered.length === 0 && <p className="py-3 text-center text-xs text-[var(--fg4)]">No communities found</p>}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="border border-[var(--border)] rounded-t anim-fade-up">
          <div className="flex border-b border-[var(--border)]">
            {TYPES.map(t => { const Icon = t.icon; return (
              <button key={t.value} onClick={() => setType(t.value)}
                className={cn('flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold border-b-2 transition-colors', type === t.value ? 'border-[var(--brand-600)] text-[var(--brand-600)] bg-[var(--surface)]' : 'border-transparent text-[var(--fg4)] hover:text-[var(--fg3)]')}>
                <Icon className="h-4 w-4" /> {t.label}
              </button>
            );})}
          </div>
          <form onSubmit={handleSubmit} className="p-3 space-y-3 bg-[var(--surface)]">
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" maxLength={300} required />
            {type === 'text' && <Textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Text (optional)" className="min-h-[150px]" />}
            {type === 'link' && <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="Url" type="url" />}
            {type === 'image' && (
              <div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                {imagePreview ? (
                  <div className="relative">
                    <img src={imagePreview} alt="Preview" className="max-h-[400px] rounded object-contain w-full" />
                    <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                      className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-[var(--border)] rounded p-10 text-center hover:border-[var(--brand-500)] transition-colors cursor-pointer">
                    <ImageIcon className="h-8 w-8 mx-auto text-[var(--fg4)] mb-2" />
                    <p className="text-sm text-[var(--fg4)]">Click to upload an image</p>
                    <p className="text-xs text-[var(--fg4)] mt-1">PNG, JPG, GIF up to 20MB</p>
                  </button>
                )}
              </div>
            )}
          </form>
        </div>
        <div className="flex items-center justify-end gap-2 mt-3">
          <Link href="/"><button className="kura-btn border border-[var(--border)] text-[var(--fg2)] hover:border-[var(--border-strong)] bg-transparent text-sm">Cancel</button></Link>
          <button onClick={handleSubmit} disabled={!title.trim() || submitting || uploading} className={cn('kura-btn text-sm', title.trim() && !submitting && !uploading ? 'bg-[var(--brand-600)] text-white hover:bg-[var(--brand-700)]' : 'bg-[var(--fg4)] text-[var(--bg)] cursor-not-allowed opacity-50')}>
            {uploading ? 'Uploading...' : submitting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>
      <MobileNav />
    </div>
  );
}

export default function SubmitPage() {
  return <Suspense fallback={<div className="min-h-screen"><Header /></div>}><SubmitForm /></Suspense>;
}
