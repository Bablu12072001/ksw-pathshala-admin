'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Building2, 
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
import { partnersService, mediaService } from '@/services';
import type { Partner } from '@/services/types';

export default function PartnersPage() {
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<Partner>>({
    name: '',
    subtitle: '',
    color: 'from-blue-500/10 to-indigo-500/5',
    bgAccent: 'bg-blue-500/10',
    isActive: true,
    orderIndex: 1,
    // Add missing property for upload state
    logoUrl: undefined,
  } as any);

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['partners'],
    queryFn: () => partnersService.getAll().then((r) => r.data),
  });

  const partnersList: (Partner & { logoUrl?: string })[] = Array.isArray(data) ? data : data?.items || [];

  const createMutation = useMutation({
    mutationFn: (payload: any) => partnersService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => partnersService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => partnersService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] });
    },
  });

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setUploadFile(null);
    setFormData({ 
      name: '', subtitle: '', color: 'from-blue-500/10 to-indigo-500/5', bgAccent: 'bg-blue-500/10', isActive: true, orderIndex: 1 
    });
  };

  const openEditModal = (partner: any) => {
    setEditingId(partner.id);
    setFormData({
      name: partner.name || '',
      subtitle: partner.subtitle || '',
      color: partner.color || '',
      bgAccent: partner.bgAccent || '',
      isActive: partner.isActive,
      orderIndex: partner.orderIndex || 1,
      logoUrl: partner.logoUrl || '',
    });
    setUploadFile(null);
    setIsModalOpen(true);
  };

  const performUpload = async (): Promise<string | null> => {
    if (!uploadFile) return (formData as any).logoUrl || null;
    setIsUploading(true);
    try {
      const presignRes = await mediaService.generatePresignedUrls({
        folder: 'partners',
        files: [{ filename: uploadFile.name, fileType: uploadFile.type }]
      });
      const fileData = presignRes.data?.files?.[0];
      if (!fileData) throw new Error('Failed to get upload URL');

      await fetch(fileData.uploadUrl, { method: 'PUT', body: uploadFile, headers: { 'Content-Type': uploadFile.type }});
      return fileData.imageUrl;
    } catch (err) {
      console.error(err);
      alert('Logo upload failed.');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalLogoUrl = (formData as any).logoUrl;
    if (uploadFile) {
      const uploadedUrl = await performUpload();
      if (uploadedUrl) finalLogoUrl = uploadedUrl;
    }
    const payload = { ...formData, logoUrl: finalLogoUrl };

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
              <Building2 className="w-6 h-6 mr-2 text-primary" />
              Corporate Partners
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Manage CSR sponsors, foundation partners, and tech affiliates.
            </p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="h-9 font-bold text-xs">
            <Plus className="mr-1.5 h-4 w-4" />
            Add Partner
          </Button>
        </div>

        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : error ? (
          <Card className="flex flex-col items-center justify-center h-64 border-dashed border-2 border-destructive/50">
            <AlertCircle className="h-12 w-12 text-destructive mb-3" />
            <h3 className="text-lg font-bold text-foreground">Failed to Load Partners</h3>
          </Card>
        ) : partnersList.length === 0 ? (
          <Card className="flex flex-col items-center justify-center h-64 border-dashed border-2 bg-muted/20">
            <Building2 className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <h3 className="text-lg font-bold text-foreground">No Partners Found</h3>
            <Button onClick={() => setIsModalOpen(true)} variant="outline" size="sm" className="mt-4">Add First Partner</Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {partnersList.sort((a, b) => a.orderIndex - b.orderIndex).map((partner) => (
              <Card key={partner.id} className={`relative overflow-hidden group border border-border/60 hover:shadow-lg transition-all duration-300 bg-gradient-to-br ${partner.color || 'from-background to-muted'}`}>
                <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <Button size="icon" variant="secondary" className="h-7 w-7 rounded-full shadow-sm bg-background/80 backdrop-blur" onClick={() => openEditModal(partner)}>
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="destructive" className="h-7 w-7 rounded-full shadow-sm" onClick={() => {
                    if (confirm('Delete this partner?')) deleteMutation.mutate(partner.id);
                  }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                
                <div className="p-6 flex flex-col items-center text-center">
                  <div className={`w-16 h-16 rounded-xl flex items-center justify-center mb-4 shadow-sm ${partner.bgAccent || 'bg-primary/10'}`}>
                    {partner.logoUrl ? (
                      <img src={partner.logoUrl} alt={partner.name} className="w-10 h-10 object-contain" />
                    ) : (
                      <Building2 className="w-8 h-8 text-foreground/70" />
                    )}
                  </div>
                  <h3 className="font-extrabold text-lg text-foreground mb-1 leading-tight">{partner.name}</h3>
                  <p className="text-xs font-semibold text-muted-foreground">{partner.subtitle}</p>
                </div>

                <div className="px-4 pb-4 flex justify-between items-center bg-background/40 border-t border-border/40 pt-3">
                  <Badge variant="outline" className="text-xs bg-background/50">Ord: {partner.orderIndex}</Badge>
                  {partner.isActive ? (
                    <Badge className="bg-emerald-500/20 text-emerald-700 border-none hover:bg-emerald-500/30 font-bold text-[10px]">
                      <CheckCircle2 className="w-3 h-3 mr-1 inline" /> Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px] font-bold">
                      <XCircle className="w-3 h-3 mr-1 inline" /> Inactive
                    </Badge>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        <Dialog isOpen={isModalOpen} onClose={closeModal} title={editingId ? 'Edit Partner' : 'Add Partner'}>
          <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            <div className="flex items-center space-x-4 mb-2">
              <div className="w-20 h-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-muted/20 relative overflow-hidden group">
                {uploadFile ? (
                  <img src={URL.createObjectURL(uploadFile)} className="w-12 h-12 object-contain" alt="Logo" />
                ) : (formData as any).logoUrl ? (
                  <img src={(formData as any).logoUrl} className="w-12 h-12 object-contain" alt="Logo" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-muted-foreground/40" />
                )}
                <input type="file" accept="image/*" onChange={(e) => { if(e.target.files) setUploadFile(e.target.files[0]) }} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-foreground mb-1">Partner Logo</p>
                <p className="text-xs text-muted-foreground">Transparent PNG recommended.</p>
              </div>
            </div>

            <Input label="Partner Name *" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required placeholder="e.g. Mehta Foundation" />
            <Input label="Subtitle *" value={formData.subtitle} onChange={(e) => setFormData({...formData, subtitle: e.target.value})} required placeholder="e.g. Education & Growth" />
            
            <div className="grid grid-cols-2 gap-4">
              <Input label="Gradient Tailwinds" value={formData.color} onChange={(e) => setFormData({...formData, color: e.target.value})} placeholder="from-emerald-500/10 to-teal-500/5" />
              <Input label="Bg Accent Tailwind" value={formData.bgAccent} onChange={(e) => setFormData({...formData, bgAccent: e.target.value})} placeholder="bg-emerald-500/10" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input label="Order Index" type="number" value={formData.orderIndex?.toString()} onChange={(e) => setFormData({...formData, orderIndex: Number(e.target.value)})} required />
              <div className="flex flex-col space-y-1.5 justify-end">
                <label className="flex items-center space-x-2 text-sm font-semibold cursor-pointer py-2">
                  <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({...formData, isActive: e.target.checked})} className="rounded border-gray-300 text-primary shadow-sm focus:border-primary/50 focus:ring focus:ring-primary/20 focus:ring-opacity-50" />
                  <span>Active on Site</span>
                </label>
              </div>
            </div>

            <Button type="submit" className="w-full font-bold h-10 mt-2" isLoading={isUploading || createMutation.isPending || updateMutation.isPending}>
              {isUploading ? 'Uploading...' : editingId ? 'Save Changes' : 'Add Partner'}
            </Button>
          </form>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
