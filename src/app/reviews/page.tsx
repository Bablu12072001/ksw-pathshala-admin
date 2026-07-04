'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Star, 
  Edit2, 
  Trash2, 
  Plus, 
  AlertCircle,
  Image as ImageIcon,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { reviewsService, mediaService } from '@/services';
import type { Review } from '@/services/types';

export default function ReviewsPage() {
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<Review>>({
    name: '',
    role: '',
    text: '',
    avatar: '',
    rating: 5,
    isApproved: true,
    orderIndex: 1,
  });

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['reviews'],
    queryFn: () => reviewsService.getAll().then((r) => r.data),
  });

  const reviewsList: Review[] = Array.isArray(data) ? data : data?.items || [];

  const createMutation = useMutation({
    mutationFn: (payload: any) => reviewsService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => reviewsService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => reviewsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setUploadFile(null);
    setFormData({ 
      name: '', role: '', text: '', avatar: '', rating: 5, isApproved: true, orderIndex: 1 
    });
  };

  const openEditModal = (review: Review) => {
    setEditingId(review.id);
    setFormData({
      name: review.name || '',
      role: review.role || '',
      text: review.text || '',
      avatar: review.avatar || '',
      rating: review.rating || 5,
      isApproved: review.isApproved,
      orderIndex: review.orderIndex || 1,
    });
    setUploadFile(null);
    setIsModalOpen(true);
  };

  const performUpload = async (): Promise<string | null> => {
    if (!uploadFile) return formData.avatar || null;
    setIsUploading(true);
    try {
      const presignRes = await mediaService.generatePresignedUrls({
        folder: 'reviews',
        files: [{ filename: uploadFile.name, fileType: uploadFile.type }]
      });
      const fileData = presignRes.data?.files?.[0];
      if (!fileData) throw new Error('Failed to get upload URL');

      await fetch(fileData.uploadUrl, { method: 'PUT', body: uploadFile, headers: { 'Content-Type': uploadFile.type }});
      return fileData.imageUrl;
    } catch (err) {
      console.error(err);
      alert('Avatar upload failed.');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalAvatarUrl = formData.avatar;
    if (uploadFile) {
      const uploadedUrl = await performUpload();
      if (uploadedUrl) finalAvatarUrl = uploadedUrl;
    }
    const payload = { ...formData, avatar: finalAvatarUrl };

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
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center">
              <Star className="w-6 h-6 mr-2 text-amber-500 fill-amber-500" />
              Sponsor / Volunteer Reviews
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Manage testimonials and reviews displayed on the public website.
            </p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="h-9 font-bold text-xs">
            <Plus className="mr-1.5 h-4 w-4" />
            Add Review
          </Button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : error ? (
          <Card className="flex flex-col items-center justify-center h-64 border-dashed border-2 border-destructive/50">
            <AlertCircle className="h-12 w-12 text-destructive mb-3" />
            <h3 className="text-lg font-bold text-foreground">Failed to Load Reviews</h3>
          </Card>
        ) : reviewsList.length === 0 ? (
          <Card className="flex flex-col items-center justify-center h-64 border-dashed border-2 bg-muted/20">
            <Star className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <h3 className="text-lg font-bold text-foreground">No Reviews Found</h3>
            <p className="text-sm text-muted-foreground mb-4">Add your first testimonial to showcase impact.</p>
            <Button onClick={() => setIsModalOpen(true)} variant="outline" size="sm">Add Review</Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviewsList.sort((a, b) => a.orderIndex - b.orderIndex).map((review) => (
              <Card key={review.id} className="relative overflow-hidden group border border-border/60 hover:border-amber-500/50 hover:shadow-lg transition-all duration-300">
                <div className="absolute top-3 right-3 flex space-x-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full shadow-md" onClick={() => openEditModal(review)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="destructive" className="h-8 w-8 rounded-full shadow-md" onClick={() => {
                    if (confirm('Delete this review?')) deleteMutation.mutate(review.id);
                  }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-4">
                      {review.avatar ? (
                        <img src={review.avatar} alt={review.name} className="w-12 h-12 rounded-full object-cover shadow-sm border border-border" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <ImageIcon className="w-5 h-5 text-primary/50" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-foreground leading-tight">{review.name}</h3>
                        <p className="text-xs text-muted-foreground font-medium">{review.role}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex mb-3 space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/30'}`} />
                    ))}
                  </div>

                  <p className="text-sm text-foreground/80 italic leading-relaxed line-clamp-4">
                    "{review.text}"
                  </p>

                  <div className="mt-5 flex items-center justify-between pt-4 border-t border-border/50">
                    <Badge variant="outline" className="text-xs text-muted-foreground">Order: {review.orderIndex}</Badge>
                    {review.isApproved ? (
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-none shadow-none font-bold">
                        <CheckCircle2 className="w-3 h-3 mr-1 inline" /> Approved
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-amber-600 font-bold">
                        <XCircle className="w-3 h-3 mr-1 inline" /> Draft / Hidden
                      </Badge>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Modal */}
        <Dialog isOpen={isModalOpen} onClose={closeModal} title={editingId ? 'Edit Review' : 'Add Review'}>
          <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 rounded-full border-2 border-dashed border-border flex items-center justify-center bg-muted/20 relative overflow-hidden group">
                {uploadFile ? (
                  <img src={URL.createObjectURL(uploadFile)} className="w-full h-full object-cover" alt="Avatar" />
                ) : formData.avatar ? (
                  <img src={formData.avatar} className="w-full h-full object-cover" alt="Avatar" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-muted-foreground/40" />
                )}
                <input type="file" accept="image/*" onChange={(e) => { if(e.target.files) setUploadFile(e.target.files[0]) }} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-foreground mb-1">Reviewer Avatar</p>
                <p className="text-xs text-muted-foreground">Click the circle to upload a photo.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input label="Name *" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required placeholder="e.g. Jane Doe" />
              <Input label="Role *" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} required placeholder="e.g. Volunteer" />
            </div>

            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Review Text *</label>
              <textarea value={formData.text} onChange={(e) => setFormData({...formData, text: e.target.value})} required rows={4} className="flex w-full rounded-lg border border-border bg-input/50 px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Input label="Rating (1-5) *" type="number" min={1} max={5} value={formData.rating?.toString()} onChange={(e) => setFormData({...formData, rating: Number(e.target.value)})} required />
              <Input label="Order Index" type="number" value={formData.orderIndex?.toString()} onChange={(e) => setFormData({...formData, orderIndex: Number(e.target.value)})} required />
              <div className="flex flex-col space-y-1.5 justify-end">
                <label className="flex items-center space-x-2 text-sm font-semibold cursor-pointer py-2">
                  <input type="checkbox" checked={formData.isApproved} onChange={(e) => setFormData({...formData, isApproved: e.target.checked})} className="rounded border-gray-300 text-primary shadow-sm focus:border-primary/50 focus:ring focus:ring-primary/20 focus:ring-opacity-50" />
                  <span>Approved for Public</span>
                </label>
              </div>
            </div>

            <Button type="submit" className="w-full font-bold h-10 mt-2" isLoading={isUploading || createMutation.isPending || updateMutation.isPending}>
              {isUploading ? 'Uploading...' : editingId ? 'Save Changes' : 'Add Review'}
            </Button>
          </form>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
