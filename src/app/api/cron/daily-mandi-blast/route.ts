import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Subscriber } from '@/models';
import twilio from 'twilio';

// Twilio Config
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
const client = (accountSid && authToken) ? twilio(accountSid, authToken) : null;

// Government API Config
const GOV_API_KEY = process.env.DATA_GOV_API_KEY;
const GOV_BASE_URL = process.env.BASE_URL;

export async function GET(req: Request) {
  try {
    // 1. Verify Twilio is setup
    if (!client || !twilioPhone) {
      return NextResponse.json({ success: false, message: "Twilio not configured" }, { status: 500 });
    }

    // 2. Connect to Database & Get Subscribers
    await connectDB();
    const subscribers = await Subscriber.find({ isActive: true });

    if (subscribers.length === 0) {
      return NextResponse.json({ success: true, message: "No active subscribers to send to." });
    }

    // 3. Fetch Real-Time Mandi Prices from data.gov.in
    const params = new URLSearchParams({
      "api-key": GOV_API_KEY!,
      format: "json",
      limit: "10", // Strictly limit to 10 to keep the SMS size manageable
    });

    const response = await fetch(`${GOV_BASE_URL}?${params.toString()}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Government API failed to respond");
    }

    const data = await response.json();
    
    if (!data.records || data.records.length === 0) {
      return NextResponse.json({ success: false, message: "No price data available today." }, { status: 404 });
    }

    // 4. Format the 10 prices into a readable SMS
    const today = new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
    let messageBody = `🌾 KrishiMitra Top 10 Prices (${today}):\n\n`;

    data.records.forEach((item: any, index: number) => {
      // Example format: "1. Wheat (Meerut): ₹2250"
      // Using modal_price as it's the most common trading price
      messageBody += `${index + 1}. ${item.commodity} (${item.market}): ₹${item.modal_price}/qtl\n`;
    });

    messageBody += `\nReply STOP to unsubscribe.`;

    // 5. Send the SMS to all active subscribers
    let successCount = 0;
    let failCount = 0;

    await Promise.all(
      subscribers.map(async (sub) => {
        try {
          const formattedPhone = sub.phone.startsWith('+91') ? sub.phone : `+91${sub.phone}`;
          await client.messages.create({
            body: messageBody,
            from: twilioPhone,
            to: formattedPhone
          });
          successCount++;
        } catch (err) {
          console.error(`Failed to send to ${sub.phone}:`, err);
          failCount++;
        }
      })
    );

    return NextResponse.json({ 
      success: true, 
      message: `Mandi blast complete! Sent: ${successCount}, Failed: ${failCount}` 
    });

  } catch (error: any) {
    console.error("Cron Error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}