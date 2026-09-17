'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { slugify } from '@/lib/utils';
import { COMMUNITY_CATEGORIES } from '@/lib/constants';
import Link from 'next/link';
import { uploadToCloudinary, isCloudinaryConfigured, validateImageFile } from '@/lib/cloudinary';
import { Camera, Loader2, Check, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CreateCommunityPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [submitting, setSubmitting] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);

  // Banner and icon
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const iconInputRef = useRef<HTMLInputElement>(null);

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

  function handleBannerSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const validation = validateImageFile(file);
    if (!validation.valid) { toast('error', validation.error!); return; }
    if (file.size > 10 * 1024 * 1024) { toast('error', 'Banner must be under 10MB'); return; }
    setBannerFile(file);
    const reader = new FileReader();
    reader.onload = () => setBannerPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleIconSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const validation = validateImageFile(file);
    if (!validation.valid) { toast('error', validation.error!); return; }
    if (file.size > 5 * 1024 * 1024) { toast('error', 'Icon must be under 5MB'); return; }
    setIconFile(file);
    const reader = new FileReader();
    reader.onload = () => setIconPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function uploadImage(file: File, folder: string): Promise<string | null> {
    try {
      if (isCloudinaryConfigured()) {
        const result = await uploadToCloudinary(file, `kura/communities/${folder}`);
        return result.secure_url;
      }
      // Fallback to Supabase Storage
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
    if (!user || !name.trim() || !slugAvailable) return;
    setSubmitting(true);
    try {
      const supabase = createClient();

      let bannerUrl: string | null = null;
      let iconUrl: string | null = null;

      if (bannerFile) {
        setUploadingBanner(true);
        bannerUrl = await uploadImage(bannerFile, 'banner');
        setUploadingBanner(false);
      }
      if (iconFile) {
        setUploadingIcon(true);
        iconUrl = await uploadImage(iconFile, 'icon');
        setUploadingIcon(false);
      }

      const { data, error } = await supabase.from('communities').insert({
        name: name.trim(),
        slug,
        description: description.trim() || null,
        category,
        created_by: user.id,
        banner_url: bannerUrl,
        icon_url: iconUrl,
      }).select('slug').single();
      if (error) throw error;
      toast('success', `k/${slug} created!`);
      router.push(`/k/${data.slug}`);
    } catch (err: any) {
      toast('error', err.message || 'Failed to create community');
    } finally {
      setSubmitting(false);
      setUploadingBanner(false);
      setUploadingIcon(false);
    }
  }

  if (authLoading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[var(--brand-500)]" /></div>;
  if (!user) return null;

  const isUploading = uploadingBanner || uploadingIcon;

  return (
      <div className="px-4 py-6 max-w-[640px] mx-auto">
        <h1 className="text-xl font-bold text-[var(--fg)] mb-1">Create a Community</h1>
        <p className="text-sm text-[var(--fg3)] mb-6">Build a space for people to discuss topics you care about.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Banner Preview */}
          <div>
            <label className="block text-xs font-bold text-[var(--fg2)] mb-2 uppercase tracking-wide">Banner Image</label>
            <div className="relative">
              <input ref={bannerInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleBannerSelect} className="hidden" />
              {bannerPreview ? (
                <div className="relative group rounded-lg overflow-hidden border border-[var(--border)]">
                  <img src={bannerPreview} alt="Banner preview" className="w-full h-[120px] sm:h-[160px] object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button type="button" onClick={() => bannerInputRef.current?.click()}
                      className="px-4 py-2 bg-white/90 rounded-full text-sm font-bold text-gray-800 hover:bg-white transition-colors">
                      Change
                    </button>
                    <button type="button" onClick={() => { setBannerFile(null); setBannerPreview(null); }}
                      className="px-4 py-2 bg-red-500/90 rounded-full text-sm font-bold text-white hover:bg-red-500 transition-colors">
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => bannerInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-[var(--border)] rounded-lg p-6 text-center hover:border-[var(--brand-500)] hover:bg-[var(--surface-hover)] transition-all cursor-pointer">
                  <Camera className="h-8 w-8 mx-auto text-[var(--fg4)] mb-2" />
                  <p className="text-sm text-[var(--fg4)]">Add banner image</p>
                  <p className="text-xs text-[var(--fg4)] mt-1">Recommended: 1200x300px. Max 10MB.</p>
                </button>
              )}
            </div>
          </div>

          {/* Icon + Name Row */}
          <div className="flex items-start gap-4">
            {/* Community Icon */}
            <div className="shrink-0">
              <label className="block text-xs font-bold text-[var(--fg2)] mb-2 uppercase tracking-wide">Icon</label>
              <input ref={iconInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleIconSelect} className="hidden" />
              <button type="button" onClick={() => iconInputRef.current?.click()}
                className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-full border-2 border-dashed border-[var(--border)] hover:border-[var(--brand-500)] flex items-center justify-center overflow-hidden transition-colors group">
                {iconPreview ? (
                  <>
                    <img src={iconPreview} alt="Icon" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera className="h-5 w-5 text-white" />
                    </div>
                  </>
                ) : (
                  <Camera className="h-6 w-6 text-[var(--fg4)]" />
                )}
              </button>
              <p className="text-[10px] text-[var(--fg4)] mt-1 text-center">Square</p>
            </div>

            {/* Name Input */}
            <div className="flex-1">
              <label className="block text-xs font-bold text-[var(--fg2)] mb-2 uppercase tracking-wide">Name</label>
              <p className="text-xs text-[var(--fg4)] mb-2">Community names cannot be changed after creation.</p>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--fg4)] font-bold">k/</span>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="communityname"
                  required
                  minLength={3}
                  maxLength={21}
                  className="w-full h-11 pl-8 pr-3 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--fg)] placeholder:text-[var(--fg4)] focus:outline-none focus:border-[var(--brand-500)] hover:border-[var(--border-strong)] transition-all"
                />
              </div>
              {slug && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  {slugAvailable === null && <Info className="h-3.5 w-3.5 text-[var(--fg4)]" />}
                  {slugAvailable === false && <X className="h-3.5 w-3.5 text-red-500" />}
                  {slugAvailable === true && <Check className="h-3.5 w-3.5 text-emerald-500" />}
                  <p className="text-xs">
                    {slugAvailable === null && <span className="text-[var(--fg4)]">k/{slug}</span>}
                    {slugAvailable === false && <span className="text-red-500">k/{slug} is already taken</span>}
                    {slugAvailable === true && <span className="text-emerald-500">k/{slug} is available</span>}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-[var(--fg2)] mb-2 uppercase tracking-wide">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Tell people what this community is about"
              rows={3}
              maxLength={500}
              className="w-full p-3 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--fg)] placeholder:text-[var(--fg4)] focus:outline-none focus:border-[var(--brand-500)] hover:border-[var(--border-strong)] transition-all resize-none"
            />
            <p className="text-xs text-[var(--fg4)] mt-1">{description.length}/500</p>
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
                      ? 'bg-[var(--brand-500)] text-white shadow-sm'
                      : 'bg-[var(--surface)] text-[var(--fg3)] border border-[var(--border)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]'
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <Link href="/communities">
              <button type="button" className="px-6 py-2.5 text-sm font-bold text-[var(--fg4)] hover:bg-[var(--surface-hover)] rounded-full transition-colors">
                Cancel
              </button>
            </Link>
            <button
              type="submit"
              disabled={!name.trim() || !slugAvailable || submitting || isUploading}
              className={cn(
                'px-8 py-2.5 rounded-full text-sm font-bold transition-all',
                name.trim() && slugAvailable && !submitting && !isUploading
                  ? 'bg-[var(--brand-500)] text-white hover:bg-[var(--brand-600)] shadow-sm'
                  : 'bg-[var(--fg4)] text-[var(--bg)] cursor-not-allowed opacity-50'
              )}
            >
              {submitting || isUploading ? (
                <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Creating...</span>
              ) : (
                'Create Community'
              )}
            </button>
          </div>
        </form>
        <div className="pb-20 lg:pb-8" />
      </div>
  );
}
