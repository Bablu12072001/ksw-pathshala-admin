'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Image as ImageIcon, 
  Video, 
  MonitorPlay,
  Edit2, 
  Trash2, 
  Plus, 
  AlertCircle,
  Play
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { mediaGalleryService, mediaService } from '@/services';
import type { MediaEntry } from '@/services/types';

export default function MediaGalleryPage() {
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<MediaEntry>>({
    title: '',
    category: 'activities',
    url: '',
  });

  const [mediaType, setMediaType] = useState<'image' | 'video' | 'youtube'>('image');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['media'],
    queryFn: () => mediaGalleryService.getAll().then((r) => r.data),
  });

  const mediaList: MediaEntry[] = Array.isArray(data) ? data : data?.items || [];

  const createMutation = useMutation({
    mutationFn: (payload: any) => mediaGalleryService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => mediaGalleryService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => mediaGalleryService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
    },
  });

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setUploadFile(null);
    setMediaType('image');
    setFormData({ 
      title: '', category: 'activities', url: '' 
    });
  };

  const inferMediaType = (url?: string) => {
    if (!url) return 'image';
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.ogg')) return 'video';
    return 'image';
  };

  const openEditModal = (entry: MediaEntry) => {
    setEditingId(entry.id);
    setFormData({
      title: entry.title || '',
      category: entry.category || 'activities',
      url: entry.url || '',
    });
    setMediaType(inferMediaType(entry.url || ''));
    setUploadFile(null);
    setIsModalOpen(true);
  };

  const getYoutubeEmbedId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&]{11})/);
    return match ? match[1] : null;
  };

  const performUpload = async (): Promise<string | null> => {
    if (!uploadFile) return formData.url || null;
    setIsUploading(true);
    try {
      const presignRes = await mediaService.generatePresignedUrls({
        folder: 'gallery',
        files: [{ filename: uploadFile.name, fileType: uploadFile.type }]
      });
      const fileData = presignRes.data?.files?.[0];
      if (!fileData) throw new Error('Failed to get upload URL');

      await fetch(fileData.uploadUrl, { method: 'PUT', body: uploadFile, headers: { 'Content-Type': uploadFile.type }});
      return fileData.imageUrl;
    } catch (err) {
      console.error(err);
      alert('Media upload failed.');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalUrl = formData.url;
    if (mediaType !== 'youtube' && uploadFile) {
      const uploadedUrl = await performUpload();
      if (uploadedUrl) finalUrl = uploadedUrl;
    }
    const payload = { ...formData, url: finalUrl };

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
              <ImageIcon className="w-6 h-6 mr-2 text-primary" />
              Media Gallery
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Manage images and videos shown in the press and activities gallery.
            </p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="h-9 font-bold text-xs">
            <Plus className="mr-1.5 h-4 w-4" />
            Add Media
          </Button>
        </div>

        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : error ? (
          <Card className="flex flex-col items-center justify-center h-64 border-dashed border-2 border-destructive/50">
            <AlertCircle className="h-12 w-12 text-destructive mb-3" />
            <h3 className="text-lg font-bold text-foreground">Failed to Load Media</h3>
          </Card>
        ) : mediaList.length === 0 ? (
          <Card className="flex flex-col items-center justify-center h-64 border-dashed border-2 bg-muted/20">
            <ImageIcon className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <h3 className="text-lg font-bold text-foreground">No Media Found</h3>
            <Button onClick={() => setIsModalOpen(true)} variant="outline" size="sm" className="mt-4">Upload First Media</Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {mediaList.map((entry) => {
              const type = inferMediaType(entry.url);
              
              return (
                <Card key={entry.id} className="group relative overflow-hidden border border-border/60 hover:shadow-lg transition-all duration-300">
                  <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <Button size="icon" variant="secondary" className="h-7 w-7 rounded-full shadow-sm bg-background/80 backdrop-blur" onClick={() => openEditModal(entry)}>
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="destructive" className="h-7 w-7 rounded-full shadow-sm" onClick={() => {
                      if (confirm('Delete this media entry?')) deleteMutation.mutate(entry.id);
                    }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="relative h-48 w-full bg-black group-hover:opacity-90 transition-opacity flex items-center justify-center overflow-hidden">
                    {type === 'youtube' ? (
                      <>
                        <img src={`https://img.youtube.com/vi/${getYoutubeEmbedId(entry.url)}/hqdefault.jpg`} className="w-full h-full object-cover opacity-80" alt={entry.title} />
                        <MonitorPlay className="w-12 h-12 text-red-500 absolute" />
                      </>
                    ) : type === 'video' ? (
                      <>
                        <video src={entry.url} className="w-full h-full object-cover opacity-70" muted />
                        <Play className="w-12 h-12 text-white/80 absolute" />
                      </>
                    ) : (
                      <img src={entry.url} alt={entry.title} className="w-full h-full object-cover" />
                    )}
                  </div>
                  
                  <div className="p-4">
                    <Badge variant="outline" className="mb-2 text-[10px] uppercase tracking-wider font-bold bg-muted/50">{entry.category}</Badge>
                    <h3 className="font-bold text-sm text-foreground line-clamp-2 leading-tight">{entry.title}</h3>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <Dialog isOpen={isModalOpen} onClose={closeModal} title={editingId ? 'Edit Media Entry' : 'Add Media Entry'}>
          <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            
            <div className="bg-muted/30 p-2 rounded-lg border border-border/50 flex gap-2">
              <Button type="button" variant={mediaType === 'image' ? 'primary' : 'ghost'} size="sm" className="flex-1" onClick={() => setMediaType('image')}>
                <ImageIcon className="w-4 h-4 mr-2" /> Image
              </Button>
              <Button type="button" variant={mediaType === 'video' ? 'primary' : 'ghost'} size="sm" className="flex-1" onClick={() => setMediaType('video')}>
                <Video className="w-4 h-4 mr-2" /> Video File
              </Button>
              <Button type="button" variant={mediaType === 'youtube' ? 'primary' : 'ghost'} size="sm" className="flex-1" onClick={() => setMediaType('youtube')}>
                <MonitorPlay className="w-4 h-4 mr-2" /> YouTube
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input label="Title *" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required placeholder="e.g. Noida Slum Class" />
              <Input label="Category *" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} required placeholder="e.g. activities, press" />
            </div>

            {mediaType === 'youtube' ? (
              <Input label="YouTube URL *" value={formData.url} onChange={(e) => setFormData({...formData, url: e.target.value})} required placeholder="https://youtube.com/watch?v=..." />
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">{mediaType === 'image' ? 'Upload Image' : 'Upload Video'}</label>
                <div className="border-2 border-dashed border-border rounded-xl p-4 flex flex-col items-center justify-center bg-muted/20 relative">
                  {uploadFile ? (
                    <p className="text-sm font-bold text-primary">{uploadFile.name}</p>
                  ) : formData.url ? (
                    <p className="text-sm font-semibold text-muted-foreground break-all">{formData.url}</p>
                  ) : (
                    <div className="text-center">
                      {mediaType === 'image' ? <ImageIcon className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" /> : <Video className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />}
                      <p className="text-xs font-semibold">Click to select file</p>
                    </div>
                  )}
                  <input type="file" accept={mediaType === 'image' ? 'image/*' : 'video/*'} onChange={(e) => { if(e.target.files) setUploadFile(e.target.files[0]) }} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
              </div>
            )}

            <Button type="submit" className="w-full font-bold h-10 mt-2" isLoading={isUploading || createMutation.isPending || updateMutation.isPending}>
              {isUploading ? 'Uploading Media...' : editingId ? 'Save Changes' : 'Add Media'}
            </Button>
          </form>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
