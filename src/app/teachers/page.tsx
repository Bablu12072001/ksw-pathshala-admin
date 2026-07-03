'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Edit2, Trash2, UserCheck, XCircle, MapPin, Eye } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { LocationPicker } from '@/components/ui/location-picker';
import { teachersService } from '@/services';

export default function TeachersPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Dialog controllers
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Form states
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [viewData, setViewData] = useState<any>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    qualification: '',
    assignedClass: 'Class 1',
    latitude: '',
    longitude: '',
    radius: '200',
    status: 'Pending Approval',
  });

  // 1. Fetch Teachers via Axios admin API
  const { data: teachersData, isLoading } = useQuery({
    queryKey: ['teachers', searchTerm, statusFilter],
    queryFn: () => teachersService.getAll({ search: searchTerm, status: statusFilter }).then((r) => r.data),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (newTeacher: any) => teachersService.create(newTeacher).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      setIsAddOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, fields }: { id: string; fields: any }) =>
      teachersService.update(id, fields).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      setIsEditOpen(false);
      setSelectedTeacher(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => teachersService.delete(id).then((r) => r.data),
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
      fullName: teacher.fullName || teacher.name,
      email: teacher.email,
      phone: teacher.phone,
      password: teacher.password || '',
      qualification: teacher.qualification,
      assignedClass: teacher.assignedClass,
      latitude: String(teacher.gpsTargetLocation?.latitude || teacher.location?.latitude || '0'),
      longitude: String(teacher.gpsTargetLocation?.longitude || teacher.location?.longitude || '0'),
      radius: String(teacher.gpsTargetLocation?.radius || '200'),
      status: teacher.status,
    });
    setIsEditOpen(true);
  };

  const handleOpenDelete = (teacher: any) => {
    setSelectedTeacher(teacher);
    setIsDeleteOpen(true);
  };

  const handleDelete = () => {
    if (selectedTeacher) {
      deleteMutation.mutate(selectedTeacher.id);
    }
  };

  const handleApprove = (id: string) => {
    updateMutation.mutate({ id, fields: { status: 'active' } });
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      qualification: formData.qualification,
      assignedClass: formData.assignedClass,
      gpsTargetLocation: {
        latitude: formData.latitude,
        longitude: formData.longitude,
        radius: Number(formData.radius),
      },
    };
    createMutation.mutate(payload);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTeacher) {
      const payload = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        qualification: formData.qualification,
        assignedClass: formData.assignedClass,
        status: formData.status,
        gpsTargetLocation: {
          latitude: formData.latitude,
          longitude: formData.longitude,
          radius: Number(formData.radius),
        },
      };
      updateMutation.mutate({ id: selectedTeacher.id, fields: payload });
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      password: '',
      qualification: '',
      assignedClass: 'Class 1',
      latitude: '',
      longitude: '',
      radius: '200',
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
        <Card className="p-4 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/80" />
            <Input
              placeholder="Search by name, email, phone or degree..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 text-xs"
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              options={[
                { label: 'All Statuses', value: '' },
                { label: 'Active', value: 'active' },
                { label: 'Pending', value: 'pending' },
                { label: 'Inactive', value: 'inactive' },
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
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
              const rawTeachersList = !teachersData ? [] : (Array.isArray(teachersData) ? teachersData : teachersData.teachers || []);
              const teachersList = statusFilter ? rawTeachersList.filter((t: any) => t.status?.toLowerCase() === statusFilter.toLowerCase()) : rawTeachersList;
              
              if (teachersList.length === 0) {
                return (
                  <div className="text-center py-16 text-xs text-muted-foreground">
                    No teacher profiles found. Create a profile or adjust searches.
                  </div>
                );
              }
              return (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-bold">Name</TableHead>
                    <TableHead className="text-xs font-bold">Contact Details</TableHead>
                    <TableHead className="text-xs font-bold">Qualification</TableHead>
                    <TableHead className="text-xs font-bold">Assigned Class</TableHead>
                    <TableHead className="text-xs font-bold">GPS Target Location</TableHead>
                    <TableHead className="text-xs font-bold">Status</TableHead>
                    <TableHead className="text-xs font-bold text-right w-[160px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    const rawTeachersList = !teachersData ? [] : (Array.isArray(teachersData) ? teachersData : teachersData.teachers || []);
                    const teachersList = statusFilter ? rawTeachersList.filter((t: any) => t.status?.toLowerCase() === statusFilter.toLowerCase()) : rawTeachersList;
                    const paginatedTeachers = teachersList.slice((currentPage - 1) * 10, currentPage * 10);
                    return paginatedTeachers.map((teacher: any) => (
                    <TableRow key={teacher.id}>
                      <TableCell className="py-3.5 font-bold text-xs text-foreground">
                        {teacher.fullName || teacher.name || 'Unknown Teacher'}
                      </TableCell>
                      <TableCell className="py-3.5 text-xs">
                        <div className="font-semibold">{teacher.email || 'No email provided'}</div>
                        <div className="text-xxs text-muted-foreground">{teacher.phone}</div>
                      </TableCell>
                      <TableCell className="py-3.5 text-xs text-muted-foreground">
                        {teacher.qualification || 'Not specified'}
                      </TableCell>
                      <TableCell className="py-3.5 text-xs">
                        <Badge variant="outline" className="font-semibold text-xxs bg-secondary/35">
                          {teacher.assignedClass}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3.5 text-xs">
                        <div className="flex items-center space-x-1.5 font-medium text-foreground">
                          <MapPin className="h-3.5 w-3.5 text-primary" />
                          <span>{teacher.gpsTargetLocation?.radius ? `${teacher.gpsTargetLocation.radius}m Radius` : 'Assigned Coordinates'}</span>
                        </div>
                        <div className="text-xxs text-muted-foreground/80 mt-0.5 ml-5">
                          {teacher.gpsTargetLocation?.latitude ? Number(teacher.gpsTargetLocation.latitude).toFixed(4) : '0.0000'}°, {teacher.gpsTargetLocation?.longitude ? Number(teacher.gpsTargetLocation.longitude).toFixed(4) : '0.0000'}°
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5">
                        <Badge variant={teacher.status === 'active' || teacher.status === 'Approved' ? 'success' : 'warning'}>
                          {teacher.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1">
                          {teacher.status !== 'active' && teacher.status !== 'Approved' && (
                            <Button
                              variant="ghost"
                              onClick={() => handleApprove(teacher.id)}
                              className="h-8 px-2.5 text-xs text-emerald-500 hover:bg-emerald-500/10"
                              title="Approve Teacher"
                            >
                              <UserCheck className="h-3.5 w-3.5 mr-1.5" /> Approve
                            </Button>
                          )}
                          {(teacher.status === 'Approved' || teacher.status === 'active') && (
                            <Button
                              variant="ghost"
                              onClick={() => {
                                updateMutation.mutate({ id: teacher.id, fields: { status: 'inactive' } });
                              }}
                              className="h-8 px-2.5 text-xs text-amber-500 hover:bg-amber-500/10"
                              title="Set Inactive"
                            >
                              <XCircle className="h-3.5 w-3.5 mr-1.5" /> Deactivate
                            </Button>
                          )}
                          <Button
                              variant="ghost"
                              onClick={() => {
                                setViewData(teacher);
                                setIsViewModalOpen(true);
                              }}
                              className="h-8 px-2.5 text-xs text-blue-500 hover:bg-blue-500/10"
                              title="View details"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1.5" /> View
                            </Button>
                          <Button
                            variant="ghost"
                            onClick={() => handleOpenEdit(teacher)}
                            className="h-8 px-2.5 text-xs text-indigo-500 hover:bg-indigo-500/10"
                            title="Edit details"
                          >
                            <Edit2 className="h-3.5 w-3.5 mr-1.5" /> Edit
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => handleOpenDelete(teacher)}
                            className="h-8 px-2.5 text-xs text-destructive hover:bg-destructive/10"
                            title="Remove teacher"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    ));
                  })()}
                </TableBody>
              </Table>
              );
            })()}
            {!isLoading && (() => {
              const rawTeachersList = !teachersData ? [] : (Array.isArray(teachersData) ? teachersData : teachersData.teachers || []);
              const teachersList = statusFilter ? rawTeachersList.filter((t: any) => t.status?.toLowerCase() === statusFilter.toLowerCase()) : rawTeachersList;
              return teachersList.length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalItems={teachersList.length}
                  itemsPerPage={10}
                  onPageChange={setCurrentPage}
                />
              );
            })()}
          </CardContent>
        </Card>

        {/* DIALOG: ADD FACULTY */}
        <Dialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Onboard New Teacher">
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
                label="Password *"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleFormChange}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
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
                label="Geofence Radius (meters) *"
                name="radius"
                type="number"
                min="10"
                required
                value={formData.radius}
                onChange={handleFormChange}
              />
            </div>
            <LocationPicker 
              latitude={formData.latitude}
              longitude={formData.longitude}
              onChange={(lat, lng) => setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }))}
            />
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
                name="fullName"
                required
                value={formData.fullName}
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
                label="Password"
                name="password"
                type="password"
                placeholder="Leave blank to keep current"
                value={formData.password}
                onChange={handleFormChange}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
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
                label="Geofence Radius (meters) *"
                name="radius"
                type="number"
                min="10"
                required
                value={formData.radius}
                onChange={handleFormChange}
              />
            </div>
            <LocationPicker 
              latitude={formData.latitude}
              longitude={formData.longitude}
              onChange={(lat, lng) => setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }))}
            />
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
              Are you sure you want to delete teacher details for <span className="font-bold text-foreground">{selectedTeacher?.fullName || selectedTeacher?.name}</span>?
              This action removes their coordinates history and assigned classes.
            </p>
            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
              <Button type="button" variant="destructive" isLoading={deleteMutation.isPending} onClick={handleDelete}>
                Delete Teacher
              </Button>
            </div>
          </div>
        </Dialog>

        {/* DIALOG: VIEW TEACHER */}
        <Dialog isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Teacher Details">
          {viewData && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4 mb-4">
                <div className="h-16 w-16 rounded-full overflow-hidden bg-secondary">
                  {viewData.profileImage ? (
                    <img src={viewData.profileImage} alt={viewData.fullName} className="h-full w-full object-cover" />
                  ) : (
                    <UserCheck className="h-8 w-8 m-auto mt-4 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">{viewData.fullName || viewData.name}</h3>
                  <p className="text-xs text-muted-foreground">{viewData.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xxxxs text-muted-foreground uppercase tracking-wider">Phone</p>
                  <p className="text-sm font-semibold">{viewData.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xxxxs text-muted-foreground uppercase tracking-wider">Status</p>
                  <Badge variant={viewData.status === 'active' || viewData.status === 'Approved' ? 'success' : 'warning'}>
                    {viewData.status || 'active'}
                  </Badge>
                </div>
                <div>
                  <p className="text-xxxxs text-muted-foreground uppercase tracking-wider">Qualification</p>
                  <p className="text-sm font-semibold">{viewData.qualification || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xxxxs text-muted-foreground uppercase tracking-wider">Assigned Class</p>
                  <Badge variant="outline" className="font-semibold text-xxs bg-secondary/35">
                    {viewData.assignedClass || 'N/A'}
                  </Badge>
                </div>
                <div className="col-span-2">
                  <p className="text-xxxxs text-muted-foreground uppercase tracking-wider">GPS Target Location</p>
                  <div className="flex items-center space-x-1.5 font-medium text-foreground mt-1">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    <span className="text-sm font-semibold">{viewData.gpsTargetLocation?.radius ? `${viewData.gpsTargetLocation.radius}m Radius` : 'Assigned Coordinates'}</span>
                  </div>
                  <div className="text-xs text-muted-foreground/80 mt-1 ml-5">
                    {viewData.gpsTargetLocation?.latitude ? Number(viewData.gpsTargetLocation.latitude).toFixed(4) : '0.0000'}°, {viewData.gpsTargetLocation?.longitude ? Number(viewData.gpsTargetLocation.longitude).toFixed(4) : '0.0000'}°
                  </div>
                </div>
              </div>
            </div>
          )}
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
