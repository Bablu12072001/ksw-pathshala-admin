'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Bell, Sun, Moon, CheckCheck } from 'lucide-react';
import { useAppStore, SystemNotification } from '@/lib/store';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { dashboardService } from '@/services';

export function Navbar() {
  const pathname = usePathname();
  const { theme, toggleTheme, notifications, hasFetchedNotifications, markAsRead, markAllAsRead, setNotifications } = useAppStore();
  const [showNotifications, setShowNotifications] = useState(false);

  // Sync initial notifications from API
  useEffect(() => {
    async function fetchNotifications() {
      if (hasFetchedNotifications) return;
      try {
        const res = await dashboardService.getNotifications();
        if (res.data) {
          const parsed = Array.isArray(res.data) ? res.data : (res.data?.items || res.data?.notifications || []);
          setNotifications(Array.isArray(parsed) ? parsed : []);
        }
      } catch (err) {
        console.error('Failed to fetch notifications', err);
      }
    }
    fetchNotifications();
  }, [hasFetchedNotifications, setNotifications]);

  // Generate breadcrumb titles
  const getBreadcrumbs = () => {
    if (!pathname || pathname === '/' || pathname === '/dashboard') {
      return [{ title: 'Dashboard', active: true }];
    }

    const segments = pathname.split('/').filter(Boolean);
    return segments.map((seg, idx) => {
      const title = seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' ');
      const isLast = idx === segments.length - 1;
      return {
        title,
        active: isLast,
      };
    });
  };

  const breadcrumbs = getBreadcrumbs();
  const unreadCount = notifications.filter((n) => n.status === 'Unread').length;

  const handleMarkAsRead = async (id: string) => {
    markAsRead(id);
    try {
      await dashboardService.markNotificationRead(id);
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    markAllAsRead();
    try {
      await dashboardService.markAllNotificationsRead();
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border/60 glass-panel px-6 lg:px-8">
      {/* Breadcrumbs (adjusted left margin on mobile to make space for hamburger) */}
      <div className="flex items-center space-x-1.5 text-sm pl-8 lg:pl-0">
        {breadcrumbs.map((crumb, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && <span className="text-muted-foreground">/</span>}
            <span
              className={cn(
                'font-medium transition-colors',
                crumb.active ? 'text-foreground font-bold' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {crumb.title}
            </span>
          </React.Fragment>
        ))}
      </div>

      {/* Right side options */}
      <div className="flex items-center space-x-4">
        {/* Theme Toggler */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="h-9 w-9 p-0 rounded-full hover:bg-secondary/65 text-muted-foreground hover:text-foreground"
        >
          {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </Button>

        {/* Notifications Tray */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowNotifications(!showNotifications)}
            className={cn(
              'h-9 w-9 p-0 rounded-full hover:bg-secondary/65 text-muted-foreground hover:text-foreground relative',
              showNotifications ? 'bg-secondary' : ''
            )}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-white text-xxs font-bold animate-pulse">
                {unreadCount}
              </span>
            )}
          </Button>

          {/* Notifications Dropdown Card */}
          {showNotifications && (
            <>
              {/* Overlay Backdrop to click-out */}
              <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)} />

              <div className="absolute right-0 mt-2 w-80 rounded-xl border border-border bg-card p-4 shadow-xl glass-panel z-20 animate-in fade-in-50 slide-in-from-top-1 duration-150">
                <div className="flex items-center justify-between border-b border-border/40 pb-2 mb-2">
                  <h4 className="text-xs font-bold text-foreground">Notifications</h4>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-xxs font-medium text-primary hover:underline flex items-center cursor-pointer"
                    >
                      <CheckCheck className="mr-1 h-3.5 w-3.5" />
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2.5">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">No notifications yet.</p>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => handleMarkAsRead(notif.id)}
                        className={cn(
                          'p-2.5 rounded-lg border text-xs cursor-pointer transition-all duration-200 hover:translate-x-0.5',
                          notif.status === 'Unread'
                            ? 'bg-primary/5 border-primary/20 hover:bg-primary/10'
                            : 'bg-transparent border-border/30 hover:bg-secondary/35 text-muted-foreground'
                        )}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span
                            className={cn('text-xxs font-semibold uppercase tracking-wider', {
                              'text-primary': notif.type === 'System',
                              'text-destructive': notif.type === 'GPS Alert',
                              'text-emerald-500': notif.type === 'Donation',
                            })}
                          >
                            {notif.type}
                          </span>
                          <span className="text-xxs text-muted-foreground/75">
                            {new Date(notif.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-xxs font-medium leading-relaxed">{notif.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
