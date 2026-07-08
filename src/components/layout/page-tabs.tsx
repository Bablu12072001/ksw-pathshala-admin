'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

export interface TabItem {
  title: string;
  path: string;
  icon?: LucideIcon;
}

interface PageTabsProps {
  title: string;
  description?: string;
  tabs: TabItem[];
}

export function PageTabs({ title, description, tabs }: PageTabsProps) {
  const pathname = usePathname();

  return (
    <div className="mb-6 space-y-4">
      {/* Header section (Title & Description) */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{title}</h1>
        {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
      </div>

      {/* Tabs Row */}
      <div className="flex items-center overflow-x-auto pb-2 scrollbar-none gap-2 border-b border-transparent">
        {tabs.map((tab) => {
          const isActive = pathname === tab.path || pathname?.startsWith(`${tab.path}/`);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.path}
              href={tab.path}
              className={cn(
                'flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap',
                isActive
                  ? 'bg-white border border-[#4F46E5]/20 text-[#4F46E5] shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-transparent'
              )}
            >
              {Icon && <Icon className={cn('h-4 w-4', isActive ? 'text-[#4F46E5]' : 'text-slate-400')} />}
              <span>{tab.title}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
