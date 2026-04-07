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

/* ── GET /api/farmlands — list all farmlands for user ── */
export async function GET(req: Request) {
  try {
    await connectDB();
    const userId = await getUserId(req);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const farmlands = await Farmland.find({ userId }).sort({ updatedAt: -1 }).lean();

    // Compute live status for each
    const items = farmlands.map((f) => {
      const statusResult = computeFarmlandStatus(f);
      return { ...f, status: statusResult.status, progress: statusResult.progress, _statusMeta: statusResult };
    });

    // Quick stats
    const stats = {
      total: items.length,
      completed: items.filter((f) => f.status === 'completed').length,
      needsAttention: items.filter((f) =>
        ['retest-due', 'ph-pending', 'draft'].includes(f.status)
      ).length,
      testScheduled: items.filter((f) => f.status === 'test-scheduled').length,
    };

    return NextResponse.json({ success: true, farmlands: items, stats });
  } catch (error) {
    console.error('Farmlands GET Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

/* ── POST /api/farmlands — create a new farmland ── */
export async function POST(req: Request) {
  try {
    await connectDB();
    const userId = await getUserId(req);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const body = await req.json();

    if (!body.landName?.trim()) {
      return NextResponse.json({ success: false, error: 'Land name is required' }, { status: 400 });
    }
    if (!body.state?.trim() || !body.district?.trim()) {
      return NextResponse.json({ success: false, error: 'State and district are required' }, { status: 400 });
    }

    const farmland = await Farmland.create({
      userId,
      landName: body.landName.trim(),
      areaAcres: body.areaAcres ? Number(body.areaAcres) : undefined,
      soilType: body.soilType || undefined,
      location: {
        state: body.state.trim(),
        district: body.district.trim(),
        village: body.village?.trim() || undefined,
      },
      landRecord: body.landRecord || undefined,
      status: 'ph-pending',
      progress: 25,
    });

    return NextResponse.json({ success: true, farmland }, { status: 201 });
  } catch (error) {
    console.error('Farmlands POST Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
