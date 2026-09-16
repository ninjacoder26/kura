'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageLightboxProps {
  src: string;
  alt?: string;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export default function ImageLightbox({ src, alt, onClose, onNext, onPrev, hasNext, hasPrev }: ImageLightboxProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === '+' || e.key === '=') setScale(s => Math.min(s + 0.25, 5));
    if (e.key === '-') setScale(s => Math.max(s - 0.25, 0.25));
    if (e.key === 'ArrowRight' && onNext && hasNext) onNext();
    if (e.key === 'ArrowLeft' && onPrev && hasPrev) onPrev();
  }, [onClose, onNext, onPrev, hasNext, hasPrev]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    setScale(s => Math.max(0.25, Math.min(5, s + delta)));
  }

  function handleMouseDown(e: React.MouseEvent) {
    if (scale <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!isDragging) return;
    setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  }

  function handleMouseUp() {
    setIsDragging(false);
  }

  function resetZoom() {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center anim-fade-in" onClick={onClose}>
      {/* Controls */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-3 z-10 bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); setScale(s => Math.min(s + 0.25, 5)); }}
            className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
            <ZoomIn className="h-5 w-5" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); setScale(s => Math.max(s - 0.25, 0.25)); }}
            className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
            <ZoomOut className="h-5 w-5" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); resetZoom(); }}
            className="h-9 px-3 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-xs font-bold transition-colors">
            {Math.round(scale * 100)}%
          </button>
        </div>
        <div className="flex items-center gap-2">
          <a href={src} download onClick={(e) => e.stopPropagation()}
            className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
            <Download className="h-5 w-5" />
          </a>
          <button onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Navigation arrows */}
      {hasPrev && onPrev && (
        <button onClick={(e) => { e.stopPropagation(); onPrev(); }}
          className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white z-10 transition-colors">
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}
      {hasNext && onNext && (
        <button onClick={(e) => { e.stopPropagation(); onNext(); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white z-10 transition-colors">
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* Image */}
      <div
        className={cn('max-w-[90vw] max-h-[85vh] cursor-grab active:cursor-grabbing', isDragging && 'cursor-grabbing')}
        onClick={(e) => e.stopPropagation()}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img
          src={src}
          alt={alt || ''}
          className="max-w-full max-h-[85vh] object-contain select-none transition-transform duration-100"
          style={{ transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)` }}
          draggable={false}
        />
      </div>

      {/* Alt text */}
      {alt && (
        <div className="absolute bottom-0 left-0 right-0 p-3 text-center bg-gradient-to-t from-black/60 to-transparent">
          <p className="text-sm text-white/80">{alt}</p>
        </div>
      )}
    </div>
  );
}
