import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { SoilKitCatalog, User } from '@/models';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { computeSoilProfileStatus } from '@/lib/soilProfileStatus';

type SoilKitAddress = {
  name?: string;
  phone?: string;
  line1?: string;
  line2?: string;
  village?: string;
  district?: string;
  state?: string;
  pincode?: string;
};

type SoilValues = {
  ph?: number | null;
  moisture?: number | null;
  n?: number | null;
  p?: number | null;
  k?: number | null;
  ec?: number | null;
  organicCarbon?: number | null;
};

type SoilKitPayload = {
  order?: {
    address?: SoilKitAddress;
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
      amount?: number;
      currency?: string;
      label?: string;
    };
    trackingUrl?: string;
    trackingSteps?: string[];
  };
  status?: 'ordered' | 'packed' | 'shipped' | 'out-for-delivery' | 'delivered';
  trackingUrl?: string;
  trackingSteps?: string[];
  resetKitReport?: boolean;
  resetGovtReport?: boolean;
  kitReport?: {
    imageUrl?: string;
    values?: SoilValues;
  };
  govtReport?: {
    imageUrl?: string;
    values?: SoilValues;
  };
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

const buildTrackingId = () => `KM-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
const defaultTrackingSteps = ['ordered', 'packed', 'shipped', 'out-for-delivery', 'delivered'];

const getKitCatalog = async () => {
  const catalog = await SoilKitCatalog.findOne({ isActive: true }).sort({ updatedAt: -1 });
  return catalog ? catalog.toObject() : null;
};

const validateAddress = (address?: SoilKitAddress) => {
  const errors: string[] = [];
  if (!address?.name) errors.push('Name is required.');
  if (!address?.phone) errors.push('Phone is required.');
  if (!address?.line1) errors.push('Address line is required.');
  if (!address?.village) errors.push('Village is required.');
  if (!address?.district) errors.push('District is required.');
  if (!address?.state) errors.push('State is required.');
  if (!address?.pincode) errors.push('Pincode is required.');
  return errors;
};

export async function GET(req: Request) {
  try {
    await connectDB();
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const user = await User.findById(userId).select('soilKitOrder soilKitReport soilGovtReport');
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const catalog = await getKitCatalog();
    if (!catalog) {
      return NextResponse.json({ success: false, error: 'Kit catalog not configured' }, { status: 400 });
    }

    const profileStatus = computeSoilProfileStatus({
      profile: user.soilProfile,
      kitOrder: user.soilKitOrder,
      kitReport: user.soilKitReport,
      govtReport: user.soilGovtReport
    });

    return NextResponse.json({
      success: true,
      order: user.soilKitOrder || null,
      kitReport: user.soilKitReport || null,
      govtReport: user.soilGovtReport || null,
      catalog,
      profileStatus
    });
  } catch (error) {
    console.error('Soil Kit GET Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const body = (await req.json()) as SoilKitPayload;
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const addressErrors = validateAddress(body.order?.address);
    if (addressErrors.length > 0) {
      return NextResponse.json({ success: false, error: 'Invalid address', details: addressErrors }, { status: 400 });
    }

    const now = new Date();

    const catalog = await getKitCatalog();

    user.soilKitOrder = {
      status: 'ordered',
      trackingId: user.soilKitOrder?.trackingId || buildTrackingId(),
      trackingUrl: body.order?.trackingUrl || catalog?.trackingUrl || user.soilKitOrder?.trackingUrl,
      trackingSteps:
        body.order?.trackingSteps || catalog?.trackingSteps || user.soilKitOrder?.trackingSteps || defaultTrackingSteps,
      orderedAt: now,
      eta: body.order?.address?.state ? '3-5 days' : '4-7 days',
      item: {
        title: body.order?.item?.title || catalog?.item?.title,
        description: body.order?.item?.description || catalog?.item?.description
      },
      payment: {
        mode: body.order?.payment?.mode || catalog?.payment?.mode,
        status: body.order?.payment?.status || catalog?.payment?.status,
        label: body.order?.payment?.label || catalog?.payment?.label
      },
      price: {
        amount: body.order?.price?.amount ?? catalog?.price?.amount,
        currency: body.order?.price?.currency || catalog?.price?.currency,
        label: body.order?.price?.label || catalog?.price?.label
      },
      address: {
        name: body.order?.address?.name,
        phone: body.order?.address?.phone,
        line1: body.order?.address?.line1,
        line2: body.order?.address?.line2,
        village: body.order?.address?.village,
        district: body.order?.address?.district,
        state: body.order?.address?.state,
        pincode: body.order?.address?.pincode
      }
    };

    if (user.soilProfile) {
      const profileStatus = computeSoilProfileStatus({
        profile: user.soilProfile,
        kitOrder: user.soilKitOrder,
        kitReport: user.soilKitReport,
        govtReport: user.soilGovtReport
      });
      user.soilProfile.status = profileStatus.status;
      user.soilProfile.stage = profileStatus.stage;
      user.soilProfile.progress = profileStatus.progress;
      user.soilProfile.lastTestedAt = profileStatus.lastTestedAt;
    }

    await user.save();

    return NextResponse.json({
      success: true,
      order: user.soilKitOrder,
      catalog,
      profileStatus: user.soilProfile
        ? computeSoilProfileStatus({
            profile: user.soilProfile,
            kitOrder: user.soilKitOrder,
            kitReport: user.soilKitReport,
            govtReport: user.soilGovtReport
          })
        : null
    });
  } catch (error) {
    console.error('Soil Kit POST Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    await connectDB();
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const body = (await req.json()) as SoilKitPayload;
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    if (body.status && user.soilKitOrder) {
      user.soilKitOrder.status = body.status;
    }

    if (body.trackingUrl && user.soilKitOrder) {
      user.soilKitOrder.trackingUrl = body.trackingUrl;
    }

    if (body.trackingSteps && user.soilKitOrder) {
      user.soilKitOrder.trackingSteps = body.trackingSteps;
    }

    if (body.order && user.soilKitOrder) {
      user.soilKitOrder.item = {
        title: body.order.item?.title ?? user.soilKitOrder.item?.title,
        description: body.order.item?.description ?? user.soilKitOrder.item?.description
      };
      user.soilKitOrder.payment = {
        mode: body.order.payment?.mode ?? user.soilKitOrder.payment?.mode,
        status: body.order.payment?.status ?? user.soilKitOrder.payment?.status,
        label: body.order.payment?.label ?? user.soilKitOrder.payment?.label
      };
      user.soilKitOrder.price = {
        amount: body.order.price?.amount ?? user.soilKitOrder.price?.amount,
        currency: body.order.price?.currency ?? user.soilKitOrder.price?.currency,
        label: body.order.price?.label ?? user.soilKitOrder.price?.label
      };
      if (body.order.trackingUrl) {
        user.soilKitOrder.trackingUrl = body.order.trackingUrl;
      }
      if (body.order.trackingSteps) {
        user.soilKitOrder.trackingSteps = body.order.trackingSteps;
      }
    }

    if (body.resetKitReport) {
      user.soilKitReport = undefined;
      if (user.soilProfile) user.soilProfile.retestRequestedAt = new Date();
    }

    if (body.resetGovtReport) {
      user.soilGovtReport = undefined;
      if (user.soilProfile) user.soilProfile.retestRequestedAt = new Date();
    }

    if (body.kitReport) {
      user.soilKitReport = {
        imageUrl: body.kitReport.imageUrl || user.soilKitReport?.imageUrl,
        values: {
          ph: body.kitReport.values?.ph ?? user.soilKitReport?.values?.ph,
          moisture: body.kitReport.values?.moisture ?? user.soilKitReport?.values?.moisture,
          n: body.kitReport.values?.n ?? user.soilKitReport?.values?.n,
          p: body.kitReport.values?.p ?? user.soilKitReport?.values?.p,
          k: body.kitReport.values?.k ?? user.soilKitReport?.values?.k,
          ec: body.kitReport.values?.ec ?? user.soilKitReport?.values?.ec,
          organicCarbon: body.kitReport.values?.organicCarbon ?? user.soilKitReport?.values?.organicCarbon
        },
        updatedAt: new Date()
      };
      if (user.soilProfile) user.soilProfile.retestRequestedAt = undefined;
    }

    if (body.govtReport) {
      user.soilGovtReport = {
        imageUrl: body.govtReport.imageUrl || user.soilGovtReport?.imageUrl,
        values: {
          ph: body.govtReport.values?.ph ?? user.soilGovtReport?.values?.ph,
          moisture: body.govtReport.values?.moisture ?? user.soilGovtReport?.values?.moisture,
          n: body.govtReport.values?.n ?? user.soilGovtReport?.values?.n,
          p: body.govtReport.values?.p ?? user.soilGovtReport?.values?.p,
          k: body.govtReport.values?.k ?? user.soilGovtReport?.values?.k,
          ec: body.govtReport.values?.ec ?? user.soilGovtReport?.values?.ec,
          organicCarbon: body.govtReport.values?.organicCarbon ?? user.soilGovtReport?.values?.organicCarbon
        },
        updatedAt: new Date()
      };
      if (user.soilProfile) user.soilProfile.retestRequestedAt = undefined;
    }

    if (user.soilProfile) {
      const profileStatus = computeSoilProfileStatus({
        profile: user.soilProfile,
        kitOrder: user.soilKitOrder,
        kitReport: user.soilKitReport,
        govtReport: user.soilGovtReport
      });
      user.soilProfile.status = profileStatus.status;
      user.soilProfile.stage = profileStatus.stage;
      user.soilProfile.progress = profileStatus.progress;
      user.soilProfile.lastTestedAt = profileStatus.lastTestedAt;
    }

    await user.save();

    return NextResponse.json({
      success: true,
      order: user.soilKitOrder || null,
      kitReport: user.soilKitReport || null,
      govtReport: user.soilGovtReport || null,
      catalog: await getKitCatalog(),
      profileStatus: user.soilProfile
        ? computeSoilProfileStatus({
            profile: user.soilProfile,
            kitOrder: user.soilKitOrder,
            kitReport: user.soilKitReport,
            govtReport: user.soilGovtReport
          })
        : null
    });
  } catch (error) {
    console.error('Soil Kit PATCH Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
