import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { RentalOrder } from '@/models';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return null;
  const decoded: any = verifyToken(token);
  if (!decoded || !decoded.userId) return null;
  return decoded;
}

// ==========================================
// SUBMIT INSPECTION (PRE or POST)
// ==========================================
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const rental = await RentalOrder.findById(id);
    if (!rental) return NextResponse.json({ success: false, message: 'Rental not found' }, { status: 404 });

    const body = await req.json();
    const { type, photos, condition, notes } = body;

    if (!type || !['pre', 'post'].includes(type)) {
      return NextResponse.json({ success: false, message: 'Inspection type must be "pre" or "post"' }, { status: 400 });
    }

    if (!photos || !Array.isArray(photos) || photos.length === 0) {
      return NextResponse.json({ success: false, message: 'At least one inspection photo is required' }, { status: 400 });
    }

    const isOwner = rental.ownerId.toString() === user.userId;
    const isRenter = rental.renterId.toString() === user.userId;
    if (!isOwner && !isRenter && user.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const inspectionData = {
      photos: photos.slice(0, 6), // Max 6 photos
      condition: condition || 'Good',
      notes: notes || '',
      inspectedAt: new Date(),
      inspectedBy: user.userId
    };

    if (type === 'pre') {
      // Pre-inspection: allowed when status is deposit_pending or active
      if (!['deposit_pending', 'active'].includes(rental.status)) {
        return NextResponse.json({ success: false, message: 'Pre-inspection can only be submitted before or at handover' }, { status: 400 });
      }
      rental.preInspection = inspectionData;
      rental.timeline.push({
        event: 'Pre-handover inspection completed',
        actor: isOwner ? 'owner' : 'renter',
        actorId: user.userId,
        note: `Equipment condition: ${condition}. ${notes || ''}`
      });
    } else {
      // Post-inspection: allowed when status is return_pending or inspecting
      if (!['return_pending', 'inspecting'].includes(rental.status)) {
        return NextResponse.json({ success: false, message: 'Post-inspection can only be submitted after return' }, { status: 400 });
      }
      rental.postInspection = inspectionData;
      rental.status = 'inspecting';
      rental.timeline.push({
        event: 'Post-return inspection completed',
        actor: isOwner ? 'owner' : 'renter',
        actorId: user.userId,
        note: `Return condition: ${condition}. ${notes || ''}`
      });
    }

    await rental.save();
    return NextResponse.json({ success: true, rental }, { status: 200 });
  } catch (error: any) {
    console.error('Inspection Error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server Error' }, { status: 500 });
  }
}
