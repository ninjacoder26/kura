'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { CheckCircle2, XCircle, AlertTriangle, Loader2, Database, Globe, Key, ChevronRight, ExternalLink, Copy } from 'lucide-react';

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
    case 'checking': return <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--fg4)] animate-spin" />;
    case 'ok': return <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" />;
    case 'warning': return <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />;
    default: return <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />;
  }
}

function StatusBadge({ status }: { status: Status }) {
  const v: Record<Status, 'success' | 'warning' | 'danger' | 'default' | 'brand'> = { checking: 'brand', ok: 'success', warning: 'warning', error: 'danger', missing: 'danger' };
  const l: Record<Status, string> = { checking: 'Checking', ok: 'Ready', warning: 'Warning', error: 'Error', missing: 'Missing' };
  return <Badge variant={v[status]}>{l[status]}</Badge>;
}

function getOverall(s: StatusSection[]): Status {
  const all = s.flatMap(x => x.items);
  if (all.some(i => i.status === 'checking')) return 'checking';
  if (all.some(i => i.status === 'error' || i.status === 'missing')) return 'error';
  if (all.some(i => i.status === 'warning')) return 'warning';
  return 'ok';
}

export default function SetupPage() {
  const [sections, setSections] = useState<StatusSection[]>([
    { title: 'Backend', icon: <Globe className="h-4 w-4 sm:h-5 sm:w-5" />, items: [
      { label: 'Supabase URL', status: 'checking' },
      { label: 'Supabase Anon Key', status: 'checking' },
      { label: 'Database Connection', status: 'checking' },
      { label: 'Authentication', status: 'checking' },
      { label: 'Storage', status: 'checking' },
      { label: 'Realtime', status: 'checking' },
    ]},
    { title: 'Database', icon: <Database className="h-4 w-4 sm:h-5 sm:w-5" />, items: [
      { label: 'Required Tables', status: 'checking' },
      { label: 'Row Level Security', status: 'checking' },
      { label: 'Indexes', status: 'checking' },
      { label: 'Triggers & Functions', status: 'checking' },
    ]},
    { title: 'Deployment', icon: <Key className="h-4 w-4 sm:h-5 sm:w-5" />, items: [
      { label: 'Environment Variables', status: 'checking' },
      { label: 'Production Config', status: 'checking' },
    ]},
  ]);

  useEffect(() => {
    const runChecks = async () => {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const ok = url && key && url !== 'your-project-url' && key !== 'your-anon-key';

      let dbResult: 'ok' | 'tables_missing' | 'error' = 'error';
      let dbErr = '';
      if (ok) {
        try {
          const supabase = createClient();
          const { error } = await supabase.from('profiles').select('id').limit(1);
          if (error?.code === '42P01') dbResult = 'tables_missing';
          else if (error) { dbResult = 'error'; dbErr = error.message; }
          else dbResult = 'ok';
        } catch { dbResult = 'error'; dbErr = 'Connection failed'; }
      }

      setSections(prev => {
        const u = [...prev];
        const b = u[0];

        // URL
        b.items[0] = !url || url === 'your-project-url'
          ? { ...b.items[0], status: 'missing', detail: 'Add NEXT_PUBLIC_SUPABASE_URL to .env', action: { label: 'Docs', href: 'https://supabase.com/docs/guides/getting-started/quickstarts/nextjs' } }
          : { ...b.items[0], status: 'ok', detail: url };

        // Key
        b.items[1] = !key || key === 'your-anon-key'
          ? { ...b.items[1], status: 'missing', detail: 'Add NEXT_PUBLIC_SUPABASE_ANON_KEY to .env' }
          : { ...b.items[1], status: 'ok', detail: key.substring(0, 16) + '...' };

        if (ok) {
          if (dbResult === 'tables_missing') {
            b.items[2] = { ...b.items[2], status: 'warning', detail: 'Connected, schema not applied', action: { label: 'Run migration', href: '#migration' } };
            [3,4,5].forEach(i => b.items[i] = { ...b.items[i], status: 'ok', detail: 'Available' });
            const d = u[1];
            d.items[0] = { ...d.items[0], status: 'missing', detail: 'Run the SQL migration', action: { label: 'View SQL', href: '#migration' } };
            [1,2,3].forEach(i => d.items[i] = { ...d.items[i], status: 'missing', detail: 'Depends on tables' });
          } else if (dbResult === 'error') {
            b.items[2] = { ...b.items[2], status: 'error', detail: dbErr || 'Connection error' };
          } else {
            [2,3,4,5].forEach(i => b.items[i] = { ...b.items[i], status: 'ok', detail: 'Connected' });
            [0,1,2,3].forEach(i => u[1].items[i] = { ...u[1].items[i], status: 'ok', detail: 'Active' });
          }
        } else {
          [2,3,4,5].forEach(i => b.items[i] = { ...b.items[i], status: 'missing', detail: 'Configure Supabase first' });
          [0,1,2,3].forEach(i => u[1].items[i] = { ...u[1].items[i], status: 'missing', detail: 'Configure Supabase first' });
        }

        const dep = u[2];
        dep.items[0] = ok
          ? { ...dep.items[0], status: 'ok', detail: 'Configured' }
          : { ...dep.items[0], status: 'missing', detail: 'Copy .env.example to .env' };
        dep.items[1] = { ...dep.items[1], status: 'warning', detail: 'Configure before production' };

        return u;
      });
    };
    runChecks();
  }, []);

  const overall = getOverall(sections);

  return (
    <div className="min-h-screen">
      <Header />
      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-5 sm:py-8">
        <div className="mb-6 sm:mb-8 anim-fade-up">
          <div className="flex items-center gap-2 sm:gap-3 mb-1.5">
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--fg)]">Kura Setup</h1>
            <StatusBadge status={overall} />
          </div>
          <p className="text-sm text-[var(--fg3)]">System status and configuration.</p>
        </div>

        {overall === 'error' && (
          <Card className="mb-5 sm:mb-6 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 anim-fade-up">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-red-700 dark:text-red-400 text-sm">Kura needs setup</p>
                <p className="text-xs sm:text-sm text-red-600 dark:text-red-300 mt-1">Follow the steps below to get running.</p>
              </div>
            </div>
          </Card>
        )}

        {overall === 'ok' && (
          <Card className="mb-5 sm:mb-6 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/10 anim-fade-up">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-emerald-700 dark:text-emerald-400 text-sm">Kura is ready</p>
                <p className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-300 mt-1">All systems configured and working.</p>
              </div>
            </div>
          </Card>
        )}

        {overall !== 'ok' && (
          <Card className="mb-5 sm:mb-6 anim-fade-up">
            <h2 className="font-semibold text-sm text-[var(--fg)] mb-3">Quick Setup</h2>
            <ol className="space-y-3 text-sm text-[var(--fg2)]">
              {[
                ['Create a Supabase project at supabase.com', 'https://supabase.com'],
                ['Copy your Project URL and Anon Key from Settings > API', ''],
                ['Copy .env.example to .env and fill in your values', ''],
                ['Run the SQL from supabase/migrations/001_initial_schema.sql in the SQL Editor', ''],
                ['Restart the dev server and refresh this page', ''],
              ].map(([text, href], i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex-shrink-0 h-6 w-6 rounded-full bg-[var(--brand-100)] dark:bg-[color-mix(in_srgb,var(--brand-600)_20%,transparent)] text-[var(--brand-600)] flex items-center justify-center text-xs font-bold">{i + 1}</span>
                  <div>
                    {href ? (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="font-medium text-[var(--fg)] hover:text-[var(--brand-600)] hover:underline">{text} <span className="text-[var(--brand-600)]">(supabase.com)</span></a>
                    ) : (
                      <span className="font-medium text-[var(--fg)]">{text}</span>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        )}

        <div className="space-y-4 sm:space-y-5">
          {sections.map(s => (
            <Card key={s.title} className="anim-fade-up">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                {s.icon}
                <h2 className="font-semibold text-sm text-[var(--fg)]">{s.title}</h2>
              </div>
              <div className="divide-y divide-[var(--border)]">
                {s.items.map(item => (
                  <div key={item.label} className="flex items-start sm:items-center justify-between py-2.5 sm:py-3 gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <StatusIcon status={item.status} />
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-[var(--fg)]">{item.label}</p>
                        {item.detail && <p className="text-[11px] sm:text-xs text-[var(--fg4)] mt-0.5 truncate">{item.detail}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={item.status} />
                      {item.action && (
                        <a href={item.action.href} target="_blank" rel="noopener noreferrer" className="text-[11px] sm:text-xs text-[var(--brand-600)] hover:underline flex items-center gap-0.5">
                          {item.action.label} <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>

        <Card className="mt-5 sm:mt-6 anim-fade-up" id="migration">
          <h2 className="font-semibold text-sm text-[var(--fg)] mb-2">Database Migration</h2>
          <p className="text-xs sm:text-sm text-[var(--fg3)] mb-3">Copy the SQL and run it in Supabase SQL Editor.</p>
          <pre className="bg-[var(--bg-raised)] rounded-[var(--r-md)] p-3 sm:p-4 text-xs text-[var(--fg3)] overflow-x-auto max-h-[200px] sm:max-h-[300px] overflow-y-auto border border-[var(--border)]">
            <code>{`supabase/migrations/001_initial_schema.sql\n\nRun this file in the Supabase SQL Editor\nDashboard > SQL Editor > New query`}</code>
          </pre>
        </Card>

        <div className="mt-6 sm:mt-8 flex items-center justify-between pb-8 lg:pb-4">
          <Link href="/" className="text-sm text-[var(--brand-600)] hover:underline">Back to Kura</Link>
          <Link href="/communities"><Button size="sm">Browse Communities <ChevronRight className="h-4 w-4" /></Button></Link>
        </div>
      </div>
    </div>
  );
}
