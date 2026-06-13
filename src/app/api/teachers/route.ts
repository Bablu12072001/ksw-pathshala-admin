import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB, addAuditLog } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.toLowerCase() || '';

    const db = await readDB();
    let result = [...db.teachers];

    if (search) {
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(search) ||
          t.email.toLowerCase().includes(search) ||
          t.phone.includes(search) ||
          t.qualification.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({ teachers: result });
  } catch (error) {
    console.error('Teachers fetch API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, qualification, assignedClass, latitude, longitude, classroomName } = body;

    if (!name || !email || !phone || !qualification) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = await readDB();
    const newTeacher = {
      id: `t-${Date.now()}`,
      name,
      email,
      phone,
      qualification,
      assignedClass: assignedClass || 'Unassigned',
      location: {
        latitude: latitude ? Number(latitude) : 28.5355, // Noida sector 4 coords fallback
        longitude: longitude ? Number(longitude) : 77.3910,
        classroomName: classroomName || 'Main Center',
      },
      status: 'Pending Approval' as const,
      joiningDate: new Date().toISOString().split('T')[0],
    };

    db.teachers.push(newTeacher);
    await writeDB(db);

    // Audit logs
    await addAuditLog('system', 'System Coordinator', 'Onboard Teacher', `Registered pending teacher application for ${name}`);

    return NextResponse.json({ success: true, teacher: newTeacher });
  } catch (error) {
    console.error('Teacher onboarding API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing teacher ID' }, { status: 400 });
    }

    const body = await req.json();
    const db = await readDB();
    const idx = db.teachers.findIndex((t) => t.id === id);

    if (idx === -1) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    const currentTeacher = db.teachers[idx];
    const updatedTeacher = {
      ...currentTeacher,
      ...body,
      // Ensure nesting behaves
      location: body.location
        ? { ...currentTeacher.location, ...body.location }
        : currentTeacher.location,
    };

    db.teachers[idx] = updatedTeacher;
    await writeDB(db);

    // Audit logs
    await addAuditLog('system', 'System Coordinator', 'Update Teacher', `Updated details for teacher ${currentTeacher.name} (${Object.keys(body).join(', ')})`);

    return NextResponse.json({ success: true, teacher: updatedTeacher });
  } catch (error) {
    console.error('Teacher update API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing teacher ID' }, { status: 400 });
    }

    const db = await readDB();
    const teacher = db.teachers.find((t) => t.id === id);
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    db.teachers = db.teachers.filter((t) => t.id !== id);
    await writeDB(db);

    // Audit logs
    await addAuditLog('system', 'System Coordinator', 'Delete Teacher', `De-registered teacher profile ${teacher.name}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Teacher delete API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
