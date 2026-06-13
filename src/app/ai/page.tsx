'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BrainCircuit, AlertTriangle, TrendingUp, Sparkles, UserCheck } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { LineChart } from '@/components/charts';

export default function AiPage() {
  // 1. Fetch AI analytics data
  const { data: aiData, isLoading } = useQuery({
    queryKey: ['aiAnalytics'],
    queryFn: async () => {
      const res = await fetch('/api/ai');
      if (!res.ok) throw new Error('Error loading AI insights');
      return res.json();
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-full">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center animate-pulse">
            <BrainCircuit className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">AI Analytics Dashboard</h1>
            <p className="text-xs text-muted-foreground">
              Automated donor forecasting models, attendance warnings, and student recommendation guides.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-96 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : !aiData ? (
          <div className="text-center py-16 text-xs text-muted-foreground">
            Error loading AI predictions. Check server logs.
          </div>
        ) : (
          <div className="space-y-6">
            {/* 1. Donation Prediction Forecast */}
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="md:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center">
                    <TrendingUp className="mr-2 h-4.5 w-4.5 text-emerald-500" />
                    Fundraising Regression Forecasting (INR)
                  </CardTitle>
                  <CardDescription>
                    Statistical trend lines forecasting future donor amounts.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <LineChart
                    data={aiData.donationPredictions}
                    xKey="month"
                    yKey="amount"
                    label="Donation Trend (₹)"
                  />
                </CardContent>
              </Card>

              {/* Anomalies Alert Box */}
              <Card className="flex flex-col h-full">
                <CardHeader className="pb-2 border-b border-border/40">
                  <CardTitle className="text-sm font-bold flex items-center text-destructive">
                    <AlertTriangle className="mr-2 h-4.5 w-4.5" />
                    Attendance Anomalies ({aiData.studentAnomalies.length})
                  </CardTitle>
                  <CardDescription>
                    Automated flags for students displaying irregular attendance patterns.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4 flex-1 overflow-y-auto space-y-3.5">
                  {aiData.studentAnomalies.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6">
                      No active anomalies detected this week.
                    </p>
                  ) : (
                    aiData.studentAnomalies.map((anom: any) => (
                      <div
                        key={anom.id}
                        className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 flex flex-col space-y-1"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-xs text-foreground">{anom.name}</span>
                          <Badge variant="destructive" className="font-semibold text-xxxxs py-0.5 uppercase tracking-wide">
                            {anom.rate}% Rate
                          </Badge>
                        </div>
                        <p className="text-xxs text-muted-foreground">{anom.reason}</p>
                        <span className="text-xxs text-primary font-semibold pt-1">Action: Send WhatsApp alert</span>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* 2. Automated Student Progress Insights */}
            <Card>
              <CardHeader className="pb-3 border-b border-border/40">
                <CardTitle className="text-sm font-bold flex items-center">
                  <Sparkles className="mr-2 h-4.5 w-4.5 text-primary animate-pulse" />
                  Diagnostic Student Progress Insights
                </CardTitle>
                <CardDescription>
                  AI-generated advisor recommendation matrix based on attendance and child sponsor states.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs font-bold">Student Name</TableHead>
                      <TableHead className="text-xs font-bold">Class</TableHead>
                      <TableHead className="text-xs font-bold">Attendance</TableHead>
                      <TableHead className="text-xs font-bold">Analysis Tag</TableHead>
                      <TableHead className="text-xs font-bold">Recommended Action Pathway</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {aiData.progressInsights.map((insight: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell className="py-3 font-semibold text-xs text-foreground">
                          {insight.studentName}
                        </TableCell>
                        <TableCell className="py-3 text-xs text-muted-foreground">
                          {insight.grade}
                        </TableCell>
                        <TableCell className="py-3 text-xs font-bold text-indigo-500">
                          {insight.attendancePercentage}%
                        </TableCell>
                        <TableCell className="py-3">
                          <Badge
                            variant={
                              insight.focusArea === 'High performer'
                                ? 'success'
                                : insight.focusArea === 'Risk alert'
                                ? 'destructive'
                                : 'default'
                            }
                          >
                            {insight.focusArea}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 text-xxs font-medium text-muted-foreground">
                          <div className="flex items-center space-x-1.5">
                            <UserCheck className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                            <span>{insight.recommendation}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
