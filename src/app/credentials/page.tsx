'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Shield, 
  Edit2, 
  Trash2, 
  Plus, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { credentialsService } from '@/services';

export interface TrustCredential {
  id: string;
  title: string;
  description: string;
  icon: string;
  verifiedStatus: string;
  created_at?: string;
  updated_at?: string;
}

export default function CredentialsPage() {
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    description: '',
    icon: '🛡️',
    verifiedStatus: '',
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['credentials'],
    queryFn: () => credentialsService.getAll().then((r) => r.data),
  });

  const credentialsList: TrustCredential[] = Array.isArray(data) ? data : data?.items || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: any) => credentialsService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credentials'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => credentialsService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credentials'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => credentialsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credentials'] });
    },
  });

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ 
      id: '',
      title: '', 
      description: '', 
      icon: '🛡️',
      verifiedStatus: '',
    });
  };

  const openEditModal = (cred: TrustCredential) => {
    setEditingId(cred.id);
    setFormData({
      id: cred.id || '',
      title: cred.title || '',
      description: cred.description || '',
      icon: cred.icon || '🛡️',
      verifiedStatus: cred.verifiedStatus || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, payload: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-full pb-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center">
              <Shield className="w-6 h-6 mr-2 text-primary" />
              Trust Credentials
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Manage certifications, registrations, and trust markers for the organization.
            </p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="h-9 font-bold text-xs">
            <Plus className="mr-1.5 h-4 w-4" />
            Add Credential
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
            <h3 className="text-lg font-bold text-foreground">Failed to Load Credentials</h3>
            <p className="text-sm text-muted-foreground mb-4">There was an error connecting to the server.</p>
          </Card>
        ) : credentialsList.length === 0 ? (
          <Card className="flex flex-col items-center justify-center h-64 border-dashed border-2">
            <Shield className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <h3 className="text-lg font-bold text-foreground">No Credentials Found</h3>
            <p className="text-sm text-muted-foreground mb-4">You haven't added any trust credentials yet.</p>
            <Button onClick={() => setIsModalOpen(true)} variant="outline" size="sm">Create First Credential</Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {credentialsList.map((cred) => (
              <Card key={cred.id} className="relative overflow-hidden group border border-border hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-lg bg-card">
                
                {/* Hover Action Overlay */}
                <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <Button size="icon" variant="secondary" className="h-7 w-7 rounded-full shadow-sm" onClick={() => openEditModal(cred)}>
                    <Edit2 className="h-3.5 w-3.5 text-foreground" />
                  </Button>
                  <Button size="icon" variant="destructive" className="h-7 w-7 rounded-full shadow-sm" onClick={() => {
                    if (confirm('Are you sure you want to delete this credential?')) {
                      deleteMutation.mutate(cred.id);
                    }
                  }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="p-6 flex flex-col items-center text-center">
                  <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    {cred.icon || '🛡️'}
                  </div>
                  
                  <h3 className="text-lg font-extrabold text-foreground mb-1 leading-tight">{cred.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4 leading-snug line-clamp-2">
                    {cred.description}
                  </p>

                  <div className="mt-auto w-full pt-4 border-t border-border/50">
                    <div className="flex items-center justify-center text-xs font-bold text-emerald-600 bg-emerald-500/10 py-1.5 px-3 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                      {cred.verifiedStatus}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        <Dialog isOpen={isModalOpen} onClose={closeModal} title={editingId ? 'Edit Trust Credential' : 'Create Trust Credential'}>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="flex gap-4 items-end">
              <div className="w-20">
                <Input
                  label="Icon"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="🛡️"
                  className="text-center text-2xl"
                  required
                />
              </div>
              <div className="flex-1">
                <Input
                  label="Unique ID *"
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  placeholder="e.g., fcra_2025"
                  required
                  disabled={!!editingId}
                />
              </div>
            </div>

            <Input
              label="Title *"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="e.g., FCRA Status"
            />
            
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={2}
                placeholder="Brief details about the credential..."
                className="flex w-full rounded-lg border border-border bg-input/50 px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200"
              />
            </div>

            <Input
              label="Verified Status *"
              value={formData.verifiedStatus}
              onChange={(e) => setFormData({ ...formData, verifiedStatus: e.target.value })}
              required
              placeholder="e.g., Active CSR000159482"
            />

            <div className="pt-2">
              <Button 
                type="submit" 
                className="w-full font-bold h-10" 
                isLoading={createMutation.isPending || updateMutation.isPending}
              >
                {editingId ? 'Save Changes' : 'Create Credential'}
              </Button>
            </div>
          </form>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
