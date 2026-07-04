'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Mail, 
  Trash2, 
  AlertCircle,
  Users,
  CheckCircle2,
  XCircle,
  CalendarDays
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { subscribersService } from '@/services';
import type { Subscriber } from '@/services/types';

export default function SubscribersPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['subscribers'],
    queryFn: () => subscribersService.getAll().then((r) => r.data),
  });

  const subscribersList: Subscriber[] = Array.isArray(data) ? data : data?.items || [];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => subscribersService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscribers'] });
    },
  });

  // Calculate stats
  const totalSubscribers = subscribersList.length;
  const activeSubscribers = subscribersList.filter(s => s.isActive).length;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-full pb-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center">
              <Mail className="w-6 h-6 mr-2 text-primary" />
              Email Subscribers
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Manage users subscribed to the newsletter.
            </p>
          </div>
          
          <div className="flex gap-4">
            <Card className="px-4 py-2 border-primary/20 bg-primary/5 flex items-center gap-3">
              <Users className="w-5 h-5 text-primary" />
              <div>
                <p className="text-[10px] font-bold uppercase text-muted-foreground">Total / Active</p>
                <p className="text-sm font-black text-foreground leading-none">{totalSubscribers} / <span className="text-emerald-600">{activeSubscribers}</span></p>
              </div>
            </Card>
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : error ? (
          <Card className="flex flex-col items-center justify-center h-64 border-dashed border-2 border-destructive/50">
            <AlertCircle className="h-12 w-12 text-destructive mb-3" />
            <h3 className="text-lg font-bold text-foreground">Failed to Load Subscribers</h3>
          </Card>
        ) : subscribersList.length === 0 ? (
          <Card className="flex flex-col items-center justify-center h-64 border-dashed border-2 bg-muted/20">
            <Mail className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <h3 className="text-lg font-bold text-foreground">No Subscribers Yet</h3>
          </Card>
        ) : (
          <div className="bg-card rounded-xl border border-border/60 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-6 py-4">Email Address</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Subscribed Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {subscribersList.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()).map((sub) => (
                    <tr key={sub.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm font-semibold text-foreground">
                          <Mail className="w-4 h-4 mr-2 text-primary/50" />
                          {sub.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {sub.isActive ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-none shadow-none font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1 inline" /> Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-muted-foreground font-bold">
                            <XCircle className="w-3.5 h-3.5 mr-1 inline" /> Unsubscribed
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-xs font-medium text-muted-foreground">
                          <CalendarDays className="w-3.5 h-3.5 mr-1.5" />
                          {new Date(sub.created_at || '').toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive hover:text-white" onClick={() => {
                          if (confirm('Delete this subscriber?')) deleteMutation.mutate(sub.id);
                        }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
