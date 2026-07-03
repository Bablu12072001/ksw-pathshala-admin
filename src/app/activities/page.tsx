'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Calendar, Edit2, Trash2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { useAppStore } from '@/lib/store';
import { activitiesService } from '@/services';

export default function ActivitiesPage() {
  const queryClient = useQueryClient();
  const { user } = useAppStore();
  const isSponsor = user?.role === 'Sponsor';

  // Modal controller
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editActivityId, setEditActivityId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    class: 'Class 5',
    author: user?.name || '',
    isSuccessStory: false,
  });

  // 1. Fetch activities via Axios admin API
  const { data: activitiesData, isLoading } = useQuery({
    queryKey: ['activities'],
    queryFn: () => activitiesService.getAll().then((r) => r.data),
  });

  // Mutation via Axios admin API
  const createMutation = useMutation({
    mutationFn: (newActivity: any) => {
      return activitiesService.create(newActivity).then((r) => r.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      setIsAddOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => {
      return activitiesService.update(id, payload).then((r) => r.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      setIsEditOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => activitiesService.delete(id).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditOpen && editActivityId) {
      updateMutation.mutate({ id: editActivityId, payload: { title: formData.title, description: formData.description, class: formData.class, author: formData.author, isSuccessStory: formData.isSuccessStory } });
    } else {
      createMutation.mutate(formData);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      class: 'Class 5',
      author: user?.name || '',
      isSuccessStory: false,
    });
    setEditActivityId(null);
  };

  const openEdit = (act: any) => {
    setFormData({
      title: act.title || '',
      description: act.description || '',
      class: act.class || 'Class 5',
      author: act.author || act.teacherName || '',
      isSuccessStory: act.isSuccessStory || false,
    });
    setEditActivityId(act.id);
    setIsEditOpen(true);
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
        ) : (() => {
          const activitiesList = Array.isArray(activitiesData) ? activitiesData : (activitiesData?.activities || []);
          if (!activitiesList || activitiesList.length === 0) {
            return (
              <div className="text-center py-16 text-xs text-muted-foreground">
                No activities uploaded. Add a classroom update to view media posts.
              </div>
            );
          }
          return (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {activitiesList.map((act: any) => (
                <Card key={act.id} className="overflow-hidden flex flex-col h-full border-border/70 hover:translate-y-[-2px] transition-all duration-300 relative">
                  {!isSponsor && (
                    <div className="absolute top-3 right-3 flex space-x-2 z-10">
                      <button onClick={() => openEdit(act)} className="h-7 w-7 rounded-full bg-secondary/80 hover:bg-secondary border border-border/40 flex items-center justify-center text-foreground transition-colors shadow-sm cursor-pointer">
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => { if(confirm('Delete activity?')) deleteMutation.mutate(act.id); }} className="h-7 w-7 rounded-full bg-destructive/10 hover:bg-destructive/20 border border-destructive/20 flex items-center justify-center text-destructive transition-colors shadow-sm cursor-pointer">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                {/* Content */}
                <CardContent className="p-5 flex-1 flex flex-col justify-between pt-8">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <Badge variant="outline" className="font-semibold text-xxs bg-secondary/35">
                        {act.class}
                      </Badge>
                      <div className="flex items-center text-xxs text-muted-foreground">
                        <Calendar className="mr-1 h-3 w-3" />
                        <span>{new Date(act.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {act.mediaUrl && (
                      <div className="mt-2 w-full h-32 rounded-md overflow-hidden bg-secondary">
                        <img src={act.mediaUrl} alt={act.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <h3 className="text-sm font-bold text-foreground leading-snug">{act.title}</h3>
                    <p className="text-xxs leading-relaxed text-muted-foreground/95">
                      {act.description}
                    </p>
                  </div>

                  {/* Signature */}
                  <div className="mt-4 pt-3 border-t border-border/40 text-xxxxs font-bold text-muted-foreground uppercase tracking-wide flex justify-between items-center">
                    <span>Uploaded By: {act.author || act.teacherName || 'Admin'}</span>
                    {act.isSuccessStory && (
                      <span className="text-emerald-500">Success Story</span>
                    )}
                  </div>
                </CardContent>
              </Card>
              ))}
            </div>
          );
        })()}

        {/* DIALOG: UPLOAD / EDIT UPDATE */}
        <Dialog isOpen={isAddOpen || isEditOpen} onClose={() => { setIsAddOpen(false); setIsEditOpen(false); resetForm(); }} title={isEditOpen ? "Edit Classroom Post" : "Upload Classroom Post"}>
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
              <Input
                label="Author Name *"
                name="author"
                required
                placeholder="e.g. Rajesh Kumar"
                value={formData.author}
                onChange={handleFormChange}
              />
            </div>
            
            <div className="flex items-center space-x-2 pb-2">
              <input
                type="checkbox"
                name="isSuccessStory"
                id="isSuccessStory"
                checked={formData.isSuccessStory}
                onChange={handleFormChange}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <label htmlFor="isSuccessStory" className="text-xs font-semibold text-muted-foreground">
                Mark as Success Story
              </label>
            </div>

            <Button type="submit" className="w-full h-10 font-bold" isLoading={createMutation.isPending || updateMutation.isPending}>
              {isEditOpen ? "Save Changes" : "Publish Milestone Post"}
            </Button>
          </form>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
