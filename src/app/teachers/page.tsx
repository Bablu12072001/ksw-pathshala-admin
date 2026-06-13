'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Edit2, Trash2, UserCheck, XCircle, MapPin } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';

export default function TeachersPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  // Dialog controllers
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Form states
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    qualification: '',
    assignedClass: 'Class 1',
    classroomName: '',
    latitude: '28.5355',
    longitude: '77.3910',
    status: 'Pending Approval',
  });

  // 1. Fetch Teachers
  const { data: teachersData, isLoading } = useQuery({
    queryKey: ['teachers', searchTerm],
    queryFn: async () => {
      const res = await fetch(`/api/teachers?search=${searchTerm}`);
      if (!res.ok) throw new Error('Error fetching teachers');
      return res.json();
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (newTeacher: any) => {
      const res = await fetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTeacher),
      });
      if (!res.ok) throw new Error('Create request failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      setIsAddOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, fields }: { id: string; fields: any }) => {
      const res = await fetch(`/api/teachers?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      if (!res.ok) throw new Error('Update request failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      setIsEditOpen(false);
      setSelectedTeacher(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/teachers?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete request failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      setIsDeleteOpen(false);
      setSelectedTeacher(null);
    },
  });

  // Action triggers
  const handleOpenAdd = () => {
    resetForm();
    setIsAddOpen(true);
  };

  const handleOpenEdit = (teacher: any) => {
    setSelectedTeacher(teacher);
    setFormData({
      name: teacher.name,
      email: teacher.email,
      phone: teacher.phone,
      qualification: teacher.qualification,
      assignedClass: teacher.assignedClass,
      classroomName: teacher.location.classroomName,
      latitude: String(teacher.location.latitude),
      longitude: String(teacher.location.longitude),
      status: teacher.status,
    });
    setIsEditOpen(true);
  };

  const handleOpenDelete = (teacher: any) => {
    setSelectedTeacher(teacher);
    setIsDeleteOpen(true);
  };

  const handleApprove = (id: string) => {
    updateMutation.mutate({ id, fields: { status: 'Approved' } });
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
    if (selectedTeacher) {
      // Structure nested location payload
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        qualification: formData.qualification,
        assignedClass: formData.assignedClass,
        status: formData.status,
        location: {
          classroomName: formData.classroomName,
          latitude: Number(formData.latitude),
          longitude: Number(formData.longitude),
        },
      };
      updateMutation.mutate({ id: selectedTeacher.id, fields: payload });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      qualification: '',
      assignedClass: 'Class 1',
      classroomName: '',
      latitude: '28.5355',
      longitude: '77.3910',
      status: 'Pending Approval',
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Teachers Registry</h1>
            <p className="text-xs text-muted-foreground">
              Manage school faculty records, classroom centers, and GPS coordinates mapping.
            </p>
          </div>
          <Button onClick={handleOpenAdd} className="h-9 font-bold text-xs">
            <Plus className="mr-1.5 h-4 w-4" />
            Onboard Teacher
          </Button>
        </div>

        {/* Filter bar */}
        <Card className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/80" />
            <Input
              placeholder="Search by name, email, phone or degree..."
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
            ) : !teachersData?.teachers || teachersData.teachers.length === 0 ? (
              <div className="text-center py-16 text-xs text-muted-foreground">
                No teacher profiles found. Create a profile or adjust searches.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-bold">Name</TableHead>
                    <TableHead className="text-xs font-bold">Contact Details</TableHead>
                    <TableHead className="text-xs font-bold">Qualification</TableHead>
                    <TableHead className="text-xs font-bold">Assigned Class</TableHead>
                    <TableHead className="text-xs font-bold">GPS Target Location</TableHead>
                    <TableHead className="text-xs font-bold">Status</TableHead>
                    <TableHead className="text-xs font-bold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teachersData.teachers.map((teacher: any) => (
                    <TableRow key={teacher.id}>
                      <TableCell className="py-3.5 font-bold text-xs text-foreground">
                        {teacher.name}
                      </TableCell>
                      <TableCell className="py-3.5 text-xs">
                        <div className="font-semibold">{teacher.email}</div>
                        <div className="text-xxs text-muted-foreground">{teacher.phone}</div>
                      </TableCell>
                      <TableCell className="py-3.5 text-xs text-muted-foreground">
                        {teacher.qualification}
                      </TableCell>
                      <TableCell className="py-3.5 text-xs">
                        <Badge variant="outline" className="font-semibold text-xxs bg-secondary/35">
                          {teacher.assignedClass}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3.5 text-xs">
                        <div className="flex items-center space-x-1.5 font-medium text-foreground">
                          <MapPin className="h-3.5 w-3.5 text-primary" />
                          <span>{teacher.location.classroomName}</span>
                        </div>
                        <div className="text-xxs text-muted-foreground/80 mt-0.5 ml-5">
                          {teacher.location.latitude.toFixed(4)}°, {teacher.location.longitude.toFixed(4)}°
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5">
                        <Badge variant={teacher.status === 'Approved' ? 'success' : 'warning'}>
                          {teacher.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3.5 text-right space-x-1 flex items-center justify-end">
                        {teacher.status === 'Pending Approval' && (
                          <Button
                            variant="ghost"
                            onClick={() => handleApprove(teacher.id)}
                            className="p-1 h-8 w-8 text-emerald-500 hover:bg-emerald-500/10 rounded-full"
                            title="Approve Teacher"
                          >
                            <UserCheck className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          onClick={() => handleOpenEdit(teacher)}
                          className="p-1 h-8 w-8 text-indigo-500 hover:bg-indigo-500/10 rounded-full"
                          title="Edit details"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => handleOpenDelete(teacher)}
                          className="p-1 h-8 w-8 text-destructive hover:bg-destructive/10 rounded-full"
                          title="Delete profile"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* DIALOG: ADD FACULTY */}
        <Dialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Onboard New Teacher">
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Full Name *"
                name="name"
                required
                value={formData.name}
                onChange={handleFormChange}
              />
              <Input
                label="Email Address *"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleFormChange}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Phone Number *"
                name="phone"
                required
                value={formData.phone}
                onChange={handleFormChange}
              />
              <Input
                label="Qualifications *"
                name="qualification"
                required
                placeholder="e.g. B.Ed, M.Sc"
                value={formData.qualification}
                onChange={handleFormChange}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Class Assigned"
                name="assignedClass"
                options={[
                  { label: 'Class 1', value: 'Class 1' },
                  { label: 'Class 2', value: 'Class 2' },
                  { label: 'Class 3', value: 'Class 3' },
                  { label: 'Class 4', value: 'Class 4' },
                  { label: 'Class 5', value: 'Class 5' },
                  { label: 'Class 6', value: 'Class 6' },
                ]}
                value={formData.assignedClass}
                onChange={handleFormChange}
              />
              <Input
                label="Classroom Center Name *"
                name="classroomName"
                required
                placeholder="e.g. Noida Sector 4 Center"
                value={formData.classroomName}
                onChange={handleFormChange}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Center Latitude *"
                name="latitude"
                required
                value={formData.latitude}
                onChange={handleFormChange}
              />
              <Input
                label="Center Longitude *"
                name="longitude"
                required
                value={formData.longitude}
                onChange={handleFormChange}
              />
            </div>
            <Button type="submit" className="w-full h-10 font-bold" isLoading={createMutation.isPending}>
              Submit Teacher Profile
            </Button>
          </form>
        </Dialog>

        {/* DIALOG: EDIT FACULTY */}
        <Dialog isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Teacher Details">
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Full Name *"
                name="name"
                required
                value={formData.name}
                onChange={handleFormChange}
              />
              <Input
                label="Email Address *"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleFormChange}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Phone Number *"
                name="phone"
                required
                value={formData.phone}
                onChange={handleFormChange}
              />
              <Input
                label="Qualifications *"
                name="qualification"
                required
                value={formData.qualification}
                onChange={handleFormChange}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Class Assigned"
                name="assignedClass"
                options={[
                  { label: 'Class 1', value: 'Class 1' },
                  { label: 'Class 2', value: 'Class 2' },
                  { label: 'Class 3', value: 'Class 3' },
                  { label: 'Class 4', value: 'Class 4' },
                  { label: 'Class 5', value: 'Class 5' },
                  { label: 'Class 6', value: 'Class 6' },
                ]}
                value={formData.assignedClass}
                onChange={handleFormChange}
              />
              <Input
                label="Classroom Center Name *"
                name="classroomName"
                required
                value={formData.classroomName}
                onChange={handleFormChange}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Center Latitude *"
                name="latitude"
                required
                value={formData.latitude}
                onChange={handleFormChange}
              />
              <Input
                label="Center Longitude *"
                name="longitude"
                required
                value={formData.longitude}
                onChange={handleFormChange}
              />
            </div>
            <Select
              label="Onboarding Status *"
              name="status"
              options={[
                { label: 'Pending Approval', value: 'Pending Approval' },
                { label: 'Approved', value: 'Approved' },
              ]}
              value={formData.status}
              onChange={handleFormChange}
            />
            <Button type="submit" className="w-full h-10 font-bold" isLoading={updateMutation.isPending}>
              Save Teacher Details
            </Button>
          </form>
        </Dialog>

        {/* DIALOG: DELETE CONFIRMATION */}
        <Dialog isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="De-register Teacher profile">
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Are you sure you want to delete teacher details for <span className="font-bold text-foreground">{selectedTeacher?.name}</span>?
              This action removes their coordinates history and assigned classes.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setIsDeleteOpen(false)} className="w-1/2 h-9 font-semibold">
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => selectedTeacher && deleteMutation.mutate(selectedTeacher.id)}
                className="w-1/2 h-9 font-bold"
                isLoading={deleteMutation.isPending}
              >
                Delete Profile
              </Button>
            </div>
          </div>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
