'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Edit2, Trash2, Building, BookOpen, Users, CalendarCheck, IndianRupee } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PageTabs } from '@/components/layout/page-tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { classPlansService, classesService, branchesService } from '@/services';

export default function ClassPlansPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Dialog controllers
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Form states
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [formData, setFormData] = useState({
    branchId: '',
    classId: '',
    monthlyAmount: '',
    halfYearlyAmount: '',
    annualAmount: '',
  });

  // 1. Fetch Branches for the dropdowns
  const { data: branchesData } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchesService.getAll().then((r) => r.data),
  });

  // 2. Fetch Classes for the dropdowns
  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classesService.getAll().then((r) => r.data),
  });

  // 3. Fetch Class Plans
  const { data: classPlansData, isLoading } = useQuery({
    queryKey: ['class-plans'],
    queryFn: () => classPlansService.getAll().then((r) => r.data),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (newPlan: any) => classPlansService.create(newPlan).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-plans'] });
      setIsAddOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, fields }: { id: string; fields: any }) =>
      classPlansService.update(id, fields).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-plans'] });
      setIsEditOpen(false);
      setSelectedPlan(null);
    },
    onError: (err) => {
      console.error(err);
      alert('Failed to update the plan. Please check the network tab for details.');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => classPlansService.delete(id).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-plans'] });
      setIsDeleteOpen(false);
      setSelectedPlan(null);
    },
    onError: (err) => {
      console.error(err);
      alert('Failed to delete the plan. Please check the network tab for details.');
    }
  });

  // Action triggers
  const handleOpenAdd = () => {
    resetForm();
    setIsAddOpen(true);
  };

  const handleOpenEdit = (plan: any) => {
    setSelectedPlan(plan);
    setFormData({
      branchId: typeof plan.branchId === 'object' ? (plan.branchId?.id || plan.branchId?._id) : plan.branchId || '',
      classId: typeof plan.classId === 'object' ? (plan.classId?.id || plan.classId?._id) : plan.classId || '',
      monthlyAmount: plan.monthlyAmount?.toString() || '',
      halfYearlyAmount: plan.halfYearlyAmount?.toString() || '',
      annualAmount: plan.annualAmount?.toString() || '',
    });
    setIsEditOpen(true);
  };

  const handleOpenDelete = (plan: any) => {
    setSelectedPlan(plan);
    setIsDeleteOpen(true);
  };

  const handleDelete = () => {
    if (selectedPlan) {
      deleteMutation.mutate(selectedPlan.id || selectedPlan._id);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      branchId: formData.branchId,
      classId: formData.classId,
      monthlyAmount: Number(formData.monthlyAmount),
      halfYearlyAmount: Number(formData.halfYearlyAmount),
      annualAmount: Number(formData.annualAmount),
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPlan) {
      updateMutation.mutate({ 
        id: selectedPlan.id || selectedPlan._id, 
        fields: {
          branchId: formData.branchId,
          classId: formData.classId,
          monthlyAmount: Number(formData.monthlyAmount),
          halfYearlyAmount: Number(formData.halfYearlyAmount),
          annualAmount: Number(formData.annualAmount),
        } 
      });
    }
  };

  const resetForm = () => {
    setFormData({
      branchId: '',
      classId: '',
      monthlyAmount: '',
      halfYearlyAmount: '',
      annualAmount: '',
    });
  };

  const branchesList = Array.isArray(branchesData) ? branchesData : (branchesData?.items || branchesData?.branches || []);
  const branchOptions = branchesList.map((b: any) => ({ label: b.name, value: b.id || b._id }));

  const classesList = Array.isArray(classesData) ? classesData : (classesData?.items || classesData?.classes || []);
  const classOptions = classesList.map((c: any) => ({ label: c.name, value: c.id || c._id }));

  // Filtering list
  const rawList = Array.isArray(classPlansData) ? classPlansData : (classPlansData?.items || classPlansData?.classPlans || classPlansData || []);
  const filteredList = rawList.filter((p: any) => {
    const branchName = p.branchId?.name?.toLowerCase() || '';
    const className = p.classId?.name?.toLowerCase() || '';
    const searchLower = searchTerm.toLowerCase();

    const matchesSearch = searchTerm ? (branchName.includes(searchLower) || className.includes(searchLower)) : true;
    const matchesBranch = branchFilter ? (p.branchId?.id === branchFilter || p.branchId?._id === branchFilter) : true;
    return matchesSearch && matchesBranch;
  });

  const paginatedList = filteredList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-full">
        {/* Header & Tabs */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
          <div className="flex-1 w-full">
            <PageTabs 
              title="Class Plans" 
              description="Manage pricing and sponsorship plans for classes across all branches."
              tabs={[
                { title: 'Class Pricing Plans', path: '/class-plans', icon: IndianRupee }
              ]}
            />
          </div>
          <Button onClick={handleOpenAdd} className="h-10 font-bold text-xs md:mb-8 shadow-md">
            <Plus className="mr-1.5 h-4 w-4" />
            Add Plan
          </Button>
        </div>

        {/* Filter bar */}
        <Card className="p-4 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/80" />
            <Input
              placeholder="Search by branch or class..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 text-xs"
            />
          </div>
          <Select
            options={[{ label: 'All Branches', value: '' }, ...branchOptions]}
            value={branchFilter}
            onChange={(e) => {
              setBranchFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full sm:w-[250px] h-10 text-xs"
          />
        </Card>

        {/* List Table */}
        <Card className="p-0 overflow-hidden border-border/60 shadow-sm">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex h-40 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : filteredList.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground">
                No class plans found matching your filters.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold text-xs">Branch</TableHead>
                    <TableHead className="font-bold text-xs">Class</TableHead>
                    <TableHead className="font-bold text-xs text-right">Monthly (₹)</TableHead>
                    <TableHead className="font-bold text-xs text-right">Half-Yearly (₹)</TableHead>
                    <TableHead className="font-bold text-xs text-right">Annual (₹)</TableHead>
                    <TableHead className="font-bold text-xs text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedList.map((plan: any) => (
                    <TableRow key={plan.id || plan._id}>
                      <TableCell className="font-medium text-xs text-foreground">
                        {plan.branchId?.name || 'Unknown Branch'}
                        <div className="text-xxs text-muted-foreground font-normal">{plan.branchId?.code}</div>
                      </TableCell>
                      <TableCell className="font-medium text-xs text-foreground">
                        {plan.classId?.name || 'Unknown Class'}
                        <div className="text-xxs text-muted-foreground font-normal">{plan.classId?.code}</div>
                      </TableCell>
                      <TableCell className="text-right text-xs font-semibold">
                        ₹{plan.monthlyAmount?.toLocaleString('en-IN') || 0}
                      </TableCell>
                      <TableCell className="text-right text-xs font-semibold">
                        ₹{plan.halfYearlyAmount?.toLocaleString('en-IN') || 0}
                      </TableCell>
                      <TableCell className="text-right text-xs font-semibold text-primary">
                        ₹{plan.annualAmount?.toLocaleString('en-IN') || 0}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 w-9 p-0 text-muted-foreground hover:text-primary"
                            onClick={() => handleOpenEdit(plan)}
                          >
                            <Edit2 className="h-5 w-5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => handleOpenDelete(plan)}
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {!isLoading && filteredList.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalItems={filteredList.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Dialog */}
      <Dialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add New Class Plan">
        <form onSubmit={handleAddSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Branch</label>
              <Select
                name="branchId"
                value={formData.branchId}
                onChange={handleFormChange}
                options={[{ label: 'Select Branch', value: '' }, ...branchOptions]}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Class</label>
              <Select
                name="classId"
                value={formData.classId}
                onChange={handleFormChange}
                options={[{ label: 'Select Class', value: '' }, ...classOptions]}
                required
              />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Monthly Amount (₹)</label>
            <Input
              name="monthlyAmount"
              type="number"
              value={formData.monthlyAmount}
              onChange={handleFormChange}
              placeholder="e.g. 600"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Half-Yearly Amount (₹)</label>
            <Input
              name="halfYearlyAmount"
              type="number"
              value={formData.halfYearlyAmount}
              onChange={handleFormChange}
              placeholder="e.g. 3300"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Annual Amount (₹)</label>
            <Input
              name="annualAmount"
              type="number"
              value={formData.annualAmount}
              onChange={handleFormChange}
              placeholder="e.g. 6600"
              required
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" type="button" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={createMutation.isPending}>
              Create Plan
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Class Plan">
        <form onSubmit={handleEditSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Branch</label>
              <Select
                name="branchId"
                value={formData.branchId}
                onChange={handleFormChange}
                options={[{ label: 'Select Branch', value: '' }, ...branchOptions]}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Class</label>
              <Select
                name="classId"
                value={formData.classId}
                onChange={handleFormChange}
                options={[{ label: 'Select Class', value: '' }, ...classOptions]}
                required
              />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Monthly Amount (₹)</label>
            <Input
              name="monthlyAmount"
              type="number"
              value={formData.monthlyAmount}
              onChange={handleFormChange}
              placeholder="e.g. 600"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Half-Yearly Amount (₹)</label>
            <Input
              name="halfYearlyAmount"
              type="number"
              value={formData.halfYearlyAmount}
              onChange={handleFormChange}
              placeholder="e.g. 3300"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Annual Amount (₹)</label>
            <Input
              name="annualAmount"
              type="number"
              value={formData.annualAmount}
              onChange={handleFormChange}
              placeholder="e.g. 6600"
              required
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" type="button" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={updateMutation.isPending}>
              Save Changes
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete Class Plan">
        <div className="space-y-4 pt-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this pricing plan? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} isLoading={deleteMutation.isPending}>
              Delete
            </Button>
          </div>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
