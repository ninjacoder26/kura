'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { requireSession, friendlyDbError } from '@/lib/dbErrors';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/providers/ToastProvider';

const REASONS = [
  { key: 'spam', label: 'Spam', desc: 'Repetitive or unwanted content' },
  { key: 'harassment', label: 'Harassment', desc: 'Bullying or threatening behavior' },
  { key: 'hate_speech', label: 'Hate speech', desc: 'Attacks based on identity' },
  { key: 'violence', label: 'Violence', desc: 'Threats or glorification of harm' },
  { key: 'misinformation', label: 'Misinformation', desc: 'False or misleading claims' },
  { key: 'copyright', label: 'Copyright', desc: 'Infringes intellectual property' },
  { key: 'nsfw', label: 'NSFW', desc: 'Adult or graphic content' },
  { key: 'other', label: 'Other', desc: 'Something else is wrong' },
];

interface ReportDialogProps {
  targetType: 'post' | 'comment';
  targetId: string;
  onClose: () => void;
}

export default function ReportDialog({ targetType, targetId, onClose }: ReportDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [category, setCategory] = useState('spam');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!user) {
      toast('info', 'Log in to report content');
      return;
    }
    setSubmitting(true);
    try {
      const supabase = createClient();
      if (!(await requireSession(supabase, () => {
        toast('error', 'Your session expired. Please log in again.');
        onClose();
        router.push('/login');
      }))) return;
      const reason = REASONS.find(r => r.key === category);
      const { error } = await supabase.from('reports').insert({
        reporter_id: user.id,
        post_id: targetType === 'post' ? targetId : null,
        comment_id: targetType === 'comment' ? targetId : null,
        reason: reason?.label ?? category,
        category,
      });
      if (error) throw error;
      toast('success', 'Thanks — our moderators will review this');
      onClose();
    } catch (err: any) {
      toast('error', friendlyDbError(err.message, { authed: true, action: 'submit this report' }));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-label="Report content">
      <div className="absolute inset-0 bg-black/50 anim-fade-in" onClick={onClose} />
      <div className="relative w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-lg)] anim-scale-in max-h-[85vh] flex flex-col">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)]">
          <Flag className="h-4 w-4 text-[var(--fg4)]" />
          <h2 className="text-sm font-bold text-[var(--fg)] flex-1">Report {targetType}</h2>
          <button onClick={onClose} className="vote-btn icon-btn !w-8 !h-8" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto p-2">
          {REASONS.map(r => (
            <button
              key={r.key}
              onClick={() => setCategory(r.key)}
              className={cn(
                'w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                category === r.key ? 'bg-[var(--surface-hover)]' : 'hover:bg-[var(--surface-hover)]'
              )}
            >
              <span className={cn(
                'mt-1 h-4 w-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors',
                category === r.key ? 'border-[var(--brand-500)]' : 'border-[var(--border-strong)]'
              )}>
                {category === r.key && <span className="h-2 w-2 rounded-full bg-[var(--brand-500)]" />}
              </span>
              <span>
                <span className="block text-sm font-semibold text-[var(--fg)]">{r.label}</span>
                <span className="block text-xs text-[var(--fg4)]">{r.desc}</span>
              </span>
            </button>
          ))}
        </div>
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-[var(--border)]">
          <button onClick={onClose} className="kura-btn border border-[var(--border)] text-[var(--fg2)] hover:border-[var(--border-strong)] bg-transparent text-sm">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="kura-btn bg-[var(--brand-500)] text-white hover:bg-[var(--brand-600)] disabled:opacity-50 text-sm"
          >
            {submitting ? 'Submitting…' : 'Submit Report'}
          </button>
        </div>
      </div>
    </div>
  );
}
