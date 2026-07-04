'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Navigation, CheckCircle, AlertTriangle, Compass, ShieldAlert } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { gpsService, teachersService } from '@/services';
import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('@/components/MapComponent'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-[300px] bg-secondary/20 animate-pulse rounded-lg flex items-center justify-center">
      <MapPin className="h-8 w-8 text-muted-foreground/30 animate-bounce" />
    </div>
  )
});

export default function GpsPage() {
  const queryClient = useQueryClient();
  
  const [currentPage, setCurrentPage] = useState(1);

  // 1. Fetch GPS logs via Axios admin API
  const { data: gpsLogsRaw, isLoading: loadingGps } = useQuery({
    queryKey: ['gpsLogs'],
    queryFn: () => gpsService.getAll().then((r) => r.data),
  });
  const gpsLogs = Array.isArray(gpsLogsRaw) ? gpsLogsRaw : (gpsLogsRaw?.logs || []);

  const { data: teachersDataRaw, isLoading: loadingTeachers } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => teachersService.getAll().then((r) => r.data),
  });
  
  const teachersData = Array.isArray(teachersDataRaw) ? teachersDataRaw : (teachersDataRaw?.teachers || []);
  
  const isLoading = loadingGps || loadingTeachers;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-full">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">GPS Tracking & Geofencing</h1>
          <p className="text-xs text-muted-foreground">
            Classroom center geofencing verification audits for faculty check-ins.
          </p>
        </div>

        {/* 2. Log History */}
        <Card className="p-0 overflow-hidden">
          <CardHeader className="p-5 pb-3 border-b border-border/40">
            <CardTitle className="text-sm font-bold">Clock-in Log audits</CardTitle>
            <CardDescription>Faculty check-in logs and automated coordinate range verifications</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex h-40 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : !gpsLogs || gpsLogs.length === 0 ? (
              <p className="text-center text-xs py-10 text-muted-foreground">No check-in logs today.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-bold">Teacher</TableHead>
                    <TableHead className="text-xs font-bold">Date / Time</TableHead>
                    <TableHead className="text-xs font-bold">Coordinates</TableHead>
                    <TableHead className="text-xs font-bold">Validation</TableHead>
                    <TableHead className="text-xs font-bold">Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    const paginatedLogs = gpsLogs.slice((currentPage - 1) * 10, currentPage * 10);
                    return paginatedLogs.map((log: any) => {
                      const teacher = teachersData?.find((t: any) => t.id === log.teacherId);
                      const isVerified = log.status === 'Inside Geofence';
                      const dateObj = new Date(log.timestamp);
                      return (
                        <TableRow key={log.id} className={isVerified ? '' : 'bg-red-500/5'}>
                          <TableCell className="py-3 font-semibold text-xs text-foreground">
                            {teacher ? (teacher.fullName || teacher.name) : 'Unknown'}
                          </TableCell>
                          <TableCell className="py-3 text-xs">
                            <div>{dateObj.toLocaleDateString()}</div>
                            <div className="text-xxs text-muted-foreground">{dateObj.toLocaleTimeString()}</div>
                          </TableCell>
                          <TableCell className="py-3 text-xxs font-mono text-muted-foreground">
                            {log.latitude ? log.latitude.toFixed(5) : '0.00000'}, {log.longitude ? log.longitude.toFixed(5) : '0.00000'}
                          </TableCell>
                          <TableCell className="py-3">
                            {isVerified ? (
                              <Badge variant="success" className="flex w-fit items-center space-x-1">
                                <CheckCircle className="h-3 w-3" />
                                <span>Verified</span>
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="flex w-fit items-center space-x-1">
                                <ShieldAlert className="h-3 w-3 animate-pulse" />
                                <span>Failed</span>
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="py-3 text-xxs text-muted-foreground max-w-xs truncate">
                            {log.status}
                          </TableCell>
                        </TableRow>
                      );
                    });
                  })()}
                </TableBody>
              </Table>
            )}
            {!isLoading && gpsLogs && (
              <Pagination
                currentPage={currentPage}
                totalItems={gpsLogs.length}
                onPageChange={setCurrentPage}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
