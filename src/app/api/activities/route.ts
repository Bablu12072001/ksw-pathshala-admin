import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB, addAuditLog } from '@/lib/db';

export async function GET() {
  try {
    const db = await readDB();
    return NextResponse.json({ activities: db.activities || [] });
  } catch (error) {
    console.error('Activities fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, type, mediaUrl, class: assignedClass, teacherName } = body;

    if (!title || !description || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = await readDB();
    const newActivity = {
      id: `act-${Date.now()}`,
      title,
      description,
      type,
      mediaUrl: mediaUrl || 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=600&q=80', // default fallback placeholder if none uploaded
      class: assignedClass || 'General',
      teacherName: teacherName || 'Coordinator',
      date: new Date().toISOString().split('T')[0],
    };

    db.activities.unshift(newActivity);
    await writeDB(db);

    // Audit logs
    await addAuditLog('system', 'System Coordinator', 'Upload Activity', `Posted classroom event: "${title}" for ${assignedClass}`);

    return NextResponse.json({ success: true, activity: newActivity });
  } catch (error) {
    console.error('Activity upload post error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
