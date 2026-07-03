'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, KeyRound, AlertTriangle } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { authService } from '@/services';
import axios from 'axios';

export default function LoginPage() {
  const router = useRouter();
  const { user, login } = useAppStore();

  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  // ── Password login via real API ──────────────────────────────────────────────
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data } = await authService.login({ username, password });

      let decodedRole = 'Admin';
      let decodedName = username;

      try {
        if (data.token && data.token.includes('.')) {
          const payloadBase64Url = data.token.split('.')[1];
          const payloadBase64 = payloadBase64Url.replace(/-/g, '+').replace(/_/g, '/');
          const decoded = JSON.parse(window.atob(payloadBase64));
          if (decoded.role) decodedRole = decoded.role;
          if (decoded.username || decoded.name) decodedName = decoded.username || decoded.name;
        }
      } catch (e) {
        console.error('Could not decode token for role', e);
      }

      const session = {
        id: data.user?.id ?? `u-${Date.now()}`,
        username,
        name: data.user?.name ?? decodedName,
        role: (data.user?.role ?? decodedRole) as 'Admin' | 'Coordinator' | 'Sponsor',
        phone: data.user?.phone ?? '',
        token: data.token,
      };

      login(session);
      router.push('/dashboard');
    } catch (apiErr) {
      const message =
        axios.isAxiosError(apiErr) && apiErr.response?.data?.error
          ? apiErr.response.data.error
          : axios.isAxiosError(apiErr) && apiErr.response?.data?.message
            ? apiErr.response.data.message
            : 'Invalid username or password';
      setError(message);
    } finally {
      setLoading(false);
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
          <div className="mx-auto mb-3 flex h-24 w-24 items-center justify-center rounded-full bg-white text-primary overflow-hidden shadow-lg p-2">
            <img src="/logo.jpg" alt="KSW Pathshala Logo" className="w-full h-full object-contain" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">KSW Pathshala</CardTitle>
          <CardDescription>Enterprise NGO Administration System</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Auth Mode label */}
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground py-1">
            <KeyRound className="h-3.5 w-3.5" />
            Admin Password Login
          </div>

          {/* Error banner */}
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive font-medium flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Login form */}
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <Input
              label="Username"
              id="login-username"
              type="text"
              autoComplete="username"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <Input
              label="Password"
              id="login-password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit" className="w-full h-10 mt-2 font-bold" isLoading={loading}>
              Sign In
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="mt-6 text-center text-xxs text-muted-foreground">
        © 2026 KSW Pathshala Foundation. Secure access only.
      </div>
    </div>
  );
}
