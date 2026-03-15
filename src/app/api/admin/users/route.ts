import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value || cookieStore.get('token')?.value;

    if (!token) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    await connectDB();
    
    const adminUser = await User.findById(decoded.id || decoded.userId);
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    // Fetch all users, sorted by newest first. Exclude passwords.
    const users = await User.find({}, { password: 0 }).sort({ createdAt: -1 }).lean();

    return NextResponse.json({ success: true, users });

  } catch (error: any) {
    console.error("Users Fetch Error:", error);
    return NextResponse.json({ success: false, message: "Server Error" }, { status: 500 });
  }
}