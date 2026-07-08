'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Edit2, Trash2, CheckCircle2, UserCheck, XCircle, Eye, Users, CalendarCheck, MapPin, Building, BookOpen } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PageTabs } from '@/components/layout/page-tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { useAppStore } from '@/lib/store';
import { studentsService, classesService, branchesService, mediaService } from '@/services';

export default function StudentsPage() {
  const queryClient = useQueryClient();
  const { user } = useAppStore();
  const isSponsor = user?.role === 'Sponsor';

  // Search/Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Dialog open states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewData, setViewData] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Form states
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    age: '',
    dob: '',
    gender: '',
    gradeClass: '',
    guardianName: '',
    phone: '',
    homeAddress: '',
    slumLocation: '',
    status: 'active',
    branchId: '',
    classId: '',
    photoUrl: '',
    academicRating: '',
    teacherNotes: '',
  });

  // 1. Fetch Students via Axios admin API
  const { data: studentsData, isLoading } = useQuery({
    queryKey: ['students', searchTerm, gradeFilter, statusFilter],
    queryFn: () =>
      studentsService.getAll({ search: searchTerm, grade: gradeFilter, status: statusFilter }).then((r) => r.data),
  });

  // 2. Fetch Classes for dropdown
  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classesService.getAll().then((r) => r.data),
  });

  // 3. Fetch Branches for dropdown
  const { data: branchesData } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchesService.getAll().then((r) => r.data),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (newStudent: any) => studentsService.create(newStudent).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setIsAddOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, fields }: { id: string; fields: any }) =>
      studentsService.update(id, fields).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setIsEditOpen(false);
      setSelectedStudent(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => studentsService.delete(id).then((r) => r.data),
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
      fullName: student.fullName || student.name || '',
      age: String(student.age || ''),
      dob: student.dob || '',
      gender: student.gender || student.sex || 'Male',
      gradeClass: student.gradeClass || student.grade || '',
      guardianName: student.guardianName || student.parentName || '',
      phone: student.phone || '',
      homeAddress: student.homeAddress || student.address || '',
      slumLocation: student.slumLocation || '',
      status: student.status || 'active',
      branchId: student.branchId?.id || student.branchId?._id || (typeof student.branchId === 'string' ? student.branchId : ''),
      classId: student.classId?.id || student.classId?._id || (typeof student.classId === 'string' ? student.classId : ''),
      photoUrl: student.photoUrl || '',
      academicRating: student.academicRating || '',
      teacherNotes: student.teacherNotes || '',
    });
    setIsEditOpen(true);
  };

  const handleOpenDelete = (student: any) => {
    setSelectedStudent(student);
    setIsDeleteOpen(true);
  };
  
  const handleDelete = () => {
    if (selectedStudent) {
        deleteMutation.mutate(selectedStudent.id);
    }
  };

  const handleApprove = (id: string) => {
    updateMutation.mutate({ id, fields: { status: 'active' } });
  };

  const handleDeactivate = (id: string) => {
    updateMutation.mutate({ id, fields: { status: 'Inactive' } });
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updates: any = { [name]: value };
      
      if (name === 'classId') {
        const cls = classesList.find((c: any) => c.id === value);
        if (cls) {
          updates.gradeClass = cls.name;
        } else {
          updates.gradeClass = '';
        }
      }
      
      return { ...prev, ...updates };
    });
  };

  const performUpload = async (file: File, folder: string): Promise<string | null> => {
    try {
      const presignRes = await mediaService.generatePresignedUrls({
        folder,
        files: [{ filename: file.name, fileType: file.type }]
      });
      const fileData = presignRes.data?.files?.[0];
      if (!fileData || !fileData.uploadUrl) {
        throw new Error('Failed to retrieve upload URL');
      }
      const uploadRes = await fetch(fileData.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });
      if (!uploadRes.ok) throw new Error('Failed to upload image to S3');
      return fileData.imageUrl;
    } catch (err: any) {
      console.error('Upload error:', err);
      setUploadError(err.message || 'Image upload failed.');
      return null;
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setUploadError('');
    const url = await performUpload(file, 'students');
    if (url) {
      setFormData(prev => ({ ...prev, photoUrl: url }));
    }
    setIsUploading(false);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData };
    if (!payload.dob) delete (payload as any).dob;
    createMutation.mutate(payload);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStudent) {
      const payload = { ...formData };
      if (!payload.dob) delete (payload as any).dob;
      updateMutation.mutate({ id: selectedStudent.id, fields: payload });
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      age: '',
      dob: '',
      gender: '',
      gradeClass: '',
      guardianName: '',
      phone: '',
      homeAddress: '',
      slumLocation: '',
      status: 'active',
      branchId: '',
      classId: '',
      photoUrl: '',
      academicRating: '',
      teacherNotes: '',
    });
  };

  // Grade options listing
  const classesList = Array.isArray(classesData) ? classesData : (classesData?.items || classesData?.classes || []);
  const uniqueClassNames = Array.from(new Set(classesList.map((c: any) => c.name)));
  const dynamicClassOptions = uniqueClassNames.map((name: any) => ({ label: name, value: name }));
  const classIdOptions = classesList.map((c: any) => ({ label: c.name, value: c.id }));

  const branchesList = Array.isArray(branchesData) ? branchesData : (branchesData?.items || branchesData?.branches || []);
  const branchIdOptions = branchesList.map((b: any) => ({ label: b.name, value: b.id }));

  const gradeOptions = [
    { label: 'All Classes', value: '' },
    ...classIdOptions
  ];

  // Status options listing
  const statusOptions = [
    { label: 'All Statuses', value: '' },
    { label: 'Active', value: 'active' },
    { label: 'Pending', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Inactive', value: 'Inactive' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-full">
        {/* Header & Tabs */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
          <div className="flex-1 w-full">
            <PageTabs 
              title="Students Registry" 
              description="Manage KSW Pathshala student listings, sponsor associations, and approvals."
              tabs={[
                { title: 'Student Directory', path: '/students', icon: Users },
                { title: 'Attendance', path: '/attendance', icon: CalendarCheck },
                { title: 'Branches', path: '/branches', icon: Building },
                { title: 'Classes', path: '/classes', icon: BookOpen }
              ]}
            />
          </div>
          {!isSponsor && (
            <Button onClick={handleOpenAdd} className="h-10 font-bold text-xs md:mb-8 shadow-md">
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
            ) : (() => {
              const rawStudentsList = !studentsData ? [] : (Array.isArray(studentsData) ? studentsData : studentsData.students || []);
              let studentsList = rawStudentsList;
              if (statusFilter) {
                studentsList = studentsList.filter((s: any) => s.status?.toLowerCase() === statusFilter.toLowerCase());
              }
              if (gradeFilter) {
                studentsList = studentsList.filter((s: any) => (s.gradeClass || s.grade) === gradeFilter);
              }
              
              if (studentsList.length === 0) {
                return (
                  <div className="text-center py-16 text-xs text-muted-foreground">
                    No student records found.
                  </div>
                );
              }
              
              const paginatedStudents = studentsList.slice((currentPage - 1) * 10, currentPage * 10);
              return (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-bold">Name</TableHead>
                    <TableHead className="text-xs font-bold">Age / Gender</TableHead>
                    <TableHead className="text-xs font-bold">Grade</TableHead>
                    <TableHead className="text-xs font-bold">Guardian & Phone</TableHead>
                    <TableHead className="text-xs font-bold">Status</TableHead>
                    <TableHead className="text-xs font-bold">Attendance</TableHead>
                    {!isSponsor && <TableHead className="text-xs font-bold text-right w-[160px]">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedStudents.map((student: any) => (
                    <TableRow key={student.id}>
                      <TableCell className="py-3.5 font-bold text-xs text-foreground">
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-full overflow-hidden bg-secondary flex-shrink-0 border border-border/50">
                            {(student.photoUrl || student.profileImage) ? (
                              <img src={student.photoUrl || student.profileImage} alt={student.fullName} className="h-full w-full object-cover" />
                            ) : (
                              <UserCheck className="h-4 w-4 m-auto mt-2 text-muted-foreground/70" />
                            )}
                          </div>
                          <span>{student.fullName || student.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5 text-xs text-muted-foreground">
                        {student.age} yrs / {student.gender}
                      </TableCell>
                      <TableCell className="py-3.5 text-xs">
                        <Badge variant="outline" className="font-semibold text-xxs bg-secondary/35">
                          {classesList.find((c: any) => c.id === (student.gradeClass || student.grade))?.name || student.gradeClass || student.grade}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3.5 text-xs">
                        <div className="font-medium">{student.guardianName}</div>
                        <div className="text-xxs text-muted-foreground">{student.phone}</div>
                      </TableCell>
                      <TableCell className="py-3.5">
                        <Badge
                          variant={
                            student.status === 'active' || student.status === 'Approved'
                              ? 'success'
                              : student.status === 'Pending Approval'
                              ? 'warning'
                              : 'destructive'
                          }
                        >
                          {student.status || 'active'}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3.5 text-xs font-bold text-indigo-500">
                        {student.attendancePercentage}%
                      </TableCell>
                      {!isSponsor && (
                        <TableCell className="py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end space-x-1">
                            {student.status === 'Pending Approval' && (
                              <Button
                                variant="ghost"
                                onClick={() => handleApprove(student.id)}
                                className="h-8 px-2.5 text-xs text-emerald-500 hover:bg-emerald-500/10"
                                title="Approve Student"
                              >
                                <UserCheck className="h-3.5 w-3.5 mr-1.5" /> Approve
                              </Button>
                            )}
                            {(student.status === 'Approved' || student.status === 'active') && (
                              <Button
                                variant="ghost"
                                onClick={() => handleDeactivate(student.id)}
                                className="h-8 px-2.5 text-xs text-amber-500 hover:bg-amber-500/10"
                                title="Set Inactive"
                              >
                                <XCircle className="h-3.5 w-3.5 mr-1.5" /> Deactivate
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              onClick={() => {
                                setViewData(student);
                                setIsViewModalOpen(true);
                              }}
                              className="h-8 px-2.5 text-xs text-blue-500 hover:bg-blue-500/10"
                              title="View details"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1.5" /> View
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() => handleOpenEdit(student)}
                              className="h-8 px-2.5 text-xs text-indigo-500 hover:bg-indigo-500/10"
                              title="Edit details"
                            >
                              <Edit2 className="h-3.5 w-3.5 mr-1.5" /> Edit
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() => handleOpenDelete(student)}
                              className="h-8 px-2.5 text-xs text-destructive hover:bg-destructive/10"
                              title="Delete profile"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                    ))}
                </TableBody>
              </Table>
              );
            })()}
            {!isLoading && (() => {
              const rawStudentsList = !studentsData ? [] : (Array.isArray(studentsData) ? studentsData : studentsData.students || []);
              let studentsList = rawStudentsList;
              if (statusFilter) {
                studentsList = studentsList.filter((s: any) => s.status?.toLowerCase() === statusFilter.toLowerCase());
              }
              if (gradeFilter) {
                studentsList = studentsList.filter((s: any) => (s.gradeClass || s.grade) === gradeFilter);
              }
              return studentsList.length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalItems={studentsList.length}
                  itemsPerPage={10}
                  onPageChange={setCurrentPage}
                />
              );
            })()}
          </CardContent>
        </Card>

        {/* DIALOG: ADD STUDENT */}
        <Dialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Onboard New Student">
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Full Name *"
                name="fullName"
                required
                value={formData.fullName}
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
                  { label: 'Select Gender', value: '' },
                  { label: 'Male', value: 'Male' },
                  { label: 'Female', value: 'Female' },
                  { label: 'Other', value: 'Other' },
                ]}
                value={formData.gender}
                onChange={handleFormChange}
                required
              />
              <Select
                label="Grade Class *"
                name="classId"
                options={[{ label: 'Select a Class', value: '' }, ...classIdOptions]}
                value={formData.classId}
                onChange={handleFormChange}
                required
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
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Home Address"
                name="homeAddress"
                value={formData.homeAddress}
                onChange={handleFormChange}
              />
              <Input
                label="Slum Location"
                name="slumLocation"
                value={formData.slumLocation}
                onChange={handleFormChange}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Branch *"
                name="branchId"
                options={[{ label: 'Select a Branch', value: '' }, ...branchIdOptions]}
                value={formData.branchId}
                onChange={handleFormChange}
                required
              />
              <Input
                label="Academic Rating"
                name="academicRating"
                placeholder="e.g. Very Good"
                value={formData.academicRating}
                onChange={handleFormChange}
              />
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold">Photo Upload</label>
                <div className="flex items-center space-x-4">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="flex-1 text-xs"
                  />
                  {isUploading && <span className="text-xs text-primary animate-pulse">Uploading...</span>}
                  {formData.photoUrl && !isUploading && (
                    <div className="h-10 w-10 rounded overflow-hidden flex-shrink-0 border bg-secondary">
                      <img src={formData.photoUrl} alt="Preview" className="h-full w-full object-cover" />
                    </div>
                  )}
                </div>
                {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}
              </div>
            </div>
            <div className="space-y-4">
              <Input
                label="Teacher Notes"
                name="teacherNotes"
                placeholder="Bright and attentive student."
                value={formData.teacherNotes}
                onChange={handleFormChange}
              />
            </div>
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
                name="fullName"
                required
                value={formData.fullName}
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
                  { label: 'Select Gender', value: '' },
                  { label: 'Male', value: 'Male' },
                  { label: 'Female', value: 'Female' },
                  { label: 'Other', value: 'Other' },
                ]}
                value={formData.gender}
                onChange={handleFormChange}
                required
              />
              <Select
                label="Grade Class *"
                name="classId"
                options={[{ label: 'Select a Class', value: '' }, ...classIdOptions]}
                value={formData.classId}
                onChange={handleFormChange}
                required
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
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Home Address"
                name="homeAddress"
                value={formData.homeAddress}
                onChange={handleFormChange}
              />
              <Input
                label="Slum Location"
                name="slumLocation"
                value={formData.slumLocation}
                onChange={handleFormChange}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Branch *"
                name="branchId"
                options={[{ label: 'Select a Branch', value: '' }, ...branchIdOptions]}
                value={formData.branchId}
                onChange={handleFormChange}
                required
              />
              <Input
                label="Academic Rating"
                name="academicRating"
                placeholder="e.g. Very Good"
                value={formData.academicRating}
                onChange={handleFormChange}
              />
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold">Photo Upload</label>
                <div className="flex items-center space-x-4">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="flex-1 text-xs"
                  />
                  {isUploading && <span className="text-xs text-primary animate-pulse">Uploading...</span>}
                  {formData.photoUrl && !isUploading && (
                    <div className="h-10 w-10 rounded overflow-hidden flex-shrink-0 border bg-secondary">
                      <img src={formData.photoUrl} alt="Preview" className="h-full w-full object-cover" />
                    </div>
                  )}
                </div>
                {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}
              </div>
            </div>
            <div className="space-y-4">
              <Input
                label="Teacher Notes"
                name="teacherNotes"
                placeholder="Bright and attentive student."
                value={formData.teacherNotes}
                onChange={handleFormChange}
              />
            </div>
            <Select
              label="Approval Status *"
              name="status"
              options={[
                { label: 'Pending Approval', value: 'Pending Approval' },
                { label: 'active', value: 'active' },
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
              Are you sure you want to delete student profile for <span className="font-bold text-foreground">{selectedStudent?.fullName || selectedStudent?.name}</span>?
              This action removes their enrollment record permanently.
            </p>
            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
              <Button type="button" variant="destructive" isLoading={deleteMutation.isPending} onClick={handleDelete}>
                Delete Student
              </Button>
            </div>
          </div>
        </Dialog>
        
        {/* DIALOG: VIEW STUDENT */}
        <Dialog isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Student Details">
          {viewData && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4 mb-4">
                <div className="h-16 w-16 rounded-full overflow-hidden bg-secondary">
                  {(viewData.photoUrl || viewData.profileImage) ? (
                    <img src={viewData.photoUrl || viewData.profileImage} alt={viewData.fullName} className="h-full w-full object-cover" />
                  ) : (
                    <UserCheck className="h-8 w-8 m-auto mt-4 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">{viewData.fullName || viewData.name}</h3>
                  <Badge variant="outline" className="mt-1">{viewData.classId?.name || classesList.find((c: any) => c.id === (viewData.gradeClass || viewData.grade))?.name || viewData.gradeClass || viewData.grade}</Badge>
                  {viewData.academicRating && <Badge variant="secondary" className="mt-1 ml-2">{viewData.academicRating}</Badge>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xxxxs text-muted-foreground uppercase tracking-wider">Age / Gender</p>
                  <p className="text-sm font-semibold">{viewData.age} yrs / {viewData.gender}</p>
                </div>
                <div>
                  <p className="text-xxxxs text-muted-foreground uppercase tracking-wider">Status</p>
                  <Badge variant={viewData.status === 'active' || viewData.status === 'Approved' ? 'success' : 'warning'}>
                    {viewData.status || 'active'}
                  </Badge>
                </div>
                <div>
                  <p className="text-xxxxs text-muted-foreground uppercase tracking-wider">Branch</p>
                  <p className="text-sm font-semibold">{viewData.branchId?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xxxxs text-muted-foreground uppercase tracking-wider">Attendance</p>
                  <p className="text-sm font-semibold">{viewData.attendancePercentage ?? 'N/A'}%</p>
                </div>
                <div>
                  <p className="text-xxxxs text-muted-foreground uppercase tracking-wider">Guardian Name</p>
                  <p className="text-sm font-semibold">{viewData.guardianName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xxxxs text-muted-foreground uppercase tracking-wider">Phone</p>
                  <p className="text-sm font-semibold">{viewData.phone || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xxxxs text-muted-foreground uppercase tracking-wider">Home Address</p>
                  <p className="text-sm font-semibold">{viewData.homeAddress || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xxxxs text-muted-foreground uppercase tracking-wider">Slum Location</p>
                  <p className="text-sm font-semibold">{viewData.slumLocation || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xxxxs text-muted-foreground uppercase tracking-wider">Teacher Notes</p>
                  <p className="text-sm font-semibold">{viewData.teacherNotes || 'N/A'}</p>
                </div>
              </div>
              {!isSponsor && (
                <div className="flex items-center justify-end space-x-3 pt-4 mt-6 border-t border-border/40">
                  <Button
                    variant="outline"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      handleDeactivate(viewData.id);
                      setIsViewModalOpen(false);
                    }}
                    isLoading={updateMutation.isPending}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject (Deactivate)
                  </Button>
                  <Button
                    className="bg-success text-white hover:bg-success/90"
                    onClick={() => {
                      handleApprove(viewData.id);
                      setIsViewModalOpen(false);
                    }}
                    isLoading={updateMutation.isPending}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Approve (Activate)
                  </Button>
                </div>
              )}
            </div>
          )}
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
