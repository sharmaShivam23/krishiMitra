import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Farmland } from '@/models';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { computeFarmlandStatus } from '@/lib/soilScoring';
import { generateSoilReportAI } from '@/lib/gemini';

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

/* ── GET — Get current soil report ── */
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

    return NextResponse.json({ success: true, report: farmland.report || null });
  } catch (error) {
    console.error('Report GET Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

/* ── POST — Generate/regenerate soil report ── */
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

    // Merge pH/moisture from phMoisture + nutrient data from SHC
    const mergedValues = {
      ph: farmland.phMoisture?.ph ?? farmland.soilHealthCard?.values?.ph ?? null,
      moisture: farmland.phMoisture?.moisture ?? farmland.soilHealthCard?.values?.moisture ?? null,
      n: farmland.soilHealthCard?.values?.n ?? null,
      p: farmland.soilHealthCard?.values?.p ?? null,
      k: farmland.soilHealthCard?.values?.k ?? null,
      ec: farmland.soilHealthCard?.values?.ec ?? null,
      organicCarbon: farmland.soilHealthCard?.values?.organicCarbon ?? null,
    };

    const hasPh = typeof mergedValues.ph === 'number';
    const hasMoisture = typeof mergedValues.moisture === 'number';

    if (!hasPh || !hasMoisture) {
      return NextResponse.json(
        { success: false, error: 'pH and moisture values are required to generate a report.' },
        { status: 400 }
      );
    }

    const reportLang = 'English';

    const aiReport = await generateSoilReportAI(
      {
        landName: farmland.landName,
        location: farmland.location,
        areaAcres: farmland.areaAcres,
        soilType: farmland.soilType,
      },
      mergedValues,
      reportLang
    );

    farmland.report = {
      ...aiReport,
      generatedAt: new Date(),
    };

    // Recompute status
    const statusResult = computeFarmlandStatus(farmland);
    farmland.status = statusResult.status;
    farmland.progress = statusResult.progress;

    await farmland.save();

    return NextResponse.json({
      success: true,
      report: farmland.report,
      statusMeta: statusResult,
    });
  } catch (error) {
    console.error('Report POST Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
