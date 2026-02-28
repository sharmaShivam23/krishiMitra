import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models';

export async function POST(req: Request) {
  try {
    const { name, phone, password, adminSecret } = await req.json();

    // Prevent anyone from creating an admin without a special secret key
    if (adminSecret !== 'KRISHI_MASTER_KEY_2026') {
      return NextResponse.json({ success: false, message: 'Unauthorized setup attempt' }, { status: 403 });
    }

    await connectDB();

    // Check if phone already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return NextResponse.json({ success: false, message: 'User with this phone already exists' }, { status: 400 });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create Admin User
    const newAdmin = await User.create({
      name,
      phone,
      password: hashedPassword,
      role: 'admin', // FORCING THE ADMIN ROLE
      state: 'System',
      preferredLanguage: 'en'
    });

    return NextResponse.json({ success: true, message: 'Admin account created successfully', adminId: newAdmin._id });

  } catch (error: any) {
    console.error("Admin Setup Error:", error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}