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
// GET AGREEMENT DETAILS
// ==========================================
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const rental = await RentalOrder.findById(id)
      .populate('listingId', 'title equipment pricing')
      .populate('renterId', 'name phone')
      .populate('ownerId', 'name phone');

    if (!rental) return NextResponse.json({ success: false, message: 'Rental not found' }, { status: 404 });

    const isInvolved = rental.renterId._id.toString() === user.userId || rental.ownerId._id.toString() === user.userId || user.role === 'admin';
    if (!isInvolved) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });

    return NextResponse.json({
      success: true,
      agreement: {
        terms: rental.agreement.terms,
        acceptedByRenter: rental.agreement.acceptedByRenter,
        acceptedByOwner: rental.agreement.acceptedByOwner,
        renterAcceptedAt: rental.agreement.renterAcceptedAt,
        ownerAcceptedAt: rental.agreement.ownerAcceptedAt,
        rentalDetails: {
          equipment: rental.listingId?.title,
          renter: rental.renterId?.name,
          owner: rental.ownerId?.name,
          period: rental.rentalPeriod,
          pricing: rental.pricing,
          status: rental.status
        }
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}

// ==========================================
// ACCEPT AGREEMENT (POST)
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

    if (rental.status !== 'agreement_pending') {
      return NextResponse.json({ success: false, message: 'Agreement is not in pending state' }, { status: 400 });
    }

    const isRenter = rental.renterId.toString() === user.userId;
    const isOwner = rental.ownerId.toString() === user.userId;
    if (!isRenter && !isOwner) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const now = new Date();

    if (isRenter) {
      if (rental.agreement.acceptedByRenter) {
        return NextResponse.json({ success: false, message: 'You have already accepted' }, { status: 400 });
      }
      rental.agreement.acceptedByRenter = true;
      rental.agreement.renterAcceptedAt = now;
      rental.timeline.push({
        event: 'Agreement accepted by renter',
        actor: 'renter',
        actorId: user.userId,
        note: 'Renter digitally signed the rental agreement'
      });
    }

    if (isOwner) {
      if (rental.agreement.acceptedByOwner) {
        return NextResponse.json({ success: false, message: 'You have already accepted' }, { status: 400 });
      }
      rental.agreement.acceptedByOwner = true;
      rental.agreement.ownerAcceptedAt = now;
      rental.timeline.push({
        event: 'Agreement accepted by owner',
        actor: 'owner',
        actorId: user.userId,
        note: 'Owner digitally signed the rental agreement'
      });
    }

    // If both have accepted, advance to deposit_pending
    if (rental.agreement.acceptedByRenter && rental.agreement.acceptedByOwner) {
      rental.status = 'deposit_pending';
      rental.timeline.push({
        event: 'Agreement fully signed — awaiting deposit',
        actor: 'system',
        note: 'Both parties signed. Security deposit collection pending.'
      });
    }

    await rental.save();
    return NextResponse.json({ success: true, rental }, { status: 200 });
  } catch (error: any) {
    console.error('Agreement Error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server Error' }, { status: 500 });
  }
}
