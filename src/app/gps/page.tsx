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
  
  // Simulation states
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [mockLat, setMockLat] = useState('');
  const [mockLng, setMockLng] = useState('');
  const [simulateSuccess, setSimulateSuccess] = useState(false);
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

  // Clock-in mutation via Axios admin API
  const clockInMutation = useMutation({
    mutationFn: (payload: { teacherId: string; latitude: number; longitude: number }) =>
      gpsService.clockIn(payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gpsLogs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setSimulateSuccess(true);
      setTimeout(() => setSimulateSuccess(false), 3000);
    },
  });

  // Auto-fill teacher target coordinates when selected
  const handleTeacherChange = (id: string) => {
    setSelectedTeacherId(id);
    const teacher = teachersData?.find((t: any) => t.id === id);
    if (teacher && teacher.gpsTargetLocation) {
      setMockLat(String(teacher.gpsTargetLocation.latitude || '28.6139'));
      setMockLng(String(teacher.gpsTargetLocation.longitude || '77.2090'));
    } else {
      setMockLat('');
      setMockLng('');
    }
  };

  // Alter coordinates slightly to simulate distance offsets
  const applyOffset = (meters: number) => {
    const teacher = teachersData?.find((t: any) => t.id === selectedTeacherId);
    if (!teacher || !teacher.gpsTargetLocation) return;
    
    // Roughly, 0.00001 degrees is ~1.1 meters
    const offset = (meters / 1.1) * 0.00001;
    setMockLat(String(Number(teacher.gpsTargetLocation.latitude || 28.6139) + offset));
    setMockLng(String(Number(teacher.gpsTargetLocation.longitude || 77.2090) + offset));
  };

  const handleSimulate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacherId || !mockLat || !mockLng) return;
    clockInMutation.mutate({
      teacherId: selectedTeacherId,
      latitude: Number(mockLat),
      longitude: Number(mockLng),
    });
  };

  const teacherOptions = teachersData
    ? [
        { label: 'Select Active Teacher...', value: '' },
        ...teachersData.map((t: any) => ({ label: `${t.fullName || t.name} (${t.assignedClass})`, value: t.id })),
      ]
    : [{ label: 'Select Active Teacher...', value: '' }];

  const activeTeacher = teachersData?.find((t: any) => t.id === selectedTeacherId);
  
  // Calculate offset vector for map visualization
  let relativeOffset = { x: 0, y: 0, distance: 0, verified: true };
  if (activeTeacher && mockLat && mockLng) {
    const baseLat = Number(activeTeacher.gpsTargetLocation?.latitude || 28.6139);
    const baseLng = Number(activeTeacher.gpsTargetLocation?.longitude || 77.2090);
    const latDiff = Number(mockLat) - baseLat;
    const lngDiff = Number(mockLng) - baseLng;
    // Scale coordinate differences to fits nicely in visual canvas grid bounds (max 300 meters)
    // 0.00001 deg difference is ~1.1m, so diff / 0.00001 * 1.1 gives meters
    const dy = (latDiff / 0.00001) * 1.1;
    const dx = (lngDiff / 0.00001) * 1.1;
    const distance = Math.round(Math.sqrt(dx * dx + dy * dy));
    
    // Scale down coordinates so they stay within box bounds
    const scale = Math.min(1, 100 / Math.max(1, Math.abs(dx), Math.abs(dy)));
    
    relativeOffset = {
      x: dx * scale,
      y: -dy * scale, // invert y for standard pixel rendering coords
      distance,
      verified: distance <= 100,
    };
  }

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

        {/* 1. Simulator & Visual Canvas Map */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Geofence Simulator Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center">
                <Compass className="mr-2 h-4.5 w-4.5 text-primary" />
                GPS Check-in Simulator
              </CardTitle>
              <CardDescription>
                Simulate a teacher checking in either within the 100m geofence range or outside bounds.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {simulateSuccess && (
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold mb-4">
                  Simulated check-in processed. See list below for geofence validation results!
                </div>
              )}
              
              <form onSubmit={handleSimulate} className="space-y-4">
                <Select
                  label="Select Teacher *"
                  options={teacherOptions}
                  value={selectedTeacherId}
                  onChange={(e) => handleTeacherChange(e.target.value)}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Current Latitude *"
                    type="number"
                    step="0.000001"
                    disabled={!selectedTeacherId}
                    value={mockLat}
                    onChange={(e) => setMockLat(e.target.value)}
                  />
                  <Input
                    label="Current Longitude *"
                    type="number"
                    step="0.000001"
                    disabled={!selectedTeacherId}
                    value={mockLng}
                    onChange={(e) => setMockLng(e.target.value)}
                  />
                </div>

              </form>
            </CardContent>
          </Card>

          {/* Interactive relative geofencing display */}
          <Card className="flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center">
                <MapPin className="mr-2 h-4.5 w-4.5 text-indigo-500" />
                Live Geofence Radar Canvas
              </CardTitle>
              <CardDescription>
                Visualizing clock-in point (Blue Navigation icon) relative to Center bounds (Target bullseye).
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col items-center justify-center p-4 relative min-h-[300px]">
              {selectedTeacherId && activeTeacher ? (
                <MapComponent 
                  targetLat={Number(activeTeacher.gpsTargetLocation?.latitude || 28.6139)}
                  targetLng={Number(activeTeacher.gpsTargetLocation?.longitude || 77.2090)}
                  mockLat={mockLat ? Number(mockLat) : undefined}
                  mockLng={mockLng ? Number(mockLng) : undefined}
                  radius={100}
                />
              ) : (
                <div className="w-full h-full min-h-[300px] rounded-lg border border-border/80 bg-secondary/15 flex flex-col items-center justify-center text-muted-foreground p-6 text-center">
                  <MapPin className="h-10 w-10 text-muted-foreground/40 mb-3" />
                  <p className="text-sm font-semibold">No Teacher Selected</p>
                  <p className="text-xs mt-1">Select a teacher from the simulator panel to view their assigned center location and clock-in simulations.</p>
                </div>
              )}

              {/* Offset diagnostics summary */}
              {selectedTeacherId && (
                <div className="mt-4 w-full grid grid-cols-2 gap-4 text-center border-t border-border/40 pt-4">
                  <div>
                    <span className="text-xxxxs uppercase tracking-wider font-bold text-muted-foreground">Range Offset</span>
                    <p className={`text-sm font-bold ${relativeOffset.verified ? 'text-emerald-500' : 'text-destructive'}`}>
                      {relativeOffset.distance} meters
                    </p>
                  </div>
                  <div>
                    <span className="text-xxxxs uppercase tracking-wider font-bold text-muted-foreground">Geofencing Status</span>
                    <div>
                      {relativeOffset.verified ? (
                        <Badge variant="success">IN BOUNDS</Badge>
                      ) : (
                        <Badge variant="destructive">OUT OF RANGE</Badge>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
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
