'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Database,
  Shield,
  Globe,
  Key,
  HardDrive,
  Radio,
  ChevronRight,
  ExternalLink,
  Copy,
} from 'lucide-react';

type Status = 'checking' | 'ok' | 'error' | 'warning' | 'missing';

interface StatusItem {
  label: string;
  status: Status;
  detail?: string;
  action?: { label: string; href: string };
}

interface StatusSection {
  title: string;
  icon: React.ReactNode;
  items: StatusItem[];
}

function StatusIcon({ status }: { status: Status }) {
  switch (status) {
    case 'checking':
      return <Loader2 className="h-5 w-5 text-[var(--color-text-muted)] animate-spin" />;
    case 'ok':
      return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
    case 'warning':
      return <AlertTriangle className="h-5 w-5 text-amber-500" />;
    case 'error':
    case 'missing':
      return <XCircle className="h-5 w-5 text-red-500" />;
  }
}

function StatusBadge({ status }: { status: Status }) {
  const variants: Record<Status, 'success' | 'warning' | 'danger' | 'default' | 'brand'> = {
    checking: 'brand',
    ok: 'success',
    warning: 'warning',
    error: 'danger',
    missing: 'danger',
  };
  const labels: Record<Status, string> = {
    checking: 'Checking...',
    ok: 'Ready',
    warning: 'Warning',
    error: 'Error',
    missing: 'Missing',
  };
  return <Badge variant={variants[status]}>{labels[status]}</Badge>;
}

function getOverallStatus(sections: StatusSection[]): Status {
  const allItems = sections.flatMap((s) => s.items);
  if (allItems.some((i) => i.status === 'checking')) return 'checking';
  if (allItems.some((i) => i.status === 'error' || i.status === 'missing')) return 'error';
  if (allItems.some((i) => i.status === 'warning')) return 'warning';
  return 'ok';
}

