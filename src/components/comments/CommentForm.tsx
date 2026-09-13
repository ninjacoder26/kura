'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';

interface CommentFormProps {
  onSubmit: (body: string) => void;
  placeholder?: string;
}

export default function CommentForm({ onSubmit, placeholder = 'Write a comment...' }: CommentFormProps) {
  const [body, setBody] = useState('');
  const [focused, setFocused] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
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
        className="w-full p-3 text-sm bg-[var(--bg)] border-none outline-none resize-none min-h-[90px] text-[var(--fg)] placeholder:text-[var(--fg4)]"
      />
      <div className="flex items-center justify-between px-3 py-2 bg-[var(--bg-alt)] border-t border-[var(--border)]">
        <p className="text-[11px] text-[var(--fg4)] hidden sm:block">Markdown supported</p>
        <Button type="submit" size="xs" disabled={!body.trim()}>Comment</Button>
      </div>
    </form>
  );
}
