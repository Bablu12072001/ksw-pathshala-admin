'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, User as UserIcon, CheckCircle2, ShieldAlert, AlertCircle, UploadCloud } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { membersService, mediaService } from '@/services';
import type { BoardMember } from '@/services/types';

export default function MembersPage() {
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    photoUrl: '',
    orderIndex: 1,
    isVerified: true,
  });

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Fetch Members
  const { data, isLoading } = useQuery({
    queryKey: ['members'],
    queryFn: () => membersService.getAll().then(r => r.data),
  });

  const membersList: BoardMember[] = Array.isArray(data) ? data : (data?.members || data?.items || []);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: any) => membersService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => membersService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => membersService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: '', role: '', photoUrl: '', orderIndex: 1, isVerified: true });
    setUploadFile(null);
    setUploadError('');
  };

  const openEditModal = (member: BoardMember) => {
    setEditingId(member.id);
    setFormData({
      name: member.name,
      role: member.role,
      photoUrl: member.photoUrl || '',
      orderIndex: member.orderIndex,
      isVerified: member.isVerified,
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
    if (!uploadFile) return formData.photoUrl;
    
    setIsUploading(true);
    setUploadError('');
    try {
      // 1. Get Presigned URL
      const presignRes = await mediaService.generatePresignedUrls({
        folder: 'members',
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
    
    let finalImageUrl = formData.photoUrl;
    
    if (uploadFile) {
      const uploadedUrl = await performUpload();
      if (!uploadedUrl) return; 
      finalImageUrl = uploadedUrl;
    }

    if (!finalImageUrl) {
      setUploadError('A profile photo is required.');
      return;
    }

    const payload = { ...formData, photoUrl: finalImageUrl };

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
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Board Members</h1>
            <p className="text-xs text-muted-foreground">
              Manage the core team, advisory board, and key members visible on the website.
            </p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="h-9 font-bold text-xs">
            <Plus className="mr-1.5 h-4 w-4" />
            Add Member
          </Button>
        </div>

        {/* Content Grid */}
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : membersList.length === 0 ? (
          <Card className="flex flex-col items-center justify-center h-64 border-dashed border-2">
            <UserIcon className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <h3 className="text-lg font-bold text-foreground">No Members Found</h3>
            <p className="text-sm text-muted-foreground mb-4">You haven't added any board members yet.</p>
            <Button onClick={() => setIsModalOpen(true)} variant="outline" size="sm">Add First Member</Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {membersList.map((member) => (
              <Card key={member.id} className="relative overflow-hidden flex flex-col items-center group transition-all duration-300 hover:shadow-xl hover:border-primary/50 text-center p-6">
                
                {/* Badges */}
                <div className="absolute top-3 left-3">
                  <Badge variant="outline" className="bg-background/80 backdrop-blur text-xs font-semibold shadow-sm">
                    Ord: {member.orderIndex}
                  </Badge>
                </div>
                <div className="absolute top-3 right-3">
                  {member.isVerified ? (
                    <div className="flex items-center text-success bg-success/10 px-2 py-0.5 rounded text-xs font-bold shadow-sm">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Verified
                    </div>
                  ) : (
                    <div className="flex items-center text-muted-foreground bg-muted/20 px-2 py-0.5 rounded text-xs font-bold shadow-sm">
                      <ShieldAlert className="w-3.5 h-3.5 mr-1" /> Unverified
                    </div>
                  )}
                </div>

                {/* Profile Photo */}
                <div className="relative w-28 h-28 mt-4 mb-4 rounded-full overflow-hidden border-4 border-muted shadow-inner group-hover:border-primary/30 transition-colors">
                  {member.photoUrl ? (
                    <img
                      src={member.photoUrl}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <UserIcon className="w-10 h-10 text-muted-foreground/50" />
                    </div>
                  )}
                  {/* Hover Actions Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center space-y-2 backdrop-blur-sm">
                    <Button size="sm" variant="ghost" className="h-8 w-8 text-white hover:text-white hover:bg-white/20 p-0" onClick={() => openEditModal(member)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 text-red-300 hover:text-red-100 hover:bg-red-500/30 p-0" onClick={() => {
                      if (confirm(`Permanently delete ${member.name}?`)) deleteMutation.mutate(member.id);
                    }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Details */}
                <h3 className="text-lg font-bold text-foreground leading-tight">{member.name}</h3>
                <p className="text-xs font-medium text-primary mt-1">{member.role}</p>
                
              </Card>
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        <Dialog isOpen={isModalOpen} onClose={closeModal} title={editingId ? 'Edit Member' : 'Add Board Member'}>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Photo Upload Area */}
            <div className="space-y-1.5 flex flex-col items-center">
              <div className="relative w-28 h-28 rounded-full border-2 border-dashed border-border flex items-center justify-center bg-muted/20 group hover:bg-muted/40 transition-colors overflow-hidden">
                {uploadFile ? (
                  <div className="text-center w-full h-full flex flex-col items-center justify-center bg-background">
                    <UploadCloud className="h-6 w-6 text-primary mb-1" />
                    <p className="text-xxs font-bold text-foreground max-w-[80%] truncate">{uploadFile.name}</p>
                  </div>
                ) : formData.photoUrl ? (
                  <>
                    <img src={formData.photoUrl} className="w-full h-full object-cover" alt="Preview" />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white text-xs font-bold text-center px-2">Change Photo</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center">
                    <UserIcon className="h-8 w-8 text-muted-foreground/50 mx-auto mb-1" />
                    <p className="text-xxs font-semibold text-foreground">Upload</p>
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
              label="Full Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="e.g., Dr. Rajeev Kumar"
            />

            <Input
              label="Role / Title *"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              required
              placeholder="e.g., Advisory Board, Primary Coach"
            />
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Display Order *"
                type="number"
                value={formData.orderIndex}
                onChange={(e) => setFormData({ ...formData, orderIndex: Number(e.target.value) })}
                required
              />
              <div className="flex flex-col space-y-1.5 justify-end">
                <label className="text-xs font-semibold text-muted-foreground mb-2">Verification</label>
                <div className="flex items-center h-10 space-x-3">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                      checked={formData.isVerified}
                      onChange={(e) => setFormData({ ...formData, isVerified: e.target.checked })}
                    />
                    <span className="text-sm font-semibold">Verified Member</span>
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
                {isUploading ? 'Uploading Image...' : editingId ? 'Save Changes' : 'Add Member'}
              </Button>
            </div>
          </form>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
