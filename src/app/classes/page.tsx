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
import { classesService, branchesService } from '@/services';

export default function ClassesPage() {
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
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    branchId: '',
  });

  // 1. Fetch Branches for the dropdowns
  const { data: branchesData } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchesService.getAll().then((r) => r.data),
  });

  // 2. Fetch Classes
  const { data: classesData, isLoading } = useQuery({
    queryKey: ['classes', branchFilter],
    queryFn: () => classesService.getAll(branchFilter ? { branchId: branchFilter } : undefined).then((r) => r.data),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (newClass: any) => classesService.create(newClass).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setIsAddOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, fields }: { id: string; fields: any }) =>
      classesService.update(id, fields).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setIsEditOpen(false);
      setSelectedClass(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => classesService.delete(id).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setIsDeleteOpen(false);
      setSelectedClass(null);
    },
  });

  // Action triggers
  const handleOpenAdd = () => {
    resetForm();
    setIsAddOpen(true);
  };

  const handleOpenEdit = (cls: any) => {
    setSelectedClass(cls);
    setFormData({
      name: cls.name,
      code: cls.code,
      branchId: cls.branchId?.id || cls.branchId?._id || (typeof cls.branchId === 'string' ? cls.branchId : ''),
    });
    setIsEditOpen(true);
  };

  const handleOpenDelete = (cls: any) => {
    setSelectedClass(cls);
    setIsDeleteOpen(true);
  };

  const handleDelete = () => {
    if (selectedClass) {
      deleteMutation.mutate(selectedClass.id);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedClass) {
      // API expects name only for put per the instruction
      updateMutation.mutate({ id: selectedClass.id, fields: { name: formData.name } });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      branchId: '',
    });
  };

  const branchesList = Array.isArray(branchesData) ? branchesData : (branchesData?.items || branchesData?.branches || []);
  const branchOptions = branchesList.map((b: any) => ({ label: b.name, value: b.id }));

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-full">
        {/* Header & Tabs */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
          <div className="flex-1 w-full">
            <PageTabs 
              title="Classes Management" 
              description="Manage educational classes across all branches."
              tabs={[
                { title: 'Student Directory', path: '/students', icon: Users },
                { title: 'Attendance', path: '/attendance', icon: CalendarCheck },
                { title: 'Branches', path: '/branches', icon: Building },
                { title: 'Classes', path: '/classes', icon: BookOpen }
              ]}
            />
          </div>
          <Button onClick={handleOpenAdd} className="h-10 font-bold text-xs md:mb-8 shadow-md">
            <Plus className="mr-1.5 h-4 w-4" />
            Add Class
          </Button>
        </div>

        {/* Filter bar */}
        <Card className="p-4 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/80" />
            <Input
              placeholder="Search classes by name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 text-xs"
            />
          </div>
          <div className="w-full sm:w-64">
            <Select
              options={[{ label: 'All Branches', value: '' }, ...branchOptions]}
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
            />
          </div>
        </Card>

        {/* Directory Table */}
        <Card className="p-0 overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex h-60 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : (() => {
              const rawList = Array.isArray(classesData) ? classesData : (classesData?.items || classesData?.classes || []);
              const filteredList = searchTerm 
                ? rawList.filter((c: any) => 
                    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    c.code?.toLowerCase().includes(searchTerm.toLowerCase())
                  ) 
                : rawList;
              
              if (filteredList.length === 0) {
                return (
                  <div className="text-center py-16 text-xs text-muted-foreground">
                    No classes found. Click "Add Class" to create one.
                  </div>
                );
              }

              const paginatedList = filteredList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

              return (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-bold">Class Name</TableHead>
                    <TableHead className="text-xs font-bold">Code</TableHead>
                    <TableHead className="text-xs font-bold">Branch</TableHead>
                    <TableHead className="text-xs font-bold">Created At</TableHead>
                    <TableHead className="text-xs font-bold text-right w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedList.map((cls: any) => (
                    <TableRow key={cls.id}>
                      <TableCell className="py-3.5 font-bold text-xs text-foreground">
                        {cls.name}
                      </TableCell>
                      <TableCell className="py-3.5 text-xs text-muted-foreground">
                        {cls.code}
                      </TableCell>
                      <TableCell className="py-3.5 text-xs font-medium text-foreground">
                        {typeof cls.branchId === 'object' ? cls.branchId.name : cls.branchId}
                      </TableCell>
                      <TableCell className="py-3.5 text-xs text-muted-foreground">
                        {new Date(cls.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1">
                          <Button
                            variant="ghost"
                            onClick={() => handleOpenEdit(cls)}
                            className="h-8 px-2.5 text-xs text-indigo-500 hover:bg-indigo-500/10"
                            title="Edit details"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => handleOpenDelete(cls)}
                            className="h-8 px-2.5 text-xs text-destructive hover:bg-destructive/10"
                            title="Remove class"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              );
            })()}
            
            {!isLoading && classesData && (() => {
              const rawList = Array.isArray(classesData) ? classesData : (classesData?.items || classesData?.classes || []);
              return rawList.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalItems={
                  searchTerm 
                    ? rawList.filter((c: any) => 
                        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        c.code?.toLowerCase().includes(searchTerm.toLowerCase())
                      ).length
                    : rawList.length
                }
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
              );
            })()}
          </CardContent>
        </Card>

        {/* DIALOG: ADD CLASS */}
        <Dialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Create New Class">
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div className="space-y-4">
              <Input
                label="Class Name *"
                name="name"
                required
                placeholder="e.g. Grade 5"
                value={formData.name}
                onChange={handleFormChange}
              />
              <Input
                label="Class Code *"
                name="code"
                required
                placeholder="e.g. G5"
                value={formData.code}
                onChange={handleFormChange}
              />
              <Select
                label="Branch *"
                name="branchId"
                required
                options={[{ label: 'Select a Branch', value: '' }, ...branchOptions]}
                value={formData.branchId}
                onChange={handleFormChange}
              />
            </div>
            <Button type="submit" className="w-full h-10 font-bold" isLoading={createMutation.isPending}>
              Create Class
            </Button>
          </form>
        </Dialog>

        {/* DIALOG: EDIT CLASS */}
        <Dialog isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Class">
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-4">
              <Input
                label="Class Name *"
                name="name"
                required
                value={formData.name}
                onChange={handleFormChange}
              />
              <Input
                label="Class Code"
                name="code"
                value={formData.code}
                onChange={handleFormChange}
                disabled
              />
              <Select
                label="Branch"
                name="branchId"
                options={[{ label: 'Select a Branch', value: '' }, ...branchOptions]}
                value={formData.branchId}
                onChange={handleFormChange}
                disabled
              />
            </div>
            <Button type="submit" className="w-full h-10 font-bold" isLoading={updateMutation.isPending}>
              Save Changes
            </Button>
          </form>
        </Dialog>

        {/* DIALOG: DELETE CONFIRMATION */}
        <Dialog isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete Class">
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Are you sure you want to delete <span className="font-bold text-foreground">{selectedClass?.name}</span>?
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
              <Button type="button" variant="destructive" isLoading={deleteMutation.isPending} onClick={handleDelete}>
                Delete
              </Button>
            </div>
          </div>
        </Dialog>

      </div>
    </DashboardLayout>
  );
}
