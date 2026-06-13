import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';

export async function GET() {
  try {
    const db = await readDB();
    return NextResponse.json({ notifications: db.notifications || [] });
  } catch (error) {
    console.error('Notifications fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const db = await readDB();

    if (id) {
      // Mark specific notification as read
      db.notifications = db.notifications.map((n) =>
        n.id === id ? { ...n, status: 'Read' } : n
      );
    } else {
      // Mark all as read
      db.notifications = db.notifications.map((n) => ({ ...n, status: 'Read' }));
    }

    await writeDB(db);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Notifications update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
