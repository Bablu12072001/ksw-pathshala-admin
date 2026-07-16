'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, UserCheck, Check, X, ShieldAlert, Users, CalendarCheck, MapPin, Building, BookOpen } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PageTabs } from '@/components/layout/page-tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { studentsService, teachersService, attendanceService, classesService } from '@/services';

export default function AttendancePage() {
  const queryClient = useQueryClient();

  // Control state variables
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [entityType, setEntityType] = useState<'Student' | 'Teacher'>('Student');
  const [gradeFilter, setGradeFilter] = useState(''); // filter students by grade to simplify roll call
  
  // Local checklist draft state
  const [attendanceDraft, setAttendanceDraft] = useState<{ [entityId: string]: 'Present' | 'Absent' }>({});
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // 1. Fetch Students via Axios admin API
  const { data: studentsData, isLoading: loadingStudents } = useQuery({
    queryKey: ['attendanceStudents', gradeFilter],
    queryFn: () =>
      studentsService.getAll({ grade: gradeFilter, status: 'Approved' }).then((r) => r.data),
    enabled: entityType === 'Student',
  });

  // 2. Fetch Teachers via Axios admin API
  const { data: teachersData, isLoading: loadingTeachers } = useQuery({
    queryKey: ['attendanceTeachers'],
    queryFn: () => teachersService.getAll({ status: 'Approved' }).then((r) => r.data),
    enabled: entityType === 'Teacher',
  });

  // 3. Fetch existing attendance records
  const { data: existingRecordsData, isLoading: loadingExisting } = useQuery({
    queryKey: ['existingAttendance', selectedDate, entityType],
    queryFn: () =>
      attendanceService.getByDate(selectedDate, entityType).then((r) => r.data),
  });

  // 4. Fetch Classes for dropdown
  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classesService.getAll().then((r) => r.data),
  });

  // Sync draft from DB records or set defaults when database records update
  useEffect(() => {
    const draft: { [id: string]: 'Present' | 'Absent' } = {};

    // First populate defaults (Present)
    if (entityType === 'Student' && studentsData?.students) {
      studentsData.students.forEach((s: any) => {
        draft[s.id] = 'Present';
      });
    } else if (entityType === 'Teacher' && teachersData?.teachers) {
      teachersData.teachers.forEach((t: any) => {
        draft[t.id] = 'Present';
      });
    }

    // Overwrite with existing database records if they exist
    const records = Array.isArray(existingRecordsData) ? existingRecordsData : (existingRecordsData?.records || []);
    if (records.length > 0) {
      records.forEach((rec: any) => {
        draft[rec.refId || rec.entityId] = rec.status;
      });
    }

    setAttendanceDraft(draft);
    setSaveSuccess(false);
  }, [studentsData, teachersData, existingRecordsData, entityType]);

  // Submit Mutation via Axios admin API
  const submitMutation = useMutation({
    mutationFn: (payload: any) => attendanceService.submit(payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['existingAttendance'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  // Toggle checklist status
  const toggleStatus = (id: string) => {
    setAttendanceDraft((prev) => ({
      ...prev,
      [id]: prev[id] === 'Present' ? 'Absent' : 'Present',
    }));
  };

  const setAllStatus = (status: 'Present' | 'Absent') => {
    const nextDraft = { ...attendanceDraft };
    Object.keys(nextDraft).forEach((key) => {
      nextDraft[key] = status;
    });
    setAttendanceDraft(nextDraft);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ensure we send records for all active entities, not just the ones explicitly toggled
    const records = activeList.map((entity: any) => ({
      refId: entity.id,
      entityType: entityType,
      status: attendanceDraft[entity.id] || 'Present',
    }));

    submitMutation.mutate({
      date: selectedDate,
      records,
    });
  };

  const activeList = entityType === 'Student' ? studentsData?.students || [] : teachersData?.teachers || [];
  const isLoading = loadingStudents || loadingTeachers || loadingExisting;

  // Stats calculation
  const totalInList = activeList.length;
  const presentCount = Object.values(attendanceDraft).filter((s) => s === 'Present').length;
  const absentCount = Object.values(attendanceDraft).filter((s) => s === 'Absent').length;
  const rate = totalInList > 0 ? Math.round((presentCount / totalInList) * 100) : 100;

  const classesList = Array.isArray(classesData) ? classesData : (classesData?.items || classesData?.classes || []);
  const uniqueClassNames = Array.from(new Set(classesList.map((c: any) => c.name)));
  const dynamicClassOptions = uniqueClassNames.map((name: any) => ({ label: name, value: name }));

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-full">
        {/* Header & Tabs */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
          <div className="flex-1 w-full">
            <PageTabs 
              title="Attendance Registry" 
              description="Register daily school student roll calls and teacher workspace attendance."
              tabs={[
                { title: 'Student Directory', path: '/students', icon: Users },
                { title: 'Attendance', path: '/attendance', icon: CalendarCheck },
                { title: 'Branches', path: '/branches', icon: Building }
              ]}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-9 w-40 text-xs font-semibold py-1 bg-card shadow-sm border-border"
            />
          </div>
        </div>

        {/* Configurations Toolbar */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Main entity selector cards */}
          <Card className="md:col-span-2 p-3.5 flex items-center space-x-3">
            <div className="grid grid-cols-2 gap-2 w-full p-1 bg-secondary/35 rounded-lg border border-border/40">
              <button
                onClick={() => setEntityType('Student')}
                className={`py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  entityType === 'Student' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Student Roll Call
              </button>
              <button
                onClick={() => setEntityType('Teacher')}
                className={`py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  entityType === 'Teacher' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Teacher Clock-ins
              </button>
            </div>
            
            {entityType === 'Student' && (
              <Select
                options={[{ label: 'All Classes', value: '' }, ...dynamicClassOptions]}
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className="h-10 text-xs w-44"
              />
            )}
          </Card>

          {/* Quick stats panel */}
          <Card className="p-3.5 flex items-center justify-around text-center">
            <div>
              <div className="text-xl font-bold text-foreground">{presentCount}</div>
              <div className="text-xxxxs font-bold text-emerald-500 uppercase tracking-wider">Present</div>
            </div>
            <div className="border-l border-border h-8" />
            <div>
              <div className="text-xl font-bold text-foreground">{absentCount}</div>
              <div className="text-xxxxs font-bold text-destructive uppercase tracking-wider">Absent</div>
            </div>
            <div className="border-l border-border h-8" />
            <div>
              <div className="text-xl font-bold text-primary">{rate}%</div>
              <div className="text-xxxxs font-bold text-muted-foreground uppercase tracking-wider">Rate</div>
            </div>
          </Card>
        </div>

        {saveSuccess && (
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center">
            <Check className="mr-2 h-4 w-4" />
            Attendance list saved successfully and student database updated!
          </div>
        )}

        {/* Registry checklist Table */}
        <Card className="p-0 overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex h-60 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : activeList.length === 0 ? (
              <div className="text-center py-16 text-xs text-muted-foreground flex flex-col items-center">
                <ShieldAlert className="h-8 w-8 text-amber-500 mb-2" />
                No active approved profiles found for this selection.
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs font-bold">Name</TableHead>
                        <TableHead className="text-xs font-bold">
                          {entityType === 'Student' ? 'Guardian & Phone' : 'Assigned Class'}
                        </TableHead>
                        <TableHead className="text-xs font-bold">Status Badge</TableHead>
                        <TableHead className="text-xs font-bold text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              type="button"
                              onClick={() => setAllStatus('Present')}
                              className="text-xxxxs font-bold uppercase tracking-wider text-emerald-500 hover:underline cursor-pointer"
                            >
                              All Present
                            </button>
                            <span className="text-muted-foreground">|</span>
                            <button
                              type="button"
                              onClick={() => setAllStatus('Absent')}
                              className="text-xxxxs font-bold uppercase tracking-wider text-destructive hover:underline cursor-pointer"
                            >
                              All Absent
                            </button>
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(() => {
                        const paginatedList = activeList.slice((currentPage - 1) * 10, currentPage * 10);
                        return paginatedList.map((entity: any) => {
                          const isPresent = attendanceDraft[entity.id] === 'Present';
                          return (
                            <TableRow key={entity.id}>
                              <TableCell className="py-3 font-semibold text-xs text-foreground">
                                {entity.fullName || entity.name}
                              </TableCell>
                              <TableCell className="py-3 text-xs text-muted-foreground">
                                {entityType === 'Student' ? entity.guardianName : entity.assignedClass}
                              </TableCell>
                              <TableCell className="py-3">
                                <Badge variant={isPresent ? 'success' : 'destructive'}>
                                  {attendanceDraft[entity.id] || 'Present'}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-3 text-right">
                                <div className="flex items-center justify-end space-x-1.5">
                                  <button
                                    type="button"
                                    onClick={() => toggleStatus(entity.id)}
                                    className={`h-8 px-3.5 text-xxs font-bold rounded-lg border transition-all cursor-pointer flex items-center ${
                                      isPresent
                                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                                        : 'bg-destructive/10 border-destructive/20 text-destructive hover:bg-destructive/20'
                                    }`}
                                  >
                                    {isPresent ? (
                                      <>
                                        <Check className="mr-1 h-3.5 w-3.5" />
                                        Present
                                      </>
                                    ) : (
                                      <>
                                        <X className="mr-1 h-3.5 w-3.5" />
                                        Absent
                                      </>
                                    )}
                                  </button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        });
                      })()}
                    </TableBody>
                  </Table>
                </div>
                <Pagination
                  currentPage={currentPage}
                  totalItems={activeList.length}
                  onPageChange={setCurrentPage}
                />
                <div className="p-4 border-t border-border flex justify-end bg-secondary/10">
                  <Button
                    type="submit"
                    className="h-10 font-bold px-6"
                    isLoading={submitMutation.isPending}
                  >
                    Submit Attendance Sheet
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
