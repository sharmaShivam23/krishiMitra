import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { User, Otp, RateLimit } from '@/models';
import twilio from 'twilio';
import crypto from 'crypto';

// Initialize Twilio (Add these to your .env file)
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function POST(req: Request) {
  try {
    await connectDB();
    const { phone } = await req.json();

    if (!phone || phone.length !== 10) {
      return NextResponse.json({ error: 'Valid 10-digit phone number is required' }, { status: 400 });
    }

    // 1. Check if user already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return NextResponse.json({ error: 'Phone number already registered. Please login.' }, { status: 409 });
    }

    // 2. RATE LIMITER: Max 3 OTP requests per 15 minutes per phone
    const rateLimit = await RateLimit.findOne({ phone });
    if (rateLimit) {
      if (rateLimit.count >= 3) {
        return NextResponse.json({ 
          error: 'Too many OTP requests. Please try again after 15 minutes.' 
        }, { status: 429 });
      }
      rateLimit.count += 1;
      await rateLimit.save();
    } else {
      await RateLimit.create({ phone });
    }

    // 3. Generate a secure 6-digit OTP
    const generatedOtp = crypto.randomInt(100000, 999999).toString();

    // 4. Save OTP to database (Upsert ensures only 1 active OTP per phone)
    await Otp.findOneAndUpdate(
      { phone },
      { otp: generatedOtp, createdAt: Date.now() },
      { upsert: true, returnDocument: 'after' }
    );

    // 5. Send SMS via Twilio
    await twilioClient.messages.create({
      body: `Namaste! Your KrishiMitra verification code is ${generatedOtp}. Do not share this with anyone. Code expires in 5 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: `+91${phone}`
    });

    console.log(`\n🚜 --- KRISHIMITRA DEV MODE ---`);
    console.log(`📲 Phone: +91${phone}`);
    console.log(`🔑 OTP Code: ${generatedOtp}`);
    console.log(`-------------------------------\n`);

    return NextResponse.json({ message: 'OTP sent successfully' }, { status: 200 });

  } catch (error: any) {
    console.error('Send OTP Error:', error);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}