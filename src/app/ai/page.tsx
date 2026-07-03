'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BrainCircuit, AlertTriangle, TrendingUp, Sparkles, Lightbulb } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { dashboardService } from '@/services';

export default function AiPage() {
  // 1. Fetch AI analytics via Axios admin API
  const { data: aiData, isLoading } = useQuery({
    queryKey: ['aiAnalytics'],
    queryFn: () => dashboardService.getAiInsights().then((r) => r.data),
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
            <div className="grid gap-6 md:grid-cols-3">
              {/* 1. Donation Prediction Forecast (Metric Card instead of Chart) */}
              <Card className="md:col-span-1 flex flex-col justify-center bg-emerald-500/5 border-emerald-500/20 shadow-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center text-emerald-600 dark:text-emerald-400">
                    <TrendingUp className="mr-2 h-4.5 w-4.5" />
                    Fundraising Forecast
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-black text-foreground mb-3">
                    ₹{aiData.donationTrendForecast?.nextMonthInflowPrediction?.toLocaleString() || '0'}
                  </div>
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 px-2.5 py-1.5 rounded-md inline-block">
                    {aiData.donationTrendForecast?.growthRate || 'Data unavailable'}
                  </p>
                </CardContent>
              </Card>

              {/* Anomalies Alert Box */}
              <Card className="md:col-span-2 flex flex-col h-full shadow-none border-border/60">
                <CardHeader className="pb-2 border-b border-border/40">
                  <CardTitle className="text-sm font-bold flex items-center text-destructive">
                    <AlertTriangle className="mr-2 h-4.5 w-4.5" />
                    Attendance Anomalies ({(aiData.attendanceAnomalies || []).length})
                  </CardTitle>
                  <CardDescription>
                    Automated flags for students displaying irregular attendance patterns.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4 flex-1 overflow-y-auto space-y-3.5 max-h-[300px]">
                  {(aiData.attendanceAnomalies || []).length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6">
                      No active anomalies detected this week.
                    </p>
                  ) : (
                    (aiData.attendanceAnomalies || []).map((anom: any, idx: number) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-destructive/20 bg-destructive/5 p-3.5 flex flex-col space-y-2.5"
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-2.5">
                            <span className="font-bold text-sm text-foreground">{anom.name}</span>
                            <Badge variant="outline" className="text-xxxxs bg-background/50 border-border/60">{anom.grade}</Badge>
                            <span className="text-xxs text-muted-foreground font-medium hidden sm:inline-block">{anom.slum}</span>
                          </div>
                          <Badge variant="destructive" className="font-bold text-xs px-2 py-0.5">
                            {anom.attendance}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground border-l-2 border-destructive/40 pl-2.5 leading-relaxed">
                          <span className="font-semibold text-destructive/80">Flagged Issue:</span> {anom.issueFlagged}
                        </p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* 2. Automated Student Progress Insights (Pathway Suggestions) */}
            <Card className="shadow-none border-border/60">
              <CardHeader className="pb-3 border-b border-border/40">
                <CardTitle className="text-sm font-bold flex items-center">
                  <Sparkles className="mr-2 h-4.5 w-4.5 text-primary animate-pulse" />
                  AI Pathway Suggestions
                </CardTitle>
                <CardDescription>
                  Actionable insights generated by the AI advisor to improve operational efficiency.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {(aiData.pathwaySuggestions || []).length === 0 ? (
                   <p className="text-xs text-muted-foreground text-center py-6">No AI suggestions available right now.</p>
                ) : (
                  (aiData.pathwaySuggestions || []).map((suggestion: string, idx: number) => {
                    const isResource = suggestion.toLowerCase().includes('resource');
                    return (
                      <div key={idx} className="flex items-start space-x-3.5 p-3.5 rounded-lg border border-border/40 bg-secondary/10 hover:bg-secondary/30 transition-colors">
                        <div className={`mt-0.5 p-1.5 rounded-full ${isResource ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary'}`}>
                          <Lightbulb className="h-4.5 w-4.5" />
                        </div>
                        <p className="text-sm font-medium text-foreground leading-relaxed">
                          {suggestion.replace('💡', '').trim()}
                        </p>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
