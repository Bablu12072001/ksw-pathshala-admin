'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, KeyRound, AlertTriangle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { authService } from '@/services';
import axios from 'axios';

type ViewState = 'login' | 'forgot' | 'reset';

export default function LoginPage() {
  const router = useRouter();
  const { user, login } = useAppStore();

  const [view, setView] = useState<ViewState>('login');

  // Login form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Forgot/Reset form states
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
    setSuccess('');

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

  // ── Forgot Password ──────────────────────────────────────────────
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await authService.forgotPassword({ email, role: 'admin' });
      setSuccess('Recovery OTP sent to your email.');
      setView('reset');
    } catch (apiErr) {
      const message = axios.isAxiosError(apiErr) && apiErr.response?.data?.error
        ? apiErr.response.data.error
        : 'Failed to request password reset.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // ── Reset Password ──────────────────────────────────────────────
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || !newPassword) {
      setError('Please provide the OTP and a new password');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await authService.resetPassword({ email, otp, newPassword });
      setSuccess('Password reset successfully. You can now login.');
      setView('login');
      // Reset the fields
      setOtp('');
      setNewPassword('');
    } catch (apiErr) {
      const message = axios.isAxiosError(apiErr) && apiErr.response?.data?.error
        ? apiErr.response.data.error
        : 'Failed to reset password.';
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
          {/* Error & Success banners */}
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive font-medium flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-600 font-medium flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* VIEW: LOGIN */}
          {view === 'login' && (
            <>
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground py-1">
                <KeyRound className="h-3.5 w-3.5" />
                Admin Password Login
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <Input
                  label="Username or Email"
                  id="login-username"
                  type="text"
                  autoComplete="username"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <div className="space-y-1">
                  <Input
                    label="Password"
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <div className="text-right">
                    <button 
                      type="button" 
                      onClick={() => { setView('forgot'); setError(''); setSuccess(''); }} 
                      className="text-xxs font-bold text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full h-10 mt-2 font-bold" isLoading={loading}>
                  Sign In
                </Button>
              </form>
            </>
          )}

          {/* VIEW: FORGOT PASSWORD */}
          {view === 'forgot' && (
            <>
              <div className="flex flex-col items-center justify-center gap-2 text-xs font-semibold text-muted-foreground py-1">
                <Shield className="h-4 w-4 text-primary" />
                Password Recovery
                <span className="text-xxs font-normal text-center mt-1">Enter your email address and we'll send you a 6-digit OTP to reset your password.</span>
              </div>

              <form onSubmit={handleForgotPassword} className="space-y-4 mt-2">
                <Input
                  label="Admin Email Address"
                  id="forgot-email"
                  type="email"
                  placeholder="admin@kws.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Button type="submit" className="w-full h-10 mt-2 font-bold" isLoading={loading}>
                  Send Recovery OTP
                </Button>
                <div className="text-center pt-2">
                  <button 
                    type="button" 
                    onClick={() => { setView('login'); setError(''); setSuccess(''); }} 
                    className="text-xs font-semibold text-muted-foreground hover:text-foreground inline-flex items-center"
                  >
                    <ArrowLeft className="h-3 w-3 mr-1" /> Back to Login
                  </button>
                </div>
              </form>
            </>
          )}

          {/* VIEW: RESET PASSWORD */}
          {view === 'reset' && (
            <>
              <div className="flex flex-col items-center justify-center gap-2 text-xs font-semibold text-muted-foreground py-1">
                <KeyRound className="h-4 w-4 text-primary" />
                Complete Recovery
                <span className="text-xxs font-normal text-center mt-1">Check your email ({email}) for the 6-digit OTP and enter it below along with your new password.</span>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4 mt-2">
                <Input
                  label="6-Digit OTP"
                  id="reset-otp"
                  type="text"
                  placeholder="123456"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
                <Input
                  label="New Secure Password"
                  id="reset-password"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <Button type="submit" className="w-full h-10 mt-2 font-bold" isLoading={loading}>
                  Reset Password
                </Button>
                <div className="text-center pt-2">
                  <button 
                    type="button" 
                    onClick={() => { setView('login'); setError(''); setSuccess(''); }} 
                    className="text-xs font-semibold text-muted-foreground hover:text-foreground inline-flex items-center"
                  >
                    <ArrowLeft className="h-3 w-3 mr-1" /> Back to Login
                  </button>
                </div>
              </form>
            </>
          )}

        </CardContent>
      </Card>

      <div className="mt-6 text-center text-xxs text-muted-foreground">
        © 2026 KSW Pathshala Foundation. Secure access only.
      </div>
    </div>
  );
}
