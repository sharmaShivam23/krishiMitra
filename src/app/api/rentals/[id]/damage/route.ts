import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { RentalOrder } from '@/models';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

const PROTECTION_COVERAGE: Record<string, number> = {
  none: 0,
  basic: 0,
  standard: 50,
  premium: 90
};

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return null;
  const decoded: any = verifyToken(token);
  if (!decoded || !decoded.userId) return null;
  return decoded;
}

// ==========================================
// FILE A DAMAGE CLAIM (POST) — Owner files after inspection
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

    // Only owner can file damage claim
    if (rental.ownerId.toString() !== user.userId && user.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Only equipment owner can file damage claims' }, { status: 403 });
    }

    if (!['inspecting', 'return_pending'].includes(rental.status)) {
      return NextResponse.json({ success: false, message: 'Damage claims can only be filed during inspection' }, { status: 400 });
    }

    const body = await req.json();
    const { description, claimAmount, photos } = body;

    if (!description || !claimAmount || claimAmount <= 0) {
      return NextResponse.json({ success: false, message: 'Description and valid claim amount are required' }, { status: 400 });
    }

    // Calculate protection coverage
    const coveragePercent = PROTECTION_COVERAGE[rental.pricing.protectionTier] || 0;
    const coveredByProtection = Math.round(claimAmount * (coveragePercent / 100));
    const renterLiability = claimAmount - coveredByProtection;

    rental.damageReport = {
      hasDamage: true,
      description,
      claimAmount,
      photos: photos || [],
      coveredByProtection,
      renterLiability,
      status: 'filed',
      resolution: undefined,
      resolvedAt: undefined,
      resolvedBy: undefined
    };

    rental.status = 'disputed';
    rental.timeline.push({
      event: 'Damage claim filed by owner',
      actor: 'owner',
      actorId: user.userId,
      note: `Claim amount: ₹${claimAmount}. Coverage: ₹${coveredByProtection}. Renter owes: ₹${renterLiability}. Description: ${description}`
    });

    await rental.save();
    return NextResponse.json({ success: true, rental }, { status: 200 });
  } catch (error: any) {
    console.error('Damage Claim Error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server Error' }, { status: 500 });
  }
}

// ==========================================
// RESPOND TO DAMAGE CLAIM (PATCH) — Renter accepts/disputes
// ==========================================
export async function PATCH(
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
    const { action, resolution } = body; // action: 'accept' | 'dispute' | 'resolve'

    if (action === 'accept') {
      // Renter accepts the claim
      if (rental.renterId.toString() !== user.userId) {
        return NextResponse.json({ success: false, message: 'Only renter can accept claim' }, { status: 403 });
      }
      rental.damageReport.status = 'accepted';
      rental.payment.depositStatus = 'partially_deducted';
      rental.payment.damageDeducted = rental.damageReport.renterLiability;
      rental.status = 'completed';
      rental.timeline.push({
        event: 'Damage claim accepted by renter',
        actor: 'renter',
        actorId: user.userId,
        note: `Renter agreed to pay ₹${rental.damageReport.renterLiability} from deposit`
      });
    } else if (action === 'dispute') {
      // Renter disputes the claim
      if (rental.renterId.toString() !== user.userId) {
        return NextResponse.json({ success: false, message: 'Only renter can dispute claim' }, { status: 403 });
      }
      rental.damageReport.status = 'disputed';
      rental.timeline.push({
        event: 'Damage claim disputed by renter',
        actor: 'renter',
        actorId: user.userId,
        note: resolution || 'Renter has raised a dispute on the damage claim'
      });
    } else if (action === 'resolve') {
      // Admin resolves the dispute
      if (user.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Only admin can resolve disputes' }, { status: 403 });
      }
      const { finalAmount } = body;
      rental.damageReport.status = 'resolved';
      rental.damageReport.resolution = resolution || 'Resolved by admin';
      rental.damageReport.resolvedAt = new Date();
      rental.damageReport.resolvedBy = user.userId;
      if (typeof finalAmount === 'number') {
        rental.damageReport.renterLiability = finalAmount;
        rental.payment.damageDeducted = finalAmount;
      }
      rental.payment.depositStatus = finalAmount > 0 ? 'partially_deducted' : 'refunded';
      rental.status = 'completed';
      rental.timeline.push({
        event: 'Dispute resolved by admin',
        actor: 'admin',
        actorId: user.userId,
        note: `Admin ruling: ${resolution || 'No details'}. Final amount: ₹${finalAmount ?? rental.damageReport.renterLiability}`
      });
    } else {
      return NextResponse.json({ success: false, message: 'Invalid action. Use: accept, dispute, or resolve' }, { status: 400 });
    }

    await rental.save();
    return NextResponse.json({ success: true, rental }, { status: 200 });
  } catch (error: any) {
    console.error('Damage Response Error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server Error' }, { status: 500 });
  }
}
