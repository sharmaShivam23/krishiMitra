import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Listing, User } from '@/models';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// Helper to authenticate admin
const authenticateAdmin = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value || cookieStore.get('token')?.value;
  if (!token) return null;
  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    await connectDB();
    const adminUser = await User.findById(decoded.id || decoded.userId);
    return adminUser?.role === 'admin' ? adminUser : null;
  } catch { return null; }
};

export async function GET() {
  try {
    if (!(await authenticateAdmin())) return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    
    const listings = await Listing.find()
      .populate('providerId', 'name phone')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, listings });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Server Error" }, { status: 500 });
  }
}

// PATCH: Toggle isActive status
export async function PATCH(req: Request) {
  try {
    if (!(await authenticateAdmin())) return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });

    const { id, isActive } = await req.json();
    if (!id) return NextResponse.json({ success: false, message: "Listing ID required" }, { status: 400 });

    const updated = await Listing.findByIdAndUpdate(id, { isActive }, { new: true });
    return NextResponse.json({ success: true, listing: updated });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Server Error" }, { status: 500 });
  }
}

// DELETE: Delete a listing
export async function DELETE(req: Request) {
  try {
    if (!(await authenticateAdmin())) return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, message: "Listing ID required" }, { status: 400 });

    await Listing.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "Listing deleted" });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Server Error" }, { status: 500 });
  }
}