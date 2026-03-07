// app/api/cron/send-alerts/route.ts (or wherever your route is)
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Subscriber } from '@/models';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

const client = (accountSid && authToken) ? twilio(accountSid, authToken) : null;

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    // Default to 'subscribe' if no action is provided
    const { phone, action = 'subscribe' } = body; 

    // 1. Validate Input
    if (!phone || phone.length !== 10) {
      return NextResponse.json({ success: false, message: "Invalid 10-digit number." }, { status: 400 });
    }

    const formattedPhone = phone.startsWith('+91') ? phone : `+91${phone}`;

    // --- UNSUBSCRIBE LOGIC ---
    if (action === 'unsubscribe') {
      const deletedSubscriber = await Subscriber.findOneAndDelete({ phone });
      
      if (!deletedSubscriber) {
        return NextResponse.json({ success: false, message: "This number is not subscribed." }, { status: 404 });
      }
      return NextResponse.json({ success: true, message: "Successfully unsubscribed from alerts." }, { status: 200 });
    }

    // --- SUBSCRIBE LOGIC ---
    const existing = await Subscriber.findOne({ phone });
    if (existing) {
      return NextResponse.json({ success: false, message: "This number is already subscribed!" }, { status: 400 });
    }

    // Save to Database first
    const newSubscriber = await Subscriber.create({ 
      phone, 
      district: 'General', 
      state: 'General',
      isActive: true
    });

    // Send Welcome SMS
    if (client && twilioPhone) {
      try {
        await client.messages.create({
          body: `🌾 KrishiMitra: Welcome! You are now subscribed to daily Mandi price alerts for your region.`,
          from: twilioPhone,
          to: formattedPhone
        });
      } catch (smsError: any) {
        console.error(`Twilio Error:`, smsError.message);
        // Rollback DB entry if SMS fails so they aren't stuck in a broken state
        await Subscriber.findByIdAndDelete(newSubscriber._id);
        
        return NextResponse.json({ 
          success: false, 
          message: `SMS failed: ${smsError.message}` // This exposes the exact Twilio error to your UI
        }, { status: 500 });
      }
    } else {
      return NextResponse.json({ 
        success: false, 
        message: "Server config error: Twilio credentials missing." 
      }, { status: 500 });
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