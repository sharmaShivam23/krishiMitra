import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Subscriber } from '@/models';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
const client = (accountSid && authToken) ? twilio(accountSid, authToken) : null;

const GOV_API_KEY = process.env.DATA_GOV_API_KEY;
const GOV_BASE_URL = process.env.BASE_URL;

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { phone, action = 'subscribe' } = body; 

    // Validate Input
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

    // Save to Database
    const newSubscriber = await Subscriber.create({ 
      phone, 
      district: 'General', 
      state: 'General',
      isActive: true
    });

    // Default Welcome Message
    let messageBody = `🌾 KrishiMitra: Welcome! You are now subscribed to daily Mandi price alerts.`;

    // Attempt to fetch live prices for the Welcome Message
    try {
      if (GOV_API_KEY && GOV_BASE_URL) {
        const params = new URLSearchParams({
          "api-key": GOV_API_KEY,
          format: "json",
          limit: "10",
        });

        const response = await fetch(`${GOV_BASE_URL}?${params.toString()}`, { cache: "no-store" });
        
        if (response.ok) {
          const data = await response.json();
          if (data.records && data.records.length > 0) {
            const today = new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
            
            messageBody = `🌾 KrishiMitra Welcome! Top 10 Prices (${today}):\n\n`;
            data.records.forEach((item: any, index: number) => {
              messageBody += `${index + 1}. ${item.commodity} (${item.market}): ₹${item.modal_price}/qtl\n`;
            });
            messageBody += `\nReply STOP to unsubscribe.`;
          }
        }
      }
    } catch (fetchError) {
      console.error("Gov API failed, falling back to default welcome message:", fetchError);
    }

    // Send the SMS via Twilio
    if (client && twilioPhone) {
      try {
        await client.messages.create({
          body: messageBody,
          from: twilioPhone,
          to: formattedPhone
        });
      } catch (smsError: any) {
        console.error(`Twilio Error:`, smsError.message);
        await Subscriber.findByIdAndDelete(newSubscriber._id); // Rollback
        
        return NextResponse.json({ 
          success: false, 
          message: `SMS failed: ${smsError.message}` 
        }, { status: 500 });
      }
    } else {
      await Subscriber.findByIdAndDelete(newSubscriber._id); // Rollback
      return NextResponse.json({ 
        success: false, 
        message: "Server config error: Twilio credentials missing." 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Successfully subscribed! Check your phone for today's prices." 
    }, { status: 200 });

  } catch (error: any) {
    console.error("Subscription Error:", error);
    return NextResponse.json({ success: false, message: "Server error. Please try again." }, { status: 500 });
  }
}