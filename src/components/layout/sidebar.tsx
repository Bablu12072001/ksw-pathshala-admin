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
  HeartHandshake,
  BrainCircuit,
  FileText,
  ShieldCheck,
  LogOut,
  Menu,
  ClipboardList,
  MonitorPlay,
  Video,
  CalendarDays,
  Megaphone,
  Quote,
  Shield,
  Star,
  Building2,
  HelpCircle,
  MessageSquare,
  Mail,
  IndianRupee,
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
  const scrollRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      const savedScroll = sessionStorage.getItem('sidebarScrollPos');
      if (savedScroll) {
        scrollRef.current.scrollTop = parseInt(savedScroll, 10);
      }
    }
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    sessionStorage.setItem('sidebarScrollPos', e.currentTarget.scrollTop.toString());
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  // Nav groups with role requirements
  const menuGroups = [
    {
      name: 'Core Operations',
      items: [
        { title: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['Admin', 'Coordinator', 'Sponsor'] },
        { title: 'Students', icon: Users, path: '/students', roles: ['Admin', 'Coordinator', 'Sponsor'] },
        { title: 'Teachers', icon: GraduationCap, path: '/teachers', roles: ['Admin', 'Coordinator'] },
        { title: 'Volunteers', icon: HeartHandshake, path: '/volunteers', roles: ['Admin', 'Coordinator'] },
        { title: 'Volunteer Tasks', icon: ClipboardList, path: '/volunteer-tasks', roles: ['Admin', 'Coordinator'] },
        { title: 'Volunteer Claims', icon: FileText, path: '/volunteer-claims', roles: ['Admin', 'Coordinator'] },
        { title: 'Attendance', icon: CalendarCheck, path: '/attendance', roles: ['Admin', 'Coordinator'] },
        { title: 'Events', icon: CalendarDays, path: '/events', roles: ['Admin', 'Coordinator'] },
        { title: 'Donations & Sponsors', icon: CircleDollarSign, path: '/donations', roles: ['Admin', 'Coordinator', 'Sponsor'] },
        { title: 'Contact Inquiries', icon: MessageSquare, path: '/inquiries', roles: ['Admin', 'Coordinator'] },
        { title: 'Email Subscribers', icon: Mail, path: '/subscribers', roles: ['Admin', 'Coordinator'] },
        { title: 'Class Pricing Plans', icon: IndianRupee, path: '/class-plans', roles: ['Admin'] },
        { title: 'GPS Tracking', icon: MapPin, path: '/gps', roles: ['Admin', 'Coordinator'] },
      ]
    },
    {
      name: 'Website CMS',
      items: [
        { title: 'Homepage Sliders', icon: MonitorPlay, path: '/sliders', roles: ['Admin', 'Coordinator'] },
        { title: 'Intro Videos', icon: Video, path: '/intro-videos', roles: ['Admin', 'Coordinator'] },
        { title: 'Board Members', icon: Users, path: '/members', roles: ['Admin', 'Coordinator'] },
        { title: 'Activities Feed', icon: ImageIcon, path: '/activities', roles: ['Admin', 'Coordinator', 'Sponsor'] },
        { title: 'Campaigns', icon: Megaphone, path: '/campaigns', roles: ['Admin', 'Coordinator'] },
        { title: 'Founder Corner', icon: Quote, path: '/founder', roles: ['Admin'] },
        { title: 'Trust Credentials', icon: Shield, path: '/credentials', roles: ['Admin'] },
        { title: 'Reviews & Testimonials', icon: Star, path: '/reviews', roles: ['Admin', 'Coordinator'] },
        { title: 'Corporate Partners', icon: Building2, path: '/partners', roles: ['Admin', 'Coordinator'] },
        { title: 'FAQs', icon: HelpCircle, path: '/faqs', roles: ['Admin', 'Coordinator'] },
        { title: 'Media Gallery', icon: ImageIcon, path: '/media', roles: ['Admin', 'Coordinator'] },
      ]
    },
    {
      name: 'System',
      items: [
        { title: 'AI Insights', icon: BrainCircuit, path: '/ai', roles: ['Admin', 'Coordinator', 'Sponsor'] },
        { title: 'Audit & Backup', icon: ShieldCheck, path: '/audit', roles: ['Admin'] },
      ]
    }
  ];

  // Filter items based on active role (case-insensitive)
  const userRole = (user?.role || 'admin').toLowerCase();
  const filteredGroups = menuGroups
    .map(group => ({
      ...group,
      items: group.items.filter(item => item.roles.some(r => r.toLowerCase() === userRole))
    }))
    .filter(group => group.items.length > 0);

  return (
    <>
      {/* Mobile Sidebar Hamburger Toggle */}
      <div className="lg:hidden fixed top-3 left-4 z-50">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 h-auto rounded-xl shadow-lg bg-background/80 backdrop-blur-md border border-border"
        >
          <Menu className="h-5 w-5 text-foreground" />
        </Button>
      </div>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col w-64 bg-card text-card-foreground shadow-[4px_0_24px_-10px_rgba(0,0,0,0.15)] border-r border-border/50 transition-transform duration-300 ease-in-out lg:translate-x-0 h-screen overflow-hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Subtle background glow effect for beauty */}
        <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none opacity-50 dark:opacity-20" />

        {/* Header/Logo */}
        <div className="flex items-center justify-center h-20 px-6 relative z-10 shrink-0">
          <Link href="/dashboard" className="flex items-center space-x-3 group">
            <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 transform transition-transform group-hover:scale-105 overflow-hidden p-1">
              <img src="/logo.jpg" alt="KSW Pathshala Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight leading-none text-foreground">
                Pathshala
              </span>
              <span className="text-primary font-bold text-xs tracking-widest uppercase mt-0.5">
                Admin
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav 
          ref={scrollRef} 
          onScroll={handleScroll}
          className="flex-1 px-3 py-2 space-y-4 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent relative z-10"
        >
          {filteredGroups.map((group, groupIdx) => (
            <div key={group.name} className={groupIdx > 0 ? "pt-2" : ""}>
              <div className="px-4 mb-2 text-xxs font-black tracking-widest text-muted-foreground/60 uppercase">
                {group.name}
              </div>
              <div className="space-y-1.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.path || pathname?.startsWith(item.path + '/');
                  return (
                    <Link
                      key={item.title}
                      href={item.path}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        'flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 group cursor-pointer relative overflow-hidden',
                        isActive
                          ? 'bg-gradient-to-r from-primary to-primary/90 text-white shadow-md shadow-primary/25'
                          : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                      )}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-white/30 rounded-r-full" />
                      )}
                      <Icon
                        className={cn(
                          'mr-3 h-[18px] w-[18px] flex-shrink-0 transition-transform duration-300 group-hover:scale-110',
                          isActive ? 'text-white' : 'text-muted-foreground group-hover:text-primary'
                        )}
                      />
                      <span className="relative z-10">{item.title}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer Profile & Logout */}
        <div className="p-4 relative z-10">
          <div className="bg-secondary/40 rounded-2xl p-3 border border-border/50 backdrop-blur-md">
            <div className="flex items-center space-x-3 mb-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md border border-white/10">
                {user?.name ? user.name[0].toUpperCase() : 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-extrabold text-foreground truncate leading-tight">
                  {user?.name || 'KSW Admin'}
                </p>
                <p className="text-xs font-semibold text-primary/80 mt-0.5 truncate capitalize">
                  {user?.role || 'Administrator'}
                </p>
              </div>
            </div>
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="w-full flex items-center justify-center font-bold shadow-md shadow-destructive/20 hover:shadow-destructive/40 transition-all rounded-xl h-10"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
