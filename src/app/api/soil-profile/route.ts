import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { computeSoilProfileStatus } from '@/lib/soilProfileStatus';
import { User } from '@/models';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

type SoilProfilePayload = {
  source?: 'report' | 'kit' | 'lab';
  landName?: string;
  areaAcres?: number | null;
  landRecord?: {
    surveyNumber?: string;
    khasraNumber?: string;
    khataNumber?: string;
    khewatNumber?: string;
    pattaNumber?: string;
    tehsil?: string;
  };
  ph?: number | null;
  moisture?: number | null;
  n?: number | null;
  p?: number | null;
  k?: number | null;
  ec?: number | null;
  organicCarbon?: number | null;
  soilType?: string;
  state?: string;
  district?: string;
  village?: string;
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

export async function GET(req: Request) {
  try {
    await connectDB();
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const user = await User.findById(userId).select(
      'soilProfile soilKitOrder soilKitReport soilGovtReport state district'
    );
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const profileStatus = computeSoilProfileStatus({
      profile: user.soilProfile,
      kitOrder: user.soilKitOrder,
      kitReport: user.soilKitReport,
      govtReport: user.soilGovtReport
    });

    const profile = user.soilProfile
      ? {
          ...user.soilProfile.toObject(),
          state: user.soilProfile.location?.state || user.state,
          district: user.soilProfile.location?.district || user.district
        }
      : null;

    return NextResponse.json({ success: true, profile, profileStatus });
  } catch (error) {
    console.error('Soil Profile GET Error:', error);
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

    const body = (await req.json()) as SoilProfilePayload;
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const state = body.state || user.state;
    const district = body.district || user.district;

    user.soilProfile = {
      source: body.source ?? user.soilProfile?.source,
      landName: body.landName ?? user.soilProfile?.landName,
      areaAcres: body.areaAcres ?? user.soilProfile?.areaAcres ?? null,
      landRecord: {
        surveyNumber: body.landRecord?.surveyNumber ?? user.soilProfile?.landRecord?.surveyNumber,
        khasraNumber: body.landRecord?.khasraNumber ?? user.soilProfile?.landRecord?.khasraNumber,
        khataNumber: body.landRecord?.khataNumber ?? user.soilProfile?.landRecord?.khataNumber,
        khewatNumber: body.landRecord?.khewatNumber ?? user.soilProfile?.landRecord?.khewatNumber,
        pattaNumber: body.landRecord?.pattaNumber ?? user.soilProfile?.landRecord?.pattaNumber,
        tehsil: body.landRecord?.tehsil ?? user.soilProfile?.landRecord?.tehsil
      },
      ph: body.ph ?? user.soilProfile?.ph ?? null,
      moisture: body.moisture ?? user.soilProfile?.moisture ?? null,
      n: body.n ?? user.soilProfile?.n ?? null,
      p: body.p ?? user.soilProfile?.p ?? null,
      k: body.k ?? user.soilProfile?.k ?? null,
      ec: body.ec ?? user.soilProfile?.ec ?? null,
      organicCarbon: body.organicCarbon ?? user.soilProfile?.organicCarbon ?? null,
      soilType: body.soilType ?? user.soilProfile?.soilType,
      updatedAt: new Date(),
      location: {
        state,
        district,
        village: body.village ?? user.soilProfile?.location?.village
      }
    };

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

    if (body.state) user.state = body.state;
    if (body.district) user.district = body.district;

    await user.save();

    return NextResponse.json({ success: true, profile: user.soilProfile, profileStatus });
  } catch (error) {
    console.error('Soil Profile PATCH Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
