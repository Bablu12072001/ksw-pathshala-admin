import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'info' | 'outline';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        {
          'bg-primary text-primary-foreground': variant === 'default',
          'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25':
            variant === 'success',
          'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25':
            variant === 'warning',
          'bg-destructive/15 text-destructive border border-destructive/25': variant === 'destructive',
          'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25': variant === 'info',
          'border border-border text-foreground': variant === 'outline',
        },
        className
      )}
      {...props}
    />
  );
}
