import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models';

export async function POST(req: Request) {
  try {
    const { phone, password } = await req.json();

    // 1. Validate inputs
    if (!phone || !password) {
      return NextResponse.json({ success: false, message: 'Phone and password are required' }, { status: 400 });
    }

    await connectDB();

    // 2. Find user by phone number
    const user = await User.findOne({ phone });

    // 3. Check if user exists AND is an admin
    if (!user) {
      return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Access denied. Admin privileges required.' }, { status: 403 });
    }

    // 4. Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }

    // 5. Generate JWT Token
    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_key';
    const token = jwt.sign(
      { userId: user._id, role: user.role, name: user.name },
      jwtSecret,
      { expiresIn: '7d' } // Token valid for 7 days
    );

    // 6. Set HTTP-Only Cookie
    const cookieStore = await cookies();
    cookieStore.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, 
      path: '/',
    });

    
    return NextResponse.json({
      success: true,
      message: 'Admin login successful',
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role
      }
    });

  } catch (error: any) {
    console.error("Admin Login Error:", error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}