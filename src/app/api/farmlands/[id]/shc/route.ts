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

/* ── POST — Submit SHC (number + OCR image) ── */
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
    const now = new Date();
    const TWO_YEARS_MS = 1000 * 60 * 60 * 24 * 730;

    // Set card metadata
    farmland.soilHealthCard = {
      cardNumber: body.cardNumber?.trim() || farmland.soilHealthCard?.cardNumber,
      imageUrl: body.imageUrl || farmland.soilHealthCard?.imageUrl,
      issuedAt: body.issuedAt ? new Date(body.issuedAt) : (farmland.soilHealthCard?.issuedAt || now),
      validUntil: body.issuedAt
        ? new Date(new Date(body.issuedAt).getTime() + TWO_YEARS_MS)
        : (farmland.soilHealthCard?.validUntil || new Date(now.getTime() + TWO_YEARS_MS)),
      values: {
        n: body.n ?? body.values?.n ?? farmland.soilHealthCard?.values?.n,
        p: body.p ?? body.values?.p ?? farmland.soilHealthCard?.values?.p,
        k: body.k ?? body.values?.k ?? farmland.soilHealthCard?.values?.k,
        ec: body.ec ?? body.values?.ec ?? farmland.soilHealthCard?.values?.ec,
        organicCarbon: body.organicCarbon ?? body.values?.organicCarbon ?? farmland.soilHealthCard?.values?.organicCarbon,
        ph: body.shcPh ?? body.values?.ph ?? farmland.soilHealthCard?.values?.ph,
        moisture: body.shcMoisture ?? body.values?.moisture ?? farmland.soilHealthCard?.values?.moisture,
      },
      extractedVia: body.extractedVia || (body.imageUrl ? 'ocr' : 'manual'),
      updatedAt: now,
    };

    // If OCR image is provided but no values, trigger OCR
    if (body.imageUrl && body.runOcr) {
      try {
        const ocrRes = await fetch(new URL('/api/soil-ocr', req.url).toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: body.imageUrl, type: 'govt' }),
        });
        const ocrData = await ocrRes.json();
        if (ocrData.success && ocrData.values) {
          farmland.soilHealthCard.values = {
            ...farmland.soilHealthCard.values,
            ...ocrData.values,
          };
          farmland.soilHealthCard.extractedVia = 'ocr';
        }
      } catch (ocrError) {
        console.error('OCR failed during SHC submission:', ocrError);
        // Continue — we still save the card number and image
      }
    }

    // Recompute status
    const statusResult = computeFarmlandStatus(farmland);
    farmland.status = statusResult.status;
    farmland.progress = statusResult.progress;

    await farmland.save();

    return NextResponse.json({
      success: true,
      soilHealthCard: farmland.soilHealthCard,
      statusMeta: statusResult,
    });
  } catch (error) {
    console.error('SHC POST Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

/* ── PATCH — Update SHC values ── */
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

    if (!farmland.soilHealthCard) {
      farmland.soilHealthCard = {};
    }

    if (body.cardNumber !== undefined) farmland.soilHealthCard.cardNumber = body.cardNumber;
    if (body.imageUrl !== undefined) farmland.soilHealthCard.imageUrl = body.imageUrl;

    if (body.values) {
      farmland.soilHealthCard.values = {
        ...(farmland.soilHealthCard.values || {}),
        ...body.values,
      };
    }

    farmland.soilHealthCard.updatedAt = new Date();

    const statusResult = computeFarmlandStatus(farmland);
    farmland.status = statusResult.status;
    farmland.progress = statusResult.progress;

    await farmland.save();

    return NextResponse.json({
      success: true,
      soilHealthCard: farmland.soilHealthCard,
      statusMeta: statusResult,
    });
  } catch (error) {
    console.error('SHC PATCH Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
