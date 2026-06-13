'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, KeyRound, Smartphone, HelpCircle } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const router = useRouter();
  const { user, login } = useAppStore();

  // Form states
  const [authMode, setAuthMode] = useState<'password' | 'otp'>('password');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  
  // Pipeline flow states
  const [otpSent, setOtpSent] = useState(false);
  const [receivedDemoOtp, setReceivedDemoOtp] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  // Handle standard password login
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'password', username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed');
      } else {
        login(data.user);
        router.push('/dashboard');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Trigger simulated OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) {
      setError('Please enter your registered phone number');
      return;
    }

    setLoading(true);
    setError('');
    setReceivedDemoOtp(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send-otp', phone }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to send OTP');
      } else {
        setOtpSent(true);
        if (data.demoOtp) {
          setReceivedDemoOtp(data.demoOtp);
        }
      }
    } catch (err) {
      setError('Failed to contact auth server');
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode) {
      setError('Please enter the verification code');
      return;
    }

    // Verify OTP matches the mock code
    if (receivedDemoOtp && otpCode !== receivedDemoOtp) {
      setError('Invalid OTP code. Please check and try again.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify-otp', phone, otp: otpCode }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'OTP verification failed');
      } else {
        login(data.user);
        router.push('/dashboard');
      }
    } catch (err) {
      setError('Verification connection failed');
    } finally {
      setLoading(false);
    }
  };

  // Quick fill helper for demo ease
  const fillDemoCreds = (role: 'admin' | 'coordinator' | 'sponsor') => {
    setError('');
    setOtpSent(false);
    setReceivedDemoOtp(null);

    if (role === 'admin') {
      setUsername('admin');
      setPassword('adminpassword');
      setPhone('+919876543210');
    } else if (role === 'coordinator') {
      setUsername('coordinator');
      setPassword('coordpassword');
      setPhone('+918765432109');
    } else {
      setUsername('sponsor');
      setPassword('sponsorpassword');
      setPhone('+917654321098');
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-4">
      {/* Background blobs */}
      <div className="glow-orb glow-orb-primary top-10 left-10" />
      <div className="glow-orb glow-orb-secondary bottom-10 right-10" />

      {/* Main card */}
      <Card className="w-full max-w-md shadow-2xl glass-panel relative z-10 border-border/75">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Shield className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">KSW Pathshala</CardTitle>
          <CardDescription>Enterprise NGO Administration System</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Double Mode Toggle tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-secondary/35 rounded-lg border border-border/40">
            <button
              onClick={() => {
                setAuthMode('password');
                setError('');
                setOtpSent(false);
              }}
              className={`flex items-center justify-center py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                authMode === 'password'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <KeyRound className="mr-1.5 h-3.5 w-3.5" />
              Password
            </button>
            <button
              onClick={() => {
                setAuthMode('otp');
                setError('');
                setOtpSent(false);
              }}
              className={`flex items-center justify-center py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                authMode === 'otp'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Smartphone className="mr-1.5 h-3.5 w-3.5" />
              WhatsApp OTP
            </button>
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive font-medium">
              {error}
            </div>
          )}

          {/* PASSWORD METHOD */}
          {authMode === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <Input
                label="Username"
                type="text"
                placeholder="Enter admin/coordinator username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button type="submit" className="w-full h-10 mt-2 font-bold" isLoading={loading}>
                Sign In
              </Button>
            </form>
          )}

          {/* OTP METHOD */}
          {authMode === 'otp' && (
            <div className="space-y-4">
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <Input
                    label="Registered Phone Number"
                    type="tel"
                    placeholder="e.g. +919876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <Button type="submit" className="w-full h-10 mt-2 font-bold" isLoading={loading}>
                    Generate Verification OTP
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  {/* Simulated OTP Display Banner */}
                  {receivedDemoOtp && (
                    <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      <p className="font-bold">Simulated WhatsApp SMS Code Sent!</p>
                      <p className="mt-1">
                        Use OTP: <span className="font-mono bg-emerald-500/20 px-2 py-0.5 rounded text-sm font-bold tracking-widest">{receivedDemoOtp}</span>
                      </p>
                    </div>
                  )}

                  <Input
                    label={`Verify Code sent to ${phone}`}
                    type="text"
                    maxLength={6}
                    placeholder="Enter 6-digit OTP code"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="text-center font-mono tracking-widest text-lg"
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setOtpSent(false)}
                      className="w-1/3 h-10 text-xs font-semibold"
                    >
                      Back
                    </Button>
                    <Button type="submit" className="w-2/3 h-10 font-bold" isLoading={loading}>
                      Verify & Access
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Quick Helper Trigger */}
          <div className="pt-2 border-t border-border/40 mt-6">
            <button
              onClick={() => setShowDemoAccounts(!showDemoAccounts)}
              className="w-full flex items-center justify-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <HelpCircle className="mr-1.5 h-4 w-4" />
              {showDemoAccounts ? 'Hide Quick Demonstration Help' : 'Show Quick Demonstration Help'}
            </button>

            {showDemoAccounts && (
              <div className="mt-3 grid grid-cols-3 gap-2 p-2.5 bg-secondary/25 border border-border/40 rounded-lg animate-in fade-in-50 duration-150">
                <button
                  onClick={() => fillDemoCreds('admin')}
                  className="px-2 py-1.5 text-xxs font-bold bg-primary/10 text-primary hover:bg-primary/20 rounded border border-primary/20 cursor-pointer"
                >
                  Admin Creds
                </button>
                <button
                  onClick={() => fillDemoCreds('coordinator')}
                  className="px-2 py-1.5 text-xxs font-bold bg-primary/10 text-primary hover:bg-primary/20 rounded border border-primary/20 cursor-pointer"
                >
                  Coord Creds
                </button>
                <button
                  onClick={() => fillDemoCreds('sponsor')}
                  className="px-2 py-1.5 text-xxs font-bold bg-primary/10 text-primary hover:bg-primary/20 rounded border border-primary/20 cursor-pointer"
                >
                  Sponsor Creds
                </button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <div className="mt-6 text-center text-xxs text-muted-foreground">
        © 2026 KSW Pathshala Foundation. Secure access only.
      </div>
    </div>
  );
}
