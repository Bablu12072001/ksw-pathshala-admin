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

export default function GpsPage() {
  const queryClient = useQueryClient();
  
  // Simulation states
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [mockLat, setMockLat] = useState('');
  const [mockLng, setMockLng] = useState('');
  const [simulateSuccess, setSimulateSuccess] = useState(false);

  // 1. Fetch GPS logs and approved teachers list
  const { data: gpsData, isLoading } = useQuery({
    queryKey: ['gpsLogs'],
    queryFn: async () => {
      const res = await fetch('/api/gps');
      if (!res.ok) throw new Error('Failed to fetch GPS records');
      return res.json();
    },
  });

  // Clock-in mutation
  const clockInMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/gps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Clock-in post failed');
      return res.json();
    },
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
    const teacher = gpsData?.teachers?.find((t: any) => t.id === id);
    if (teacher) {
      setMockLat(String(teacher.location.latitude));
      setMockLng(String(teacher.location.longitude));
    } else {
      setMockLat('');
      setMockLng('');
    }
  };

  // Alter coordinates slightly to simulate distance offsets
  const applyOffset = (meters: number) => {
    const teacher = gpsData?.teachers?.find((t: any) => t.id === selectedTeacherId);
    if (!teacher) return;
    
    // Roughly, 0.00001 degrees is ~1.1 meters
    const offset = (meters / 1.1) * 0.00001;
    setMockLat(String(teacher.location.latitude + offset));
    setMockLng(String(teacher.location.longitude + offset));
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

  const teacherOptions = gpsData?.teachers
    ? [
        { label: 'Select Active Teacher...', value: '' },
        ...gpsData.teachers.map((t: any) => ({ label: `${t.name} (${t.location.classroomName})`, value: t.id })),
      ]
    : [{ label: 'Select Active Teacher...', value: '' }];

  const activeTeacher = gpsData?.teachers?.find((t: any) => t.id === selectedTeacherId);
  
  // Calculate offset vector for map visualization
  let relativeOffset = { x: 0, y: 0, distance: 0, verified: true };
  if (activeTeacher && mockLat && mockLng) {
    const latDiff = Number(mockLat) - activeTeacher.location.latitude;
    const lngDiff = Number(mockLng) - activeTeacher.location.longitude;
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

                {selectedTeacherId && (
                  <div className="space-y-2">
                    <label className="text-xxs font-bold text-muted-foreground uppercase tracking-wide">
                      Simulate Location Offsets
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => applyOffset(10)}
                        className="text-xxs py-1 h-auto cursor-pointer"
                      >
                        Near (10 meters)
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => applyOffset(90)}
                        className="text-xxs py-1 h-auto cursor-pointer"
                      >
                        Boundary (90m)
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => applyOffset(450)}
                        className="text-xxs py-1 h-auto text-destructive border-destructive/35 hover:bg-destructive/15 cursor-pointer"
                      >
                        Breach (450m)
                      </Button>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-10 font-bold"
                  disabled={!selectedTeacherId}
                  isLoading={clockInMutation.isPending}
                >
                  <Navigation className="mr-1.5 h-4 w-4" />
                  Trigger Clock-in Event
                </Button>
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
            <CardContent className="flex-1 flex flex-col items-center justify-center p-6 relative">
              <div className="w-full max-w-[280px] h-[220px] rounded-lg border border-border/80 bg-secondary/15 relative overflow-hidden flex items-center justify-center">
                {/* Target Bullseye Center */}
                <div className="h-6 w-6 rounded-full bg-indigo-500/10 border-2 border-indigo-500 flex items-center justify-center z-10 shadow-lg">
                  <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                </div>
                
                {/* Geofence fence bounds (100 meters) */}
                <div className="absolute h-[120px] w-[120px] rounded-full border-2 border-dashed border-emerald-500/35 bg-emerald-500/5 animate-pulse" />

                {/* Simulated Location Point */}
                {selectedTeacherId && (
                  <div
                    className="absolute z-20 flex flex-col items-center transition-all duration-300"
                    style={{
                      transform: `translate(${relativeOffset.x}px, ${relativeOffset.y}px)`,
                    }}
                  >
                    <Navigation className={`h-5 w-5 fill-current ${relativeOffset.verified ? 'text-primary' : 'text-destructive'} transform rotate-45 animate-bounce`} />
                  </div>
                )}
                
                {/* Scale Grid Overlay */}
                <div className="absolute bottom-1 right-2 text-xxxxs text-muted-foreground/60">
                  Radius circle = 100 meters
                </div>
              </div>

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
            ) : !gpsData?.logs || gpsData.logs.length === 0 ? (
              <p className="text-center text-xs py-10 text-muted-foreground">No check-in logs today.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-bold">Teacher</TableHead>
                    <TableHead className="text-xs font-bold">Date / Time</TableHead>
                    <TableHead className="text-xs font-bold">Coordinates</TableHead>
                    <TableHead className="text-xs font-bold">Variance</TableHead>
                    <TableHead className="text-xs font-bold">Validation</TableHead>
                    <TableHead className="text-xs font-bold">Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gpsData.logs.map((log: any) => (
                    <TableRow key={log.id} className={log.verified ? '' : 'bg-red-500/5'}>
                      <TableCell className="py-3 font-semibold text-xs text-foreground">
                        {log.teacherName}
                      </TableCell>
                      <TableCell className="py-3 text-xs">
                        <div>{log.date}</div>
                        <div className="text-xxs text-muted-foreground">{log.clockInTime}</div>
                      </TableCell>
                      <TableCell className="py-3 text-xxs font-mono text-muted-foreground">
                        {log.coords.latitude.toFixed(5)}, {log.coords.longitude.toFixed(5)}
                      </TableCell>
                      <TableCell className={`py-3 text-xs font-bold ${log.verified ? 'text-emerald-500' : 'text-destructive'}`}>
                        {log.distanceMeters}m
                      </TableCell>
                      <TableCell className="py-3">
                        {log.verified ? (
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
                        {log.remarks}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
