import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Scheme } from '@/models';

export async function GET() {
  try {
    await connectDB();

    const schemes = await Scheme
      .find({})
      .sort({ createdAt: -1 })
      .lean(); // ⭐ VERY IMPORTANT

    return NextResponse.json({
      success: true,
      count: schemes.length,
      schemes
    });

  } catch (error) {
    console.error("Failed to fetch schemes:", error);

    return NextResponse.json(
      { success: false, message: "Server Error" },
      { status: 500 }
    );
  }
}