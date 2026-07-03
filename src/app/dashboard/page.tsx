'use client';

import React, { useState } from 'react';
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
  ChevronDown,
  ChevronUp,
  Sparkles,
  Lightbulb,
  AlertTriangle
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { LineChart, BarChart } from '@/components/charts';
import { useAppStore } from '@/lib/store';
import { dashboardService, studentsService, teachersService, volunteersService } from '@/services';

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { user } = useAppStore();
  const isSponsor = user?.role === 'Sponsor';

  const [showAllFeed, setShowAllFeed] = useState(false);

  // 1. Fetch dashboard data via Axios admin API
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => dashboardService.getStats().then((r) => r.data),
  });

  const { data: aiInsights, isLoading: isAiLoading } = useQuery({
    queryKey: ['aiInsights'],
    queryFn: () => dashboardService.getAiInsights().then((r) => r.data),
  });

  // 2. Quick Approval mutations via Axios admin API
  const approveStudentMutation = useMutation({
    mutationFn: (studentId: string) =>
      studentsService.update(studentId, { status: 'Approved' }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });

  const approveTeacherMutation = useMutation({
    mutationFn: (teacherId: string) =>
      teachersService.update(teacherId, { status: 'Approved' }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
    },
  });

  const approveVolunteerMutation = useMutation({
    mutationFn: (volunteer: any) => {
      const payload: any = { status: 'approved' };
      if (volunteer.referredByCode) {
        payload.referralPoints = 50;
      }
      return volunteersService.update(volunteer.id, payload).then((r) => r.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['volunteersList'] });
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

  const {
    summary = {
      students: 0,
      teachers: 0,
      sponsors: 0,
      totalContributions: 0,
      attendanceToday: 0,
      overallAttendancePercentage: 0
    },
    donationGrowth = [],
    attendanceStats = { byClass: [] },
    recentClassroomFeed = [],
    approvalQueue = { students: [], teachers: [], volunteers: [] },
  } = dashboardData || {};

  const displayedFeed = showAllFeed ? recentClassroomFeed : recentClassroomFeed.slice(0, 3);

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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* Total Students */}
          <Card className="h-full flex flex-col justify-between hover:shadow-lg transition-all duration-300 relative overflow-hidden group border-indigo-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 mb-0 relative z-10">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Total Students
              </CardTitle>
              <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shadow-sm">
                <Users className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-extrabold text-foreground">{summary?.students || 0}</div>
              <div className="flex items-center text-xs font-semibold text-emerald-500 mt-1.5 bg-emerald-500/10 w-fit px-2 py-0.5 rounded-full">
                <TrendingUp className="h-3.5 w-3.5 mr-1" />
                <span>Active Roster</span>
              </div>
            </CardContent>
          </Card>

          {/* Total Teachers */}
          <Card className="h-full flex flex-col justify-between hover:shadow-lg transition-all duration-300 relative overflow-hidden group border-emerald-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 mb-0 relative z-10">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Total Teachers
              </CardTitle>
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shadow-sm">
                <GraduationCap className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-extrabold text-foreground">{summary?.teachers || 0}</div>
              <div className="flex items-center text-xs font-semibold text-emerald-500 mt-1.5 bg-emerald-500/10 w-fit px-2 py-0.5 rounded-full">
                <TrendingUp className="h-3.5 w-3.5 mr-1" />
                <span>Active Faculty</span>
              </div>
            </CardContent>
          </Card>

          {/* Active Sponsors */}
          <Card className="h-full flex flex-col justify-between hover:shadow-lg transition-all duration-300 relative overflow-hidden group border-purple-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 mb-0 relative z-10">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Active Sponsors
              </CardTitle>
              <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center shadow-sm">
                <Heart className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-extrabold text-foreground">{summary?.sponsors || 0}</div>
              <p className="text-xs text-muted-foreground font-medium mt-1.5 leading-relaxed">
                Direct child sponsorship scheme
              </p>
            </CardContent>
          </Card>

          {/* Total Contributions */}
          <Card className="h-full flex flex-col justify-between hover:shadow-lg transition-all duration-300 relative overflow-hidden group border-amber-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 mb-0 relative z-10">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Total Contributions
              </CardTitle>
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shadow-sm">
                <TrendingUp className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-extrabold text-foreground">₹{(summary?.totalContributions || 0).toLocaleString('en-IN')}</div>
              <p className="text-xs text-muted-foreground font-medium mt-1.5 leading-relaxed">
                Verified fundraiser accounts this term
              </p>
            </CardContent>
          </Card>
          
          {/* Overall Attendance */}
          <Card className="h-full flex flex-col justify-between hover:shadow-lg transition-all duration-300 relative overflow-hidden group border-sky-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 mb-0 relative z-10">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Overall Attendance
              </CardTitle>
              <div className="h-8 w-8 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center shadow-sm">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-extrabold text-foreground">{summary?.overallAttendancePercentage || 0}%</div>
              <p className="text-xs text-muted-foreground font-medium mt-1.5 leading-relaxed">
                Average across all classes
              </p>
            </CardContent>
          </Card>
        </div>

        {/* AI Insights Section */}


        {/* 2. Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Donation Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold">Donation Growth (INR)</CardTitle>
              <CardDescription>Monthly contribution summary targets</CardDescription>
            </CardHeader>
            <CardContent>
              <BarChart data={donationGrowth} xKey="label" yKey="amount" label="Donations (₹)" />
            </CardContent>
          </Card>

          {/* Attendance Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold">Attendance Statistics (%)</CardTitle>
              <CardDescription>Average student attendance index weekly</CardDescription>
            </CardHeader>
            <CardContent>
              <LineChart data={attendanceStats?.byClass || []} xKey="gradeClass" yKey="percentage" label="Attendance %" />
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
                  Pending onboarding verification for new students, teachers, and volunteers
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  {(!approvalQueue.students?.length && !approvalQueue.teachers?.length && !approvalQueue.volunteers?.length) ? (
                    <div className="text-center py-8 text-xs text-muted-foreground">
                      <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500 mb-2" />
                      All onboarding applications verified!
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs font-bold">Profile</TableHead>
                          <TableHead className="text-xs font-bold">Name</TableHead>
                          <TableHead className="text-xs font-bold">Type</TableHead>
                          <TableHead className="text-xs font-bold">Date Submitted</TableHead>
                          {!isSponsor && <TableHead className="text-xs font-bold text-right">Action</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* Students approvals */}
                        {approvalQueue.students?.map((student: any) => (
                          <TableRow key={student.id}>
                            <TableCell className="py-2">
                              <div className="h-8 w-8 rounded-full overflow-hidden bg-secondary">
                                {student.profileImage ? (
                                  <img src={student.profileImage} alt={student.fullName} className="h-full w-full object-cover" />
                                ) : (
                                  <Users className="h-4 w-4 m-auto mt-2 text-muted-foreground" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="py-3 font-semibold text-xs">{student.fullName || student.name}</TableCell>
                            <TableCell className="py-3">
                              <Badge variant="info">Student ({student.gradeClass || student.grade})</Badge>
                            </TableCell>
                            <TableCell className="py-3 text-xxs text-muted-foreground">
                              {new Date(student.created_at || student.joiningDate).toLocaleDateString()}
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
                        {approvalQueue.teachers?.map((teacher: any) => (
                          <TableRow key={teacher.id}>
                            <TableCell className="py-2">
                              <div className="h-8 w-8 rounded-full overflow-hidden bg-secondary">
                                {teacher.profileImage ? (
                                  <img src={teacher.profileImage} alt={teacher.fullName} className="h-full w-full object-cover" />
                                ) : (
                                  <GraduationCap className="h-4 w-4 m-auto mt-2 text-muted-foreground" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="py-3 font-semibold text-xs">{teacher.fullName || teacher.name}</TableCell>
                            <TableCell className="py-3">
                              <Badge variant="warning">Teacher</Badge>
                            </TableCell>
                            <TableCell className="py-3 text-xxs text-muted-foreground">
                              {new Date(teacher.created_at || teacher.joiningDate).toLocaleDateString()}
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

                        {/* Volunteer approvals */}
                        {approvalQueue.volunteers?.map((volunteer: any) => (
                          <TableRow key={volunteer.id}>
                            <TableCell className="py-2">
                              <div className="h-8 w-8 rounded-full overflow-hidden bg-secondary">
                                {volunteer.profileImage ? (
                                  <img src={volunteer.profileImage} alt={volunteer.fullName} className="h-full w-full object-cover" />
                                ) : (
                                  <Users className="h-4 w-4 m-auto mt-2 text-muted-foreground" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="py-3 font-semibold text-xs">{volunteer.fullName || volunteer.name}</TableCell>
                            <TableCell className="py-3">
                              <Badge variant="outline">Volunteer</Badge>
                            </TableCell>
                            <TableCell className="py-3 text-xxs text-muted-foreground">
                              {new Date(volunteer.created_at || volunteer.joiningDate).toLocaleDateString()}
                            </TableCell>
                            {!isSponsor && (
                              <TableCell className="py-3 text-right">
                                <Button
                                  variant="primary"
                                  size="sm"
                                  className="h-7 text-xxs font-bold"
                                  isLoading={approveVolunteerMutation.isPending}
                                  onClick={() => approveVolunteerMutation.mutate(volunteer)}
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
          </div>

          {/* Activities log tracker feed */}
          <div className="space-y-6">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-3 border-b border-border/40">
                <CardTitle className="text-sm font-bold flex items-center">
                  <Clock className="mr-2 h-4.5 w-4.5 text-primary animate-pulse" />
                  Recent Classroom Feed
                </CardTitle>
                <CardDescription>Activity updates reported from field classrooms</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4 flex-1">
                {recentClassroomFeed?.length === 0 ? (
                  <div className="text-center py-8 text-xs text-muted-foreground">
                    No recent activities.
                  </div>
                ) : (
                  displayedFeed?.map((act: any) => (
                    <div
                      key={act.id}
                      className="border border-border/40 rounded-lg p-3 bg-secondary/10 hover:bg-secondary/25 transition-all duration-200"
                    >
                      {act.mediaUrl && (
                        <div className="relative h-28 w-full rounded-md overflow-hidden mb-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={act.mediaUrl}
                            alt={act.title}
                            className="object-cover h-full w-full"
                            loading="lazy"
                          />
                        </div>
                      )}
                      <h4 className="text-xs font-bold text-foreground mb-1 leading-snug">{act.title}</h4>
                      <p className="text-xxs text-muted-foreground leading-normal mb-2">
                        {act.description}
                      </p>
                      <div className="flex items-center justify-between text-xxxxs font-bold text-muted-foreground/80 pt-2 border-t border-border/40">
                        <span>By: {act.author || act.teacherName}</span>
                        <span>{new Date(act.created_at || act.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}

                {recentClassroomFeed?.length > 3 && (
                  <Button
                    variant="ghost"
                    className="w-full text-xs mt-2"
                    onClick={() => setShowAllFeed(!showAllFeed)}
                  >
                    {showAllFeed ? (
                      <>Show Less <ChevronUp className="ml-1 h-3 w-3" /></>
                    ) : (
                      <>View More Activities <ChevronDown className="ml-1 h-3 w-3" /></>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

