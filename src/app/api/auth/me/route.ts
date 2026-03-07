import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User } from '@/models';

const MONGODB_URI = process.env.MONGODB_URI || '';

export async function GET() {
  try {
    // 1. Get the token from cookies (matching your middleware logic)
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    // 2. Decode the token (Make sure JWT_SECRET matches what you used in login)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as { userId: string };

    // 3. Connect to DB and fetch user
    if (mongoose.connection.readyState < 1) {
      await mongoose.connect(MONGODB_URI);
    }

  
    // const user = await User.findById(decoded.userId).select('name');
    const user = await User.findById(decoded.userId).select('name phone');

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user }, { status: 200 });

  } catch (error) {
    console.error('Failed to fetch user:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}