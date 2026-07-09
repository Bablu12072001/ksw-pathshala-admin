'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, CheckCircle, HelpCircle, Calendar, IndianRupee, Edit2, Trash2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { useAppStore } from '@/lib/store';
import { donationsService, studentsService } from '@/services';

export default function DonationsPage() {
  const queryClient = useQueryClient();
  const { user } = useAppStore();
  const isSponsor = user?.role === 'Sponsor';

  // Search/Filter states
  const [activeTab, setActiveTab] = useState<'online' | 'offline'>('online');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Dialog controllers
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState<any>(null);
  const [formData, setFormData] = useState({
    donorName: '',
    email: '',
    phone: '',
    amount: '',
    type: 'General Donation',
    studentId: '',
    paymentMethod: 'online',
    status: 'pending',
    panNumber: '',
  });

  // 1. Fetch Donations via Axios admin API
  const { data: donationsData, isLoading: loadingDonations } = useQuery({
    queryKey: ['donations', activeTab],
    queryFn: () =>
      donationsService.getAll({ 
        paymentMethod: activeTab === 'offline' ? 'offline' : undefined,
        status: activeTab === 'offline' ? 'all' : undefined
      }).then((r) => r.data),
  });

  // 2. Fetch approved students for sponsorship selection dropdown
  const { data: studentsData } = useQuery({
    queryKey: ['approvedStudentsForSponsorship'],
    queryFn: () => studentsService.getAll({ status: 'Approved' }).then((r) => r.data),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (newDonation: any) => donationsService.create(newDonation).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      setIsAddOpen(false);
      resetForm();
    },
  });

  const verifyMutation = useMutation({
    mutationFn: (id: string) =>
      donationsService.update(id, { status: 'success' }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, fields }: { id: string; fields: any }) =>
      donationsService.update(id, fields).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      setIsEditOpen(false);
      setSelectedDonation(null);
    },
    onError: (err) => {
      console.error(err);
      alert('Failed to update the offline donation.');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => donationsService.delete(id).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      setIsDeleteOpen(false);
      setSelectedDonation(null);
    },
    onError: (err) => {
      console.error(err);
      alert('Failed to delete the offline donation.');
    }
  });

  // Action helpers
  const handleOpenAdd = () => {
    resetForm();
    setIsAddOpen(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const resetForm = () => {
    setFormData({
      donorName: '',
      email: '',
      phone: '',
      amount: '',
      type: 'General Donation',
      studentId: '',
      paymentMethod: activeTab === 'offline' ? 'offline' : 'online',
      status: 'pending',
      panNumber: '',
    });
  };

  const handleOpenEdit = (donation: any) => {
    setSelectedDonation(donation);
    setFormData({
      donorName: donation.donorName || '',
      email: donation.email || '',
      phone: donation.donorPhone || '',
      amount: donation.amount?.toString() || '',
      type: donation.type === 'Sponsorship' ? 'Sponsorship' : 'General Donation',
      studentId: donation.studentId || '',
      paymentMethod: 'offline',
      status: donation.status || 'pending',
      panNumber: donation.panNumber || '',
    });
    setIsEditOpen(true);
  };

  const handleOpenDelete = (donation: any) => {
    setSelectedDonation(donation);
    setIsDeleteOpen(true);
  };

  const handleDelete = () => {
    if (selectedDonation) {
      deleteMutation.mutate(selectedDonation.id);
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDonation) {
      updateMutation.mutate({
        id: selectedDonation.id,
        fields: {
          amount: Number(formData.amount),
          status: formData.status
        }
      });
    }
  };

  const studentOptions = studentsData?.students
    ? [
        { label: 'Select Sponsored Student *', value: '' },
        ...studentsData.students.map((s: any) => ({ label: `${s.name} (${s.grade})`, value: s.id })),
      ]
    : [{ label: 'Select Sponsored Student *', value: '' }];

  const rawList = Array.isArray(donationsData?.donations) 
    ? donationsData.donations 
    : (Array.isArray(donationsData) ? donationsData : (donationsData?.data || donationsData?.items || []));

  const list = (Array.isArray(rawList) ? rawList : []).map((d: any) => ({
    id: d.id || d._id,
    donorName: d.donorName || 'Unknown Donor',
    email: d.donorEmail || '',
    amount: d.amount || 0,
    type: d.type === 'sponsorship' ? 'Sponsorship' : 'General Donation',
    studentName: d.studentId && studentsData?.students 
      ? (studentsData.students.find((s: any) => s.id === d.studentId)?.name || 'Sponsored Child')
      : null,
    paymentMethod: d.paymentMethod ? d.paymentMethod.charAt(0).toUpperCase() + d.paymentMethod.slice(1) : 'Unknown',
    plan: d.plan ? d.plan.charAt(0).toUpperCase() + d.plan.slice(1) : 'One-time',
    date: new Date(d.created_at || new Date()).toLocaleDateString('en-IN'),
    status: d.status,
  }));
  
  // Calculate running total values
  const totalReceived = list
    .filter((d: any) => d.status === 'success')
    .reduce((sum: number, d: any) => sum + d.amount, 0);

  const pendingVerification = list
    .filter((d: any) => d.status === 'pending')
    .reduce((sum: number, d: any) => sum + d.amount, 0);

  const filteredList = list.filter((d: any) => {
    const matchesSearch = searchTerm 
      ? (d.donorName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
        (d.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
        (d.paymentMethod?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      : true;
    const matchesStatus = statusFilter ? d.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Donation & Sponsors Registry</h1>
            <p className="text-xs text-muted-foreground">
              Monitor NGO fundraising ledgers, verification tasks, and active child sponsorships.
            </p>
          </div>
          {!isSponsor && (
            <Button onClick={handleOpenAdd} className="h-9 font-bold text-xs">
              <Plus className="mr-1.5 h-4 w-4" />
              {activeTab === 'offline' ? 'Log Offline Contribution' : 'Log Contribution'}
            </Button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab('online')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'online' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Online Transactions
          </button>
          <button
            onClick={() => setActiveTab('offline')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'offline' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Offline Contributions
          </button>
        </div>

        {/* Aggregate statistics */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="flex items-center space-x-4 p-4">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <IndianRupee className="h-5 w-5" />
            </div>
            <div>
              <div className="text-lg font-bold">₹{totalReceived.toLocaleString('en-IN')}</div>
              <div className="text-xxs font-bold text-muted-foreground uppercase tracking-wider">Total Verified Funds</div>
            </div>
          </Card>

          <Card className="flex items-center space-x-4 p-4">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center animate-pulse">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="text-lg font-bold">₹{pendingVerification.toLocaleString('en-IN')}</div>
              <div className="text-xxs font-bold text-muted-foreground uppercase tracking-wider">Pending Verification</div>
            </div>
          </Card>

          <Card className="flex items-center space-x-4 p-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="text-lg font-bold">
                {list.filter((d: any) => d.status === 'success').length} / {list.length}
              </div>
              <div className="text-xxs font-bold text-muted-foreground uppercase tracking-wider">Successful Transactions</div>
            </div>
          </Card>
        </div>

        {/* Filters bar */}
        <Card className="p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/80" />
              <Input
                placeholder="Search donor name, email or payment mode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 text-xs"
              />
            </div>

            <Select
              options={[
                { label: 'All', value: '' },
                { label: 'Success', value: 'success' },
                { label: 'Pending', value: 'pending' },
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 text-xs"
            />
          </div>
        </Card>

        {/* Ledger Table */}
        <Card className="p-0 overflow-hidden">
          <CardContent className="p-0">
            {loadingDonations ? (
              <div className="flex h-60 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : filteredList.length === 0 ? (
              <div className="text-center py-16 text-xs text-muted-foreground">
                No contribution ledgers matched your filters.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-bold">Donor Name</TableHead>
                    <TableHead className="text-xs font-bold">Amount</TableHead>
                    <TableHead className="text-xs font-bold">Category</TableHead>
                    <TableHead className="text-xs font-bold">Sponsored Student</TableHead>
                    <TableHead className="text-xs font-bold">Plan</TableHead>
                    <TableHead className="text-xs font-bold">Payment Method</TableHead>
                    <TableHead className="text-xs font-bold">Date Received</TableHead>
                    <TableHead className="text-xs font-bold">Status</TableHead>
                    {activeTab === 'offline' && <TableHead className="text-xs font-bold text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    const paginatedList = filteredList.slice((currentPage - 1) * 10, currentPage * 10);
                    return paginatedList.map((donation: any) => (
                    <TableRow key={donation.id}>
                      <TableCell className="py-3.5 font-bold text-xs text-foreground">
                        {donation.donorName}
                        <div className="text-xxs font-normal text-muted-foreground/85">{donation.email}</div>
                      </TableCell>
                      <TableCell className="py-3.5 text-xs font-extrabold text-foreground">
                        ₹{donation.amount.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="py-3.5 text-xs">
                        <Badge variant="outline" className="text-xxs font-semibold bg-secondary/35">
                          {donation.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3.5 text-xs">
                        {donation.studentName ? (
                          <Badge variant="info" className="text-xxs font-semibold">
                            {donation.studentName}
                          </Badge>
                        ) : (
                          <span className="text-xxs text-muted-foreground">None (General)</span>
                        )}
                      </TableCell>
                      <TableCell className="py-3.5 text-xs text-muted-foreground font-medium">
                        {donation.plan}
                      </TableCell>
                      <TableCell className="py-3.5 text-xs text-muted-foreground">
                        {donation.paymentMethod}
                      </TableCell>
                      <TableCell className="py-3.5 text-xs">
                        <div className="flex items-center space-x-1.5 text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{donation.date}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5">
                        <Badge variant={donation.status === 'success' ? 'success' : 'warning'}>
                          {donation.status}
                        </Badge>
                      </TableCell>
                      {activeTab === 'offline' && (
                        <TableCell className="py-3.5 text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-9 w-9 p-0 text-muted-foreground hover:text-primary"
                              onClick={() => handleOpenEdit(donation)}
                            >
                              <Edit2 className="h-5 w-5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive"
                              onClick={() => handleOpenDelete(donation)}
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                    ));
                  })()}
                </TableBody>
              </Table>
            )}
            {!loadingDonations && filteredList.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalItems={filteredList.length}
                onPageChange={setCurrentPage}
              />
            )}
          </CardContent>
        </Card>

        {/* DIALOG: LOG DONATION */}
        <Dialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Log New Contribution">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Donor Name *"
                name="donorName"
                required
                value={formData.donorName}
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
                label="Phone Number"
                name="phone"
                value={formData.phone}
                onChange={handleFormChange}
              />
              <Input
                label="Amount (INR) *"
                name="amount"
                type="number"
                required
                value={formData.amount}
                onChange={handleFormChange}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="PAN Number"
                name="panNumber"
                value={formData.panNumber}
                onChange={handleFormChange}
              />
              <Select
                label="Contribution Type *"
                name="type"
                options={[
                  { label: 'General Donation', value: 'General Donation' },
                  { label: 'Sponsorship Scheme', value: 'Sponsorship' },
                ]}
                value={formData.type}
                onChange={handleFormChange}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Payment Method *"
                name="paymentMethod"
                options={[
                  { label: 'Online', value: 'online' },
                  { label: 'Offline', value: 'offline' },
                ]}
                value={formData.paymentMethod}
                onChange={handleFormChange}
              />
              <Select
                label="Status *"
                name="status"
                options={[
                  { label: 'Pending', value: 'pending' },
                  { label: 'Success', value: 'success' },
                ]}
                value={formData.status}
                onChange={handleFormChange}
              />
            </div>

            {formData.type === 'Sponsorship' && (
              <Select
                label="Associate Approved Student *"
                name="studentId"
                required
                options={studentOptions}
                value={formData.studentId}
                onChange={handleFormChange}
              />
            )}

            <Button type="submit" className="w-full h-10 font-bold" isLoading={createMutation.isPending}>
              Record Transaction Ledger
            </Button>
          </form>
        </Dialog>

        {/* DIALOG: EDIT OFFLINE CONTRIBUTION */}
        <Dialog isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Offline Contribution">
          <form onSubmit={handleEditSubmit} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Amount (INR) *"
                name="amount"
                type="number"
                required
                value={formData.amount}
                onChange={handleFormChange}
              />
              <Select
                label="Status *"
                name="status"
                options={[
                  { label: 'Pending', value: 'pending' },
                  { label: 'Success', value: 'success' },
                ]}
                value={formData.status}
                onChange={handleFormChange}
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

        {/* DIALOG: DELETE OFFLINE CONTRIBUTION */}
        <Dialog isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete Contribution">
          <div className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete this contribution record? This action cannot be undone.
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
      </div>
    </DashboardLayout>
  );
}
