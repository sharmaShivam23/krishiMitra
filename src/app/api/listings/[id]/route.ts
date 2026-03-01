import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
// 🛠️ FIX 1: Added 'User' to imports to prevent MissingSchemaError on .populate()
import { Listing, User } from '@/models'; 
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// ==========================================
// GET SINGLE LISTING
// ==========================================
export async function GET(
  req: Request, 
  { params }: { params: Promise<{ id: string }> } // 🛠️ FIX 2: params is now a Promise
) {
  try {
    // 🛠️ FIX 2: Await the params before using the ID
    const { id } = await params; 
    
    await connectDB();
    const listing = await Listing.findById(id).populate('providerId', 'name phone profileImage state district');
    
    if (!listing) return NextResponse.json({ success: false, message: 'Listing not found' }, { status: 404 });
    
    return NextResponse.json({ success: true, listing }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}

// ==========================================
// DELETE LISTING (Secure)
// ==========================================
export async function DELETE(
  req: Request, 
  { params }: { params: Promise<{ id: string }> } // 🛠️ FIX 2: params is now a Promise
) {
  try {
    // 🛠️ FIX 2: Await the params before using the ID
    const { id } = await params;

    await connectDB();
    
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const userId = decoded.userId;

    const listing = await Listing.findById(id);
    if (!listing) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

    // Security Check: Only the owner (or an admin) can delete
    if (listing.providerId.toString() !== userId && decoded.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    await Listing.findByIdAndDelete(id);
    
    return NextResponse.json({ success: true, message: 'Listing removed successfully' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}