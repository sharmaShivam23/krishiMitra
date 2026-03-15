import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { SellingPool, User } from '@/models';
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

// GET: Fetch all selling pools
export async function GET() {
  try {
    if (!(await authenticateAdmin())) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }
    
    // Fetch pools, sorted by newest first
    const pools = await SellingPool.find().sort({ createdAt: -1 }).lean();

    return NextResponse.json({ success: true, pools });
  } catch (error) {
    console.error("Pool Fetch Error:", error);
    return NextResponse.json({ success: false, message: "Server Error" }, { status: 500 });
  }
}

// DELETE: Remove a selling pool
export async function DELETE(req: Request) {
  try {
    if (!(await authenticateAdmin())) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, message: "Pool ID required" }, { status: 400 });

    await SellingPool.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "Pool deleted successfully" });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Server Error" }, { status: 500 });
  }
}