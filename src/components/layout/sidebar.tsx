'use client';

import React, { useState } from 'react';
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
  Settings,
  Briefcase,
  Monitor,
  ChevronDown,
  ChevronRight,
  Circle
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
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    'Volunteers': true,
    'Students & Academics': true
  });

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

  const toggleMenu = (title: string) => {
    setExpandedMenus(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const menuGroups = [
    {
      name: 'Main Menu',
      items: [
        { 
          title: 'Dashboard', 
          icon: LayoutDashboard, 
          path: '/dashboard', 
          roles: ['Admin', 'Coordinator', 'Sponsor'] 
        },
        { 
          title: 'Students & Academics', 
          icon: Users, 
          roles: ['Admin', 'Coordinator', 'Sponsor'],
          subItems: [
            { title: 'Student Directory', path: '/students' },
            { title: 'Attendance', path: '/attendance' },
            { title: 'Classes & Branches', path: '/branches' },
          ]
        },
        { 
          title: 'Teachers', 
          icon: GraduationCap, 
          roles: ['Admin', 'Coordinator'],
          subItems: [
            { title: 'Teachers Directory', path: '/teachers' },
            { title: 'GPS Tracking', path: '/gps' },
          ]
        },
        { 
          title: 'Volunteers', 
          icon: HeartHandshake, 
          roles: ['Admin', 'Coordinator'],
          subItems: [
            { title: 'Volunteer Directory', path: '/volunteers' },
            { title: 'Custom Tasks', path: '/volunteer-tasks' },
            { title: 'Donation Claims', path: '/volunteer-claims' },
          ]
        },
        { 
          title: 'Operations & Finance', 
          icon: CircleDollarSign, 
          roles: ['Admin', 'Coordinator', 'Sponsor'],
          subItems: [
            { title: 'Donations & Sponsors', path: '/donations' },
            { title: 'Events', path: '/events' },
            { title: 'Class Pricing Plans', path: '/class-plans' },
            { title: 'Contact Inquiries', path: '/inquiries' },
            { title: 'Email Subscribers', path: '/subscribers' },
          ]
        },
        { 
          title: 'Website CMS', 
          icon: Monitor, 
          roles: ['Admin', 'Coordinator', 'Sponsor'],
          subItems: [
            { title: 'Homepage Sliders', path: '/sliders' },
            { title: 'Intro Videos', path: '/intro-videos' },
            { title: 'Board Members', path: '/members' },
            { title: 'Activities Feed', path: '/activities' },
            { title: 'Campaigns', path: '/campaigns' },
            { title: 'Founder Corner', path: '/founder' },
            { title: 'Trust Credentials', path: '/credentials' },
            { title: 'Reviews & Testimonials', path: '/reviews' },
            { title: 'Corporate Partners', path: '/partners' },
            { title: 'FAQs', path: '/faqs' },
            { title: 'Media Gallery', path: '/media' },
          ]
        },
        { 
          title: 'System Settings', 
          icon: Settings, 
          roles: ['Admin', 'Coordinator', 'Sponsor'],
          subItems: [
            { title: 'AI Insights', path: '/ai' },
            { title: 'Audit & Backup', path: '/audit' },
          ]
        }
      ]
    }
  ];

  const userRole = (user?.role || 'admin').toLowerCase();
  const filteredGroups = menuGroups
    .map(group => ({
      ...group,
      items: group.items.filter(item => item.roles.some(r => r.toLowerCase() === userRole))
    }))
    .filter(group => group.items.length > 0);

  // Helper to check if a menu item has active sub items
  const isMenuPathActive = (item: any) => {
    if (item.path === pathname) return true;
    if (item.subItems) {
      return item.subItems.some((sub: any) => pathname === sub.path || pathname?.startsWith(sub.path + '/'));
    }
    return false;
  };

  return (
    <>
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

      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Dark Sidebar Background */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col w-64 bg-[#1e293b] text-slate-200 shadow-xl border-r border-[#334155] transition-transform duration-300 ease-in-out lg:translate-x-0 h-screen overflow-hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header/Logo */}
        <div className="flex items-center h-20 px-6 relative z-10 shrink-0 border-b border-[#334155]">
          <Link href="/dashboard" className="flex items-center space-x-3 group w-full">
            <div className="h-10 w-10 bg-[#3b82f6] rounded-xl flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-105 overflow-hidden text-white font-black text-xl">
               <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight leading-none text-white">
                KSW Admin
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav 
          ref={scrollRef} 
          onScroll={handleScroll}
          className="flex-1 px-4 py-6 space-y-6 overflow-y-auto scrollbar-none relative z-10"
        >
          {filteredGroups.map((group) => (
            <div key={group.name} className="">
              {group.name && (
                <div className="px-2 mb-3 text-[10px] font-black tracking-widest text-slate-400 uppercase hidden">
                  {group.name}
                </div>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const hasSubItems = item.subItems && item.subItems.length > 0;
                  const isActive = isMenuPathActive(item);
                  const isExpanded = expandedMenus[item.title] || isActive;

                  return (
                    <div key={item.title} className="flex flex-col">
                      {hasSubItems ? (
                        <button
                          onClick={() => toggleMenu(item.title)}
                          className={cn(
                            'flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 group cursor-pointer w-full text-left',
                            isActive && !isExpanded
                              ? 'text-white' 
                              : 'text-slate-300 hover:bg-[#334155] hover:text-slate-100'
                          )}
                        >
                          <div className="flex items-center">
                            <Icon
                              className={cn(
                                'mr-3 h-5 w-5 flex-shrink-0 transition-transform duration-300',
                                isActive && !isExpanded ? 'text-white' : 'text-slate-400 group-hover:text-slate-100'
                              )}
                            />
                            <span>{item.title}</span>
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-slate-400" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-slate-400" />
                          )}
                        </button>
                      ) : (
                        <Link
                          href={item.path || '#'}
                          onClick={() => setIsOpen(false)}
                          className={cn(
                            'flex items-center px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 group cursor-pointer relative',
                            isActive
                              ? 'bg-[#3b82f6] text-white shadow-md'
                              : 'text-slate-300 hover:bg-[#334155] hover:text-slate-100'
                          )}
                        >
                          <Icon
                            className={cn(
                              'mr-3 h-5 w-5 flex-shrink-0 transition-transform duration-300',
                              isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-100'
                            )}
                          />
                          <span className="relative z-10">{item.title}</span>
                        </Link>
                      )}

                      {/* Sub Items */}
                      {hasSubItems && isExpanded && (
                        <div className="mt-1 mb-2 ml-4 pl-4 border-l border-[#334155] space-y-1">
                          {item.subItems!.map((sub) => {
                            const isSubActive = pathname === sub.path || pathname?.startsWith(sub.path + '/');
                            return (
                              <Link
                                key={sub.path}
                                href={sub.path}
                                onClick={() => setIsOpen(false)}
                                className={cn(
                                  'flex items-center px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 group',
                                  isSubActive
                                    ? 'bg-[#3b82f6]/10 text-[#3b82f6]'
                                    : 'text-slate-400 hover:bg-[#334155] hover:text-slate-200'
                                )}
                              >
                                <Circle className={cn(
                                  "h-1.5 w-1.5 mr-2 flex-shrink-0",
                                  isSubActive ? "fill-[#3b82f6] text-[#3b82f6]" : "text-transparent border-slate-500 border group-hover:border-slate-400"
                                )} />
                                {sub.title}
                              </Link>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer Profile & Logout */}
        <div className="p-4 border-t border-[#334155] relative z-10">
          <div className="flex items-center justify-between">
             <div className="flex flex-col">
               <span className="text-sm font-bold text-slate-200">
                 {user?.name || 'KSW Admin'}
               </span>
               <span className="text-xs text-slate-400 capitalize">
                 {user?.role || 'Administrator'}
               </span>
             </div>
             <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-slate-400 hover:text-rose-400 hover:bg-[#334155] rounded-full h-9 w-9"
             >
                <LogOut className="h-4 w-4" />
             </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
