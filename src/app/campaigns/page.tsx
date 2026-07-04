'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Megaphone, 
  Target, 
  Users, 
  Calendar, 
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
  Image as ImageIcon,
  Video as VideoIcon,
  PlayCircle as YoutubeIcon
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { campaignsService, mediaService } from '@/services';
import type { Campaign } from '@/services/types';

// Helper to convert standard youtube url to embed url
const getYouTubeEmbedUrl = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? `https://www.youtube.com/embed/${match[2]}` : null;
};

export default function CampaignsPage() {
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Local state for media tabs
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'youtube'>('image');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    targetAmount: '' as number | string,
    raisedAmount: '' as number | string,
    supportersCount: '' as number | string,
    status: 'active',
    endDate: '',
    image: '',
    video: '', // can be s3 url or youtube url
    youtubeUrl: '', // transient state for UI input
  });

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => campaignsService.getAll().then((r) => r.data),
  });

  const campaignsList: Campaign[] = Array.isArray(data) ? data : data?.campaigns || data?.items || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: any) => campaignsService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => campaignsService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => campaignsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ 
      title: '', 
      description: '', 
      category: '',
      targetAmount: '', 
      raisedAmount: '', 
      supportersCount: '',
      status: 'active',
      endDate: '',
      image: '',
      video: '',
      youtubeUrl: '',
    });
    setUploadFile(null);
    setUploadError('');
    setMediaType('image');
  };

  const openEditModal = (campaign: Campaign) => {
    setEditingId(campaign.id);
    
    // Determine media type based on existing data
    let currentMediaType: 'image' | 'video' | 'youtube' = 'image';
    let ytUrl = '';
    
    if (campaign.video) {
      if (campaign.video.includes('youtube.com') || campaign.video.includes('youtu.be')) {
        currentMediaType = 'youtube';
        ytUrl = campaign.video;
      } else {
        currentMediaType = 'video';
      }
    } else if (campaign.image) {
      currentMediaType = 'image';
    }

    setMediaType(currentMediaType);
    
    setFormData({
      title: campaign.title || '',
      description: campaign.description || '',
      category: campaign.category || '',
      targetAmount: campaign.targetAmount || '',
      raisedAmount: campaign.raisedAmount || '',
      supportersCount: campaign.supportersCount || '',
      status: campaign.status || (campaign.isActive ? 'active' : 'inactive'),
      endDate: campaign.endDate ? new Date(campaign.endDate).toISOString().split('T')[0] : '',
      image: campaign.image || '',
      video: campaign.video || '',
      youtubeUrl: ytUrl,
    });
    setUploadFile(null);
    setUploadError('');
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadFile(e.target.files[0]);
      setUploadError('');
      
      // Clear out the other media type URL so they don't persist incorrectly
      if (mediaType === 'image') setFormData(f => ({ ...f, video: '', youtubeUrl: '' }));
      if (mediaType === 'video') setFormData(f => ({ ...f, image: '', youtubeUrl: '' }));
    }
  };

  const performUpload = async (): Promise<string | null> => {
    if (!uploadFile) return mediaType === 'image' ? formData.image : formData.video;
    
    setIsUploading(true);
    setUploadError('');
    try {
      const presignRes = await mediaService.generatePresignedUrls({
        folder: 'campaigns',
        files: [{ filename: uploadFile.name, fileType: uploadFile.type }]
      });
      
      const fileData = presignRes.data?.files?.[0];
      if (!fileData || !fileData.uploadUrl) {
        throw new Error('Failed to retrieve upload URL');
      }

      const uploadRes = await fetch(fileData.uploadUrl, {
        method: 'PUT',
        body: uploadFile,
        headers: {
          'Content-Type': uploadFile.type,
        },
      });

      if (!uploadRes.ok) {
        throw new Error('Failed to upload media to S3');
      }

      return fileData.imageUrl;
    } catch (err: any) {
      console.error('Upload error:', err);
      setUploadError(err.message || 'Media upload failed.');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalImageUrl = formData.image;
    let finalVideoUrl = formData.video;
    
    if (mediaType === 'youtube') {
      const embedUrl = getYouTubeEmbedUrl(formData.youtubeUrl);
      if (embedUrl) {
        finalVideoUrl = embedUrl;
        finalImageUrl = ''; // clear image if we switch to youtube
      } else if (formData.youtubeUrl) {
        setUploadError('Invalid YouTube URL');
        return;
      }
    } else if (uploadFile) {
      const uploadedUrl = await performUpload();
      if (!uploadedUrl) return; 
      
      if (mediaType === 'image') {
        finalImageUrl = uploadedUrl;
        finalVideoUrl = ''; // Clear video if switching to image
      } else if (mediaType === 'video') {
        finalVideoUrl = uploadedUrl;
        finalImageUrl = ''; // Clear image if switching to video
      }
    } else {
       // if they switched tabs but didn't upload a new file, we should clear the other state
       if (mediaType === 'image') finalVideoUrl = '';
       if (mediaType === 'video') finalImageUrl = '';
    }

    const payload = { 
      ...formData, 
      targetAmount: Number(formData.targetAmount) || 0,
      raisedAmount: Number(formData.raisedAmount) || 0,
      supportersCount: Number(formData.supportersCount) || 0,
      image: finalImageUrl,
      video: finalVideoUrl,
      // Formatting date back to ISO string if provided
      endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  // Render correct media component for campaign card
  const renderCardMedia = (campaign: Campaign) => {
    if (campaign.video && (campaign.video.includes('youtube.com') || campaign.video.includes('youtu.be'))) {
      return (
        <iframe 
          src={campaign.video}
          className="w-full h-full object-cover pointer-events-none"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowFullScreen
        />
      );
    } else if (campaign.video) {
      return (
        <video 
          src={campaign.video}
          className="w-full h-full object-cover"
          muted loop playsInline
        />
      );
    } else if (campaign.image) {
      return (
        <img
          src={campaign.image}
          alt={campaign.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      );
    } else {
      return (
        <div className="w-full h-full bg-gradient-to-tr from-primary/20 to-primary/5 flex items-center justify-center">
          <Megaphone className="w-12 h-12 text-primary/40" />
        </div>
      );
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-full pb-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center">
              <Megaphone className="w-6 h-6 mr-2 text-primary" />
              Campaigns
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              View, create, edit and monitor active donation campaigns.
            </p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="h-9 font-bold text-xs">
            <Plus className="mr-1.5 h-4 w-4" />
            Add New Campaign
          </Button>
        </div>

        {/* Content Grid */}
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : error ? (
          <Card className="flex flex-col items-center justify-center h-64 border-dashed border-2 border-destructive/50">
            <AlertCircle className="h-12 w-12 text-destructive mb-3" />
            <h3 className="text-lg font-bold text-foreground">Failed to Load Campaigns</h3>
            <p className="text-sm text-muted-foreground mb-4">There was an error connecting to the server.</p>
          </Card>
        ) : campaignsList.length === 0 ? (
          <Card className="flex flex-col items-center justify-center h-64 border-dashed border-2">
            <Megaphone className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <h3 className="text-lg font-bold text-foreground">No Campaigns Found</h3>
            <p className="text-sm text-muted-foreground mb-4">There are currently no campaigns to display.</p>
            <Button onClick={() => setIsModalOpen(true)} variant="outline" size="sm">Create First Campaign</Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {campaignsList.map((campaign) => {
              const raised = Number(campaign.raisedAmount) || 0;
              const target = Number(campaign.targetAmount) || 1; // avoid div by zero
              const percentage = Math.min(Math.round((raised / target) * 100), 100);

              return (
                <Card key={campaign.id} className="overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-xl hover:border-primary/50 relative">
                  {/* Media section */}
                  <div className="relative h-40 bg-muted w-full overflow-hidden flex-shrink-0">
                    {renderCardMedia(campaign)}
                    
                    <div className="absolute top-3 right-3 flex space-x-2 z-10">
                      {campaign.category && (
                        <Badge className="bg-black/60 backdrop-blur-md text-white border-none shadow-sm capitalize">
                          {campaign.category.toLowerCase()}
                        </Badge>
                      )}
                      <Badge variant={campaign.status === 'active' || campaign.isActive ? 'success' : 'outline'} className="shadow-sm">
                        {campaign.status || (campaign.isActive ? 'Active' : 'Inactive')}
                      </Badge>
                    </div>

                    {/* Hover Overlay Actions */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center space-x-4 backdrop-blur-[1px] z-20">
                      <Button size="sm" variant="secondary" className="font-bold shadow-lg" onClick={() => openEditModal(campaign)}>
                        <Edit2 className="w-4 h-4 mr-1.5" /> Edit
                      </Button>
                      <Button size="sm" variant="destructive" className="font-bold shadow-lg" onClick={() => {
                        if (confirm('Permanently delete this campaign?')) deleteMutation.mutate(campaign.id);
                      }}>
                        <Trash2 className="w-4 h-4 mr-1.5" /> Delete
                      </Button>
                    </div>
                  </div>

                  {/* Body section */}
                  <div className="p-5 flex flex-col flex-grow">
                    <h3 className="text-lg font-bold text-foreground line-clamp-1 mb-1">{campaign.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-grow">
                      {campaign.description || 'No description provided.'}
                    </p>

                    {/* Stats & Progress */}
                    <div className="space-y-3 mt-auto">
                      <div className="flex justify-between items-end text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground font-semibold mb-0.5">Raised</p>
                          <p className="font-extrabold text-primary">₹{raised.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground font-semibold mb-0.5">Target</p>
                          <p className="font-bold text-foreground">₹{target.toLocaleString()}</p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-secondary rounded-full h-2 overflow-hidden border border-border/50">
                        <div
                          className="bg-primary h-full rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-xs text-muted-foreground font-medium pt-1">
                        <span className="flex items-center">
                          <Users className="w-3.5 h-3.5 mr-1" />
                          {campaign.supportersCount || 0} Supporters
                        </span>
                        <span>{percentage}% Complete</span>
                      </div>
                    </div>

                    {/* Footer Details */}
                    {campaign.endDate && (
                      <div className="mt-4 pt-4 border-t border-border/50 flex items-center text-xs text-muted-foreground font-semibold">
                        <Calendar className="w-3.5 h-3.5 mr-1.5 text-primary/80" />
                        Ends: {new Date(campaign.endDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Create/Edit Modal */}
        <Dialog isOpen={isModalOpen} onClose={closeModal} title={editingId ? 'Edit Campaign' : 'Create New Campaign'}>
          <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
            
            {/* Media Type Toggle */}
            <div className="space-y-2">
               <label className="text-xs font-semibold text-muted-foreground">Campaign Media (Optional)</label>
               <div className="flex p-1 bg-muted/30 border border-border rounded-lg max-w-sm">
                 <button
                   type="button"
                   onClick={() => setMediaType('image')}
                   className={`flex-1 py-1.5 text-xs font-bold rounded-md flex items-center justify-center transition-all ${mediaType === 'image' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted/50'}`}
                 >
                   <ImageIcon className="w-3.5 h-3.5 mr-1.5" /> Image
                 </button>
                 <button
                   type="button"
                   onClick={() => setMediaType('video')}
                   className={`flex-1 py-1.5 text-xs font-bold rounded-md flex items-center justify-center transition-all ${mediaType === 'video' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted/50'}`}
                 >
                   <VideoIcon className="w-3.5 h-3.5 mr-1.5" /> Upload Video
                 </button>
                 <button
                   type="button"
                   onClick={() => setMediaType('youtube')}
                   className={`flex-1 py-1.5 text-xs font-bold rounded-md flex items-center justify-center transition-all ${mediaType === 'youtube' ? 'bg-[#FF0000] text-white shadow-sm' : 'text-muted-foreground hover:bg-muted/50'}`}
                 >
                   <YoutubeIcon className="w-3.5 h-3.5 mr-1.5" /> YouTube
                 </button>
               </div>
            </div>

            {/* Media Upload Area */}
            <div className="space-y-1.5">
              {mediaType === 'youtube' ? (
                <div className="space-y-3">
                  <Input
                    label="YouTube URL"
                    value={formData.youtubeUrl}
                    onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                  {formData.youtubeUrl && (
                    <div className="relative w-full h-40 rounded-lg overflow-hidden border border-border">
                      {getYouTubeEmbedUrl(formData.youtubeUrl) ? (
                        <iframe 
                          src={getYouTubeEmbedUrl(formData.youtubeUrl)!}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                          allowFullScreen
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <p className="text-xs text-muted-foreground">Preview not available (invalid URL)</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="border-2 border-dashed border-border rounded-xl p-4 flex flex-col items-center justify-center bg-muted/20 relative group hover:bg-muted/40 transition-colors">
                  {uploadFile ? (
                    <div className="text-center">
                      {mediaType === 'image' ? <ImageIcon className="h-8 w-8 text-primary mx-auto mb-2" /> : <VideoIcon className="h-8 w-8 text-primary mx-auto mb-2" />}
                      <p className="text-xs font-bold text-foreground">{uploadFile.name}</p>
                      <p className="text-xxs text-muted-foreground">Ready to upload</p>
                    </div>
                  ) : mediaType === 'image' && formData.image ? (
                    <div className="relative w-full h-32 rounded-lg overflow-hidden">
                      <img src={formData.image} className="w-full h-full object-cover" alt="Preview" />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white text-xs font-bold">Change Image</span>
                      </div>
                    </div>
                  ) : mediaType === 'video' && formData.video && !formData.video.includes('youtube') ? (
                     <div className="relative w-full h-32 rounded-lg overflow-hidden bg-black flex justify-center">
                      <video src={formData.video} className="h-full" controls />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <span className="text-white text-xs font-bold">Change Video</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      {mediaType === 'image' ? (
                        <ImageIcon className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                      ) : (
                        <VideoIcon className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                      )}
                      <p className="text-sm font-semibold text-foreground">Click to select {mediaType}</p>
                      <p className="text-xs text-muted-foreground">
                        {mediaType === 'image' ? 'Recommended ratio 16:9' : 'MP4 or WebM format'}
                      </p>
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept={mediaType === 'image' ? "image/*" : "video/*"}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileChange}
                  />
                </div>
              )}
              {uploadError && (
                <div className="flex items-center text-destructive text-xs font-semibold mt-1">
                  <AlertCircle className="w-3.5 h-3.5 mr-1" /> {uploadError}
                </div>
              )}
            </div>

            <Input
              label="Campaign Title *"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="e.g., Winter Kit Drive"
            />
            
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={3}
                placeholder="Describe the campaign purpose..."
                className="flex w-full rounded-lg border border-border bg-input/50 px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., UNIFORM"
              />
              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Target Amount (₹) *"
                type="number"
                value={formData.targetAmount}
                onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                required
                min={0}
              />
              <Input
                label="Raised Amount (₹)"
                type="number"
                value={formData.raisedAmount}
                onChange={(e) => setFormData({ ...formData, raisedAmount: e.target.value })}
                min={0}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Supporters Count"
                type="number"
                value={formData.supportersCount}
                onChange={(e) => setFormData({ ...formData, supportersCount: e.target.value })}
                min={0}
              />
              <Input
                label="End Date"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>

            <div className="pt-2">
              <Button 
                type="submit" 
                className="w-full font-bold h-10" 
                isLoading={isUploading || createMutation.isPending || updateMutation.isPending}
              >
                {isUploading ? 'Uploading Media...' : editingId ? 'Save Changes' : 'Create Campaign'}
              </Button>
            </div>
          </form>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
