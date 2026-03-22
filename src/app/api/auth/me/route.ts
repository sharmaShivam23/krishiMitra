import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
  try {
    await connectDB();
    
    let token = '';

    // 1. Try to get token from headers first
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } 
    // 2. Fallback to HttpOnly cookie if header is missing
    else {
      const cookieStore = await cookies();
      token = cookieStore.get('auth_token')?.value || '';
    }

    if (!token) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = verifyToken(token) as { userId: string };
    
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user }, { status: 200 });
    
  } catch (error: any) {
    console.error('Fetch Me Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}