import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { RentalOrder, RentalPolicy, Listing, User } from '@/models';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

// Default terms if no policy document exists
const DEFAULT_TERMS = [
  'The renter must return the equipment in the same condition as received.',
  'Any damage beyond normal wear and tear will be charged to the renter.',
  'Security deposit will be refunded within 48 hours after successful return and inspection.',
  'Either party may cancel the rental before the start date without penalty.',
  'Late returns will incur additional charges at the daily rate.',
  'The renter is responsible for fuel/operating costs during the rental period.',
  'Equipment must not be sub-rented to any third party.',
  'In case of damage dispute, KrishiMitra admin will make the final decision.',
  'The owner must provide equipment in working condition as described in the listing.',
  'Both parties agree to the protection plan terms selected at booking time.'
];

const DEFAULT_DEPOSIT_PERCENT = 25;

const PROTECTION_TIERS: Record<string, { feePercent: number; coveragePercent: number }> = {
  none: { feePercent: 0, coveragePercent: 0 },
  basic: { feePercent: 0, coveragePercent: 0 },
  standard: { feePercent: 5, coveragePercent: 50 },
  premium: { feePercent: 12, coveragePercent: 90 }
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
// CREATE A NEW RENTAL REQUEST (POST)
// ==========================================
export async function POST(req: Request) {
  try {
    await connectDB();
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { listingId, startDate, endDate, protectionTier = 'none', renterMessage, paymentMethod = 'cash' } = body;

    if (!listingId || !startDate || !endDate) {
      return NextResponse.json({ success: false, message: 'Missing required fields: listingId, startDate, endDate' }, { status: 400 });
    }

    // Fetch the listing
    const listing = await Listing.findById(listingId);
    if (!listing || !listing.isActive) {
      return NextResponse.json({ success: false, message: 'Listing not found or inactive' }, { status: 404 });
    }

    // Cannot rent your own equipment
    if (listing.providerId.toString() === user.userId) {
      return NextResponse.json({ success: false, message: 'You cannot rent your own equipment' }, { status: 400 });
    }

    // Calculate rental period
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start) {
      return NextResponse.json({ success: false, message: 'End date must be after start date' }, { status: 400 });
    }

    const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    
    // Check max rental days
    let policy = await RentalPolicy.findOne({ isActive: true });
    const maxDays = policy?.maxRentalDays || 30;
    if (totalDays > maxDays) {
      return NextResponse.json({ success: false, message: `Maximum rental period is ${maxDays} days` }, { status: 400 });
    }

    // Calculate pricing
    const dailyRate = listing.pricing.rate;
    const totalAmount = dailyRate * totalDays;
    const depositPercent = policy?.defaultDepositPercent || DEFAULT_DEPOSIT_PERCENT;
    const securityDeposit = Math.round(totalAmount * (depositPercent / 100));
    
    const tier = PROTECTION_TIERS[protectionTier] || PROTECTION_TIERS.none;
    const protectionFee = Math.round(totalAmount * (tier.feePercent / 100));

    // Get terms
    const terms = policy?.termsAndConditions?.length ? policy.termsAndConditions : DEFAULT_TERMS;

    // Check for overlapping active rentals on this listing
    const overlapping = await RentalOrder.findOne({
      listingId,
      status: { $in: ['requested', 'approved', 'agreement_pending', 'deposit_pending', 'active'] },
      'rentalPeriod.startDate': { $lt: end },
      'rentalPeriod.endDate': { $gt: start }
    });
    if (overlapping) {
      return NextResponse.json({ success: false, message: 'This equipment is already booked for the selected dates' }, { status: 409 });
    }

    const rentalOrder = await RentalOrder.create({
      listingId,
      renterId: user.userId,
      ownerId: listing.providerId,
      status: 'requested',
      rentalPeriod: { startDate: start, endDate: end, totalDays },
      pricing: {
        dailyRate,
        rateUnit: listing.pricing.unit,
        totalAmount,
        securityDeposit,
        protectionFee,
        protectionTier
      },
      agreement: { terms },
      payment: { method: paymentMethod },
      renterMessage,
      timeline: [{
        event: 'Rental requested',
        actor: 'renter',
        actorId: user.userId,
        note: renterMessage || 'Booking request submitted'
      }]
    });

    return NextResponse.json({ success: true, rental: rentalOrder }, { status: 201 });
  } catch (error: any) {
    console.error('Create Rental Error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server Error' }, { status: 500 });
  }
}

// ==========================================
// FETCH RENTAL ORDERS FOR CURRENT USER (GET)
// ==========================================
export async function GET(req: Request) {
  try {
    await connectDB();
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role'); // 'renter' | 'owner' | 'all'
    const status = searchParams.get('status');

    const query: any = {};
    if (role === 'renter') {
      query.renterId = user.userId;
    } else if (role === 'owner') {
      query.ownerId = user.userId;
    } else {
      query.$or = [{ renterId: user.userId }, { ownerId: user.userId }];
    }

    if (status) query.status = status;

    const rentals = await RentalOrder.find(query)
      .sort({ createdAt: -1 })
      .populate('listingId', 'title images equipment pricing category')
      .populate('renterId', 'name phone')
      .populate('ownerId', 'name phone')
      .lean();

    return NextResponse.json({ success: true, count: rentals.length, rentals }, { status: 200 });
  } catch (error: any) {
    console.error('Fetch Rentals Error:', error);
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}
