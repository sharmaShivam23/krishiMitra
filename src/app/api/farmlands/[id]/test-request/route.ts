import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Farmland } from '@/models';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

const getUserId = async (req: Request) => {
  let token = '';
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else {
    const cookieStore = await cookies();
    token = cookieStore.get('auth_token')?.value || '';
  }
  if (!token) return null;
  const decoded = verifyToken(token) as { userId?: string };
  return decoded?.userId || null;
};

type RouteContext = { params: Promise<{ id: string }> };

/* ── POST — Request a field test ── */
export async function POST(req: Request, context: RouteContext) {
  try {
    await connectDB();
    const userId = await getUserId(req);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await context.params;
    const farmland = await Farmland.findOne({ _id: id, userId });
    if (!farmland) {
      return NextResponse.json({ success: false, error: 'Farmland not found' }, { status: 404 });
    }

    const body = await req.json();

    farmland.scheduledTest = {
      status: 'requested',
      requestedAt: new Date(),
      preferredDate: body.preferredDate ? new Date(body.preferredDate) : undefined,
      notes: body.notes || undefined,
    };

    farmland.status = 'test-scheduled';
    farmland.progress = 35;
    await farmland.save();

    return NextResponse.json({
      success: true,
      scheduledTest: farmland.scheduledTest,
      message: 'Field test requested. We will assign a tester and notify you.',
    });
  } catch (error) {
    console.error('Test Request POST Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

/* ── PATCH — Admin updates test status ── */
export async function PATCH(req: Request, context: RouteContext) {
  try {
    await connectDB();
    const userId = await getUserId(req);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await context.params;
    const farmland = await Farmland.findOne({ _id: id, userId });
    if (!farmland) {
      return NextResponse.json({ success: false, error: 'Farmland not found' }, { status: 404 });
    }

    const body = await req.json();
    const now = new Date();

    if (body.status) {
      farmland.scheduledTest.status = body.status;
    }
    if (body.assignedTo) {
      farmland.scheduledTest.assignedTo = body.assignedTo;
      farmland.scheduledTest.assignedAt = now;
      farmland.scheduledTest.status = 'assigned';
    }
    if (body.status === 'completed' && body.ph != null && body.moisture != null) {
      farmland.scheduledTest.completedAt = now;

      const FOUR_MONTHS_MS = 1000 * 60 * 60 * 24 * 120;

      // Push old values to history
      if (farmland.phMoisture?.ph != null) {
        farmland.phMoistureHistory.push({
          ph: farmland.phMoisture.ph,
          moisture: farmland.phMoisture.moisture!,
          source: farmland.phMoisture.source || 'field-test',
          testedAt: farmland.phMoisture.testedAt || now,
          testerName: farmland.phMoisture.testerName,
        });
      }

      farmland.phMoisture = {
        ph: Number(body.ph),
        moisture: Number(body.moisture),
        source: 'field-test',
        testedAt: now,
        nextRetestAt: new Date(now.getTime() + FOUR_MONTHS_MS),
        testerName: farmland.scheduledTest.assignedTo?.name || body.testerName,
        testerPhone: farmland.scheduledTest.assignedTo?.phone || body.testerPhone,
      };
    }
    if (body.status === 'cancelled') {
      farmland.scheduledTest.status = 'cancelled';
    }
    if (body.notes) {
      farmland.scheduledTest.notes = body.notes;
    }

    await farmland.save();

    return NextResponse.json({ success: true, scheduledTest: farmland.scheduledTest, farmland });
  } catch (error) {
    console.error('Test Request PATCH Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
