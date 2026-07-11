'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  CalendarDays, 
  Edit2, 
  Trash2, 
  Plus, 
  AlertCircle,
  Users,
  Image as ImageIcon
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { eventsService, mediaService } from '@/services';
import type { Event } from '@/services/types';

export default function EventsPage() {
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<Event>>({
    eventId: '',
    title: '',
    description: '',
    date: '',
    media: [],
  });

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['events'],
    queryFn: () => eventsService.getAll().then((r) => r.data),
  });

  const rawList = Array.isArray(data?.events) 
    ? data.events 
    : (Array.isArray(data) ? data : (data?.data || data?.items || []));
  const eventsList: Event[] = Array.isArray(rawList) ? rawList : [];

  const createMutation = useMutation({
    mutationFn: (payload: any) => eventsService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => eventsService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => eventsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setUploadFile(null);
    setFormData({ 
      eventId: '', title: '', description: '', date: '', media: []
    });
  };

  const openEditModal = (event: Event) => {
    setEditingId(event.id);
    setUploadFile(null);
    setFormData({
      eventId: event.eventId || '',
      title: event.title || '',
      description: event.description || '',
      date: event.date || '',
      media: event.media || [],
    });
    setIsModalOpen(true);
  };

  const performUpload = async (): Promise<string | null> => {
    if (!uploadFile) return null;
    setIsUploading(true);
    try {
      const presignRes = await mediaService.generatePresignedUrls({
        folder: 'events',
        fileName: uploadFile.name,
        fileType: uploadFile.type || 'image/jpeg',
        files: [{ filename: uploadFile.name, fileType: uploadFile.type || 'image/jpeg' }]
      });
      
      const uploadUrl = presignRes.data?.uploadUrl || presignRes.data?.files?.[0]?.uploadUrl;
      const imageUrl = presignRes.data?.fileUrl || presignRes.data?.imageUrl || presignRes.data?.url || presignRes.data?.files?.[0]?.imageUrl;
      
      if (!uploadUrl) throw new Error('Failed to get upload URL');

      await fetch(uploadUrl, { method: 'PUT', body: uploadFile, headers: { 'Content-Type': uploadFile.type || 'image/jpeg' }});
      return imageUrl || uploadUrl.split('?')[0];
    } catch (err: any) {
      console.error('Upload Error:', err.response?.data || err.message);
      alert(`Media upload failed: ${err.response?.data?.message || err.message}`);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalUrl = formData.media?.[0]?.url || '';
    if (uploadFile) {
      const uploadedUrl = await performUpload();
      if (uploadedUrl) finalUrl = uploadedUrl;
    }

    const payload: any = { 
      eventId: formData.eventId,
      title: formData.title,
      description: formData.description,
      date: formData.date
    };
    
    if (finalUrl) {
      payload.media = [{
        url: finalUrl,
        type: formData.media?.[0]?.type || 'image'
      }];
    } else {
      payload.media = [];
    }
    
    if (editingId) {
      updateMutation.mutate({ id: editingId, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-full pb-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center">
              <CalendarDays className="w-6 h-6 mr-2 text-primary" />
              Calendar Events
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Manage upcoming events, camps, and view volunteer registrations.
            </p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="h-9 font-bold text-xs">
            <Plus className="mr-1.5 h-4 w-4" />
            Create Event
          </Button>
        </div>

        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : error ? (
          <Card className="flex flex-col items-center justify-center h-64 border-dashed border-2 border-destructive/50">
            <AlertCircle className="h-12 w-12 text-destructive mb-3" />
            <h3 className="text-lg font-bold text-foreground">Failed to Load Events</h3>
          </Card>
        ) : eventsList.length === 0 ? (
          <Card className="flex flex-col items-center justify-center h-64 border-dashed border-2 bg-muted/20">
            <CalendarDays className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <h3 className="text-lg font-bold text-foreground">No Events Found</h3>
            <Button onClick={() => setIsModalOpen(true)} variant="outline" size="sm" className="mt-4">Create First Event</Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {eventsList.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((event) => {
              const dateObj = new Date(event.date);
              const isPast = dateObj.getTime() < new Date().getTime();
              
              return (
                <Card key={event.id} className={`flex flex-col overflow-hidden border border-border/60 hover:shadow-lg transition-all ${isPast ? 'opacity-70 bg-muted/20' : 'bg-card'}`}>
                  
                  {/* Top Bar */}
                  <div className={`p-4 flex justify-between items-start border-b border-border/50 ${isPast ? 'bg-muted' : 'bg-primary/5'}`}>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={isPast ? 'secondary' : 'default'} className="uppercase tracking-wider font-bold">
                          {dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </Badge>
                        <span className="text-xs font-mono text-muted-foreground bg-background px-2 py-0.5 rounded border border-border/50">
                          {event.eventId}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-lg text-foreground mt-1">{event.title}</h3>
                    </div>
                    
                    <div className="flex space-x-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8 bg-background/50 backdrop-blur" onClick={() => openEditModal(event)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 bg-background/50 backdrop-blur text-destructive hover:bg-destructive hover:text-white" onClick={() => {
                        if (confirm('Delete this event?')) deleteMutation.mutate(event.id);
                      }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Body */}
                  <div className="p-5 flex-1 flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground leading-relaxed mb-4">{event.description}</p>
                      
                      <div className="bg-muted/30 border border-border/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-sm font-bold text-foreground mb-2">
                          <Users className="w-4 h-4 text-primary" />
                          Registrations ({event.registrations?.length || 0})
                        </div>
                        
                        {event.registrations && event.registrations.length > 0 ? (
                          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                            {event.registrations.map(reg => (
                              <div key={reg.id} className="text-xs flex justify-between bg-background p-2 rounded border border-border shadow-sm">
                                <div>
                                  <span className="font-bold block text-foreground">{reg.name}</span>
                                  <span className="text-muted-foreground">{reg.email}</span>
                                </div>
                                <div className="text-right">
                                  <span className="font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">{reg.phone}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground italic text-center py-2">No registrations yet.</p>
                        )}
                      </div>
                    </div>

                    {/* Media Preview */}
                    {event.media && event.media.length > 0 && event.media[0].url && (
                      <div className="w-full sm:w-32 h-32 sm:h-auto rounded-md overflow-hidden bg-black/5 flex-shrink-0 relative border border-border/50">
                        {event.media[0].type === 'video' ? (
                          <video src={event.media[0].url} className="w-full h-full object-cover opacity-80" />
                        ) : (
                          <img src={event.media[0].url} alt="Media preview" className="w-full h-full object-cover" />
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <Dialog isOpen={isModalOpen} onClose={closeModal} title={editingId ? 'Edit Event' : 'Create Event'}>
          <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Event Code ID *" value={formData.eventId} onChange={(e) => setFormData({...formData, eventId: e.target.value})} required placeholder="e.g. camp_health_2026" disabled={!!editingId} />
              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Event Date *</label>
                <input type="date" value={formData.date ? formData.date.split('T')[0] : ''} onChange={(e) => setFormData({...formData, date: e.target.value})} required className="flex h-10 w-full rounded-lg border border-border bg-input/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
            </div>

            <Input label="Event Title *" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required placeholder="e.g. Health & Nutrition Camp" />
            
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Description *</label>
              <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} required rows={3} className="flex w-full rounded-lg border border-border bg-input/50 px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>

            {/* Media Section */}
            <div className="p-3 bg-muted/20 border border-border/50 rounded-lg space-y-3">
              <div className="flex items-center justify-between text-sm font-bold text-foreground">
                <div className="flex items-center space-x-2">
                  <ImageIcon className="w-4 h-4 text-primary" />
                  <span>Featured Media (Optional)</span>
                </div>
              </div>
              
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">Upload File</label>
                    <input 
                      type="file" 
                      accept="image/*,video/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setUploadFile(file);
                          const newMedia = [...(formData.media || [])];
                          if (newMedia.length === 0) newMedia.push({ url: '', type: file.type.startsWith('video/') ? 'video' : 'image' });
                          else newMedia[0].type = file.type.startsWith('video/') ? 'video' : 'image';
                          setFormData({...formData, media: newMedia});
                        }
                      }}
                      className="block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                    />
                  </div>
                  
                  <div className="w-1/3 pt-5">
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={formData.media?.[0]?.type || 'image'}
                      onChange={(e) => {
                        const newMedia = [...(formData.media || [])];
                        if (newMedia.length === 0) newMedia.push({ url: '', type: 'image' });
                        newMedia[0].type = e.target.value as 'image' | 'video';
                        setFormData({...formData, media: newMedia});
                      }}
                    >
                      <option value="image">Image</option>
                      <option value="video">Video</option>
                    </select>
                  </div>
                </div>

                <div className="text-center text-xs text-muted-foreground">OR</div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Paste Media URL</label>
                  <Input 
                    placeholder="https://..." 
                    value={!uploadFile ? (formData.media?.[0]?.url || '') : 'File selected for upload'} 
                    disabled={!!uploadFile}
                    onChange={(e) => {
                      const newMedia = [...(formData.media || [])];
                      if (newMedia.length === 0) newMedia.push({ url: '', type: 'image' });
                      newMedia[0].url = e.target.value;
                      setFormData({...formData, media: newMedia});
                    }}
                  />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full font-bold h-10 mt-2" isLoading={createMutation.isPending || updateMutation.isPending}>
              {editingId ? 'Save Changes' : 'Create Event'}
            </Button>
          </form>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
