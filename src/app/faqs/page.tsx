'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  HelpCircle, 
  Edit2, 
  Trash2, 
  Plus, 
  AlertCircle,
  MessageCircleQuestion,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { faqsService } from '@/services';
import type { FAQ } from '@/services/types';

export default function FAQsPage() {
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<FAQ>>({
    question: '',
    answer: '',
    category: 'General',
    orderIndex: 1,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['faqs'],
    queryFn: () => faqsService.getAll().then((r) => r.data),
  });

  const faqsList: FAQ[] = Array.isArray(data) ? data : data?.items || [];
  
  // Group FAQs by Category
  const faqsByCategory = useMemo(() => {
    const grouped: Record<string, FAQ[]> = {};
    faqsList.forEach(faq => {
      const cat = faq.category || 'Uncategorized';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(faq);
    });
    
    // Sort items within each category by orderIndex
    Object.keys(grouped).forEach(cat => {
      grouped[cat].sort((a, b) => a.orderIndex - b.orderIndex);
    });
    return grouped;
  }, [faqsList]);

  const createMutation = useMutation({
    mutationFn: (payload: any) => faqsService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => faqsService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => faqsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
    },
  });

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ 
      question: '', answer: '', category: 'General', orderIndex: 1 
    });
  };

  const openEditModal = (faq: FAQ) => {
    setEditingId(faq.id);
    setFormData({
      question: faq.question || '',
      answer: faq.answer || '',
      category: faq.category || 'General',
      orderIndex: faq.orderIndex || 1,
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center">
              <HelpCircle className="w-6 h-6 mr-2 text-primary" />
              Frequently Asked Questions
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Manage the Q&A section shown to donors and volunteers.
            </p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="h-9 font-bold text-xs">
            <Plus className="mr-1.5 h-4 w-4" />
            Add FAQ
          </Button>
        </div>

        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : error ? (
          <Card className="flex flex-col items-center justify-center h-64 border-dashed border-2 border-destructive/50">
            <AlertCircle className="h-12 w-12 text-destructive mb-3" />
            <h3 className="text-lg font-bold text-foreground">Failed to Load FAQs</h3>
          </Card>
        ) : faqsList.length === 0 ? (
          <Card className="flex flex-col items-center justify-center h-64 border-dashed border-2 bg-muted/20">
            <MessageCircleQuestion className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <h3 className="text-lg font-bold text-foreground">No FAQs Found</h3>
            <Button onClick={() => setIsModalOpen(true)} variant="outline" size="sm" className="mt-4">Create FAQ</Button>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.keys(faqsByCategory).map((category) => (
              <div key={category} className="space-y-4">
                <h3 className="text-lg font-bold text-foreground border-b border-border pb-2 flex items-center">
                  <Badge variant="outline" className="mr-2 text-primary border-primary/20 bg-primary/5 uppercase tracking-wider">{category}</Badge>
                  Category
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {faqsByCategory[category].map((faq) => (
                    <Card key={faq.id} className="group overflow-hidden border border-border/60 hover:border-primary/40 hover:shadow-md transition-all">
                      <div className="p-5">
                        <div className="flex justify-between items-start gap-4">
                          <h4 className="font-bold text-foreground text-sm leading-tight flex-1">
                            <span className="text-primary mr-2 font-black">Q.</span>
                            {faq.question}
                          </h4>
                          
                          <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditModal(faq)}>
                              <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => {
                              if (confirm('Delete this FAQ?')) deleteMutation.mutate(faq.id);
                            }}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="mt-3 text-sm text-muted-foreground leading-relaxed flex items-start gap-2 bg-muted/30 p-3 rounded-lg border border-border/30">
                          <span className="text-muted-foreground/50 font-black">A.</span>
                          <span className="flex-1">{faq.answer}</span>
                        </div>
                        
                        <div className="mt-3 flex justify-end">
                          <span className="text-[10px] font-bold text-muted-foreground/50 uppercase">Order: {faq.orderIndex}</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog isOpen={isModalOpen} onClose={closeModal} title={editingId ? 'Edit FAQ' : 'Add FAQ'}>
          <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            <Input label="Question *" value={formData.question} onChange={(e) => setFormData({...formData, question: e.target.value})} required placeholder="e.g. Is my donation tax deductible?" />
            
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Answer *</label>
              <textarea value={formData.answer} onChange={(e) => setFormData({...formData, answer: e.target.value})} required rows={4} className="flex w-full rounded-lg border border-border bg-input/50 px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input label="Category *" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} required placeholder="e.g. Tax, Sponsorship, General" />
              <Input label="Order Index" type="number" value={formData.orderIndex?.toString()} onChange={(e) => setFormData({...formData, orderIndex: Number(e.target.value)})} required />
            </div>

            <Button type="submit" className="w-full font-bold h-10 mt-2" isLoading={createMutation.isPending || updateMutation.isPending}>
              {editingId ? 'Save Changes' : 'Add FAQ'}
            </Button>
          </form>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
