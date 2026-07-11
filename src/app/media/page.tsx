'use client';

import React, { useState, useEffect } from 'react';
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
  const [playingId, setPlayingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<MediaEntry>>({
    title: '',
    category: 'gallery',
    media_url: '',
    publisher: '',
    type: 'image',
    order_index: 1,
    status: true,
  });

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['media'],
    queryFn: () => mediaGalleryService.getAll().then((r) => r.data),
  });

  const mediaList: MediaEntry[] = Array.isArray(data) ? data : data?.items || [];

  // Auto-calculate order_index for new entries when type or category changes
  useEffect(() => {
    if (!editingId && isModalOpen) {
      let filtered = mediaList;
      if (formData.type === 'video') {
        filtered = mediaList.filter(m => m.type === 'video');
      } else {
        filtered = mediaList.filter(m => m.category === formData.category && m.type !== 'video');
      }
      const max = filtered.reduce((acc, curr) => Math.max(acc, curr.order_index || 0), 0);
      setFormData(prev => ({ ...prev, order_index: max + 1 }));
    }
  }, [formData.type, formData.category, isModalOpen, editingId, mediaList]);

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
    setFormData({ 
      title: '', 
      category: 'gallery', 
      media_url: '', 
      publisher: '', 
      type: 'image',
      order_index: 1,
      status: true,
    });
  };

  const inferMediaTypeFromUrl = (url?: string) => {
    if (!url) return 'image';
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.ogg')) return 'video';
    return 'image';
  };

  const openEditModal = (entry: MediaEntry) => {
    setEditingId(entry.id);
    setFormData({
      title: entry.title || '',
      category: entry.category || 'gallery',
      media_url: entry.media_url || '',
      publisher: entry.publisher || '',
      type: entry.type || 'image',
      order_index: entry.order_index || 1,
      status: entry.status ?? true,
    });
    setUploadFile(null);
    setIsModalOpen(true);
  };

  const getYoutubeEmbedId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&]{11})/);
    return match ? match[1] : null;
  };

  const performUpload = async (): Promise<string | null> => {
    if (!uploadFile) return formData.media_url || null;
    setIsUploading(true);
    try {
      const presignRes = await mediaService.generatePresignedUrls({
        folder: formData.category || 'gallery',
        fileName: uploadFile.name,
        fileType: uploadFile.type || 'image/jpeg',
        files: [{ filename: uploadFile.name, fileType: uploadFile.type || 'image/jpeg' }]
      });
      
      const uploadUrl = presignRes.data?.uploadUrl || presignRes.data?.files?.[0]?.uploadUrl;
      const imageUrl = presignRes.data?.fileUrl || presignRes.data?.imageUrl || presignRes.data?.media_url || presignRes.data?.url || presignRes.data?.files?.[0]?.imageUrl;
      
      if (!uploadUrl) throw new Error('Failed to get upload URL');

      await fetch(uploadUrl, { method: 'PUT', body: uploadFile, headers: { 'Content-Type': uploadFile.type || 'image/jpeg' }});
      return imageUrl || uploadUrl.split('?')[0]; // fallback to stripping query string from upload URL
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
    let finalUrl = formData.media_url;
    const isYoutube = inferMediaTypeFromUrl(finalUrl) === 'youtube';
    
    if (!isYoutube && uploadFile) {
      const uploadedUrl = await performUpload();
      if (uploadedUrl) finalUrl = uploadedUrl;
    }
    
    const payload = { 
      ...formData, 
      media_url: finalUrl,
      publisher: formData.publisher || null
    };

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
              Manage images and videos shown in the press and gallery sections.
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {mediaList.map((entry) => {
              const displayType = inferMediaTypeFromUrl(entry.media_url);
              const isPlaying = playingId === entry.id;
              
              return (
                <Card key={entry.id} className="group relative overflow-hidden border border-border/60 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                  <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full shadow-sm bg-background/90 backdrop-blur hover:bg-background" onClick={() => openEditModal(entry)}>
                      <Edit2 className="h-4 w-4 text-foreground" />
                    </Button>
                    <Button size="icon" variant="destructive" className="h-8 w-8 rounded-full shadow-sm" onClick={() => {
                      if (confirm('Delete this media entry?')) deleteMutation.mutate(entry.id);
                    }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="relative h-64 sm:h-72 w-full bg-black group-hover:opacity-95 transition-opacity flex items-center justify-center overflow-hidden">
                    {displayType === 'youtube' ? (
                      isPlaying ? (
                        <iframe 
                          src={`https://www.youtube.com/embed/${getYoutubeEmbedId(entry.media_url || '')}?autoplay=1`} 
                          allow="autoplay; encrypted-media" 
                          allowFullScreen 
                          className="w-full h-full border-0" 
                        />
                      ) : (
                        <div className="w-full h-full cursor-pointer relative" onClick={() => setPlayingId(entry.id)}>
                          <img src={`https://img.youtube.com/vi/${getYoutubeEmbedId(entry.media_url || '')}/maxresdefault.jpg`} onError={(e) => (e.currentTarget.src = `https://img.youtube.com/vi/${getYoutubeEmbedId(entry.media_url || '')}/hqdefault.jpg`)} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" alt={entry.title} />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-red-600/90 rounded-full p-4 shadow-lg backdrop-blur-sm group-hover:scale-110 transition-transform">
                              <Play className="w-8 h-8 text-white ml-1" />
                            </div>
                          </div>
                        </div>
                      )
                    ) : entry.type === 'video' || displayType === 'video' ? (
                      isPlaying ? (
                        <video src={entry.media_url} className="w-full h-full object-contain bg-black" controls autoPlay />
                      ) : (
                        <div className="w-full h-full cursor-pointer relative" onClick={() => setPlayingId(entry.id)}>
                          <video src={entry.media_url} className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-500" muted />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-primary/90 rounded-full p-4 shadow-lg backdrop-blur-sm group-hover:scale-110 transition-transform">
                              <Play className="w-8 h-8 text-white ml-1" />
                            </div>
                          </div>
                        </div>
                      )
                    ) : (
                      <img src={entry.media_url} alt={entry.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    )}
                  </div>
                  
                  <div className="p-5 bg-gradient-to-b from-background to-muted/20">
                    <div className="flex justify-between items-center mb-3">
                      <Badge variant="default" className="text-[10px] uppercase tracking-wider font-bold">{entry.category}</Badge>
                      {entry.type === 'video' && <Badge variant="secondary" className="text-[10px]">Video</Badge>}
                    </div>
                    <h3 className="font-bold text-base text-foreground line-clamp-2 leading-tight">{entry.title}</h3>
                    {entry.publisher && <p className="text-sm font-medium text-muted-foreground mt-2 flex items-center"><MonitorPlay className="w-4 h-4 mr-1.5 opacity-70" /> {entry.publisher}</p>}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <Dialog isOpen={isModalOpen} onClose={closeModal} title={editingId ? 'Edit Media Entry' : 'Add Media Entry'}>
          <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            
            <div className="bg-muted/30 p-2 rounded-lg border border-border/50 flex gap-2">
              <Button type="button" variant={formData.type === 'image' ? 'primary' : 'ghost'} size="sm" className="flex-1" onClick={() => setFormData({ ...formData, type: 'image' })}>
                <ImageIcon className="w-4 h-4 mr-2" /> Image
              </Button>
              <Button type="button" variant={formData.type === 'video' ? 'primary' : 'ghost'} size="sm" className="flex-1" onClick={() => setFormData({ ...formData, type: 'video' })}>
                <Video className="w-4 h-4 mr-2" /> Video
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input label="Title *" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required placeholder="e.g. Noida Slum Class" />
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Category *</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.category} 
                  onChange={(e) => setFormData({...formData, category: e.target.value as 'gallery' | 'press' | 'general'})}
                  required
                >
                  <option value="gallery">Gallery</option>
                  <option value="press">Press</option>
                  <option value="general">General</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input label="Publisher" value={formData.publisher || ''} onChange={(e) => setFormData({...formData, publisher: e.target.value})} placeholder="e.g. NDTV News (Optional)" />
              <Input label="Order Index" type="number" value={formData.order_index} onChange={(e) => setFormData({...formData, order_index: parseInt(e.target.value) || 1})} required />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Media URL or Upload (For YouTube, just paste link)</label>
              <Input 
                value={formData.media_url} 
                onChange={(e) => setFormData({...formData, media_url: e.target.value})} 
                placeholder="https://... or click below to upload" 
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Upload File (Optional if URL provided)</label>
              <div className="border-2 border-dashed border-border rounded-xl p-4 flex flex-col items-center justify-center bg-muted/20 relative">
                {uploadFile ? (
                  <p className="text-sm font-bold text-primary">{uploadFile.name}</p>
                ) : (
                  <div className="text-center">
                    {formData.type === 'image' ? <ImageIcon className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" /> : <Video className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />}
                    <p className="text-xs font-semibold">Click to select file</p>
                  </div>
                )}
                <input 
                  type="file" 
                  accept={formData.type === 'image' ? 'image/*' : 'video/*'} 
                  onChange={(e) => { if(e.target.files) setUploadFile(e.target.files[0]) }} 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                />
              </div>
            </div>

            <Button type="submit" className="w-full font-bold h-10 mt-2" isLoading={isUploading || createMutation.isPending || updateMutation.isPending}>
              {isUploading ? 'Uploading Media...' : editingId ? 'Save Changes' : 'Add Media'}
            </Button>
          </form>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
