import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB, addAuditLog, addNotification } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.toLowerCase() || '';
    const status = searchParams.get('status') || '';

    const db = await readDB();
    let result = [...db.donations];

    if (search) {
      result = result.filter(
        (d) =>
          d.donorName.toLowerCase().includes(search) ||
          d.email.toLowerCase().includes(search) ||
          d.paymentMethod.toLowerCase().includes(search)
      );
    }

    if (status) {
      result = result.filter((d) => d.status === status);
    }

    // Attach student names to donation lists for helper rendering
    const donationsWithStudents = result.map((don) => {
      const student = don.studentId ? db.students.find((s) => s.id === don.studentId) : null;
      return {
        ...don,
        studentName: student ? student.name : null,
      };
    });

    return NextResponse.json({ donations: donationsWithStudents });
  } catch (error) {
    console.error('Donations fetch API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { donorName, email, phone, amount, type, studentId, paymentMethod } = body;

    if (!donorName || !email || !amount || !paymentMethod) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = await readDB();
    const newDonation = {
      id: `d-${Date.now()}`,
      donorName,
      email,
      phone: phone || '',
      amount: Number(amount),
      date: new Date().toISOString().split('T')[0],
      type: type || 'General Donation',
      studentId: studentId || null,
      status: 'Pending Verification' as const,
      paymentMethod,
    };

    db.donations.push(newDonation);
    await writeDB(db);

    // Audit logs
    await addAuditLog('system', 'System Coordinator', 'Add Donation', `Logged pending contribution of ₹${amount} from ${donorName}`);

    return NextResponse.json({ success: true, donation: newDonation });
  } catch (error) {
    console.error('Donation log API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing donation ID' }, { status: 400 });
    }

    const body = await req.json();
    const db = await readDB();
    const idx = db.donations.findIndex((d) => d.id === id);

    if (idx === -1) {
      return NextResponse.json({ error: 'Donation record not found' }, { status: 404 });
    }

    const donation = db.donations[idx];
    const isVerifying = body.status === 'Verified' && donation.status === 'Pending Verification';

    // Update donation status
    db.donations[idx] = {
      ...donation,
      ...body,
    };

    // If verifying, update or create sponsor metrics
    if (isVerifying) {
      const email = donation.email.toLowerCase();
      const sponsorIdx = db.sponsors.findIndex((s) => s.email.toLowerCase() === email);

      if (sponsorIdx !== -1) {
        db.sponsors[sponsorIdx].totalDonated += donation.amount;
        if (donation.type === 'Sponsorship') {
          db.sponsors[sponsorIdx].activeSponsorships += 1;
        }
      } else {
        db.sponsors.push({
          id: `sp-${Date.now()}`,
          name: donation.donorName,
          email: donation.email,
          activeSponsorships: donation.type === 'Sponsorship' ? 1 : 0,
          totalDonated: donation.amount,
        });
      }

      // If this is a child sponsorship donation, associate the student with this sponsor ID
      if (donation.type === 'Sponsorship' && donation.studentId) {
        const studentIdx = db.students.findIndex((s) => s.id === donation.studentId);
        if (studentIdx !== -1) {
          // get the sponsor record we just updated/created
          const updatedSponsor = db.sponsors.find((s) => s.email.toLowerCase() === email);
          db.students[studentIdx].sponsorId = updatedSponsor ? updatedSponsor.id : `sp-${Date.now()}`;
        }
      }

      // Add system alerts
      await addNotification('Donation', `Verified donation of ₹${donation.amount} from ${donation.donorName}`);
      await addAuditLog('system', 'System Coordinator', 'Verify Payment', `Verified payment transaction ID ${donation.id} for ₹${donation.amount}`);
    }

    await writeDB(db);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Donation verify API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
