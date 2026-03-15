import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Post, User } from '@/models';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// GET: Fetch all forum posts
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

    const posts = await Post.find()
      .populate('author', 'name phone state')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, posts });
  } catch (error: any) {
    console.error("Forum Fetch Error:", error);
    return NextResponse.json({ success: false, message: "Server Error" }, { status: 500 });
  }
}

// DELETE: Remove a specific post
export async function DELETE(req: Request) {
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

    const { searchParams } = new URL(req.url);
    const postId = searchParams.get('id');

    if (!postId) return NextResponse.json({ success: false, message: "Post ID required" }, { status: 400 });

    await Post.findByIdAndDelete(postId);
    return NextResponse.json({ success: true, message: "Post deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: "Server Error" }, { status: 500 });
  }
}