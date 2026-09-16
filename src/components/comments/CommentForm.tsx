'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';

interface CommentFormProps {
  onSubmit: (body: string) => void | Promise<void>;
  placeholder?: string;
  loading?: boolean;
}

export default function CommentForm({ onSubmit, placeholder = 'Write a comment...', loading = false }: CommentFormProps) {
  const [body, setBody] = useState('');
  const [focused, setFocused] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || loading) return;
    onSubmit(body.trim());
    setBody('');
  }

  return (
    <form onSubmit={handleSubmit} className={`border rounded-[var(--r-md)] overflow-hidden transition-all ${focused ? 'border-[var(--brand-500)] ring-1 ring-[var(--brand-500)]' : 'border-[var(--border)]'}`}>
      <textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        disabled={loading}
        className="w-full p-3 text-sm bg-[var(--bg)] border-none outline-none resize-none min-h-[90px] text-[var(--fg)] placeholder:text-[var(--fg4)] disabled:opacity-50"
      />
      <div className="flex items-center justify-between px-3 py-2 bg-[var(--bg-alt)] border-t border-[var(--border)]">
        <Button type="submit" size="xs" disabled={!body.trim() || loading} loading={loading}>Comment</Button>
      </div>
    </form>
  );
}
