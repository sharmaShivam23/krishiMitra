import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Farmland } from '@/models';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { computeFarmlandStatus } from '@/lib/soilScoring';

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

/* ── GET /api/farmlands/[id] — single farmland detail ── */
export async function GET(req: Request, context: RouteContext) {
  try {
    await connectDB();
    const userId = await getUserId(req);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await context.params;
    const farmland = await Farmland.findOne({ _id: id, userId }).lean();
    if (!farmland) {
      return NextResponse.json({ success: false, error: 'Farmland not found' }, { status: 404 });
    }

    const statusResult = computeFarmlandStatus(farmland);

    return NextResponse.json({
      success: true,
      farmland: { ...farmland, status: statusResult.status, progress: statusResult.progress },
      statusMeta: statusResult,
    });
  } catch (error) {
    console.error('Farmland GET Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

/* ── PATCH /api/farmlands/[id] — update farmland ── */
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

    // Update land identity
    if (body.landName !== undefined) farmland.landName = body.landName;
    if (body.areaAcres !== undefined) farmland.areaAcres = body.areaAcres ? Number(body.areaAcres) : undefined;
    if (body.soilType !== undefined) farmland.soilType = body.soilType;
    if (body.state || body.district || body.village) {
      farmland.location = {
        state: body.state || farmland.location?.state,
        district: body.district || farmland.location?.district,
        village: body.village ?? farmland.location?.village,
      };
    }
    if (body.landRecord) {
      farmland.landRecord = { ...(farmland.landRecord || {}), ...body.landRecord };
    }

    // Update pH & Moisture (manual entry)
    if (body.ph !== undefined || body.moisture !== undefined) {
      const now = new Date();
      const FOUR_MONTHS_MS = 1000 * 60 * 60 * 24 * 120;

      const newPh = body.ph !== undefined ? Number(body.ph) : farmland.phMoisture?.ph;
      const newMoisture = body.moisture !== undefined ? Number(body.moisture) : farmland.phMoisture?.moisture;

      // Push old values to history if they existed
      if (farmland.phMoisture?.ph != null && farmland.phMoisture?.moisture != null) {
        farmland.phMoistureHistory.push({
          ph: farmland.phMoisture.ph,
          moisture: farmland.phMoisture.moisture,
          source: farmland.phMoisture.source || 'manual',
          testedAt: farmland.phMoisture.testedAt || now,
        });
      }

      farmland.phMoisture = {
        ph: newPh,
        moisture: newMoisture,
        source: body.phSource || 'manual',
        testedAt: now,
        nextRetestAt: new Date(now.getTime() + FOUR_MONTHS_MS),
        testerName: body.testerName || undefined,
        testerPhone: body.testerPhone || undefined,
      };
    }

    // Recompute status
    const statusResult = computeFarmlandStatus(farmland);
    farmland.status = statusResult.status;
    farmland.progress = statusResult.progress;

    await farmland.save();

    return NextResponse.json({
      success: true,
      farmland,
      statusMeta: statusResult,
    });
  } catch (error) {
    console.error('Farmland PATCH Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

/* ── DELETE /api/farmlands/[id] — delete farmland ── */
export async function DELETE(req: Request, context: RouteContext) {
  try {
    await connectDB();
    const userId = await getUserId(req);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await context.params;
    const result = await Farmland.findOneAndDelete({ _id: id, userId });
    if (!result) {
      return NextResponse.json({ success: false, error: 'Farmland not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Farmland deleted' });
  } catch (error) {
    console.error('Farmland DELETE Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
