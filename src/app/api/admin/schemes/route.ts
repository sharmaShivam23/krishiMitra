import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Scheme, User } from '@/models';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function POST(req: Request) {
  try {
    // 1. Authorize the Admin
    const cookieStore = await cookies();
    // Check for either a specific admin token, or your general auth token
    const token = cookieStore.get('admin_token')?.value || cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized access" }, { status: 401 });
    }

    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      
      await connectDB();
      
      // Verify in DB that this user actually has the 'admin' role
      const user = await User.findById(decoded.id || decoded.userId);
      if (!user || user.role !== 'admin') {
        return NextResponse.json({ success: false, message: "Forbidden: Admin access required" }, { status: 403 });
      }
    } catch (jwtError) {
      return NextResponse.json({ success: false, message: "Invalid or expired token" }, { status: 401 });
    }

    // 2. Parse and Validate Payload
    const body = await req.json();
    const { name, category, state, benefits, eligibility, deadline, link } = body;

    if (!name || !category || !state || !benefits) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    // 3. Save to Database
    const newScheme = await Scheme.create({
      name,
      category,
      state,
      benefits,
      eligibility: Array.isArray(eligibility) ? eligibility : [],
      deadline: deadline || 'Ongoing',
      link: link || ''
    });

    return NextResponse.json({ 
      success: true, 
      message: "Scheme successfully published!", 
      scheme: newScheme 
    }, { status: 201 });

  } catch (error: any) {
    console.error("Failed to upload scheme:", error);
    return NextResponse.json({ success: false, message: "Server Error: " + error.message }, { status: 500 });
  }
}