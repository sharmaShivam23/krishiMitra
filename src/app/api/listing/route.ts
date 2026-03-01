import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Listing } from '@/models';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// ==========================================
// CREATE A NEW LISTING (POST)
// ==========================================
export async function POST(req: Request) {
  try {
    await connectDB();
    
    // 1. Authenticate User (Assuming you use JWT stored in cookies)
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const providerId = decoded.userId;

    // 2. Parse incoming data
    const data = await req.json();

    // 3. Validation Rules
    if (!['rent', 'service'].includes(data.listingType)) {
      return NextResponse.json({ success: false, message: 'Invalid listing type' }, { status: 400 });
    }

    // Force operator inclusion if it's a service
    if (data.listingType === 'service') {
      data.serviceDetails = { ...data.serviceDetails, operatorIncluded: true };
    } else {
      data.serviceDetails = { operatorIncluded: false };
    }

    // 4. Create the Listing
    const newListing = await Listing.create({
      ...data,
      providerId
    });

    return NextResponse.json({ success: true, listing: newListing }, { status: 201 });

  } catch (error: any) {
    console.error("Create Listing Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// ==========================================
// FETCH ALL LISTINGS WITH FILTERS (GET)
// ==========================================
export async function GET(req: Request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(req.url);
    
    // Build dynamic query object
    const query: any = { isActive: true };

    // Apply Filters
    const type = searchParams.get('type'); // 'rent' or 'service'
    if (type) query.listingType = type;

    const state = searchParams.get('state');
    if (state) query['location.state'] = state;

    const district = searchParams.get('district');
    if (district) query['location.district'] = district;

    const category = searchParams.get('category');
    if (category) query.category = category;

    // Text Search (searches title, desc, and category)
    const search = searchParams.get('search');
    if (search) {
      query.$text = { $search: search };
    }

    // Fetch and Sort (newest first), populate provider details
    const listings = await Listing.find(query)
      .sort({ createdAt: -1 })
      .populate('providerId', 'name phone profileImage') // Bring in farmer's contact info safely
      .lean();

    return NextResponse.json({ success: true, count: listings.length, listings }, { status: 200 });

  } catch (error: any) {
    console.error("Fetch Listings Error:", error);
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}