import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Subscriber, User } from '@/models'; 

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { phone, action = 'subscribe' } = body; 

    if (!phone || phone.length !== 10) {
      return NextResponse.json({ success: false, message: "Invalid 10-digit number." }, { status: 400 });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        notRegistered: true, 
        message: "User not found. Redirecting to login..." 
      }, { status: 401 });
    }

    if (action === 'unsubscribe') {
      const deletedSubscriber = await Subscriber.findOneAndDelete({ phone });
      
      if (!deletedSubscriber) {
        return NextResponse.json({ success: false, message: "This number is not subscribed." }, { status: 404 });
      }
      return NextResponse.json({ success: true, message: "Successfully unsubscribed from alerts." }, { status: 200 });
    }

    const existing = await Subscriber.findOne({ phone });
    if (existing) {
      return NextResponse.json({ success: false, message: "This number is already subscribed!" }, { status: 400 });
    }

    const newSubscriber = await Subscriber.create({ 
      phone, 
      district: user.district || 'General', 
      state: user.state || 'General',
      language: user.preferredLanguage || 'hi', 
      detail: `Subscribed via Profile`,
      isActive: true
    });

    const N8N_WEBHOOK_URL = process.env.N8N_SUBSCRIBER_WEBHOOK_URL;
    
    if (N8N_WEBHOOK_URL) {
      try {
       
        await fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: phone,
            district: user.district,
            language: user.preferredLanguage || 'hi'
          })
        });
      } catch (err) {
        console.error("n8n webhook trigger failed:", err);
      }
    } else {
      console.error("Missing N8N_SUBSCRIBER_WEBHOOK_URL in environment variables.");
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