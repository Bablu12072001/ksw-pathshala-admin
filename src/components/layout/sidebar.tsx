'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  CalendarCheck,
  CircleDollarSign,
  MapPin,
  Image as ImageIcon,
  BrainCircuit,
  FileText,
  ShieldCheck,
  LogOut,
  Menu,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAppStore();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  // Nav items with role requirements
  const menuItems = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard',
      roles: ['Admin', 'Coordinator', 'Sponsor'],
    },
    {
      title: 'Students',
      icon: Users,
      path: '/students',
      roles: ['Admin', 'Coordinator', 'Sponsor'],
    },
    {
      title: 'Teachers',
      icon: GraduationCap,
      path: '/teachers',
      roles: ['Admin', 'Coordinator'],
    },
    {
      title: 'Attendance',
      icon: CalendarCheck,
      path: '/attendance',
      roles: ['Admin', 'Coordinator'],
    },
    {
      title: 'Donations & Sponsors',
      icon: CircleDollarSign,
      path: '/donations',
      roles: ['Admin', 'Coordinator', 'Sponsor'],
    },
    {
      title: 'GPS Tracking',
      icon: MapPin,
      path: '/gps',
      roles: ['Admin', 'Coordinator'],
    },
    {
      title: 'Activities Feed',
      icon: ImageIcon,
      path: '/activities',
      roles: ['Admin', 'Coordinator', 'Sponsor'],
    },
    {
      title: 'AI Insights',
      icon: BrainCircuit,
      path: '/ai',
      roles: ['Admin', 'Coordinator', 'Sponsor'],
    },
    {
      title: 'Reports Hub',
      icon: FileText,
      path: '/reports',
      roles: ['Admin', 'Coordinator', 'Sponsor'],
    },
    {
      title: 'Audit & Backup',
      icon: ShieldCheck,
      path: '/audit',
      roles: ['Admin'],
    },
  ];

  // Filter items based on active role
  const userRole = user?.role || 'Admin';
  const filteredItems = menuItems.filter((item) => item.roles.includes(userRole));

  return (
    <>
      {/* Mobile Sidebar Hamburger Toggle */}
      <div className="lg:hidden fixed top-3 left-4 z-50">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 h-auto rounded-lg shadow-md glass-panel"
        >
          <Menu className="h-5 w-5 text-foreground" />
        </Button>
      </div>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-slate-950/20 backdrop-blur-xxs"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col w-64 border-r border-border/60 transition-transform duration-300 ease-in-out lg:translate-x-0 glass-panel h-screen',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header/Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-border/40">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <span className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-md shadow-primary/30">
              KSW
            </span>
            <span className="font-bold text-base tracking-tight text-foreground">
              Pathshala <span className="text-primary font-medium text-xs">Admin</span>
            </span>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path || pathname?.startsWith(item.path + '/');
            return (
              <Link
                key={item.title}
                href={item.path}
                onClick={() => setIsOpen(false)}
                className={cn(
                  'flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group cursor-pointer',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/10'
                    : 'text-muted-foreground hover:bg-secondary/40 hover:text-foreground'
                )}
              >
                <Icon className={cn('mr-3 h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-105', isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground')} />
                {item.title}
              </Link>
            );
          })}
        </nav>

        {/* Footer Profile & Logout */}
        <div className="p-4 border-t border-border/40 bg-secondary/10">
          <div className="flex items-center space-x-3 mb-3 px-2">
            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm shadow-md">
              {user?.name ? user.name[0] : 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-foreground truncate leading-none mb-1">
                {user?.name || 'KSW Admin'}
              </p>
              <span className="inline-block px-1.5 py-0.5 rounded-full text-xxs font-semibold bg-primary/15 text-primary">
                {user?.role || 'Admin'}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full flex items-center justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-xs px-2.5 py-2"
          >
            <LogOut className="mr-3.5 h-4 w-4" />
            Logout Session
          </Button>
        </div>
      </aside>
    </>
  );
}
