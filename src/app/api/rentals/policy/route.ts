import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { RentalPolicy } from '@/models';

const DEFAULT_POLICY = {
  protectionTiers: {
    none: { feePercent: 0, coveragePercent: 0, label: 'No Protection' },
    basic: { feePercent: 0, coveragePercent: 0, label: 'Basic' },
    standard: { feePercent: 5, coveragePercent: 50, label: 'Standard' },
    premium: { feePercent: 12, coveragePercent: 90, label: 'Premium' }
  },
  defaultDepositPercent: 25,
  maxRentalDays: 30,
  cancellationWindowHours: 24,
  termsAndConditions: [
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
  ]
};

// ==========================================
// GET RENTAL POLICY / PROTECTION TIERS
// ==========================================
export async function GET() {
  try {
    await connectDB();
    const policy = await RentalPolicy.findOne({ isActive: true }).lean();
    return NextResponse.json({ success: true, policy: policy || DEFAULT_POLICY });
  } catch (error) {
    return NextResponse.json({ success: true, policy: DEFAULT_POLICY });
  }
}
