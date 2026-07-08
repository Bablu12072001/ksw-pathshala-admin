'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Edit2, Trash2, Building, BookOpen, Users, CalendarCheck } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PageTabs } from '@/components/layout/page-tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { branchesService } from '@/services';

export default function BranchesPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Dialog controllers
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Form states
  const [selectedBranch, setSelectedBranch] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    location: '',
  });

  // 1. Fetch Branches
  const { data: branchesData, isLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchesService.getAll().then((r) => r.data),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (newBranch: any) => branchesService.create(newBranch).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      setIsAddOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, fields }: { id: string; fields: any }) =>
      branchesService.update(id, fields).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      setIsEditOpen(false);
      setSelectedBranch(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => branchesService.delete(id).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      setIsDeleteOpen(false);
      setSelectedBranch(null);
    },
  });

  // Action triggers
  const handleOpenAdd = () => {
    resetForm();
    setIsAddOpen(true);
  };

  const handleOpenEdit = (branch: any) => {
    setSelectedBranch(branch);
    setFormData({
      name: branch.name,
      code: branch.code,
      location: branch.location,
    });
    setIsEditOpen(true);
  };

  const handleOpenDelete = (branch: any) => {
    setSelectedBranch(branch);
    setIsDeleteOpen(true);
  };

  const handleDelete = () => {
    if (selectedBranch) {
      deleteMutation.mutate(selectedBranch.id);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedBranch) {
      // the api just wants name and location for put, but let's send code too if available, 
      // based on typical rest. The prompt says put body: { name: "...", location: "..." }
      updateMutation.mutate({ id: selectedBranch.id, fields: formData });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      location: '',
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-full">
        {/* Header & Tabs */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
          <div className="flex-1 w-full">
            <PageTabs 
              title="Branches Management" 
              description="Manage KSW Pathshala branches and their physical locations."
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
            Add Branch
          </Button>
        </div>

        {/* Filter bar */}
        <Card className="p-4 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/80" />
            <Input
              placeholder="Search branches by name, code or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 text-xs"
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
              const rawList = Array.isArray(branchesData) ? branchesData : (branchesData?.items || branchesData?.branches || []);
              const filteredList = searchTerm 
                ? rawList.filter((b: any) => 
                    b.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    b.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    b.location?.toLowerCase().includes(searchTerm.toLowerCase())
                  ) 
                : rawList;
              
              if (filteredList.length === 0) {
                return (
                  <div className="text-center py-16 text-xs text-muted-foreground">
                    No branches found. Click "Add Branch" to create one.
                  </div>
                );
              }

              const paginatedList = filteredList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

              return (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-bold">Branch Name</TableHead>
                    <TableHead className="text-xs font-bold">Code</TableHead>
                    <TableHead className="text-xs font-bold">Location</TableHead>
                    <TableHead className="text-xs font-bold">Created At</TableHead>
                    <TableHead className="text-xs font-bold text-right w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedList.map((branch: any) => (
                    <TableRow key={branch.id}>
                      <TableCell className="py-3.5 font-bold text-xs text-foreground">
                        {branch.name}
                      </TableCell>
                      <TableCell className="py-3.5 text-xs text-muted-foreground">
                        {branch.code}
                      </TableCell>
                      <TableCell className="py-3.5 text-xs text-muted-foreground">
                        {branch.location}
                      </TableCell>
                      <TableCell className="py-3.5 text-xs text-muted-foreground">
                        {new Date(branch.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1">
                          <Button
                            variant="ghost"
                            onClick={() => handleOpenEdit(branch)}
                            className="h-8 px-2.5 text-xs text-indigo-500 hover:bg-indigo-500/10"
                            title="Edit details"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => handleOpenDelete(branch)}
                            className="h-8 px-2.5 text-xs text-destructive hover:bg-destructive/10"
                            title="Remove branch"
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
            
            {!isLoading && branchesData && (() => {
              const rawList = Array.isArray(branchesData) ? branchesData : (branchesData?.items || branchesData?.branches || []);
              return rawList.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalItems={
                  searchTerm 
                    ? rawList.filter((b: any) => 
                        b.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        b.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        b.location?.toLowerCase().includes(searchTerm.toLowerCase())
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

        {/* DIALOG: ADD BRANCH */}
        <Dialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Create New Branch">
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div className="space-y-4">
              <Input
                label="Branch Name *"
                name="name"
                required
                placeholder="e.g. Noida Sector 62"
                value={formData.name}
                onChange={handleFormChange}
              />
              <Input
                label="Branch Code *"
                name="code"
                required
                placeholder="e.g. NOI-62"
                value={formData.code}
                onChange={handleFormChange}
              />
              <Input
                label="Location *"
                name="location"
                required
                placeholder="e.g. Noida"
                value={formData.location}
                onChange={handleFormChange}
              />
            </div>
            <Button type="submit" className="w-full h-10 font-bold" isLoading={createMutation.isPending}>
              Create Branch
            </Button>
          </form>
        </Dialog>

        {/* DIALOG: EDIT BRANCH */}
        <Dialog isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Branch">
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-4">
              <Input
                label="Branch Name *"
                name="name"
                required
                value={formData.name}
                onChange={handleFormChange}
              />
              <Input
                label="Branch Code"
                name="code"
                value={formData.code}
                onChange={handleFormChange}
                disabled
              />
              <Input
                label="Location *"
                name="location"
                required
                value={formData.location}
                onChange={handleFormChange}
              />
            </div>
            <Button type="submit" className="w-full h-10 font-bold" isLoading={updateMutation.isPending}>
              Save Changes
            </Button>
          </form>
        </Dialog>

        {/* DIALOG: DELETE CONFIRMATION */}
        <Dialog isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete Branch">
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Are you sure you want to delete <span className="font-bold text-foreground">{selectedBranch?.name}</span>?
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
