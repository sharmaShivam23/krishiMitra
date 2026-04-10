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

// Valid status transitions
const TRANSITIONS: Record<string, { allowed: string[]; actor: string[] }> = {
  requested:         { allowed: ['approved', 'rejected', 'cancelled'], actor: ['owner', 'renter', 'admin'] },
  approved:          { allowed: ['agreement_pending', 'cancelled'], actor: ['system', 'owner', 'renter'] },
  agreement_pending: { allowed: ['deposit_pending', 'cancelled'], actor: ['system', 'renter', 'owner'] },
  deposit_pending:   { allowed: ['active', 'cancelled'], actor: ['owner', 'admin'] },
  active:            { allowed: ['return_pending'], actor: ['renter'] },
  return_pending:    { allowed: ['inspecting'], actor: ['owner'] },
  inspecting:        { allowed: ['completed', 'disputed'], actor: ['owner', 'admin'] },
  disputed:          { allowed: ['completed', 'resolved'], actor: ['admin'] },
};

// ==========================================
// GET SINGLE RENTAL ORDER
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
      .populate('listingId', 'title images equipment pricing category location description serviceDetails')
      .populate('renterId', 'name phone state district')
      .populate('ownerId', 'name phone state district');

    if (!rental) return NextResponse.json({ success: false, message: 'Rental not found' }, { status: 404 });

    // Only involved parties or admin can view
    const isInvolved = rental.renterId._id.toString() === user.userId || rental.ownerId._id.toString() === user.userId || user.role === 'admin';
    if (!isInvolved) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });

    return NextResponse.json({ success: true, rental }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}

// ==========================================
// UPDATE RENTAL STATUS (PATCH)
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
    const { newStatus, note, paymentMethod, depositStatus, rentalPaidStatus } = body;

    // Determine actor role
    let actorRole = 'renter';
    if (rental.ownerId.toString() === user.userId) actorRole = 'owner';
    if (user.role === 'admin') actorRole = 'admin';

    // Validate status transition
    if (newStatus) {
      const currentTransitions = TRANSITIONS[rental.status];
      if (!currentTransitions || !currentTransitions.allowed.includes(newStatus)) {
        return NextResponse.json({ 
          success: false, 
          message: `Invalid transition from "${rental.status}" to "${newStatus}"` 
        }, { status: 400 });
      }

      rental.status = newStatus;

      // Handle special transitions
      if (newStatus === 'approved') {
        rental.status = 'agreement_pending'; // Auto-advance to agreement stage
        rental.timeline.push({
          event: 'Request approved by owner',
          actor: actorRole,
          actorId: user.userId,
          note: note || 'Owner approved the rental request'
        });
        rental.timeline.push({
          event: 'Agreement pending signatures',
          actor: 'system',
          note: 'Both parties must accept the rental agreement'
        });
      } else if (newStatus === 'rejected') {
        rental.timeline.push({
          event: 'Request rejected by owner',
          actor: actorRole,
          actorId: user.userId,
          note: note || 'Owner rejected the rental request'
        });
      } else if (newStatus === 'active') {
        rental.timeline.push({
          event: 'Rental started — equipment handed over',
          actor: actorRole,
          actorId: user.userId,
          note: note || 'Equipment is now with the renter'
        });
      } else if (newStatus === 'return_pending') {
        rental.timeline.push({
          event: 'Renter initiated return',
          actor: 'renter',
          actorId: user.userId,
          note: note || 'Equipment return initiated'
        });
      } else if (newStatus === 'inspecting') {
        rental.timeline.push({
          event: 'Post-return inspection started',
          actor: actorRole,
          actorId: user.userId,
          note: note || 'Owner is inspecting returned equipment'
        });
      } else if (newStatus === 'completed') {
        rental.payment.depositStatus = rental.damageReport?.hasDamage ? 'partially_deducted' : 'refunded';
        rental.timeline.push({
          event: 'Rental completed successfully',
          actor: actorRole,
          actorId: user.userId,
          note: note || 'Rental completed and deposit settled'
        });
      } else if (newStatus === 'cancelled') {
        rental.cancellation = {
          cancelledBy: actorRole,
          reason: note || 'No reason provided',
          cancelledAt: new Date()
        };
        rental.timeline.push({
          event: `Rental cancelled by ${actorRole}`,
          actor: actorRole,
          actorId: user.userId,
          note: note || 'Rental was cancelled'
        });
      } else {
        rental.timeline.push({
          event: `Status changed to ${newStatus}`,
          actor: actorRole,
          actorId: user.userId,
          note: note || ''
        });
      }
    }

    // Update payment info if provided
    if (paymentMethod) rental.payment.method = paymentMethod;
    if (depositStatus) rental.payment.depositStatus = depositStatus;
    if (rentalPaidStatus) rental.payment.rentalPaidStatus = rentalPaidStatus;

    await rental.save();

    return NextResponse.json({ success: true, rental }, { status: 200 });
  } catch (error: any) {
    console.error('Update Rental Error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server Error' }, { status: 500 });
  }
}

// ==========================================
// CANCEL/DELETE RENTAL (DELETE)
// ==========================================
export async function DELETE(
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

    // Only renter can delete, and only if still in 'requested' status
    if (rental.renterId.toString() !== user.userId && user.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    if (rental.status !== 'requested') {
      return NextResponse.json({ success: false, message: 'Can only delete pending rental requests' }, { status: 400 });
    }

    await RentalOrder.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Rental request deleted' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}
