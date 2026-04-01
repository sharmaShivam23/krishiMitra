import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ActiveCrop } from '@/models';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers'; // 👈 IMPORT COOKIES

export async function PUT(req: Request) {
  try {
    // 1. Grab token from cookie
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized: No token provided' }, { status: 401 });
    }
    
    // 2. Verify it
    const decoded: any = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Session invalid or expired. Please log in again.' }, { status: 401 });
    }
    
    const { activeCropId, taskId, isCompleted } = await req.json();
    await connectDB();
    
    const crop = await ActiveCrop.findOneAndUpdate(
      { _id: activeCropId, userId: decoded.userId, "tasks._id": taskId },
      { $set: { "tasks.$.isCompleted": isCompleted, "tasks.$.completedAt": isCompleted ? new Date() : null } },
      { new: true }
    );

    if (!crop) return NextResponse.json({ success: false, error: 'Crop or task not found.' }, { status: 404 });

    return NextResponse.json({ success: true, crop });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}