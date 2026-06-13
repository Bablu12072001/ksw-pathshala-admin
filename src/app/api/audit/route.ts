import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { readDB, writeDB, addAuditLog } from '@/lib/db';

export async function GET() {
  try {
    const db = await readDB();
    return NextResponse.json({ logs: db.audit_logs || [] });
  } catch (error) {
    console.error('Audit logs fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = await readDB();
    const backupDir = path.join(process.cwd(), 'src', 'data', 'backups');
    
    // Ensure directory exists
    await fs.mkdir(backupDir, { recursive: true });

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `db-backup-${timestamp}.json`);

    // Write file copy
    await fs.writeFile(backupPath, JSON.stringify(db, null, 2), 'utf8');

    // Add audit entry
    const newLog = await addAuditLog('system', 'System Administrator', 'Database Backup', `Created db backup file: db-backup-${timestamp}.json`);

    return NextResponse.json({
      success: true,
      message: `Database backup snapshot saved successfully!`,
      backupFile: `db-backup-${timestamp}.json`,
    });
  } catch (error) {
    console.error('Database backup operation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
