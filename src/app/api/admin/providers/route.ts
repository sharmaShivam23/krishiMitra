export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models';

export async function GET(req: Request) {
  try {
    await connectDB();
    const providers = await User.find({ role: 'provider' }).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, providers }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch providers' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { id, isVerifiedProvider } = body;
    await User.findByIdAndUpdate(id, { isVerifiedProvider });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}