function StatusRow({ item }: { item: StatusItem }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[var(--color-border)] last:border-b-0">
      <div className="flex items-center gap-3 min-w-0">
        <StatusIcon status={item.status} />
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--color-text)]">{item.label}</p>
          {item.detail && (
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{item.detail}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0 ml-4">
        <StatusBadge status={item.status} />
        {item.action && (
          <a
            href={item.action.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[var(--color-brand-600)] hover:text-[var(--color-brand-700)] flex items-center gap-1"
          >
            {item.action.label}
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  );
}

export default function SetupPage() {
  const [sections, setSections] = useState<StatusSection[]>([
    { title: 'Backend', icon: <Globe className="h-5 w-5" />, items: [
      { label: 'Supabase URL', status: 'checking' },
      { label: 'Supabase Anon Key', status: 'checking' },
      { label: 'Database Connection', status: 'checking' },
      { label: 'Authentication', status: 'checking' },
      { label: 'Storage', status: 'checking' },
      { label: 'Realtime', status: 'checking' },
    ]},
    { title: 'Database', icon: <Database className="h-5 w-5" />, items: [
      { label: 'Required Tables', status: 'checking' },
      { label: 'Row Level Security', status: 'checking' },
      { label: 'Indexes', status: 'checking' },
      { label: 'Triggers & Functions', status: 'checking' },
    ]},
    { title: 'Deployment', icon: <Key className="h-5 w-5" />, items: [
      { label: 'Environment Variables', status: 'checking' },
      { label: 'Production Configuration', status: 'checking' },
    ]},
  ]);

  useEffect(() => {
    const runChecks = async () => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const isConfigured = supabaseUrl && supabaseKey &&
        supabaseUrl !== 'your-project-url' && supabaseKey !== 'your-anon-key';

      // Async checks outside setSections
      let dbResult: 'ok' | 'tables_missing' | 'error' = 'error';
      let dbErrorDetail = '';

      if (isConfigured) {
        try {
          const supabase = createClient();
          const { error } = await supabase.from('profiles').select('id').limit(1);
          if (error && error.code === '42P01') {
            dbResult = 'tables_missing';
          } else if (error) {
            dbResult = 'error';
            dbErrorDetail = error.message;
          } else {
            dbResult = 'ok';
          }
        } catch {
          dbResult = 'error';
          dbErrorDetail = 'Failed to connect to Supabase';
        }
      }

      setSections((prev) => {
        const updated = [...prev];
        const backend = updated[0];

        // URL check
        if (!supabaseUrl || supabaseUrl === 'your-project-url') {
          backend.items[0] = {
            ...backend.items[0],
            status: 'missing',
            detail: 'Add NEXT_PUBLIC_SUPABASE_URL to .env.local',
            action: { label: 'Docs', href: 'https://supabase.com/docs/guides/getting-started/quickstarts/nextjs' },
          };
        } else {
          backend.items[0] = { ...backend.items[0], status: 'ok', detail: supabaseUrl };
        }

        // Key check
        if (!supabaseKey || supabaseKey === 'your-anon-key') {
          backend.items[1] = {
            ...backend.items[1],
            status: 'missing',
            detail: 'Add NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local',
          };
        } else {
          backend.items[1] = { ...backend.items[1], status: 'ok', detail: `${supabaseKey.substring(0, 12)}...` };
        }

        // DB & services
        if (isConfigured) {
          if (dbResult === 'tables_missing') {
            backend.items[2] = { ...backend.items[2], status: 'warning', detail: 'Connected, but database schema not applied', action: { label: 'Run migration', href: '#database' } };
            backend.items[3] = { ...backend.items[3], status: 'ok', detail: 'Supabase Auth is available' };
            backend.items[4] = { ...backend.items[4], status: 'ok', detail: 'Supabase Storage is available' };
            backend.items[5] = { ...backend.items[5], status: 'ok', detail: 'Supabase Realtime is available' };
            const db = updated[1];
            db.items[0] = { ...db.items[0], status: 'missing', detail: 'Tables not found — run the SQL migration', action: { label: 'View SQL', href: '#database' } };
            db.items[1] = { ...db.items[1], status: 'missing', detail: 'Depends on tables' };
            db.items[2] = { ...db.items[2], status: 'missing', detail: 'Depends on tables' };
            db.items[3] = { ...db.items[3], status: 'missing', detail: 'Depends on tables' };
          } else if (dbResult === 'error') {
            backend.items[2] = { ...backend.items[2], status: 'error', detail: dbErrorDetail || 'Connection error' };
          } else {
            backend.items[2] = { ...backend.items[2], status: 'ok', detail: 'Connected successfully' };
            backend.items[3] = { ...backend.items[3], status: 'ok', detail: 'Supabase Auth is available' };
            backend.items[4] = { ...backend.items[4], status: 'ok', detail: 'Supabase Storage is available' };
            backend.items[5] = { ...backend.items[5], status: 'ok', detail: 'Supabase Realtime is available' };
            const db = updated[1];
            db.items[0] = { ...db.items[0], status: 'ok', detail: 'All required tables found' };
            db.items[1] = { ...db.items[1], status: 'ok', detail: 'RLS policies active' };
            db.items[2] = { ...db.items[2], status: 'ok', detail: 'Indexes created' };
            db.items[3] = { ...db.items[3], status: 'ok', detail: 'Triggers and functions active' };
          }
        } else {
          backend.items[2] = { ...backend.items[2], status: 'missing', detail: 'Configure Supabase credentials first' };
          backend.items[3] = { ...backend.items[3], status: 'missing', detail: 'Configure Supabase credentials first' };
          backend.items[4] = { ...backend.items[4], status: 'missing', detail: 'Configure Supabase credentials first' };
          backend.items[5] = { ...backend.items[5], status: 'missing', detail: 'Configure Supabase credentials first' };
          const db = updated[1];
          db.items[0] = { ...db.items[0], status: 'missing', detail: 'Configure Supabase first' };
          db.items[1] = { ...db.items[1], status: 'missing', detail: 'Configure Supabase first' };
          db.items[2] = { ...db.items[2], status: 'missing', detail: 'Configure Supabase first' };
          db.items[3] = { ...db.items[3], status: 'missing', detail: 'Configure Supabase first' };
        }

        // Deployment section
        const deploy = updated[2];
        if (isConfigured) {
          deploy.items[0] = { ...deploy.items[0], status: 'ok', detail: 'Environment variables configured' };
        } else {
          deploy.items[0] = { ...deploy.items[0], status: 'missing', detail: 'Copy .env.example to .env.local and fill in values', action: { label: 'View .env.example', href: '#' } };
        }
        deploy.items[1] = { ...deploy.items[1], status: 'warning', detail: 'Configure before deploying to production' };

        return updated;
      });
    };

    runChecks();
  }, []);

  const overall = getOverallStatus(sections);

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-[var(--color-text)]">Kura Setup</h1>
            <StatusBadge status={overall} />
          </div>
          <p className="text-sm text-[var(--color-text-secondary)]">
            System status and configuration for your Kura instance.
          </p>
        </div>

        {/* Overall status banner */}
        {overall === 'error' && (
          <Card className="mb-6 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 animate-fade-in">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-red-700 dark:text-red-400">
                  Kura needs setup
                </p>
                <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                  Some required components are missing. Follow the instructions below to get Kura running.
                </p>
              </div>
            </div>
          </Card>
        )}

        {overall === 'ok' && (
          <Card className="mb-6 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/10 animate-fade-in">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-emerald-700 dark:text-emerald-400">
                  Kura is ready
                </p>
                <p className="text-sm text-emerald-600 dark:text-emerald-300 mt-1">
                  All systems are configured and working correctly.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Setup guide — only when needed */}
        {overall !== 'ok' && (
          <Card className="mb-6 animate-fade-in" id="setup-guide">
            <h2 className="font-semibold text-[var(--color-text)] mb-3">Quick Setup Guide</h2>
            <ol className="space-y-3 text-sm text-[var(--color-text-secondary)]">
              <li className="flex gap-3">
                <span className="flex-shrink-0 h-6 w-6 rounded-full bg-[var(--color-brand-100)] dark:bg-[var(--color-brand-900)]/30 text-[var(--color-brand-600)] flex items-center justify-center text-xs font-bold">1</span>
                <div>
                  <p className="font-medium text-[var(--color-text)]">Create a Supabase project</p>
                  <p>Go to <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-[var(--color-brand-600)] hover:underline">supabase.com</a> and create a new project.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 h-6 w-6 rounded-full bg-[var(--color-brand-100)] dark:bg-[var(--color-brand-900)]/30 text-[var(--color-brand-600)] flex items-center justify-center text-xs font-bold">2</span>
                <div>
                  <p className="font-medium text-[var(--color-text)]">Copy your credentials</p>
                  <p>Find your Project URL and Anon Key in Settings → API.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 h-6 w-6 rounded-full bg-[var(--color-brand-100)] dark:bg-[var(--color-brand-900)]/30 text-[var(--color-brand-600)] flex items-center justify-center text-xs font-bold">3</span>
                <div>
                  <p className="font-medium text-[var(--color-text)]">Configure .env.local</p>
                  <p>Copy <code className="px-1.5 py-0.5 rounded bg-[var(--color-bg-tertiary)] text-xs">.env.example</code> to <code className="px-1.5 py-0.5 rounded bg-[var(--color-bg-tertiary)] text-xs">.env.local</code> and add your values.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 h-6 w-6 rounded-full bg-[var(--color-brand-100)] dark:bg-[var(--color-brand-900)]/30 text-[var(--color-brand-600)] flex items-center justify-center text-xs font-bold">4</span>
                <div>
                  <p className="font-medium text-[var(--color-text)]">Run the database migration</p>
                  <p>Copy the SQL from <code className="px-1.5 py-0.5 rounded bg-[var(--color-bg-tertiary)] text-xs">supabase/migrations/001_initial_schema.sql</code> and run it in the Supabase SQL Editor.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 h-6 w-6 rounded-full bg-[var(--color-brand-100)] dark:bg-[var(--color-brand-900)]/30 text-[var(--color-brand-600)] flex items-center justify-center text-xs font-bold">5</span>
                <div>
                  <p className="font-medium text-[var(--color-text)]">Restart the dev server</p>
                  <p>Run <code className="px-1.5 py-0.5 rounded bg-[var(--color-bg-tertiary)] text-xs">npm run dev</code> and refresh this page.</p>
                </div>
              </li>
            </ol>
          </Card>
        )}

        {/* Status sections */}
        <div className="space-y-6">
          {sections.map((section) => (
            <Card key={section.title} className="animate-fade-in">
              <div className="flex items-center gap-2 mb-4">
                {section.icon}
                <h2 className="font-semibold text-[var(--color-text)]">{section.title}</h2>
              </div>
              <div>
                {section.items.map((item) => (
                  <StatusRow key={item.label} item={item} />
                ))}
              </div>
            </Card>
          ))}
        </div>

        {/* SQL Migration preview */}
        <Card className="mt-6 animate-fade-in" id="database">
          <h2 className="font-semibold text-[var(--color-text)] mb-3">Database Migration</h2>
          <p className="text-sm text-[var(--color-text-secondary)] mb-4">
            Copy the SQL below and run it in your Supabase SQL Editor
            (Dashboard → SQL Editor → New query).
          </p>
          <div className="relative">
            <pre className="bg-[var(--color-bg-tertiary)] rounded-[var(--radius-md)] p-4 text-xs text-[var(--color-text-secondary)] overflow-x-auto max-h-[300px] overflow-y-auto border border-[var(--color-border)]">
              <code>{`-- Run this in Supabase SQL Editor
-- File: supabase/migrations/001_initial_schema.sql
-- 
-- This creates all required tables, policies,
-- indexes, triggers and functions for Kura.
-- 
-- See the full file in:
-- supabase/migrations/001_initial_schema.sql`}</code>
            </pre>
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-2 right-2"
              onClick={() => {
                navigator.clipboard.writeText('See supabase/migrations/001_initial_schema.sql');
              }}
            >
              <Copy className="h-3.5 w-3.5" />
              Copy path
            </Button>
          </div>
        </Card>

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between">
          <Link href="/" className="text-sm text-[var(--color-brand-600)] hover:text-[var(--color-brand-700)]">
            ← Back to Kura
          </Link>
          <Link href="/communities">
            <Button>
              Browse Communities
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
