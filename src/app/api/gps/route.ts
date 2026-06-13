import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB, addAuditLog, addNotification } from '@/lib/db';

// Haversine formula to calculate distance in meters between two lat/lng pairs
function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c); // Distance in meters
}

export async function GET() {
  try {
    const db = await readDB();
    return NextResponse.json({
      logs: db.gps_logs || [],
      teachers: db.teachers.filter((t) => t.status === 'Approved'),
    });
  } catch (error) {
    console.error('GPS logs fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { teacherId, latitude, longitude } = body;

    if (!teacherId || !latitude || !longitude) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const db = await readDB();
    const teacher = db.teachers.find((t) => t.id === teacherId);

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    const targetLat = teacher.location.latitude;
    const targetLng = teacher.location.longitude;

    // Calculate actual distance offset
    const distance = getDistanceMeters(
      Number(latitude),
      Number(longitude),
      targetLat,
      targetLng
    );

    // Geofencing rule: Clock-in must be within 100 meters of center
    const verified = distance <= 100;

    const clockInTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newLog = {
      id: `g-${Date.now()}`,
      teacherId,
      teacherName: teacher.name,
      date: new Date().toISOString().split('T')[0],
      clockInTime,
      coords: {
        latitude: Number(latitude),
        longitude: Number(longitude),
      },
      distanceMeters: distance,
      verified,
      remarks: verified
        ? `Clocked in at ${teacher.location.classroomName}`
        : `GPS alert: Range exceeded by ${distance} meters from ${teacher.location.classroomName}`,
    };

    db.gps_logs.unshift(newLog);

    // Add alert notification if range is breached
    if (!verified) {
      await addNotification(
        'GPS Alert',
        `Teacher clock-in verification failed: ${teacher.name} clocked in ${distance}m away from center.`
      );
    }

    await writeDB(db);

    // Audit logs
    await addAuditLog('system', 'System Coordinator', 'GPS Check-in', `Simulated clock-in for ${teacher.name} (Verified: ${verified}, Distance: ${distance}m)`);

    return NextResponse.json({ success: true, log: newLog });
  } catch (error) {
    console.error('GPS clock-in log error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
