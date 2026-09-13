'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import MobileNav from '@/components/layout/MobileNav';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Card from '@/components/ui/Card';
import { FileText, Link2, Image as ImageIcon, ChevronDown, ArrowLeft, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const POST_TYPES = [
  { value: 'text', label: 'Text', icon: FileText },
  { value: 'link', label: 'Link', icon: Link2 },
  { value: 'image', label: 'Image', icon: ImageIcon },
];

const MOCK_COMMUNITIES = [
  { slug: 'kathmandu', name: 'Kathmandu' },
  { slug: 'nepali-tech', name: 'Nepali Tech' },
  { slug: 'tu-students', name: 'TU Students' },
  { slug: 'nepal-food', name: 'Nepal Food' },
  { slug: 'gaming-nepal', name: 'Gaming Nepal' },
  { slug: 'travel-nepal', name: 'Travel Nepal' },
];

export default function SubmitPage() {
  const router = useRouter();
  const [type, setType] = useState('text');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('');
  const [communitySlug, setCommunitySlug] = useState('');
  const [showCommunityDropdown, setShowCommunityDropdown] = useState(false);
  const [communitySearch, setCommunitySearch] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filteredCommunities = MOCK_COMMUNITIES.filter((c) =>
    c.name.toLowerCase().includes(communitySearch.toLowerCase())
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    // Simulate submission
    setTimeout(() => {
      setSubmitting(false);
      if (communitySlug) {
        router.push(`/r/${communitySlug}`);
      } else {
        router.push('/');
      }
    }, 1000);
  }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-2xl px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 animate-fade-in">
          <Link href="/" className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold text-[var(--color-text)]">Create a post</h1>
        </div>

        {/* Community selector */}
        <div className="mb-4 animate-fade-in">
          <div className="relative">
            <button
              onClick={() => setShowCommunityDropdown(!showCommunityDropdown)}
              className="w-full flex items-center justify-between h-10 px-3 text-sm rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-strong)] transition-colors"
            >
              {communitySlug ? (
                <span className="text-[var(--color-text)]">
                  r/{communitySlug}
                </span>
              ) : (
                <span className="text-[var(--color-text-muted)]">Choose a community</span>
              )}
              <ChevronDown className="h-4 w-4 text-[var(--color-text-muted)]" />
            </button>

            {showCommunityDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-lg)] z-10 animate-slide-down">
                <div className="p-2 border-b border-[var(--color-border)]">
                  <input
                    type="text"
                    placeholder="Search communities..."
                    value={communitySearch}
                    onChange={(e) => setCommunitySearch(e.target.value)}
                    className="w-full h-8 px-2 text-sm bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius-sm)] outline-none focus:ring-1 focus:ring-[var(--color-brand-500)]"
                    autoFocus
                  />
                </div>
                <div className="max-h-[200px] overflow-y-auto p-1">
                  {filteredCommunities.map((c) => (
                    <button
                      key={c.slug}
                      onClick={() => {
                        setCommunitySlug(c.slug);
                        setShowCommunityDropdown(false);
                        setCommunitySearch('');
                      }}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-[var(--radius-sm)] text-left transition-colors',
                        communitySlug === c.slug
                          ? 'bg-[var(--color-brand-50)] text-[var(--color-brand-600)]'
                          : 'text-[var(--color-text)] hover:bg-[var(--color-bg-tertiary)]'
                      )}
                    >
                      <div className="h-6 w-6 rounded bg-[var(--color-brand-500)] flex items-center justify-center text-white text-[10px] font-bold">
                        {c.name.charAt(0)}
                      </div>
                      r/{c.slug}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Post type tabs */}
        <div className="flex border border-[var(--color-border)] rounded-t-[var(--radius-md)] bg-[var(--color-bg-secondary)] animate-fade-in">
          {POST_TYPES.map((postType) => {
            const Icon = postType.icon;
            return (
              <button
                key={postType.value}
                onClick={() => setType(postType.value)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors',
                  type === postType.value
                    ? 'border-[var(--color-brand-600)] text-[var(--color-brand-600)] bg-[var(--color-surface)]'
                    : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                )}
              >
                <Icon className="h-4 w-4" />
                {postType.label}
              </button>
            );
          })}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="animate-fade-in">
          <div className="border border-t-0 border-[var(--color-border)] rounded-b-[var(--radius-md)] bg-[var(--color-surface)] p-4 space-y-4">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              maxLength={300}
              required
            />

            {type === 'text' && (
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Text (optional). Markdown is supported."
                className="min-h-[200px]"
              />
            )}

            {type === 'link' && (
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="URL"
                type="url"
              />
            )}

            {type === 'image' && (
              <div className="border-2 border-dashed border-[var(--color-border)] rounded-[var(--radius-md)] p-8 text-center hover:border-[var(--color-brand-500)] transition-colors cursor-pointer">
                <ImageIcon className="h-8 w-8 mx-auto text-[var(--color-text-muted)] mb-2" />
                <p className="text-sm text-[var(--color-text-muted)]">
                  Drag and drop an image, or click to browse
                </p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                  PNG, JPG, GIF up to 10MB
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 mt-4">
            <Link href="/">
              <Button variant="ghost" type="button">Cancel</Button>
            </Link>
            <Button type="submit" disabled={!title.trim() || submitting}>
              {submitting ? 'Posting...' : 'Post'}
            </Button>
          </div>
        </form>
      </div>
      <MobileNav />
    </div>
  );
}
