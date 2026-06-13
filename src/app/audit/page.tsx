'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldAlert, Database, History, CheckCircle, Terminal } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { useAppStore } from '@/lib/store';

export default function AuditPage() {
  const queryClient = useQueryClient();
  const { user } = useAppStore();
  const isAdmin = user?.role === 'Admin';
  
  const [backupLog, setBackupLog] = useState<string | null>(null);

  // 1. Fetch Audit Logs
  const { data: auditData, isLoading } = useQuery({
    queryKey: ['auditLogs'],
    queryFn: async () => {
      const res = await fetch('/api/audit');
      if (!res.ok) throw new Error('Error loading audit reports');
      return res.json();
    },
    enabled: isAdmin,
  });

  // Backup Mutation
  const backupMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/audit', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to run backup snapshot');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
      setBackupLog(data.backupFile);
      setTimeout(() => setBackupLog(null), 6000);
    },
  });

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 max-w-md mx-auto">
          <ShieldAlert className="h-12 w-12 text-destructive animate-bounce" />
          <h2 className="text-lg font-bold text-foreground">Access Denied</h2>
          <p className="text-xs text-muted-foreground leading-normal">
            Only System Administrators have permissions to view system security audit trails and trigger database backups.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-full">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Audit Trails & Backups</h1>
          <p className="text-xs text-muted-foreground">
            Monitor admin panel interactions, user logins, data mutations, and run system snapshots.
          </p>
        </div>

        {/* Database backup control widget */}
        <Card className="border-indigo-500/25 bg-indigo-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center text-primary">
              <Database className="mr-2 h-4.5 w-4.5" />
              NGO Database Backups
            </CardTitle>
            <CardDescription>
              Generate instant snapshots of the current JSON database files for local safety audits.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {backupLog && (
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center">
                <CheckCircle className="mr-2 h-4 w-4" />
                Snapshot generated: <span className="font-mono ml-1 bg-emerald-500/10 px-2 py-0.5 rounded">{backupLog}</span>
              </div>
            )}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <p className="text-xs text-muted-foreground max-w-xl">
                Backup snapshots are saved securely in the <code className="px-1.5 py-0.5 bg-secondary/80 rounded font-mono text-xxs">src/data/backups/</code> directory. You can download and restore from these files directly at any time.
              </p>
              <Button
                onClick={() => backupMutation.mutate()}
                isLoading={backupMutation.isPending}
                className="h-10 font-bold text-xs bg-indigo-500 hover:bg-indigo-600 flex-shrink-0"
              >
                Trigger System Backup
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card className="p-0 overflow-hidden">
          <CardHeader className="p-5 pb-3 border-b border-border/40">
            <CardTitle className="text-sm font-bold flex items-center">
              <History className="mr-2 h-4.5 w-4.5 text-primary" />
              Chronological Security logs
            </CardTitle>
            <CardDescription>System transaction logs for active admins and coordinators</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex h-60 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : !auditData?.logs || auditData.logs.length === 0 ? (
              <p className="text-center py-10 text-xs text-muted-foreground">No security logs recorded yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-bold">User</TableHead>
                    <TableHead className="text-xs font-bold">Action</TableHead>
                    <TableHead className="text-xs font-bold">Details</TableHead>
                    <TableHead className="text-xs font-bold">Client IP</TableHead>
                    <TableHead className="text-xs font-bold">Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditData.logs.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell className="py-3 font-semibold text-xs text-foreground flex items-center space-x-1.5">
                        <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{log.userName}</span>
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge
                          variant={
                            log.action.includes('Backup')
                              ? 'info'
                              : log.action.includes('Delete')
                              ? 'destructive'
                              : log.action.includes('Create') || log.action.includes('Log')
                              ? 'success'
                              : 'default'
                          }
                          className="font-bold text-xxxxs py-0.5 tracking-wide uppercase"
                        >
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 text-xs text-muted-foreground max-w-sm truncate">
                        {log.details}
                      </TableCell>
                      <TableCell className="py-3 text-xxs font-mono text-muted-foreground/80">
                        {log.ipAddress}
                      </TableCell>
                      <TableCell className="py-3 text-xxs text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString()}
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
