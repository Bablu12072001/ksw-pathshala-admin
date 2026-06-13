'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Image as ImageIcon, Video, Plus, Calendar, Film } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { useAppStore } from '@/lib/store';

export default function ActivitiesPage() {
  const queryClient = useQueryClient();
  const { user } = useAppStore();
  const isSponsor = user?.role === 'Sponsor';

  // Modal controller
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'Photo',
    mediaUrl: '',
    class: 'Class 5',
  });

  // Predefined high-quality illustrations for quick selection during testing
  const stockAssets = [
    {
      label: 'Drawing & Painting (Photo)',
      url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=600&q=80',
    },
    {
      label: 'English Vocabulary Board (Photo)',
      url: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=600&q=80',
    },
    {
      label: 'Science Project Group (Photo)',
      url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80',
    },
    {
      label: 'Classroom Arithmetic Video (Video MP4)',
      url: 'https://assets.mixkit.co/videos/preview/mixkit-children-in-class-studying-with-books-and-pencils-34324-large.mp4',
    },
  ];

  // 1. Fetch activities
  const { data: activitiesData, isLoading } = useQuery({
    queryKey: ['activities'],
    queryFn: async () => {
      const res = await fetch('/api/activities');
      if (!res.ok) throw new Error('Error fetching activities');
      return res.json();
    },
  });

  // Mutation
  const createMutation = useMutation({
    mutationFn: async (newActivity: any) => {
      const payload = {
        ...newActivity,
        teacherName: user?.name || 'Coordinator',
      };
      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to post activity');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      setIsAddOpen(false);
      resetForm();
    },
  });

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStockSelect = (url: string, type: string) => {
    setFormData((prev) => ({ ...prev, mediaUrl: url, type }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'Photo',
      mediaUrl: '',
      class: 'Class 5',
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Classroom Activities Feed</h1>
            <p className="text-xs text-muted-foreground">
              Browse media reports and photo updates uploaded directly from class locations.
            </p>
          </div>
          {!isSponsor && (
            <Button onClick={() => setIsAddOpen(true)} className="h-9 font-bold text-xs">
              <Plus className="mr-1.5 h-4 w-4" />
              Upload Classroom Update
            </Button>
          )}
        </div>

        {/* Media Grid */}
        {isLoading ? (
          <div className="flex h-60 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : !activitiesData?.activities || activitiesData.activities.length === 0 ? (
          <div className="text-center py-16 text-xs text-muted-foreground">
            No activities uploaded. Add a classroom update to view media posts.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {activitiesData.activities.map((act: any) => (
              <Card key={act.id} className="overflow-hidden flex flex-col h-full border-border/70 hover:translate-y-[-2px] transition-all duration-300">
                {/* Media frame */}
                <div className="relative h-48 w-full bg-slate-950/20 flex items-center justify-center overflow-hidden border-b border-border/40">
                  {act.type === 'Video' ? (
                    <video
                      src={act.mediaUrl}
                      controls
                      poster="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={act.mediaUrl} alt={act.title} className="h-full w-full object-cover" />
                  )}
                  <div className="absolute top-2.5 left-2.5">
                    <Badge variant={act.type === 'Video' ? 'destructive' : 'info'} className="flex items-center space-x-1 py-0.5 shadow-md">
                      {act.type === 'Video' ? <Video className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}
                      <span className="text-xxxxs uppercase tracking-wider font-extrabold">{act.type}</span>
                    </Badge>
                  </div>
                </div>

                {/* Content */}
                <CardContent className="p-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <Badge variant="outline" className="font-semibold text-xxs bg-secondary/35">
                        {act.class}
                      </Badge>
                      <div className="flex items-center text-xxs text-muted-foreground">
                        <Calendar className="mr-1 h-3 w-3" />
                        <span>{act.date}</span>
                      </div>
                    </div>
                    <h3 className="text-sm font-bold text-foreground leading-snug">{act.title}</h3>
                    <p className="text-xxs leading-relaxed text-muted-foreground/95">
                      {act.description}
                    </p>
                  </div>

                  {/* Signature */}
                  <div className="mt-4 pt-3 border-t border-border/40 text-xxxxs font-bold text-muted-foreground uppercase tracking-wide flex justify-between items-center">
                    <span>Uploaded By: {act.teacherName}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* DIALOG: UPLOAD UPDATE */}
        <Dialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Upload Classroom Post">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Activity Title *"
              name="title"
              required
              placeholder="e.g. Science Experiment Day"
              value={formData.title}
              onChange={handleFormChange}
            />
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Activity Description *</label>
              <textarea
                name="description"
                required
                rows={3}
                placeholder="Detail what children did and the progress observed..."
                value={formData.description}
                onChange={handleFormChange}
                className="flex w-full rounded-lg border border-border bg-input/50 px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Target Class"
                name="class"
                options={[
                  { label: 'Class 1', value: 'Class 1' },
                  { label: 'Class 2', value: 'Class 2' },
                  { label: 'Class 3', value: 'Class 3' },
                  { label: 'Class 4', value: 'Class 4' },
                  { label: 'Class 5', value: 'Class 5' },
                  { label: 'Class 6', value: 'Class 6' },
                ]}
                value={formData.class}
                onChange={handleFormChange}
              />
              <Select
                label="Media Asset Type *"
                name="type"
                options={[
                  { label: 'Photo Frame', value: 'Photo' },
                  { label: 'Video Stream', value: 'Video' },
                ]}
                value={formData.type}
                onChange={handleFormChange}
              />
            </div>

            <Input
              label="Media URL *"
              name="mediaUrl"
              placeholder="Provide image or mp4 video link"
              value={formData.mediaUrl}
              onChange={handleFormChange}
            />

            {/* Quick-select Assets Help panel */}
            <div className="p-3 bg-secondary/25 border border-border/40 rounded-lg space-y-2">
              <span className="text-xxs font-bold uppercase tracking-wider text-muted-foreground flex items-center">
                <Film className="mr-1.5 h-3.5 w-3.5" />
                Demonstration Stock Assets (Click to autofill URL)
              </span>
              <div className="grid grid-cols-2 gap-2 text-left">
                {stockAssets.map((asset) => {
                  const type = asset.label.includes('Video') ? 'Video' : 'Photo';
                  return (
                    <button
                      key={asset.label}
                      type="button"
                      onClick={() => handleStockSelect(asset.url, type)}
                      className="p-1.5 text-xxxs font-semibold bg-primary/5 border border-primary/15 text-primary hover:bg-primary/15 rounded text-left truncate cursor-pointer"
                    >
                      {asset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <Button type="submit" className="w-full h-10 font-bold" isLoading={createMutation.isPending}>
              Publish Milestone Post
            </Button>
          </form>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
