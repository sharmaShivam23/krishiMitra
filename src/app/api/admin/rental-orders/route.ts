import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { RentalOrder, User } from '@/models';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const authenticateAdmin = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value || cookieStore.get('auth_token')?.value;
  if (!token) return null;
  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    await connectDB();
    const adminUser = await User.findById(decoded.id || decoded.userId);
    return adminUser?.role === 'admin' ? adminUser : null;
  } catch { return null; }
};

// ==========================================
// GET ALL RENTAL ORDERS (Admin)
// ==========================================
export async function GET(req: Request) {
  try {
    if (!(await authenticateAdmin())) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const query: any = {};
    if (status) query.status = status;

    const rentals = await RentalOrder.find(query)
      .sort({ createdAt: -1 })
      .populate('listingId', 'title equipment category images')
      .populate('renterId', 'name phone state district')
      .populate('ownerId', 'name phone state district')
      .lean();

    // Basic stats
    const total = rentals.length;
    const active = rentals.filter(r => r.status === 'active').length;
    const disputed = rentals.filter(r => r.status === 'disputed').length;
    const completed = rentals.filter(r => r.status === 'completed').length;

    return NextResponse.json({
      success: true,
      stats: { total, active, disputed, completed },
      rentals
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}

// ==========================================
// ADMIN: RESOLVE DISPUTE / OVERRIDE STATUS (PATCH)
// ==========================================
export async function PATCH(req: Request) {
  try {
    const admin = await authenticateAdmin();
    if (!admin) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });

    const { id, action, newStatus, resolution, finalAmount } = await req.json();
    if (!id) return NextResponse.json({ success: false, message: 'Rental ID required' }, { status: 400 });

    const rental = await RentalOrder.findById(id);
    if (!rental) return NextResponse.json({ success: false, message: 'Rental not found' }, { status: 404 });

    if (action === 'resolve_dispute') {
      rental.damageReport.status = 'resolved';
      rental.damageReport.resolution = resolution || 'Resolved by admin';
      rental.damageReport.resolvedAt = new Date();
      rental.damageReport.resolvedBy = admin._id;
      if (typeof finalAmount === 'number') {
        rental.damageReport.renterLiability = finalAmount;
        rental.payment.damageDeducted = finalAmount;
        rental.payment.depositStatus = finalAmount > 0 ? 'partially_deducted' : 'refunded';
      }
      rental.status = 'completed';
      rental.timeline.push({
        event: 'Dispute resolved by admin',
        actor: 'admin',
        actorId: admin._id,
        note: `Resolution: ${resolution}. Final liability: ₹${finalAmount ?? 'unchanged'}`
      });
    } else if (newStatus) {
      rental.status = newStatus;
      rental.timeline.push({
        event: `Status overridden by admin to "${newStatus}"`,
        actor: 'admin',
        actorId: admin._id,
        note: resolution || 'Admin override'
      });
    }

    await rental.save();
    return NextResponse.json({ success: true, rental });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}
