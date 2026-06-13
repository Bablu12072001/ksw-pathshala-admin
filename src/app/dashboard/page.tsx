'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  GraduationCap,
  Heart,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingDown,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { LineChart, BarChart } from '@/components/charts';
import { useAppStore } from '@/lib/store';

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { user } = useAppStore();
  const isSponsor = user?.role === 'Sponsor';

  // 1. Fetch dashboard data
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard');
      if (!res.ok) throw new Error('Failed to load dashboard statistics');
      return res.json();
    },
  });

  // 2. Setup Quick Approvals mutations
  const approveStudentMutation = useMutation({
    mutationFn: async (studentId: string) => {
      const res = await fetch(`/api/students?id=${studentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Approved' }),
      });
      if (!res.ok) throw new Error('Approval request failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      // Invalidate specific lists as well
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });

  const approveTeacherMutation = useMutation({
    mutationFn: async (teacherId: string) => {
      const res = await fetch(`/api/teachers?id=${teacherId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Approved' }),
      });
      if (!res.ok) throw new Error('Teacher approval failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-96 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !dashboardData) {
    return (
      <DashboardLayout>
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-center text-destructive">
          Error loading dashboard. Please check database permissions.
        </div>
      </DashboardLayout>
    );
  }

  const { kpis, approvalRequests, recentRegistrations, charts, recentActivities } = dashboardData;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-full">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Hello, {user?.name || 'Administrator'} 👋
            </h1>
            <p className="text-xs text-muted-foreground">
              Here is the updated overview of KSW Pathshala NGO.
            </p>
          </div>
          <div className="text-xs text-muted-foreground font-semibold bg-secondary/35 border border-border/50 rounded-lg px-3.5 py-1.5 glass-panel">
            Current Date: {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* 1. Stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Students */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 mb-0">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Total Students
              </CardTitle>
              <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                <Users className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.students.total}</div>
              <div className="flex items-center text-xxs font-semibold text-emerald-500 mt-1">
                <TrendingUp className="h-3.5 w-3.5 mr-0.5" />
                <span>{kpis.students.approved} Approved</span>
                <span className="text-muted-foreground/85 ml-1.5 font-normal">({kpis.students.pending} pending)</span>
              </div>
            </CardContent>
          </Card>

          {/* Total Teachers */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 mb-0">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Total Teachers
              </CardTitle>
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <GraduationCap className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.teachers.total}</div>
              <div className="flex items-center text-xxs font-semibold text-emerald-500 mt-1">
                <TrendingUp className="h-3.5 w-3.5 mr-0.5" />
                <span>{kpis.teachers.approved} Active</span>
                <span className="text-muted-foreground/85 ml-1.5 font-normal">({kpis.teachers.pending} pending)</span>
              </div>
            </CardContent>
          </Card>

          {/* Active Sponsors */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 mb-0">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Active Sponsors
              </CardTitle>
              <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
                <Heart className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.sponsors}</div>
              <p className="text-xxs text-muted-foreground mt-1">
                Direct child sponsorship scheme
              </p>
            </CardContent>
          </Card>

          {/* Total Donations */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 mb-0">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Total Contributions
              </CardTitle>
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <TrendingUp className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{kpis.donations.toLocaleString('en-IN')}</div>
              <p className="text-xxs text-muted-foreground mt-1">
                Verified fundraiser accounts this term
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 2. Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Donation Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold">Donation Growth (INR)</CardTitle>
              <CardDescription>Monthly contribution summary targets</CardDescription>
            </CardHeader>
            <CardContent>
              <BarChart data={charts.donations} xKey="month" yKey="amount" label="Donations (₹)" />
            </CardContent>
          </Card>

          {/* Attendance Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold">Attendance Statistics (%)</CardTitle>
              <CardDescription>Average student attendance index weekly</CardDescription>
            </CardHeader>
            <CardContent>
              <LineChart data={charts.attendance} xKey="week" yKey="rate" label="Attendance %" />
            </CardContent>
          </Card>
        </div>

        {/* 3. Approvals Grid and Recents */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Approval Requests Panel */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="pb-3 border-b border-border/40">
                <CardTitle className="text-sm font-bold flex items-center">
                  <AlertCircle className="mr-2 h-4.5 w-4.5 text-amber-500" />
                  Approval Queue Requests
                </CardTitle>
                <CardDescription>
                  Pending onboarding verification for new students and teachers
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  {approvalRequests.students.length === 0 && approvalRequests.teachers.length === 0 ? (
                    <div className="text-center py-8 text-xs text-muted-foreground">
                      <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500 mb-2" />
                      All onboarding applications verified!
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs font-bold">Name</TableHead>
                          <TableHead className="text-xs font-bold">Type</TableHead>
                          <TableHead className="text-xs font-bold">Date Submitted</TableHead>
                          {!isSponsor && <TableHead className="text-xs font-bold text-right">Action</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* Students approvals */}
                        {approvalRequests.students.map((student: any) => (
                          <TableRow key={student.id}>
                            <TableCell className="py-3 font-semibold text-xs">{student.name}</TableCell>
                            <TableCell className="py-3">
                              <Badge variant="info">Student ({student.grade})</Badge>
                            </TableCell>
                            <TableCell className="py-3 text-xxs text-muted-foreground">
                              {student.joiningDate}
                            </TableCell>
                            {!isSponsor && (
                              <TableCell className="py-3 text-right">
                                <Button
                                  variant="primary"
                                  size="sm"
                                  className="h-7 text-xxs font-bold"
                                  isLoading={approveStudentMutation.isPending}
                                  onClick={() => approveStudentMutation.mutate(student.id)}
                                >
                                  Approve
                                </Button>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}

                        {/* Teacher approvals */}
                        {approvalRequests.teachers.map((teacher: any) => (
                          <TableRow key={teacher.id}>
                            <TableCell className="py-3 font-semibold text-xs">{teacher.name}</TableCell>
                            <TableCell className="py-3">
                              <Badge variant="warning">Teacher</Badge>
                            </TableCell>
                            <TableCell className="py-3 text-xxs text-muted-foreground">
                              {teacher.joiningDate}
                            </TableCell>
                            {!isSponsor && (
                              <TableCell className="py-3 text-right">
                                <Button
                                  variant="primary"
                                  size="sm"
                                  className="h-7 text-xxs font-bold"
                                  isLoading={approveTeacherMutation.isPending}
                                  onClick={() => approveTeacherMutation.mutate(teacher.id)}
                                >
                                  Approve
                                </Button>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Registrations Table */}
            <Card>
              <CardHeader className="pb-3 border-b border-border/40">
                <CardTitle className="text-sm font-bold">Recent Registrations</CardTitle>
                <CardDescription>Latest student admissions added to directory</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs font-bold">Student Name</TableHead>
                      <TableHead className="text-xs font-bold">Grade</TableHead>
                      <TableHead className="text-xs font-bold">Status</TableHead>
                      <TableHead className="text-xs font-bold">Joining Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentRegistrations.map((student: any) => (
                      <TableRow key={student.id}>
                        <TableCell className="py-3 font-semibold text-xs">{student.name}</TableCell>
                        <TableCell className="py-3 text-xs">{student.grade}</TableCell>
                        <TableCell className="py-3">
                          <Badge variant={student.status === 'Approved' ? 'success' : 'warning'}>
                            {student.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 text-xxs text-muted-foreground">
                          {student.joiningDate}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Activities log tracker feed */}
          <div className="space-y-6">
            <Card className="h-full">
              <CardHeader className="pb-3 border-b border-border/40">
                <CardTitle className="text-sm font-bold flex items-center">
                  <Clock className="mr-2 h-4.5 w-4.5 text-primary animate-pulse" />
                  Recent Classroom Feed
                </CardTitle>
                <CardDescription>Activity updates reported from field classrooms</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {recentActivities.map((act: any) => (
                  <div
                    key={act.id}
                    className="border border-border/40 rounded-lg p-3 bg-secondary/10 hover:bg-secondary/25 transition-all duration-200"
                  >
                    {act.type === 'Photo' && act.mediaUrl && (
                      <div className="relative h-28 w-full rounded-md overflow-hidden mb-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={act.mediaUrl}
                          alt={act.title}
                          className="object-cover h-full w-full"
                        />
                      </div>
                    )}
                    <h4 className="text-xs font-bold text-foreground mb-1 leading-snug">{act.title}</h4>
                    <p className="text-xxs text-muted-foreground leading-normal mb-2">
                      {act.description}
                    </p>
                    <div className="flex items-center justify-between text-xxxxs font-bold text-muted-foreground/80 pt-2 border-t border-border/40">
                      <span>By: {act.teacherName}</span>
                      <span>{act.date}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
