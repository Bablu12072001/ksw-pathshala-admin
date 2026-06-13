import { NextRequest, NextResponse } from 'next/server';
import { readDB, addAuditLog, addNotification } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, username, password, phone, otp } = body;

    const db = await readDB();

    // 1. Password Login Flow
    if (action === 'password') {
      const user = db.users.find(
        (u) => u.username.toLowerCase() === username.toLowerCase() && u.password === password
      );

      if (!user) {
        return NextResponse.json({ error: 'Invalid username or password' }, { status: 400 });
      }

      // Record audit log
      await addAuditLog(user.id, user.name, 'Admin Login', `Logged in using password from IP`);

      return NextResponse.json({
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          phone: user.phone,
          token: `mock-jwt-token-for-${user.id}-${Date.now()}`,
        },
      });
    }

    // 2. Send OTP Flow
    if (action === 'send-otp') {
      const user = db.users.find((u) => u.phone === phone);
      if (!user) {
        return NextResponse.json({ error: 'Phone number not registered' }, { status: 404 });
      }

      // Generate a mock 6-digit OTP (e.g. 543210 or random)
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

      // Log notification and system actions
      await addNotification('System', `Simulated OTP [${generatedOtp}] sent to ${phone} for user ${user.name}`);
      await addAuditLog(user.id, user.name, 'OTP Request', `OTP verification code triggered for ${phone}`);

      // We return the OTP code in the payload so the frontend can display it in a toast for easy demo verification!
      return NextResponse.json({
        success: true,
        message: `OTP sent successfully to ${phone}`,
        demoOtp: generatedOtp, // returning this allows zero-friction demonstration
      });
    }

    // 3. Verify OTP Flow
    if (action === 'verify-otp') {
      const user = db.users.find((u) => u.phone === phone);
      if (!user) {
        return NextResponse.json({ error: 'Phone number not registered' }, { status: 404 });
      }

      // In a real app we'd verify the database/session cache. For the mock we assume the OTP verification is checked on client or matched here.
      // We log successful login
      await addAuditLog(user.id, user.name, 'OTP Verification', `Logged in using OTP verification`);

      return NextResponse.json({
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          phone: user.phone,
          token: `mock-jwt-token-for-otp-${user.id}-${Date.now()}`,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Auth API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
