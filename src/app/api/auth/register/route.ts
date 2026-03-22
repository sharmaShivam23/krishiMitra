import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { User, Otp } from '@/models';
import { hashPassword, signToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { name, phone, password, state, district, preferredLanguage, otp, role } = body;

    // 1. Validate input
    if (!name || !phone || !password || !otp) {
      return NextResponse.json({ error: 'Name, phone, password, and OTP are required' }, { status: 400 });
    }

    // 2. VERIFY OTP
    const validOtpRecord = await Otp.findOne({ phone });
    if (!validOtpRecord) {
      return NextResponse.json({ error: 'OTP expired or not requested. Please request a new one.' }, { status: 400 });
    }
    if (validOtpRecord.otp !== otp) {
      return NextResponse.json({ error: 'Invalid OTP provided.' }, { status: 401 });
    }

    // 3. Double-check if user exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return NextResponse.json({ error: 'Phone number already registered' }, { status: 409 });
    }

    // 4. Hash password and create user
    const validRole = role === 'provider' ? 'provider' : 'farmer';
    const hashedPassword = await hashPassword(password);
    const newUser = await User.create({
      name,
      phone,
      password: hashedPassword,
      state: state || '',
      district: district || '',
      preferredLanguage: preferredLanguage || 'en',
      role: validRole // User-selected role
    });

    // 5. Clean up OTP
    await Otp.deleteOne({ phone });

    // 6. Generate JWT
    const token = signToken({ userId: newUser._id.toString(), role: newUser.role });

    // 7. 🔥 FIX: Set HttpOnly Cookie to match the Login API behavior
    const cookieStore = await cookies();
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    // 8. Return success
    const userResponse = {
      id: newUser._id,
      name: newUser.name,
      phone: newUser.phone,
      role: newUser.role,
    };

    return NextResponse.json({ 
      message: 'User verified and registered successfully', 
      user: userResponse, 
      token: token // Returned for localStorage
    }, { status: 201 });

  } catch (error: any) {
    console.error('Registration Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}