'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Edit2, Trash2, CheckCircle2, UserCheck, XCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { useAppStore } from '@/lib/store';

export default function StudentsPage() {
  const queryClient = useQueryClient();
  const { user } = useAppStore();
  const isSponsor = user?.role === 'Sponsor';

  // Search/Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Dialog open states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Form states
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'Male',
    grade: 'Class 1',
    guardianName: '',
    phone: '',
    address: '',
    status: 'Pending Approval',
  });

  // 1. Fetch Students
  const { data: studentsData, isLoading } = useQuery({
    queryKey: ['students', searchTerm, gradeFilter, statusFilter],
    queryFn: async () => {
      const query = new URLSearchParams({
        search: searchTerm,
        grade: gradeFilter,
        status: statusFilter,
      }).toString();
      const res = await fetch(`/api/students?${query}`);
      if (!res.ok) throw new Error('Error fetching students');
      return res.json();
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (newStudent: any) => {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStudent),
      });
      if (!res.ok) throw new Error('Create request failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setIsAddOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, fields }: { id: string; fields: any }) => {
      const res = await fetch(`/api/students?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      if (!res.ok) throw new Error('Update request failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setIsEditOpen(false);
      setSelectedStudent(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/students?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete request failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setIsDeleteOpen(false);
      setSelectedStudent(null);
    },
  });

  // Action helpers
  const handleOpenAdd = () => {
    resetForm();
    setIsAddOpen(true);
  };

  const handleOpenEdit = (student: any) => {
    setSelectedStudent(student);
    setFormData({
      name: student.name,
      age: String(student.age),
      gender: student.gender,
      grade: student.grade,
      guardianName: student.guardianName,
      phone: student.phone,
      address: student.address,
      status: student.status,
    });
    setIsEditOpen(true);
  };

  const handleOpenDelete = (student: any) => {
    setSelectedStudent(student);
    setIsDeleteOpen(true);
  };

  const handleApprove = (id: string) => {
    updateMutation.mutate({ id, fields: { status: 'Approved' } });
  };

  const handleDeactivate = (id: string) => {
    updateMutation.mutate({ id, fields: { status: 'Inactive' } });
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
    if (selectedStudent) {
      updateMutation.mutate({ id: selectedStudent.id, fields: formData });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      age: '',
      gender: 'Male',
      grade: 'Class 1',
      guardianName: '',
      phone: '',
      address: '',
      status: 'Pending Approval',
    });
  };

  // Grade options listing
  const gradeOptions = [
    { label: 'All Classes', value: '' },
    { label: 'Class 1', value: 'Class 1' },
    { label: 'Class 2', value: 'Class 2' },
    { label: 'Class 3', value: 'Class 3' },
    { label: 'Class 4', value: 'Class 4' },
    { label: 'Class 5', value: 'Class 5' },
    { label: 'Class 6', value: 'Class 6' },
  ];

  // Status options listing
  const statusOptions = [
    { label: 'All Statuses', value: '' },
    { label: 'Approved', value: 'Approved' },
    { label: 'Pending Approval', value: 'Pending Approval' },
    { label: 'Inactive', value: 'Inactive' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Students Registry</h1>
            <p className="text-xs text-muted-foreground">
              Manage KSW Pathshala student listings, sponsor associations, and approvals.
            </p>
          </div>
          {!isSponsor && (
            <Button onClick={handleOpenAdd} className="h-9 font-bold text-xs">
              <Plus className="mr-1.5 h-4 w-4" />
              Onboard Student
            </Button>
          )}
        </div>

        {/* Filter Toolbar */}
        <Card className="p-4">
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/80" />
              <Input
                placeholder="Search name, guardian or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 text-xs"
              />
            </div>

            {/* Class filter */}
            <Select
              options={gradeOptions}
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="h-10 text-xs"
            />

            {/* Status filter */}
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 text-xs"
            />
          </div>
        </Card>

        {/* Main List */}
        <Card className="p-0 overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex h-60 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : !studentsData?.students || studentsData.students.length === 0 ? (
              <div className="text-center py-16 text-xs text-muted-foreground">
                No student profiles found. Add a profile or adjust active search filters.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-bold">Name</TableHead>
                    <TableHead className="text-xs font-bold">Age / Gender</TableHead>
                    <TableHead className="text-xs font-bold">Grade</TableHead>
                    <TableHead className="text-xs font-bold">Guardian & Phone</TableHead>
                    <TableHead className="text-xs font-bold">Status</TableHead>
                    <TableHead className="text-xs font-bold">Attendance</TableHead>
                    {!isSponsor && <TableHead className="text-xs font-bold text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentsData.students.map((student: any) => (
                    <TableRow key={student.id}>
                      <TableCell className="py-3.5 font-bold text-xs text-foreground">
                        {student.name}
                      </TableCell>
                      <TableCell className="py-3.5 text-xs text-muted-foreground">
                        {student.age} yrs / {student.gender}
                      </TableCell>
                      <TableCell className="py-3.5 text-xs">
                        <Badge variant="outline" className="font-semibold text-xxs bg-secondary/35">
                          {student.grade}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3.5 text-xs">
                        <div className="font-medium">{student.guardianName}</div>
                        <div className="text-xxs text-muted-foreground">{student.phone}</div>
                      </TableCell>
                      <TableCell className="py-3.5">
                        <Badge
                          variant={
                            student.status === 'Approved'
                              ? 'success'
                              : student.status === 'Pending Approval'
                              ? 'warning'
                              : 'destructive'
                          }
                        >
                          {student.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3.5 text-xs font-bold text-indigo-500">
                        {student.attendancePercentage}%
                      </TableCell>
                      {!isSponsor && (
                        <TableCell className="py-3.5 text-right space-x-1 flex items-center justify-end">
                          {student.status === 'Pending Approval' && (
                            <Button
                              variant="ghost"
                              onClick={() => handleApprove(student.id)}
                              className="p-1 h-8 w-8 text-emerald-500 hover:bg-emerald-500/10 rounded-full"
                              title="Approve Student"
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                          )}
                          {student.status === 'Approved' && (
                            <Button
                              variant="ghost"
                              onClick={() => handleDeactivate(student.id)}
                              className="p-1 h-8 w-8 text-amber-500 hover:bg-amber-500/10 rounded-full"
                              title="Set Inactive"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            onClick={() => handleOpenEdit(student)}
                            className="p-1 h-8 w-8 text-indigo-500 hover:bg-indigo-500/10 rounded-full"
                            title="Edit details"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => handleOpenDelete(student)}
                            className="p-1 h-8 w-8 text-destructive hover:bg-destructive/10 rounded-full"
                            title="Delete profile"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* DIALOG: ADD STUDENT */}
        <Dialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Onboard New Student">
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
                label="Age *"
                name="age"
                type="number"
                required
                value={formData.age}
                onChange={handleFormChange}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Gender *"
                name="gender"
                options={[
                  { label: 'Male', value: 'Male' },
                  { label: 'Female', value: 'Female' },
                  { label: 'Other', value: 'Other' },
                ]}
                value={formData.gender}
                onChange={handleFormChange}
              />
              <Select
                label="Grade Class *"
                name="grade"
                options={[
                  { label: 'Class 1', value: 'Class 1' },
                  { label: 'Class 2', value: 'Class 2' },
                  { label: 'Class 3', value: 'Class 3' },
                  { label: 'Class 4', value: 'Class 4' },
                  { label: 'Class 5', value: 'Class 5' },
                  { label: 'Class 6', value: 'Class 6' },
                ]}
                value={formData.grade}
                onChange={handleFormChange}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Guardian Name *"
                name="guardianName"
                required
                value={formData.guardianName}
                onChange={handleFormChange}
              />
              <Input
                label="Phone Number"
                name="phone"
                value={formData.phone}
                onChange={handleFormChange}
              />
            </div>
            <Input
              label="Home Address"
              name="address"
              value={formData.address}
              onChange={handleFormChange}
            />
            <Button type="submit" className="w-full h-10 font-bold" isLoading={createMutation.isPending}>
              Create Student Application
            </Button>
          </form>
        </Dialog>

        {/* DIALOG: EDIT STUDENT */}
        <Dialog isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Student Profile">
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
                label="Age *"
                name="age"
                type="number"
                required
                value={formData.age}
                onChange={handleFormChange}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Gender *"
                name="gender"
                options={[
                  { label: 'Male', value: 'Male' },
                  { label: 'Female', value: 'Female' },
                  { label: 'Other', value: 'Other' },
                ]}
                value={formData.gender}
                onChange={handleFormChange}
              />
              <Select
                label="Grade Class *"
                name="grade"
                options={[
                  { label: 'Class 1', value: 'Class 1' },
                  { label: 'Class 2', value: 'Class 2' },
                  { label: 'Class 3', value: 'Class 3' },
                  { label: 'Class 4', value: 'Class 4' },
                  { label: 'Class 5', value: 'Class 5' },
                  { label: 'Class 6', value: 'Class 6' },
                ]}
                value={formData.grade}
                onChange={handleFormChange}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Guardian Name *"
                name="guardianName"
                required
                value={formData.guardianName}
                onChange={handleFormChange}
              />
              <Input
                label="Phone Number"
                name="phone"
                value={formData.phone}
                onChange={handleFormChange}
              />
            </div>
            <Input
              label="Home Address"
              name="address"
              value={formData.address}
              onChange={handleFormChange}
            />
            <Select
              label="Approval Status *"
              name="status"
              options={[
                { label: 'Pending Approval', value: 'Pending Approval' },
                { label: 'Approved', value: 'Approved' },
                { label: 'Inactive', value: 'Inactive' },
              ]}
              value={formData.status}
              onChange={handleFormChange}
            />
            <Button type="submit" className="w-full h-10 font-bold" isLoading={updateMutation.isPending}>
              Update Profile details
            </Button>
          </form>
        </Dialog>

        {/* DIALOG: DELETE CONFIRMATION */}
        <Dialog isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Confirm Profile Delete">
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Are you sure you want to delete student profile for <span className="font-bold text-foreground">{selectedStudent?.name}</span>?
              This action removes their enrollment record permanently.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setIsDeleteOpen(false)} className="w-1/2 h-9 font-semibold">
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => selectedStudent && deleteMutation.mutate(selectedStudent.id)}
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
