'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, CheckCircle, HelpCircle, Calendar, IndianRupee } from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Dialog controllers
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    donorName: '',
    email: '',
    phone: '',
    amount: '',
    type: 'General Donation',
    studentId: '',
    paymentMethod: 'UPI',
  });

  // 1. Fetch Donations via Axios admin API
  const { data: donationsData, isLoading: loadingDonations } = useQuery({
    queryKey: ['donations', searchTerm, statusFilter],
    queryFn: () =>
      donationsService.getAll({ search: searchTerm, status: statusFilter }).then((r) => r.data),
  });

  // 2. Fetch approved students for sponsorship selection dropdown
  const { data: studentsData } = useQuery({
    queryKey: ['approvedStudentsForSponsorship'],
    queryFn: () => studentsService.getAll({ status: 'Approved' }).then((r) => r.data),
    enabled: formData.type === 'Sponsorship',
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
      donationsService.update(id, { status: 'Verified' }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
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
      paymentMethod: 'UPI',
    });
  };

  const studentOptions = studentsData?.students
    ? [
        { label: 'Select Sponsored Student *', value: '' },
        ...studentsData.students.map((s: any) => ({ label: `${s.name} (${s.grade})`, value: s.id })),
      ]
    : [{ label: 'Select Sponsored Student *', value: '' }];

  const list = donationsData?.donations || [];
  
  // Calculate running total values
  const totalReceived = list
    .filter((d: any) => d.status === 'Verified')
    .reduce((sum: number, d: any) => sum + d.amount, 0);

  const pendingVerification = list
    .filter((d: any) => d.status === 'Pending Verification')
    .reduce((sum: number, d: any) => sum + d.amount, 0);

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
              Log Contribution
            </Button>
          )}
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
                {list.filter((d: any) => d.status === 'Verified').length} / {list.length}
              </div>
              <div className="text-xxs font-bold text-muted-foreground uppercase tracking-wider">Verified Transactions</div>
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
                { label: 'Success', value: 'Verified' },
                { label: 'Pending', value: 'Pending Verification' },
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
            ) : list.length === 0 ? (
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
                    <TableHead className="text-xs font-bold">Payment Method</TableHead>
                    <TableHead className="text-xs font-bold">Date Received</TableHead>
                    <TableHead className="text-xs font-bold">Status</TableHead>
                    {!isSponsor && <TableHead className="text-xs font-bold text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    const paginatedList = list.slice((currentPage - 1) * 10, currentPage * 10);
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
                        <Badge variant={donation.status === 'Verified' ? 'success' : 'warning'}>
                          {donation.status}
                        </Badge>
                      </TableCell>
                      {!isSponsor && (
                        <TableCell className="py-3.5 text-right">
                          {donation.status === 'Pending Verification' && (
                            <Button
                              variant="primary"
                              size="sm"
                              className="h-7 text-xxs font-bold"
                              isLoading={verifyMutation.isPending}
                              onClick={() => verifyMutation.mutate(donation.id)}
                            >
                              Verify Payment
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                    ));
                  })()}
                </TableBody>
              </Table>
            )}
            {!loadingDonations && list.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalItems={list.length}
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
              <Select
                label="Payment Method *"
                name="paymentMethod"
                options={[
                  { label: 'UPI / NetBanking', value: 'UPI' },
                  { label: 'Direct Bank Transfer', value: 'Bank Transfer' },
                  { label: 'Credit/Debit Card', value: 'Credit Card' },
                  { label: 'Cash Receipt', value: 'Cash' },
                ]}
                value={formData.paymentMethod}
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
      </div>
    </DashboardLayout>
  );
}
