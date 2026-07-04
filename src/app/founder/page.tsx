'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Quote, 
  Edit2, 
  Trash2, 
  Plus, 
  AlertCircle, 
  CheckCircle2,
  Image as ImageIcon 
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { founderService, mediaService } from '@/services';
import type { FounderData } from '@/services/types';

export default function FounderPage() {
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<FounderData>({
    name: '',
    role: '',
    organization: '',
    quote: '',
    message: '',
    photoUrl: '',
    verifiedStatus: 'Active Trustee Registry',
  });

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['founder'],
    queryFn: () => founderService.get().then((r) => r.data),
  });

  const founderData: FounderData | null = data?.name || data?.id ? data : null;

  // Mutations
  const saveMutation = useMutation({
    mutationFn: (payload: any) => {
      // If there's an existing record, update it. If not, create it.
      if (founderData?.id || founderData?.name) {
        return founderService.update(payload);
      }
      return founderService.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['founder'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => founderService.delete(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['founder'] });
    },
  });

  const closeModal = () => {
    setIsModalOpen(false);
    setUploadFile(null);
    setUploadError('');
  };

  const openEditModal = () => {
    if (founderData) {
      setFormData({
        name: founderData.name || '',
        role: founderData.role || '',
        organization: founderData.organization || '',
        quote: founderData.quote || '',
        message: founderData.message || '',
        photoUrl: founderData.photoUrl || '',
        verifiedStatus: founderData.verifiedStatus || 'Active Trustee Registry',
      });
    } else {
      setFormData({
        name: '',
        role: '',
        organization: '',
        quote: '',
        message: '',
        photoUrl: '',
        verifiedStatus: 'Active Trustee Registry',
      });
    }
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
    if (!uploadFile) return formData.photoUrl || null;
    
    setIsUploading(true);
    setUploadError('');
    try {
      const presignRes = await mediaService.generatePresignedUrls({
        folder: 'founder',
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
    
    let finalImageUrl = formData.photoUrl;
    
    if (uploadFile) {
      const uploadedUrl = await performUpload();
      if (!uploadedUrl) return; 
      finalImageUrl = uploadedUrl;
    }

    const payload = { 
      ...formData, 
      photoUrl: finalImageUrl,
    };

    saveMutation.mutate(payload);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-full pb-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center">
              <Quote className="w-6 h-6 mr-2 text-primary" />
              Founder Corner Message
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Manage the message from the Founder displayed on the public website.
            </p>
          </div>
          {!isLoading && !error && !founderData && (
            <Button onClick={openEditModal} className="h-9 font-bold text-xs">
              <Plus className="mr-1.5 h-4 w-4" />
              Create Message
            </Button>
          )}
        </div>

        {/* Content Area */}
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : error ? (
          <Card className="flex flex-col items-center justify-center h-64 border-dashed border-2 border-destructive/50">
            <AlertCircle className="h-12 w-12 text-destructive mb-3" />
            <h3 className="text-lg font-bold text-foreground">Failed to Load Data</h3>
            <p className="text-sm text-muted-foreground mb-4">There was an error connecting to the server.</p>
          </Card>
        ) : !founderData ? (
          <Card className="flex flex-col items-center justify-center h-64 border-dashed border-2 bg-muted/20">
            <Quote className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <h3 className="text-lg font-bold text-foreground">No Message Set</h3>
            <p className="text-sm text-muted-foreground mb-4">You haven't set up the Founder's message yet.</p>
            <Button onClick={openEditModal} variant="outline" size="sm">Set Message Now</Button>
          </Card>
        ) : (
          <Card className="overflow-hidden border border-border/60 shadow-lg relative max-w-4xl">
            {/* Actions overlay */}
            <div className="absolute top-4 right-4 flex space-x-3 z-10">
              <Button size="sm" variant="secondary" className="shadow-md bg-white/80 backdrop-blur font-bold text-foreground" onClick={openEditModal}>
                <Edit2 className="w-4 h-4 mr-1.5" /> Edit
              </Button>
              <Button size="sm" variant="destructive" className="shadow-md font-bold" onClick={() => {
                if (confirm('Permanently delete the founder message?')) deleteMutation.mutate();
              }}>
                <Trash2 className="w-4 h-4 mr-1.5" /> Delete
              </Button>
            </div>
            
            <div className="flex flex-col md:flex-row">
              {/* Photo Area */}
              <div className="md:w-1/3 bg-muted relative h-64 md:h-auto overflow-hidden">
                {founderData.photoUrl ? (
                  <img 
                    src={founderData.photoUrl} 
                    alt={founderData.name || 'Founder'} 
                    className="w-full h-full object-cover object-top"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                    <ImageIcon className="w-16 h-16 text-primary/30" />
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <h3 className="text-white font-extrabold text-xl leading-tight">
                    {founderData.name}
                  </h3>
                  <p className="text-primary-foreground/80 text-xs font-semibold mt-0.5">
                    {founderData.role}
                  </p>
                </div>
              </div>
              
              {/* Content Area */}
              <div className="md:w-2/3 p-6 md:p-8 flex flex-col justify-center bg-card">
                <div className="mb-4">
                  <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5 font-semibold text-xs tracking-wider uppercase mb-3">
                    {founderData.organization || 'KSW Trust India'}
                  </Badge>
                  
                  {founderData.verifiedStatus && (
                    <Badge variant="secondary" className="ml-2 bg-emerald-500/15 text-emerald-600 border-none font-bold">
                      <CheckCircle2 className="w-3 h-3 mr-1 inline" />
                      {founderData.verifiedStatus}
                    </Badge>
                  )}
                </div>

                <div className="relative">
                  <Quote className="absolute -top-3 -left-3 w-10 h-10 text-primary/10 -z-10 transform rotate-180" />
                  <h2 className="text-xl md:text-2xl font-black text-foreground italic leading-snug mb-4">
                    "{founderData.quote}"
                  </h2>
                </div>
                
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {founderData.message}
                </p>

                {founderData.updated_at && (
                  <p className="text-xs text-muted-foreground/60 mt-6 font-semibold">
                    Last updated: {new Date(founderData.updated_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Create/Edit Modal */}
        <Dialog isOpen={isModalOpen} onClose={closeModal} title={founderData ? 'Edit Founder Message' : 'Create Founder Message'}>
          <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
            
            {/* Image Upload */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Founder Photo</label>
              <div className="border-2 border-dashed border-border rounded-xl p-4 flex flex-col items-center justify-center bg-muted/20 relative group hover:bg-muted/40 transition-colors">
                {uploadFile ? (
                  <div className="text-center">
                    <ImageIcon className="h-8 w-8 text-primary mx-auto mb-2" />
                    <p className="text-xs font-bold text-foreground">{uploadFile.name}</p>
                    <p className="text-xxs text-muted-foreground">Ready to upload</p>
                  </div>
                ) : formData.photoUrl ? (
                  <div className="relative w-full h-32 rounded-lg overflow-hidden">
                    <img src={formData.photoUrl} className="w-full h-full object-cover object-top" alt="Preview" />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white text-xs font-bold">Change Image</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <ImageIcon className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-foreground">Click to select photo</p>
                    <p className="text-xs text-muted-foreground">Professional headshot recommended</p>
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

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Founder Name *"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g., Pradeep Joshi"
              />
              <Input
                label="Role *"
                value={formData.role || ''}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                required
                placeholder="e.g., Founder & Lead Trustee"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Organization"
                value={formData.organization || ''}
                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                placeholder="e.g., KSW Trust India"
              />
              <Input
                label="Verified Status"
                value={formData.verifiedStatus || ''}
                onChange={(e) => setFormData({ ...formData, verifiedStatus: e.target.value })}
                placeholder="e.g., Active Trustee Registry"
              />
            </div>
            
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Highlight Quote *</label>
              <textarea
                value={formData.quote}
                onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                required
                rows={2}
                placeholder="e.g., Education is the only exit from generational poverty"
                className="flex w-full rounded-lg border border-border bg-input/50 px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200 font-medium italic"
              />
            </div>

            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Full Message *</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
                rows={5}
                placeholder="The main message body..."
                className="flex w-full rounded-lg border border-border bg-input/50 px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200"
              />
            </div>

            <div className="pt-2">
              <Button 
                type="submit" 
                className="w-full font-bold h-10" 
                isLoading={isUploading || saveMutation.isPending}
              >
                {isUploading ? 'Uploading Photo...' : (founderData ? 'Save Changes' : 'Create Message')}
              </Button>
            </div>
          </form>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
