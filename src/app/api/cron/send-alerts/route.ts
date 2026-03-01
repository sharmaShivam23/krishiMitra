import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Subscriber } from '@/models';
import twilio from 'twilio';

// Initialize Twilio
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

// Only initialize client if credentials exist (prevents crashes if missing)
const client = (accountSid && authToken) ? twilio(accountSid, authToken) : null;

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const phone = body.phone;

    // 1. Validate Input
    if (!phone || phone.length !== 10) {
      return NextResponse.json({ success: false, message: "Invalid 10-digit number." }, { status: 400 });
    }

    // 2. Check if already subscribed
    const existing = await Subscriber.findOne({ phone });
    if (existing) {
      return NextResponse.json({ success: false, message: "This number is already subscribed!" }, { status: 400 });
    }

    // 3. Save to Database
    await Subscriber.create({ 
      phone, 
      district: 'General', 
      state: 'General',
      isActive: true
    });

    // 4. Send Welcome SMS via Twilio (Optional, but good for hackathons)
    if (client && twilioPhone) {
      try {
        const formattedPhone = phone.startsWith('+91') ? phone : `+91${phone}`;
        const messageBody = `🌾 KrishiMitra: Welcome! You are now subscribed to daily Mandi price alerts for your region.`;

        await client.messages.create({
          body: messageBody,
          from: twilioPhone,
          to: formattedPhone
        });
        
        console.log(`Welcome SMS sent to ${formattedPhone}`);
      } catch (smsError: any) {
        console.error(`Twilio Error (DB save succeeded):`, smsError.message);
        // We don't fail the whole request if SMS fails, since they are saved in DB
      }
    } else {
      console.warn("Twilio credentials missing. Subscriber saved to DB, but no SMS sent.");
    }

    return NextResponse.json({ 
      success: true, 
      message: "Successfully subscribed to daily alerts!" 
    }, { status: 200 });

  } catch (error: any) {
    console.error("Subscription Error:", error);
    return NextResponse.json({ success: false, message: "Server error. Please try again." }, { status: 500 });
  }
}