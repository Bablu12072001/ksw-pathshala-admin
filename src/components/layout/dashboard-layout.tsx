'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from './sidebar';
import { Navbar } from './navbar';
import { useAppStore } from '@/lib/store';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, login, theme, setTheme } = useAppStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate theme and auth state from localStorage
  useEffect(() => {
    // 1. Sync theme preference
    const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const defaultTheme = storedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(defaultTheme);

    // 2. Sync user session
    const storedUser = localStorage.getItem('user_session');
    if (storedUser) {
      try {
        login(JSON.parse(storedUser));
      } catch (err) {
        console.error('Failed to parse user session', err);
      }
    }
    
    setHydrated(true);
  }, [login, setTheme]);

  // Auth Guard
  useEffect(() => {
    if (hydrated && !user) {
      router.push('/login');
    }
  }, [hydrated, user, router]);

  // Prevent flash of content during loading
  if (!hydrated || !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-semibold text-muted-foreground animate-pulse">
            Verifying NGO Credentials...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen bg-background">
      {/* Background Orbs */}
      <div className="glow-orb glow-orb-primary -top-20 -left-20" />
      <div className="glow-orb glow-orb-secondary -bottom-20 -right-20" />

      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main Container */}
      <div className="flex-1 flex flex-col lg:pl-64 min-h-screen max-w-full">
        {/* Header Navigation */}
        <Navbar />

        {/* Dynamic Page Scroll Content */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
