'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Image as ImageIcon, Video, Link as LinkIcon, AlertCircle, UploadCloud } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { introVideosService, mediaService } from '@/services';
import type { IntroVideo } from '@/services/types';

export default function IntroVideosPage() {
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewVideo, setPreviewVideo] = useState<IntroVideo | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    videoUrl: '',
    posterUrl: '',
    orderIndex: 1,
    isActive: true,
  });

  // State for toggling Video Input mode
  const [videoInputMode, setVideoInputMode] = useState<'upload' | 'link'>('link');

  // Files to upload
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Fetch Videos
  const { data, isLoading } = useQuery({
    queryKey: ['introVideos'],
    queryFn: () => introVideosService.getAll().then(r => r.data),
  });

  const videosList: IntroVideo[] = Array.isArray(data) ? data : (data?.introVideos || data?.items || []);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: any) => introVideosService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['introVideos'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => introVideosService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['introVideos'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => introVideosService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['introVideos'] });
    },
  });

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ title: '', videoUrl: '', posterUrl: '', orderIndex: 1, isActive: true });
    setPosterFile(null);
    setVideoFile(null);
    setUploadError('');
    setVideoInputMode('link');
  };

  const openEditModal = (video: IntroVideo) => {
    setEditingId(video.id);
    setFormData({
      title: video.title,
      videoUrl: video.videoUrl,
      posterUrl: video.posterUrl || '',
      orderIndex: video.orderIndex,
      isActive: video.isActive,
    });
    setPosterFile(null);
    setVideoFile(null);
    setUploadError('');
    // Guess mode based on URL
    if (video.videoUrl && video.videoUrl.includes('s3')) {
      setVideoInputMode('upload');
    } else {
      setVideoInputMode('link');
    }
    setIsModalOpen(true);
  };

  const handlePosterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setPosterFile(e.target.files[0]);
      setUploadError('');
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setVideoFile(e.target.files[0]);
      setUploadError('');
    }
  };

  const uploadToS3 = async (file: File, folder: string): Promise<string> => {
    const presignRes = await mediaService.generatePresignedUrls({
      folder,
      files: [{ filename: file.name, fileType: file.type }]
    });
    
    const fileData = presignRes.data?.files?.[0];
    if (!fileData || !fileData.uploadUrl) {
      throw new Error(`Failed to retrieve upload URL for ${file.name}`);
    }

    const uploadRes = await fetch(fileData.uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!uploadRes.ok) {
      throw new Error(`Failed to upload ${file.name} to S3`);
    }

    return fileData.imageUrl;
  };

  const isYouTube = (url: string) => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  const getYouTubeEmbedUrl = (url: string) => {
    try {
      const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
      if (match && match[1]) {
        return `https://www.youtube.com/embed/${match[1]}?autoplay=1`;
      }
      return url;
    } catch {
      return url; // fallback
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalPosterUrl = formData.posterUrl;
    let finalVideoUrl = formData.videoUrl;
    
    setIsUploading(true);
    setUploadError('');

    try {
      // 1. Upload Poster if selected
      if (posterFile) {
        finalPosterUrl = await uploadToS3(posterFile, 'intro-videos/posters');
      }

      // 2. Upload Video if selected and mode is upload
      if (videoInputMode === 'upload' && videoFile) {
        finalVideoUrl = await uploadToS3(videoFile, 'intro-videos/videos');
      } else if (videoInputMode === 'link') {
        finalVideoUrl = formData.videoUrl;
      }

      if (!finalPosterUrl) {
        throw new Error('A poster image is required.');
      }
      if (!finalVideoUrl) {
        throw new Error('A video URL or file is required.');
      }

      const payload = { 
        ...formData, 
        posterUrl: finalPosterUrl,
        videoUrl: finalVideoUrl
      };

      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
    } catch (err: any) {
      console.error('Submit error:', err);
      setUploadError(err.message || 'An error occurred during submission.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-full pb-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Intro Videos</h1>
            <p className="text-xs text-muted-foreground">
              Manage the promotional and intro videos displayed on the website.
            </p>
          </div>
          <Button onClick={() => { setVideoInputMode('link'); setIsModalOpen(true); }} className="h-9 font-bold text-xs">
            <Plus className="mr-1.5 h-4 w-4" />
            Add New Video
          </Button>
        </div>

        {/* Content Grid */}
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : videosList.length === 0 ? (
          <Card className="flex flex-col items-center justify-center h-64 border-dashed border-2">
            <Video className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <h3 className="text-lg font-bold text-foreground">No Videos Found</h3>
            <p className="text-sm text-muted-foreground mb-4">You haven't added any intro videos yet.</p>
            <Button onClick={() => setIsModalOpen(true)} variant="outline" size="sm">Create First Video</Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videosList.map((video) => (
              <Card key={video.id} className="overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-xl hover:border-primary/50">
                <div 
                  className="relative aspect-video bg-muted w-full overflow-hidden flex items-center justify-center cursor-pointer"
                  onClick={() => setPreviewVideo(video)}
                >
                  {video.posterUrl ? (
                    <img
                      src={video.posterUrl}
                      alt={video.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-80"
                    />
                  ) : (
                    <ImageIcon className="w-10 h-10 text-muted-foreground/30" />
                  )}
                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-12 h-12 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform shadow-lg border border-white/20">
                      <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-white border-b-[8px] border-b-transparent ml-1" />
                    </div>
                  </div>
                  {/* Badges */}
                  <div className="absolute top-3 right-3 flex space-x-2">
                    <Badge className="bg-black/50 backdrop-blur-md text-white border-none shadow-sm">
                      Order: {video.orderIndex}
                    </Badge>
                    <Badge variant={video.isActive ? 'success' : 'outline'} className="shadow-sm backdrop-blur-md">
                      {video.isActive ? 'Active' : 'Draft'}
                    </Badge>
                  </div>
                  {/* Hover Overlay Actions */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center space-x-4 backdrop-blur-[1px]">
                    <Button size="sm" variant="secondary" className="font-bold shadow-lg" onClick={(e) => { e.stopPropagation(); openEditModal(video); }}>
                      <Edit2 className="w-4 h-4 mr-1.5" /> Edit
                    </Button>
                    <Button size="sm" variant="destructive" className="font-bold shadow-lg" onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Permanently delete this video?')) deleteMutation.mutate(video.id);
                    }}>
                      <Trash2 className="w-4 h-4 mr-1.5" /> Delete
                    </Button>
                  </div>
                </div>
                <div className="p-4 flex flex-col flex-grow bg-card">
                  <h3 className="text-sm font-bold text-foreground line-clamp-2 leading-snug">{video.title}</h3>
                  <div className="mt-3 flex items-center text-xs text-muted-foreground truncate">
                    <LinkIcon className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                    <span className="truncate">{video.videoUrl}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        <Dialog isOpen={isModalOpen} onClose={closeModal} title={editingId ? 'Edit Intro Video' : 'Add Intro Video'}>
          <form onSubmit={handleSubmit} className="space-y-5">
            
            <Input
              label="Video Title *"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="e.g., Computer Literacy Session"
            />

            {/* Poster Upload Area */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground flex justify-between">
                <span>Poster Image *</span>
                <span className="text-xxs font-normal">Thumbnail for the video</span>
              </label>
              <div className="border-2 border-dashed border-border rounded-xl p-3 flex flex-col items-center justify-center bg-muted/20 relative group hover:bg-muted/40 transition-colors h-28">
                {posterFile ? (
                  <div className="text-center">
                    <ImageIcon className="h-6 w-6 text-primary mx-auto mb-1" />
                    <p className="text-xs font-bold text-foreground truncate max-w-[200px]">{posterFile.name}</p>
                    <p className="text-xxs text-muted-foreground">Ready to upload</p>
                  </div>
                ) : formData.posterUrl ? (
                  <div className="relative w-full h-full rounded-lg overflow-hidden">
                    <img src={formData.posterUrl} className="w-full h-full object-cover opacity-80" alt="Preview" />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white text-xs font-bold">Change Poster</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <ImageIcon className="h-6 w-6 text-muted-foreground/50 mx-auto mb-1" />
                    <p className="text-xs font-semibold text-foreground">Click to upload poster</p>
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handlePosterChange}
                />
              </div>
            </div>

            {/* Dual Mode Video Input */}
            <div className="space-y-2 p-3 rounded-xl border border-border/60 bg-muted/10">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-foreground">Video Source *</label>
                <div className="flex bg-secondary p-0.5 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setVideoInputMode('link')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${videoInputMode === 'link' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    External Link
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoInputMode('upload')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${videoInputMode === 'upload' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Upload MP4
                  </button>
                </div>
              </div>

              {videoInputMode === 'link' ? (
                <div className="space-y-1.5 animate-in fade-in zoom-in-95 duration-200">
                  <Input
                    label=""
                    value={formData.videoUrl}
                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                    required={videoInputMode === 'link'}
                    placeholder="https://youtube.com/watch?v=..."
                  />
                  <p className="text-xxs text-muted-foreground">Paste a YouTube, Vimeo, or external .mp4 link here.</p>
                </div>
              ) : (
                <div className="border-2 border-dashed border-primary/40 rounded-xl p-4 flex flex-col items-center justify-center bg-primary/5 relative group hover:bg-primary/10 transition-colors h-24 animate-in fade-in zoom-in-95 duration-200">
                  {videoFile ? (
                    <div className="text-center">
                      <Video className="h-6 w-6 text-primary mx-auto mb-1" />
                      <p className="text-xs font-bold text-foreground truncate max-w-[200px]">{videoFile.name}</p>
                      <p className="text-xxs text-primary/70">{(videoFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                  ) : formData.videoUrl && formData.videoUrl.includes('s3') ? (
                    <div className="text-center">
                      <Video className="h-6 w-6 text-primary mx-auto mb-1" />
                      <p className="text-xs font-bold text-foreground">Existing Uploaded Video</p>
                      <p className="text-xxs text-primary hover:underline relative z-20 cursor-pointer">Click container to replace</p>
                    </div>
                  ) : (
                    <div className="text-center py-2">
                      <UploadCloud className="h-6 w-6 text-primary/50 mx-auto mb-1" />
                      <p className="text-xs font-semibold text-primary">Click to upload .mp4 video</p>
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="video/mp4,video/webm" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleVideoChange}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Order Index *"
                type="number"
                value={formData.orderIndex}
                onChange={(e) => setFormData({ ...formData, orderIndex: Number(e.target.value) })}
                required
              />
              <div className="flex flex-col space-y-1.5 justify-end">
                <label className="text-xs font-semibold text-muted-foreground mb-2">Status</label>
                <div className="flex items-center h-10 space-x-3">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                    <span className="text-sm font-semibold">Active (Visible)</span>
                  </label>
                </div>
              </div>
            </div>

            {uploadError && (
              <div className="flex items-center justify-center text-destructive bg-destructive/10 p-2 rounded text-xs font-semibold mt-1">
                <AlertCircle className="w-3.5 h-3.5 mr-1" /> {uploadError}
              </div>
            )}

            <div className="pt-2">
              <Button 
                type="submit" 
                className="w-full font-bold h-10" 
                isLoading={isUploading || createMutation.isPending || updateMutation.isPending}
              >
                {isUploading ? 'Uploading Files...' : editingId ? 'Save Changes' : 'Create Video'}
              </Button>
            </div>
          </form>
        </Dialog>

        {/* Video Playback Modal */}
        <Dialog 
          isOpen={!!previewVideo} 
          onClose={() => setPreviewVideo(null)} 
          title={previewVideo?.title || 'Video Preview'}
        >
          {previewVideo && (
            <div className="flex justify-center bg-black rounded-lg overflow-hidden mt-2">
              {isYouTube(previewVideo.videoUrl) ? (
                <iframe
                  width="100%"
                  height="315"
                  src={getYouTubeEmbedUrl(previewVideo.videoUrl)}
                  title={previewVideo.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full aspect-video"
                ></iframe>
              ) : (
                <video 
                  src={previewVideo.videoUrl} 
                  controls 
                  autoPlay 
                  poster={previewVideo.posterUrl}
                  className="w-full max-h-[70vh] object-contain outline-none"
                >
                  Your browser does not support the video tag.
                </video>
              )}
            </div>
          )}
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
