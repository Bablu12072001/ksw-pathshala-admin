import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB, addAuditLog } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.toLowerCase() || '';
    const grade = searchParams.get('grade') || '';
    const status = searchParams.get('status') || '';

    const db = await readDB();
    let result = [...db.students];

    // Filter by text search
    if (search) {
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(search) ||
          s.guardianName.toLowerCase().includes(search) ||
          s.phone.includes(search)
      );
    }

    // Filter by grade
    if (grade) {
      result = result.filter((s) => s.grade === grade);
    }

    // Filter by status
    if (status) {
      result = result.filter((s) => s.status === status);
    }

    return NextResponse.json({ students: result });
  } catch (error) {
    console.error('Students fetch API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, age, gender, grade, guardianName, phone, address, sponsorId } = body;

    if (!name || !age || !gender || !grade || !guardianName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = await readDB();
    const newStudent = {
      id: `s-${Date.now()}`,
      name,
      age: Number(age),
      gender,
      grade,
      guardianName,
      phone: phone || '',
      address: address || '',
      status: 'Pending Approval' as const,
      sponsorId: sponsorId || null,
      attendancePercentage: 0,
      photo: '',
      joiningDate: new Date().toISOString().split('T')[0],
    };

    db.students.push(newStudent);
    await writeDB(db);

    // Audit logs
    await addAuditLog('system', 'System Coordinator', 'Create Student', `Registered pending student ${name}`);

    return NextResponse.json({ success: true, student: newStudent });
  } catch (error) {
    console.error('Student create API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing student ID' }, { status: 400 });
    }

    const body = await req.json();
    const db = await readDB();
    const studentIdx = db.students.findIndex((s) => s.id === id);

    if (studentIdx === -1) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const currentStudent = db.students[studentIdx];
    const updatedStudent = {
      ...currentStudent,
      ...body,
      // Ensure key numbers are correct format
      age: body.age !== undefined ? Number(body.age) : currentStudent.age,
    };

    db.students[studentIdx] = updatedStudent;
    await writeDB(db);

    // Audit logs
    await addAuditLog('system', 'System Coordinator', 'Update Student', `Updated student details for ${currentStudent.name} (Action: ${Object.keys(body).join(', ')})`);

    return NextResponse.json({ success: true, student: updatedStudent });
  } catch (error) {
    console.error('Student update API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing student ID' }, { status: 400 });
    }

    const db = await readDB();
    const student = db.students.find((s) => s.id === id);
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    db.students = db.students.filter((s) => s.id !== id);
    await writeDB(db);

    // Audit logs
    await addAuditLog('system', 'System Coordinator', 'Delete Student', `Removed student ${student.name} from records`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Student delete API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
