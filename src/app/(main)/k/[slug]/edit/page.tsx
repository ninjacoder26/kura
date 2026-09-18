'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { clearPageCache } from '@/lib/pageCache';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { COMMUNITY_CATEGORIES } from '@/lib/constants';
import { uploadToCloudinary, isCloudinaryConfigured, validateImageFile } from '@/lib/cloudinary';
import { LoadingSpinner, EmptyState } from '@/components/ui/Feedback';
import { Camera, Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const COMMUNITY_COLORS = [
  '#0079D3', '#FF4500', '#00A368', '#9B59B6',
  '#E84393', '#F5A623', '#00BCD4', '#787C7E',
];

export default function EditCommunityPage({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [slug, setSlug] = useState('');
  const [community, setCommunity] = useState<any>(null);
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [description, setDescription] = useState('');
  const [rules, setRules] = useState('');
  const [color, setColor] = useState('#0079D3');
  const [category, setCategory] = useState('general');

  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [savedIconUrl, setSavedIconUrl] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [savedBannerUrl, setSavedBannerUrl] = useState<string | null>(null);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const iconInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { params.then(p => setSlug(p.slug)); }, [params]);

  useEffect(() => {
    if (!authLoading && !user) router.replace(`/login?redirect=/k/${slug}/edit`);
  }, [user, authLoading, router, slug]);

  useEffect(() => {
    if (!slug || !user) return;
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const { data: comm, error } = await supabase.from('communities').select('*').eq('slug', slug).single();
        if (error) throw error;
        if (cancelled) return;
        setCommunity(comm);
        const { data: member } = await supabase
          .from('community_members')
          .select('role')
          .eq('community_id', comm.id)
          .eq('user_id', user.id)
          .single();
        const ok =
          comm.created_by === user.id ||
          member?.role === 'moderator' ||
          member?.role === 'admin' ||
          (user as any).role === 'admin';
        setAllowed(!!ok);
        if (ok && !cancelled) {
          setDescription(comm.description || '');
          setRules(comm.rules || '');
          setColor(comm.color || '#0079D3');
          setCategory(comm.category || 'general');
          if (comm.icon_url) {
            setIconPreview(comm.icon_url);
            setSavedIconUrl(comm.icon_url);
          }
          if (comm.banner_url) {
            setBannerPreview(comm.banner_url);
            setSavedBannerUrl(comm.banner_url);
          }
        }
      } catch (err: any) {
        if (!cancelled) toast('error', err.message || 'Failed to load community');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slug, user, authLoading, router, toast]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>, kind: 'icon' | 'banner') {
    const file = e.target.files?.[0];
    if (!file) return;
    const validation = validateImageFile(file);
    if (!validation.valid) { toast('error', validation.error!); return; }
    const max = kind === 'icon' ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > max) { toast('error', `Image must be under ${max / 1024 / 1024}MB`); return; }
    if (kind === 'icon') setIconFile(file);
    else setBannerFile(file);
    const reader = new FileReader();
    reader.onload = () => (kind === 'icon' ? setIconPreview : setBannerPreview)(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function uploadImage(file: File, folder: string): Promise<string | null> {
    try {
      if (isCloudinaryConfigured()) {
        const result = await uploadToCloudinary(file, `kura/communities/${folder}`);
        return result.secure_url;
      }
      const supabase = createClient();
      const ext = file.name.split('.').pop();
      const path = `${folder}/${Date.now()}.${ext}`;
      const bucket = folder === 'banner' ? 'community-banners' : 'community-icons';
      const { error } = await supabase.storage.from(bucket).upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
      return urlData.publicUrl;
    } catch (err: any) {
      toast('error', err.message || `Failed to upload ${folder}`);
      return null;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !community) return;
    setSaving(true);
    try {
      const supabase = createClient();
      // Start from saved URLs — a failed upload must never wipe them
      let iconUrl = savedIconUrl;
      let bannerUrl = savedBannerUrl;
      if (iconFile) {
        setUploadingIcon(true);
        const uploaded = await uploadImage(iconFile, 'icon');
        setUploadingIcon(false);
        if (!uploaded) throw new Error('Icon upload failed — nothing was saved.');
        iconUrl = uploaded;
      }
      if (bannerFile) {
        setUploadingBanner(true);
        const uploaded = await uploadImage(bannerFile, 'banner');
        setUploadingBanner(false);
        if (!uploaded) throw new Error('Banner upload failed — nothing was saved.');
        bannerUrl = uploaded;
      }
      const { error } = await supabase
        .from('communities')
        .update({
          description: description.trim() || null,
          rules: rules.trim() || null,
          color,
          category,
          icon_url: iconUrl,
          banner_url: bannerUrl,
        })
        .eq('id', community.id);
      if (error) throw error;
      // Edited community must render fresh everywhere instantly
      clearPageCache(`kmeta:${community.slug}`);
      clearPageCache(`k:${community.slug}`);
      clearPageCache('communities');
      toast('success', 'Community updated');
      router.push(`/k/${community.slug}`);
    } catch (err: any) {
      toast('error', err.message || 'Failed to update community');
    } finally {
      setSaving(false);
      setUploadingIcon(false);
      setUploadingBanner(false);
    }
  }

  if (authLoading || loading) return <div className="px-4 py-8"><LoadingSpinner /></div>;
  if (!user) return null;
  if (!community) {
    return (
      <div className="px-4 py-8">
        <EmptyState title="Community not found" />
      </div>
    );
  }
  if (!allowed) {
    return (
      <div className="px-4 py-8">
        <EmptyState
          title="Not allowed"
          description="Only the creator, moderators, and admins can edit this community."
          action={<Link href={`/k/${slug}`}><button className="kura-btn bg-[var(--brand-500)] text-white hover:bg-[var(--brand-600)] text-sm">Back to community</button></Link>}
        />
      </div>
    );
  }

  const isUploading = uploadingIcon || uploadingBanner;

  return (
    <div className="px-4 py-6 max-w-[640px] mx-auto">
      <h1 className="text-xl font-bold text-[var(--fg)] mb-1">Edit k/{community.slug}</h1>
      <p className="text-sm text-[var(--fg3)] mb-6">Update how your community looks and reads.</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Banner */}
        <div>
          <label className="block text-xs font-bold text-[var(--fg2)] mb-2 uppercase tracking-wide">Banner Image</label>
          <input ref={bannerInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={e => handleFile(e, 'banner')} className="hidden" />
          {bannerPreview ? (
            <div className="relative group rounded-lg overflow-hidden border border-[var(--border)]">
              <img src={bannerPreview} alt="Banner preview" className="w-full h-[120px] sm:h-[160px] object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button type="button" onClick={() => bannerInputRef.current?.click()}
                  className="px-4 py-2 bg-white/90 rounded-full text-sm font-bold text-gray-800 hover:bg-white transition-colors">
                  Change
                </button>
                <button type="button" onClick={() => { setBannerFile(null); setBannerPreview(savedBannerUrl); }}
                  className="px-4 py-2 bg-white/90 rounded-full text-sm font-bold text-gray-800 hover:bg-white transition-colors">
                  Reset
                </button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => bannerInputRef.current?.click()}
              className="w-full border-2 border-dashed border-[var(--border)] rounded-lg p-6 text-center hover:border-[var(--brand-500)] hover:bg-[var(--surface-hover)] transition-all cursor-pointer">
              <p className="text-sm text-[var(--fg4)]">Add banner image</p>
              <p className="text-xs text-[var(--fg4)] mt-1">Recommended: 1200x300px. Max 10MB.</p>
            </button>
          )}
        </div>

        {/* Icon + Color */}
        <div className="flex items-start gap-4">
          <div className="shrink-0">
            <label className="block text-xs font-bold text-[var(--fg2)] mb-2 uppercase tracking-wide">Icon</label>
            <input ref={iconInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={e => handleFile(e, 'icon')} className="hidden" />
            <button type="button" onClick={() => iconInputRef.current?.click()}
              className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-full border-2 border-dashed border-[var(--border)] hover:border-[var(--brand-500)] flex items-center justify-center overflow-hidden transition-colors group"
              style={{ backgroundColor: iconPreview ? undefined : color }}>
              {iconPreview ? (
                <img src={iconPreview} alt="Icon" className="h-full w-full object-cover" />
              ) : (
                <span className="text-white font-bold text-xl">{community.name.charAt(0).toUpperCase()}</span>
              )}
            </button>
          </div>
          <div className="flex-1 min-w-0">
            <label className="block text-xs font-bold text-[var(--fg2)] mb-2 uppercase tracking-wide">Theme Color</label>
            <div className="flex flex-wrap gap-2">
              {COMMUNITY_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label={`Color ${c}`}
                  className={cn(
                    'h-9 w-9 rounded-full border-2 transition-all',
                    color === c ? 'border-[var(--fg)] scale-110' : 'border-transparent hover:scale-105'
                  )}
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check className="h-4 w-4 text-white mx-auto" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-bold text-[var(--fg2)] mb-2 uppercase tracking-wide">Category</label>
          <div className="flex flex-wrap gap-2">
            {COMMUNITY_CATEGORIES.map(c => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCategory(c.value)}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-full transition-all',
                  category === c.value
                    ? 'bg-[var(--brand-500)] text-white'
                    : 'bg-[var(--surface-hover)] text-[var(--fg3)] border border-[var(--border)] hover:border-[var(--border-strong)]'
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-[var(--fg2)] mb-2 uppercase tracking-wide">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What is this community about?" rows={3} maxLength={500}
            className="w-full p-3 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] text-[var(--fg)] placeholder:text-[var(--fg4)] focus:outline-none focus:border-[var(--brand-500)] hover:border-[var(--border-strong)] transition-all resize-none" />
        </div>

        {/* Rules */}
        <div>
          <label className="block text-xs font-bold text-[var(--fg2)] mb-2 uppercase tracking-wide">Rules (one per line)</label>
          <textarea value={rules} onChange={e => setRules(e.target.value)} placeholder={'Be respectful\nNo spam'} rows={4} maxLength={2000}
            className="w-full p-3 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] text-[var(--fg)] placeholder:text-[var(--fg4)] focus:outline-none focus:border-[var(--brand-500)] hover:border-[var(--border-strong)] transition-all resize-none" />
        </div>

        <div className="flex items-center justify-end gap-2">
          <Link href={`/k/${slug}`}>
            <button type="button" className="px-6 py-2.5 text-sm font-bold text-[var(--fg4)] hover:bg-[var(--surface-hover)] rounded-full transition-colors">
              Cancel
            </button>
          </Link>
          <button
            type="submit"
            disabled={saving || isUploading}
            className={cn(
              'px-8 py-2.5 rounded-full text-sm font-bold transition-all',
              !saving && !isUploading
                ? 'bg-[var(--brand-500)] text-white hover:bg-[var(--brand-600)] shadow-sm'
                : 'bg-[var(--fg4)] text-[var(--bg)] cursor-not-allowed opacity-50'
            )}
          >
            {saving || isUploading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
      <div className="pb-20 lg:pb-8" />
    </div>
  );
}
