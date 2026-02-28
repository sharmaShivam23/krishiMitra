import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models';
import { hashPassword, signToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { name, phone, password, state, preferredLanguage } = body;

    // 1. Validate input
    if (!name || !phone || !password) {
      return NextResponse.json({ error: 'Name, phone, and password are required' }, { status: 400 });
    }

    // 2. Check if user already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return NextResponse.json({ error: 'Phone number already registered' }, { status: 409 });
    }

    // 3. Hash password and create user
    const hashedPassword = await hashPassword(password);
    const newUser = await User.create({
      name,
      phone,
      password: hashedPassword,
      state: state || '',
      preferredLanguage: preferredLanguage || 'hi',
      role: 'farmer' // Default role
    });

    // 4. Generate JWT
    const token = signToken({ userId: newUser._id.toString(), role: newUser.role });

    // 5. Return success (excluding the password)
    const userResponse = {
      id: newUser._id,
      name: newUser.name,
      phone: newUser.phone,
      role: newUser.role,
    };

    return NextResponse.json({ message: 'User registered successfully', user: userResponse, token }, { status: 201 });

  } catch (error: any) {
    console.error('Registration Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}