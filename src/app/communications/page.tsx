'use client';

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Megaphone, Users, User, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { notificationsService } from '@/services';

export default function CommunicationsPage() {
  const [activeTab, setActiveTab] = useState<'topic' | 'user'>('topic');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Topic Form State
  const [topicTarget, setTopicTarget] = useState('teachers');
  const [topicTitle, setTopicTitle] = useState('');
  const [topicBody, setTopicBody] = useState('');
  const [topicScreen, setTopicScreen] = useState('home');

  // User Form State
  const [userType, setUserType] = useState('teacher');
  const [userId, setUserId] = useState('');
  const [userTitle, setUserTitle] = useState('');
  const [userBody, setUserBody] = useState('');
  const [userScreen, setUserScreen] = useState('profile');

  const sendMutation = useMutation({
    mutationFn: (payload: any) => notificationsService.send(payload),
    onSuccess: () => {
      setSuccessMsg('Push notification sent successfully!');
      setErrorMsg('');
      setTimeout(() => setSuccessMsg(''), 5000);
      
      // Reset forms
      setTopicTitle('');
      setTopicBody('');
      setUserId('');
      setUserTitle('');
      setUserBody('');
    },
    onError: (err: any) => {
      setErrorMsg(err?.response?.data?.error || 'Failed to send notification. Please try again.');
      setSuccessMsg('');
    }
  });

  const handleSendTopic = (e: React.FormEvent) => {
    e.preventDefault();
    sendMutation.mutate({
      target: topicTarget,
      title: topicTitle,
      body: topicBody,
      data: {
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
        screen: topicScreen,
      }
    });
  };

  const handleSendUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      setErrorMsg('User ID is required for direct push notifications.');
      return;
    }
    sendMutation.mutate({
      target: 'user',
      userId: userId,
      userType: userType,
      title: userTitle,
      body: userBody,
      data: {
        screen: userScreen,
      }
    });
  };

  const screenOptions = [
    { label: 'Home Dashboard', value: 'home' },
    { label: 'Attendance Logs', value: 'attendance_logs' },
    { label: 'User Profile', value: 'profile' },
    { label: 'Donations', value: 'donations' },
    { label: 'Events Calendar', value: 'events' },
    { label: 'Classes', value: 'classes' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center">
              <Megaphone className="w-6 h-6 mr-2 text-primary" />
              Communication Broadcasting
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Send instant push notifications to user groups or directly to individuals.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => { setActiveTab('topic'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors flex items-center space-x-2 ${
              activeTab === 'topic' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Broadcast by Role/Topic</span>
          </button>
          <button
            onClick={() => { setActiveTab('user'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors flex items-center space-x-2 ${
              activeTab === 'user' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Direct Push to User</span>
          </button>
        </div>

        {/* Status Messages */}
        {successMsg && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center text-emerald-600 text-sm font-medium">
            <CheckCircle2 className="w-5 h-5 mr-2" />
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center text-destructive text-sm font-medium">
            <AlertCircle className="w-5 h-5 mr-2" />
            {errorMsg}
          </div>
        )}

        {/* TOPIC FORM */}
        {activeTab === 'topic' && (
          <Card className="shadow-sm border-border/60">
            <CardContent className="p-6">
              <form onSubmit={handleSendTopic} className="space-y-5">
                <div className="grid grid-cols-2 gap-6">
                  <Select
                    label="Target Audience *"
                    name="topicTarget"
                    value={topicTarget}
                    onChange={(e) => setTopicTarget(e.target.value)}
                    options={[
                      { label: 'All Teachers', value: 'teachers' },
                      { label: 'All Volunteers', value: 'volunteers' },
                      { label: 'All Sponsors', value: 'sponsors' },
                      { label: 'All Students', value: 'students' },
                      { label: 'Everyone (Global)', value: 'all' },
                    ]}
                  />
                  <Select
                    label="App Screen (Deep Link)"
                    name="topicScreen"
                    value={topicScreen}
                    onChange={(e) => setTopicScreen(e.target.value)}
                    options={screenOptions}
                  />
                </div>

                <Input
                  label="Notification Title *"
                  name="topicTitle"
                  value={topicTitle}
                  onChange={(e) => setTopicTitle(e.target.value)}
                  placeholder="e.g. Important Notice"
                  required
                />

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Notification Body *
                  </label>
                  <textarea
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Enter the main message here..."
                    value={topicBody}
                    onChange={(e) => setTopicBody(e.target.value)}
                    required
                  />
                </div>

                <div className="pt-2">
                  <Button type="submit" className="h-10 w-full sm:w-auto px-8 font-bold" isLoading={sendMutation.isPending}>
                    <Send className="w-4 h-4 mr-2" />
                    Broadcast Notification
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* USER FORM */}
        {activeTab === 'user' && (
          <Card className="shadow-sm border-border/60">
            <CardContent className="p-6">
              <form onSubmit={handleSendUser} className="space-y-5">
                <div className="grid grid-cols-2 gap-6">
                  <Select
                    label="User Type *"
                    name="userType"
                    value={userType}
                    onChange={(e) => setUserType(e.target.value)}
                    options={[
                      { label: 'Teacher', value: 'teacher' },
                      { label: 'Volunteer', value: 'volunteer' },
                      { label: 'Sponsor', value: 'sponsor' },
                      { label: 'Student', value: 'student' },
                    ]}
                  />
                  <Input
                    label="User ID *"
                    name="userId"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="e.g. 60f8b1c4e6..."
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <Input
                    label="Notification Title *"
                    name="userTitle"
                    value={userTitle}
                    onChange={(e) => setUserTitle(e.target.value)}
                    placeholder="e.g. Personal Alert"
                    required
                  />
                  <Select
                    label="App Screen (Deep Link)"
                    name="userScreen"
                    value={userScreen}
                    onChange={(e) => setUserScreen(e.target.value)}
                    options={screenOptions}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Notification Body *
                  </label>
                  <textarea
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Enter the main message here..."
                    value={userBody}
                    onChange={(e) => setUserBody(e.target.value)}
                    required
                  />
                </div>

                <div className="pt-2">
                  <Button type="submit" className="h-10 w-full sm:w-auto px-8 font-bold" isLoading={sendMutation.isPending}>
                    <Send className="w-4 h-4 mr-2" />
                    Send Direct Push
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
