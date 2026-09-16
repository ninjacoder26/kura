'use client';

import { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Header from '@/components/layout/Header';
import MobileNav from '@/components/layout/MobileNav';
import { FileText, Link2, Image as ImageIcon, ChevronDown, X, Upload, Loader2, Plus, Search, Check, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { uploadToCloudinary, isCloudinaryConfigured, validateImageFile, type CloudinaryUploadResult } from '@/lib/cloudinary';

const POST_TYPES = [
  { value: 'text', label: 'Post', icon: FileText, description: 'Text' },
  { value: 'image', label: 'Image & Video', icon: ImageIcon, description: 'Images' },
  { value: 'link', label: 'Link', icon: Link2, description: 'Link' },
];

function SubmitForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const preselectedCommunity = searchParams.get('community') || '';
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [type, setType] = useState('text');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('');
  const [communityId, setCommunityId] = useState('');
  const [communitySearch, setCommunitySearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [communities, setCommunities] = useState<{ id: string; slug: string; name: string; color?: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [titleFocused, setTitleFocused] = useState(false);
  const [flair, setFlair] = useState('');
  const [showFlairPicker, setShowFlairPicker] = useState(false);

  useEffect(() => { if (!authLoading && !user) router.replace('/login?redirect=/submit'); }, [user, authLoading, router]);

  useEffect(() => {
    if (titleRef.current) titleRef.current.focus();
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) { if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowDropdown(false); }
    if (showDropdown) { document.addEventListener('mousedown', handleClick); return () => document.removeEventListener('mousedown', handleClick); }
  }, [showDropdown]);

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data } = await supabase.from('communities').select('id, slug, name, color').order('name');
        if (data) {
          setCommunities(data as any[]);
          if (preselectedCommunity) {
            const match = (data as any[]).find((c: any) => c.slug === preselectedCommunity);
            if (match) setCommunityId(match.id);
          }
        }
      } catch {}
    }
    load();
  }, [preselectedCommunity]);

  const filtered = communities.filter(c =>
    c.name.toLowerCase().includes(communitySearch.toLowerCase()) ||
    c.slug.includes(communitySearch.toLowerCase())
  ).slice(0, 10);

  const selectedCommunity = communities.find(c => c.id === communityId);

  const handleImageSelect = useCallback((file: File) => {
    const validation = validateImageFile(file);
    if (!validation.valid) { toast('error', validation.error!); return; }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }, [toast]);

  function handleImageInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleImageSelect(file);
  }

  function handleDrag(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageSelect(file);
  }

  async function uploadImage(): Promise<string | null> {
    if (!imageFile || !user) return null;
    setUploading(true);
    setUploadProgress(0);
    try {
      if (isCloudinaryConfigured()) {
        const result = await uploadToCloudinary(imageFile, `kura/${user.id}`);
        return result.secure_url;
      }
      // Fallback to Supabase Storage
      const supabase = createClient();
      const ext = imageFile.name.split('.').pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('post-images').upload(path, imageFile);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('post-images').getPublicUrl(path);
      return urlData.publicUrl;
    } catch (err: any) {
      toast('error', err.message || 'Image upload failed');
      return null;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
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
    } catch (err: any) {
      toast('error', err.message || 'Failed to create post');
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading) return <div className="min-h-screen"><Header /><div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[var(--brand-600)]" /></div></div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <Header />
      <div className="px-4 py-4 max-w-[740px] mx-auto">
        {/* Title */}
        <div className="flex items-center gap-3 mb-4">
          <h1 className="text-lg font-medium text-[var(--fg)]">Create a post</h1>
          {selectedCommunity && (
            <span className="text-sm text-[var(--fg4)]">in <span className="font-bold text-[var(--fg)]">k/{selectedCommunity.slug}</span></span>
          )}
        </div>

        {/* Community Selector - Reddit style */}
        <div className="mb-3" ref={dropdownRef}>
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className={cn(
                'flex items-center gap-2 w-full sm:w-72 h-10 px-3 text-sm rounded border bg-[var(--surface)] transition-colors text-left',
                showDropdown ? 'border-[var(--brand-600)] ring-1 ring-[var(--brand-600)]' : 'border-[var(--border)] hover:border-[var(--border-strong)]'
              )}
            >
              {selectedCommunity ? (
                <>
                  <div className="h-5 w-5 rounded-full flex items-center justify-center text-white text-[8px] font-bold shrink-0"
                    style={{ background: selectedCommunity.color || 'var(--brand-600)' }}>
                    {selectedCommunity.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-[var(--fg)] font-medium truncate">k/{selectedCommunity.slug}</span>
                </>
              ) : (
                <span className="text-[var(--fg4)]">Choose a community</span>
              )}
              <ChevronDown className={cn('h-4 w-4 text-[var(--fg4)] shrink-0 ml-auto transition-transform', showDropdown && 'rotate-180')} />
            </button>
            {showDropdown && (
              <div className="absolute top-full left-0 w-full sm:w-80 mt-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-lg z-30 anim-scale-in overflow-hidden">
                <div className="p-2 border-b border-[var(--border)]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--fg4)]" />
                    <input
                      type="text"
                      placeholder="Search communities"
                      value={communitySearch}
                      onChange={e => setCommunitySearch(e.target.value)}
                      className="w-full h-9 pl-9 pr-3 text-sm bg-[var(--bg)] border border-[var(--border)] rounded-lg outline-none focus:border-[var(--brand-600)]"
                      autoFocus
                    />
                  </div>
                </div>
                <div className="max-h-[280px] overflow-y-auto">
                  {filtered.length === 0 && (
                    <p className="py-6 text-center text-xs text-[var(--fg4)]">No communities found</p>
                  )}
                  {filtered.map(c => (
                    <button
                      key={c.id}
                      onClick={() => { setCommunityId(c.id); setShowDropdown(false); setCommunitySearch(''); }}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors text-left',
                        communityId === c.id ? 'bg-[var(--surface-hover)]' : 'hover:bg-[var(--surface-hover)]'
                      )}
                    >
                      <div className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ background: c.color || 'var(--brand-600)' }}>
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <span className="font-medium text-[var(--fg)] block truncate">k/{c.slug}</span>
                        <span className="text-xs text-[var(--fg4)]">{c.name}</span>
                      </div>
                      {communityId === c.id && <Check className="h-4 w-4 text-[var(--brand-600)] ml-auto shrink-0" />}
                    </button>
                  ))}
                </div>
                <div className="p-2 border-t border-[var(--border)]">
                  <Link href="/k/create" className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--fg4)] hover:bg-[var(--surface-hover)] rounded transition-colors" onClick={() => setShowDropdown(false)}>
                    <Plus className="h-4 w-4" /> Create new community
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Post Type Tabs - Reddit style */}
        <div className="border border-[var(--border)] rounded-lg overflow-hidden bg-[var(--surface)]">
          <div className="flex border-b border-[var(--border)]">
            {POST_TYPES.map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.value}
                  onClick={() => setType(t.value)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium transition-all relative',
                    type === t.value
                      ? 'text-[var(--brand-60)] bg-[var(--surface)]'
                      : 'text-[var(--fg4)] hover:bg-[var(--surface-hover)] hover:text-[var(--fg3)]'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="hidden sm:inline">{t.label}</span>
                  {type === t.value && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--brand-600)]" />
                  )}
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* Title Input - Large, Reddit style */}
            <div className="relative">
              <input
                ref={titleRef}
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                onFocus={() => setTitleFocused(true)}
                onBlur={() => setTitleFocused(false)}
                placeholder="Title"
                maxLength={300}
                required
                className={cn(
                  'w-full px-4 py-3 text-lg font-medium rounded-lg border bg-[var(--bg)] transition-all outline-none',
                  titleFocused ? 'border-[var(--brand-600)] ring-1 ring-[var(--brand-600)]' : 'border-[var(--border)] hover:border-[var(--border-strong)]'
                )}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--fg4)] tabular-nums">{title.length}/300</span>
            </div>

            {/* Content Area */}
            {type === 'text' && (
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  placeholder="Text (optional)"
                  rows={8}
                  className="w-full px-4 py-3 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--fg)] placeholder:text-[var(--fg4)] focus:outline-none focus:border-[var(--brand-600)] hover:border-[var(--border-strong)] transition-all resize-y min-h-[120px]"
                />
              </div>
            )}

            {type === 'link' && (
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg4)]">
                  <Link2 className="h-5 w-5" />
                </div>
                <input
                  type="url"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="Url"
                  className="w-full h-12 pl-10 pr-4 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--fg)] placeholder:text-[var(--fg4)] focus:outline-none focus:border-[var(--brand-600)] hover:border-[var(--border-strong)] transition-all"
                />
              </div>
            )}

            {type === 'image' && (
              <div>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleImageInput} className="hidden" />
                {imagePreview ? (
                  <div className="relative group">
                    <div className="rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--bg)]">
                      <img src={imagePreview} alt="Preview" className="max-h-[500px] w-full object-contain" />
                    </div>
                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                        className="h-8 w-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    {uploading && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-lg">
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="h-8 w-8 text-white animate-spin" />
                          <span className="text-sm text-white font-medium">Uploading...</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      'border-2 border-dashed rounded-lg p-8 sm:p-12 text-center cursor-pointer transition-all',
                      dragActive
                        ? 'border-[var(--brand-600)] bg-[var(--brand-50)]'
                        : 'border-[var(--border)] hover:border-[var(--brand-500)] hover:bg-[var(--surface-hover)]'
                    )}
                  >
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        'h-16 w-16 rounded-full flex items-center justify-center mb-3 transition-colors',
                        dragActive ? 'bg-[var(--brand-100)]' : 'bg-[var(--surface-hover)]'
                      )}>
                        <Upload className={cn('h-8 w-8', dragActive ? 'text-[var(--brand-600)]' : 'text-[var(--fg4)]')} />
                      </div>
                      <p className="text-sm font-medium text-[var(--fg)] mb-1">
                        {dragActive ? 'Drop image here' : 'Drag and drop image or'}
                      </p>
                      <p className="text-xs text-[var(--fg4)]">
                        PNG, JPG, GIF, WebP up to 20MB
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
              <div className="flex items-center gap-2">
                <Link href="/">
                  <button type="button" className="px-4 py-2 text-sm font-bold text-[var(--fg4)] hover:bg-[var(--surface-hover)] rounded-full transition-colors">
                    Cancel
                  </button>
                </Link>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={!title.trim() || submitting || uploading || (type === 'image' && !imageFile)}
                  className={cn(
                    'px-6 py-2 rounded-full text-sm font-bold transition-all',
                    title.trim() && !submitting && !uploading && (type !== 'image' || imageFile)
                      ? 'bg-[var(--brand-600)] text-white hover:bg-[var(--brand-700)] shadow-sm'
                      : 'bg-[var(--fg4)] text-[var(--bg)] cursor-not-allowed opacity-50'
                  )}
                >
                  {uploading ? (
                    <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</span>
                  ) : submitting ? (
                    <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Posting...</span>
                  ) : (
                    'Post'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Draft autosave indicator */}
        <p className="text-xs text-[var(--fg4)] mt-3 text-center">
          Test saves your drafts automatically
        </p>
      </div>
      <MobileNav />
    </div>
  );
}

export default function SubmitPage() {
  return <Suspense fallback={<div className="min-h-screen"><Header /></div>}><SubmitForm /></Suspense>;
}
