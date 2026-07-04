'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  MessageSquare, 
  Trash2, 
  AlertCircle,
  Mail,
  User,
  Clock
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { inquiriesService } from '@/services';
import type { ContactInquiry } from '@/services/types';

export default function InquiriesPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['inquiries'],
    queryFn: () => inquiriesService.getAll().then((r) => r.data),
  });

  const inquiriesList: ContactInquiry[] = Array.isArray(data) ? data : data?.items || [];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => inquiriesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inquiries'] });
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-full pb-10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center">
            <MessageSquare className="w-6 h-6 mr-2 text-primary" />
            Contact Inquiries
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Messages sent from the public website contact forms.
          </p>
        </div>

        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : error ? (
          <Card className="flex flex-col items-center justify-center h-64 border-dashed border-2 border-destructive/50">
            <AlertCircle className="h-12 w-12 text-destructive mb-3" />
            <h3 className="text-lg font-bold text-foreground">Failed to Load Inquiries</h3>
          </Card>
        ) : inquiriesList.length === 0 ? (
          <Card className="flex flex-col items-center justify-center h-64 border-dashed border-2 bg-muted/20">
            <MessageSquare className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <h3 className="text-lg font-bold text-foreground">No Inquiries Found</h3>
            <p className="text-sm text-muted-foreground mt-2">When someone submits a contact form, it will appear here.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {inquiriesList.sort((a, b) => new Date(b.created_at || (b as any).createdAt).getTime() - new Date(a.created_at || (a as any).createdAt).getTime()).map((inquiry) => (
              <Card key={inquiry.id} className="p-5 flex flex-col md:flex-row gap-4 border border-border/60 hover:shadow-md transition-shadow">
                <div className="md:w-1/3 flex flex-col justify-between border-b md:border-b-0 md:border-r border-border/50 pb-4 md:pb-0 md:pr-4">
                  <div>
                    <div className="flex items-center text-sm font-bold text-foreground mb-2">
                      <User className="w-4 h-4 mr-2 text-primary" />
                      {inquiry.name}
                    </div>
                    <a href={`mailto:${inquiry.email}`} className="flex items-center text-sm font-semibold text-primary hover:underline mb-3">
                      <Mail className="w-4 h-4 mr-2" />
                      {inquiry.email}
                    </a>
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground font-semibold">
                    <Clock className="w-3.5 h-3.5 mr-1.5" />
                      {new Date(inquiry.created_at || (inquiry as any).createdAt).toLocaleString()}
                  </div>
                </div>
                
                <div className="md:w-2/3 flex flex-col">
                  <div className="flex-1 bg-muted/20 p-4 rounded-lg border border-border/40 mb-4">
                    <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                      {inquiry.message}
                    </p>
                  </div>
                  <div className="flex justify-end mt-auto">
                    <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive hover:text-white" onClick={() => {
                      if (confirm('Delete this inquiry?')) deleteMutation.mutate(inquiry.id);
                    }}>
                      <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                      Delete Message
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
