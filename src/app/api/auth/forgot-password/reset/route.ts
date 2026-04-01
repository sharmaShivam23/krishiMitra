import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { User, Otp } from '@/models';
import { hashPassword } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    await connectDB();
    const { phone, otp, newPassword } = await req.json();

    if (!phone || !otp || !newPassword) {
      return NextResponse.json({ error: 'Phone, OTP, and new password are required' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    // 1. Verify OTP
    const validOtpRecord = await Otp.findOne({ phone });
    if (!validOtpRecord) {
      return NextResponse.json({ error: 'OTP expired or not requested. Please request a new one.' }, { status: 400 });
    }
    
    if (validOtpRecord.otp !== otp) {
      return NextResponse.json({ error: 'Invalid OTP provided.' }, { status: 401 });
    }

    // 2. Check if user exists
    const user = await User.findOne({ phone });
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // 3. Hash new password and update
    const hashedPassword = await hashPassword(newPassword);
    
    user.password = hashedPassword;
    await user.save();

    // 4. Clean up OTP to prevent reuse
    await Otp.deleteOne({ phone });

    return NextResponse.json({ message: 'Password reset successfully' }, { status: 200 });

  } catch (error: any) {
    console.error('Password Reset Error:', error);
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}
