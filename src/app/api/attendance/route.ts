import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB, addAuditLog } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const entityType = searchParams.get('entityType') || 'Student'; // 'Student' or 'Teacher'

    const db = await readDB();
    const records = db.attendance.filter(
      (a) => a.date === date && a.entityType === entityType
    );

    return NextResponse.json({ records });
  } catch (error) {
    console.error('Attendance fetch API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { date, entityType, records } = body; // records: [{ entityId: string, status: 'Present' | 'Absent' }]

    if (!date || !entityType || !Array.isArray(records)) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const db = await readDB();

    // Loop through each record and upsert
    for (const rec of records) {
      const existingIdx = db.attendance.findIndex(
        (a) => a.date === date && a.entityType === entityType && a.entityId === rec.entityId
      );

      if (existingIdx !== -1) {
        db.attendance[existingIdx].status = rec.status;
      } else {
        db.attendance.push({
          id: `a-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          date,
          entityType,
          entityId: rec.entityId,
          status: rec.status,
        });
      }
    }

    // Recalculate average attendance percentages for students to keep data high-fidelity
    if (entityType === 'Student') {
      db.students = db.students.map((student) => {
        const studentLogs = db.attendance.filter(
          (a) => a.entityType === 'Student' && a.entityId === student.id
        );
        const totalLogs = studentLogs.length;
        const presentLogs = studentLogs.filter((l) => l.status === 'Present').length;
        const attendancePercentage = totalLogs > 0 ? Math.round((presentLogs / totalLogs) * 1000) / 10 : 0;
        
        return {
          ...student,
          attendancePercentage,
        };
      });
    }

    await writeDB(db);

    // Audit logs
    await addAuditLog('system', 'System Coordinator', 'Log Attendance', `Submitted ${entityType} attendance list for date ${date}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Attendance submit API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
