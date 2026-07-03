'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, CheckCircle, Trash2, Edit2, Eye, ShieldAlert, Check } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { volunteerDonationClaimsService } from '@/services';

export default function VolunteerClaimsPage() {
  const queryClient = useQueryClient();

  // Modal States
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewData, setViewData] = useState<any>(null);

  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [processData, setProcessData] = useState<any>(null);

  const [processForm, setProcessForm] = useState<{
    status: string;
    pointsAwarded: number | string;
    adminNotes: string;
    amount: number | string;
    donorName: string;
    notes: string;
  }>({
    status: 'approved',
    pointsAwarded: '',
    adminNotes: '',
    amount: '',
    donorName: '',
    notes: '',
  });

  // Pagination and Filters
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [statusFilter, setStatusFilter] = useState('pending'); // default to pending

  // -- Queries --
  const { data: claimsRaw, isLoading } = useQuery({
    queryKey: ['volunteerClaims', statusFilter],
    queryFn: () => volunteerDonationClaimsService.getAll(statusFilter === 'all' ? '' : statusFilter).then(r => r.data),
  });

  const claimsList = Array.isArray(claimsRaw) 
    ? claimsRaw 
    : (Array.isArray(claimsRaw?.claims) 
       ? claimsRaw.claims 
       : (Array.isArray(claimsRaw?.volunteers) ? claimsRaw.volunteers : []));

  // -- Mutations --
  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; data: any }) => volunteerDonationClaimsService.update(payload.id, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteerClaims'] });
      setIsProcessModalOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => volunteerDonationClaimsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteerClaims'] });
    },
  });

  // -- Handlers --
  const handleView = (claim: any) => {
    setViewData(claim);
    setIsViewModalOpen(true);
  };

  const handleOpenProcess = (claim: any) => {
    setProcessData(claim);
    setProcessForm({
      status: claim.status === 'pending' ? 'approved' : claim.status,
      pointsAwarded: claim.pointsAwarded !== undefined ? claim.pointsAwarded : '',
      adminNotes: claim.adminNotes || '',
      amount: claim.amount !== undefined ? claim.amount : '',
      donorName: claim.donorName || '',
      notes: claim.notes || '',
    });
    setIsProcessModalOpen(true);
  };

  const handleProcessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!processData) return;
    updateMutation.mutate({
      id: processData.id,
      data: {
        status: processForm.status,
        pointsAwarded: Number(processForm.pointsAwarded),
        adminNotes: processForm.adminNotes,
        amount: Number(processForm.amount),
        donorName: processForm.donorName,
        notes: processForm.notes,
      },
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this donation claim?')) {
      deleteMutation.mutate(id);
    }
  };

  // Pagination logic
  const paginatedClaims = claimsList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center">
              <FileText className="mr-2 h-6 w-6 text-primary" />
              Donation Claims
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Process volunteer donation claims, award points, and verify proofs.
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <Card className="p-4 border-border/50 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status:</span>
                <Select
                  options={[
                    { label: 'All Claims', value: 'all' },
                    { label: 'Pending', value: 'pending' },
                    { label: 'Approved', value: 'approved' },
                    { label: 'Rejected', value: 'rejected' },
                  ]}
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-48 text-xs font-semibold h-9"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Claims Table */}
        <Card className="p-0 overflow-hidden shadow-sm">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex h-40 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : claimsList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <ShieldAlert className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm font-semibold text-muted-foreground">No claims found.</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Try adjusting your status filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/20">
                      <TableHead className="text-xs font-bold w-1/4">Volunteer Info</TableHead>
                      <TableHead className="text-xs font-bold w-1/4">Donor Info</TableHead>
                      <TableHead className="text-xs font-bold">Amount / Date</TableHead>
                      <TableHead className="text-xs font-bold">Status</TableHead>
                      <TableHead className="text-right text-xs font-bold w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedClaims.map((claim: any) => {
                      const volunteer = claim.volunteerId || {};
                      const isPending = claim.status === 'pending';
                      const isApproved = claim.status === 'approved';
                      
                      return (
                        <TableRow key={claim.id} className="group hover:bg-secondary/10 transition-colors">
                          <TableCell className="py-3">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-foreground">
                                {volunteer.fullName || 'Unknown'}
                              </span>
                              <span className="text-xxs text-muted-foreground font-mono">
                                {volunteer.email || ''}
                              </span>
                            </div>
                          </TableCell>
                          
                          <TableCell className="py-3">
                            <div className="flex flex-col">
                              <span className="text-xs font-semibold text-foreground">
                                {claim.donorName || 'Anonymous'}
                              </span>
                              <span className="text-xxs text-muted-foreground">
                                {claim.donorEmail || ''} {claim.donorPhone ? `• ${claim.donorPhone}` : ''}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell className="py-3">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                ₹{claim.amount}
                              </span>
                              <span className="text-xxs text-muted-foreground font-mono">
                                {new Date(claim.created_at).toLocaleDateString('en-IN')}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell className="py-3">
                            <Badge
                              variant={
                                isApproved ? 'success' : isPending ? 'warning' : 'destructive'
                              }
                              className="font-semibold text-xxxxs uppercase tracking-wider"
                            >
                              {claim.status}
                            </Badge>
                            {claim.pointsAwarded > 0 && (
                              <div className="text-xxxxs font-bold text-primary mt-1">
                                +{claim.pointsAwarded} pts
                              </div>
                            )}
                          </TableCell>
                          
                          <TableCell className="py-3 text-right">
                            <div className="flex items-center justify-end space-x-1 opacity-80 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleView(claim)}
                                className="h-7 w-7 rounded-md bg-secondary/80 hover:bg-secondary flex items-center justify-center text-foreground border border-border/40 transition-colors"
                                title="View Details"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                              
                              <button
                                onClick={() => handleOpenProcess(claim)}
                                className={`h-7 w-7 rounded-md flex items-center justify-center border transition-colors ${
                                  isPending 
                                    ? 'bg-primary/10 hover:bg-primary/20 text-primary border-primary/20' 
                                    : 'bg-secondary/80 hover:bg-secondary text-foreground border-border/40'
                                }`}
                                title="Process / Edit Claim"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>

                              <button
                                onClick={() => handleDelete(claim.id)}
                                className="h-7 w-7 rounded-md bg-destructive/10 hover:bg-destructive/20 flex items-center justify-center text-destructive border border-destructive/20 transition-colors"
                                title="Delete Claim"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
            
            {claimsList.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalItems={claimsList.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            )}
          </CardContent>
        </Card>

        {/* View Details Modal */}
        <Dialog isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Donation Claim Details">
          {viewData && (
            <div className="space-y-6 pb-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-secondary/30 rounded-xl border border-border/50">
                  <span className="text-xxxxs uppercase tracking-wider font-bold text-muted-foreground block mb-1">Volunteer</span>
                  <p className="text-sm font-bold text-foreground">{viewData.volunteerId?.fullName}</p>
                  <p className="text-xs text-muted-foreground font-mono">{viewData.volunteerId?.email}</p>
                </div>
                <div className="p-3 bg-secondary/30 rounded-xl border border-border/50">
                  <span className="text-xxxxs uppercase tracking-wider font-bold text-muted-foreground block mb-1">Donor</span>
                  <p className="text-sm font-bold text-foreground">{viewData.donorName}</p>
                  <p className="text-xs text-muted-foreground">{viewData.donorPhone} | {viewData.donorEmail}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-secondary/30 rounded-xl border border-border/50">
                  <span className="text-xxxxs uppercase tracking-wider font-bold text-muted-foreground block mb-1">Donation Information</span>
                  <div className="text-lg font-bold text-emerald-500 mb-1">₹{viewData.amount}</div>
                  <p className="text-xs text-foreground font-medium">Campaign: {viewData.campaignSource || 'N/A'}</p>
                  <p className="text-xs text-muted-foreground mt-1">{viewData.notes}</p>
                </div>
                <div className="p-3 bg-secondary/30 rounded-xl border border-border/50 flex flex-col justify-center">
                  <span className="text-xxxxs uppercase tracking-wider font-bold text-muted-foreground block mb-1">Status</span>
                  <Badge variant={viewData.status === 'approved' ? 'success' : viewData.status === 'pending' ? 'warning' : 'destructive'} className="w-fit mb-2">
                    {viewData.status}
                  </Badge>
                  {viewData.pointsAwarded > 0 && <span className="text-xs font-bold text-primary">Awarded {viewData.pointsAwarded} Points</span>}
                  {viewData.adminNotes && <span className="text-xs text-muted-foreground mt-1 block border-t border-border/40 pt-1">Note: {viewData.adminNotes}</span>}
                </div>
              </div>
              
              {viewData.transactionProof && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-foreground">Transaction Proof</span>
                  <div className="rounded-xl overflow-hidden border border-border/50 bg-black/5 flex items-center justify-center min-h-[200px]">
                    <img src={viewData.transactionProof} alt="Proof" className="max-w-full max-h-[400px] object-contain" />
                  </div>
                </div>
              )}
            </div>
          )}
        </Dialog>

        {/* Process / Edit Modal */}
        <Dialog isOpen={isProcessModalOpen} onClose={() => setIsProcessModalOpen(false)} title="Process Donation Claim">
          {processData && (
            <form onSubmit={handleProcessSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4 bg-secondary/20 p-3 rounded-lg border border-border/40">
                <div>
                  <span className="text-xxxxs font-bold text-muted-foreground uppercase">Volunteer</span>
                  <p className="text-xs font-semibold">{processData.volunteerId?.fullName}</p>
                </div>
                <div>
                  <span className="text-xxxxs font-bold text-muted-foreground uppercase">Proof</span>
                  {processData.transactionProof ? (
                    <a href={processData.transactionProof} target="_blank" rel="noreferrer" className="text-xs font-bold text-primary hover:underline block">
                      View Document ↗
                    </a>
                  ) : <span className="text-xs text-muted-foreground">No proof uploaded</span>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Donor Name"
                  value={processForm.donorName}
                  onChange={(e) => setProcessForm({...processForm, donorName: e.target.value})}
                  required
                />
                <Input
                  label="Donation Amount (₹)"
                  type="number"
                  value={processForm.amount}
                  onChange={(e) => setProcessForm({...processForm, amount: e.target.value})}
                  required
                />
              </div>

              <Input
                label="Volunteer Notes (Campaign/Source)"
                value={processForm.notes}
                onChange={(e) => setProcessForm({...processForm, notes: e.target.value})}
              />

              <div className="border-t border-border pt-4 mt-2">
                <h3 className="text-xs font-bold text-foreground mb-3 uppercase tracking-wider">Approval Processing</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <Select
                    label="Claim Status"
                    options={[
                      { label: 'Pending', value: 'pending' },
                      { label: 'Approved', value: 'approved' },
                      { label: 'Rejected', value: 'rejected' },
                    ]}
                    value={processForm.status}
                    onChange={(e) => setProcessForm({...processForm, status: e.target.value})}
                  />
                  <Input
                    label="Points to Award Volunteer"
                    type="number"
                    value={processForm.pointsAwarded}
                    onChange={(e) => setProcessForm({...processForm, pointsAwarded: e.target.value})}
                  />
                </div>
                
                <Input
                  label="Admin Notes / Remarks"
                  placeholder="e.g. Verified via bank statement"
                  value={processForm.adminNotes}
                  onChange={(e) => setProcessForm({...processForm, adminNotes: e.target.value})}
                />
              </div>

              <Button
                type="submit"
                className="w-full h-10 font-bold mt-2"
                isLoading={updateMutation.isPending}
              >
                <Check className="mr-2 h-4 w-4" />
                Save Processing Details
              </Button>
            </form>
          )}
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
