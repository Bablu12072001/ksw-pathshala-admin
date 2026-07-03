'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileDown, FileSpreadsheet, FileText, CheckCircle, BarChart3 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { exportToExcel, exportToPDF } from '@/lib/export-utils';
import { studentsService, teachersService, donationsService, gpsService } from '@/services';

type ReportCategory = 'students' | 'teachers' | 'donations' | 'gps';

export default function ReportsPage() {
  const [category, setCategory] = useState<ReportCategory>('students');

  // Fetch report data via Axios admin API based on selection
  const { data, isLoading } = useQuery({
    queryKey: ['reportData', category],
    queryFn: async () => {
      if (category === 'teachers') return teachersService.getAll().then((r) => r.data);
      if (category === 'donations') return donationsService.getAll().then((r) => r.data);
      if (category === 'gps') return gpsService.getAll().then((r) => r.data);
      return studentsService.getAll().then((r) => r.data); // default: students
    },
  });

  // Action helpers to shape tables and triggers Excel/PDF downloads
  const handleExportExcel = () => {
    if (!data) return;

    if (category === 'students') {
      const rows = data.students.map((s: any) => ({
        ID: s.id,
        Name: s.name,
        Age: s.age,
        Gender: s.gender,
        Grade: s.grade,
        Guardian: s.guardianName,
        Phone: s.phone,
        Status: s.status,
        'Attendance %': s.attendancePercentage,
        Joined: s.joiningDate,
      }));
      exportToExcel(rows, 'KSW_Student_Registry');
    } else if (category === 'teachers') {
      const rows = data.teachers.map((t: any) => ({
        ID: t.id,
        Name: t.name,
        Email: t.email,
        Phone: t.phone,
        Degree: t.qualification,
        Class: t.assignedClass,
        Center: t.location.classroomName,
        Status: t.status,
        Joined: t.joiningDate,
      }));
      exportToExcel(rows, 'KSW_Teacher_Directory');
    } else if (category === 'donations') {
      const rows = data.donations.map((d: any) => ({
        ID: d.id,
        Donor: d.donorName,
        Email: d.email,
        Amount: d.amount,
        Category: d.type,
        Payment: d.paymentMethod,
        Date: d.date,
        Status: d.status,
      }));
      exportToExcel(rows, 'KSW_Donation_Ledger');
    } else if (category === 'gps') {
      const rows = data.logs.map((l: any) => ({
        ID: l.id,
        Teacher: l.teacherName,
        Date: l.date,
        Time: l.clockInTime,
        Latitude: l.coords.latitude,
        Longitude: l.coords.longitude,
        Variance: `${l.distanceMeters}m`,
        Verified: l.verified ? 'Yes' : 'No',
        Remarks: l.remarks,
      }));
      exportToExcel(rows, 'KSW_Teacher_GPS_Logs');
    }
  };

  const handleExportPDF = () => {
    if (!data) return;

    if (category === 'students') {
      const headers = ['Name', 'Grade', 'Age', 'Guardian', 'Phone', 'Status', 'Attendance'];
      const rows = data.students.map((s: any) => [
        s.name,
        s.grade,
        s.age,
        s.guardianName,
        s.phone,
        s.status,
        `${s.attendancePercentage}%`,
      ]);
      exportToPDF(headers, rows, 'KSW Pathshala Student Registry Report', 'KSW_Students_Report');
    } else if (category === 'teachers') {
      const headers = ['Name', 'Email', 'Phone', 'Class Assigned', 'Classroom Center', 'Status'];
      const rows = data.teachers.map((t: any) => [
        t.name,
        t.email,
        t.phone,
        t.assignedClass,
        t.location.classroomName,
        t.status,
      ]);
      exportToPDF(headers, rows, 'KSW Pathshala Teacher Registry Report', 'KSW_Teachers_Report');
    } else if (category === 'donations') {
      const headers = ['Donor Name', 'Amount', 'Donation Type', 'Payment Method', 'Date', 'Status'];
      const rows = data.donations.map((d: any) => [
        d.donorName,
        `Rs. ${d.amount}`,
        d.type,
        d.paymentMethod,
        d.date,
        d.status,
      ]);
      exportToPDF(headers, rows, 'KSW Pathshala Donations & Sponsorship Report', 'KSW_Donations_Report');
    } else if (category === 'gps') {
      const headers = ['Teacher Name', 'Date', 'Clock In', 'Variance (Meters)', 'Geofence'];
      const rows = data.logs.map((l: any) => [
        l.teacherName,
        l.date,
        l.clockInTime,
        `${l.distanceMeters}m`,
        l.verified ? 'VERIFIED' : 'BREACHED',
      ]);
      exportToPDF(headers, rows, 'KSW Pathshala Faculty GPS Clock-in Report', 'KSW_GPS_Report');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Reports & Exports Hub</h1>
            <p className="text-xs text-muted-foreground">
              Configure parameters to review logs and generate print-ready documents.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Select
              options={[
                { label: 'Student Admissions Registry', value: 'students' },
                { label: 'Teacher Directory', value: 'teachers' },
                { label: 'Donation & Sponsor Ledgers', value: 'donations' },
                { label: 'GPS Geofencing Audits', value: 'gps' },
              ]}
              value={category}
              onChange={(e) => setCategory(e.target.value as ReportCategory)}
              className="h-9 w-60 text-xs font-semibold py-1 bg-card shadow-sm border-border"
            />
          </div>
        </div>

        {/* Download Buttons Panel */}
        <Card className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold capitalize">{category} Document Export</h3>
              <p className="text-xxs text-muted-foreground">Download current rows to local storage files.</p>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button onClick={handleExportExcel} variant="outline" className="w-1/2 sm:w-auto h-10 text-xs font-semibold border-emerald-500/35 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <FileSpreadsheet className="mr-1.5 h-4 w-4" />
              Download Excel
            </Button>
            <Button onClick={handleExportPDF} className="w-1/2 sm:w-auto h-10 text-xs font-bold bg-indigo-500 hover:bg-indigo-600">
              <FileText className="mr-1.5 h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </Card>

        {/* Preview Container Table */}
        <Card className="p-0 overflow-hidden">
          <CardHeader className="p-5 pb-3 border-b border-border/40">
            <CardTitle className="text-sm font-bold flex items-center">
              <CheckCircle className="mr-1.5 h-4.5 w-4.5 text-emerald-500" />
              Report Data Preview Grid
            </CardTitle>
            <CardDescription>Previewing matching active database rows</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex h-60 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                {category === 'students' && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs font-bold">Name</TableHead>
                        <TableHead className="text-xs font-bold">Grade</TableHead>
                        <TableHead className="text-xs font-bold">Guardian</TableHead>
                        <TableHead className="text-xs font-bold">Contact</TableHead>
                        <TableHead className="text-xs font-bold">Status</TableHead>
                        <TableHead className="text-xs font-bold">Attendance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.students.map((s: any) => (
                        <TableRow key={s.id}>
                          <TableCell className="py-3 font-semibold text-xs text-foreground">{s.name}</TableCell>
                          <TableCell className="py-3 text-xs">{s.grade}</TableCell>
                          <TableCell className="py-3 text-xs">{s.guardianName}</TableCell>
                          <TableCell className="py-3 text-xs text-muted-foreground">{s.phone}</TableCell>
                          <TableCell className="py-3 text-xs">{s.status}</TableCell>
                          <TableCell className="py-3 text-xs font-bold text-indigo-500">{s.attendancePercentage}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                {category === 'teachers' && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs font-bold">Name</TableHead>
                        <TableHead className="text-xs font-bold">Email</TableHead>
                        <TableHead className="text-xs font-bold">Phone</TableHead>
                        <TableHead className="text-xs font-bold">Qualification</TableHead>
                        <TableHead className="text-xs font-bold">Assigned Class</TableHead>
                        <TableHead className="text-xs font-bold">Center</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.teachers.map((t: any) => (
                        <TableRow key={t.id}>
                          <TableCell className="py-3 font-semibold text-xs text-foreground">{t.name}</TableCell>
                          <TableCell className="py-3 text-xs">{t.email}</TableCell>
                          <TableCell className="py-3 text-xs text-muted-foreground">{t.phone}</TableCell>
                          <TableCell className="py-3 text-xs">{t.qualification}</TableCell>
                          <TableCell className="py-3 text-xs">{t.assignedClass}</TableCell>
                          <TableCell className="py-3 text-xs">{t.location.classroomName}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                {category === 'donations' && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs font-bold">Donor Name</TableHead>
                        <TableHead className="text-xs font-bold">Amount</TableHead>
                        <TableHead className="text-xs font-bold">Type</TableHead>
                        <TableHead className="text-xs font-bold">Payment Method</TableHead>
                        <TableHead className="text-xs font-bold">Date</TableHead>
                        <TableHead className="text-xs font-bold">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.donations.map((d: any) => (
                        <TableRow key={d.id}>
                          <TableCell className="py-3 font-semibold text-xs text-foreground">{d.donorName}</TableCell>
                          <TableCell className="py-3 text-xs font-bold">₹{d.amount.toLocaleString('en-IN')}</TableCell>
                          <TableCell className="py-3 text-xs">{d.type}</TableCell>
                          <TableCell className="py-3 text-xs text-muted-foreground">{d.paymentMethod}</TableCell>
                          <TableCell className="py-3 text-xs">{d.date}</TableCell>
                          <TableCell className="py-3 text-xs">{d.status}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                {category === 'gps' && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs font-bold">Teacher Name</TableHead>
                        <TableHead className="text-xs font-bold">Date / Time</TableHead>
                        <TableHead className="text-xs font-bold">Distance Variance</TableHead>
                        <TableHead className="text-xs font-bold">Geofence Verified</TableHead>
                        <TableHead className="text-xs font-bold">Remarks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.logs.map((l: any) => (
                        <TableRow key={l.id}>
                          <TableCell className="py-3 font-semibold text-xs text-foreground">{l.teacherName}</TableCell>
                          <TableCell className="py-3 text-xs">{l.date} / {l.clockInTime}</TableCell>
                          <TableCell className="py-3 text-xs font-bold text-destructive">{l.distanceMeters}m</TableCell>
                          <TableCell className="py-3 text-xs">{l.verified ? 'Yes' : 'No'}</TableCell>
                          <TableCell className="py-3 text-xxs text-muted-foreground">{l.remarks}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
