'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Image as ImageIcon, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { slidersService, mediaService } from '@/services';
import type { Slider } from '@/services/types';

export default function SlidersPage() {
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    linkUrl: '',
    imageUrl: '',
    orderIndex: 1,
    isActive: true,
  });

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Fetch Sliders
  const { data, isLoading } = useQuery({
    queryKey: ['sliders'],
    queryFn: () => slidersService.getAll().then(r => r.data),
  });

  const slidersList: Slider[] = Array.isArray(data) ? data : (data?.sliders || data?.items || []);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: any) => slidersService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sliders'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => slidersService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sliders'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => slidersService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sliders'] });
    },
  });

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ title: '', description: '', linkUrl: '', imageUrl: '', orderIndex: 1, isActive: true });
    setUploadFile(null);
    setUploadError('');
  };

  const openEditModal = (slider: Slider) => {
    setEditingId(slider.id);
    setFormData({
      title: slider.title,
      description: slider.description || '',
      linkUrl: slider.linkUrl || '',
      imageUrl: slider.imageUrl,
      orderIndex: slider.orderIndex,
      isActive: slider.isActive,
    });
    setUploadFile(null);
    setUploadError('');
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadFile(e.target.files[0]);
      setUploadError('');
    }
  };

  const performUpload = async (): Promise<string | null> => {
    if (!uploadFile) return formData.imageUrl;
    
    setIsUploading(true);
    setUploadError('');
    try {
      // 1. Get Presigned URL
      const presignRes = await mediaService.generatePresignedUrls({
        folder: 'sliders',
        files: [{ filename: uploadFile.name, fileType: uploadFile.type }]
      });
      
      const fileData = presignRes.data?.files?.[0];
      if (!fileData || !fileData.uploadUrl) {
        throw new Error('Failed to retrieve upload URL');
      }

      // 2. Upload directly to S3
      const uploadRes = await fetch(fileData.uploadUrl, {
        method: 'PUT',
        body: uploadFile,
        headers: {
          'Content-Type': uploadFile.type,
        },
      });

      if (!uploadRes.ok) {
        throw new Error('Failed to upload image to S3');
      }

      return fileData.imageUrl;
    } catch (err: any) {
      console.error('Upload error:', err);
      setUploadError(err.message || 'Image upload failed.');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalImageUrl = formData.imageUrl;
    
    // If a new file is selected, upload it first
    if (uploadFile) {
      const uploadedUrl = await performUpload();
      if (!uploadedUrl) return; // Stop if upload failed
      finalImageUrl = uploadedUrl;
    }

    if (!finalImageUrl) {
      setUploadError('An image is required.');
      return;
    }

    const payload = { ...formData, imageUrl: finalImageUrl };

    if (editingId) {
      updateMutation.mutate({ id: editingId, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-full pb-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Homepage Sliders</h1>
            <p className="text-xs text-muted-foreground">
              Manage the rotating image banners on the public website.
            </p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="h-9 font-bold text-xs">
            <Plus className="mr-1.5 h-4 w-4" />
            Add New Slider
          </Button>
        </div>

        {/* Content Grid */}
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : slidersList.length === 0 ? (
          <Card className="flex flex-col items-center justify-center h-64 border-dashed border-2">
            <ImageIcon className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <h3 className="text-lg font-bold text-foreground">No Sliders Found</h3>
            <p className="text-sm text-muted-foreground mb-4">You haven't added any homepage sliders yet.</p>
            <Button onClick={() => setIsModalOpen(true)} variant="outline" size="sm">Create First Slider</Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {slidersList.map((slider) => (
              <Card key={slider.id} className="overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-xl hover:border-primary/50">
                <div className="relative h-48 bg-muted w-full overflow-hidden">
                  <img
                    src={slider.imageUrl}
                    alt={slider.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-3 right-3 flex space-x-2">
                    <Badge className="bg-black/50 backdrop-blur-md text-white border-none shadow-sm">
                      Order: {slider.orderIndex}
                    </Badge>
                    <Badge variant={slider.isActive ? 'success' : 'outline'} className="shadow-sm backdrop-blur-md">
                      {slider.isActive ? 'Active' : 'Draft'}
                    </Badge>
                  </div>
                  {/* Hover Overlay Actions */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center space-x-4 backdrop-blur-[1px]">
                    <Button size="sm" variant="secondary" className="font-bold shadow-lg" onClick={() => openEditModal(slider)}>
                      <Edit2 className="w-4 h-4 mr-1.5" /> Edit
                    </Button>
                    <Button size="sm" variant="destructive" className="font-bold shadow-lg" onClick={() => {
                      if (confirm('Permanently delete this slider?')) deleteMutation.mutate(slider.id);
                    }}>
                      <Trash2 className="w-4 h-4 mr-1.5" /> Delete
                    </Button>
                  </div>
                </div>
                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="text-lg font-bold text-foreground line-clamp-1">{slider.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1 flex-grow">
                    {slider.description || 'No description provided.'}
                  </p>
                  {slider.linkUrl && (
                    <div className="mt-3 flex items-center text-xs font-semibold text-primary">
                      <LinkIcon className="w-3.5 h-3.5 mr-1" />
                      <span className="truncate">{slider.linkUrl}</span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        <Dialog isOpen={isModalOpen} onClose={closeModal} title={editingId ? 'Edit Slider' : 'Create New Slider'}>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Image Upload Area */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Slider Image *</label>
              <div className="border-2 border-dashed border-border rounded-xl p-4 flex flex-col items-center justify-center bg-muted/20 relative group hover:bg-muted/40 transition-colors">
                {uploadFile ? (
                  <div className="text-center">
                    <ImageIcon className="h-8 w-8 text-primary mx-auto mb-2" />
                    <p className="text-xs font-bold text-foreground">{uploadFile.name}</p>
                    <p className="text-xxs text-muted-foreground">Ready to upload</p>
                  </div>
                ) : formData.imageUrl ? (
                  <div className="relative w-full h-32 rounded-lg overflow-hidden">
                    <img src={formData.imageUrl} className="w-full h-full object-cover" alt="Preview" />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white text-xs font-bold">Change Image</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <ImageIcon className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-foreground">Click to select image</p>
                    <p className="text-xs text-muted-foreground">High resolution landscape recommended</p>
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleFileChange}
                />
              </div>
              {uploadError && (
                <div className="flex items-center text-destructive text-xs font-semibold mt-1">
                  <AlertCircle className="w-3.5 h-3.5 mr-1" /> {uploadError}
                </div>
              )}
            </div>

            <Input
              label="Title *"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="e.g., Welcome to KSW Pathshala"
            />
            
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                placeholder="Short subtitle for the banner..."
                className="flex w-full rounded-lg border border-border bg-input/50 px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200"
              />
            </div>

            <Input
              label="Button Link URL"
              value={formData.linkUrl}
              onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
              placeholder="e.g., /about-us or https://google.com"
            />
            
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

            <div className="pt-2">
              <Button 
                type="submit" 
                className="w-full font-bold h-10" 
                isLoading={isUploading || createMutation.isPending || updateMutation.isPending}
              >
                {isUploading ? 'Uploading Image...' : editingId ? 'Save Changes' : 'Create Slider'}
              </Button>
            </div>
          </form>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
