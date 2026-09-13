'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';

interface CommentFormProps {
  onSubmit: (body: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export default function CommentForm({ onSubmit, placeholder = 'Write a comment...', autoFocus = false }: CommentFormProps) {
  const [body, setBody] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    onSubmit(body.trim());
    setBody('');
  }

  return (
    <form onSubmit={handleSubmit} className="border border-[var(--color-border)] rounded-[var(--radius-md)] overflow-hidden">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full p-3 text-sm bg-[var(--color-bg)] border-none outline-none resize-none min-h-[100px] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]"
      />
      <div className="flex items-center justify-between px-3 py-2 bg-[var(--color-bg-secondary)] border-t border-[var(--color-border)]">
        <p className="text-xs text-[var(--color-text-muted)]">
          Markdown supported
        </p>
        <Button type="submit" size="sm" disabled={!body.trim()}>
          Comment
        </Button>
      </div>
    </form>
  );
}
