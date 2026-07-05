'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Edit2, Trash2, UserCheck, XCircle, Award, Shield, Image as ImageIcon, AlertCircle, Eye } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { volunteersService, mediaService } from '@/services';

export default function VolunteersPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Dialog controllers
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState<any>(null);
  
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewData, setViewData] = useState<any>(null);

  // Form states
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    status: 'approved',
    referredByCode: '',
    referralPoints: 0,
    qualification: '',
    profileImage: '',
    aadharFront: '',
    aadharBack: '',
  });

  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [aadharFrontFile, setAadharFrontFile] = useState<File | null>(null);
  const [aadharBackFile, setAadharBackFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // 1. Fetch Volunteers via Axios admin API
  const { data: volunteersData, isLoading } = useQuery({
    queryKey: ['volunteers', searchTerm, statusFilter],
    queryFn: () => volunteersService.getAll({ search: searchTerm, status: statusFilter }).then((r) => r.data),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (newVolunteer: any) => volunteersService.create(newVolunteer).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteers'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, fields }: { id: string; fields: any }) =>
      volunteersService.update(id, fields).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteers'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => volunteersService.delete(id).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteers'] });
      setIsDeleteOpen(false);
      setSelectedVolunteer(null);
    },
  });

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedVolunteer(null);
    resetForm();
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (volunteer: any) => {
    setSelectedVolunteer(volunteer);
    setFormData({
      fullName: volunteer.fullName || volunteer.name || '',
      email: volunteer.email || '',
      phone: volunteer.phone || '',
      password: '', // Blank by default, only sent if changed
      status: volunteer.status || 'approved',
      referredByCode: volunteer.referredByCode || '',
      referralPoints: volunteer.points || 0,
      qualification: volunteer.qualification || '',
      profileImage: volunteer.profileImage || '',
      aadharFront: volunteer.aadharFront || '',
      aadharBack: volunteer.aadharBack || '',
    });
    setProfileImageFile(null);
    setAadharFrontFile(null);
    setAadharBackFile(null);
    setUploadError('');
    setIsModalOpen(true);
  };

  const handleOpenDelete = (volunteer: any) => {
    setSelectedVolunteer(volunteer);
    setIsDeleteOpen(true);
  };

  const handleDelete = () => {
    if (selectedVolunteer) {
      deleteMutation.mutate(selectedVolunteer.id);
    }
  };

  const handleApprove = (volunteer: any) => {
    const fields: any = { status: 'approved' };
    if (volunteer.referredByCode) {
      fields.referralPoints = 50;
    }
    updateMutation.mutate({ id: volunteer.id, fields });
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    setUploadError('');

    let profileImageUrl = formData.profileImage;
    if (profileImageFile) {
        const url = await performUpload(profileImageFile, 'volunteers');
        if (url) profileImageUrl = url;
        else { setIsUploading(false); return; }
    }

    let aadharFrontUrl = formData.aadharFront;
    if (aadharFrontFile) {
        const url = await performUpload(aadharFrontFile, 'volunteers');
        if (url) aadharFrontUrl = url;
        else { setIsUploading(false); return; }
    }

    let aadharBackUrl = formData.aadharBack;
    if (aadharBackFile) {
        const url = await performUpload(aadharBackFile, 'volunteers');
        if (url) aadharBackUrl = url;
        else { setIsUploading(false); return; }
    }

    setIsUploading(false);

    const media = [];
    if (profileImageUrl) media.push({ type: 'profile_image', url: profileImageUrl });
    if (aadharFrontUrl) media.push({ type: 'aadhar_front', url: aadharFrontUrl });
    if (aadharBackUrl) media.push({ type: 'aadhar_back', url: aadharBackUrl });

    const payload: any = {
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      status: formData.status,
      referredByCode: formData.referredByCode,
      referralPoints: Number(formData.referralPoints),
      qualification: formData.qualification,
      media,
    };
    if (formData.password) {
        payload.password = formData.password;
    }

    if (selectedVolunteer) {
      updateMutation.mutate({ id: selectedVolunteer.id, fields: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      password: '',
      status: 'approved',
      referredByCode: '',
      referralPoints: 0,
      qualification: '',
      profileImage: '',
      aadharFront: '',
      aadharBack: '',
    });
    setProfileImageFile(null);
    setAadharFrontFile(null);
    setAadharBackFile(null);
    setUploadError('');
  };

  const FileUploadField = ({ label, file, existingUrl, setFile }: { label: string, file: File | null, existingUrl: string, setFile: (f: File | null) => void }) => {
    const previewUrl = file ? URL.createObjectURL(file) : existingUrl;

    return (
      <div className="space-y-1.5 flex flex-col items-center">
        <label className="text-xs font-semibold text-muted-foreground w-full text-left">{label}</label>
        <div className="border border-dashed border-border w-full rounded-md p-2 flex flex-col items-center justify-center bg-muted/20 relative group hover:bg-muted/40 transition-colors h-24">
          {previewUrl ? (
            <div className="relative w-full h-full rounded overflow-hidden">
              <img src={previewUrl} className="w-full h-full object-contain" alt="Preview" />
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white text-xxs font-bold">Change</span>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <ImageIcon className="h-5 w-5 text-muted-foreground/50 mx-auto mb-1" />
              <p className="text-xxs font-semibold text-foreground">Click to select</p>
            </div>
          )}
        <input 
          type="file" 
          accept="image/*" 
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                  setFile(e.target.files[0]);
                  setUploadError('');
              }
          }}
        />
      </div>
    </div>
  );
};

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Volunteers Registry</h1>
            <p className="text-xs text-muted-foreground">
              Manage community volunteers, credentials, and records.
            </p>
          </div>
          <Button onClick={handleOpenAdd} className="h-9 font-bold text-xs">
            <Plus className="mr-1.5 h-4 w-4" />
            Onboard Volunteer
          </Button>
        </div>

        {/* Filter bar */}
        <Card className="p-4 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/80" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 text-xs"
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              options={[
                { label: 'All Statuses', value: '' },
                { label: 'Approved', value: 'approved' },
                { label: 'Pending', value: 'pending' },
                { label: 'Rejected', value: 'rejected' },
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
              const rawVolunteersList = !volunteersData ? [] : (Array.isArray(volunteersData) ? volunteersData : volunteersData.volunteers || []);
              const volunteersList = statusFilter ? rawVolunteersList.filter((v: any) => v.status?.toLowerCase() === statusFilter.toLowerCase()) : rawVolunteersList;
              
              if (volunteersList.length === 0) {
                return (
                  <div className="text-center py-16 text-xs text-muted-foreground">
                    No volunteer profiles found. Create a profile or adjust searches.
                  </div>
                );
              }
              
              return (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-bold">Profile</TableHead>
                    <TableHead className="text-xs font-bold">Contact Details</TableHead>
                    <TableHead className="text-xs font-bold">Details & Points</TableHead>
                    <TableHead className="text-xs font-bold">Status</TableHead>
                    <TableHead className="text-xs font-bold text-right w-[160px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    const rawVolunteersList = !volunteersData ? [] : (Array.isArray(volunteersData) ? volunteersData : volunteersData.volunteers || []);
                    const volunteersList = statusFilter ? rawVolunteersList.filter((v: any) => v.status?.toLowerCase() === statusFilter.toLowerCase()) : rawVolunteersList;
                    const paginatedVolunteers = volunteersList.slice((currentPage - 1) * 10, currentPage * 10);
                    return paginatedVolunteers.map((volunteer: any) => (
                    <TableRow key={volunteer.id}>
                      <TableCell className="py-3.5">
                        <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 rounded-full overflow-hidden bg-secondary border border-border/50 shrink-0">
                                {volunteer.profileImage ? (
                                    <img src={volunteer.profileImage} alt={volunteer.fullName} className="h-full w-full object-cover" />
                                ) : (
                                    <ImageIcon className="h-5 w-5 m-auto mt-2.5 text-muted-foreground" />
                                )}
                            </div>
                            <div>
                                <div className="font-bold text-xs text-foreground">{volunteer.fullName || volunteer.name || 'Unknown Volunteer'}</div>
                                {volunteer.referralCode && <div className="text-xxs font-mono text-primary bg-primary/10 px-1 py-0.5 rounded mt-0.5 inline-block">{volunteer.referralCode}</div>}
                            </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5 text-xs">
                        <div className="font-semibold">{volunteer.email || 'No email provided'}</div>
                        <div className="text-xxs text-muted-foreground">{volunteer.phone}</div>
                      </TableCell>
                      <TableCell className="py-3.5 text-xs">
                        <div className="flex items-center space-x-1.5 font-medium text-foreground">
                          <Award className="h-3.5 w-3.5 text-amber-500" />
                          <span>{volunteer.points || 0} Points</span>
                        </div>
                        {volunteer.qualification && <div className="text-xxs text-muted-foreground mt-0.5 ml-5">{volunteer.qualification}</div>}
                        {volunteer.certificate?.id && (
                          <div className="flex items-center text-xxs text-emerald-500 mt-1 ml-5">
                            <Shield className="h-3 w-3 mr-1" /> Certified
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="py-3.5">
                        <Badge variant={volunteer.status === 'approved' || volunteer.status === 'active' ? 'success' : 'warning'}>
                          {volunteer.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1">
                          {volunteer.status !== 'approved' && volunteer.status !== 'active' && (
                            <Button
                              variant="ghost"
                              onClick={() => handleApprove(volunteer)}
                              className="h-8 px-2.5 text-xs text-emerald-500 hover:bg-emerald-500/10"
                              title="Approve Volunteer"
                            >
                              <UserCheck className="h-3.5 w-3.5 mr-1.5" /> Approve
                            </Button>
                          )}
                          {(volunteer.status === 'approved' || volunteer.status === 'active') && (
                            <Button
                              variant="ghost"
                              onClick={() => {
                                updateMutation.mutate({ id: volunteer.id, fields: { status: 'rejected' } });
                              }}
                              className="h-8 px-2.5 text-xs text-amber-500 hover:bg-amber-500/10"
                              title="Reject"
                            >
                              <XCircle className="h-3.5 w-3.5 mr-1.5" /> Reject
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setViewData(volunteer);
                              setIsViewModalOpen(true);
                            }}
                            className="h-8 px-2.5 text-xs text-blue-500 hover:bg-blue-500/10"
                            title="View details"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1.5" /> View
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => handleOpenEdit(volunteer)}
                            className="h-8 px-2.5 text-xs text-indigo-500 hover:bg-indigo-500/10"
                            title="Edit details"
                          >
                            <Edit2 className="h-3.5 w-3.5 mr-1.5" /> Edit
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => handleOpenDelete(volunteer)}
                            className="h-8 px-2.5 text-xs text-destructive hover:bg-destructive/10"
                            title="Remove volunteer"
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
              const rawVolunteersList = !volunteersData ? [] : (Array.isArray(volunteersData) ? volunteersData : volunteersData.volunteers || []);
              const volunteersList = statusFilter ? rawVolunteersList.filter((v: any) => v.status?.toLowerCase() === statusFilter.toLowerCase()) : rawVolunteersList;
              return volunteersList.length > 0 && (
                <Pagination 
                  currentPage={currentPage} 
                  totalItems={volunteersList.length} 
                  itemsPerPage={10} 
                  onPageChange={setCurrentPage} 
                />
              );
            })()}
          </CardContent>
        </Card>

        {/* DIALOG: ADD/EDIT VOLUNTEER */}
        <Dialog isOpen={isModalOpen} onClose={closeModal} title={selectedVolunteer ? "Edit Volunteer Profile" : "Onboard New Volunteer"}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {uploadError && (
              <div className="bg-destructive/10 text-destructive text-xs font-semibold p-2 rounded flex items-center">
                <AlertCircle className="w-3.5 h-3.5 mr-1.5" /> {uploadError}
              </div>
            )}
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
                label={selectedVolunteer ? "Password (leave blank to keep)" : "Password *"}
                name="password"
                type="password"
                required={!selectedVolunteer}
                value={formData.password}
                onChange={handleFormChange}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Qualification"
                name="qualification"
                value={formData.qualification}
                onChange={handleFormChange}
                placeholder="e.g. Bachelor of Arts"
              />
              <Select
                label="Onboarding Status *"
                name="status"
                options={[
                  { label: 'Pending Approval', value: 'pending' },
                  { label: 'Approved', value: 'approved' },
                ]}
                value={formData.status}
                onChange={handleFormChange}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Referred By Code"
                name="referredByCode"
                value={formData.referredByCode}
                onChange={handleFormChange}
                placeholder="e.g. BABL-S3E3"
              />
              <Input
                label="Referral Points"
                name="referralPoints"
                type="number"
                value={formData.referralPoints}
                onChange={handleFormChange}
              />
            </div>

            <div className="pt-2">
                <h4 className="text-xs font-bold text-foreground mb-2">Upload Documents</h4>
                <div className="grid grid-cols-3 gap-4">
                    <FileUploadField label="Profile Image" file={profileImageFile} existingUrl={formData.profileImage} setFile={setProfileImageFile} />
                    <FileUploadField label="Aadhar Front" file={aadharFrontFile} existingUrl={formData.aadharFront} setFile={setAadharFrontFile} />
                    <FileUploadField label="Aadhar Back" file={aadharBackFile} existingUrl={formData.aadharBack} setFile={setAadharBackFile} />
                </div>
            </div>

            <Button type="submit" className="w-full h-10 font-bold mt-2" isLoading={createMutation.isPending || updateMutation.isPending || isUploading}>
              {isUploading ? 'Uploading Files...' : selectedVolunteer ? 'Save Details' : 'Submit Volunteer'}
            </Button>
          </form>
        </Dialog>

        {/* DIALOG: DELETE CONFIRMATION */}
        <Dialog isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="De-register Volunteer profile">
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Are you sure you want to delete volunteer details for <span className="font-bold text-foreground">{selectedVolunteer?.fullName || selectedVolunteer?.name}</span>?
              This action removes their records permanently.
            </p>
            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
              <Button type="button" variant="destructive" isLoading={deleteMutation.isPending} onClick={handleDelete}>
                Delete Volunteer
              </Button>
            </div>
          </div>
        </Dialog>

        {/* DIALOG: VIEW VOLUNTEER */}
        <Dialog isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Volunteer Details">
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
                  <Badge variant={viewData.status === 'approved' || viewData.status === 'active' ? 'success' : 'warning'}>
                    {viewData.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-xxxxs text-muted-foreground uppercase tracking-wider">Qualification</p>
                  <p className="text-sm font-semibold">{viewData.qualification || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xxxxs text-muted-foreground uppercase tracking-wider">Points / Referral</p>
                  <p className="text-sm font-semibold">{viewData.points || 0} pts {viewData.referredByCode ? `(Ref: ${viewData.referredByCode})` : ''}</p>
                </div>
                <div>
                  <p className="text-xxxxs text-muted-foreground uppercase tracking-wider">My Referral Code</p>
                  <p className="text-sm font-semibold text-primary font-mono">{viewData.referralCode || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xxxxs text-muted-foreground uppercase tracking-wider">Joined On</p>
                  <p className="text-sm font-semibold">
                    {viewData.created_at ? new Date(viewData.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Documents Section */}
              <div className="pt-3 border-t border-border/50">
                <p className="text-xs font-bold text-foreground mb-3">Uploaded Documents</p>
                <div className="grid grid-cols-2 gap-4">
                  {viewData.aadharFront && (
                    <div>
                      <p className="text-xxxxs text-muted-foreground uppercase tracking-wider mb-1">Aadhar Front</p>
                      <a href={viewData.aadharFront} target="_blank" rel="noopener noreferrer" className="block w-full h-20 rounded border border-border overflow-hidden hover:opacity-80 transition-opacity">
                        <img src={viewData.aadharFront} alt="Aadhar Front" className="w-full h-full object-cover" />
                      </a>
                    </div>
                  )}
                  {viewData.aadharBack && (
                    <div>
                      <p className="text-xxxxs text-muted-foreground uppercase tracking-wider mb-1">Aadhar Back</p>
                      <a href={viewData.aadharBack} target="_blank" rel="noopener noreferrer" className="block w-full h-20 rounded border border-border overflow-hidden hover:opacity-80 transition-opacity">
                        <img src={viewData.aadharBack} alt="Aadhar Back" className="w-full h-full object-cover" />
                      </a>
                    </div>
                  )}
                </div>
                {viewData.moreDocs && viewData.moreDocs.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xxxxs text-muted-foreground uppercase tracking-wider mb-1">Additional Documents</p>
                    <div className="flex flex-wrap gap-2">
                      {viewData.moreDocs.map((doc: string, idx: number) => (
                        <a key={idx} href={doc} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-xs text-primary bg-primary/10 px-2 py-1 rounded hover:bg-primary/20 transition-colors">
                          Document {idx + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                {!viewData.aadharFront && !viewData.aadharBack && (!viewData.moreDocs || viewData.moreDocs.length === 0) && (
                  <p className="text-xs text-muted-foreground italic">No documents uploaded.</p>
                )}
              </div>

              {viewData.certificate?.id && (
                <div className="mt-4 p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                  <p className="text-xs font-bold text-emerald-600 mb-1 flex items-center"><Shield className="h-4 w-4 mr-1" /> Certification Issued</p>
                  <p className="text-xs text-emerald-600/80">Cert No: {viewData.certificate.certificateNo}</p>
                </div>
              )}
            </div>
          )}
        </Dialog>

      </div>
    </DashboardLayout>
  );
}
