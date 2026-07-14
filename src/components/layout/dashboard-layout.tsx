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
  const [isMounted, setIsMounted] = useState(false);

  // Hydrate theme and auth state from localStorage
  useEffect(() => {
    setIsMounted(true);
    // 1. Sync theme preference
    const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const defaultTheme = storedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(defaultTheme);

    // 2. Sync user session (fallback in case store missed it, though now it's sync)
    const storedUser = localStorage.getItem('user_session');
    if (storedUser && !user) {
      try {
        login(JSON.parse(storedUser));
      } catch (err) {
        console.error('Failed to parse user session', err);
      }
    }
  }, [login, setTheme, user]);

  // Auth Guard
  useEffect(() => {
    if (isMounted && !user) {
      router.push('/login');
    }
  }, [user, router, isMounted]);

  // Prevent render if unauthenticated or not mounted yet
  if (!isMounted || !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
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
