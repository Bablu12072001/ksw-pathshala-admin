'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  IndianRupee, 
  Edit2, 
  Trash2, 
  Plus, 
  AlertCircle
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { classPlansService } from '@/services';
import type { ClassPlan } from '@/services/types';

export default function ClassPlansPage() {
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<ClassPlan>>({
    classKey: '',
    monthlyAmount: 0,
    annualAmount: 0,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['class-plans'],
    queryFn: () => classPlansService.getAll().then((r) => r.data),
  });

  const plansList: ClassPlan[] = Array.isArray(data) ? data : data?.items || [];

  const createMutation = useMutation({
    mutationFn: (payload: any) => classPlansService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-plans'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => classPlansService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-plans'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => classPlansService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-plans'] });
    },
  });

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ 
      classKey: '', monthlyAmount: 0, annualAmount: 0
    });
  };

  const openEditModal = (plan: ClassPlan) => {
    setEditingId(plan.id);
    setFormData({
      classKey: plan.classKey || '',
      monthlyAmount: plan.monthlyAmount || 0,
      annualAmount: plan.annualAmount || 0,
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

  // Helper to parse class order
  const getOrder = (key: string) => {
    if (!key) return 999;
    const lkey = key.toLowerCase();
    if (lkey === 'nursery') return 0;
    if (lkey === 'lkg') return 1;
    if (lkey === 'ukg') return 2;
    const match = lkey.match(/\d+/);
    if (match) return parseInt(match[0]) + 2;
    return 999;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-full pb-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center">
              <IndianRupee className="w-6 h-6 mr-2 text-primary" />
              Class Pricing Plans
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Manage the monthly and annual tuition rates for different grades.
            </p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="h-9 font-bold text-xs">
            <Plus className="mr-1.5 h-4 w-4" />
            Add Plan
          </Button>
        </div>

        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : error ? (
          <Card className="flex flex-col items-center justify-center h-64 border-dashed border-2 border-destructive/50">
            <AlertCircle className="h-12 w-12 text-destructive mb-3" />
            <h3 className="text-lg font-bold text-foreground">Failed to Load Pricing Plans</h3>
          </Card>
        ) : plansList.length === 0 ? (
          <Card className="flex flex-col items-center justify-center h-64 border-dashed border-2 bg-muted/20">
            <IndianRupee className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <h3 className="text-lg font-bold text-foreground">No Plans Found</h3>
            <Button onClick={() => setIsModalOpen(true)} variant="outline" size="sm" className="mt-4">Create First Plan</Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {plansList.sort((a, b) => getOrder(a.classKey) - getOrder(b.classKey)).map((plan) => (
              <Card key={plan.id} className="relative overflow-hidden group border border-border/60 hover:border-primary/50 hover:shadow-lg transition-all duration-300">
                <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <Button size="icon" variant="secondary" className="h-7 w-7 rounded-full shadow-sm bg-background/80 backdrop-blur" onClick={() => openEditModal(plan)}>
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="destructive" className="h-7 w-7 rounded-full shadow-sm" onClick={() => {
                    if (confirm('Delete this plan?')) deleteMutation.mutate(plan.id);
                  }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                
                <div className="p-5 flex flex-col text-center">
                  <Badge variant="outline" className="self-center mb-4 text-xs font-bold uppercase tracking-widest text-primary border-primary/30 bg-primary/5 px-4 py-1">
                    {plan.classKey}
                  </Badge>

                  <div className="space-y-4">
                    <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Monthly</p>
                      <p className="text-2xl font-black text-foreground flex items-center justify-center">
                        <IndianRupee className="w-5 h-5 mr-1" />
                        {plan.monthlyAmount}
                      </p>
                    </div>
                    
                    <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Annual</p>
                      <p className="text-2xl font-black text-foreground flex items-center justify-center">
                        <IndianRupee className="w-5 h-5 mr-1" />
                        {plan.annualAmount}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <Dialog isOpen={isModalOpen} onClose={closeModal} title={editingId ? 'Edit Plan' : 'Add Plan'}>
          <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            <Input label="Class Name *" value={formData.classKey} onChange={(e) => setFormData({...formData, classKey: e.target.value})} required placeholder="e.g. Nursery, Class 1" disabled={!!editingId} />
            
            <div className="grid grid-cols-2 gap-4">
              <Input label="Monthly Amount (₹) *" type="number" min={0} value={formData.monthlyAmount ?? ''} onChange={(e) => setFormData({...formData, monthlyAmount: e.target.value ? Number(e.target.value) : undefined})} required />
              <Input label="Annual Amount (₹) *" type="number" min={0} value={formData.annualAmount ?? ''} onChange={(e) => setFormData({...formData, annualAmount: e.target.value ? Number(e.target.value) : undefined})} required />
            </div>

            <Button type="submit" className="w-full font-bold h-10 mt-2" isLoading={createMutation.isPending || updateMutation.isPending}>
              {editingId ? 'Save Changes' : 'Create Plan'}
            </Button>
          </form>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
