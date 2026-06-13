import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Dialog({ isOpen, onClose, title, children, className }: DialogProps) {
  // Lock background scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/40 dark:bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Dialog Body */}
      <div
        className={cn(
          'relative w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl glass-panel animate-in fade-in-50 zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto z-10',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-border/40">
          {title && <h3 className="text-lg font-bold text-foreground">{title}</h3>}
          <Button variant="ghost" size="sm" onClick={onClose} className="p-1.5 h-auto rounded-full hover:bg-secondary">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="text-sm text-foreground">{children}</div>
      </div>
    </div>
  );
}
