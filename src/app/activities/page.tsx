'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, Calendar, Edit2, Trash2, 
  Image as ImageIcon, Video, MonitorPlay, X, Link, Upload, Play
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { useAppStore } from '@/lib/store';
import { activitiesService, mediaService, classesService } from '@/services';

interface MediaItem {
  file?: File;
  url: string;
  type: 'image' | 'video' | 'youtube';
  caption: string;
}

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
    media: [] as MediaItem[],
  });

  const [isUploading, setIsUploading] = useState(false);

  // 1. Fetch activities via Axios admin API
  const { data: activitiesData, isLoading } = useQuery({
    queryKey: ['activities'],
    queryFn: () => activitiesService.getAll().then((r) => r.data),
  });

  // 2. Fetch Classes for dropdown
  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classesService.getAll().then((r) => r.data),
  });

  // Upload processing helper
  const processUploads = async (mediaArray: MediaItem[]): Promise<any[]> => {
    const finalMedia = [];
    for (const item of mediaArray) {
      if (item.type !== 'youtube' && item.file) {
        // Needs upload
        const presignRes = await mediaService.generatePresignedUrls({
          folder: 'activities',
          files: [{ filename: item.file.name, fileType: item.file.type }]
        });
        const fileData = presignRes.data?.files?.[0];
        if (fileData) {
          await fetch(fileData.uploadUrl, { method: 'PUT', body: item.file, headers: { 'Content-Type': item.file.type }});
          finalMedia.push({ url: fileData.imageUrl, type: item.type, caption: item.caption });
        }
      } else {
        finalMedia.push({ url: item.url, type: item.type, caption: item.caption });
      }
    }
    return finalMedia;
  };

  // Mutation via Axios admin API
  const createMutation = useMutation({
    mutationFn: (newActivity: any) => activitiesService.create(newActivity).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      setIsAddOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => activitiesService.update(id, payload).then((r) => r.data),
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    try {
      const finalMedia = await processUploads(formData.media);
      const payload = {
        title: formData.title,
        description: formData.description,
        class: formData.class,
        author: formData.author,
        isSuccessStory: formData.isSuccessStory,
        media: finalMedia,
      };

      if (isEditOpen && editActivityId) {
        await updateMutation.mutateAsync({ id: editActivityId, payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save activity or upload media.');
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      class: 'Class 5',
      author: user?.name || '',
      isSuccessStory: false,
      media: [],
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
      media: act.media || (act.mediaUrl ? [{ url: act.mediaUrl, type: 'image', caption: '' }] : []),
    });
    setEditActivityId(act.id);
    setIsEditOpen(true);
  };

  // Media Array Handlers
  const addMediaItem = (type: 'image' | 'video' | 'youtube') => {
    setFormData(prev => ({
      ...prev,
      media: [...prev.media, { url: '', type, caption: '' }]
    }));
  };

  const removeMediaItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      media: prev.media.filter((_, i) => i !== index)
    }));
  };

  const updateMediaItem = (index: number, field: keyof MediaItem, value: any) => {
    setFormData(prev => {
      const newMedia = [...prev.media];
      newMedia[index] = { ...newMedia[index], [field]: value };
      return { ...prev, media: newMedia };
    });
  };

  const getYoutubeEmbedId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&]{11})/);
    return match ? match[1] : null;
  };

  const classesList = Array.isArray(classesData) ? classesData : (classesData?.items || classesData?.classes || []);
  const uniqueClassNames = Array.from(new Set(classesList.map((c: any) => c.name)));
  const dynamicClassOptions = uniqueClassNames.map((name: any) => ({ label: name, value: name }));

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-full pb-10">
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
              {activitiesList.map((act: any) => {
                const firstMedia = act.media && act.media.length > 0 ? act.media[0] : null;
                const legacyMediaUrl = act.mediaUrl;
                
                return (
                  <Card key={act.id} className="overflow-hidden flex flex-col h-full border-border/70 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative group bg-card">
                    {!isSponsor && (
                      <div className="absolute top-3 right-3 flex space-x-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(act)} className="h-8 w-8 rounded-full bg-secondary/90 hover:bg-secondary border border-border/40 flex items-center justify-center text-foreground transition-colors shadow-sm cursor-pointer backdrop-blur-md">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => { if(confirm('Delete activity?')) deleteMutation.mutate(act.id); }} className="h-8 w-8 rounded-full bg-destructive/90 hover:bg-destructive text-white border border-destructive flex items-center justify-center transition-colors shadow-sm cursor-pointer backdrop-blur-md">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}

                    {/* Media Display */}
                    {(act.media?.length > 0 || legacyMediaUrl) ? (
                      <div className="relative h-48 w-full bg-black flex overflow-x-auto snap-x snap-mandatory scrollbar-hide z-10">
                        {(act.media?.length > 0 ? act.media : [{ url: legacyMediaUrl, type: 'image' }]).map((mediaItem: any, idx: number) => (
                          <div key={idx} className="w-full h-full flex-shrink-0 snap-center relative flex items-center justify-center group/media">
                            {mediaItem.type === 'youtube' ? (
                              <iframe 
                                src={`https://www.youtube.com/embed/${getYoutubeEmbedId(mediaItem.url)}`}
                                className="w-full h-full border-0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            ) : mediaItem.type === 'video' ? (
                              <video src={mediaItem.url} controls className="w-full h-full object-contain bg-black" />
                            ) : (
                              <img src={mediaItem.url} alt={mediaItem.caption || act.title} className="w-full h-full object-cover" />
                            )}
                            {mediaItem.caption && (
                               <div className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] px-2 py-1 rounded backdrop-blur max-w-[90%] truncate opacity-0 group-hover/media:opacity-100 transition-opacity pointer-events-none">
                                 {mediaItem.caption}
                               </div>
                            )}
                          </div>
                        ))}
                        {act.media?.length > 1 && (
                          <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded-full font-bold backdrop-blur pointer-events-none z-10">
                            Swipe ↔️ {act.media.length} items
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-48 w-full bg-secondary flex items-center justify-center text-muted-foreground z-10">
                        <ImageIcon className="h-8 w-8 opacity-20" />
                      </div>
                    )}

                    {/* Content */}
                    <CardContent className="p-5 flex-1 flex flex-col pt-5">
                      <div className="flex justify-between items-center mb-3">
                        <Badge variant="outline" className="font-bold text-[10px] uppercase tracking-wider text-primary bg-primary/5 border-primary/20">
                          {act.class}
                        </Badge>
                        <div className="flex items-center text-xs font-semibold text-muted-foreground">
                          <Calendar className="mr-1.5 h-3.5 w-3.5" />
                          <span>{new Date(act.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <h3 className="text-lg font-extrabold text-foreground leading-snug mb-2">{act.title}</h3>
                      <p className="text-sm leading-relaxed text-muted-foreground/90 line-clamp-3">
                        {act.description}
                      </p>

                      {/* Signature */}
                      <div className="mt-auto pt-4 border-t border-border/40 text-xs font-bold text-muted-foreground flex justify-between items-center">
                        <span>By {act.author || act.teacherName || 'Admin'}</span>
                        {act.isSuccessStory && (
                          <span className="text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider">Success Story</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          );
        })()}

        {/* DIALOG: UPLOAD / EDIT UPDATE */}
        <Dialog isOpen={isAddOpen || isEditOpen} onClose={() => { setIsAddOpen(false); setIsEditOpen(false); resetForm(); }} title={isEditOpen ? "Edit Classroom Post" : "Upload Classroom Post"}>
          <form onSubmit={handleSubmit} className="space-y-5 max-h-[80vh] overflow-y-auto pr-1">
            <Input label="Activity Title *" name="title" required placeholder="e.g. Science Experiment Day" value={formData.title} onChange={handleFormChange} />
            
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Activity Description *</label>
              <textarea name="description" required rows={3} placeholder="Detail what children did and the progress observed..." value={formData.description} onChange={handleFormChange} className="flex w-full rounded-lg border border-border bg-input/50 px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200" />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select label="Target Class" name="class" options={[{ label: 'Select a Class', value: '' }, ...dynamicClassOptions]} value={formData.class} onChange={handleFormChange} />
              <Input label="Author Name *" name="author" required placeholder="e.g. Rajesh Kumar" value={formData.author} onChange={handleFormChange} />
            </div>
            
            <div className="flex items-center space-x-2 pb-2">
              <input type="checkbox" name="isSuccessStory" id="isSuccessStory" checked={formData.isSuccessStory} onChange={handleFormChange} className="h-4 w-4 rounded border-border text-primary focus:ring-primary" />
              <label htmlFor="isSuccessStory" className="text-xs font-semibold text-muted-foreground">Mark as Success Story</label>
            </div>

            {/* Media Gallery Section */}
            <div className="space-y-3 pt-3 border-t border-border/50">
              <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-3">
                <label className="text-sm font-bold text-foreground">Media Attachments</label>
                <div className="flex flex-wrap gap-1 bg-muted/50 p-1 rounded-lg border border-border/50">
                  <Button type="button" variant="ghost" size="sm" onClick={() => addMediaItem('image')} className="h-7 text-xs font-semibold px-2">
                    <ImageIcon className="w-3.5 h-3.5 mr-1" /> Image
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => addMediaItem('video')} className="h-7 text-xs font-semibold px-2">
                    <Video className="w-3.5 h-3.5 mr-1" /> Video
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => addMediaItem('youtube')} className="h-7 text-xs font-semibold px-2">
                    <MonitorPlay className="w-3.5 h-3.5 mr-1" /> YouTube
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {formData.media.map((item, idx) => (
                  <div key={idx} className="relative bg-card border border-border rounded-xl p-4 shadow-sm group">
                    <Button type="button" variant="ghost" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-white shadow hover:bg-destructive/90 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeMediaItem(idx)}>
                      <X className="h-3 w-3" />
                    </Button>
                    
                    <div className="flex flex-col sm:flex-row gap-4">
                      {item.type === 'youtube' ? (
                        <div className="w-24 h-24 rounded-lg bg-black/5 flex-shrink-0 flex items-center justify-center border border-border">
                          <MonitorPlay className="w-8 h-8 text-red-500" />
                        </div>
                      ) : (
                        <div className="w-24 h-24 rounded-lg bg-muted/30 flex-shrink-0 flex items-center justify-center border-2 border-dashed border-border relative overflow-hidden group/upload">
                          {item.file ? (
                            <img src={URL.createObjectURL(item.file)} className="w-full h-full object-cover" alt="Preview" />
                          ) : item.url ? (
                            item.type === 'video' ? (
                              <video src={item.url} className="w-full h-full object-cover" />
                            ) : (
                              <img src={item.url} className="w-full h-full object-cover" alt="Preview" />
                            )
                          ) : (
                            <div className="text-center text-muted-foreground">
                              <Upload className="w-6 h-6 mx-auto mb-1 opacity-50" />
                              <span className="text-[10px] font-semibold">Upload</span>
                            </div>
                          )}
                          <input type="file" accept={item.type === 'image' ? 'image/*' : 'video/*'} className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => {
                            if (e.target.files && e.target.files[0]) updateMediaItem(idx, 'file', e.target.files[0]);
                          }} />
                        </div>
                      )}

                      <div className="flex-1 space-y-3">
                        <div className="flex items-center text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                          {item.type === 'youtube' ? <MonitorPlay className="w-3.5 h-3.5 mr-1" /> : item.type === 'image' ? <ImageIcon className="w-3.5 h-3.5 mr-1" /> : <Video className="w-3.5 h-3.5 mr-1" />}
                          {item.type} Attachment
                        </div>
                        
                        {item.type === 'youtube' && (
                          <Input label="" placeholder="YouTube URL (https://youtube.com/watch?v=...)" value={item.url} onChange={(e) => updateMediaItem(idx, 'url', e.target.value)} required />
                        )}
                        <Input label="" placeholder="Caption (e.g. Priya tree drawing)" value={item.caption} onChange={(e) => updateMediaItem(idx, 'caption', e.target.value)} />
                      </div>
                    </div>
                  </div>
                ))}
                
                {formData.media.length === 0 && (
                  <div className="text-center py-6 border-2 border-dashed border-border rounded-xl bg-muted/10">
                    <ImageIcon className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-sm font-semibold text-foreground">No media attached</p>
                    <p className="text-xs text-muted-foreground">Attach images, videos, or YouTube links to make your post engaging.</p>
                  </div>
                )}
              </div>
            </div>

            <Button type="submit" className="w-full h-10 font-bold mt-6" isLoading={isUploading || createMutation.isPending || updateMutation.isPending}>
              {isUploading ? "Uploading Media..." : isEditOpen ? "Save Changes" : "Publish Milestone Post"}
            </Button>
          </form>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
