import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/mongodb';
import { User, Subscriber } from '@/models';
import { rateLimitCheck, RateLimitPresets } from '@/lib/rateLimit';
import { secureHeaders } from '@/lib/security';

export async function OPTIONS(req: Request) {
  const origin = req.headers.get('origin');
  return new Response(null, { status: 204, headers: secureHeaders(origin) as HeadersInit });
}

export async function POST(req: Request) {
  const origin = req.headers.get('origin');
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';

  // ── Rate limit: max 5 calls per 5 min per IP ──
  const rl = rateLimitCheck(`request-call:${ip}`, RateLimitPresets.sensitive);
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many call requests. Please wait a few minutes.' },
      {
        status: 429,
        headers: {
          ...secureHeaders(origin),
          'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
        },
      }
    );
  }

  try {
    // ── 1. Auth — read HttpOnly cookie ──
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized — please log in first.' },
        { status: 401, headers: secureHeaders(origin) }
      );
    }

    // ── 2. Verify JWT ──
    const secret = process.env.JWT_SECRET || 'fallback-secret';
    let decoded: any;
    try {
      decoded = jwt.verify(token, secret);
    } catch {
      return NextResponse.json(
        { error: 'Invalid or expired session. Please log in again.' },
        { status: 401, headers: secureHeaders(origin) }
      );
    }

    const userId = decoded.userId || decoded.id || decoded._id;
    if (!userId) {
      return NextResponse.json(
        { error: 'Session corrupted — token missing userId.' },
        { status: 401, headers: secureHeaders(origin) }
      );
    }

    // ── 3. Fetch user from DB ──
    await connectDB();
    const user = await User.findById(userId).select('phone name');

    if (!user || !user.phone) {
      return NextResponse.json(
        { error: 'Phone number not found for your account.' },
        { status: 400, headers: secureHeaders(origin) }
      );
    }

    // ── 4. Check subscription (required for helpline) ──
    const subscriber = await Subscriber.findOne({ phone: user.phone, isActive: true });
    if (!subscriber) {
      return NextResponse.json(
        {
          error: 'You must be subscribed to the Kisan Helpline to use this feature.',
          notSubscribed: true,
        },
        { status: 403, headers: secureHeaders(origin) }
      );
    }

    // ── 5. Trigger n8n webhook ──
    const n8nWebhookUrl = process.env.N8N_CALLING;
    if (!n8nWebhookUrl) {
      return NextResponse.json(
        { error: 'Calling service not configured. Please contact support.' },
        { status: 503, headers: secureHeaders(origin) }
      );
    }

    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: user.phone,
        name: user.name,
        requestedAt: new Date().toISOString(),
      }),
    });

    if (!n8nResponse.ok) {
      const errText = await n8nResponse.text();
      console.error('n8n error:', errText);
      throw new Error('Calling service failed to initiate call.');
    }

    return NextResponse.json(
      {
        success: true,
        message: `Call initiated to +91 ${user.phone}. The Kisan helpline will call you shortly!`,
      },
      { status: 200, headers: secureHeaders(origin) }
    );
  } catch (error: any) {
    console.error('Request-Call Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500, headers: secureHeaders(origin) }
    );
  }
}