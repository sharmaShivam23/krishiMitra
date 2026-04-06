import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { SoilKitCatalog, User } from '@/models';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

type CatalogPayload = {
  item?: {
    title?: string;
    description?: string;
  };
  payment?: {
    mode?: string;
    status?: string;
    label?: string;
  };
  price?: {
    amount?: number | null;
    currency?: string;
    label?: string;
  };
  trackingUrl?: string;
  trackingSteps?: string[];
};

const getUserIdFromRequest = async (req: Request) => {
  let token = '';
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else {
    const cookieStore = await cookies();
    token = cookieStore.get('auth_token')?.value || '';
  }

  if (!token) return null;
  const decoded = verifyToken(token) as { userId?: string };
  return decoded?.userId || null;
};

const requireAdmin = async (req: Request) => {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return { ok: false, status: 401, error: 'Not authenticated' };
  const user = await User.findById(userId).select('role');
  if (!user || user.role !== 'admin') {
    return { ok: false, status: 403, error: 'Not authorized' };
  }
  return { ok: true };
};

const validateCatalog = (catalog: CatalogPayload) => {
  const errors: string[] = [];
  if (!catalog.item?.title) errors.push('Item title is required.');
  if (!catalog.payment?.mode && !catalog.payment?.label) errors.push('Payment mode or label is required.');
  if (catalog.price?.amount == null) errors.push('Price amount is required.');
  if (!catalog.price?.currency) errors.push('Price currency is required.');
  if (!catalog.trackingSteps || catalog.trackingSteps.length === 0) {
    errors.push('Tracking steps are required.');
  }
  return errors;
};

export async function GET() {
  try {
    await connectDB();
    const catalog = await SoilKitCatalog.findOne({ isActive: true }).sort({ updatedAt: -1 });
    return NextResponse.json({ success: true, catalog: catalog || null });
  } catch (error) {
    console.error('Soil Kit Catalog GET Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    await connectDB();
    const auth = await requireAdmin(req);
    if (!auth.ok) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const body = (await req.json()) as { catalog?: CatalogPayload };
    const catalogPayload = body?.catalog || {};
    const errors = validateCatalog(catalogPayload);
    if (errors.length > 0) {
      return NextResponse.json({ success: false, error: 'Invalid catalog', details: errors }, { status: 400 });
    }

    const catalog = await SoilKitCatalog.findOneAndUpdate(
      { isActive: true },
      {
        isActive: true,
        item: {
          title: catalogPayload.item?.title,
          description: catalogPayload.item?.description
        },
        payment: {
          mode: catalogPayload.payment?.mode,
          status: catalogPayload.payment?.status,
          label: catalogPayload.payment?.label
        },
        price: {
          amount: catalogPayload.price?.amount,
          currency: catalogPayload.price?.currency,
          label: catalogPayload.price?.label
        },
        trackingUrl: catalogPayload.trackingUrl,
        trackingSteps: catalogPayload.trackingSteps
      },
      { new: true, upsert: true }
    );

    return NextResponse.json({ success: true, catalog });
  } catch (error) {
    console.error('Soil Kit Catalog PATCH Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
