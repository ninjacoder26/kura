'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';

function randomCode(): string {
  // No confusing characters (0/O, 1/I/L)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from(
    { length: 5 },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join('');
}

interface CaptchaProps {
  onChange: (valid: boolean) => void;
}

/**
 * Fully local CAPTCHA — zero network, zero third-party API.
 * Distorted canvas text + noise; parent gates submit on `valid`.
 */
export default function Captcha({ onChange }: CaptchaProps) {
  const [code, setCode] = useState(randomCode);
  const [input, setInput] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;
    const dark = resolvedTheme === 'dark';

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = dark ? '#171B1F' : '#F6F7F8';
    ctx.fillRect(0, 0, W, H);

    // Noise dots
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = dark
        ? `rgba(255,255,255,${0.04 + Math.random() * 0.08})`
        : `rgba(0,0,0,${0.04 + Math.random() * 0.08})`;
      ctx.beginPath();
      ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 1.6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Noise lines
    const lineColors = dark
      ? ['#0F86D6', '#FF4500', '#4A5058']
      : ['#0079D3', '#D93900', '#D7DADC'];
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = lineColors[i % lineColors.length];
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(Math.random() * W * 0.3, Math.random() * H);
      ctx.bezierCurveTo(
        W * 0.3, Math.random() * H,
        W * 0.6, Math.random() * H,
        W * (0.7 + Math.random() * 0.3), Math.random() * H
      );
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Characters with rotation + jitter
    const glyphColors = dark
      ? ['#D7DADC', '#4EA3E3', '#FF6A2B', '#B8BCBF', '#7FBCEC']
      : ['#1A1A1B', '#0079D3', '#D93900', '#343536', '#0063AD'];
    const fontSize = 30;
    ctx.font = `700 ${fontSize}px 'Noto Sans', sans-serif`;
    ctx.textBaseline = 'middle';
    const step = W / (code.length + 1);
    for (let i = 0; i < code.length; i++) {
      ctx.save();
      const x = step * (i + 1) + (Math.random() * 6 - 3);
      const y = H / 2 + (Math.random() * 8 - 4);
      ctx.translate(x, y);
      ctx.rotate((Math.random() - 0.5) * 0.7);
      ctx.fillStyle = glyphColors[i % glyphColors.length];
      ctx.fillText(code[i], -fontSize * 0.32, 1);
      ctx.restore();
    }
  }, [code, resolvedTheme]);

  useEffect(() => {
    draw();
  }, [draw]);

  function refresh() {
    setCode(randomCode());
    setInput('');
    onChangeRef.current(false);
  }

  function handleInput(v: string) {
    setInput(v);
    onChangeRef.current(v.trim().toUpperCase() === code && v.trim().length > 0);
  }

  const valid = input.trim().toUpperCase() === code && input.trim().length > 0;

  return (
    <div>
      <label className="block text-xs font-bold text-[var(--fg2)] mb-1.5 uppercase tracking-wide">
        Human check
      </label>
      <div className="flex items-center gap-2">
        <div className="relative shrink-0 rounded-lg overflow-hidden border border-[var(--border)]">
          <canvas ref={canvasRef} width={150} height={48} className="block h-12 w-[150px]" aria-label="CAPTCHA challenge" />
          <button
            type="button"
            onClick={refresh}
            title="New code"
            aria-label="Get a new code"
            className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center text-white transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
        <input
          type="text"
          value={input}
          onChange={e => handleInput(e.target.value)}
          placeholder="Type the code"
          autoComplete="off"
          autoCapitalize="characters"
          maxLength={8}
          className="flex-1 min-w-0 h-12 px-3 text-sm font-bold tracking-[0.2em] uppercase rounded-lg border bg-[var(--surface-hover)] border-[var(--border)] text-[var(--fg)] placeholder:text-[var(--fg4)] placeholder:font-normal placeholder:tracking-normal placeholder:normal-case focus:outline-none focus:border-[var(--brand-500)] transition-all hover:border-[var(--border-strong)]"
        />
      </div>
      {input.length > 0 && !valid && (
        <p className="text-xs text-red-500 mt-1">Code doesn&apos;t match — try again or refresh it.</p>
      )}
    </div>
  );
}
