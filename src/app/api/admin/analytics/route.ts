import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Scan, User } from '@/models';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value || cookieStore.get('token')?.value;

    if (!token) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    await connectDB();
    
    const user = await User.findById(decoded.id || decoded.userId);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    // 1. Total Scans & Average Confidence
    const totalScans = await Scan.countDocuments();
    
    const confidenceAgg = await Scan.aggregate([
      { $group: { _id: null, avgConfidence: { $avg: "$confidence" } } }
    ]);
    const avgConfidence = confidenceAgg.length > 0 ? (confidenceAgg[0].avgConfidence * 100).toFixed(1) : 0;

    // 2. Disease Breakdown (Top 5)
    const topDiseases = await Scan.aggregate([
      { $group: { _id: "$disease", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const formattedDiseases = topDiseases.map(d => ({
      name: d._id || 'Unknown',
      count: d.count
    }));

    // 3. Recent Scans (Last 10)
    const recentScans = await Scan.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId', 'name phone state')
      .lean();

    return NextResponse.json({ 
      success: true, 
      data: {
        totalScans,
        avgConfidence,
        diseaseDistribution: formattedDiseases,
        recentScans
      }
    });

  } catch (error: any) {
    console.error("Analytics Error:", error);
    return NextResponse.json({ success: false, message: "Server Error" }, { status: 500 });
  }
}